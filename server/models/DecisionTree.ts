import mongoose from 'mongoose'
import type {
  DecisionNodeAutoTransition,
  DecisionNodeLLMPlaceholder,
  DecisionNodeLLMTemplate,
  DecisionNodeUIConfig,
  DecisionTelemetryField,
  DecisionTreeNode,
} from '../../shared/types/decisionTree'

const { Schema } = mongoose

const llmPlaceholderSchema = new Schema<DecisionNodeLLMPlaceholder>(
  {
    key: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    example: { type: String, trim: true },
  },
  { _id: false },
)

const llmTemplateSchema = new Schema<DecisionNodeLLMTemplate>(
  {
    decisionPrompt: { type: String },
    readbackPrompt: { type: String },
    fallbackPrompt: { type: String },
    controllerSayTemplate: { type: String },
    expectationTemplate: { type: String },
    guidelines: { type: String },
    placeholders: { type: [llmPlaceholderSchema], default: [] },
    notes: { type: String },
  },
  { _id: false },
)

const autoTransitionSchema = new Schema<DecisionNodeAutoTransition>(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true },
    next: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: Number, default: 0 },
    requireConfirmation: { type: Boolean, default: false },
    allowRepeat: { type: Boolean, default: false },
    autopilot: { type: Boolean, default: true },
    watch: { type: [String], default: [] },
  },
  { _id: false },
)

const nodeUISchema = new Schema<DecisionNodeUIConfig>(
  {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number },
    height: { type: Number },
    lane: { type: String, trim: true },
    color: { type: String, trim: true },
    icon: { type: String, trim: true },
    collapsed: { type: Boolean, default: false },
  },
  { _id: false },
)

const telemetryFieldSchema = new Schema<DecisionTelemetryField>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    unit: { type: String, trim: true },
    type: { type: String, enum: ['number', 'string', 'boolean'], default: 'number' },
    description: { type: String, trim: true },
    default: { type: Schema.Types.Mixed },
    min: { type: Number },
    max: { type: Number },
    hint: { type: String, trim: true },
  },
  { _id: false },
)

export interface DecisionTreeNodeDocument extends mongoose.Document, Omit<DecisionTreeNode, 'data'> {
  data: Record<string, any>
}

const decisionNodeSchema = new Schema<DecisionTreeNodeDocument>(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    tags: { type: [String], default: [] },
    data: { type: Schema.Types.Mixed, default: () => ({}) },
    llmTemplates: { type: llmTemplateSchema, default: undefined },
    autoTransitions: { type: [autoTransitionSchema], default: [] },
    ui: { type: nodeUISchema, default: undefined },
    notes: { type: String, trim: true },
    helperLinks: { type: [{ label: String, url: String }], default: [] },
    checklists: { type: [String], default: [] },
  },
  { _id: false },
)

export interface DecisionTreeDocument extends mongoose.Document, Omit<DecisionTreeCore, 'variables' | 'flags' | 'policies' | 'hooks'> {
  slug: string
  title: string
  description?: string
  schemaVersion: string
  startState: string
  endStates: string[]
  variables: Record<string, any>
  flags: Record<string, any>
  policies: Record<string, any>
  hooks: Record<string, any>
  roles: string[]
  phases: string[]
  telemetrySchema: DecisionTelemetryField[]
  states: DecisionTreeNodeDocument[]
  metadata?: {
    lastImportedFrom?: string
    lastImportedAt?: Date
    lastEditor?: {
      id?: string
      email: string
      name?: string
    }
  }
  createdAt: Date
  updatedAt: Date
}

const decisionTreeSchema = new Schema<DecisionTreeDocument>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    schemaVersion: { type: String, default: '1.0' },
    startState: { type: String, required: true, trim: true },
    endStates: { type: [String], default: [] },
    variables: { type: Schema.Types.Mixed, default: () => ({}) },
    flags: { type: Schema.Types.Mixed, default: () => ({}) },
    policies: { type: Schema.Types.Mixed, default: () => ({}) },
    hooks: { type: Schema.Types.Mixed, default: () => ({}) },
    roles: { type: [String], default: () => ['pilot', 'atc', 'system'] },
    phases: { type: [String], default: () => [] },
    telemetrySchema: { type: [telemetryFieldSchema], default: [] },
    states: { type: [decisionNodeSchema], default: [] },
    metadata: {
      lastImportedFrom: { type: String, trim: true },
      lastImportedAt: { type: Date },
      lastEditor: {
        id: { type: String, trim: true },
        email: { type: String, trim: true },
        name: { type: String, trim: true },
      },
    },
  },
  { timestamps: true },
)

decisionNodeSchema.index({ id: 1 }, { unique: false })
decisionTreeSchema.index({ slug: 1 }, { unique: true })

decisionTreeSchema.pre('save', function (next) {
  const nodeIds = new Set<string>()
  for (const node of this.states) {
    if (!node.id) continue
    if (nodeIds.has(node.id)) {
      return next(new Error(`Duplicate node id detected: ${node.id}`))
    }
    nodeIds.add(node.id)
  }
  return next()
})

export const DecisionTree =
  (mongoose.models.DecisionTree as mongoose.Model<DecisionTreeDocument> | undefined) ||
  mongoose.model<DecisionTreeDocument>('DecisionTree', decisionTreeSchema)
