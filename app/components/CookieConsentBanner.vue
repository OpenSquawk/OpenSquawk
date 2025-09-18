<template>
  <transition name="cookie-fade">
    <div
      v-if="isDialogVisible"
      class="cookie-consent-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <section class="cookie-consent-panel">
        <header class="cookie-consent-header">
          <h2 id="cookie-consent-title">{{ isGerman ? 'Cookies &amp; Analysen' : 'Cookies &amp; analytics' }}</h2>
          <p id="cookie-consent-description">
            <template v-if="isGerman">
              Wir verwenden notwendige Cookies, damit die Website zuverlässig funktioniert. Darüber hinaus würden wir gern optionale
              Analyse-Cookies von Hotjar einsetzen, um das Nutzungserlebnis zu verbessern. Sie entscheiden, ob Sie diese zulassen – alle
              Details finden Sie in unserer
            </template>
            <template v-else>
              We use essential cookies to keep the site reliable. We would also like to use optional Hotjar analytics cookies to improve your
              experience. You decide whether to allow them—see our
            </template>
            <a href="/datenschutz" target="_blank" rel="noopener">{{ isGerman ? 'Datenschutzerklärung' : 'privacy policy' }}</a>.
          </p>
        </header>

        <div class="cookie-consent-options" role="list">
          <article class="cookie-option is-required" role="listitem">
            <div class="cookie-option-text">
              <h3>{{ isGerman ? 'Notwendige Cookies' : 'Essential cookies' }}</h3>
              <p>
                {{
                  isGerman
                    ? 'Speichern Ihre Auswahl und sorgen für sichere Anmeldung sowie eine stabile Grundfunktionalität.'
                    : 'Store your selection and enable secure sign-in plus a stable core experience.'
                }}
              </p>
            </div>
            <span class="cookie-option-badge" aria-hidden="true">{{ isGerman ? 'Immer aktiv' : 'Always on' }}</span>
          </article>

          <article class="cookie-option" role="listitem">
            <div class="cookie-option-text">
              <h3>{{ isGerman ? 'Analyse (Hotjar)' : 'Analytics (Hotjar)' }}</h3>
              <p>
                {{
                  isGerman
                    ? 'Hilft uns, Nutzungsverhalten anonym auszuwerten und unsere Inhalte gezielt zu verbessern.'
                    : 'Helps us analyse anonymised usage to improve content and product decisions.'
                }}
              </p>
            </div>
            <button
                type="button"
                class="cookie-toggle"
                role="switch"
                :aria-checked="analyticsSelection"
                @click="toggleAnalytics"
            >
              <span class="cookie-toggle-track" :class="{ 'is-active': analyticsSelection }">
                <span class="cookie-toggle-thumb" />
              </span>
              <span class="sr-only">
                {{
                  isGerman
                    ? `Analyse-Cookies ${analyticsSelection ? 'deaktivieren' : 'aktivieren'}`
                    : `${analyticsSelection ? 'Disable' : 'Enable'} analytics cookies`
                }}
              </span>
            </button>
          </article>
        </div>

        <p class="cookie-consent-note">
          {{
            isGerman
              ? 'Optionales Tracking wird erst nach Ihrer Zustimmung geladen. Sie können Ihre Entscheidung jederzeit über „Cookie-Einstellungen“ unten links widerrufen.'
              : 'Optional tracking only loads after you consent. You can revisit your choice at any time via “Cookie settings” in the lower left.'
          }}
        </p>

        <div class="cookie-consent-actions">
          <button type="button" class="cookie-button ghost" @click="handleRejectAll">{{ isGerman ? 'Nur notwendige' : 'Only necessary' }}</button>
          <button type="button" class="cookie-button secondary" @click="handleSave">{{ isGerman ? 'Auswahl speichern' : 'Save selection' }}</button>
          <button type="button" class="cookie-button primary" @click="handleAcceptAll">{{ isGerman ? 'Alle akzeptieren' : 'Accept all' }}</button>
        </div>
      </section>
    </div>
  </transition>

  <transition name="cookie-manage">
    <button v-if="showManageButton" type="button" class="cookie-manage-button" @click="openManager">
      {{ isGerman ? 'Cookie-Einstellungen' : 'Cookie settings' }}
    </button>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useState } from '#imports';

const { hasConsent, analyticsEnabled, acceptAll, rejectAll, savePreferences } = useCookieConsent();

const isDialogVisible = ref(!hasConsent.value);
const isManuallyOpened = ref(false);
const analyticsSelection = ref(analyticsEnabled.value);
const locale = useState<'de' | 'en'>('landing-locale', () => 'de');
const isGerman = computed(() => locale.value === 'de');

watch(
  () => hasConsent.value,
  (value) => {
    if (!value) {
      analyticsSelection.value = false;
      isDialogVisible.value = true;
    } else if (!isManuallyOpened.value) {
      isDialogVisible.value = false;
    }
  }
);

watch(
  () => analyticsEnabled.value,
  (value) => {
    if (!isDialogVisible.value) {
      analyticsSelection.value = value;
    }
  }
);

