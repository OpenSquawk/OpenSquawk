// server/api/llm/decide.post.ts
import { readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
    const body = await readBody<LLMDecisionInput | undefined>(event)
    if (!body) {
        throw createError({ statusCode: 400, statusMessage: 'Missing body' })
    }
    if (!body.state_id || !Array.isArray(body.candidates)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid shape' })
    }

    try {
        const decision = await routeDecision(body)

        // Log für Debugging bei off-schema oder radio check
        if (decision.off_schema) {
            console.log(`[ATC] Off-schema response for: "${body.pilot_utterance}"`)
        }
        if (decision.radio_check) {
            console.log(`[ATC] Radio check processed: "${body.pilot_utterance}"`)
        }

        return decision
    } catch (err: any) {
        console.error('Router failed:', err)
        throw createError({ statusCode: 500, statusMessage: err?.message || 'Router failed' })
    }
})
