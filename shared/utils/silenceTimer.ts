/**
 * Which silence timer, if any, applies to the state the session is resting on.
 *
 * Two different waits look the same from the outside but mean opposite things:
 *
 * - **auto-advance** — the pilot owes nothing. The takeoff roll, a climb to the
 *   cleared level: ATC carries on by itself once enough time has passed, and the
 *   window is long because nothing is wrong.
 *
 * - **readback** — the pilot owes a mandatory readback and has not given it. A
 *   controller chases that within seconds, so the window is short. These states
 *   carry no `auto_advance_timeout_ms` (they wait for the pilot rather than
 *   advancing on their own), which is why the timer was never armed for them at
 *   all and the re-request never fired.
 */

export type SilenceTimerKind = 'auto_advance' | 'readback'

export interface SilenceTimerState {
  auto_advance_on_silence?: boolean
  auto_advance_timeout_ms?: number
  readback_required?: string[]
  /** Server-side policy, published on readback states by the runtime tree. */
  readback_silence_ms?: number
}

export interface SilenceTimerWindow {
  kind: SilenceTimerKind
  ms: number
}

/** Never fire faster than this, whatever the flow or server says. */
const MIN_WINDOW_MS = 1000

export const DEFAULT_AUTO_ADVANCE_MS = 30_000
/** Only used when the backend published no window (older server). */
export const DEFAULT_READBACK_SILENCE_MS = 12_000

export function silenceWindowFor(
  state: SilenceTimerState | null | undefined,
): SilenceTimerWindow | null {
  if (!state) return null

  // Auto-advance wins: a state carrying it has an explicit flow-authored window.
  if (state.auto_advance_on_silence) {
    return {
      kind: 'auto_advance',
      ms: Math.max(MIN_WINDOW_MS, Number(state.auto_advance_timeout_ms ?? DEFAULT_AUTO_ADVANCE_MS)),
    }
  }

  if (state.readback_required?.length) {
    return {
      kind: 'readback',
      ms: Math.max(MIN_WINDOW_MS, Number(state.readback_silence_ms ?? DEFAULT_READBACK_SILENCE_MS)),
    }
  }

  return null
}
