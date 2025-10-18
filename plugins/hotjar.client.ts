import { defineNuxtPlugin } from '#app';
import { watch } from 'vue';
import { useCookieConsent } from '~/composables/useCookieConsent';
import { useHotjar } from '#imports';

declare global {
  interface Window {
    hj?: ((...args: unknown[]) => void) & { q?: unknown[][] };
    _hjOptOut?: boolean;
  }
}

const setHotjarOptOut = (optOut: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }

  window._hjOptOut = optOut;

  if (optOut && typeof window.hj === 'function') {
    try {
      window.hj('event', 'cookie_consent_opt_out');
    } catch {
      // ignore errors from Hotjar when shutting down
    }
  }
};

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return;
  }

  const { initialize } = useHotjar();
  const hasInitialized = useState('hotjar-initialized', () => false);
  const { analyticsEnabled } = useCookieConsent();

  watch(
    () => analyticsEnabled.value,
    (enabled) => {
      if (enabled) {
        setHotjarOptOut(false);

        if (!hasInitialized.value) {
          initialize();
          hasInitialized.value = true;
        }
      } else {
        setHotjarOptOut(true);
        hasInitialized.value = false;
      }
    },
    { immediate: true }
  );
});
