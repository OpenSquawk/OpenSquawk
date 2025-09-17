import mongoose from 'mongoose'

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled'

export interface SubscriptionDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId
  planId: string
  amountCents: number
  status: SubscriptionStatus
  createdAt: Date
  updatedAt: Date
  nextChargeAt: Date
  lastChargeAt?: Date
  canceledAt?: Date
}

const subscriptionSchema = new mongoose.Schema<SubscriptionDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: String, required: true },
    amountCents: { type: Number, required: true },
    status: { type: String, enum: ['active', 'past_due', 'canceled'], default: 'active' },
    nextChargeAt: { type: Date, required: true },
    lastChargeAt: { type: Date },
    canceledAt: { type: Date },
  },
  { timestamps: true },
)

subscriptionSchema.index({ user: 1, status: 1 })

export const Subscription =
  (mongoose.models.Subscription as mongoose.Model<SubscriptionDocument> | undefined) ||
  mongoose.model<SubscriptionDocument>('Subscription', subscriptionSchema)
