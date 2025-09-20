import mongoose from 'mongoose'

const { Schema } = mongoose

const autopilotSchema = new Schema({
  mode: { type: String, enum: ['expression', 'threshold', 'delta'], default: 'expression' },
  expression: { type: String },
  variable: { type: String },
  operator: { type: String },
  value: { type: Schema.Types.Mixed },
  secondValue: { type: Schema.Types.Mixed },
  unit: { type: String },
  holdForMs: { type: Number },
  allowDuringLLM: { type: Boolean, default: true },
  allowDuringPilotSpeech: { type: Boolean, default: true },
  allowDuringControllerSpeech: { type: Boolean, default: true },
  sampleWindowMs: { type: Number },
  description: { type: String },
  controllerSayTpl: { type: String },
  updates: { type: Schema.Types.Mixed },
  flags: { type: Schema.Types.Mixed }
}, { _id: false })

const transitionSchema = new Schema({
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    required: true
  },
  kind: {
    type: String,
    enum: ['next', 'ok_next', 'bad_next', 'timer', 'auto', 'interrupt', 'stack', 'custom'],
    default: 'next'
  },
  to: { type: String, required: true },
  label: { type: String },
  description: { type: String },
  when: { type: String },
  guard: { type: String },
  priority: { type: Number, default: 0 },
  timer: {
    after_s: { type: Number }
  },
  auto: { type: autopilotSchema },
  metadata: { type: Schema.Types.Mixed }
}, { _id: false })

const templatePlaceholderSchema = new Schema({
  key: { type: String, required: true },
  label: { type: String },
  description: { type: String },
  example: { type: String },
  required: { type: Boolean, default: false },
  defaultValue: { type: Schema.Types.Mixed },
  autoFill: {
    source: { type: String, enum: ['variable', 'flag', 'literal', 'expression'], default: 'variable' },
    path: { type: String },
    literal: { type: String },
    expression: { type: String }
  }
}, { _id: false })

const templateSchema = new Schema({
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    required: true
  },
  name: { type: String, required: true },
  description: { type: String },
  systemPrompt: { type: String },
  userPrompt: { type: String },
  responseFormat: { type: Schema.Types.Mixed },
  sampleResponse: { type: String },
  hints: { type: String },
  placeholders: { type: [templatePlaceholderSchema], default: [] },
  metadata: { type: Schema.Types.Mixed },
  autoApplyWhen: { type: String }
}, { _id: false })

const stateUISchema = new Schema({
  x: { type: Number },
  y: { type: Number },
  lane: { type: String },
  color: { type: String },
  icon: { type: String },
  width: { type: Number },
  collapsedPanels: { type: [String], default: [] }
}, { _id: false })

export interface AtcStateDocument extends mongoose.Document {
  flow: mongoose.Types.ObjectId
  stateId: string
  title?: string
  role: 'pilot' | 'atc' | 'system'
  phase: string
  sayTpl?: string
  utteranceTpl?: string
  elseSayTpl?: string
  readbackRequired?: string[]
  auto?: string
  actions?: Array<Record<string, any> | string>
  condition?: string
  guard?: string
  trigger?: string
  frequency?: string
  frequencyName?: string
  handoff?: { to: string; freq?: string }
  transitions: Array<{
    id: string
    kind: string
    to: string
    label?: string
    description?: string
    when?: string
    guard?: string
    priority?: number
    timer?: { after_s?: number }
    auto?: Record<string, any>
    metadata?: Record<string, any>
  }>
  llmTemplates: Array<{
    id: string
    name: string
    description?: string
    systemPrompt?: string
    userPrompt?: string
    responseFormat?: Record<string, any>
    sampleResponse?: string
    hints?: string
    placeholders?: Array<Record<string, any>>
    metadata?: Record<string, any>
    autoApplyWhen?: string
  }>
  metadata?: Record<string, any>
  notes?: string
  ui?: {
    x?: number
    y?: number
    lane?: string
    color?: string
    icon?: string
    width?: number
    collapsedPanels?: string[]
  }
  createdAt: Date
  updatedAt: Date
}

const stateSchema = new Schema<AtcStateDocument>({
  flow: { type: Schema.Types.ObjectId, ref: 'AtcFlow', required: true, index: true },
  stateId: { type: String, required: true },
  title: { type: String },
  role: { type: String, enum: ['pilot', 'atc', 'system'], required: true },
  phase: { type: String, required: true },
  sayTpl: { type: String },
  utteranceTpl: { type: String },
  elseSayTpl: { type: String },
  readbackRequired: { type: [String], default: [] },
  auto: { type: String },
  actions: { type: [Schema.Types.Mixed], default: [] },
  condition: { type: String },
  guard: { type: String },
  trigger: { type: String },
  frequency: { type: String },
  frequencyName: { type: String },
  handoff: {
    to: { type: String },
    freq: { type: String }
  },
  transitions: { type: [transitionSchema], default: [] },
  llmTemplates: { type: [templateSchema], default: [] },
  metadata: { type: Schema.Types.Mixed },
  notes: { type: String },
  ui: { type: stateUISchema }
}, { timestamps: true })

stateSchema.index({ flow: 1, stateId: 1 }, { unique: true })

export const AtcState =
  (mongoose.models.AtcState as mongoose.Model<AtcStateDocument> | undefined) ||
  mongoose.model<AtcStateDocument>('AtcState', stateSchema)

