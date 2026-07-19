/**
 * The one voice pool for the whole product — shared infrastructure for both
 * `ai-traffic` (a stable voice per simulated aircraft) and the `multi-voice`
 * roadmap item (a rotating voice per ATC position). Two disjoint partitions, one
 * assignment function; deliberately not two systems (architecture design § 7).
 *
 * Assignment is a pure hash of the callsign / position, so the same "DLH472"
 * sounds the same all session — and across sessions — without persisting any
 * assignment state anywhere.
 */

/** Voices for ATC positions. `alloy` is today's hard-coded controller voice. */
export const CONTROLLER_VOICES: readonly string[] = ['alloy', 'echo', 'onyx', 'sage']

/** Voices for simulated pilots' readbacks. Disjoint from CONTROLLER_VOICES. */
export const PILOT_VOICES: readonly string[] = ['ash', 'ballad', 'coral', 'fable', 'nova', 'shimmer']

/**
 * Never hand these to a simulated pilot: `verse` already belongs to the user's
 * own readback (`speakPilotReadback`), and the live controller voice must stay
 * distinguishable from the traffic around it.
 */
export const RESERVED_VOICES: readonly string[] = ['verse', 'alloy']

/** FNV-1a, 32-bit. Small, stable, and dependency-free — good enough to bucket strings. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    // hash * 16777619, kept in 32-bit unsigned range without BigInt.
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

/**
 * Murmur3 finalizer (fmix32). FNV-1a's low bits barely avalanche: for the
 * live-atc persona keys (shared session prefix, `:TYPE:freq` suffix) the raw
 * hash mod 4 was identical for every position of a session — one voice for
 * Delivery, Ground and Tower, 100% of the time. Mixing before the modulo
 * makes every input bit reach the low bits.
 */
export function mix32(hash: number): number {
  let h = hash >>> 0
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b) >>> 0
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b6ae35) >>> 0
  h ^= h >>> 16
  return h >>> 0
}

/**
 * Pick a voice from `pool` for `key`, skipping anything in `reserved`.
 * Walks forward from the hashed index so a collision with a reserved voice
 * degrades to the next pool entry instead of failing.
 */
export function voiceFromPool(
  key: string,
  pool: readonly string[],
  reserved: readonly string[] = RESERVED_VOICES,
): string {
  const usable = pool.filter(v => !reserved.includes(v))
  const candidates = usable.length ? usable : pool
  if (!candidates.length) throw new Error('voiceFromPool: empty voice pool')
  return candidates[mix32(fnv1a(key)) % candidates.length]!
}

/**
 * The stable voice of a simulated aircraft. `reserved` lets a caller exclude the
 * controller voice that is live right now (relevant once `multi-voice` rotates
 * it), on top of the permanently reserved ones.
 */
export function pilotVoiceFor(callsign: string, reserved: readonly string[] = RESERVED_VOICES): string {
  return voiceFromPool(callsign.toUpperCase(), PILOT_VOICES, reserved)
}

/**
 * The voice of an ATC position (`multi-voice`). Traffic doesn't call this yet —
 * it exists so the future feature reuses this pool rather than inventing a
 * second assignment path.
 */
export function controllerVoiceFor(position: string): string {
  return voiceFromPool(position.toUpperCase(), CONTROLLER_VOICES, [])
}

export type ControllerPersona = {
  voice: string
  /** Controllers talk fast — base pace per position, 1.1–1.3. */
  baseSpeed: number
}

/**
 * The persona of an ATC position for one session. Key convention:
 * `<sessionSeed>:<airport>:<positionType>[:<frequency>]` — the session seed
 * makes each session sound like a different shift while the position keeps
 * one consistent controller within the session.
 */
export function controllerPersonaFor(positionKey: string): ControllerPersona {
  const key = positionKey.toUpperCase()
  const voice = voiceFromPool(key, CONTROLLER_VOICES, [])
  // Independent hash stream for speed so voice and pace don't correlate.
  const baseSpeed = 1.1 + (mix32(fnv1a(`speed:${key}`)) % 21) / 100
  return { voice, baseSpeed: Math.round(baseSpeed * 100) / 100 }
}

/**
 * Per-transmission pace: the persona's base speed ±0.05 — real controllers
 * don't hit the exact same tempo twice.
 */
export function transmissionSpeed(baseSpeed: number, rng: () => number = Math.random): number {
  const jitter = (rng() * 2 - 1) * 0.05
  return Math.round((baseSpeed + jitter) * 100) / 100
}

/**
 * Selectable classroom instructor voices. The instructor is a single voice
 * (not a live position), so it may draw from any pool voice. Labels/accents
 * mirror the Speaches mapping in server/utils/voiceRegistry.ts.
 */
export type ClassroomVoiceOption = {
  id: string
  label: string
  accent: 'US' | 'GB'
  gender: 'male' | 'female'
}

export const CLASSROOM_VOICE_OPTIONS: readonly ClassroomVoiceOption[] = [
  { id: 'alloy', label: 'Ryan', accent: 'US', gender: 'male' },
  { id: 'onyx', label: 'John', accent: 'US', gender: 'male' },
  { id: 'coral', label: 'Joe', accent: 'US', gender: 'male' },
  { id: 'nova', label: 'Bryce', accent: 'US', gender: 'male' },
  { id: 'fable', label: 'Amy', accent: 'US', gender: 'female' },
  { id: 'shimmer', label: 'Kristin', accent: 'US', gender: 'female' },
  { id: 'sage', label: 'Hannah', accent: 'US', gender: 'female' },
  { id: 'echo', label: 'Jenny', accent: 'GB', gender: 'female' },
  { id: 'ash', label: 'Alan', accent: 'GB', gender: 'male' },
  { id: 'ballad', label: 'Alba', accent: 'GB', gender: 'female' },
]

/** Default classroom instructor voice — the standard US speaker (Ryan). */
export const CLASSROOM_DEFAULT_VOICE = 'alloy'

/** Settings sentinel: pick a stable random voice per module instead of one fixed voice. */
export const CLASSROOM_RANDOM_VOICE = 'random'

const CLASSROOM_VOICE_POOL: readonly string[] = CLASSROOM_VOICE_OPTIONS.map(o => o.id)

/**
 * A stable random classroom instructor voice for `key` (e.g. a module id),
 * drawn from every selectable classroom voice — one instructor per lesson,
 * consistent while it lasts.
 */
export function classroomVoiceFor(key: string): string {
  return voiceFromPool(key, CLASSROOM_VOICE_POOL, [])
}
