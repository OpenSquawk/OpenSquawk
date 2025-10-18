import mongoose from 'mongoose'
import type { LearnConfig, LearnProgress } from '~~/shared/learn/config'

export interface LearnProfileDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId
  xp: number
  progress: LearnProgress
  config: LearnConfig
  unlockedModules: string[]
  createdAt: Date
  updatedAt: Date
}

const learnProfileSchema = new mongoose.Schema<LearnProfileDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    xp: { type: Number, default: 0 },
    progress: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    unlockedModules: { type: [String], default: () => [] },
    config: {
      tts: { type: Boolean, default: false },
      radioLevel: { type: Number, default: 5, min: 1, max: 5 },
      voice: { type: String, default: '', trim: true },
      audioChallenge: { type: Boolean, default: false },
      audioSpeed: { type: Number, default: 1, min: 0.5, max: 2 },
    },
  },
  {
    timestamps: true,
  },
)

export const LearnProfile =
  (mongoose.models.LearnProfile as mongoose.Model<LearnProfileDocument> | undefined) ||
  mongoose.model<LearnProfileDocument>('LearnProfile', learnProfileSchema)
