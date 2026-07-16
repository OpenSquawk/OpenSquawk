/**
 * Callsign + type generation for simulated traffic, collision-free against the
 * user's own callsign (architecture design § 1).
 *
 * "Collision-free" here means three escalating rules, because the failure mode
 * is acoustic, not logical: the user must never think a call to someone else was
 * meant for them.
 *   1. exact   — never the user's callsign (long or short form)
 *   2. prefix  — never the user's airline designator at all
 *   3. phonetic— the spoken digit/letter tail must differ in at least two
 *                positions, so DLH39A never shares a frequency with BAW39A
 */

import { DEFAULT_AIRLINE_TELEPHONY, normalizeRadioPhrase } from '../radioSpeech'
import {
  simAircraftTypesByClass,
  type SimAircraftClass,
  type SimAircraftType,
} from '../../data/simAircraftTypes'
import type { TrafficTier } from '../../data/trafficTiers'
import type { Rng } from './rng'

/**
 * Only designators the radiotelephony normalizer already knows — an unknown one
 * would be spelled out letter by letter instead of spoken as an airline name.
 */
export const TRAFFIC_AIRLINES: readonly string[] = Object.keys(DEFAULT_AIRLINE_TELEPHONY)

/**
 * German GA registrations used by the VFR flows in useLiveAtcSession — always
 * blocked, since the user may be flying any of them.
 */
export const VFR_REGISTRATION_POOL: readonly string[] = [
  'D-EMIL', 'D-EKLM', 'D-ENNY', 'D-ELLA', 'D-EOMT', 'D-ELPC', 'D-EMTO', 'D-EBRA',
]

const GA_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Type mix per tier — the weights are the design's § 1 percentages. */
const TYPE_MIX: Readonly<Record<TrafficTier, readonly { value: SimAircraftClass; weight: number }[]>> = {
  major:    [{ value: 'narrowbody', weight: 70 }, { value: 'widebody', weight: 20 }, { value: 'regional', weight: 10 }],
  regional: [{ value: 'narrowbody', weight: 60 }, { value: 'regional', weight: 30 }, { value: 'ga', weight: 10 }],
  ga:       [{ value: 'ga', weight: 80 }, { value: 'regional', weight: 20 }],
}

/** Levenshtein distance — small strings only, the naive DP is plenty. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost)
    }
    prev = row
  }
  return prev[b.length]!
}

/** The part a listener actually confuses: everything after the airline designator. */
export function callsignTail(callsign: string): string {
  const cs = (callsign || '').toUpperCase().replace(/[\s-]/g, '')
  const airlineMatch = /^([A-Z]{3})([0-9].*)$/.exec(cs)
  if (airlineMatch) return airlineMatch[2]!
  // Registration (D-EMIL, N123AB): the tail is everything after the country prefix.
  const regMatch = /^([A-Z])([A-Z0-9]+)$/.exec(cs)
  if (regMatch) return regMatch[2]!
  return cs
}

/** The airline designator, or '' for a registration. */
export function callsignPrefix(callsign: string): string {
  const cs = (callsign || '').toUpperCase().replace(/[\s-]/g, '')
  const match = /^([A-Z]{3})[0-9]/.exec(cs)
  return match ? match[1]! : ''
}

export interface CallsignBlocklist {
  /** The user's callsign and short form, plus anything already spawned. */
  callsigns: readonly string[]
}

/**
 * Is `candidate` safe to put on the same frequency as everything in `blocked`?
 * Implements the three rules above; exported so the rule itself is testable
 * without driving the whole factory.
 */
export function isCallsignDistinct(candidate: string, blocked: readonly string[]): boolean {
  const cand = (candidate || '').toUpperCase().replace(/[\s-]/g, '')
  if (!cand) return false
  const candPrefix = callsignPrefix(cand)
  const candTail = callsignTail(cand)

  for (const raw of blocked) {
    const other = (raw || '').toUpperCase().replace(/[\s-]/g, '')
    if (!other) continue
    // 1. exact
    if (cand === other) return false
    // 2. prefix — no other aircraft from the user's airline at all
    const otherPrefix = callsignPrefix(other)
    if (candPrefix && otherPrefix && candPrefix === otherPrefix) return false
    // 3. phonetic — the spoken tail must differ in at least two positions
    if (levenshtein(candTail, callsignTail(other)) < 2) return false
  }
  return true
}

export interface CallsignFactoryOptions {
  rng: Rng
  tier: TrafficTier
  /** The user's callsign and short form — always blocked. */
  userCallsigns: readonly string[]
}

export interface GeneratedCallsign {
  callsign: string
  callsignSpoken: string
  type: SimAircraftType
}

/** Spoken form: 'DLH472' + heavy → 'Lufthansa four seven two heavy'. */
export function spokenCallsign(callsign: string, type: SimAircraftType): string {
  const suffix = type.heavyCallsign ? ` ${type.heavyCallsign}` : ''
  return normalizeRadioPhrase(`${callsign}${suffix}`, {
    expandCallsigns: true,
    airlineMap: DEFAULT_AIRLINE_TELEPHONY,
  }).trim()
}

/**
 * Generates callsign+type pairs that never collide with the user or with each
 * other. Keeps its own issued list, so a factory instance is the pool's memory.
 */
export function createCallsignFactory(options: CallsignFactoryOptions) {
  const { rng, tier, userCallsigns } = options
  const issued: string[] = []

  const permanentlyBlocked = [
    ...userCallsigns,
    // Any VFR registration the user could have been assigned.
    ...VFR_REGISTRATION_POOL,
  ].filter(Boolean)

  const blockedNow = () => [...permanentlyBlocked, ...issued]

  const rollType = (): SimAircraftType => {
    const cls = rng.weighted(TYPE_MIX[tier])
    const candidates = simAircraftTypesByClass(cls)
    return rng.pick(candidates)
  }

  const rollAirlineCallsign = (): string => {
    const airline = rng.pick(TRAFFIC_AIRLINES)
    const digits = rng.int(1, 4)
    let number = String(rng.int(1, 9))
    for (let i = 1; i < digits; i++) number += String(rng.int(0, 9))
    // A letter suffix on ~20% of flights, the way real schedules look.
    const suffix = rng.chance(0.2) ? rng.pick(GA_LETTERS.split('')) : ''
    return `${airline}${number}${suffix}`
  }

  const rollRegistration = (): string => {
    let letters = ''
    for (let i = 0; i < 3; i++) letters += rng.pick(GA_LETTERS.split(''))
    return `D-E${letters}`
  }

  /**
   * Returns null if no distinct callsign turned up within the attempt budget —
   * the caller simply doesn't spawn this tick rather than risking a confusable
   * one. With a 14-airline pool that effectively never happens.
   */
  const next = (): GeneratedCallsign | null => {
    for (let attempt = 0; attempt < 60; attempt++) {
      const type = rollType()
      const callsign = type.class === 'ga' ? rollRegistration() : rollAirlineCallsign()
      if (!isCallsignDistinct(callsign, blockedNow())) continue
      issued.push(callsign)
      return { callsign, callsignSpoken: spokenCallsign(callsign, type), type }
    }
    return null
  }

  const release = (callsign: string) => {
    const index = issued.indexOf(callsign)
    if (index >= 0) issued.splice(index, 1)
  }

  return { next, release, issued: () => [...issued] }
}
