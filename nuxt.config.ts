// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    modules: ['vuetify-nuxt-module', '@nuxtjs/tailwindcss', 'nuxt-aos'],
    aos: {once: true, duration: 600, easing: 'ease-out'},
    runtimeConfig: {
        openaiKey: process.env.OPENAI_API_KEY,     // server-only
        llmModel: process.env.LLM_MODEL || 'gpt-5-nano',
        ttsModel: process.env.TTS_MODEL || 'tts-1',
        public: {}
    }
})
