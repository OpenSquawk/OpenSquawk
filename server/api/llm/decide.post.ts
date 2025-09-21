// server/api/llm/decide.post.ts
import { readBody, createError } from 'h3'
import type { LLMDecisionInput } from '~~/shared/types/llm'
import { routeDecision } from '../../utils/openai'

export default defineEventHandler(async (event) => {
    const body = await readBody<LLMDecisionInput | undefined>(event)
    if (!body) {
        throw createError({ statusCode: 400, statusMessage: 'Missing body' })
    }
    if (!body.state_id || !Array.isArray(body.candidates)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid shape' })
    }

    try {
        const result = await routeDecision(body)
        const { decision, trace } = result

        if (decision.off_schema) {
            console.log(`[ATC] Off-schema response for: "${body.pilot_utterance}"`)
        }
        if (decision.radio_check) {
            console.log(`[ATC] Radio check processed: "${body.pilot_utterance}"`)
        }

        if (trace?.calls?.length) {
            console.log('[ATC] Decision trace captured with', trace.calls.length, 'call(s)')
        }

        return result
    } catch (err: any) {
        console.error('Router failed:', err)
        throw createError({ statusCode: 500, statusMessage: err?.message || 'Router failed' })
    }
})
