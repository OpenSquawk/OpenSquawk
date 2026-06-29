// server/api/decision/route.post.ts
//
// Internal endpoint the Python decision backend calls when regex routing fails
// to match a pilot transmission. It asks the LLM to pick the best candidate
// transition for the (often STT-garbled) transcript, records the cost in the
// central usage ledger, and persists a routing-review record — including
// timeouts — so the time budget can be tuned against real latency.

import { createError, readBody } from 'h3'
import { getOpenAIClient } from '../../utils/openai'
import { requireServiceSecret } from '../../utils/serviceAuth'
import { recordUsage, estimateCostUsd } from '../../utils/usage'
import {
  LlmRoutingDecision,
  type LlmRoutingCandidate,
  type LlmRoutingStatus,
} from '../../models/LlmRoutingDecision'

interface RouteRequestBody {
  sessionId: string
  flowSlug?: string
  stateId: string
  transcript: string
  expectedPhrase?: string
  candidates: LlmRoutingCandidate[]
  timeoutMs?: number
}

const ROUTER_MODEL = (process.env.ROUTER_LLM_MODEL || 'gpt-5-mini').trim()
const DEFAULT_TIMEOUT_MS = 10_000

const SYSTEM_PROMPT = [
  'You are a routing classifier for an ATC radio-communication trainer.',
  'A pilot transmission was transcribed by speech-to-text and a deterministic regex layer could NOT match it to a next state.',
  'The transcript is frequently garbled by STT errors (split words, wrong numbers, homophones).',
  'Compare the transcript against the expected pilot phrase and choose the single candidate transition whose intent best matches what the pilot most likely said.',
  'Candidates are marked kind="ok" (a correct/expected radio call) or kind="bad" (an incorrect or incomplete call).',
  'Only choose a candidate id from the provided list. If none plausibly matches, choose "none".',
  'Respond with strict JSON only: {"chosen": "<candidate id or none>", "reason": "<one short sentence>"}.',
].join(' ')

function buildUserPrompt(body: RouteRequestBody): string {
  const lines: string[] = []
  lines.push(`Current state: ${body.stateId}${body.flowSlug ? ` (flow ${body.flowSlug})` : ''}`)
  if (body.expectedPhrase) {
    lines.push(`Expected pilot phrase: "${body.expectedPhrase}"`)
  }
  lines.push(`Transcript (from STT): "${body.transcript}"`)
  lines.push('Candidates:')
  for (const c of body.candidates) {
    lines.push(`- id="${c.id}" kind=${c.kind}${c.label ? ` label="${c.label}"` : ''}`)
  }
  return lines.join('\n')
}

export default defineEventHandler(async (event) => {
  requireServiceSecret(event)

  const body = await readBody<RouteRequestBody>(event)
  if (!body?.transcript || !body?.stateId || !Array.isArray(body?.candidates) || body.candidates.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'transcript, stateId and candidates[] are required.' })
  }

  const timeoutMs = Number.isFinite(body.timeoutMs) && (body.timeoutMs as number) > 0
    ? (body.timeoutMs as number)
    : DEFAULT_TIMEOUT_MS

  const candidateIds = new Set(body.candidates.map((c) => c.id))
  const client = getOpenAIClient()

  let status: LlmRoutingStatus = 'error'
  let chosen: string | null = null
  let reason: string | undefined
  let inputTokens: number | undefined
  let outputTokens: number | undefined
  let costUsd: number | undefined

  const started = Date.now()
  try {
    const response = await client.chat.completions.create(
      {
        model: ROUTER_MODEL,
        n: 1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(body) },
        ],
      },
      // Per-request budget; no retries so a slow call fails fast within budget.
      { timeout: timeoutMs, maxRetries: 0 },
    )

    inputTokens = response.usage?.prompt_tokens
    outputTokens = response.usage?.completion_tokens

    const raw = response.choices?.[0]?.message?.content?.trim() || ''
    let parsedChosen: string | null = null
    try {
      const parsed = JSON.parse(raw) as { chosen?: string; reason?: string }
      parsedChosen = typeof parsed.chosen === 'string' ? parsed.chosen.trim() : null
      reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : undefined
    } catch {
      reason = `Unparseable model output: ${raw.slice(0, 200)}`
    }

    if (parsedChosen && candidateIds.has(parsedChosen)) {
      chosen = parsedChosen
      status = 'decided'
    } else if (parsedChosen && parsedChosen.toLowerCase() === 'none') {
      status = 'abstain'
    } else if (parsedChosen) {
      // Model named a state outside the allowed set — never trust it.
      status = 'invalid'
      reason = reason || `Model returned out-of-set candidate "${parsedChosen}"`
    } else {
      status = 'error'
    }
  } catch (err: any) {
    const name = String(err?.name || '')
    const isTimeout = name.includes('Timeout') || err?.code === 'ETIMEDOUT' || name === 'APIConnectionTimeoutError'
    status = isTimeout ? 'timeout' : 'error'
    reason = `${name || 'LLM call failed'}: ${String(err?.message || err).slice(0, 200)}`
  }

  const latencyMs = Date.now() - started

  // Cost only when the call actually returned token usage (not on timeout/error).
  if (inputTokens != null || outputTokens != null) {
    costUsd = estimateCostUsd({
      kind: 'llm',
      provider: 'openai',
      model: ROUTER_MODEL,
      endpoint: '/api/decision/route',
      inputTokens,
      outputTokens,
    })
    // Fire-and-forget into the central usage ledger (attributed by sessionId;
    // backend has no user id on the runtime session yet).
    await recordUsage({
      sessionId: body.sessionId,
      kind: 'llm',
      provider: 'openai',
      model: ROUTER_MODEL,
      endpoint: '/api/decision/route',
      inputTokens,
      outputTokens,
    })
  }

  // Always persist the routing-review record, including timeouts/errors.
  try {
    await LlmRoutingDecision.create({
      sessionId: body.sessionId,
      flowSlug: body.flowSlug,
      stateId: body.stateId,
      transcript: body.transcript,
      expectedPhrase: body.expectedPhrase,
      candidates: body.candidates,
      chosen,
      reason,
      status,
      model: ROUTER_MODEL,
      timeoutMs,
      latencyMs,
      inputTokens,
      outputTokens,
      costUsd,
    })
  } catch (e) {
    console.warn('[decision/route] persisting routing decision failed', e)
  }

  return { chosen, reason, status, latencyMs, timeoutMs, model: ROUTER_MODEL }
})
