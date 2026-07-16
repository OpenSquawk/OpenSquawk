/**
 * Separation rules for the simulated traffic (architecture design § 3, Frage 2).
 *
 * Two invariants, checked every tick:
 *   - in-trail gap on a shared approach path: max(terminal standard, wake matrix)
 *   - runway occupancy: never two clearances with overlapping slots
 *
 * The user's aircraft is never a simulated position — it is a slot reservation
 * that simulated traffic always yields to. A conflict therefore always resolves
 * by slowing, vectoring or holding the *simulated* aircraft.
 */

import type { WakeCategory } from '../../data/simAircraftTypes'
import type { RunwaySlot } from './types'

/** Radar separation in the terminal area, before any wake supplement. */
export const TERMINAL_STANDARD_NM = 3

/** Buffer on top of the requirement at which the planner starts acting. */
export const SPACING_TRIGGER_FACTOR = 1.2

/** Gap above which a direct becomes a plausible reward rather than a risk. */
export const DIRECT_HEADROOM_FACTOR = 2

/**
 * Required in-trail distance, leader → follower, on the same approach track.
 * These are absolute minima in NM (not supplements): a Medium behind a Heavy
 * needs 5 NM rather than the standard 3. Pairs with no entry are covered by the
 * terminal standard alone.
 */
const WAKE_MATRIX: Readonly<Partial<Record<WakeCategory, Partial<Record<WakeCategory, number>>>>> = {
  J: { H: 6, M: 7, L: 8 },
  H: { H: 4, M: 5, L: 6 },
  M: { L: 5 },
  L: {},
}

/** The wake-derived minimum for a pair, or 0 when the category needs no supplement. */
export function wakeSeparationNm(leader: WakeCategory, follower: WakeCategory): number {
  return WAKE_MATRIX[leader]?.[follower] ?? 0
}

/** What the follower actually has to hold: the stricter of standard and wake. */
export function requiredGapNm(leader: WakeCategory, follower: WakeCategory): number {
  return Math.max(TERMINAL_STANDARD_NM, wakeSeparationNm(leader, follower))
}

/** Convert a distance gap into the time it buys at the follower's speed. */
export function gapToTimeSec(gapNm: number, groundspeedKts: number): number {
  if (groundspeedKts <= 0) return Number.POSITIVE_INFINITY
  return (gapNm / groundspeedKts) * 3600
}

/** Act before the minimum is actually busted — the 20% buffer from the design. */
export function needsSpacing(gapNm: number, required: number): boolean {
  return gapNm < required * SPACING_TRIGGER_FACTOR
}

/** The minimum is (or is about to be) busted and speed alone won't fix it. */
export function isGapViolated(gapNm: number, required: number): boolean {
  return gapNm < required
}

/**
 * Time-based departure wake separation: a Light/Medium behind a Heavy/Super
 * waits ~3 minutes, a Heavy behind a Heavy ~2. Same-category non-heavy pairs are
 * separated by runway occupancy alone, not by time.
 */
export function departureWakeDelaySec(leader: WakeCategory, follower: WakeCategory): number {
  const leaderIsHeavy = leader === 'H' || leader === 'J'
  if (!leaderIsHeavy) return 0
  const followerIsHeavy = follower === 'H' || follower === 'J'
  return followerIsHeavy ? 120 : 180
}

export function slotsOverlap(a: RunwaySlot, b: RunwaySlot): boolean {
  return a.fromSec < b.toSec && b.fromSec < a.toSec
}

export function slotIsFree(candidate: RunwaySlot, occupied: readonly RunwaySlot[]): boolean {
  return !occupied.some(slot => slotsOverlap(candidate, slot))
}

/**
 * Push `desired` later until it clears everything in `occupied`, preserving its
 * duration. Simulated traffic always yields, so this only ever moves forward.
 */
export function nextFreeSlot(desired: RunwaySlot, occupied: readonly RunwaySlot[]): RunwaySlot {
  const duration = desired.toSec - desired.fromSec
  let from = desired.fromSec
  // Each pass can only be blocked by a slot that ends later than the last one we
  // cleared, so the loop is bounded by the number of occupied slots.
  for (let pass = 0; pass <= occupied.length; pass++) {
    const candidate = { fromSec: from, toSec: from + duration }
    const blocker = occupied.find(slot => slotsOverlap(candidate, slot))
    if (!blocker) return candidate
    from = blocker.toSec
  }
  return { fromSec: from, toSec: from + duration }
}

export interface InTrailPair {
  /** Distance to the field of the aircraft ahead, in NM. */
  leaderDistanceNm: number
  leaderWake: WakeCategory
  followerDistanceNm: number
  followerWake: WakeCategory
  /** Follower's current speed — turns the distance gap into a closing rate. */
  followerKts: number
}

export interface InTrailAssessment {
  gapNm: number
  requiredNm: number
  /** Within the 20% buffer: start reducing speed. */
  needsAction: boolean
  /** Minimum busted: speed is no longer enough. */
  violated: boolean
  /** How long the current gap lasts at the follower's speed. */
  gapSec: number
}

/**
 * The one place the in-trail invariant is evaluated. Distances are 1D along the
 * approach: the follower is further from the field than the leader.
 */
export function assessInTrail(pair: InTrailPair): InTrailAssessment {
  const gapNm = Math.max(0, pair.followerDistanceNm - pair.leaderDistanceNm)
  const requiredNm = requiredGapNm(pair.leaderWake, pair.followerWake)
  return {
    gapNm,
    requiredNm,
    needsAction: needsSpacing(gapNm, requiredNm),
    violated: isGapViolated(gapNm, requiredNm),
    gapSec: gapToTimeSec(gapNm, pair.followerKts),
  }
}
