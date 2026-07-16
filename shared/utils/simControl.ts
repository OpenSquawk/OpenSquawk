// Frequency-driven simulator control (roadmap key `frequency-sim-control`).
//
// Parses free-form SIM SETUP commands the pilot speaks on frequency ("set me
// up for an approach from 5000 ft to EDDF 07R", "change my altitude to 8000")
// into structured commands for the bridge. These are meta commands from the
// user to their OWN simulator instance — deliberately a different grammar from
// ICAO readback phraseology (which runs through sttMatch.ts) so an ordinary
// ATC readback can never be mistaken for a sim command.
//
// Fail-closed by design: anything ambiguous returns { matched: false } with a
// reason instead of a best-effort guess — a misparsed command changes the
// user's real sim state. Parameter names follow the NormalizedTelemetry
// convention (useRadioBackend.ts): the command travels toward the bridge/sim,
// so it speaks the sim-side vocabulary (altitude_ft, ias_kts, heading_deg).

import { denormalizeSpokenAtc, normalizeForMatch } from './sttMatch'

export type SimControlCommand =
  | { type: 'set_altitude'; altitude_ft: number }
  | { type: 'set_heading'; heading_deg: number }
  | { type: 'set_speed'; ias_kts: number }
  | {
      type: 'setup_approach'
      /** Uppercase 4-letter ICAO ("EDDF"). Existence is the caller's check. */
      airport_icao: string
      /** "07R", "26L", "23" — zero-padded number 01–36 + optional L/R/C. */
      runway: string
      altitude_ft?: number
      final_distance_nm?: number
    }

export type SimControlNoMatchReason =
  | 'no_intent'
  | 'missing_value'
  | 'missing_unit'
  | 'out_of_range'
  | 'invalid_runway'
  | 'missing_runway'
  | 'missing_airport'

export type SimControlMatch = { matched: true; command: SimControlCommand; text: string }
export type SimControlRejection = { matched: false; reason: SimControlNoMatchReason; text: string }

export type SimControlParseResult = SimControlMatch | SimControlRejection

/**
 * Narrowing helpers. This union is discriminated by a boolean, and the project
 * builds with `strict: false` (nuxt.config.ts) — so `strictNullChecks` is off,
 * and without it TypeScript does not treat `true`/`false` literal types as
 * discriminants. `if (result.matched) … else result.reason` therefore does NOT
 * narrow and fails to compile. An explicit type predicate narrows regardless,
 * which is why callers must go through these rather than testing `.matched`.
 */
export function isSimControlMatch(result: SimControlParseResult): result is SimControlMatch {
  return result.matched
}

export function isSimControlRejection(result: SimControlParseResult): result is SimControlRejection {
  return !result.matched
}

/** Hard value ranges; anything outside is a refusal, never a clamp. */
export const SIM_CONTROL_LIMITS = {
  altitude_ft: { min: 0, max: 45000 },
  heading_deg: { min: 1, max: 360 },
  ias_kts: { min: 60, max: 400 },
  final_distance_nm: { min: 1, max: 30 },
} as const

// 4-letter English words that can follow "to/at/for" in an approach phrase
// and must never be mistaken for an ICAO code.
const ICAO_STOPWORDS = new Set([
  'left', 'right', 'feet', 'final', 'mile', 'nautical', 'from', 'with', 'land',
])

function noMatch(reason: SimControlNoMatchReason, text: string): SimControlParseResult {
  return { matched: false, reason, text }
}

function inRange(value: number, limit: { min: number; max: number }): boolean {
  return value >= limit.min && value <= limit.max
}

/** "flight level 100" / "fl100" → feet, or null when no FL phrase is present. */
function flightLevelFeet(fragment: string): number | null {
  const fl = fragment.match(/\b(?:flight level|fl) ?(\d{1,3})\b/)
  return fl ? Number(fl[1]) * 100 : null
}

