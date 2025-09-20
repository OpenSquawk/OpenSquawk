export interface LLMDecisionInput {
    state_id: string
    state: any
    candidates: Array<{ id: string; state: any }>
    variables: Record<string, any>
    flags: Record<string, any>
    pilot_utterance: string
}

export interface LLMDecision {
    next_state: string
    updates?: Record<string, any>
    flags?: Record<string, any>
    controller_say_tpl?: string
    off_schema?: boolean
    radio_check?: boolean
}
