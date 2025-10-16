export function useRuntimeConfig() {
    return {
        openaiKey: process.env.OPENAI_API_KEY || '',
        openaiProject: process.env.OPENAI_PROJECT || '',
        openaiBaseUrl: process.env.OPENAI_BASE_URL || '',
        llmModel: process.env.OPENAI_LLM_MODEL || 'gpt-5-nano',
        ttsModel: process.env.OPENAI_TTS_MODEL || 'tts-1',
        defaultVoiceId: process.env.OPENAI_VOICE_ID || 'alloy',
        openaipApiKey: process.env.OPENAIP_API_KEY || '',
        usePiper: false,
        piperPort: 5001,
        useSpeaches: false,
        speachesBaseUrl: '',
        speechModelId: 'speaches-ai/piper-en_US-ryan-low',
    }
}
