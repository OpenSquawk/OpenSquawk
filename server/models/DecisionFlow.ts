import mongoose from 'mongoose'
import type {
  DecisionFlowLayout,
  DecisionFlowMetadata,
} from '~~/shared/types/decision'

export interface DecisionFlowDocument extends mongoose.Document {
  slug: string
  name: string
  description?: string
  schemaVersion?: string
  startState: string
  endStates: string[]
  variables: Record<string, any>
  flags: Record<string, any>
  policies: Record<string, any>
  hooks: Record<string, any>
  roles: string[]
  phases: string[]
  layout?: DecisionFlowLayout
  metadata?: DecisionFlowMetadata
  createdAt: Date
  updatedAt: Date
}

const decisionFlowSchema = new mongoose.Schema<DecisionFlowDocument>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    schemaVersion: { type: String },
    startState: { type: String, required: true },
    endStates: { type: [String], default: () => [] },
    variables: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    flags: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    policies: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    hooks: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    roles: { type: [String], default: () => [] },
    phases: { type: [String], default: () => [] },
    layout: {
      type: new mongoose.Schema<DecisionFlowLayout>(
        {
          zoom: { type: Number, default: 1 },
          pan: {
            type: new mongoose.Schema({ x: { type: Number, default: 0 }, y: { type: Number, default: 0 } }, { _id: false }),
            default: () => ({ x: 0, y: 0 }),
          },
          groups: {
            type: [
              new mongoose.Schema(
                {
                  id: { type: String, required: true },
                  label: { type: String, required: true },
                  color: { type: String },
                  bounds: {
                    type: new mongoose.Schema(
                      {
                        x: { type: Number, required: true },
                        y: { type: Number, required: true },
                        width: { type: Number, required: true },
                        height: { type: Number, required: true },
                      },
                      { _id: false }
                    ),
                    required: true,
                  },
                },
                { _id: false }
              ),
            ],
            default: () => [],
          },
        },
        { _id: false }
      ),
      default: () => ({ zoom: 1, pan: { x: 0, y: 0 }, groups: [] }),
    },
    metadata: {
      type: new mongoose.Schema<DecisionFlowMetadata>(
        {
          notes: { type: String },
          tags: { type: [String], default: () => [] },
          ownerId: { type: String },
          lastEditedBy: { type: String },
        },
        { _id: false }
      ),
      default: undefined,
    },
  },
  { timestamps: true }
)

decisionFlowSchema.index({ updatedAt: -1 })

decisionFlowSchema.set('toJSON', {
  virtuals: true,
  getters: true,
})

export const DecisionFlow =
  (mongoose.models.DecisionFlow as mongoose.Model<DecisionFlowDocument>) ||
  mongoose.model<DecisionFlowDocument>('DecisionFlow', decisionFlowSchema)
