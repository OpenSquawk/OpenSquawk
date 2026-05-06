import mongoose from 'mongoose'

export type FeedbackProduct = 'classroom' | 'liveatc'

export interface FeedbackSubmissionDocument extends mongoose.Document {
  product: FeedbackProduct
  name?: string
  email?: string
  discordHandle?: string
  excitement: number
  highlightSelections: string[]
  highlightNotes?: string
  frictionSelections: string[]
  frictionNotes?: string
  classroomNotes?: string
  hostingInterest?: string
  otherIdeas?: string
  contactConsent: boolean
  createdAt: Date
}

const feedbackSubmissionSchema = new mongoose.Schema<FeedbackSubmissionDocument>({
  product: { type: String, enum: ['classroom', 'liveatc'], default: 'classroom', index: true },
  name: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  discordHandle: { type: String, trim: true },
  excitement: { type: Number, required: true, min: 1, max: 5 },
  highlightSelections: { type: [String], default: () => [] },
  highlightNotes: { type: String, trim: true },
  frictionSelections: { type: [String], default: () => [] },
  frictionNotes: { type: String, trim: true },
  classroomNotes: { type: String, trim: true },
  hostingInterest: { type: String, trim: true },
  otherIdeas: { type: String, trim: true },
  contactConsent: { type: Boolean, default: false },
  createdAt: { type: Date, default: () => new Date(), index: true },
})

export const FeedbackSubmission =
  (mongoose.models.FeedbackSubmission as mongoose.Model<FeedbackSubmissionDocument> | undefined) ||
  mongoose.model<FeedbackSubmissionDocument>('FeedbackSubmission', feedbackSubmissionSchema)
