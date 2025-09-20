import mongoose from 'mongoose'
import type {
  DecisionNodeAutoTrigger,
  DecisionNodeLayout,
  DecisionNodeLLMPlaceholder,
  DecisionNodeLLMTemplate,
  DecisionNodeMetadata,
  DecisionNodeModel,
  DecisionNodeTransition,
} from '~~/shared/types/decision'

export interface DecisionNodeDocument
  extends mongoose.Document,
    Omit<DecisionNodeModel, 'stateId' | 'transitions'> {
  flow: mongoose.Types.ObjectId
  stateId: string
  transitions: DecisionNodeTransition[]
  createdAt: Date
  updatedAt: Date
}

const llmPlaceholderSchema = new mongoose.Schema<DecisionNodeLLMPlaceholder>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String },
    required: { type: Boolean, default: false },
    example: { type: String },
    defaultValue: { type: String },
    type: { type: String, default: 'text' },
  },
  { _id: false }
)

const llmTemplateSchema = new mongoose.Schema<DecisionNodeLLMTemplate>(
  {
    summary: { type: String },
    prompt: { type: String },
    responseSchema: { type: String },
    autoProceed: { type: Boolean, default: false },
    temperature: { type: Number },
    topP: { type: Number },
    maxOutputTokens: { type: Number },
    placeholders: { type: [llmPlaceholderSchema], default: () => [] },
    guardrails: { type: [String], default: () => [] },
    notes: { type: String },
  },
  { _id: false }
)

const metadataSchema = new mongoose.Schema<DecisionNodeMetadata>(
  {
    tags: { type: [String], default: () => [] },
    notes: { type: String },
    pinned: { type: Boolean, default: false },
    complexity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  { _id: false }
)

const layoutSchema = new mongoose.Schema<DecisionNodeLayout>(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    color: { type: String },
    icon: { type: String },
    locked: { type: Boolean, default: false },
  },
  { _id: false }
)

const autoTriggerSchema = new mongoose.Schema<DecisionNodeAutoTrigger>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['telemetry', 'variable', 'expression'], required: true },
    parameter: { type: String },
    variable: { type: String },
    operator: { type: String },
    value: { type: mongoose.Schema.Types.Mixed },
    unit: { type: String },
    expression: { type: String },
    description: { type: String },
    once: { type: Boolean, default: true },
    delayMs: { type: Number },
  },
  { _id: false }
)

const transitionSchema = new mongoose.Schema<DecisionNodeTransition>(
  {
    key: { type: String, required: true },
    type: {
      type: String,
      enum: ['next', 'ok', 'bad', 'timer', 'auto', 'interrupt', 'return'],
      default: 'next',
    },
    target: { type: String, required: true },
    label: { type: String },
    description: { type: String },
    condition: { type: String },
    guard: { type: String },
    order: { type: Number, default: 0 },
    timer: {
      type: new mongoose.Schema(
        {
          afterSeconds: { type: Number, required: true },
          allowManualProceed: { type: Boolean, default: true },
        },
        { _id: false }
      ),
      default: undefined,
    },
    autoTrigger: { type: autoTriggerSchema, default: undefined },
    metadata: {
      type: new mongoose.Schema(
        {
          color: { type: String },
          icon: { type: String },
          notes: { type: String },
          previewTemplate: { type: String },
        },
        { _id: false }
      ),
      default: undefined,
    },
  },
  { _id: false }
)

const decisionNodeSchema = new mongoose.Schema<DecisionNodeDocument>(
  {
    flow: { type: mongoose.Schema.Types.ObjectId, ref: 'DecisionFlow', required: true, index: true },
    stateId: { type: String, required: true },
    title: { type: String },
    summary: { type: String },
    role: { type: String, enum: ['pilot', 'atc', 'system'], required: true },
    phase: { type: String, required: true },
    sayTemplate: { type: String },
    utteranceTemplate: { type: String },
    elseSayTemplate: { type: String },
    readbackRequired: { type: [String], default: () => [] },
    autoBehavior: { type: String },
    actions: { type: [mongoose.Schema.Types.Mixed], default: () => [] },
    handoff: {
      type: new mongoose.Schema(
        {
          to: { type: String, required: true },
          freq: { type: String },
          note: { type: String },
        },
        { _id: false }
      ),
      default: undefined,
    },
    guard: { type: String },
    trigger: { type: String },
    frequency: { type: String },
    frequencyName: { type: String },
    transitions: { type: [transitionSchema], default: () => [] },
    layout: { type: layoutSchema, default: undefined },
    metadata: { type: metadataSchema, default: undefined },
    llmTemplate: { type: llmTemplateSchema, default: undefined },
  },
  { timestamps: true }
)

decisionNodeSchema.index({ flow: 1, stateId: 1 }, { unique: true })

decisionNodeSchema.set('toJSON', {
  virtuals: true,
  getters: true,
})

export const DecisionNode =
  (mongoose.models.DecisionNode as mongoose.Model<DecisionNodeDocument>) ||
  mongoose.model<DecisionNodeDocument>('DecisionNode', decisionNodeSchema)
