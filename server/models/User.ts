import mongoose from 'mongoose'

export type UserRole = 'user' | 'admin' | 'dev'

export interface UserDocument extends mongoose.Document {
  email: string
  passwordHash: string
  name?: string
  role: UserRole
  createdAt: Date
  lastLoginAt?: Date
  tokenVersion: number
  invitationCodesIssued: number
  acceptedTermsAt: Date
  acceptedPrivacyAt: Date
  adminNotes?: string
}

const userSchema = new mongoose.Schema<UserDocument>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, trim: true },
  role: { type: String, enum: ['user', 'admin', 'dev'], default: 'user' },
  createdAt: { type: Date, default: () => new Date() },
  lastLoginAt: { type: Date },
  tokenVersion: { type: Number, default: 0 },
  invitationCodesIssued: { type: Number, default: 0 },
  acceptedTermsAt: { type: Date, required: true },
  acceptedPrivacyAt: { type: Date, required: true },
  adminNotes: { type: String, trim: true, default: '' },
})

export const User =
  (mongoose.models.User as mongoose.Model<UserDocument> | undefined) ||
  mongoose.model<UserDocument>('User', userSchema)

