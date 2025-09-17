import mongoose from 'mongoose'

export type PaymentTransactionType = 'topup' | 'subscription_charge'
export type PaymentMethod = 'mollie' | 'sepa_transfer' | 'balance'
export type PaymentStatus = 'pending' | 'completed' | 'failed'

export interface PaymentTransactionDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId
  type: PaymentTransactionType
  method: PaymentMethod
  status: PaymentStatus
  amountCents: number
  bonusCents: number
  description?: string
  molliePaymentId?: string
  mollieSubscriptionId?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

const paymentTransactionSchema = new mongoose.Schema<PaymentTransactionDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['topup', 'subscription_charge'], required: true },
    method: { type: String, enum: ['mollie', 'sepa_transfer', 'balance'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    amountCents: { type: Number, required: true },
    bonusCents: { type: Number, default: 0 },
    description: { type: String },
    molliePaymentId: { type: String },
    mollieSubscriptionId: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  },
)

paymentTransactionSchema.index({ user: 1, createdAt: -1 })
paymentTransactionSchema.index({ molliePaymentId: 1 }, { unique: false })

export const PaymentTransaction =
  (mongoose.models.PaymentTransaction as mongoose.Model<PaymentTransactionDocument> | undefined) ||
  mongoose.model<PaymentTransactionDocument>('PaymentTransaction', paymentTransactionSchema)
