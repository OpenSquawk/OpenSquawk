<template>
  <v-app>
    <NuxtPage/>
    <CookieConsentBanner v-if="showCookieBanner"/>
  </v-app>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
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
const productSession = useState<{ product: 'classroom' | 'liveatc'; path: string; startedAt: number } | null>('product-usage-session', () => null);

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
    initialize();
  }, HOTJAR_INIT_DELAY);
};

const resolveTrackedProduct = (path: string): 'classroom' | 'liveatc' | null => {
  if (path.startsWith('/classroom')) return 'classroom';
  if (path.startsWith('/live-atc') || path.startsWith('/pm') || path.startsWith('/copilot') || path.startsWith('/bridge')) return 'liveatc';
  return null;
};

const flushProductSession = () => {
  if (typeof window === 'undefined' || !productSession.value) {
    return;
  }

  const session = productSession.value;
  productSession.value = null;
  const endedAt = Date.now();
  const durationSeconds = Math.round((endedAt - session.startedAt) / 1000);

  if (durationSeconds < 5) {
    return;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authStore.accessToken) {
    headers.Authorization = `Bearer ${authStore.accessToken}`;
  }

  fetch('/api/service/analytics/product-session', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      product: session.product,
      path: session.path,
      durationSeconds,
      startedAt: new Date(session.startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
    }),
    keepalive: true,
  }).catch(() => undefined);
};

const syncProductSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const product = authStore.isAuthenticated ? resolveTrackedProduct(route.path) : null;
  const current = productSession.value;

  if (current && (!product || current.product !== product || current.path !== route.path)) {
    flushProductSession();
  }

  if (product && !productSession.value) {
    productSession.value = {
      product,
      path: route.path,
      startedAt: Date.now(),
    };
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    flushProductSession();
  } else {
    syncProductSession();
  }
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

  watch(
    [() => route.path, () => authStore.isAuthenticated],
    () => syncProductSession(),
    { immediate: true }
  );

  window.addEventListener('beforeunload', flushProductSession);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  flushProductSession();
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', flushProductSession);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }
});
</script>
