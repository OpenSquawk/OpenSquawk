// utils/openaiDecision.ts
import type { LLMDecisionInput, LLMDecisionResult } from '../types/llm'

/** Client-seitig: ruft den Backend-Endpunkt auf */
export async function decideNextStateLLM(input: LLMDecisionInput): Promise<LLMDecisionResult> {
    return await $fetch<LLMDecisionResult>('/api/llm/decide', {
        method: 'POST',
        body: input
    })
}
