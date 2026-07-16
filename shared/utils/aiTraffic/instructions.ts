/**
 * The rule-based instruction planner (architecture design § 3, Fragen 4 + the
 * decision table). Zero LLM calls: every instruction the simulated traffic ever
 * receives is a finite, parameterised template — variance comes from the seeded
 * RNG picking between template variants, not from generation.
 */

import type { SimAircraftType } from '../../data/simAircraftTypes'
import type { Rng } from './rng'
import {
  DIRECT_HEADROOM_FACTOR,
  TERMINAL_STANDARD_NM,
  assessInTrail,
  departureWakeDelaySec,
  slotIsFree,
} from './separation'
import type { SimAircraft, SimPhase } from './types'

/**
 * Discrete speed steps a controller actually assigns, fastest first. The final
 * rung is the type's own approach speed ("reduce to final approach speed"), so
 * the usable ladder depends on the aircraft — see `speedLadderFor`.
 */
export const SPEED_LADDER: readonly number[] = [250, 220, 210, 190, 180, 170, 160]

/** Below this altitude 250 kt IAS is the ceiling for jets. */
export const SPEED_LIMIT_ALTITUDE_FT = 10000
export const SPEED_LIMIT_BELOW_KTS = 250

/** Phases in which an approach speed reduction makes any sense. */
const SPEED_CONTROL_PHASES: readonly SimPhase[] = ['inbound', 'approach']

/** Vectoring delay booked on the timeline instead of flying the turn geometrically. */
export const VECTOR_DELAY_MIN_SEC = 60
export const VECTOR_DELAY_MAX_SEC = 120

/**
 * The rungs available for one type: the fixed ladder down to its approach
 * speed, which is itself the last rung. A type whose Vref sits above a rung
 * simply never sees that rung.
 */
export function speedLadderFor(type: SimAircraftType): number[] {
  return [...SPEED_LADDER.filter(step => step > type.approachKts), type.approachKts]
}

/**
 * The next speed a controller may assign, or null when there is nothing legal
 * and useful left to say. Implements all four rules from the design at once:
 * one step per instruction, never above 250 below 10,000 ft, never below the
 * type's Vref, and never in a phase where it would be nonsense.
 */
export function nextSpeedStep(
  aircraft: Pick<SimAircraft, 'phase' | 'altitudeFt' | 'iasKts' | 'assignedSpeedKts' | 'type'>,
): number | null {
  // A Cessna gets no jet speed callouts at all — see slowestPracticalSpeech().
  if (aircraft.type.wake === 'L') return null
  if (!SPEED_CONTROL_PHASES.includes(aircraft.phase)) return null

  const current = aircraft.assignedSpeedKts ?? aircraft.iasKts
  const ceiling = aircraft.altitudeFt < SPEED_LIMIT_ALTITUDE_FT ? SPEED_LIMIT_BELOW_KTS : Infinity

  const candidate = speedLadderFor(aircraft.type).find(step => step < current && step <= ceiling)
  return candidate ?? null
}

/** True once speed control has nothing left to give and only a vector remains. */
export function isAtMinimumSpeed(
  aircraft: Pick<SimAircraft, 'phase' | 'altitudeFt' | 'iasKts' | 'assignedSpeedKts' | 'type'>,
): boolean {
  return nextSpeedStep(aircraft) === null
}

export interface DirectValidation {
  valid: boolean
  /** Index of the target fix in the remaining route (only when valid). */
  fixIndex?: number
  fix?: string
  /** NM the shortcut saves — used to keep distanceToFieldNm consistent. */
  savedNm?: number
  reason?: 'behind' | 'not_on_route' | 'no_headroom' | 'wrong_phase' | 'gap_conflict'
}

export interface DirectContext {
  /** Gap to the aircraft ahead, in NM. Infinity when there is nobody ahead. */
  gapNm: number
  requiredNm: number
  /** How much distance each skipped fix removes from the remaining route. */
  nmPerFix: number
}

/**
 * A direct is only ever a *reward* for a quiet picture, never a conflict
 * resolver — so it must be strictly ahead on the route, and the shortened
 * timeline must still respect the in-trail minimum afterwards. Failing either,
 * it is simply not generated.
 */
