<script setup lang="ts">
defineProps<{
  /** What ATC just said, or is about to say — rendered as the upper line. */
  controllerSay: string
  /** The phrase the pilot is expected to transmit next — the lower line. */
  expectedPhrase: string
}>()

const showPronunciation = defineModel<boolean>('showPronunciation', { required: true })
</script>

<template>
  <section class="ecs" aria-label="Expected communication">
    <header class="ecs__head">
      <span class="ecs__title">Expected</span>
      <v-tooltip
          :text="showPronunciation ? 'Switch to plain text' : 'Switch to radio pronunciation'"
          location="top"
      >
        <template #activator="{ props: tip }">
          <button
              v-bind="tip"
              type="button"
              class="ecs__toggle"
              :class="{ 'is-on': showPronunciation }"
              :aria-pressed="showPronunciation ? 'true' : 'false'"
              aria-label="Toggle radio pronunciation"
              @click="showPronunciation = !showPronunciation"
          >
            <v-icon size="15">{{ showPronunciation ? 'mdi-text' : 'mdi-radio' }}</v-icon>
          </button>
        </template>
      </v-tooltip>
    </header>

    <p v-if="controllerSay" class="ecs__row ecs__row--atc">
      <v-icon size="14" class="ecs__icon">mdi-radio-tower</v-icon>
      <span class="ecs__role">ATC</span>
      <span class="ecs__text">{{ controllerSay }}</span>
    </p>

    <p v-if="expectedPhrase" class="ecs__row ecs__row--pilot">
      <v-icon size="14" class="ecs__icon">mdi-headset</v-icon>
      <span class="ecs__role">You</span>
      <span class="ecs__text">{{ expectedPhrase }}</span>
    </p>
  </section>
</template>

<style scoped>
.ecs {
  padding: 10px 12px 12px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 3%, transparent);
}

.ecs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.ecs__title {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--t4);
}

.ecs__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid var(--border);
  color: var(--t3);
  background: transparent;
  transition: color 120ms ease, border-color 120ms ease, background 120ms ease;
}

.ecs__toggle:hover {
  color: #67e8f9;
  border-color: rgba(34, 211, 238, 0.4);
}

.ecs__toggle.is-on {
  color: #67e8f9;
  border-color: rgba(34, 211, 238, 0.45);
  background: rgba(34, 211, 238, 0.1);
}

/* One line per speaker: role tag, then the phrase. Wraps rather than truncates —
   a clipped clearance is worse than a two-line strip. */
.ecs__row {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 5px 0;
  font-size: 12.5px;
  line-height: 1.45;
}

.ecs__row + .ecs__row {
  border-top: 1px solid color-mix(in srgb, var(--text) 6%, transparent);
}

.ecs__icon {
  align-self: center;
  flex-shrink: 0;
}

.ecs__role {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.ecs__text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--text);
  min-width: 0;
}

.ecs__row--atc .ecs__icon,
.ecs__row--atc .ecs__role {
  color: #6ee7a8;
}

.ecs__row--pilot .ecs__icon,
.ecs__row--pilot .ecs__role {
  color: #7dd3fc;
}
</style>
