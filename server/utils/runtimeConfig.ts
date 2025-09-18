import { useRuntimeConfig } from '#imports'

export interface ServerRuntimeConfig {
  openaiKey: string
  openaiProject?: string
  llmModel: string
  ttsModel: string
  voiceId: string
  usePiper: boolean
  piperPort: number
  useSpeaches: boolean
  speachesBaseUrl?: string
  speechModelId: string
}

let cachedConfig: ServerRuntimeConfig | null = null
let warnedMissingOpenAIKey = false

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (!normalized) {
      return fallback
    }
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false
    }
  }
  return fallback
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return fallback
}

export function getServerRuntimeConfig(): ServerRuntimeConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const runtimeConfig = useRuntimeConfig()

  const openaiKey = String(runtimeConfig.openaiKey || '').trim()
  if (!openaiKey && !warnedMissingOpenAIKey) {
    console.warn('[OpenSquawk] OPENAI_API_KEY fehlt. Einige KI-Funktionen stehen ohne Schlüssel nicht zur Verfügung.')
    warnedMissingOpenAIKey = true
  }

  const config: ServerRuntimeConfig = {
    openaiKey,
    openaiProject: String(runtimeConfig.openaiProject || '').trim() || undefined,
    llmModel: String(runtimeConfig.llmModel || '').trim() || 'gpt-5-nano',
    ttsModel: String(runtimeConfig.ttsModel || '').trim() || 'tts-1',
    voiceId: String(runtimeConfig.defaultVoiceId || '').trim() || 'alloy',
    usePiper: toBoolean(runtimeConfig.usePiper),
    piperPort: toNumber(runtimeConfig.piperPort, 5001),
    useSpeaches: toBoolean(runtimeConfig.useSpeaches),
    speachesBaseUrl: String(runtimeConfig.speachesBaseUrl || '').trim() || undefined,
    speechModelId: String(runtimeConfig.speechModelId || '').trim() || 'speaches-ai/piper-en_US-ryan-low',
  }

  cachedConfig = config
  return config
}

export function resetServerRuntimeConfigCache() {
  cachedConfig = null
}
