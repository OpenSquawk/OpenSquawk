// utils/openaiDecision.ts
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
}

/** Client-seitig: ruft den Backend-Endpunkt auf */
export async function decideNextStateLLM(input: LLMDecisionInput): Promise<LLMDecision> {
    return await $fetch<LLMDecision>('/api/llm/decide', {
        method: 'POST',
        body: input
    })
}
