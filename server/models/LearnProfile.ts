import mongoose from 'mongoose'
import type { LearnConfig, LearnProgress } from '~~/shared/learn/config'

export interface LearnProfileDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId
  xp: number
  progress: LearnProgress
  config: LearnConfig
  createdAt: Date
  updatedAt: Date
}

const learnProfileSchema = new mongoose.Schema<LearnProfileDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    xp: { type: Number, default: 0 },
    progress: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    config: {
      tts: { type: Boolean, default: false },
      radioLevel: { type: Number, default: 4, min: 1, max: 5 },
      audioSpeed: { type: Number, default: 1, min: 0.5, max: 2 },
      voice: { type: String, default: '', trim: true },
      audioChallenge: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
)

learnProfileSchema.index({ user: 1 }, { unique: true })

export const LearnProfile =
  (mongoose.models.LearnProfile as mongoose.Model<LearnProfileDocument> | undefined) ||
  mongoose.model<LearnProfileDocument>('LearnProfile', learnProfileSchema)
