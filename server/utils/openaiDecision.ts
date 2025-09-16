// utils/openaiDecision.ts
import { decide } from '~/server/utils/openai' // falls du schon nen Wrapper hast; sonst direkt OpenAI SDK

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

export async function decideNextStateLLM(input: LLMDecisionInput): Promise<LLMDecision> {
    // Prompt sehr kurz halten; Model bekommt alles als JSON
    const system = 'You are an ATC state router. Return strict JSON with next_state, optional updates, flags, controller_say_tpl.'
    const user = JSON.stringify(input)
    const out = await decide(system, user) // → implementiere mit deinem OpenAI-Aufruf
    // Erwartet reines JSON
    return JSON.parse(out) as LLMDecision
}
