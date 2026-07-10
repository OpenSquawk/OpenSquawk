<script setup lang="ts">
defineProps<{
  activeFrequency: string
  /** The phrase the backend expects next; offered as a one-tap fill. */
  expectedPhrase: string
}>()

const emit = defineEmits<{ (e: 'send'): void }>()

const pilotInput = defineModel<string>({ required: true })
</script>

<template>
  <section class="txt" aria-label="Text transmission">
    <header class="txt__head">
      <span class="txt__title">Text input</span>
      <span class="txt__freq">{{ activeFrequency || '---.---' }}</span>
    </header>

    <v-text-field
        v-model="pilotInput"
        label="Pilot transmission"
        variant="outlined"
        color="cyan"
        density="comfortable"
        hide-details
        append-inner-icon="mdi-send"
        @keyup.enter="emit('send')"
        @click:append-inner="emit('send')"
    />

    <div v-if="expectedPhrase" class="txt__suggest">
      <span class="txt__suggest-label">Suggested phrase</span>
      <button type="button" class="txt__suggest-chip" @click="pilotInput = expectedPhrase">
        {{ expectedPhrase }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.txt {
  border-radius: 18px;
  border: 1px solid var(--border);
  background:
    linear-gradient(165deg,
      color-mix(in srgb, var(--bg2) 90%, transparent),
      color-mix(in srgb, var(--bg) 96%, transparent));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--text) 6%, transparent),
    0 20px 44px -28px rgba(0, 0, 0, 0.9);
  padding: 14px;
}

.txt__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.txt__title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--t4);
}

.txt__freq {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #67e8f9;
}

.txt__suggest {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.txt__suggest-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--t4);
}

.txt__suggest-chip {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: #67e8f9;
  border: 1px solid rgba(34, 211, 238, 0.35);
  background: rgba(34, 211, 238, 0.08);
  border-radius: 999px;
  padding: 4px 12px;
  text-align: left;
  transition: background 130ms ease, border-color 130ms ease;
}

.txt__suggest-chip:hover {
  background: rgba(34, 211, 238, 0.16);
  border-color: rgba(34, 211, 238, 0.5);
}
</style>