function parseApproach(text: string): SimControlParseResult {
  // Runway: keyword form ("runway 26 l" → "runway 26l" after denormalize) or a
  // bare suffixed token ("25r"). A bare number WITHOUT suffix is only accepted
  // behind the "runway" keyword — a lone "25" in the sentence is too ambiguous.
  const keyword = text.match(/\brunway (\d{1,2}) ?([lrc])?\b/)
  const bareToken = text.match(/(?:^|\s)(\d{2})([lrc])(?:\s|$)/)
  const rwNumRaw = keyword?.[1] ?? bareToken?.[1]
  const rwSuffix = (keyword ? keyword[2] : bareToken?.[2]) ?? ''
  if (!rwNumRaw) return noMatch('missing_runway', text)
  const rwNum = Number(rwNumRaw)
  if (rwNum < 1 || rwNum > 36) return noMatch('invalid_runway', text)
  const runway = `${rwNumRaw.padStart(2, '0')}${rwSuffix.toUpperCase()}`

  const airport = text.match(/\b(?:to|at|for|into) ([a-z]{4})\b/)
  if (!airport || ICAO_STOPWORDS.has(airport[1]!)) return noMatch('missing_airport', text)
  const airport_icao = airport[1]!.toUpperCase()

  // Altitude is optional, but WHEN a "from <number>" is present it must carry
  // an explicit unit (feet/ft) or be a flight level — a bare "from 5000" is
  // ambiguous and refused rather than guessed.
  let altitude_ft: number | undefined
  const fromFl = text.match(/\bfrom (?:flight level|fl) ?(\d{1,3})\b/)
  const fromFt = text.match(/\bfrom (\d{3,5}) ?(?:feet|ft)\b/)
  if (fromFl) altitude_ft = Number(fromFl[1]) * 100
  else if (fromFt) altitude_ft = Number(fromFt[1])
  else if (/\bfrom \d/.test(text)) return noMatch('missing_unit', text)
  if (altitude_ft !== undefined && !inRange(altitude_ft, SIM_CONTROL_LIMITS.altitude_ft)) {
    return noMatch('out_of_range', text)
  }

  let final_distance_nm: number | undefined
  const dist = text.match(/\b(\d{1,2}) ?(?:miles?|nm|nautical miles?) final\b/)
  if (dist) {
    final_distance_nm = Number(dist[1])
    if (!inRange(final_distance_nm, SIM_CONTROL_LIMITS.final_distance_nm)) {
      return noMatch('out_of_range', text)
    }
  }

  const command: SimControlCommand = { type: 'setup_approach', airport_icao, runway }
  if (altitude_ft !== undefined) command.altitude_ft = altitude_ft
  if (final_distance_nm !== undefined) command.final_distance_nm = final_distance_nm
  return { matched: true, command, text }
}

function parseParameter(
  parameter: 'altitude' | 'heading' | 'speed',
  rest: string,
  text: string,
): SimControlParseResult {
  if (parameter === 'altitude') {
    // "altitude" names the unit context, so a bare number is unambiguous here
    // (this is the literal roadmap wording "change my altitude to 8000").
    const fl = flightLevelFeet(rest)
    const num = fl ?? Number(rest.match(/\b(\d{1,6})\b/)?.[1] ?? NaN)
    if (!Number.isFinite(num)) return noMatch('missing_value', text)
    if (!inRange(num, SIM_CONTROL_LIMITS.altitude_ft)) return noMatch('out_of_range', text)
    return { matched: true, command: { type: 'set_altitude', altitude_ft: num }, text }
  }
  if (parameter === 'heading') {
    const num = Number(rest.match(/\b(\d{1,3})\b/)?.[1] ?? NaN)
    if (!Number.isFinite(num)) return noMatch('missing_value', text)
    if (!inRange(num, SIM_CONTROL_LIMITS.heading_deg)) return noMatch('out_of_range', text)
    return { matched: true, command: { type: 'set_heading', heading_deg: num }, text }
  }
  const num = Number(rest.match(/\b(\d{2,3})\b/)?.[1] ?? NaN)
  if (!Number.isFinite(num)) return noMatch('missing_value', text)
  if (!inRange(num, SIM_CONTROL_LIMITS.ias_kts)) return noMatch('out_of_range', text)
  return { matched: true, command: { type: 'set_speed', ias_kts: num }, text }
}

/**
 * Parse a transmission into a sim-control command, or refuse.
 *
 * The intent gate is intentionally narrow: only explicit self-service anchors
 * ("set me up …", "put me …", "reposition …" for approaches; "change/set my
 * <parameter> …" for single values) enter parsing at all. Regular phraseology
 * ("descend to 5000 feet", "request descent …", "cleared to land …") carries
 * none of these anchors and always returns `no_intent` — that property is the
 * safety contract of this module and is covered by tests.
 */
