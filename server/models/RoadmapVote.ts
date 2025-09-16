import mongoose from 'mongoose'

export interface RoadmapVoteDocument extends mongoose.Document {
  itemKey: string
  importance: number
  submittedAt: Date
  clientHash?: string
}

const roadmapVoteSchema = new mongoose.Schema<RoadmapVoteDocument>({
  itemKey: { type: String, required: true, index: true },
  importance: { type: Number, required: true, min: 1, max: 5 },
  submittedAt: { type: Date, default: () => new Date(), index: true },
  clientHash: { type: String, index: true },
})

roadmapVoteSchema.index({ itemKey: 1, clientHash: 1, submittedAt: -1 })

export const RoadmapVote =
  (mongoose.models.RoadmapVote as mongoose.Model<RoadmapVoteDocument> | undefined) ||
  mongoose.model<RoadmapVoteDocument>('RoadmapVote', roadmapVoteSchema)
