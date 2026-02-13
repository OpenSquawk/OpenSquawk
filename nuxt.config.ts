// nuxt.config.ts
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: false},
    ssr: false,
    modules: [
      'vuetify-nuxt-module',
      '@nuxtjs/tailwindcss',
      'nuxt-aos',
      '@pinia/nuxt',
      'nuxt-mongoose',
      '@nuxt/image',
      'nuxt-module-hotjar',
    ],
    hotjar: {
        hotjarId: 6522897,
        scriptVersion: 6,
        debug: process.env.NODE_ENV !== 'production',
    },
    aos: {once: true, duration: 600, easing: 'ease-out'},
    app: {head: {link: [{rel: 'icon', type: 'image/jpeg', href: '/img/icon-sm.jpeg'}]}},
    runtimeConfig: {
        openaiKey: process.env.OPENAI_API_KEY,
        openaiProject: process.env.OPENAI_PROJECT,
        openaiBaseUrl: process.env.OPENAI_BASE_URL,
        llmModel: process.env.LLM_MODEL || 'gpt-5-nano',
        ttsModel: process.env.TTS_MODEL || 'tts-1',
        defaultVoiceId: process.env.VOICE_ID || 'alloy',
        openaipApiKey: process.env.OPENAIP_API_KEY,
        usePiper: process.env.USE_PIPER,
        piperPort: process.env.PIPER_PORT,
        useSpeaches: process.env.USE_SPEACHES,
        speachesBaseUrl: process.env.SPEACHES_BASE_URL,
        speechModelId: process.env.SPEECH_MODEL_ID,
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        manualInvitePassword: process.env.MANUAL_INVITE_PASSWORD,
        mongoose: {
            uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/opensquawk',
            options: {},
        },
        public: {
            apiDocumentationUrl: '/api-docs',
        },
    },
    vuetify: {
        vuetifyOptions: {
            theme: {
                defaultTheme: 'opensquawkDark',
                themes: {
                    opensquawkDark: {
                        dark: true,
                        colors: {
                            background: '#0b1020',
                            surface: '#0a0f1c',
                            primary: '#22d3ee',
                            secondary: '#0ea5e9',
                            info: '#22d3ee',
                            success: '#22c55e',
                            warning: '#f59e0b',
                            error: '#ef4444',
                            // Text-Kontrast
                            'on-background': '#ffffff',
                            'on-surface': '#ffffff'
                        }
                    }
                }
            }
        }
    },
    css: [
        '~/assets/css/global.css',
        '~/assets/css/opensquawk-glass.css',
        '~/assets/css/learn-theme.css'
    ],
    nitro: {
        experimental: {
            websocket: true,
        },
    },

})