export function validateDirect(
  aircraft: Pick<SimAircraft, 'phase' | 'routeFixes'>,
  fix: string,
  ctx: DirectContext,
): DirectValidation {
  if (aircraft.phase !== 'inbound' && aircraft.phase !== 'approach') {
    return { valid: false, reason: 'wrong_phase' }
  }
  const index = aircraft.routeFixes.indexOf(fix)
  if (index < 0) return { valid: false, reason: 'not_on_route' }
  // Index 0 is the fix the aircraft is already proceeding to — "direct" to it is
  // a no-op, and anything at a lower index has been passed.
  if (index === 0) return { valid: false, reason: 'behind' }

  const savedNm = index * ctx.nmPerFix
  if (ctx.gapNm < ctx.requiredNm * DIRECT_HEADROOM_FACTOR) {
    return { valid: false, reason: 'no_headroom' }
  }
  // The shortcut eats into the gap to whoever is ahead — never issue one that
  // busts the minimum the moment it is read back.
  if (ctx.gapNm - savedNm < ctx.requiredNm) {
    return { valid: false, reason: 'gap_conflict' }
  }
  return { valid: true, fixIndex: index, fix, savedNm }
}

/** Apply an accepted direct to the aircraft state, so later phraseology stays consistent. */
export function applyDirect(aircraft: SimAircraft, validation: DirectValidation): void {
  if (!validation.valid || validation.fixIndex === undefined) return
  aircraft.routeFixes.splice(0, validation.fixIndex)
  aircraft.distanceToFieldNm = Math.max(0, aircraft.distanceToFieldNm - (validation.savedNm ?? 0))
}

// ── The decision table ────────────────────────────────────────────────────────

export type InstructionKind =
  | 'phase'
  | 'slot_hold'
  | 'wake_hold'
  | 'speed'
  | 'vector'
  | 'direct'
  | 'handover'
  | 'ambient'

export interface InstructionPlan {
  kind: InstructionKind
  callsign: string
  /** Speed instructions only. */
  speedKts?: number
  /** Vector instructions only. */
  headingDeg?: number
  vectorDelaySec?: number
  /** Direct instructions only. */
  direct?: DirectValidation
  /** Handover instructions only. */
  handoverStation?: string
  handoverFrequency?: string
  /** Wake/slot holds only — how long the aircraft is held. */
  holdSec?: number
}

/**
 * How long an aircraft is left alone after each kind of instruction — roughly
 * how long the instruction takes to actually change the picture. The one source
 * of truth for `SimAircraft.quietUntilSec`, shared by the scheduler and tests.
 */
export function cooldownSecFor(plan: InstructionPlan): number {
  switch (plan.kind) {
    // Let the aircraft decelerate before judging the gap again — IAS moves at
    // ~1 kt/s, so a 20 kt step needs ~20 s before it means anything.
    case 'speed': return 30
    // Fly the vector out, then a beat before "resume own navigation".
    case 'vector': return (plan.vectorDelaySec ?? 90) + 30
    // A treat, not a habit.
    case 'direct': return 120
    case 'wake_hold': return plan.holdSec ?? 60
    case 'slot_hold': return 45
    // It is leaving the frequency; there is nothing more to say to it.
    case 'handover': return Number.POSITIVE_INFINITY
    case 'ambient': return 90
    // The phase timeline (nextEventAtSec) already paces these.
    case 'phase': return 15
    default: return 30
  }
}

export interface PlannerContext {
  nowSec: number
  rng: Rng
  /** The aircraft immediately ahead on the approach, if any. */
  leader: Pick<SimAircraft, 'distanceToFieldNm' | 'type'> | null
  /** Everything currently reserving the runway, including the user's slot. */
  occupiedSlots: readonly { fromSec: number; toSec: number }[]
  /** The departure that most recently used the runway, for the wake timer. */
  lastDeparture: { type: SimAircraftType; atSec: number } | null
  /** Where this aircraft is handed to next, if it has reached a sector boundary. */
  handover: { station: string; frequency: string } | null
  /** NM each remaining fix represents — used for direct headroom. */
  nmPerFix: number
  /** How long the tuned frequency has been silent, for ambient chatter. */
  silentForSec: number
  /** Seeded threshold (45–90 s) above which ambient chatter may fire. */
  ambientAfterSec: number
}

