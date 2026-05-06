import mongoose from 'mongoose'

export interface KpiReportDeliveryDocument extends mongoose.Document {
  weekKey: string
  periodStart: Date
  periodEnd: Date
  recipient: string
  sentAt: Date
  mailAccepted: boolean
}

const kpiReportDeliverySchema = new mongoose.Schema<KpiReportDeliveryDocument>({
  weekKey: { type: String, required: true, unique: true, trim: true, index: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  recipient: { type: String, required: true, trim: true },
  sentAt: { type: Date, default: () => new Date() },
  mailAccepted: { type: Boolean, default: false },
})

export const KpiReportDelivery =
  (mongoose.models.KpiReportDelivery as mongoose.Model<KpiReportDeliveryDocument> | undefined) ||
  mongoose.model<KpiReportDeliveryDocument>('KpiReportDelivery', kpiReportDeliverySchema)
