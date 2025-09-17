import { createError, readBody } from 'h3'
import { getMolliePayment, createMollieSubscription } from '../../../utils/mollie'
import { PaymentTransaction } from '../../../models/PaymentTransaction'
import { User } from '../../../models/User'
import { RecurringTopup } from '../../../models/RecurringTopup'
import { creditUserBalance, centsToEuroString } from '../../../utils/billing'
import { addMonths } from '../../../utils/date'

interface MollieWebhookBody {
  id?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<MollieWebhookBody>(event)
  const paymentId = body.id

  if (!paymentId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing payment id' })
  }

  const payment = await getMolliePayment(paymentId)
  const metadata = (payment.metadata || {}) as Record<string, any>
  const status = payment.status

  const isPaid = ['paid', 'authorized', 'paidout'].includes(status)
  const isFailed = ['canceled', 'expired', 'failed'].includes(status)

  const transactionId = metadata.transactionId as string | undefined

  if (transactionId) {
    const transaction = await PaymentTransaction.findById(transactionId)
    if (!transaction) {
      return { success: true }
    }

    const user = await User.findById(transaction.user)
    if (!user) {
      return { success: true }
    }

    if (isPaid && transaction.status !== 'completed') {
      const amountCents = Math.round(parseFloat(payment.amount.value) * 100)
      if (!user.mollieCustomerId && payment.customerId) {
        user.mollieCustomerId = payment.customerId
      }
      await creditUserBalance(user._id, amountCents + (transaction.bonusCents || 0))
      transaction.status = 'completed'
      transaction.completedAt = new Date()
      transaction.molliePaymentId = payment.id
      if (!user.mollieMandateId && payment.mandateId) {
        user.mollieMandateId = payment.mandateId
      }
      if (metadata.recurring === '1') {
        const description = 'Automatische Guthaben-Aufladung'
        const interval = metadata.interval || '1 months'
        const startDate = addMonths(new Date(), 1).toISOString().slice(0, 10)
        if (!user.mollieCustomerId) {
          throw createError({ statusCode: 500, statusMessage: 'Mollie Kunde nicht gefunden' })
        }
        const subscription = await createMollieSubscription(user.mollieCustomerId, {
          amount: { currency: 'EUR', value: centsToEuroString(amountCents) },
          interval,
          description,
          metadata: {
            userId: String(user._id),
          },
          startDate,
        })
        await RecurringTopup.create({
          user: user._id,
          mollieCustomerId: user.mollieCustomerId as string,
          mollieSubscriptionId: subscription.id,
          amountCents,
          interval,
          description,
          nextPaymentAt: subscription.nextPaymentDate ? new Date(subscription.nextPaymentDate) : addMonths(new Date(), 1),
        })
        transaction.metadata = {
          ...(transaction.metadata || {}),
          recurringSubscriptionId: subscription.id,
        }
      }
      await transaction.save()
      await user.save()
    } else if (isFailed && transaction.status === 'pending') {
      transaction.status = 'failed'
      transaction.molliePaymentId = payment.id
      await transaction.save()
    }

    return { success: true }
  }

  if (metadata.userId && payment.sequenceType === 'recurring') {
    const user = await User.findById(metadata.userId)
    if (!user) {
      return { success: true }
    }

    const recurring = await RecurringTopup.findOne({ mollieSubscriptionId: payment.subscriptionId })
    if (!recurring) {
      return { success: true }
    }

    if (isPaid) {
      const amountCents = Math.round(parseFloat(payment.amount.value) * 100)
      await creditUserBalance(user._id, amountCents)
      await PaymentTransaction.create({
        user: user._id,
        type: 'topup',
        method: 'mollie',
        status: 'completed',
        amountCents,
        bonusCents: 0,
        description: recurring.description || 'Automatische Guthaben-Aufladung',
        completedAt: new Date(),
        molliePaymentId: payment.id,
        mollieSubscriptionId: recurring.mollieSubscriptionId,
        metadata: { recurringTopupId: String(recurring._id) },
      })
      recurring.nextPaymentAt = addMonths(new Date(), 1)
      recurring.status = 'active'
      await recurring.save()
    } else if (isFailed) {
      recurring.status = 'paused'
      await recurring.save()
    }

    return { success: true }
  }

  return { success: true }
})
