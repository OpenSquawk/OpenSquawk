import mongoose from 'mongoose'

const { Schema } = mongoose

export interface AtcFlowDocument extends mongoose.Document {
  name: string
  schemaVersion?: string
  description?: string
  startState: string
  endStates: string[]
  variables: Record<string, any>
  flags: Record<string, any>
  policies: Record<string, any>
  hooks: Record<string, any>
  roles: string[]
  phases: string[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const flowSchema = new Schema<AtcFlowDocument>({
  name: { type: String, required: true, unique: true, trim: true },
  schemaVersion: { type: String, default: '1.0' },
  description: { type: String },
  startState: { type: String, required: true },
  endStates: { type: [String], default: [] },
  variables: { type: Schema.Types.Mixed, default: () => ({}) },
  flags: { type: Schema.Types.Mixed, default: () => ({}) },
  policies: { type: Schema.Types.Mixed, default: () => ({}) },
  hooks: { type: Schema.Types.Mixed, default: () => ({}) },
  roles: { type: [String], default: [] },
  phases: { type: [String], default: [] },
  metadata: { type: Schema.Types.Mixed, default: () => ({}) }
}, { timestamps: true })

flowSchema.index({ name: 1 }, { unique: true })

export const AtcFlow =
  (mongoose.models.AtcFlow as mongoose.Model<AtcFlowDocument> | undefined) ||
  mongoose.model<AtcFlowDocument>('AtcFlow', flowSchema)

