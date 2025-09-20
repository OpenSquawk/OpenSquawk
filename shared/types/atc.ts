export type AtcRole = 'pilot' | 'atc' | 'system'

export type AtcTransitionKind =
  | 'next'
  | 'ok_next'
  | 'bad_next'
  | 'timer'
  | 'auto'
  | 'interrupt'
  | 'stack'
  | 'custom'

export interface AtcAutopilotCondition {
  mode: 'expression' | 'threshold' | 'delta'
  expression?: string
  variable?: string
  operator?: '>' | '>=' | '<' | '<=' | '==' | '!=' | 'changes' | 'rises_above' | 'drops_below'
  value?: number | string
  secondValue?: number | string
  unit?: string
  holdForMs?: number
  allowDuringLLM?: boolean
  allowDuringPilotSpeech?: boolean
  allowDuringControllerSpeech?: boolean
  sampleWindowMs?: number
  description?: string
  controllerSayTpl?: string
  updates?: Record<string, any>
  flags?: Record<string, any>
}

export interface AtcTransition {
  id: string
  to: string
  kind: AtcTransitionKind
  label?: string
  description?: string
  when?: string
  guard?: string
  priority?: number
  timer?: { after_s: number }
  auto?: AtcAutopilotCondition
  metadata?: Record<string, any>
}

export interface AtcTemplatePlaceholder {
  key: string
  label?: string
  description?: string
  example?: string
  required?: boolean
  defaultValue?: string | number
  autoFill?: {
    source: 'variable' | 'flag' | 'literal' | 'expression'
    path?: string
    literal?: string
    expression?: string
  }
}

export interface AtcLlmTemplate {
  id: string
  name: string
  description?: string
  systemPrompt?: string
  userPrompt?: string
  responseFormat?: Record<string, any>
  sampleResponse?: string
  hints?: string
  placeholders?: AtcTemplatePlaceholder[]
  metadata?: Record<string, any>
  autoApplyWhen?: string
}

export interface AtcStateUI {
  x?: number
  y?: number
  lane?: string
  color?: string
  icon?: string
  width?: number
  collapsedPanels?: string[]
}

export interface AtcState {
  stateId: string
  title?: string
  role: AtcRole
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
  transitions: AtcTransition[]
  llmTemplates?: AtcLlmTemplate[]
  metadata?: Record<string, any>
  notes?: string
  ui?: AtcStateUI
  createdAt?: string
  updatedAt?: string
}

export interface AtcFlowPolicies {
  timeouts?: {
    pilot_readback_timeout_s?: number
    controller_ack_timeout_s?: number
    no_reply_retry_after_s?: number
    no_reply_max_retries?: number
    lost_comms_detect_after_s?: number
  }
  no_reply_sequence?: Array<{ after_s: number; controller_say_tpl: string }>
  interrupts_allowed_when?: Record<string, string>
}

export interface AtcFlow {
  id: string
  name: string
  schemaVersion?: string
  description?: string
  startState: string
  endStates: string[]
  variables: Record<string, any>
  flags: Record<string, any>
  policies: AtcFlowPolicies
  hooks: Record<string, any>
  roles: string[]
  phases: string[]
  metadata?: Record<string, any>
  createdAt?: string
  updatedAt?: string
}

export interface AtcFlowWithStates {
  flow: AtcFlow
  states: AtcState[]
}

export interface AtcDecisionState {
  id: string
  role: AtcRole
  phase: string
  say_tpl?: string
  utterance_tpl?: string
  else_say_tpl?: string
  auto?: string
  readback_required?: string[]
  actions?: Array<Record<string, any> | string>
  condition?: string
  guard?: string
  trigger?: string
  frequency?: string
  frequencyName?: string
  handoff?: { to: string; freq?: string }
  next?: Array<{ to: string; when?: string; label?: string; description?: string }>
  ok_next?: Array<{ to: string; when?: string; label?: string; description?: string }>
  bad_next?: Array<{ to: string; when?: string; label?: string; description?: string }>
  timer_next?: Array<{ to: string; after_s: number; label?: string; description?: string }>
  auto_next?: Array<{
    id: string
    to: string
    label?: string
    description?: string
    priority?: number
    when?: string
    auto?: AtcAutopilotCondition
  }>
  llm_templates?: AtcLlmTemplate[]
  metadata?: Record<string, any>
}

export interface AtcDecisionTree {
  schema_version: string
  name: string
  description?: string
  start_state: string
  end_states: string[]
  variables: Record<string, any>
  flags: Record<string, any>
  policies: AtcFlowPolicies
  hooks: Record<string, any>
  roles: string[]
  phases: string[]
  states: Record<string, AtcDecisionState>
}
