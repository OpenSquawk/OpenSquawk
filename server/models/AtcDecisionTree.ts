import mongoose, { Schema } from 'mongoose'
import type {
  DecisionTreeRecord,
  DecisionTreeState,
  AutoTransition,
  DecisionTransition,
  DecisionTimerTransition,
} from '~~/types/decision-tree'

const transitionSchema = new Schema<DecisionTransition>(
  {
    to: { type: String, required: true },
    when: { type: String },
    label: { type: String },
    description: { type: String },
  },
  { _id: false }
)

const timerTransitionSchema = new Schema<DecisionTimerTransition>(
  {
    to: { type: String, required: true },
    after_s: { type: Number, required: true },
    label: { type: String },
    description: { type: String },
  },
  { _id: false }
)

const autoTransitionSchema = new Schema<AutoTransition>(
  {
    id: { type: String, required: true },
    to: { type: String, required: true },
    label: { type: String },
    description: { type: String },
    conditionType: { type: String, enum: ['expression', 'telemetry'], default: 'expression' },
    expression: { type: String },
    telemetryKey: { type: String },
    comparator: { type: String },
    value: { type: Number },
    enabled: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    runOn: {
      type: [String],
      default: ['state-entry'],
    },
  },
  { _id: false }
)

const llmTemplateSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
    system_prompt: { type: String },
    user_prompt: { type: String },
    placeholders: { type: [String], default: [] },
    notes: { type: String },
  },
  { _id: false }
)

const layoutSchema = new Schema(
  {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    color: { type: String },
    icon: { type: String },
    collapsed: { type: Boolean, default: false },
  },
  { _id: false }
)

const stateSchema = new Schema<DecisionTreeState>(
  {
    role: { type: String, enum: ['pilot', 'atc', 'system'], required: true },
    phase: { type: String, required: true },
    label: { type: String },
    prompt_out: { type: String },
    say_tpl: { type: String },
    utterance_tpl: { type: String },
    else_say_tpl: { type: String },
    auto: { type: String },
    trigger: { type: String },
    guard: { type: String },
    handoff: {
      to: { type: String },
      freq: { type: String },
    },
    readback_required: { type: [String], default: [] },
    actions: { type: [Schema.Types.Mixed], default: [] },
    next: { type: [transitionSchema], default: [] },
    ok_next: { type: [transitionSchema], default: [] },
    bad_next: { type: [transitionSchema], default: [] },
    timer_next: { type: [timerTransitionSchema], default: [] },
    auto_transitions: { type: [autoTransitionSchema], default: [] },
    llm_templates: {
      decision: { type: llmTemplateSchema, default: undefined },
      readback: { type: llmTemplateSchema, default: undefined },
      fallback: { type: llmTemplateSchema, default: undefined },
    },
    layout: { type: layoutSchema, default: undefined },
    metadata: { type: Schema.Types.Mixed, default: undefined },
    notes: { type: String },
  },
  { _id: false }
)

const decisionTreeSchema = new Schema<DecisionTreeRecord>(
  {
    schema_version: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    description: { type: String },
    start_state: { type: String, required: true },
    end_states: { type: [String], default: [] },
    variables: { type: Schema.Types.Mixed, default: {} },
    flags: { type: Schema.Types.Mixed, default: {} },
    policies: { type: Schema.Types.Mixed, default: {} },
    hooks: { type: Schema.Types.Mixed, default: {} },
    roles: { type: [String], default: [] },
    phases: { type: [String], default: [] },
    states: {
      type: Map,
      of: stateSchema,
      default: () => new Map<string, DecisionTreeState>(),
    },
  },
  { timestamps: true }
)

export type AtcDecisionTreeDocument = mongoose.Document & DecisionTreeRecord & {
  states: Map<string, DecisionTreeState>
}

export const AtcDecisionTree =
  (mongoose.models.AtcDecisionTree as mongoose.Model<AtcDecisionTreeDocument> | undefined) ||
  mongoose.model<AtcDecisionTreeDocument>('AtcDecisionTree', decisionTreeSchema)

