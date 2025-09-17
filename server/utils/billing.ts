import { Types } from 'mongoose'
import { addMonths } from './date'
import { User, type UserDocument } from '../models/User'
import {
  PaymentTransaction,
  type PaymentTransactionDocument,
  type PaymentStatus,
} from '../models/PaymentTransaction'
import { Subscription, type SubscriptionDocument } from '../models/Subscription'
import { useRuntimeConfig } from '#imports'

export const SUBSCRIPTION_PLANS: Record<
  string,
  { name: string; amountCents: number; intervalMonths: number; description: string }
> = {
  'pilot-monthly': {
    name: 'Pilot Monitoring Monatsabo',
    amountCents: 2499,
    intervalMonths: 1,
    description: 'Monatliche Servicegebühr für OpenSquawk',
  },
}

export function getSubscriptionPlan(planId: string) {
  return SUBSCRIPTION_PLANS[planId] || null
}

export function centsToEuroString(amountCents: number) {
  return (amountCents / 100).toFixed(2)
}

export function getSepaBonusCents() {
  const config = useRuntimeConfig()
  const bonus = Number((config.sepa as any)?.bonusCents || 25)
  return Number.isFinite(bonus) ? Math.max(0, Math.round(bonus)) : 25
}

export async function creditUserBalance(userId: Types.ObjectId | string, amountCents: number) {
  return await User.findByIdAndUpdate(
    userId,
    { $inc: { balanceCents: amountCents } },
    { new: true },
  )
}

export async function debitUserBalance(userId: Types.ObjectId | string, amountCents: number) {
  return await User.findOneAndUpdate(
    { _id: userId, balanceCents: { $gte: amountCents } },
    { $inc: { balanceCents: -amountCents } },
    { new: true },
  )
}

export async function markTransactionStatus(
  transaction: PaymentTransactionDocument,
  status: PaymentStatus,
  options: { completedAt?: Date; metadata?: Record<string, any> } = {},
) {
  transaction.status = status
  if (options.completedAt) {
    transaction.completedAt = options.completedAt
  }
  if (options.metadata) {
    transaction.metadata = { ...(transaction.metadata || {}), ...options.metadata }
  }
  await transaction.save()
  return transaction
}

interface ProcessResult {
  subscription: SubscriptionDocument
  updatedUser?: UserDocument | null
}

export async function processUserSubscription(userId: Types.ObjectId | string): Promise<ProcessResult | null> {
  let subscription = await Subscription.findOne({
    user: userId,
    status: { $in: ['active', 'past_due'] },
  })

  if (!subscription) {
    return null
  }

  const plan = getSubscriptionPlan(subscription.planId)
  if (!plan) {
    return { subscription }
  }

  let updatedUser: UserDocument | null = null
  const now = new Date()

  while (subscription.nextChargeAt <= now && subscription.status !== 'canceled') {
    const chargedUser = await debitUserBalance(userId, subscription.amountCents)
    if (!chargedUser) {
      if (subscription.status !== 'past_due') {
        subscription.status = 'past_due'
        await subscription.save()
      }
      return { subscription, updatedUser }
    }

    updatedUser = chargedUser
    const chargeTime = new Date()
    subscription.lastChargeAt = chargeTime
    subscription.nextChargeAt = addMonths(subscription.nextChargeAt, plan.intervalMonths)
    subscription.status = 'active'
    await subscription.save()

    await PaymentTransaction.create({
      user: new Types.ObjectId(userId),
      type: 'subscription_charge',
      method: 'balance',
      status: 'completed',
      amountCents: subscription.amountCents,
      bonusCents: 0,
      description: plan.description,
      completedAt: chargeTime,
      metadata: { subscriptionId: String(subscription._id) },
    })
  }

  if (subscription.status === 'past_due') {
    const chargedUser = await debitUserBalance(userId, subscription.amountCents)
    if (chargedUser) {
      updatedUser = chargedUser
      const chargeTime = new Date()
      subscription.lastChargeAt = chargeTime
      subscription.nextChargeAt = addMonths(chargeTime, plan.intervalMonths)
      subscription.status = 'active'
      await subscription.save()

      await PaymentTransaction.create({
        user: new Types.ObjectId(userId),
        type: 'subscription_charge',
        method: 'balance',
        status: 'completed',
        amountCents: subscription.amountCents,
        bonusCents: 0,
        description: plan.description,
        completedAt: chargeTime,
        metadata: { subscriptionId: String(subscription._id) },
      })
    }
  }

  return { subscription, updatedUser }
}

export function describePaymentMethod(method: string) {
  switch (method) {
    case 'mollie':
      return 'Mollie'
    case 'sepa_transfer':
      return 'SEPA-Überweisung'
    case 'balance':
      return 'Guthaben'
    default:
      return method
  }
}
