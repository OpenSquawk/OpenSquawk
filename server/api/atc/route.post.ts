// server/api/atc/route.post.ts — LLM router: picks the best matching interaction from candidates
import { createError, readBody } from 'h3'
import { getOpenAIClient } from '../../utils/normalize'
import { getServerRuntimeConfig } from '../../utils/runtimeConfig'
import type { RouteRequest, RouteResponse, RouteCandidate } from '../../../shared/atc/types'

// ── System prompt (~150 tokens, cached by OpenAI on repeated calls) ──
const SYSTEM_PROMPT = `You are an ATC communication router. Given the pilot's radio transmission and a list of possible intents for the current flight phase, choose the best matching intent.

Respond ONLY with valid JSON:
{"chosen":"interaction_id","reason":"brief reason","pilotIntent":"what pilot meant","confidence":"high|medium|low"}

If nothing matches well, use chosen: "off_schema".`

// ── Helpers ──

function buildUserPrompt(req: RouteRequest): string {
  const candidateList = req.candidates
    .map((c, i) => `${i + 1}. [${c.id}] ${c.intent}${c.example ? ` (e.g. "${c.example}")` : ''}`)
    .join('\n')

  const vars = req.vars || {}
  const contextParts = [
    vars.callsign ? `callsign=${vars.callsign}` : null,
    vars.runway ? `runway=${vars.runway}` : null,
    vars.dest ? `dest=${vars.dest}` : null,
  ].filter(Boolean).join(', ')

  const recent = (req.recentTransmissions || []).slice(-2).join(' | ')

  return [
    `Phase: ${req.phase}`,
    `Pilot said: "${req.pilotSaid}"`,
    '',
    'Possible intents:',
    candidateList,
    '',
    contextParts ? `Flight context: ${contextParts}` : null,
    recent ? `Recent: ${recent}` : null,
  ].filter((line) => line !== null).join('\n')
}

