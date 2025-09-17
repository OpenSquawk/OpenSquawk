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

const fallbackInjectHotjar = () => {
  if (typeof window === 'undefined') {
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

  const nuxtApp = useNuxtApp();
  const router = useRouter();
  const { analyticsEnabled } = useCookieConsent();
  const hasLoaded = useState('hotjar-loaded', () => false);

  let removeAfterEach: (() => void) | null = null;
  let moduleLoadPromise: Promise<boolean> | null = null;

  const registerRouterTracking = () => {
    if (removeAfterEach || typeof router?.afterEach !== 'function') {
      return;
    }

    removeAfterEach = router.afterEach((to) => {
      if (typeof window !== 'undefined' && typeof window.hj === 'function') {
        window.hj('stateChange', to.fullPath);
      }
    });
  };

  const teardownRouterTracking = () => {
    if (removeAfterEach) {
      removeAfterEach();
      removeAfterEach = null;
    }
  };

  const ensureModuleLoaded = async (): Promise<boolean> => {
    if (!moduleLoadPromise) {
      moduleLoadPromise = (async () => {
        const hotjarClient = (nuxtApp as unknown as { $hotjar?: unknown }).$hotjar;
        if (!hotjarClient) {
          return false;
        }

        const client = hotjarClient as {
          isLoaded?: boolean | { value?: boolean };
          load?: () => void | Promise<void>;
          init?: () => void | Promise<void>;
          enableTracking?: () => void | Promise<void>;
          consent?: { allow?: () => void | Promise<void> };
        };

        const alreadyLoaded =
          typeof client.isLoaded === 'boolean'
            ? client.isLoaded
            : typeof client.isLoaded?.value === 'boolean'
            ? client.isLoaded.value
            : false;

        if (alreadyLoaded) {
          return true;
        }

        try {
          if (typeof client.consent?.allow === 'function') {
            await client.consent.allow();
            return true;
          }

          if (typeof client.enableTracking === 'function') {
            await client.enableTracking();
            return true;
          }

          if (typeof client.init === 'function') {
            await client.init();
            return true;
          }

          if (typeof client.load === 'function') {
            await client.load();
            return true;
          }
        } catch (error) {
          console.warn('[hotjar]', 'Failed to initialise via nuxt-module-hotjar', error);
        }

        return false;
      })();
    }

    return moduleLoadPromise;
  };

  const loadHotjar = async () => {
    if (hasLoaded.value) {
      window._hjOptOut = false;
      registerRouterTracking();
      return;
    }

    const initialised = (await ensureModuleLoaded()) || (typeof window !== 'undefined' && typeof window.hj === 'function');

    if (!initialised) {
      fallbackInjectHotjar();
    }

    registerRouterTracking();
    hasLoaded.value = true;
    window._hjOptOut = false;
  };

  const disableHotjar = () => {
    window._hjOptOut = true;
    teardownRouterTracking();
  };

  if (analyticsEnabled.value) {
    loadHotjar();
  } else {
    disableHotjar();
  }

  watch(
    analyticsEnabled,
    (allowed) => {
      if (allowed) {
        loadHotjar();
      } else {
        disableHotjar();
      }
    },
    { immediate: false }
  );
});
