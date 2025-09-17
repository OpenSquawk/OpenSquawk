import { createError, readBody } from 'h3'
import { requireUserSession } from '../../../utils/auth'
import { SUBSCRIPTION_PLANS } from '../../../utils/billing'
import { Subscription } from '../../../models/Subscription'
import { debitUserBalance } from '../../../utils/billing'
import { PaymentTransaction } from '../../../models/PaymentTransaction'
import { addMonths } from '../../../utils/date'

interface SubscriptionBody {
  action?: 'start' | 'cancel'
  planId?: string
}

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const body = await readBody<SubscriptionBody>(event)
  const action = body.action || 'start'

  if (action === 'start') {
    const planId = body.planId || 'pilot-monthly'
    const plan = SUBSCRIPTION_PLANS[planId]
    if (!plan) {
      throw createError({ statusCode: 404, statusMessage: 'Tarif nicht gefunden.' })
    }

    const existing = await Subscription.findOne({
      user: user._id,
      status: { $in: ['active', 'past_due'] },
    })

    if (existing) {
      throw createError({ statusCode: 400, statusMessage: 'Du hast bereits ein aktives Abo.' })
    }

    const chargedUser = await debitUserBalance(user._id, plan.amountCents)
    if (!chargedUser) {
      throw createError({ statusCode: 402, statusMessage: 'Nicht genügend Guthaben für den Start des Abos.' })
    }

    const now = new Date()
    const nextChargeAt = addMonths(now, plan.intervalMonths)

    const subscription = await Subscription.create({
      user: user._id,
      planId,
      amountCents: plan.amountCents,
      status: 'active',
      nextChargeAt,
      lastChargeAt: now,
    })

    await PaymentTransaction.create({
      user: user._id,
      type: 'subscription_charge',
      method: 'balance',
      status: 'completed',
      amountCents: plan.amountCents,
      bonusCents: 0,
      description: plan.description,
      completedAt: now,
      metadata: { subscriptionId: String(subscription._id) },
    })

    return {
      success: true,
      subscription: {
        id: String(subscription._id),
        planId: subscription.planId,
        status: subscription.status,
        amountCents: subscription.amountCents,
        nextChargeAt: subscription.nextChargeAt,
        lastChargeAt: subscription.lastChargeAt,
      },
      balanceCents: chargedUser.balanceCents,
    }
  }

  if (action === 'cancel') {
    const subscription = await Subscription.findOne({
      user: user._id,
      status: { $in: ['active', 'past_due'] },
    })

    if (!subscription) {
      throw createError({ statusCode: 404, statusMessage: 'Kein aktives Abo gefunden.' })
    }

    subscription.status = 'canceled'
    subscription.canceledAt = new Date()
    await subscription.save()

    return { success: true }
  }

  throw createError({ statusCode: 400, statusMessage: 'Unbekannte Aktion.' })
})
