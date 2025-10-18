<template>
  <v-app>
    <NuxtPage/>
    <CookieConsentBanner v-if="showCookieBanner"/>
  </v-app>
</template>
<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useHotjar, useRoute, useState } from '#imports';
import { useAuthStore } from '~/stores/auth';
import { HOTJAR_LOCAL_STORAGE_KEY, useCookieConsent } from '~/composables/useCookieConsent';

const HOTJAR_ID = 6522897;
const HOTJAR_SCRIPT_VERSION = 6;
const HOTJAR_INIT_DELAY = 500;

declare global {
  interface Window {
    hj?: ((...args: unknown[]) => void) & { q?: unknown[][] };
    _hjOptOut?: boolean;
  }
}

const route = useRoute();
const authStore = useAuthStore();
const { hasConsent, analyticsEnabled } = useCookieConsent();
const { initialize } = useHotjar();
const hotjarInitialized = useState('hotjar-initialized', () => false);

const showCookieBanner = computed(() => {
  if (!authStore.isAuthenticated) {
    return true;
  }

  return route.path === '/';
});

const setHotjarOptOut = (optOut: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }

  window._hjOptOut = optOut;

  if (optOut && typeof window.hj === 'function') {
    try {
      window.hj('event', 'cookie_consent_opt_out');
    } catch {
      // ignore errors when notifying Hotjar of opt-out
    }
  }
};

const persistLocalPreference = (value: 'granted' | 'denied' | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (value === null) {
    window.localStorage.removeItem(HOTJAR_LOCAL_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(HOTJAR_LOCAL_STORAGE_KEY, value);
};

const scheduleHotjarInitialization = () => {
  if (hotjarInitialized.value || typeof window === 'undefined') {
    return;
  }

  hotjarInitialized.value = true;

  window.setTimeout(() => {
    initialize(HOTJAR_ID, HOTJAR_SCRIPT_VERSION);
  }, HOTJAR_INIT_DELAY);
};

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const storedPreference = window.localStorage.getItem(HOTJAR_LOCAL_STORAGE_KEY);

  if (storedPreference === 'granted') {
    setHotjarOptOut(false);
    scheduleHotjarInitialization();
  }

  if (storedPreference === 'denied') {
    setHotjarOptOut(true);
  }

  watch(
    [() => hasConsent.value, () => analyticsEnabled.value],
    ([consent, enabled]) => {
      if (!consent) {
        persistLocalPreference(null);
        setHotjarOptOut(true);
        return;
      }

      const localValue = enabled ? 'granted' : 'denied';
      persistLocalPreference(localValue);
      setHotjarOptOut(!enabled);

      if (enabled) {
        scheduleHotjarInitialization();
      }
    },
    { immediate: true }
  );
});
</script>
