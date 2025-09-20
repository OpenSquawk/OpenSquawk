// utils/openaiDecision.ts
import type { LLMDecision, LLMDecisionInput } from '../types/llm'

/** Client-seitig: ruft den Backend-Endpunkt auf */
export async function decideNextStateLLM(input: LLMDecisionInput): Promise<LLMDecision> {
    return await $fetch<LLMDecision>('/api/llm/decide', {
        method: 'POST',
        body: input
    })
}
