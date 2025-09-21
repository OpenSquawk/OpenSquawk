export type DecisionNodeRole = 'pilot' | 'atc' | 'system'

export type DecisionTransitionType =
  | 'next'
  | 'ok'
  | 'bad'
  | 'timer'
  | 'auto'
  | 'interrupt'
  | 'return'

export type DecisionAutoTriggerType = 'telemetry' | 'variable' | 'expression'

export type DecisionComparisonOperator = '>' | '>=' | '<' | '<=' | '==' | '!='

export interface DecisionNodeAutoTrigger {
  id: string
  type: DecisionAutoTriggerType
  parameter?:
    | 'altitude_ft'
    | 'speed_kts'
    | 'groundspeed_kts'
    | 'vertical_speed_fpm'
    | 'heading_deg'
    | 'distance_nm'
  variable?: string
  operator?: DecisionComparisonOperator
  value?: number | string
  unit?: string
  expression?: string
  description?: string
  once?: boolean
  delayMs?: number
}

export type DecisionNodeTriggerType = 'auto_time' | 'auto_variable' | 'regex' | 'none'

export interface DecisionNodeTrigger {
  id: string
  type: DecisionNodeTriggerType
  order?: number
  delaySeconds?: number
  variable?: string
  operator?: DecisionComparisonOperator
  value?: number | string | boolean
  pattern?: string
  patternFlags?: string
  description?: string
}

export type DecisionNodeConditionType = 'variable_value' | 'regex' | 'regex_not'

export interface DecisionNodeCondition {
  id: string
  type: DecisionNodeConditionType
  order?: number
  variable?: string
  operator?: DecisionComparisonOperator
  value?: number | string | boolean
  pattern?: string
  patternFlags?: string
  description?: string
}

export interface DecisionTransitionMetadata {
  color?: string
  icon?: string
  notes?: string
  previewTemplate?: string
}

export interface DecisionNodeTransition {
  key: string
  type: DecisionTransitionType
  target: string
  label?: string
  description?: string
  condition?: string
  guard?: string
  order?: number
  timer?: {
    afterSeconds: number
    allowManualProceed?: boolean
  }
  autoTrigger?: DecisionNodeAutoTrigger | null
  metadata?: DecisionTransitionMetadata
}

export interface DecisionNodeLayout {
  x: number
  y: number
  width?: number
  height?: number
  color?: string
  icon?: string
  locked?: boolean
}

export interface DecisionNodeLLMPlaceholder {
  key: string
  label: string
  description?: string
  required?: boolean
  example?: string
  defaultValue?: string
  type?: 'text' | 'number' | 'choice'
}

export interface DecisionNodeLLMTemplate {
  summary?: string
  prompt?: string
  responseSchema?: string
  autoProceed?: boolean
  temperature?: number
  topP?: number
  maxOutputTokens?: number
  placeholders?: DecisionNodeLLMPlaceholder[]
  guardrails?: string[]
  notes?: string
}

export interface DecisionNodeMetadata {
  tags?: string[]
  notes?: string
  pinned?: boolean
  complexity?: 'low' | 'medium' | 'high'
}

export type DecisionFlowEntryMode = 'parallel' | 'linear'

export interface DecisionNodeModel {
  stateId: string
  title?: string
  summary?: string
  role: DecisionNodeRole
  phase: string
  sayTemplate?: string
  utteranceTemplate?: string
  elseSayTemplate?: string
  readbackRequired?: string[]
  autoBehavior?: 'check_readback' | 'monitor' | 'end' | 'pop_stack_or_route_by_intent'
  actions?: Array<any>
  handoff?: { to: string; freq?: string; note?: string }
  guard?: string
  trigger?: string
  frequency?: string
  frequencyName?: string
  triggers?: DecisionNodeTrigger[]
  conditions?: DecisionNodeCondition[]
  transitions: DecisionNodeTransition[]
  layout?: DecisionNodeLayout
  metadata?: DecisionNodeMetadata
  llmTemplate?: DecisionNodeLLMTemplate
  createdAt?: string
  updatedAt?: string
}

export interface DecisionFlowLayoutGroup {
  id: string
  label: string
  color?: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface DecisionFlowLayout {
  zoom?: number
  pan?: { x: number; y: number }
  groups?: DecisionFlowLayoutGroup[]
}

export interface DecisionFlowMetadata {
  notes?: string
  tags?: string[]
  ownerId?: string
  lastEditedBy?: string
}

export interface DecisionFlowModel {
  id: string
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
  roles: DecisionNodeRole[]
  phases: string[]
  layout?: DecisionFlowLayout
  metadata?: DecisionFlowMetadata
  createdAt: string
  updatedAt: string
  nodeCount?: number
  entryMode?: DecisionFlowEntryMode
  isMain?: boolean
}

export interface RuntimeDecisionAutoTransition {
  id: string
  to: string
  label?: string
  description?: string
  condition?: string
  guard?: string
  trigger?: DecisionNodeAutoTrigger | null
  metadata?: DecisionTransitionMetadata
}

export interface RuntimeDecisionState {
  role: DecisionNodeRole
  phase: string
  name?: string
  summary?: string
  say_tpl?: string
  utterance_tpl?: string
  else_say_tpl?: string
  next?: Array<{ to: string; label?: string; when?: string; guard?: string }>
  ok_next?: Array<{ to: string; label?: string; when?: string; guard?: string }>
  bad_next?: Array<{ to: string; label?: string; when?: string; guard?: string }>
  timer_next?: Array<{ to: string; after_s: number; label?: string }>
  auto?: string | null
  readback_required?: string[]
  actions?: any[]
  handoff?: { to: string; freq?: string }
  guard?: string
  trigger?: string
  frequency?: string
  frequencyName?: string
  auto_transitions?: RuntimeDecisionAutoTransition[]
  triggers?: DecisionNodeTrigger[]
  conditions?: DecisionNodeCondition[]
  metadata?: DecisionNodeMetadata
}

export interface RuntimeDecisionTree {
  slug: string
  schema_version: string
  name: string
  description?: string
  start_state: string
  end_states: string[]
  variables: Record<string, any>
  flags: Record<string, any>
  policies: Record<string, any>
  hooks: Record<string, any>
  roles: DecisionNodeRole[]
  phases: string[]
  states: Record<string, RuntimeDecisionState>
  entry_mode?: 'main' | DecisionFlowEntryMode
}

export interface RuntimeDecisionSystem {
  main: string
  order: string[]
  flows: Record<string, RuntimeDecisionTree>
}

export interface DecisionFlowSummary {
  id: string
  slug: string
  name: string
  description?: string
  startState: string
  nodeCount: number
  updatedAt: string
  createdAt: string
  entryMode?: DecisionFlowEntryMode
  isMain?: boolean
}
