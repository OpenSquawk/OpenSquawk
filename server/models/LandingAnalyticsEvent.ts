import mongoose from 'mongoose'

export type LandingAnalyticsEventType = 'view' | 'scrolled' | 'waitlist_submit'
export type AnalyticsProduct = 'classroom' | 'liveatc'

export interface LandingAnalyticsEventDocument extends mongoose.Document {
  type: LandingAnalyticsEventType
  product: AnalyticsProduct
  sessionId?: string
  path?: string
  source?: string
  scrollDepth?: number
  createdAt: Date
}

const landingAnalyticsEventSchema = new mongoose.Schema<LandingAnalyticsEventDocument>({
  type: { type: String, enum: ['view', 'scrolled', 'waitlist_submit'], required: true, index: true },
  product: { type: String, enum: ['classroom', 'liveatc'], default: 'classroom', index: true },
  sessionId: { type: String, trim: true, index: true },
  path: { type: String, trim: true },
  source: { type: String, trim: true },
  scrollDepth: { type: Number, min: 0, max: 100 },
  createdAt: { type: Date, default: () => new Date(), index: true },
})

export const LandingAnalyticsEvent =
  (mongoose.models.LandingAnalyticsEvent as mongoose.Model<LandingAnalyticsEventDocument> | undefined) ||
  mongoose.model<LandingAnalyticsEventDocument>('LandingAnalyticsEvent', landingAnalyticsEventSchema)
