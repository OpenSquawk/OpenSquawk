/**
 * The traffic simulation itself: spawning aircraft and advancing them on a 1 Hz
 * tick (architecture design § 2).
 *
 * Deliberately 1-dimensional — distance along the route, altitude, speed. There
 * is no 2D radar picture because nothing needs one: positions only ever surface
 * in phraseology ("six miles final") and in the in-trail gap. A vector is booked
 * as time on the timeline rather than flown as a turn — acoustically identical,
 * an order of magnitude less code.
 */

import type { Rng } from './rng'
import type { GeneratedCallsign } from './callsign'
import { pilotVoiceFor } from '../voicePool'
import type { SimAircraft, SimPhase } from './types'

/** How fast IAS follows an assigned speed — roughly what a jet actually does. */
export const SPEED_DRIFT_KTS_PER_SEC = 1

/** Distance-to-field at which an arrival is handed from approach to tower. */
export const FINAL_HANDOVER_NM = 8

/** Where arrivals enter the picture. */
export const SPAWN_DISTANCE_MIN_NM = 25
export const SPAWN_DISTANCE_MAX_NM = 60

/** How much of the remaining route one fix represents. */
export const NM_PER_FIX = 8

const FIX_CONSONANTS = 'BCDFGKLMNPRSTVXZ'
const FIX_VOWELS = 'AEIOU'

/**
 * A small pool of invented but plausible-sounding 5-letter fixes per airport.
 * v1 does not load real procedure data — directs here are ear realism, not
 * navigation, and real SID/STAR fixes would be their own data project.
 */
export function generateFixPool(rng: Rng, count = 8): string[] {
  const fixes = new Set<string>()
  // Bounded so a pathological RNG can't spin here; the pool just ends up smaller.
  for (let attempt = 0; attempt < count * 10 && fixes.size < count; attempt++) {
    let name = ''
    for (let i = 0; i < 5; i++) {
      name += i % 2 === 0 ? rng.pick(FIX_CONSONANTS.split('')) : rng.pick(FIX_VOWELS.split(''))
    }
    fixes.add(name)
  }
  return [...fixes]
}

export type SpawnKind = 'arrival' | 'departure'

export interface SpawnOptions {
  rng: Rng
  nowSec: number
  frequency: string
  fixPool: readonly string[]
}

/** Arrivals start out on the STAR; departures start at the holding point. */
export function createSimAircraft(
  generated: GeneratedCallsign,
  kind: SpawnKind,
  opts: SpawnOptions,
): SimAircraft {
  const { rng, nowSec, frequency, fixPool } = opts
  const { callsign, callsignSpoken, type } = generated

  const routeFixCount = Math.min(fixPool.length, rng.int(2, 4))
  const routeFixes = Array.from({ length: routeFixCount }, () => rng.pick(fixPool))

  if (kind === 'departure') {
    return {
      callsign,
      callsignSpoken,
      type,
      voiceId: pilotVoiceFor(callsign),
      phase: 'taxi_out',
      frequency,
      routeFixes,
      distanceToFieldNm: 0,
      altitudeFt: 0,
      iasKts: 0,
      assignedSpeedKts: null,
      vectorDelaySec: 0,
      runwaySlot: null,
      nextEventAtSec: nowSec + rng.int(20, 60),
      quietUntilSec: 0,
    }
  }

  const distance = rng.float(SPAWN_DISTANCE_MIN_NM, SPAWN_DISTANCE_MAX_NM)
  return {
    callsign,
    callsignSpoken,
    type,
    voiceId: pilotVoiceFor(callsign),
    phase: 'inbound',
    frequency,
    routeFixes,
    distanceToFieldNm: distance,
    altitudeFt: rng.int(7, 12) * 1000,
    // Inbound and already speed-limited below 10,000 ft.
    iasKts: Math.max(type.approachKts, Math.min(250, type.cruiseKts * 0.55)),
    assignedSpeedKts: null,
    vectorDelaySec: 0,
    runwaySlot: null,
    nextEventAtSec: nowSec + rng.int(15, 45),
    quietUntilSec: 0,
  }
}

