export type LLMDecisionCandidateSource = 'transition' | 'entry'

export interface LLMDecisionCandidateInput {
  id: string
  flow: string
  state: any
  source?: LLMDecisionCandidateSource
  active?: boolean
}

export interface LLMDecisionFlowStatus {
  slug: string
  current_state: string
  start_state?: string
  active?: boolean
  state_elapsed_ms?: number
}

export interface LLMDecisionInput {
  state_id: string
  state: any
  flow_slug: string
  flow_stack?: string[]
  flows?: LLMDecisionFlowStatus[]
  candidates: LLMDecisionCandidateInput[]
  variables: Record<string, any>
  flags: Record<string, any>
  telemetry?: Record<string, any>
  pilot_utterance: string
  last_atc_output?: string
}

export interface LLMDecision {
  next_state: string | null
  next_flow?: string
  flow_push?: boolean
  resume_previous?: boolean
  updates?: Record<string, any>
  flags?: Record<string, any>
  controller_say_tpl?: string
  off_schema?: boolean
  radio_check?: boolean
}
