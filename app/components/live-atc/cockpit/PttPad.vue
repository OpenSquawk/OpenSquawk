<script setup lang="ts">
defineProps<{
  isRecording: boolean
  micPermission: boolean
  /** True when the desktop Bridge companion has a PTT hotkey bound. */
  bridgePttConnected: boolean
  activeFrequency: string
}>()

const emit = defineEmits<{
  (e: 'start'): void
  (e: 'stop'): void
  (e: 'request-mic'): void
}>()
</script>

<template>
  <div class="ptt">
    <v-alert
        v-if="!micPermission"
        type="info"
        variant="tonal"
        class="bg-cyan-500/10 text-cyan-100 mb-4"
        density="compact"
    >
      Microphone permission required for push-to-talk.
      <template #append>
        <v-btn color="cyan" size="small" variant="flat" @click="emit('request-mic')">Allow</v-btn>
      </template>
    </v-alert>

    <ClientOnly>
      <button
          type="button"
          class="ptt-btn"
          :class="isRecording ? 'is-live' : 'is-idle'"
          :aria-pressed="isRecording ? 'true' : 'false'"
          aria-label="Hold to transmit"
          @touchstart.prevent="emit('start')"
          @touchend.prevent="emit('stop')"
          @touchcancel.prevent="emit('stop')"
          @mousedown.prevent="emit('start')"
          @mouseup.prevent="emit('stop')"
          @mouseleave="emit('stop')"
      >
        <v-icon :icon="isRecording ? 'mdi-access-point' : 'mdi-radio-handheld'" size="52" class="ptt-btn__icon" />
        <span class="ptt-btn__label">{{ isRecording ? 'Transmitting' : 'Hold to transmit' }}</span>
      </button>
    </ClientOnly>

    <p v-if="bridgePttConnected" class="ptt-hotkey" :class="{ 'is-live': isRecording }">
      <span class="ptt-hotkey__dot" aria-hidden="true" />
      {{ isRecording ? 'Hotkey transmitting' : 'Hotkey armed' }}
    </p>

    <div class="ptt-freq">
      <span class="ptt-freq__value">{{ activeFrequency || '---' }}</span>
      <span class="ptt-freq__label">Active frequency</span>
    </div>
  </div>
</template>

<style scoped>
.ptt {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 14px 22px;
}

.ptt :deep(.v-alert) {
  width: 100%;
}

/* The single most-used control on the screen, so it reads as a physical
   transmit key: round, raised, and lit from within. */
.ptt-btn {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: clamp(148px, 44vw, 188px);
  aspect-ratio: 1;
  border-radius: 999px;
  /* 2px at 0.28 opacity, not a hairline: the border has to survive bright
     ambient light on a tablet in a real cockpit. */
  border: 2px solid rgba(255, 255, 255, 0.28);
  background:
    radial-gradient(circle at 50% 34%,
      rgba(34, 211, 238, 0.16),
      rgba(4, 8, 16, 0.9) 68%);
  color: #67e8f9;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 120ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.ptt-btn.is-idle {
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.2),
    0 0 34px -8px rgba(34, 211, 238, 0.5),
    0 18px 38px -18px rgba(0, 0, 0, 0.9);
}

.ptt-btn.is-idle:hover {
  border-color: rgba(34, 211, 238, 0.6);
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.32),
    0 0 46px -6px rgba(34, 211, 238, 0.62),
    0 18px 38px -18px rgba(0, 0, 0, 0.9);
}

.ptt-btn.is-live {
  border-color: rgba(74, 222, 128, 0.75);
  background:
    radial-gradient(circle at 50% 34%,
      rgba(34, 197, 94, 0.32),
      rgba(4, 12, 8, 0.9) 68%);
  color: #86efac;
  transform: scale(0.97);
  box-shadow:
    0 0 0 6px rgba(34, 197, 94, 0.22),
    0 0 60px -4px rgba(34, 197, 94, 0.75);
  animation: ptt-live-glow 1.4s ease-in-out infinite;
}

@keyframes ptt-live-glow {
  0%, 100% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.22), 0 0 60px -4px rgba(34, 197, 94, 0.75); }
  50% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0.1), 0 0 74px 0 rgba(34, 197, 94, 0.55); }
}

.ptt-btn__icon {
  color: currentColor;
}

.ptt-btn__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  padding-left: 0.3em; /* balances the trailing letter-spacing */
  color: currentColor;
}

.ptt-btn.is-idle .ptt-btn__label {
  color: var(--t4);
}

.ptt-hotkey {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(103, 232, 249, 0.7);
}

.ptt-hotkey.is-live {
  color: #86efac;
}

.ptt-hotkey__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}

.ptt-hotkey.is-live .ptt-hotkey__dot {
  animation: ptt-dot-pulse 1s infinite;
}

@keyframes ptt-dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.ptt-freq {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  margin-top: 16px;
}

.ptt-freq__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: clamp(26px, 8vw, 34px);
  font-weight: 700;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  color: var(--text);
}

.ptt-freq__label {
  font-size: 11px;
  color: var(--t4);
}

.pm-page[data-theme="light"] .ptt-btn {
  border-color: rgba(15, 20, 32, 0.24);
  background: radial-gradient(circle at 50% 34%, rgba(8, 145, 178, 0.14), rgba(255, 255, 255, 0.9) 70%);
  color: #0e7490;
}

.pm-page[data-theme="light"] .ptt-btn.is-idle {
  box-shadow:
    0 0 0 1px rgba(8, 145, 178, 0.22),
    0 12px 26px -16px rgba(15, 20, 32, 0.5);
}

.pm-page[data-theme="light"] .ptt-btn.is-live {
  border-color: rgba(22, 163, 74, 0.6);
  background: radial-gradient(circle at 50% 34%, rgba(34, 197, 94, 0.24), rgba(255, 255, 255, 0.92) 70%);
  color: #15803d;
}

/* Cyan-on-white washes out; darken the hotkey line for the light skin. */
.pm-page[data-theme="light"] .ptt-hotkey {
  color: #0e7490;
}

.pm-page[data-theme="light"] .ptt-hotkey.is-live {
  color: #15803d;
}

@media (prefers-reduced-motion: reduce) {
  .ptt-btn,
  .ptt-btn.is-live,
  .ptt-hotkey.is-live .ptt-hotkey__dot {
    animation: none;
    transition: none;
  }
}
</style>
