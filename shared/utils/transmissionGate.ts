/**
 * Decides whether a pilot transmission carries enough content to be graded.
 *
 * Push-to-talk produces a lot of non-transmissions: a stray tap, an open mic on
 * a noisy flight deck, a syllable clipped off when the key is released early.
 * Whisper never returns "nothing" for those — it returns punctuation, a
 * fragment, or one of a small set of phrases it hallucinates on near-silence
 * ("Thank you.", "Bye."). Sent on, each of those is graded as a wrong readback,
 * counts toward the three-strikes skip, and costs an LLM router call.
 *
 * The gate has to stay open for the short calls that are genuinely valid,
 * though: "roger" and "wilco" are one word each and are exactly what a pilot
 * says. So word count alone cannot decide — standard phraseology is recognised
 * first, and only then does the length rule apply.
 */

export type TransmissionGateReason =
  | 'empty'
  | 'no_speech'
  | 'hallucination'
  | 'too_short'

export interface TransmissionGateOptions {
  /** Typed input is never gated: a short command was deliberate. */
  source: 'text' | 'ptt'
  /** Minimum word count for a PTT transmission; 1 disables the length rule. */
  minPttWords: number
  /**
   * Fields the current state expects to hear read back. A bare acknowledgement
   * is not a valid readback, but it is still a real transmission and must reach
   * the engine so the controller can ask again — never swallowed here.
   */
  readbackRequired?: string[]
}

export interface TransmissionGateResult {
  accept: boolean
  /** Why it was dropped — logged so an ignored transmission can be traced. */
  reason?: TransmissionGateReason
}

/**
 * Standard transmissions that are complete in one or two words. Kept as whole
 * phrases rather than a word list so "say again" survives the length rule.
 */
const VALID_SHORT_CALLS = [
  'roger', 'wilco', 'affirm', 'affirmative', 'negative', 'standby', 'stand by',
  'mayday', 'pan pan', 'correction', 'disregard', 'go ahead', 'say again',
  'unable', 'copied', 'copy', 'checked', 'ready', 'holding', 'wait',
]

/**
 * What Whisper writes when it hears nothing. These are ordinary English, so
 * they can only be rejected as a *whole* transcript — "thank you, good day" is
 * a real sign-off and must pass.
 */
const HALLUCINATIONS = [
  'thank you', 'thanks', 'thanks for watching', 'thank you for watching',
  'bye', 'goodbye', 'bye bye', 'okay', 'ok', 'you', 'the', 'so', 'yeah',
  'please subscribe', 'subscribe', 'music', 'applause', 'silence',
  'transcription by castingwords', 'i love you',
]

/** Lowercase, strip punctuation, collapse whitespace. */
function canonical(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function gateTransmission(
  transcript: string,
  options: TransmissionGateOptions,
): TransmissionGateResult {
  const raw = transcript.trim()
  if (!raw) return { accept: false, reason: 'empty' }

  // Punctuation, dashes, musical notes — audio with no words in it.
  if (!/[a-z0-9]/i.test(raw)) return { accept: false, reason: 'no_speech' }

  // Typed input is deliberate; only genuinely empty input is refused.
  if (options.source !== 'ptt') return { accept: true }

  const normalized = canonical(raw)
  if (!normalized) return { accept: false, reason: 'no_speech' }

  if (HALLUCINATIONS.includes(normalized)) {
    return { accept: false, reason: 'hallucination' }
  }

  // Standard phraseology passes however short it is.
  if (VALID_SHORT_CALLS.includes(normalized)) return { accept: true }

  const words = normalized.split(' ').filter(Boolean)
  if (words.length < Math.max(1, options.minPttWords)) {
    return { accept: false, reason: 'too_short' }
  }

  return { accept: true }
}
