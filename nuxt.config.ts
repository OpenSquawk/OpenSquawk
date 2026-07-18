// nuxt.config.ts
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: false},
    ssr: false,
    typescript: {
        strict: false,
        typeCheck: true,
        tsConfig: {
            compilerOptions: {
                noUncheckedIndexedAccess: false,
                noImplicitOverride: false,
                lib: ['ESNext', 'dom', 'dom.iterable', 'webworker'],
                types: ['vite/client'],
            },
            vueCompilerOptions: {
                strictTemplates: false,
            },
        },
    },
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
    routeRules: {
        '/app/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/admin/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/bridge/connect': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/classroom/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/classroom-introduction': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/copilot': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/dev-login': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/editor/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/flightlab/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/forgot-password': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/invite': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/live-atc': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/login': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/logout': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/pilot-profile-setup': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/pm': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/present': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/start': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
        '/unsubscribe': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    },
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
        domeLightWebhookUrl: process.env.DOME_LIGHT_WEBHOOK_URL || 'https://home.io.faktorxmensch.com/api/webhook/lidl_stab_3modi_8492',
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        manualInvitePassword: process.env.MANUAL_INVITE_PASSWORD,
        mongoose: {
            uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/opensquawk',
            options: {},
        },
        public: {
            apiDocumentationUrl: '/api-docs',
            radioBackendUrl: process.env.NUXT_PUBLIC_RADIO_BACKEND_URL || 'http://127.0.0.1:8000',
            // Minimum word count for a voice (PTT) transmission to be used. Below
            // this the transcript is treated as STT noise/hallucination and
            // ignored. See the "STT MINIMUM-WORD GATE" in pages/live-atc.vue.
            pttMinWords: Number(process.env.NUXT_PUBLIC_PTT_MIN_WORDS || 2),
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
                    },
                    // Only used on /live-atc today (see app/composables/usePmTheme.ts) — not the app default.
                    opensquawkLight: {
                        dark: false,
                        colors: {
                            background: '#f4f6fb',
                            surface: '#ffffff',
                            primary: '#0891b2',
                            secondary: '#0369a1',
                            info: '#0891b2',
                            success: '#16a34a',
                            warning: '#d97706',
                            error: '#dc2626',
                            'on-background': '#0f1420',
                            'on-surface': '#0f1420'
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
        serverAssets: [
            { baseName: 'news', dir: '../content/news' },
        ],
        experimental: {
            websocket: true,
        },
        typescript: {
            strict: false,
            tsConfig: {
                compilerOptions: {
                    noUncheckedIndexedAccess: false,
                    noImplicitOverride: false,
                    lib: ['ESNext', 'dom', 'dom.iterable', 'webworker'],
                    types: ['node', 'vite/client'],
                },
            },
        },
    },
    image: {
        provider: process.env.NUXT_IMAGE_PROVIDER || 'ipx',
    },

})
