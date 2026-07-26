/**
 * Automatic frequency changes after a handoff.
 *
 * Tuning is manual: ATC hands you to the next frequency, and until you dial it
 * in, nothing you say goes through. Auto-tune does the dialling for you a few
 * seconds after the handoff has been accepted, announcing it first so it is
 * never a surprise.
 *
 * The decision is deliberately made from state rather than from an event: tune
 * when the state the session is now resting on expects a frequency we are not
 * on. That is exactly the condition a correct handoff readback creates, and it
 * is self-guarding against the two cases that must NOT tune — a wrong readback
 * or one not yet given both leave the session on the old state, which still
 * expects the frequency already tuned, so no change is due.
 */

import { normalizedFrequencyValue } from './frequency'

/** How long to wait between the announcement and the change. */
export const AUTO_TUNE_DELAY_MS = 3000

export interface AutoTuneInput {
  /** Off by default is the caller's choice; this only reads the setting. */
  enabled: boolean
  /** The frequency currently dialled in. */
  active: string | undefined
  /** What the state the session now rests on expects. */
  expected: string | undefined
  /**
   * Every frequency valid for the current position. A position may publish
   * more than one, and being on any of them is already correct.
   */
  accepted?: string[]
}

export interface AutoTunePlan {
  /** The frequency to dial in. */
  frequency: string
  /** Spoken before the change, so the pilot knows what is happening. */
  announcement: string
  delayMs: number
}

export function announcementFor(frequency: string): string {
  return `OpenSquawk changing frequency to ${frequency}`
}

/**
 * The change due right now, or null when none is.
 */
export function planAutoTune(input: AutoTuneInput): AutoTunePlan | null {
  if (!input.enabled) return null

  const expected = (input.expected || '').trim()
  if (!expected) return null

  const active = normalizedFrequencyValue(input.active)
  const target = normalizedFrequencyValue(expected)
  if (!target) return null

  // Already on a frequency this position publishes — nothing to do.
  const accepted = (input.accepted ?? []).map(normalizedFrequencyValue).filter(Boolean)
  if (accepted.length ? accepted.includes(active) : active === target) return null

  return {
    frequency: expected,
    announcement: announcementFor(expected),
    delayMs: AUTO_TUNE_DELAY_MS,
  }
}
