import { requireUserSession } from '../../../utils/auth'
import { PaymentTransaction } from '../../../models/PaymentTransaction'
import { Subscription } from '../../../models/Subscription'
import { RecurringTopup } from '../../../models/RecurringTopup'
import { processUserSubscription, SUBSCRIPTION_PLANS, getSepaBonusCents } from '../../../utils/billing'
import { User } from '../../../models/User'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)

  const processed = await processUserSubscription(user._id)
  const freshUser = (processed?.updatedUser ? processed.updatedUser : await User.findById(user._id)) || user
  const activeSubscription = processed?.subscription
    ? await Subscription.findById(processed.subscription._id)
    : await Subscription.findOne({
        user: user._id,
        status: { $in: ['active', 'past_due'] },
      })

  const transactions = await PaymentTransaction.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()

  const recurringTopups = await RecurringTopup.find({
    user: user._id,
    status: { $in: ['active', 'paused'] },
  })
    .sort({ createdAt: -1 })
    .lean()

  const config = useRuntimeConfig()
  const sepaConfig = config.sepa as any
  const mollieEnabled = Boolean(config.mollie?.apiKey)

  return {
    balanceCents: freshUser.balanceCents,
    subscription: activeSubscription
      ? {
          id: String(activeSubscription._id),
          planId: activeSubscription.planId,
          status: activeSubscription.status,
          amountCents: activeSubscription.amountCents,
          nextChargeAt: activeSubscription.nextChargeAt,
          lastChargeAt: activeSubscription.lastChargeAt,
        }
      : null,
    transactions: transactions.map((tx) => ({
      id: String(tx._id),
      type: tx.type,
      method: tx.method,
      status: tx.status,
      amountCents: tx.amountCents,
      bonusCents: tx.bonusCents,
      description: tx.description,
      createdAt: tx.createdAt,
      completedAt: tx.completedAt,
      reference: tx.metadata?.reference,
    })),
    recurringTopups: recurringTopups.map((item) => ({
      id: String(item._id),
      amountCents: item.amountCents,
      interval: item.interval,
      status: item.status,
      nextPaymentAt: item.nextPaymentAt,
      description: item.description,
    })),
    availablePlans: Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => ({
      id,
      name: plan.name,
      amountCents: plan.amountCents,
      intervalMonths: plan.intervalMonths,
      description: plan.description,
    })),
    sepa: {
      bonusCents: getSepaBonusCents(),
      iban: sepaConfig?.iban || null,
      bic: sepaConfig?.bic || null,
      holder: sepaConfig?.holder || null,
      referencePrefix: sepaConfig?.referencePrefix || 'OSQ',
    },
    mollieEnabled,
  }
})
