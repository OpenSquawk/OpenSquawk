import mongoose from 'mongoose'

export type BugReportStatus = 'open' | 'resolved'

/** Where the report was filed. Shown in the notification mail so we know which
 *  part of the app to reproduce it in. */
export type BugReportSource = 'live-atc' | 'classroom'

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
  /** Stable UUID quoted in commit messages so a fix can be traced back here. */
  code: string
  source: BugReportSource
  comment: string
  contact: string
  userId?: mongoose.Types.ObjectId
  screenshot?: string
  pmState?: PmStateSnapshot
  status: BugReportStatus
  createdAt: Date
}

const bugReportSchema = new mongoose.Schema<BugReportDocument>({
  // Sparse: reports created before the code existed simply have none, and a
  // plain unique index would reject more than one of them.
  code: { type: String, required: true, unique: true, sparse: true },
  source: { type: String, enum: ['live-atc', 'classroom'], default: 'live-atc', index: true },
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