watch(
  () => isDialogVisible.value,
  (open) => {
    if (open) {
      analyticsSelection.value = analyticsEnabled.value;
    }
  }
);

const showManageButton = computed(() => hasConsent.value && !isDialogVisible.value);

const closeDialog = () => {
  isDialogVisible.value = false;
  isManuallyOpened.value = false;
};

const handleAcceptAll = () => {
  analyticsSelection.value = true;
  acceptAll();
  closeDialog();
};

const handleRejectAll = () => {
  analyticsSelection.value = false;
  rejectAll();
  closeDialog();
};

const handleSave = () => {
  savePreferences({ analytics: analyticsSelection.value });
  closeDialog();
};

const toggleAnalytics = () => {
  analyticsSelection.value = !analyticsSelection.value;
};

const openManager = () => {
  analyticsSelection.value = analyticsEnabled.value;
  isManuallyOpened.value = true;
  isDialogVisible.value = true;
};
</script>

<style scoped>
.cookie-consent-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1.5rem 1rem;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  z-index: 9999;
}

@media (min-width: 768px) {
  .cookie-consent-backdrop {
    align-items: center;
    padding: 2.5rem;
    padding-bottom: calc(2.5rem + env(safe-area-inset-bottom, 0));
  }
}

.cookie-consent-panel {
  width: min(640px, 100%);
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.96), rgba(9, 14, 29, 0.94));
  color: #f8fafc;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 30px 80px rgba(8, 15, 35, 0.55);
  padding: clamp(1.75rem, 2.5vw, 2.5rem);
  line-height: 1.6;
  animation: cookie-slide-up 0.35s ease;
  max-height: min(720px, calc(100vh - 3rem));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

@supports (height: 100dvh) {
  .cookie-consent-panel {
    max-height: min(720px, calc(100dvh - 3rem));
  }
}

@media (max-width: 767px) {
  .cookie-consent-backdrop {
    padding: 1.25rem 0.85rem;
    padding-bottom: calc(1.25rem + env(safe-area-inset-bottom, 0));
  }

  .cookie-consent-panel {
    width: 100%;
    border-radius: 18px;
  }
}

.cookie-consent-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.cookie-consent-header p {
  color: rgba(226, 232, 240, 0.85);
  margin: 0;
}

.cookie-consent-header a {
  color: var(--accent);
  font-weight: 600;
}

.cookie-consent-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.75rem 0;
}

.cookie-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(15, 23, 42, 0.55);
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.cookie-option.is-required {
  opacity: 0.8;
}

.cookie-option-text h3 {
  font-size: 1.05rem;
  margin: 0 0 0.35rem;
}

.cookie-option-text p {
  margin: 0;
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.92rem;
}

.cookie-option-badge {
  background: rgba(34, 211, 238, 0.15);
  color: var(--accent);
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.cookie-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cookie-toggle-track {
  width: 52px;
  height: 28px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.35);
  display: inline-flex;
  align-items: center;
  transition: background 0.25s ease, border-color 0.25s ease;
  position: relative;
}

.cookie-toggle-track.is-active {
  background: var(--accent);
  border-color: rgba(34, 211, 238, 0.7);
}

.cookie-toggle-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.25s ease, background 0.25s ease;
}

.cookie-toggle-track.is-active .cookie-toggle-thumb {
  transform: translateX(24px);
  background: #0b1020;
}

.cookie-consent-note {
  font-size: 0.86rem;
  color: rgba(203, 213, 225, 0.82);
  margin: 0 0 1.5rem;
}

.cookie-consent-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.cookie-button {
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.cookie-button.primary {
  background: var(--accent);
  color: #041224;
  box-shadow: 0 20px 35px rgba(34, 211, 238, 0.22);
}

.cookie-button.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 24px 40px rgba(34, 211, 238, 0.28);
}

.cookie-button.secondary {
  background: rgba(34, 211, 238, 0.12);
  color: var(--accent);
  border: 1px solid rgba(34, 211, 238, 0.45);
}

.cookie-button.secondary:hover {
  background: rgba(34, 211, 238, 0.2);
}

.cookie-button.ghost {
  background: transparent;
  color: rgba(226, 232, 240, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.cookie-button.ghost:hover {
  background: rgba(148, 163, 184, 0.1);
}

.cookie-manage-button {
  position: fixed;
  left: 1.5rem;
  bottom: 1.5rem;
  z-index: 9980;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  padding: 0.55rem 1.25rem;
  color: rgba(226, 232, 240, 0.95);
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.cookie-manage-button:hover {
  background: rgba(34, 211, 238, 0.18);
  border-color: rgba(34, 211, 238, 0.65);
  color: var(--accent);
}

.cookie-fade-enter-active,
.cookie-fade-leave-active {
  transition: opacity 0.25s ease;
}

.cookie-fade-enter-from,
.cookie-fade-leave-to {
  opacity: 0;
}

.cookie-manage-enter-active,
.cookie-manage-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.cookie-manage-enter-from,
.cookie-manage-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@keyframes cookie-slide-up {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
