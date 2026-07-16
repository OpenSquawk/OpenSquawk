/**
 * Seeded RNG for the simulated background traffic. Everything random about the
 * traffic — callsigns, type mix, timing jitter, template variants — runs through
 * one of these, so a session is reproducible from its seed alone. That keeps bug
 * reports actionable and lets the sim core be tested without mocking anything
 * (architecture design § 0).
 */

import { fnv1a } from '../voicePool'

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number
  /** Uniform integer in [min, max] (inclusive). */
  int(min: number, max: number): number
  /** Uniform float in [min, max). */
  float(min: number, max: number): number
  /** Uniform element. Throws on an empty list. */
  pick<T>(items: readonly T[]): T
  /** True with probability `p`. */
  chance(p: number): boolean
  /**
   * Element picked by relative weight. Weights must be non-negative and sum > 0.
   */
  weighted<T>(entries: readonly { value: T; weight: number }[]): T
}

/** mulberry32 — 32-bit state, good distribution, five lines. */
export function createRng(seed: string | number): Rng {
  let state = (typeof seed === 'number' ? seed >>> 0 : fnv1a(seed)) >>> 0
  // A zero state degenerates mulberry32 into a constant stream.
  if (state === 0) state = 0x9e3779b9

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const rng: Rng = {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max) => min + next() * (max - min),
    pick: <T>(items: readonly T[]): T => {
      if (!items.length) throw new Error('Rng.pick: empty list')
      return items[Math.floor(next() * items.length)]!
    },
    chance: p => next() < p,
    weighted: <T>(entries: readonly { value: T; weight: number }[]): T => {
      const total = entries.reduce((sum, e) => sum + Math.max(0, e.weight), 0)
      if (!entries.length || total <= 0) throw new Error('Rng.weighted: no positive weights')
      let roll = next() * total
      for (const entry of entries) {
        roll -= Math.max(0, entry.weight)
        if (roll < 0) return entry.value
      }
      return entries[entries.length - 1]!.value
    },
  }
  return rng
}

/**
 * The session seed: session id + calendar day. Same session on the same day
 * replays identically; a new session gets fresh traffic.
 */
export function trafficSeed(sessionId: string, date: Date = new Date()): string {
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  return `${sessionId}|${day}`
}
