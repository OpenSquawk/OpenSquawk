import mongoose from 'mongoose'

export interface PasswordResetTokenDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId
  tokenHash: string
  expiresAt: Date
  createdAt: Date
  usedAt?: Date
}

const passwordResetTokenSchema = new mongoose.Schema<PasswordResetTokenDocument>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  createdAt: { type: Date, default: () => new Date() },
  usedAt: { type: Date },
})

export const PasswordResetToken =
  (mongoose.models.PasswordResetToken as mongoose.Model<PasswordResetTokenDocument> | undefined) ||
  mongoose.model<PasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema)
