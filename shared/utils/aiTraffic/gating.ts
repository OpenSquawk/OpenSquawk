/**
 * The gating chain (architecture design § 3, Frage 10) — the hard "traffic never
 * talks over the user" guarantee, as one pure function.
 *
 * Evaluated at TWO points: before enqueuing a traffic pair, and again inside the
 * speech task when it actually starts playing. Seconds can pass between the two,
 * and a gate that was open at enqueue time means nothing at playback time.
 *
 * "Only one transmitter at a time" is handled structurally elsewhere — traffic
 * runs through the same serial speech queue as real ATC. This chain answers the
 * different question of *whether the frequency belongs to the user right now*.
 */

/**
 * How long after an ATC instruction the frequency stays reserved for the user's
 * readback. Taken literally, `backendExpectedPhrase` is set almost permanently
 * (the flow alternates ATC/pilot states), which would mute traffic forever and
 * make the feature pointless. So the lock protects the *fresh* readback window
 * instead: absolute silence from the moment ATC speaks until the user answers,
 * but at least this long. After it, ambient chatter may resume — a real
 * frequency also keeps working when a pilot dawdles, and the flow's own silence
 * timer runs independently of this.
 *
 * Set it to Infinity for the literal-strict reading: same chain, one parameter,
 * no second code path.
 */
export const DEFAULT_READBACK_PROTECTION_MS = 12_000

export interface ReadbackWindow {
  /** Role of the flow state the session is currently on. */
  currentStateRole: 'pilot' | 'atc' | 'system' | undefined
  /** The backend's authoritative expected pilot phrase, if it wants one. */
  backendExpectedPhrase: string | null
  /** When the ATC instruction that opened this window was spoken (epoch ms). */
  lastControllerSpeechAtMs: number | null
  nowMs: number
  readbackProtectionMs?: number
}

/**
 * True while ATC is still owed a fresh readback from the user.
 *
 * Both base signals must hold — the flow is on a pilot state AND the backend
 * actually named a phrase it expects — and the protection window must still be
 * open. Once the window lapses the user is simply taking their time, which is
 * not a reason to keep the whole frequency silent.
 */
export function readbackPending(win: ReadbackWindow): boolean {
  if (win.currentStateRole !== 'pilot') return false
  if (!win.backendExpectedPhrase) return false
  if (win.lastControllerSpeechAtMs === null) return false

  const protectionMs = win.readbackProtectionMs ?? DEFAULT_READBACK_PROTECTION_MS
  if (protectionMs === Number.POSITIVE_INFINITY) return true
  return win.nowMs - win.lastControllerSpeechAtMs < protectionMs
}

export interface GateInput {
  /** The settings toggle. */
  aiTrafficEnabled: boolean
  /** The user is holding PTT — absolute, no window, no exception. */
  isRecording: boolean
  /** A user transmission is waiting on the backend — equally absolute. */
  transmitInFlight: boolean
  /** True while the session exists and the monitor screen is up. */
  sessionActive: boolean
  readback: ReadbackWindow
}

export type GateBlockReason =
  | 'disabled'
  | 'recording'
  | 'transmit_in_flight'
  | 'readback_pending'
  | 'session_inactive'

export interface GateResult {
  open: boolean
  /** Why it's shut — surfaced in the debug log, and what the tests assert on. */
  reason?: GateBlockReason
}

/**
 * The chain itself. Ordered so the reason reported is the most specific one:
 * a disabled toggle outranks everything, then the two absolute user-owns-the-
 * frequency signals, then the softer readback window.
 */
export function evaluateGate(input: GateInput): GateResult {
  if (!input.aiTrafficEnabled) return { open: false, reason: 'disabled' }
  if (input.isRecording) return { open: false, reason: 'recording' }
  if (input.transmitInFlight) return { open: false, reason: 'transmit_in_flight' }
  if (!input.sessionActive) return { open: false, reason: 'session_inactive' }
  if (readbackPending(input.readback)) return { open: false, reason: 'readback_pending' }
  return { open: true }
}

export function gateOpen(input: GateInput): boolean {
  return evaluateGate(input).open
}
