import { computed, watch } from 'vue';

type CookieConsentPreferences = {
  necessary: true;
  analytics: boolean;
};

type CookieConsentValue = {
  version: number;
  updatedAt: string;
  preferences: CookieConsentPreferences;
};

const CONSENT_COOKIE_NAME = 'osq-cookie-consent';
const CONSENT_VERSION = 1;
const SIX_MONTHS_IN_SECONDS = 60 * 60 * 24 * 180;

export const useCookieConsent = () => {
  const consentCookie = useCookie<CookieConsentValue | null>(CONSENT_COOKIE_NAME, {
    sameSite: 'lax',
    path: '/',
    maxAge: SIX_MONTHS_IN_SECONDS,
    secure: !process.dev,
  });

  if (consentCookie.value && consentCookie.value.version !== CONSENT_VERSION) {
    consentCookie.value = null;
  }

  const consentState = useState<CookieConsentValue | null>('cookie-consent', () => consentCookie.value ?? null);

  watch(
    consentState,
    (value) => {
      consentCookie.value = value;
    },
    { deep: true }
  );

  const hasConsent = computed(() => consentState.value !== null);

  const analyticsEnabled = computed(() => {
    if (!consentState.value) {
      return false;
    }

    return consentState.value.preferences.analytics === true;
  });

  const savePreferences = (preferences: { analytics: boolean }) => {
    consentState.value = {
      version: CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
      preferences: {
        necessary: true,
        analytics: preferences.analytics,
      },
    };
  };

  const acceptAll = () => savePreferences({ analytics: true });

  const rejectAll = () => savePreferences({ analytics: false });

  const resetConsent = () => {
    consentState.value = null;
    consentCookie.value = null;
  };

  return {
    consent: consentState,
    hasConsent,
    analyticsEnabled,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent,
  };
};
