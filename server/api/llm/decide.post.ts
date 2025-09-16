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
        return decision // direkt das JSON des Routers zurückgeben
    } catch (err: any) {
        throw createError({ statusCode: 500, statusMessage: err?.message || 'Router failed' })
    }
})
