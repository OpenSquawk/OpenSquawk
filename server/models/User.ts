import mongoose from 'mongoose'

export interface UserDocument extends mongoose.Document {
  email: string
  passwordHash: string
  name?: string
  role: 'user' | 'admin'
  createdAt: Date
  lastLoginAt?: Date
  tokenVersion: number
  invitationCodesIssued: number
  acceptedTermsAt: Date
  acceptedPrivacyAt: Date
}

const userSchema = new mongoose.Schema<UserDocument>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: () => new Date() },
  lastLoginAt: { type: Date },
  tokenVersion: { type: Number, default: 0 },
  invitationCodesIssued: { type: Number, default: 0 },
  acceptedTermsAt: { type: Date, required: true },
  acceptedPrivacyAt: { type: Date, required: true },
})

export const User =
  (mongoose.models.User as mongoose.Model<UserDocument> | undefined) ||
  mongoose.model<UserDocument>('User', userSchema)

