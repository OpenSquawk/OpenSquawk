import mongoose from 'mongoose'

export interface RoadmapSuggestionDocument extends mongoose.Document {
  title: string
  details: string
  email?: string
  allowContact: boolean
  consentPrivacy: boolean
  submittedAt: Date
}

const roadmapSuggestionSchema = new mongoose.Schema<RoadmapSuggestionDocument>({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  details: { type: String, required: true, trim: true, maxlength: 4000 },
  email: { type: String, trim: true, lowercase: true },
  allowContact: { type: Boolean, default: false },
  consentPrivacy: { type: Boolean, default: false },
  submittedAt: { type: Date, default: () => new Date() },
})

roadmapSuggestionSchema.index({ submittedAt: -1 })

export const RoadmapSuggestion =
  (mongoose.models.RoadmapSuggestion as mongoose.Model<RoadmapSuggestionDocument> | undefined) ||
  mongoose.model<RoadmapSuggestionDocument>('RoadmapSuggestion', roadmapSuggestionSchema)
