import mongoose from 'mongoose'

const { Schema } = mongoose

export interface WaitlistEntryDocument extends mongoose.Document {
  email: string
  name?: string
  notes?: string
  source?: string
  consentPrivacy: boolean
  consentTerms: boolean
  joinedAt: Date
  activatedAt?: Date
  wantsProductUpdates?: boolean
  updatesOptedInAt?: Date
  invitationCode?: mongoose.Types.ObjectId
  invitationSentAt?: Date
  feedbackRequestedAt?: Date
}

const waitlistSchema = new mongoose.Schema<WaitlistEntryDocument>({
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  name: { type: String, trim: true },
  notes: { type: String, trim: true },
  source: { type: String, default: 'landing' },
  consentPrivacy: { type: Boolean, default: false },
  consentTerms: { type: Boolean, default: false },
  joinedAt: { type: Date, default: () => new Date() },
  activatedAt: { type: Date },
  wantsProductUpdates: { type: Boolean, default: false },
  updatesOptedInAt: { type: Date },
  invitationCode: { type: Schema.Types.ObjectId, ref: 'InvitationCode' },
  invitationSentAt: { type: Date },
  feedbackRequestedAt: { type: Date },
})

export const WaitlistEntry =
  (mongoose.models.WaitlistEntry as mongoose.Model<WaitlistEntryDocument> | undefined) ||
  mongoose.model<WaitlistEntryDocument>('WaitlistEntry', waitlistSchema)

