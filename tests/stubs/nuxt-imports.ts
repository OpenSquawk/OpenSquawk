export function useRuntimeConfig() {
    return {
        openaiKey: process.env.OPENAI_API_KEY || '',
        openaiProject: process.env.OPENAI_PROJECT || '',
        openaiBaseUrl: process.env.OPENAI_BASE_URL || '',
        jwtSecret: process.env.JWT_SECRET || '',
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
        manualInvitePassword: process.env.MANUAL_INVITE_PASSWORD || '',
        llmModel: process.env.OPENAI_LLM_MODEL || 'gpt-5-nano',
        ttsModel: process.env.OPENAI_TTS_MODEL || 'tts-1',
        defaultVoiceId: process.env.OPENAI_VOICE_ID || 'alloy',
        openaipApiKey: process.env.OPENAIP_API_KEY || '',
        usePiper: process.env.USE_PIPER ?? false,
        piperPort: process.env.PIPER_PORT ?? 5001,
        useSpeaches: process.env.USE_SPEACHES ?? false,
        speachesBaseUrl: process.env.SPEACHES_BASE_URL || '',
        speechModelId: process.env.SPEECH_MODEL_ID || 'speaches-ai/piper-en_US-ryan-low',
    }
}
