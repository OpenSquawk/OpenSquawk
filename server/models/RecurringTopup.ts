import mongoose from 'mongoose'

export type RecurringTopupStatus = 'active' | 'paused' | 'canceled'

export interface RecurringTopupDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId
  mollieCustomerId: string
  mollieSubscriptionId: string
  amountCents: number
  interval: string
  description?: string
  status: RecurringTopupStatus
  createdAt: Date
  updatedAt: Date
  nextPaymentAt?: Date
  canceledAt?: Date
}

const recurringTopupSchema = new mongoose.Schema<RecurringTopupDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mollieCustomerId: { type: String, required: true },
    mollieSubscriptionId: { type: String, required: true },
    amountCents: { type: Number, required: true },
    interval: { type: String, default: '1 months' },
    description: { type: String },
    status: { type: String, enum: ['active', 'paused', 'canceled'], default: 'active' },
    nextPaymentAt: { type: Date },
    canceledAt: { type: Date },
  },
  { timestamps: true },
)

recurringTopupSchema.index({ user: 1, status: 1 })
recurringTopupSchema.index({ mollieSubscriptionId: 1 }, { unique: true })

export const RecurringTopup =
  (mongoose.models.RecurringTopup as mongoose.Model<RecurringTopupDocument> | undefined) ||
  mongoose.model<RecurringTopupDocument>('RecurringTopup', recurringTopupSchema)
