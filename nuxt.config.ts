// nuxt.config.ts
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const HOTJAR_MODULE_NAME = 'nuxt-module-hotjar';
const HOTJAR_ID = 6522897;
const HOTJAR_VERSION = 6;

const hasHotjarModule = (() => {
    try {
        require.resolve(HOTJAR_MODULE_NAME);
        return true;
    } catch {
        return false;
    }
})();

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    ssr: false,
    modules: [
      'vuetify-nuxt-module',
      '@nuxtjs/tailwindcss',
      'nuxt-aos',
      '@pinia/nuxt',
      'nuxt-mongoose',
      ...(hasHotjarModule ? [HOTJAR_MODULE_NAME] : []),
    ],
    aos: {once: true, duration: 600, easing: 'ease-out'},
    app: {head: {link: [{rel: 'icon', type: 'image/jpeg', href: '/img/logo.jpeg'}]}},
    runtimeConfig: {
        openaiKey: process.env.OPENAI_API_KEY,
        llmModel: process.env.LLM_MODEL || 'gpt-5-nano',
        ttsModel: process.env.TTS_MODEL || 'tts-1',
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
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
        '~/assets/css/global.css', '~/assets/css/opensquawk-glass.css'
    ],
    ...(hasHotjarModule
        ? {
              hotjar: {
                  id: HOTJAR_ID,
                  sv: HOTJAR_VERSION,
              },
          }
        : {}),
});
