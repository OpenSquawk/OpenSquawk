import mongoose from 'mongoose'

const { Schema } = mongoose

export interface InvitationCodeDocument extends mongoose.Document {
  code: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  expiresAt?: Date
  usedBy?: mongoose.Types.ObjectId
  usedAt?: Date
}

const invitationSchema = new mongoose.Schema<InvitationCodeDocument>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: () => new Date() },
  expiresAt: { type: Date },
  usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  usedAt: { type: Date },
})

export const InvitationCode =
  (mongoose.models.InvitationCode as mongoose.Model<InvitationCodeDocument> | undefined) ||
  mongoose.model<InvitationCodeDocument>('InvitationCode', invitationSchema)

