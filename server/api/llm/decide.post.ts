// server/api/llm/decide.post.ts
import { readBody, createError } from 'h3'
import type { LLMDecisionInput } from '~~/shared/types/llm'
import { routeDecision } from '../../utils/openai'
import { TransmissionLog } from '../../models/TransmissionLog'
import { getUserFromEvent } from '../../utils/auth'

function safeClone<T>(value: T): T | undefined {
    if (value === undefined) {
        return undefined
    }

    try {
        return JSON.parse(JSON.stringify(value))
    } catch (err) {
        console.warn('Failed to clone value for decision metadata', err)
        return undefined
    }
}

export default defineEventHandler(async (event) => {
    const body = await readBody<LLMDecisionInput | undefined>(event)
    if (!body) {
        throw createError({ statusCode: 400, statusMessage: 'Missing body' })
    }
    if (!body.state_id || !Array.isArray(body.candidates)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid shape' })
    }

    try {
        const { decision, trace } = await routeDecision(body)
        const user = await getUserFromEvent(event)

        const llmCallCount = trace?.calls?.length || 0
        const fallbackUsed = Boolean(trace?.fallback?.used)
        const llmStrategy: 'openai' | 'fallback' | 'heuristic' = llmCallCount > 0
            ? 'openai'
            : fallbackUsed
                ? 'fallback'
                : 'heuristic'

        const llmUsage = {
            autoDecide: true,
            openaiUsed: llmStrategy === 'openai',
            callCount: llmCallCount,
            fallbackUsed,
            strategy: llmStrategy,
            reason:
                llmStrategy === 'openai'
                    ? `Decision derived from OpenAI with ${llmCallCount} call(s).`
                    : llmStrategy === 'fallback'
                        ? trace?.fallback?.reason || 'Fallback triggered after OpenAI failure.'
                        : 'Decision resolved locally without calling OpenAI.',
        }

        const contextState = safeClone(body.state)
        if (contextState && typeof contextState === 'object' && contextState !== null) {
            const stateRecord = contextState as Record<string, any>
            if (!('id' in stateRecord)) {
                stateRecord.id = body.state_id
            }
        }

        const contextCandidates = Array.isArray(body.candidates)
            ? body.candidates.map((candidate) => {
                  const candidateState = safeClone(candidate.state)
                  if (candidateState && typeof candidateState === 'object' && candidateState !== null) {
                      const candidateRecord = candidateState as Record<string, any>
                      if (!('id' in candidateRecord)) {
                          candidateRecord.id = candidate.id
                      }
                  }

                  return {
                      id: candidate.id,
                      state: candidateState,
                  }
              })
            : undefined

        const selectedCandidate = contextCandidates?.find((candidate) => candidate.id === decision?.next_state)

        try {
            await TransmissionLog.create({
                user: user?._id,
                role: 'atc',
                channel: 'decide',
                type: 'decide',
                direction: 'outgoing',
                text: body.pilot_utterance || '(no utterance provided)',
                metadata: {
                    decision,
                    decisionTrace: trace,
                    autoDecide: true,
                    llm: llmUsage,
                    pilotUtterance: body.pilot_utterance,
                    context: {
                        stateId: body.state_id,
                        state: contextState,
                        candidates: contextCandidates,
                        selectedCandidate,
                        variables: safeClone(body.variables),
                        flags: safeClone(body.flags),
                    },
                },
            })
        } catch (logError) {
            console.warn('Transmission logging failed', logError)
        }

        // Log for debugging when off-schema or radio check triggers
        if (decision.off_schema) {
            console.log(`[ATC] Off-schema response for: "${body.pilot_utterance}"`)
        }
        if (decision.radio_check) {
            console.log(`[ATC] Radio check processed: "${body.pilot_utterance}"`)
        }

        if (trace?.calls?.length) {
            console.log('[ATC] Decision trace captured with', trace.calls.length, 'call(s)')
        }

        return decision
    } catch (err: any) {
        console.error('Router failed:', err)
        throw createError({ statusCode: 500, statusMessage: err?.message || 'Router failed' })
    }
})
