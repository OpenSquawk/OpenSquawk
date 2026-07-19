/**
 * Maps the product-wide logical voice ids (shared/utils/voicePool.ts — OpenAI
 * voice names) to Speaches/Piper model+voice pairs. The client keeps sending
 * pool names; only the Speaches branch of /api/atc/say resolves them here, so
 * the same ids work unchanged on the OpenAI provider.
 *
 * Speaches auto-downloads missing `speaches-ai/piper-*` models on first use.
 * Controller voices (alloy/echo/onyx/sage) and pilot voices (verse + the
 * PILOT_VOICES pool) map to disjoint speakers so traffic never sounds like
 * the controller talking to itself.
 */

export type SpeachesVoice = { model: string; voice: string }

const piper = (voice: string): SpeachesVoice => ({
  model: `speaches-ai/piper-${voice}`,
  voice,
})

export const SPEACHES_VOICE_MAP: Record<string, SpeachesVoice> = {
  // Controller pool (CONTROLLER_VOICES)
  alloy: piper('en_US-ryan-medium'),
  echo: piper('en_GB-alan-medium'),
  onyx: piper('en_US-john-medium'),
  sage: piper('en_GB-jenny_dioco-medium'),
  // The user's own readback voice (speakPilotReadback)
  verse: piper('en_US-lessac-medium'),
  // Simulated pilot pool (PILOT_VOICES)
  ash: piper('en_US-joe-medium'),
  ballad: piper('en_GB-northern_english_male-medium'),
  coral: piper('en_US-amy-medium'),
  fable: piper('en_US-danny-low'),
  nova: piper('en_US-hfc_female-medium'),
  shimmer: piper('en_US-kristin-medium'),
}

export function resolveSpeachesVoice(logical: string, fallback: SpeachesVoice): SpeachesVoice {
  const key = (logical || '').trim().toLowerCase()
  return SPEACHES_VOICE_MAP[key] ?? fallback
}
