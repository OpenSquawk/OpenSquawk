/**
 * Maps the product-wide logical voice ids (shared/utils/voicePool.ts — OpenAI
 * voice names) to Speaches model+voice pairs. The client keeps sending pool
 * names; only the Speaches branch of /api/atc/say resolves them here, so the
 * same ids work unchanged on the OpenAI provider.
 *
 * Speaches auto-downloads missing `speaches-ai/piper-*` models on first use;
 * the Kokoro voices all live in one multi-voice model. Controllers get the
 * Kokoro speakers (heard most, best quality), pilots the distinct Piper
 * speakers — the pools stay disjoint so traffic never sounds like the
 * controller talking to itself. Selection follows the curated radio set
 * (see docs/plans/2026-07-19-phraseology-taxi-finetune-design.md).
 */

export type SpeachesVoice = { model: string; voice: string }

export const KOKORO_MODEL = 'speaches-ai/Kokoro-82M-v1.0-ONNX'

const piper = (voice: string): SpeachesVoice => ({
  model: `speaches-ai/piper-${voice}`,
  voice,
})

const kokoro = (voice: string): SpeachesVoice => ({ model: KOKORO_MODEL, voice })

export const SPEACHES_VOICE_MAP: Record<string, SpeachesVoice> = {
  // Controller pool (CONTROLLER_VOICES)
  alloy: kokoro('bm_george'),
  echo: kokoro('bf_emma'),
  onyx: kokoro('am_michael'),
  sage: kokoro('af_heart'),
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
