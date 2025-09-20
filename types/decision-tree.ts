export type DecisionRole = 'pilot' | 'atc' | 'system'

export type AutoTransitionTrigger = 'state-entry' | 'telemetry-update' | 'decision-applied'

export type TelemetryKey = 'altitude_ft' | 'speed_kt' | 'vertical_speed_fpm' | 'latitude' | 'longitude'

export interface LlmTemplateConfig {
  title?: string
  description?: string
  system_prompt?: string
  user_prompt?: string
  placeholders?: string[]
  notes?: string
}

export interface NodeLayout {
  x: number
  y: number
  color?: string
  icon?: string
  collapsed?: boolean
}

export interface DecisionTransition {
  to: string
  when?: string
  label?: string
  description?: string
}

export interface DecisionTimerTransition {
  to: string
  after_s: number
  label?: string
  description?: string
}

export interface AutoTransition {
  id: string
  to: string
  label?: string
  description?: string
  conditionType?: 'expression' | 'telemetry'
  expression?: string
  telemetryKey?: TelemetryKey
  comparator?: '>' | '>=' | '<' | '<=' | '===' | '!=='
  value?: number
  enabled?: boolean
  priority?: number
  runOn?: AutoTransitionTrigger[]
}

export interface DecisionTreeState {
  role: DecisionRole
  phase: string
  label?: string
  prompt_out?: string
  say_tpl?: string
  utterance_tpl?: string
  else_say_tpl?: string
  auto?: string
  trigger?: string
  guard?: string
  handoff?: { to: string; freq: string }
  readback_required?: string[]
  actions?: Array<Record<string, any> | string>
  next?: DecisionTransition[]
  ok_next?: DecisionTransition[]
  bad_next?: DecisionTransition[]
  timer_next?: DecisionTimerTransition[]
  auto_transitions?: AutoTransition[]
  llm_templates?: {
    decision?: LlmTemplateConfig
    readback?: LlmTemplateConfig
    fallback?: LlmTemplateConfig
  }
  layout?: NodeLayout
  metadata?: Record<string, any>
  notes?: string
}

export interface DecisionTreeRecord {
  _id?: string
  schema_version: string
  name: string
  description?: string
  start_state: string
  end_states: string[]
  variables: Record<string, any>
  flags: Record<string, any>
  policies: Record<string, any>
  hooks: Record<string, any>
  roles: string[]
  phases: string[]
  states: Record<string, DecisionTreeState>
  createdAt?: string
  updatedAt?: string
}
