export type DecisionRole = 'pilot' | 'atc' | 'system'

export type DecisionPhase =
  | 'Preflight'
  | 'Clearance'
  | 'PushStart'
  | 'TaxiOut'
  | 'Departure'
  | 'Climb'
  | 'Enroute'
  | 'Descent'
  | 'Approach'
  | 'Landing'
  | 'TaxiIn'
  | 'Postflight'
  | 'Interrupt'
  | 'LostComms'
  | 'Missed'
  | (string & {})

export interface DecisionNodeTransition {
  to: string
  when?: string
  label?: string
  description?: string
}

export interface DecisionNodeTimerTransition {
  id?: string
  to: string
  after_s: number
  description?: string
  once?: boolean
}

export interface DecisionNodeAction {
  set?: string
  to?: any
  if?: string
  push?: string
  pop?: string
  note?: string
}

export interface DecisionNodeHandoff {
  to: string
  freq: string
}

export interface DecisionNodeLLMPlaceholder {
  key: string
  description?: string
  example?: string
}

export interface DecisionNodeLLMTemplate {
  decisionPrompt?: string
  readbackPrompt?: string
  fallbackPrompt?: string
  controllerSayTemplate?: string
  expectationTemplate?: string
  guidelines?: string
  placeholders?: DecisionNodeLLMPlaceholder[]
  notes?: string
}

export interface DecisionNodeAutoTransition {
  id: string
  name: string
  condition: string
  next: string
  description?: string
  priority?: number
  requireConfirmation?: boolean
  allowRepeat?: boolean
  autopilot?: boolean
  watch?: string[]
}

export interface DecisionNodeUIConfig {
  x: number
  y: number
  width?: number
  height?: number
  lane?: string
  color?: string
  icon?: string
  collapsed?: boolean
}

export interface DecisionNodeData {
  role: DecisionRole
  phase: DecisionPhase
  prompt_out?: string
  say_tpl?: string
  utterance_tpl?: string
  else_say_tpl?: string
  readback_required?: string[]
  auto?: 'check_readback' | 'monitor' | 'end' | 'pop_stack_or_route_by_intent' | string
  trigger?: string
  guard?: string
  frequency?: string
  frequencyName?: string
  condition?: string
  ok_next?: DecisionNodeTransition[]
  bad_next?: DecisionNodeTransition[]
  next?: DecisionNodeTransition[]
  timer_next?: DecisionNodeTimerTransition[]
  actions?: (DecisionNodeAction | string)[]
  handoff?: DecisionNodeHandoff
  policy_ref?: string
  escalate_to?: string
  notes?: string
  auto_transitions?: DecisionNodeAutoTransition[]
  llm_templates?: DecisionNodeLLMTemplate
}

export interface DecisionNodeHelperLink {
  label: string
  url: string
}

export interface DecisionTreeNode {
  id: string
  title: string
  summary?: string
  tags?: string[]
  data: DecisionNodeData
  llmTemplates?: DecisionNodeLLMTemplate
  autoTransitions?: DecisionNodeAutoTransition[]
  ui?: DecisionNodeUIConfig
  notes?: string
  helperLinks?: DecisionNodeHelperLink[]
  checklists?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface DecisionTelemetryField {
  key: string
  label: string
  unit?: string
  type: 'number' | 'string' | 'boolean'
  description?: string
  default?: number | string | boolean
  min?: number
  max?: number
  hint?: string
}

export interface DecisionTreeCore {
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
  roles: DecisionRole[]
  phases: DecisionPhase[]
  telemetrySchema: DecisionTelemetryField[]
}

export interface DecisionTreeDTO {
  tree: DecisionTreeCore
  nodes: DecisionTreeNode[]
  updatedAt: string
  metadata?: {
    lastImportedFrom?: string
    lastImportedAt?: string
    lastEditor?: {
      id?: string
      email: string
      name?: string
    }
  }
}

export interface DecisionTreeEngineState extends DecisionTreeCore {
  states: Record<string, DecisionNodeData & {
    auto_transitions?: DecisionNodeAutoTransition[]
    llm_templates?: DecisionNodeLLMTemplate
    ui?: DecisionNodeUIConfig
    notes?: string
  }>
}
