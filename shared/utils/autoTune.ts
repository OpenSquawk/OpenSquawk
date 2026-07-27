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
export interface AutoTuneSchedulerDeps {
  /** Speak and log the announcement. Called immediately, before the wait. */
  announce: (text: string) => void
  /** Dial the frequency in. Called only if the change is still due. */
  tune: (frequency: string) => void
  /** The session the change belongs to; a different one invalidates it. */
  currentSessionId: () => string | null
  /** What is tuned right now; a change means the pilot reached for the radio. */
  currentActive: () => string | undefined
  setTimeoutFn?: (fn: () => void, ms: number) => unknown
  clearTimeoutFn?: (handle: unknown) => void
  /** Reason a pending change was dropped, for the log. */
  onCancelled?: (reason: 'session_changed' | 'tuned_manually' | 'superseded') => void
}

export interface AutoTuneScheduler {
  /** Announce and schedule, or do nothing when no change is due. */
  schedule: (input: AutoTuneInput) => AutoTunePlan | null
  /** Drop a pending change without tuning. */
  cancel: () => void
  readonly pending: boolean
}

/**
 * Announces the change, waits, then makes it — unless something happened in
 * between that means it should no longer happen.
 *
 * The wait is where this earns its keep: between announcing and tuning, the
 * session can end, the pilot can tune the radio themselves, or another handoff
 * can supersede this one. All three must drop the change silently rather than
 * moving the radio out from under the pilot.
 */
export function createAutoTuneScheduler(deps: AutoTuneSchedulerDeps): AutoTuneScheduler {
  const setTimer = deps.setTimeoutFn ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = deps.clearTimeoutFn ?? ((h) => clearTimeout(h as any))

  let handle: unknown = null

  const cancel = () => {
    if (handle !== null) {
      clearTimer(handle)
      handle = null
    }
  }

  return {
    get pending() {
      return handle !== null
    },
    cancel,
    schedule(input: AutoTuneInput) {
      if (handle !== null) {
        cancel()
        deps.onCancelled?.('superseded')
      }
      const plan = planAutoTune(input)
      if (!plan) return null

      deps.announce(plan.announcement)
      const sessionAtArm = deps.currentSessionId()
      const activeAtArm = deps.currentActive()

      handle = setTimer(() => {
        handle = null
        if (deps.currentSessionId() !== sessionAtArm) {
          deps.onCancelled?.('session_changed')
          return
        }
        if (deps.currentActive() !== activeAtArm) {
          deps.onCancelled?.('tuned_manually')
          return
        }
        deps.tune(plan.frequency)
      }, plan.delayMs)

      return plan
    },
  }
}

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
