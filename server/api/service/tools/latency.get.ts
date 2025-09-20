// server/api/llm/latency.get.ts
import { createError } from 'h3'
import { getOpenAIClient } from '../../../utils/openai'
import { getServerRuntimeConfig } from '../../../utils/runtimeConfig'

const SYSTEM_PROMPT =
    'Check if the pilot readback contains ALL of: Frankfurt or EDDF, FL320, and 120.8 MHz. ' +
    'Reply with single digit only: 1 = all present, 0 = one or more missing, 2 = invalid/unrelated.';

const READBACK =
    'Lufthanser four seven eight cleared fra via NORDA1A, climb 5000 feet, expect flight level tree too zero, dep 120 decimal 8, squawk 4213.';

export default defineEventHandler(async () => {
    const client = getOpenAIClient()
    const { llmModel } = getServerRuntimeConfig()
    const model = llmModel || 'chatgpt-5-nano'

    const started = Date.now()

    try {
        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `${READBACK}` }
            ],
        })

        const raw = response.choices?.[0]?.message?.content?.trim() || ''
        const parsed = Number.parseInt(raw, 10)
        const validResult = Number.isInteger(parsed) && parsed >= 0 && parsed <= 2 ? parsed : null
        const latencyMs = Date.now() - started

        return {
            result: validResult,
            raw,
            latency_ms: latencyMs
        }
    } catch (error: any) {
        const latencyMs = Date.now() - started
        console.error('[LLM] Latency check failed:', error)
        throw createError({
            statusCode: error?.status ?? 500,
            statusMessage: error?.message ?? 'Latency check failed',
            data: { latency_ms: latencyMs }
        })
    }
})