function inTrailGap(aircraft: SimAircraft, ctx: PlannerContext) {
  if (!ctx.leader) {
    return {
      gapNm: Number.POSITIVE_INFINITY,
      requiredNm: TERMINAL_STANDARD_NM,
      needsAction: false,
      violated: false,
      gapSec: Number.POSITIVE_INFINITY,
    }
  }
  return assessInTrail({
    leaderDistanceNm: ctx.leader.distanceToFieldNm,
    leaderWake: ctx.leader.type.wake,
    followerDistanceNm: aircraft.distanceToFieldNm,
    followerWake: aircraft.type.wake,
    followerKts: aircraft.iasKts,
  })
}

/**
 * The design's rule table, evaluated per tick — first matching row wins.
 * Returns null when this aircraft has nothing to say right now.
 */
export function planInstruction(aircraft: SimAircraft, ctx: PlannerContext): InstructionPlan | null {
  const { rng } = ctx

  // One thing at a time. Most rows below test a condition that stays true until
  // the instruction has had time to work (a vector is still being flown, a wake
  // timer is still running), so without this the same row fires every tick and
  // the controller nags one aircraft into the ground.
  if (ctx.nowSec < aircraft.quietUntilSec) return null

  // Row 7 (sector boundary) is checked first among the event-driven rows: a
  // handover is the reason the phase timer fired in the first place.
  if (ctx.handover && aircraft.nextEventAtSec <= ctx.nowSec) {
    return {
      kind: 'handover',
      callsign: aircraft.callsign,
      handoverStation: ctx.handover.station,
      handoverFrequency: ctx.handover.frequency,
    }
  }

  // Row 3 — departure behind a heavy: the wake timer outranks the runway slot,
  // because it is the reason the slot has to move.
  if (aircraft.phase === 'lineup' && ctx.lastDeparture) {
    const required = departureWakeDelaySec(ctx.lastDeparture.type.wake, aircraft.type.wake)
    const elapsed = ctx.nowSec - ctx.lastDeparture.atSec
    if (required > 0 && elapsed < required) {
      return { kind: 'wake_hold', callsign: aircraft.callsign, holdSec: Math.ceil(required - elapsed) }
    }
  }

  // Row 2 — the runway slot collides with the user's reservation or another
  // aircraft's. Simulated traffic always yields.
  //
  // The aircraft's own reservation is in ctx.occupiedSlots (the caller passes the
  // whole runway timeline), so it has to come out first — otherwise every
  // aircraft conflicts with itself, forever, and holds instead of ever flying.
  if (aircraft.runwaySlot) {
    const others = ctx.occupiedSlots.filter(slot => slot !== aircraft.runwaySlot)
    if (!slotIsFree(aircraft.runwaySlot, others)) {
      return { kind: 'slot_hold', callsign: aircraft.callsign }
    }
  }

  // Row 1 — a phase change came due.
  if (aircraft.nextEventAtSec <= ctx.nowSec && aircraft.phase !== 'handed_off') {
    return { kind: 'phase', callsign: aircraft.callsign }
  }

  const gap = inTrailGap(aircraft, ctx)

  // Row 4 — closing up, but speed control still has a step left.
  if (gap.needsAction) {
    const step = nextSpeedStep(aircraft)
    if (step !== null) {
      return { kind: 'speed', callsign: aircraft.callsign, speedKts: step }
    }
    // Row 5 — minimum busted and already at the slowest practical speed.
    if (gap.violated) {
      return {
        kind: 'vector',
        callsign: aircraft.callsign,
        headingDeg: rng.int(1, 36) * 10,
        vectorDelaySec: rng.int(VECTOR_DELAY_MIN_SEC, VECTOR_DELAY_MAX_SEC),
      }
    }
  }

  // Row 6 — lots of air, a valid fix ahead, and the dice agree (rarely).
  if (aircraft.routeFixes.length > 1 && rng.chance(0.04)) {
    const fix = aircraft.routeFixes[aircraft.routeFixes.length - 1]!
    const direct = validateDirect(aircraft, fix, {
      gapNm: gap.gapNm,
      requiredNm: gap.requiredNm,
      nmPerFix: ctx.nmPerFix,
    })
    if (direct.valid) {
      return { kind: 'direct', callsign: aircraft.callsign, direct }
    }
  }

  // Row 8 — nothing to do and the frequency has been quiet for a while.
  if (ctx.silentForSec >= ctx.ambientAfterSec) {
    return { kind: 'ambient', callsign: aircraft.callsign }
  }

  return null
}

