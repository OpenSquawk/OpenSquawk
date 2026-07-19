/**
 * Maps the product-wide logical voice ids (shared/utils/voicePool.ts — OpenAI
 * voice names) to Speaches model+voice pairs. The client keeps sending pool
 * names; only the Speaches branch of /api/atc/say resolves them here, so the
 * same ids work unchanged on the OpenAI provider.
 *
 * Speaches auto-downloads missing `speaches-ai/piper-*` models on first use.
 * Every pool voice is a distinct Piper speaker — Piper synthesizes fast
 * enough for radio latency, and the pools stay disjoint so traffic never
 * sounds like the controller talking to itself. Selection follows the
 * curated radio set (docs/plans/2026-07-19-phraseology-taxi-finetune-design.md).
 */

export type SpeachesVoice = { model: string; voice: string }

/**
 * Kokoro's shared multi-voice model. Not used for any pool voice: it
 * generates several times slower than Piper, which showed up directly as
 * multi-second ATC reply latency. Kept for explicit opt-in mappings only.
 */
export const KOKORO_MODEL = 'speaches-ai/Kokoro-82M-v1.0-ONNX'

const piper = (voice: string): SpeachesVoice => ({
  model: `speaches-ai/piper-${voice}`,
  voice,
})

export const SPEACHES_VOICE_MAP: Record<string, SpeachesVoice> = {
  // Controller pool (CONTROLLER_VOICES). Piper only: Kokoro-82M generates
  // several times slower and made every ATC reply audibly late — controllers
  // are the latency-critical voices. `alloy` is the product-wide default and
  // stays the standard US speaker.
  alloy: piper('en_US-ryan-medium'),
  echo: piper('en_GB-jenny_dioco-medium'),
  onyx: piper('en_US-john-medium'),
  sage: piper('en_US-hfc_female-medium'),
  // The user's own readback voice (speakPilotReadback)
  verse: piper('en_US-lessac-medium'),
  // Simulated pilot pool (PILOT_VOICES)
  ash: piper('en_GB-alan-medium'),
  ballad: piper('en_GB-alba-medium'),
  coral: piper('en_US-joe-medium'),
  fable: piper('en_US-amy-medium'),
  nova: piper('en_US-bryce-medium'),
  shimmer: piper('en_US-kristin-medium'),
}

/**
 * ATIS is a robotic broadcast in the real world — it gets a dedicated speaker
 * outside every pool so it never sounds like a controller or a pilot.
 */
export const ATIS_SPEACHES_VOICE: SpeachesVoice = piper('en_US-ljspeech-high')

export function resolveSpeachesVoice(
  logical: string,
  fallback: SpeachesVoice,
  tag?: string,
): SpeachesVoice {
  if ((tag || '').trim().toLowerCase() === 'atis') return ATIS_SPEACHES_VOICE
  const key = (logical || '').trim().toLowerCase()
  return SPEACHES_VOICE_MAP[key] ?? fallback
}
