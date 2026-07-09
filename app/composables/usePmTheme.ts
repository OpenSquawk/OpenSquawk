import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useCookie } from '#imports'

export type PmThemePreference = 'system' | 'light' | 'dark'
export type PmEffectiveTheme = 'light' | 'dark'

const PM_THEME_COOKIE = 'os_pm_theme'

/**
 * /pm-scoped light/dark toggle. Defaults to dark (matching the rest of the app)
 * until the user explicitly picks Light or System, at which point that choice is
 * remembered and wins over the default. Only /pm has a light theme today — the
 * Vuetify theme is reset back to the app-wide dark default on unmount so other
 * pages are unaffected.
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
    })
  }

  watch(effectiveTheme, applyVuetifyTheme, { immediate: true })

  return { preference, effectiveTheme, setPreference }
}
