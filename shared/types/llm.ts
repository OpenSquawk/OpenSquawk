export interface LLMDecisionInput {
    state_id: string
    state: any
    candidates: Array<{ id: string; state: any; flow?: string }>
    variables: Record<string, any>
    flags: Record<string, any>
    pilot_utterance: string
    flow_slug?: string
}

export interface LLMDecision {
    next_state: string
    updates?: Record<string, any>
    flags?: Record<string, any>
    controller_say_tpl?: string
    off_schema?: boolean
    radio_check?: boolean
    activate_flow?: string
    resume_previous?: boolean
}
