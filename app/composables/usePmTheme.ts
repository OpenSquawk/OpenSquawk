import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useCookie } from '#imports'

export type PmThemePreference = 'system' | 'light' | 'dark'
export type PmEffectiveTheme = 'light' | 'dark'

const PM_THEME_COOKIE = 'os_pm_theme'

/**
 * /live-atc-scoped light/dark toggle (formerly /pm — cookie name kept for
 * backwards compatibility). Defaults to dark (matching the rest of the app)
 * until the user explicitly picks Light or System, at which point that choice is
 * remembered and wins over the default. Only /live-atc has a light theme today —
 * the Vuetify theme is reset back to the app-wide dark default on unmount so
 * other pages are unaffected.
 */
export function usePmTheme() {
  const vuetifyTheme = useTheme()
  const storedPreference = useCookie<PmThemePreference | null>(PM_THEME_COOKIE, {
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  const preference = ref<PmThemePreference>(storedPreference.value ?? 'dark')
  const systemPrefersLight = ref(false)

  const effectiveTheme = computed<PmEffectiveTheme>(() => {
    if (preference.value === 'system') {
      return systemPrefersLight.value ? 'light' : 'dark'
    }
    return preference.value
  })

  function applyVuetifyTheme() {
    vuetifyTheme.global.name.value = effectiveTheme.value === 'light' ? 'opensquawkLight' : 'opensquawkDark'
  }

  function setPreference(next: PmThemePreference) {
    preference.value = next
    storedPreference.value = next
  }

  // Mirrors effectiveTheme onto <html data-theme="..."> so the --bg/--text/--border
  // CSS variables (defined in global.css) reach content that escapes .pm-page in the
  // DOM — Vuetify teleports menus, dialogs, and tooltips to <body>, where they'd
  // otherwise only see the app-wide dark defaults from :root.
  function applyDocumentTheme() {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', effectiveTheme.value)
    }
  }

  if (typeof window !== 'undefined') {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    systemPrefersLight.value = media.matches

    const handleChange = (event: MediaQueryListEvent) => {
      systemPrefersLight.value = event.matches
    }
    media.addEventListener('change', handleChange)

    onBeforeUnmount(() => {
      media.removeEventListener('change', handleChange)
      vuetifyTheme.global.name.value = 'opensquawkDark'
      document.documentElement.removeAttribute('data-theme')
    })
  }

  watch(effectiveTheme, () => {
    applyVuetifyTheme()
    applyDocumentTheme()
  }, { immediate: true })

  return { preference, effectiveTheme, setPreference }
}
