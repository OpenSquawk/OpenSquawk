import mongoose from 'mongoose'

export type BugReportStatus = 'open' | 'resolved'

export interface PmStateSnapshot {
  flowSlug?: string
  scenarioId?: string
  currentStateId?: string
  variables?: Record<string, any>
  flags?: Record<string, boolean>
  flightContext?: Record<string, any>
  communicationLog?: any[]
}

export interface BugReportDocument extends mongoose.Document {
  comment: string
  contact: string
  userId?: mongoose.Types.ObjectId
  screenshot?: string
  pmState?: PmStateSnapshot
  status: BugReportStatus
  createdAt: Date
}

const bugReportSchema = new mongoose.Schema<BugReportDocument>({
  comment: { type: String, required: true, trim: true, maxlength: 4000 },
  contact: { type: String, required: true, trim: true, maxlength: 200 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  screenshot: { type: String },
  pmState: {
    flowSlug: { type: String },
    scenarioId: { type: String },
    currentStateId: { type: String },
    variables: { type: mongoose.Schema.Types.Mixed, default: {} },
    flags: { type: mongoose.Schema.Types.Mixed, default: {} },
    flightContext: { type: mongoose.Schema.Types.Mixed, default: {} },
    communicationLog: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
  createdAt: { type: Date, default: () => new Date(), index: true },
})

export const BugReport =
  (mongoose.models.BugReport as mongoose.Model<BugReportDocument> | undefined) ||
  mongoose.model<BugReportDocument>('BugReport', bugReportSchema)
