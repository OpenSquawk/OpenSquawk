/**
 * How busy a frequency should sound: airport tier × time-of-day band → target
 * number of simultaneously active simulated aircraft.
 *
 * There is no traffic-volume data source anywhere in the product (the airport
 * API only returns frequencies), so this is a deliberately small, hand-curated
 * model per the architecture design (§ 8). Order of resolution:
 *   1. curated map → 2. heuristic over the already-loaded frequency list →
 *   3. hard default 'regional', so the feature never falls flat on an unknown
 *      airport, it is just moderately busy there.
 */

export type TrafficTier = 'major' | 'regional' | 'ga'

/** Curated starting set — trivially extendable, no completeness claim. */
export const AIRPORT_TRAFFIC_TIERS: Readonly<Record<string, TrafficTier>> = {
  // Germany
  EDDF: 'major', EDDM: 'major', EDDL: 'major', EDDB: 'major',
  EDDH: 'regional', EDDK: 'regional', EDDS: 'regional', EDDV: 'regional',
  EDDN: 'regional', EDDP: 'regional', EDDG: 'regional', EDDR: 'regional',
  EDFE: 'ga', EDFH: 'ga', EDMA: 'ga', EDNY: 'ga', EDLW: 'ga', EDLP: 'ga',
  // Europe
  EHAM: 'major', EGLL: 'major', LFPG: 'major', LEMD: 'major', LEBL: 'major',
  LIRF: 'major', LSZH: 'major', LOWW: 'major', EKCH: 'major', ESSA: 'major',
  EGKK: 'regional', EGCC: 'regional', LFPO: 'regional', LIMC: 'regional',
  LSGG: 'regional', EBBR: 'regional', LPPT: 'regional', EIDW: 'regional',
  // Beyond
  KJFK: 'major', KLAX: 'major', KORD: 'major', KATL: 'major',
  OMDB: 'major', OTHH: 'major', RJTT: 'major', WSSS: 'major',
}

export const TRAFFIC_TIER_BASE: Readonly<Record<TrafficTier, number>> = {
  major: 4,
  regional: 2,
  ga: 1,
}

/** Population cap — protects the speech queue and the TTS budget. */
export const MAX_ACTIVE_TRAFFIC = 5

/** The subset of frequency types the heuristic treats as a staffed ATC position. */
const CONTROLLER_FREQ_TYPES = new Set(['DEL', 'CLD', 'GND', 'TWR', 'APP', 'DEP'])

export interface TierHeuristicInput {
  /** Frequency `type` codes already loaded for the airport (ATIS, GND, TWR, …). */
  frequencyTypes: readonly string[]
}

/**
 * Fallback when the airport isn't in the curated map: infer busy-ness from how
 * many distinct controller positions the airport publishes. A field with
 * Delivery + Ground + Tower + Approach/Departure is a major airport by any
 * practical measure; a field with a Tower is at least regional.
 */
export function trafficTierFromFrequencies(input: TierHeuristicInput): TrafficTier {
  const types = new Set(
    input.frequencyTypes
      .map(t => (t || '').toUpperCase().trim())
      .filter(t => CONTROLLER_FREQ_TYPES.has(t)),
  )
  if (types.size >= 4) return 'major'
  if (types.has('TWR')) return 'regional'
  return 'ga'
}

/**
 * Resolve the tier for an airport: curated map first, then the frequency
 * heuristic, then the 'regional' default.
 */
export function resolveTrafficTier(
  icao: string | undefined | null,
  frequencyTypes: readonly string[] = [],
): TrafficTier {
  const key = (icao || '').toUpperCase().trim()
  const curated = AIRPORT_TRAFFIC_TIERS[key]
  if (curated) return curated
  if (frequencyTypes.length) return trafficTierFromFrequencies({ frequencyTypes })
  return 'regional'
}

/**
 * Time-of-day multiplier in coarse bands. The user's local clock stands in for
 * the airport's local time — training happens "on site" in practice, and a
 * longitude-derived local time isn't worth the complexity in v1.
 */
export function timeOfDayFactor(localHour: number): number {
  const h = Math.floor(localHour)
  if (h >= 22 || h <= 5) return 0.2  // night
  if (h >= 6 && h <= 9) return 1.3   // morning bank
  if (h >= 10 && h <= 15) return 1.0 // day
  if (h >= 16 && h <= 20) return 1.3 // evening bank
  return 0.6                          // 21:00 — winding down
}

/**
 * Target population of simultaneously active simulated aircraft.
 * `ga` at night resolves to 0 — a dead GA frequency at 03:00 is correct.
 */
export function targetTrafficCount(tier: TrafficTier, localHour: number): number {
  const raw = Math.round(TRAFFIC_TIER_BASE[tier] * timeOfDayFactor(localHour))
  return Math.max(0, Math.min(MAX_ACTIVE_TRAFFIC, raw))
}
