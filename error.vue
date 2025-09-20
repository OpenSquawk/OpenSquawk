<template>
  <v-app>
    <v-main class="error-page">
      <v-container class="fill-height d-flex flex-column align-center justify-center text-center">
        <div class="squawk-badge">
          <span class="squawk-label">Squawk</span>
          <span class="squawk-value">{{ displayCode }}</span>
        </div>
        <v-card class="atc-card pa-8 mt-8" max-width="640" elevation="16">
          <p class="text-overline text-secondary">ATC TRANSMISSION</p>
          <h1 class="text-h4 text-white font-weight-bold mt-2">Are you ready to copy a number?</h1>
          <p class="text-body-2 text-medium-emphasis mt-3">
            {{ introLine }}
          </p>
          <div class="conversation mt-6">
            <p class="conversation-line">
              <span class="speaker atc">ATC</span>
              <span class="message">OpenSquawk flight, confirm ready to copy.</span>
            </p>
            <p class="conversation-line">
              <span class="speaker pilot">Pilot</span>
              <span class="message">Ready when you are.</span>
            </p>
            <p class="conversation-line">
              <span class="speaker atc">ATC</span>
              <span class="message">Squawk <span class="code">{{ displayCode }}</span>.</span>
            </p>
            <p class="conversation-line">
              <span class="speaker pilot">Pilot</span>
              <span class="message">{{ pilotResponse }}</span>
            </p>
          </div>
          <v-alert
            v-if="!is404"
            type="warning"
            variant="tonal"
            density="comfortable"
            border="start"
            border-color="warning"
            class="mt-6 text-left"
          >
            {{ statusMessage }}
          </v-alert>
          <v-btn
            color="primary"
            size="large"
            class="mt-8"
            prepend-icon="mdi-home"
            @click="handleReturn"
          >
            Return to base
          </v-btn>
        </v-card>
        <p class="mt-8 text-medium-emphasis status-footnote">
          {{ statusHint }}
        </p>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { NuxtError } from '#app';
import { clearError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const statusCode = computed(() => {
  const code = props.error?.statusCode ?? 500;
  const parsed = Number(code);
  return Number.isFinite(parsed) ? parsed : 500;
});

const is404 = computed(() => statusCode.value === 404);
const displayCode = computed(() => (is404.value ? '4040' : statusCode.value.toString()));
const statusMessage = computed(
  () =>
    props.error?.message ||
    props.error?.statusMessage ||
    'An unexpected error grounded this request.'
);

const introLine = computed(() =>
  is404.value
    ? "We couldn't find that frequency in our airspace. Let's vector you somewhere safe."
    : 'Something caused a little turbulence, but the tower is already on it.'
);

const pilotResponse = computed(() =>
  is404.value
    ? `Squawking ${displayCode.value}. Looks like that channel is dark.`
    : `Squawking ${displayCode.value}. Holding short while we investigate.`
);

const statusHint = computed(() =>
  is404.value
    ? 'Status 404: This page never checked in with ATC. Double-check the address or head back home.'
    : `Status ${statusCode.value}: ${statusMessage.value}`
);

const handleReturn = () => {
  clearError({ redirect: '/' });
};
</script>

<style scoped>
.error-page {
  background:
    radial-gradient(circle at 15% 20%, rgba(34, 211, 238, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.15), transparent 65%),
    linear-gradient(180deg, rgba(7, 12, 26, 0.95) 0%, rgba(7, 9, 18, 0.98) 100%);
  color: #ffffff;
}

.squawk-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.5rem;
  border-radius: 999px;
  border: 1px solid rgba(34, 211, 238, 0.4);
  background: rgba(10, 15, 28, 0.65);
  backdrop-filter: blur(12px);
  text-transform: uppercase;
  letter-spacing: 0.4em;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.75);
}

.squawk-label {
  font-weight: 600;
  letter-spacing: 0.35em;
}

.squawk-value {
  font-family: 'Space Mono', 'Roboto Mono', monospace;
  font-size: 1.5rem;
  letter-spacing: 0.05em;
  color: #22d3ee;
}

.atc-card {
  background: rgba(9, 14, 28, 0.86);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(34, 211, 238, 0.12);
  box-shadow: 0 30px 60px rgba(1, 5, 16, 0.6);
}

.conversation {
  border-left: 2px solid rgba(34, 211, 238, 0.25);
  padding-left: 1.5rem;
}

.conversation-line {
  display: flex;
  gap: 1rem;
  align-items: baseline;
  margin-bottom: 0.75rem;
  text-align: left;
}

.conversation-line:last-child {
  margin-bottom: 0;
}

.speaker {
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  font-weight: 700;
  text-transform: uppercase;
  min-width: 3.5rem;
}

.speaker.atc {
  color: #22d3ee;
}

.speaker.pilot {
  color: #fbbf24;
}

.message {
  flex: 1;
  color: rgba(255, 255, 255, 0.85);
}

.code {
  font-family: 'Space Mono', 'Roboto Mono', monospace;
  color: #22d3ee;
  font-size: 1.15em;
}

.status-footnote {
  max-width: 520px;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .atc-card {
    padding: 2rem !important;
  }

  .conversation {
    padding-left: 1rem;
  }

  .speaker {
    min-width: 3rem;
    letter-spacing: 0.15em;
  }
}
</style>
