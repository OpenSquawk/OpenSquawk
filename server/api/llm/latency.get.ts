// server/api/llm/latency.get.ts
import { createError } from 'h3'
import { getOpenAIClient } from '../../utils/openai'
import { getServerRuntimeConfig } from '../../utils/runtimeConfig'

const CLEARANCE_MESSAGE = [
    'ATC clearance:',
    'Lufthansa four seven eight, cleared to Frankfurt via the NORDA one alpha departure,',
    'climb and maintain five thousand, expect flight level three two zero ten minutes after departure,',
    'departure frequency one two zero decimal eight, squawk four two one three.'
].join(' ')

const READBACK_MESSAGE = [
    'Pilot readback:',
    'Lufthansa four seven eight is cleared to Frankfurt via NORDA one alpha,',
    'climb maintain five thousand, expect flight level three two zero in ten,',
    'departure one two zero decimal eight, squawk four two one three.'
].join(' ')

const SYSTEM_PROMPT = [
    'You verify IFR clearance readbacks for aviation radio communication.',
    'Answer with a single digit only:',
    '1 when the readback correctly repeats the clearance,',
    '0 when part of the readback is wrong or missing,',
    '2 when the transmission is not a valid readback or unrelated to the clearance.'
].join(' ')

export default defineEventHandler(async () => {
    const client = getOpenAIClient()
    const { llmModel } = getServerRuntimeConfig()
    const model = llmModel || 'chatgpt-5-nano'

    const started = Date.now()

    try {
        const response = await client.chat.completions.create({
            model,
            temperature: 0,
            max_tokens: 1,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: [CLEARANCE_MESSAGE, READBACK_MESSAGE].join('\n')
                }
            ]
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
