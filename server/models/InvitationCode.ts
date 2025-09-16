import mongoose from 'mongoose'

const { Schema } = mongoose

export interface InvitationCodeDocument extends mongoose.Document {
  code: string
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  expiresAt?: Date
  usedBy?: mongoose.Types.ObjectId
  usedAt?: Date
  channel: 'user' | 'bootstrap'
  label?: string
}

const invitationSchema = new mongoose.Schema<InvitationCodeDocument>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: () => new Date() },
  expiresAt: { type: Date },
  usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  usedAt: { type: Date },
  channel: { type: String, enum: ['user', 'bootstrap'], default: 'user' },
  label: { type: String, trim: true },
})

export const InvitationCode =
  (mongoose.models.InvitationCode as mongoose.Model<InvitationCodeDocument> | undefined) ||
  mongoose.model<InvitationCodeDocument>('InvitationCode', invitationSchema)

