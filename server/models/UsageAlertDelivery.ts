import mongoose from 'mongoose'

export interface UsageAlertDeliveryDocument extends mongoose.Document {
  monthKey: string
  thresholdUsd: number
  costUsd: number
  recipient: string
  sentAt: Date
}

const usageAlertDeliverySchema = new mongoose.Schema<UsageAlertDeliveryDocument>({
  monthKey: { type: String, required: true, unique: true },
  thresholdUsd: { type: Number, required: true },
  costUsd: { type: Number, required: true },
  recipient: { type: String, required: true },
  sentAt: { type: Date, default: () => new Date() },
})

export const UsageAlertDelivery =
  (mongoose.models.UsageAlertDelivery as mongoose.Model<UsageAlertDeliveryDocument> | undefined) ||
  mongoose.model<UsageAlertDeliveryDocument>('UsageAlertDelivery', usageAlertDeliverySchema)
