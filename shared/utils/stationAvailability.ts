/**
 * Which ground stations are on offer, and which of them you could actually
 * reach from where you are.
 *
 * Two separate questions, deliberately kept apart:
 *
 * 1. **On offer** — whose frequencies appear in the radio at all. A session
 *    only ever loaded one airport's, so on a departure the destination's tower
 *    never appeared no matter how close you got.
 *
 * 2. **Reachable** — VHF is line-of-sight, so a station 200 nm away is not
 *    workable from the ground and is from the cruise. That needs a position.
 *
 * The governing constraint is that the software has to work with no bridge
 * connected, which is the normal case for someone practising without a
 * simulator. So position is an *enhancement*, never a requirement: without one
 * both airports are offered and nothing is marked unreachable, because a
 * station that cannot be proven out of range must not be taken away.
 */

export type AirportRole = 'departure' | 'destination'

export interface StationPosition {
  lat: number
  lon: number
}

/**
 * Radio-horizon constant for distance in nautical miles from height in feet.
 * The standard 1.23·√ft, which already includes atmospheric refraction.
 */
const RADIO_HORIZON_NM_PER_SQRT_FT = 1.23

/** Assumed height of a ground station's antenna. Adds its own horizon. */
const GROUND_ANTENNA_FT = 50

/**
 * Line-of-sight range between an aircraft at this height and a ground station.
 * Both horizons add: each can see the other from its own share of the distance.
 */
export function vhfRangeNm(altitudeFt: number): number {
  const aircraft = Math.max(0, Number(altitudeFt) || 0)
  return RADIO_HORIZON_NM_PER_SQRT_FT * (Math.sqrt(aircraft) + Math.sqrt(GROUND_ANTENNA_FT))
}

export interface ReachabilityInput {
  /** Great-circle distance to the station, or undefined when unknown. */
  distanceNm?: number
  /** Aircraft height, or undefined when unknown. */
  altitudeFt?: number
}

/**
 * Whether the station is workable. Unknown inputs are treated as reachable —
 * silencing a frequency we cannot prove is out of range would break the
 * no-bridge case, where nothing about position is known at all.
 */
export function stationReachable(input: ReachabilityInput): boolean {
  const { distanceNm, altitudeFt } = input
  if (!Number.isFinite(distanceNm as number)) return true
  if (!Number.isFinite(altitudeFt as number)) return true
  return (distanceNm as number) <= vhfRangeNm(altitudeFt as number)
}

/**
 * Phases in which the departure airport is the one being worked. Used only as
 * the no-position fallback; with a position, range decides.
 */
const DEPARTURE_PHASES = new Set(['clearance', 'taxi', 'tower', 'departure'])

export interface OfferedAirportsInput {
  departureIcao?: string
  destinationIcao?: string
  /** The flow's current phase, e.g. "clearance", "tower", "approach". */
  phase?: string
}

export interface OfferedAirport {
  icao: string
  role: AirportRole
  /**
   * True for the airport the current phase is being flown at. The radio uses
   * it to decide what to show first, not what to allow.
   */
  primary: boolean
}

/**
 * Both airports of the flight, with the one belonging to the current phase
 * marked primary.
 *
 * Both are always offered. Without a position that is the only sensible
 * answer, and with one it is still right: which station you can *reach* is the
 * range question, and answering it by hiding the airport would mean a pilot
 * could never dial ahead to the destination.
 */
export function offeredAirports(input: OfferedAirportsInput): OfferedAirport[] {
  const phase = (input.phase || '').toLowerCase()
  const departurePrimary = !phase || DEPARTURE_PHASES.has(phase)

  const out: OfferedAirport[] = []
  const dep = input.departureIcao?.trim().toUpperCase()
  const dest = input.destinationIcao?.trim().toUpperCase()

  if (dep) out.push({ icao: dep, role: 'departure', primary: departurePrimary })
  if (dest && dest !== dep) {
    out.push({ icao: dest, role: 'destination', primary: !departurePrimary })
  }
  return out
}
