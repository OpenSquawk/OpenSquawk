<template>
  <div class="freq-panel glass panel">
    <!-- Frequency displays -->
    <div class="freq-row">
      <!-- Active frequency -->
      <div class="freq-block freq-block--active">
        <span class="freq-label">ACTIVE</span>
        <span class="freq-value freq-value--active">{{ activeFreq }}</span>
        <span class="freq-unit">{{ activeUnit }}</span>
      </div>

      <!-- Swap button -->
      <button
        class="freq-swap-btn"
        :disabled="!standbyFreq || loading"
        :title="standbyFreq ? 'Swap frequencies' : 'No standby frequency'"
        @click="handleSwap"
      >
        <v-icon icon="mdi-swap-horizontal" :size="20" />
      </button>

      <!-- Standby frequency -->
      <div class="freq-block freq-block--standby">
        <span class="freq-label">STBY</span>
        <span class="freq-value freq-value--standby">
          {{ standbyFreq || '----.---' }}
        </span>
        <span class="freq-unit freq-unit--standby">
          {{ standbyUnit || '---' }}
        </span>
      </div>
    </div>

    <!-- Text input -->
    <form class="freq-input-row" @submit.prevent="handleSubmit">
      <input
        v-model="textInput"
        type="text"
        class="freq-text-input"
        placeholder="Type pilot message..."
        :disabled="loading"
        @keydown.enter.prevent="handleSubmit"
      />
      <button
        type="submit"
        class="freq-send-btn"
        :disabled="!textInput.trim() || loading"
        title="Send message"
      >
        <v-icon icon="mdi-send" :size="18" />
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  activeFreq: string;
  activeUnit: string;
  standbyFreq?: string;
  standbyUnit?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'swap'): void;
  (e: 'text-submit', text: string): void;
}>();

const textInput = ref('');

function handleSwap() {
  emit('swap');
}

function handleSubmit() {
  const text = textInput.value.trim();
  if (!text) return;
  emit('text-submit', text);
  textInput.value = '';
}
</script>

<style scoped>
/* ── Panel layout ── */
.freq-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

/* ── Frequency row ── */
.freq-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.freq-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.freq-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--t3);
}

/* ── Frequency values ── */
.freq-value {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.freq-value--active {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
  text-shadow: 0 0 14px color-mix(in srgb, var(--accent) 40%, transparent);
}

.freq-value--standby {
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--t3);
}

.freq-unit {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.06em;
}

.freq-unit--standby {
  color: var(--t3);
}

@media (min-width: 768px) {
  .freq-value--active {
    font-size: 1.8rem;
  }
  .freq-value--standby {
    font-size: 1.3rem;
  }
}

/* ── Swap button ── */
.freq-swap-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--text) 8%, transparent),
    color-mix(in srgb, var(--text) 4%, transparent)
  );
  color: var(--t2);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}

.freq-swap-btn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  color: var(--accent);
  transform: scale(1.08);
}

.freq-swap-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.freq-swap-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ── Text input row ── */
.freq-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.freq-text-input {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--text) 7%, transparent),
    color-mix(in srgb, var(--text) 3%, transparent)
  );
  color: var(--text);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
  backdrop-filter: blur(var(--glass-blur, 18px));
}

.freq-text-input::placeholder {
  color: var(--t3);
}

.freq-text-input:focus {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
}

.freq-text-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Send button ── */
.freq-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--accent) 85%, transparent),
    color-mix(in srgb, var(--accent2) 70%, transparent)
  );
  color: #051217;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.12s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent);
}

.freq-send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 40%, transparent);
}

.freq-send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.freq-send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
