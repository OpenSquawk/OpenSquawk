import mongoose from 'mongoose'

const { Schema } = mongoose

export type UsageKind = 'stt' | 'tts' | 'llm'
export type UsageProvider = 'openai' | 'speaches' | 'piper' | 'cache'

export interface UsageEventDocument extends mongoose.Document {
  user?: mongoose.Types.ObjectId
  sessionId?: string
  kind: UsageKind
  provider: UsageProvider
  model: string
  endpoint: string
  /** Audio length for STT in seconds */
  audioSeconds?: number
  /** Synthesized text length for TTS */
  characters?: number
  inputTokens?: number
  outputTokens?: number
  /** Estimated cost in USD (0 for self-hosted providers and cache hits) */
  costUsd: number
  createdAt: Date
}

const usageEventSchema = new mongoose.Schema<UsageEventDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String },
  kind: { type: String, enum: ['stt', 'tts', 'llm'], required: true },
  provider: { type: String, enum: ['openai', 'speaches', 'piper', 'cache'], required: true },
  model: { type: String, required: true },
  endpoint: { type: String, required: true },
  audioSeconds: { type: Number },
  characters: { type: Number },
  inputTokens: { type: Number },
  outputTokens: { type: Number },
  costUsd: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: () => new Date(), index: true },
})

usageEventSchema.index({ user: 1, createdAt: -1 })

export const UsageEvent =
  (mongoose.models.UsageEvent as mongoose.Model<UsageEventDocument> | undefined) ||
  mongoose.model<UsageEventDocument>('UsageEvent', usageEventSchema)
