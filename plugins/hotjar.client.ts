import { watch } from 'vue';

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

const injectHotjar = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.hj && window._hjSettings?.hjid === HOTJAR_ID) {
    return;
  }

  window.hj =
    window.hj ||
    function (...args: unknown[]) {
      (window.hj!.q = window.hj!.q || []).push(args);
    };

  window._hjSettings = { hjid: HOTJAR_ID, hjsv: HOTJAR_VERSION };

  if (document.getElementById(HOTJAR_SCRIPT_ID)) {
    return;
  }

  const head = document.head || document.getElementsByTagName('head')[0];
  if (!head) {
    return;
  }

  const script = document.createElement('script');
  script.id = HOTJAR_SCRIPT_ID;
  script.async = true;
  script.src = `https://static.hotjar.com/c/hotjar-${HOTJAR_ID}.js?sv=${HOTJAR_VERSION}`;
  head.appendChild(script);
};

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return;
  }

  const { analyticsEnabled } = useCookieConsent();
  const hasLoaded = useState('hotjar-loaded', () => false);

  const loadIfNecessary = () => {
    if (!hasLoaded.value) {
      injectHotjar();
      hasLoaded.value = true;
      window._hjOptOut = false;
    }
  };

  if (analyticsEnabled.value) {
    loadIfNecessary();
  }

  watch(
    analyticsEnabled,
    (allowed) => {
      if (allowed) {
        loadIfNecessary();
      } else if (typeof window !== 'undefined') {
        window._hjOptOut = true;
      }
    },
    { immediate: false }
  );
});