// ── Phraseology ───────────────────────────────────────────────────────────────

export interface RadioEvent {
  kind: InstructionKind
  callsign: string
  /** What the controller says. */
  atcText: string
  /** What the simulated pilot reads back — spoken in that aircraft's own voice. */
  pilotReadbackText: string
  /**
   * Who keys first. Every instruction is ATC-first; an ambient check-in is the
   * one event the aircraft initiates, and playing it the other way round would
   * sound like the controller talking to nobody.
   */
  order: 'atc_first' | 'pilot_first'
  /** State mutation to apply once the pair has actually been spoken. */
  plan: InstructionPlan
}

export interface RenderContext {
  rng: Rng
  /** e.g. 'Frankfurt Approach' — the station the traffic is talking to. */
  station: string
  runway: string
}

const pick = (rng: Rng, variants: readonly string[]) => rng.pick(variants)

/** GA aircraft never get a numeric jet speed — this is what they get instead. */
function slowestPracticalSpeech(callsign: string, rng: Rng): { atc: string; readback: string } {
  return {
    atc: pick(rng, [
      `${callsign}, reduce to slowest practical speed`,
      `${callsign}, make your approach speed as slow as practical`,
    ]),
    readback: `Slowest practical speed, ${callsign}`,
  }
}

function phaseSpeech(aircraft: SimAircraft, ctx: RenderContext): { atc: string; readback: string } {
  const { rng, runway } = ctx
  const cs = aircraft.callsign
  const miles = Math.max(1, Math.round(aircraft.distanceToFieldNm))
  switch (aircraft.phase) {
    case 'inbound':
      return {
        atc: pick(rng, [
          `${cs}, descend to altitude 4000 feet, QNH 1013`,
          `${cs}, descend altitude 5000 feet, expect ILS approach runway ${runway}`,
        ]),
        readback: `Descend 4000 feet, ${cs}`,
      }
    case 'approach':
      return {
        atc: pick(rng, [
          `${cs}, ${miles} miles from touchdown, cleared ILS approach runway ${runway}`,
          `${cs}, turn right heading 250, cleared ILS approach runway ${runway}`,
        ]),
        readback: `Cleared ILS approach runway ${runway}, ${cs}`,
      }
    case 'final':
      return {
        atc: pick(rng, [
          `${cs}, wind 250 degrees 8 knots, runway ${runway}, cleared to land`,
          `${cs}, runway ${runway}, cleared to land, wind 240 degrees 6 knots`,
        ]),
        readback: `Cleared to land runway ${runway}, ${cs}`,
      }
    case 'rollout':
      return {
        atc: pick(rng, [
          `${cs}, vacate via taxiway November, contact Ground 121.800`,
          `${cs}, turn right when able, contact Ground 121.800`,
        ]),
        readback: `Ground 121.800, ${cs}`,
      }
    case 'taxi_out':
      return {
        atc: pick(rng, [
          `${cs}, taxi to holding point runway ${runway} via taxiway November`,
          `${cs}, taxi holding point runway ${runway}, give way to the A320 from your right`,
        ]),
        readback: `Taxi holding point runway ${runway}, ${cs}`,
      }
    case 'lineup':
      return {
        atc: pick(rng, [
          `${cs}, runway ${runway}, line up and wait`,
          `${cs}, behind the landing traffic, line up and wait runway ${runway}`,
        ]),
        readback: `Line up and wait runway ${runway}, ${cs}`,
      }
    case 'takeoff':
      return {
        atc: pick(rng, [
          `${cs}, wind 250 degrees 8 knots, runway ${runway}, cleared for takeoff`,
          `${cs}, runway ${runway}, cleared for takeoff, wind 240 degrees 7 knots`,
        ]),
        readback: `Cleared for takeoff runway ${runway}, ${cs}`,
      }
    case 'climbout':
      return {
        atc: pick(rng, [
          `${cs}, climb to altitude 6000 feet`,
          `${cs}, continue climb altitude 5000 feet, resume own navigation`,
        ]),
        readback: `Climb 6000 feet, ${cs}`,
      }
    default:
      return { atc: `${cs}, roger`, readback: `${cs}` }
  }
}