export function parseSimControl(input: string): SimControlParseResult {
  const text = normalizeForMatch(denormalizeSpokenAtc(input))
  if (!text) return noMatch('no_intent', text)

  const wantsApproach = /\b(?:set me up|put me|reposition(?: me)?)\b.*\b(?:approach|final)\b/.test(text)
  if (wantsApproach) return parseApproach(text)

  const parameter = text.match(/\b(?:change|set) my (altitude|heading|speed)\b(.*)$/)
  if (parameter) {
    return parseParameter(parameter[1] as 'altitude' | 'heading' | 'speed', parameter[2] ?? '', text)
  }

  return noMatch('no_intent', text)
}

// --- Wire contract: server ⇄ bridge command channel (design §4) -------------
// The Nuxt server queues parsed commands per bridge token and piggybacks them
// on the existing telemetry POST response; the bridge executes and reports
// back by id. Kept here, next to the command type it carries, as the single
// source of truth for both server and client.

export interface PendingCommand {
  /** UUID, correlates the bridge's async command-result POST. */
  id: string
  /** ISO timestamp; the bridge/server discard commands older than the TTL. */
  issued_at: string
  command: SimControlCommand
}

export type SimControlCommandStatus = 'ok' | 'failed' | 'expired'

export interface SimControlCommandResult {
  id: string
  command: SimControlCommand
  status: SimControlCommandStatus
  reason: string | null
}

/**
 * Defensive re-validation for commands arriving over the wire (the enqueue
 * endpoint receives whatever the client posts, not necessarily this parser's
 * own output). Reuses SIM_CONTROL_LIMITS so there is exactly one place value
 * ranges are defined, per the fail-closed design.
 */
export function isValidSimControlCommand(value: unknown): value is SimControlCommand {
  if (!value || typeof value !== 'object') return false
  const cmd = value as Record<string, unknown>

  switch (cmd.type) {
    case 'set_altitude':
      return typeof cmd.altitude_ft === 'number' && inRange(cmd.altitude_ft, SIM_CONTROL_LIMITS.altitude_ft)
    case 'set_heading':
      return typeof cmd.heading_deg === 'number' && inRange(cmd.heading_deg, SIM_CONTROL_LIMITS.heading_deg)
    case 'set_speed':
      return typeof cmd.ias_kts === 'number' && inRange(cmd.ias_kts, SIM_CONTROL_LIMITS.ias_kts)
    case 'setup_approach': {
      if (typeof cmd.airport_icao !== 'string' || !/^[A-Z]{4}$/.test(cmd.airport_icao)) return false
      if (typeof cmd.runway !== 'string' || !/^(\d{2})[LRC]?$/.test(cmd.runway)) return false
      if (!inRange(Number(cmd.runway.slice(0, 2)), { min: 1, max: 36 })) return false
      if (cmd.altitude_ft !== undefined) {
        if (typeof cmd.altitude_ft !== 'number' || !inRange(cmd.altitude_ft, SIM_CONTROL_LIMITS.altitude_ft)) return false
      }
      if (cmd.final_distance_nm !== undefined) {
        if (typeof cmd.final_distance_nm !== 'number' || !inRange(cmd.final_distance_nm, SIM_CONTROL_LIMITS.final_distance_nm)) return false
      }
      return true
    }
    default:
      return false
  }
}

/** Short "say again" ATC reply for a gate-hit transmission whose slots failed to parse. */
export function simControlRejectionSpeech(reason: Exclude<SimControlNoMatchReason, 'no_intent'>): string {
  switch (reason) {
    case 'missing_value': return 'say again with a value'
    case 'missing_unit': return 'say again with altitude in feet'
    case 'out_of_range': return 'unable, value out of range, say again'
    case 'invalid_runway': return 'unable, invalid runway, say again'
    case 'missing_runway': return 'say again with the runway'
    case 'missing_airport': return 'say again with the airport'
  }
}

/** TTS confirmation/failure line for a resolved (or expired) bridge command. */
export function simControlResultSpeech(result: SimControlCommandResult): string {
  if (result.status === 'expired') return 'bridge did not respond'
  if (result.status === 'failed') return result.reason ? `unable, ${result.reason}` : 'unable to comply'

  const command = result.command
  switch (command.type) {
    case 'setup_approach':
      if (command.final_distance_nm) {
        return `repositioned, ${command.final_distance_nm} mile final runway ${command.runway}`
      }
      if (command.altitude_ft) {
        return `repositioned, runway ${command.runway} approach from ${command.altitude_ft} feet`
      }
      return `repositioned, runway ${command.runway} approach`
    case 'set_altitude':
      return `altitude set, ${command.altitude_ft} feet`
    case 'set_heading':
      return `heading set, ${command.heading_deg}`
    case 'set_speed':
      return `speed set, ${command.ias_kts} knots`
  }
}
