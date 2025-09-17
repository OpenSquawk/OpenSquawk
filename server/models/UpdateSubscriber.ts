import mongoose from 'mongoose'

export interface UpdateSubscriberDocument extends mongoose.Document {
  email: string
  name?: string
  source: string
  consentPrivacy: boolean
  consentMarketing: boolean
  subscribedAt: Date
  lastUpdatedAt: Date
}

const updateSubscriberSchema = new mongoose.Schema<UpdateSubscriberDocument>({
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  name: { type: String, trim: true },
  source: { type: String, default: 'landing-updates' },
  consentPrivacy: { type: Boolean, default: false },
  consentMarketing: { type: Boolean, default: false },
  subscribedAt: { type: Date, default: () => new Date() },
  lastUpdatedAt: { type: Date, default: () => new Date() },
})

updateSubscriberSchema.pre('save', function updateTimestamp(this: UpdateSubscriberDocument, next) {
  if (this.isModified()) {
    this.set('lastUpdatedAt', new Date())
  }
  next()
})

export const UpdateSubscriber =
  (mongoose.models.UpdateSubscriber as mongoose.Model<UpdateSubscriberDocument> | undefined) ||
  mongoose.model<UpdateSubscriberDocument>('UpdateSubscriber', updateSubscriberSchema)