function ambientSpeech(aircraft: SimAircraft, ctx: RenderContext): { atc: string; readback: string } {
  const { rng, station } = ctx
  const cs = aircraft.callsign
  const miles = Math.max(1, Math.round(aircraft.distanceToFieldNm))
  // Row 8: the aircraft checks in and the controller answers — the pair is
  // emitted pilot-first (see RadioEvent.order).
  return rng.pick([
    {
      readback: `${station}, ${cs}, passing altitude 7000 feet, information Kilo`,
      atc: `${cs}, ${station}, radar contact, continue as cleared`,
    },
    {
      readback: `${station}, ${cs}, ${miles} miles to run`,
      atc: `${cs}, ${station}, roger, no reported traffic ahead`,
    },
    {
      readback: `${station}, ${cs}, with you, descending altitude 5000 feet`,
      atc: `${cs}, ${station}, identified, expect vectors ILS runway ${ctx.runway}`,
    },
  ])
}

/** Turn a plan into the ATC call + the simulated pilot's readback. */
export function renderInstruction(
  aircraft: SimAircraft,
  plan: InstructionPlan,
  ctx: RenderContext,
): RadioEvent {
  const { rng, station, runway } = ctx
  const cs = aircraft.callsign
  let atcText: string
  let pilotReadbackText: string

  switch (plan.kind) {
    case 'speed': {
      if (aircraft.type.wake === 'L') {
        const speech = slowestPracticalSpeech(cs, rng)
        atcText = speech.atc
        pilotReadbackText = speech.readback
        break
      }
      atcText = pick(rng, [
        `${cs}, reduce speed to ${plan.speedKts} knots`,
        `${cs}, for spacing reduce speed to ${plan.speedKts} knots`,
        `${cs}, speed ${plan.speedKts} knots or less`,
      ])
      pilotReadbackText = `Speed ${plan.speedKts} knots, ${cs}`
      break
    }
    case 'vector': {
      atcText = pick(rng, [
        `${cs}, turn left heading ${plan.headingDeg}, vectors for spacing`,
        `${cs}, turn right heading ${plan.headingDeg}, vectors for sequencing`,
      ])
      pilotReadbackText = `Heading ${plan.headingDeg}, ${cs}`
      break
    }
    case 'direct': {
      const fix = plan.direct?.fix ?? aircraft.routeFixes[0] ?? 'the field'
      atcText = pick(rng, [
        `${cs}, proceed direct ${fix}`,
        `${cs}, when ready proceed direct ${fix}`,
      ])
      pilotReadbackText = `Direct ${fix}, ${cs}`
      break
    }
    case 'handover': {
      atcText = pick(rng, [
        `${cs}, contact ${plan.handoverStation} ${plan.handoverFrequency}, good day`,
        `${cs}, contact ${plan.handoverStation} on ${plan.handoverFrequency}, bye bye`,
      ])
      pilotReadbackText = `${plan.handoverFrequency}, ${cs}, good day`
      break
    }
    case 'wake_hold': {
      atcText = pick(rng, [
        `${cs}, hold position, wake turbulence delay`,
        `${cs}, hold short runway ${runway}, wake turbulence separation`,
      ])
      pilotReadbackText = `Holding, ${cs}`
      break
    }
    case 'slot_hold': {
      const arriving = aircraft.phase === 'inbound' || aircraft.phase === 'approach' || aircraft.phase === 'final'
      if (arriving) {
        atcText = pick(rng, [
          `${cs}, continue approach, expect late landing clearance`,
          `${cs}, continue approach runway ${runway}, landing clearance to follow`,
        ])
        pilotReadbackText = `Continue approach, ${cs}`
      } else {
        atcText = pick(rng, [
          `${cs}, hold position, traffic on the runway`,
          `${cs}, hold short runway ${runway}, one landing ahead of you`,
        ])
        pilotReadbackText = `Holding short runway ${runway}, ${cs}`
      }
      break
    }
    case 'ambient': {
      const speech = ambientSpeech(aircraft, ctx)
      atcText = speech.atc
      pilotReadbackText = speech.readback
      break
    }
    case 'phase':
    default: {
      const speech = phaseSpeech(aircraft, ctx)
      atcText = speech.atc
      pilotReadbackText = speech.readback
      break
    }
  }

  return {
    kind: plan.kind,
    callsign: cs,
    atcText,
    pilotReadbackText,
    order: plan.kind === 'ambient' ? 'pilot_first' : 'atc_first',
    plan,
  }
}
