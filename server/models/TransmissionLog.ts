import mongoose from 'mongoose'

const { Schema } = mongoose

export interface TransmissionLogDocument extends mongoose.Document {
  user?: mongoose.Types.ObjectId
  role: string
  channel: 'ptt' | 'say' | 'text'
  direction: 'incoming' | 'outgoing'
  text: string
  normalized?: string
  metadata?: Record<string, any>
  createdAt: Date
}

const transmissionSchema = new mongoose.Schema<TransmissionLogDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, required: true },
  channel: { type: String, enum: ['ptt', 'say', 'text'], required: true },
  direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
  text: { type: String, required: true },
  normalized: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: () => new Date() },
})

export const TransmissionLog =
  (mongoose.models.TransmissionLog as mongoose.Model<TransmissionLogDocument> | undefined) ||
  mongoose.model<TransmissionLogDocument>('TransmissionLog', transmissionSchema)

