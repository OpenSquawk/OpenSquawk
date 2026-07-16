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
  return candidates[fnv1a(key) % candidates.length]!
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
