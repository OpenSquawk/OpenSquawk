export interface LLMCandidateInput {
    id: string
    flow?: string
    state: any
}

export interface LLMDecisionInput {
    state_id: string
    state: any
    candidates: LLMCandidateInput[]
    variables: Record<string, any>
    flags: Record<string, any>
    pilot_utterance: string
    active_flow?: string
    flow_state?: Record<string, string>
    flow_order?: string[]
    telemetry?: Record<string, any>
}

export interface LLMDecision {
    next_state: string
    nextState?: string
    updates?: Record<string, any>
    flags?: Record<string, any>
    controller_say_tpl?: string
    off_schema?: boolean
    radio_check?: boolean
    resume_previous?: boolean
    next_flow?: string
}
