import type { SimAircraftType } from '../../data/simAircraftTypes'

/**
 * Where a simulated aircraft is in its (deliberately 1-dimensional) life:
 * distance along a route, altitude and speed. No 2D radar picture — positions
 * only ever surface in phraseology ("six miles final") and in the in-trail gap
 * calculation, and that needs nothing more.
 */
export type SimPhase =
  | 'inbound' | 'approach' | 'final' | 'rollout'
  | 'taxi_out' | 'lineup' | 'takeoff' | 'climbout' | 'handed_off'

/** Runway timeline reservation, in sim seconds. */
export interface RunwaySlot {
  fromSec: number
  toSec: number
}

export interface SimAircraft {
  /** ICAO callsign as written, e.g. 'DLH472' or 'D-EKLM'. */
  callsign: string
  /** Full radiotelephony form, e.g. 'Lufthansa four seven two heavy'. */
  callsignSpoken: string
  type: SimAircraftType
  /** Stable across the session — hashed from the callsign, never persisted. */
  voiceId: string

  phase: SimPhase
  /** The frequency this aircraft is currently on; it is only audible on the tuned one. */
  frequency: string
  /** Remaining route; [0] is the next waypoint. */
  routeFixes: string[]
  distanceToFieldNm: number
  altitudeFt: number
  iasKts: number
  /** Last speed instruction issued, if any. */
  assignedSpeedKts: number | null
  /** Accumulated vectoring delay — a vector is booked as time, not flown geometrically. */
  vectorDelaySec: number
  runwaySlot: RunwaySlot | null
  /** Sim time of this aircraft's next planned radio event. */
  nextEventAtSec: number
  /**
   * No further instruction to this aircraft before this sim time. A controller
   * issues a clearance and then lets it take effect; without this the planner
   * re-derives the same unresolved condition every tick and nags the same
   * aircraft once a second.
   */
  quietUntilSec: number
}