/** The linear phase order per flight kind. */
const ARRIVAL_PHASES: readonly SimPhase[] = ['inbound', 'approach', 'final', 'rollout', 'handed_off']
const DEPARTURE_PHASES: readonly SimPhase[] = ['taxi_out', 'lineup', 'takeoff', 'climbout', 'handed_off']

export function nextPhase(phase: SimPhase): SimPhase {
  const chain = ARRIVAL_PHASES.includes(phase) ? ARRIVAL_PHASES : DEPARTURE_PHASES
  const index = chain.indexOf(phase)
  if (index < 0 || index >= chain.length - 1) return 'handed_off'
  return chain[index + 1]!
}

export function isArrival(aircraft: Pick<SimAircraft, 'phase'>): boolean {
  return ARRIVAL_PHASES.includes(aircraft.phase)
}

/** Aircraft that have left the sector — the spawner reclaims their callsigns. */
export function isDespawnable(aircraft: Pick<SimAircraft, 'phase'>): boolean {
  return aircraft.phase === 'handed_off'
}

/**
 * One tick of 1D kinematics. Mutates in place — the pool owns these objects and
 * a tick runs every second, so copying them buys nothing.
 */
export function advanceAircraft(aircraft: SimAircraft, dtSec: number): void {
  if (dtSec <= 0) return

  // A vector is time, not geometry: while it burns down the aircraft holds its
  // distance to the field instead of closing.
  if (aircraft.vectorDelaySec > 0) {
    aircraft.vectorDelaySec = Math.max(0, aircraft.vectorDelaySec - dtSec)
    return
  }

  // IAS chases the assigned speed at ~1 kt/s, so later phraseology
  // ("12 miles, speed 180") stays consistent with the model.
  if (aircraft.assignedSpeedKts !== null) {
    const delta = aircraft.assignedSpeedKts - aircraft.iasKts
    const step = Math.min(Math.abs(delta), SPEED_DRIFT_KTS_PER_SEC * dtSec)
    aircraft.iasKts += Math.sign(delta) * step
  }

  switch (aircraft.phase) {
    case 'inbound':
    case 'approach':
    case 'final':
      aircraft.distanceToFieldNm = Math.max(0, aircraft.distanceToFieldNm - (aircraft.iasKts * dtSec) / 3600)
      aircraft.altitudeFt = Math.max(0, aircraft.altitudeFt - (aircraft.type.descentFpm * dtSec) / 60)
      break
    case 'takeoff':
    case 'climbout':
      aircraft.distanceToFieldNm += (aircraft.iasKts * dtSec) / 3600
      aircraft.altitudeFt += (aircraft.type.climbFpm * dtSec) / 60
      break
    case 'rollout':
      aircraft.iasKts = Math.max(0, aircraft.iasKts - 5 * dtSec)
      break
    default:
      break
  }
}

/** Move an aircraft to its next phase and schedule the following event. */
export function advancePhase(aircraft: SimAircraft, rng: Rng, nowSec: number): void {
  aircraft.phase = nextPhase(aircraft.phase)
  switch (aircraft.phase) {
    case 'takeoff':
      aircraft.iasKts = aircraft.type.approachKts + 20
      aircraft.nextEventAtSec = nowSec + rng.int(30, 60)
      break
    case 'climbout':
      aircraft.assignedSpeedKts = null
      aircraft.nextEventAtSec = nowSec + rng.int(60, 120)
      break
    case 'final':
      aircraft.assignedSpeedKts = aircraft.type.approachKts
      aircraft.nextEventAtSec = nowSec + rng.int(60, 120)
      break
    case 'handed_off':
      aircraft.nextEventAtSec = Number.POSITIVE_INFINITY
      break
    default:
      aircraft.nextEventAtSec = nowSec + rng.int(45, 90)
      break
  }
}

/**
 * The aircraft immediately ahead of `follower` on the same approach: the closest
 * one that is nearer to the field. Returns null when the follower is leading.
 */
export function findLeader(follower: SimAircraft, pool: readonly SimAircraft[]): SimAircraft | null {
  let leader: SimAircraft | null = null
  for (const other of pool) {
    if (other === follower || other.callsign === follower.callsign) continue
    if (!isArrival(other)) continue
    if (other.distanceToFieldNm >= follower.distanceToFieldNm) continue
    if (!leader || other.distanceToFieldNm > leader.distanceToFieldNm) leader = other
  }
  return leader
}
