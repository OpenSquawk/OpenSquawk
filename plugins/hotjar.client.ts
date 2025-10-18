import { defineNuxtPlugin } from '#app';
import { watch } from 'vue';
import { useCookieConsent } from '~/composables/useCookieConsent';

declare global {
  interface Window {
    hj?: ((...args: unknown[]) => void) & { q?: unknown[][] };
    _hjSettings?: { hjid: number; hjsv: number };
    _hjOptOut?: boolean;
  }
}

const HOTJAR_ID = 6522897;
const HOTJAR_VERSION = 6;
const HOTJAR_SCRIPT_ID = 'hotjar-tracking-script';

const ensureHotjarStub = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.hj =
    window.hj ||
    function (...args: unknown[]) {
      (window.hj!.q = window.hj!.q || []).push(args);
    };

  window._hjSettings = { hjid: HOTJAR_ID, hjsv: HOTJAR_VERSION };
};

const appendHotjarScript = () => {
  if (document.getElementById(HOTJAR_SCRIPT_ID)) {
    return true;
  }

  const head = document.head || document.getElementsByTagName('head')[0];
  if (!head) {
    return false;
  }

  const script = document.createElement('script');
  script.id = HOTJAR_SCRIPT_ID;
  script.async = true;
  script.src = `https://static.hotjar.com/c/hotjar-${HOTJAR_ID}.js?sv=${HOTJAR_VERSION}`;
  head.appendChild(script);
  return true;
};

const removeHotjarScript = () => {
  const script = document.getElementById(HOTJAR_SCRIPT_ID);
  if (script && script.parentNode) {
    script.parentNode.removeChild(script);
  }
};

const disableHotjar = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window._hjOptOut = true;
  removeHotjarScript();
  window.hj = undefined;
  window._hjSettings = undefined;
};

const enableHotjar = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  window._hjOptOut = false;
  ensureHotjarStub();
  return appendHotjarScript();
};

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return;
  }

  const hasLoaded = useState('hotjar-loaded', () => false);
  const { analyticsEnabled } = useCookieConsent();

  watch(
    () => analyticsEnabled.value,
    (enabled) => {
      if (enabled) {
        if (enableHotjar()) {
          hasLoaded.value = true;
        }
      } else {
        disableHotjar();
        hasLoaded.value = false;
      }
    },
    { immediate: true }
  );
});