function tryParseJSON(text: string): Record<string, any> | null {
  // Strip markdown code fences if present
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }
  try {
    return JSON.parse(cleaned)
  } catch {
    // Try to extract JSON object from the text
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

function validateConfidence(val: unknown): 'high' | 'medium' | 'low' {
  if (val === 'high' || val === 'medium' || val === 'low') return val
  return 'low'
}

/** Simple heuristic readback check: does the pilot text contain the required values? */
function heuristicReadbackCheck(
  pilotSaid: string,
  candidates: RouteCandidate[],
  vars: Record<string, any>,
): RouteResponse | null {
  if (candidates.length === 0) return null

  const text = pilotSaid.toLowerCase()

  // Check if key values from vars appear in pilot speech
  const valuesToCheck: string[] = []
  for (const key of ['runway', 'squawk', 'initial_alt', 'flight_level', 'qnh', 'taxi_route']) {
    if (vars[key]) valuesToCheck.push(String(vars[key]).toLowerCase())
  }

  if (valuesToCheck.length === 0) return null

  const found: string[] = []
  const missing: string[] = []

  for (const val of valuesToCheck) {
    // Normalize: remove spaces for comparison (e.g. "25 R" vs "25R")
    const normalizedVal = val.replace(/\s+/g, '')
    const normalizedText = text.replace(/\s+/g, '')
    if (normalizedText.includes(normalizedVal)) {
      found.push(val)
    } else {
      missing.push(val)
    }
  }

  const ratio = found.length / valuesToCheck.length

  // Clearly good readback (>= 70% of values present)
  if (ratio >= 0.7) {
    const readbackOk = candidates.find((c) => c.intent.toLowerCase().includes('correct') || c.id.includes('ok'))
    const chosen = readbackOk || candidates[0]
    return {
      chosen: chosen.id,
      reason: 'Heuristic: readback contains required values',
      pilotIntent: 'readback',
      confidence: ratio === 1 ? 'high' : 'medium',
      tokensUsed: 0,
      durationMs: 0,
      model: 'heuristic',
      readbackResult: {
        complete: missing.length === 0,
        missing: missing.length > 0 ? missing : undefined,
      },
    }
  }

  // Clearly bad readback (< 30% of values present)
  if (ratio < 0.3 && valuesToCheck.length >= 2) {
    const readbackBad = candidates.find((c) => c.intent.toLowerCase().includes('incorrect') || c.id.includes('bad'))
    const chosen = readbackBad || candidates[0]
    return {
      chosen: chosen.id,
      reason: 'Heuristic: readback missing most required values',
      pilotIntent: 'readback',
      confidence: 'medium',
      tokensUsed: 0,
      durationMs: 0,
      model: 'heuristic',
      readbackResult: {
        complete: false,
        missing,
      },
    }
  }

  // Uncertain — let LLM decide
  return null
}

// ── Handler ──

export default defineEventHandler(async (event): Promise<RouteResponse> => {
  const body = await readBody<RouteRequest>(event)

  // Validate required fields
  if (!body || !body.pilotSaid || !body.phase || !Array.isArray(body.candidates)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request: pilotSaid, phase, and candidates[] are required',
    })
  }

  const startMs = Date.now()

  // ── Fast path: single candidate → auto-select ──
  if (body.candidates.length === 1) {
    return {
      chosen: body.candidates[0].id,
      reason: 'Only one candidate available',
      pilotIntent: body.candidates[0].intent,
      confidence: 'high',
      tokensUsed: 0,
      durationMs: Date.now() - startMs,
      model: 'auto',
    }
  }

  // ── Fast path: no candidates ──
  if (body.candidates.length === 0) {
    return {
      chosen: 'off_schema',
      reason: 'No candidates provided',
      pilotIntent: body.pilotSaid,
      confidence: 'low',
      tokensUsed: 0,
      durationMs: Date.now() - startMs,
      model: 'auto',
    }
  }

  // ── Readback heuristic check ──
  if (body.waitingFor === 'readback') {
    const heuristicResult = heuristicReadbackCheck(body.pilotSaid, body.candidates, body.vars || {})
    if (heuristicResult) {
      heuristicResult.durationMs = Date.now() - startMs
      return heuristicResult
    }
  }

  // ── LLM call ──
  const client = getOpenAIClient()
  const { llmModel } = getServerRuntimeConfig()
  const model = llmModel || 'gpt-5-nano'

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(body) },
      ],
      temperature: 0.1,
      max_tokens: 150,
      // @ts-expect-error -- reasoning_effort supported by OpenAI API but not yet in all type defs
      reasoning_effort: 'low',
    })

    const durationMs = Date.now() - startMs
    const rawContent = completion.choices?.[0]?.message?.content || ''
    const tokensUsed = completion.usage?.total_tokens ?? 0

    // Parse LLM JSON response
    const parsed = tryParseJSON(rawContent)

    if (parsed && parsed.chosen) {
      // Validate that chosen ID exists in candidates (or is off_schema)
      const validId =
        parsed.chosen === 'off_schema' || body.candidates.some((c) => c.id === parsed.chosen)

      return {
        chosen: validId ? parsed.chosen : body.candidates[0].id,
        reason: String(parsed.reason || 'LLM selected'),
        pilotIntent: String(parsed.pilotIntent || body.pilotSaid),
        confidence: validId ? validateConfidence(parsed.confidence) : 'low',
        tokensUsed,
        durationMs,
        model,
      }
    }

    // Malformed JSON fallback
    console.warn('[route.post] LLM returned malformed JSON, falling back to first candidate:', rawContent)
    return {
      chosen: body.candidates[0].id,
      reason: 'LLM response was malformed, defaulting to first candidate',
      pilotIntent: body.pilotSaid,
      confidence: 'low',
      tokensUsed,
      durationMs,
      model,
    }
  } catch (error: any) {
    console.error('[route.post] LLM call failed:', error.message || error)
    throw createError({
      statusCode: 502,
      statusMessage: `LLM routing failed: ${error.message || 'Unknown error'}`,
    })
  }
})
