<script setup lang="ts">
defineProps<{
  /** The transcribed (or typed) text of the pilot's last transmission. */
  text: string
  faulty: boolean
  faultNote: string
}>()

const emit = defineEmits<{
  (e: 'flag-issue'): void
  (e: 'clear'): void
}>()
</script>

<template>
  <section class="ltx" :class="{ 'is-faulty': faulty }" aria-label="Last transmission">
    <header class="ltx__head">
      <v-icon size="14" class="ltx__icon">mdi-microphone-outline</v-icon>
      <span class="ltx__title">Last transmission</span>
      <span v-if="faulty" class="ltx__badge">Faulty</span>

      <div class="ltx__actions">
        <!-- One entry point instead of the old four-button row: the issue dialog
             itself carries "Remove flag", so a dedicated reset button was dead weight. -->
        <v-tooltip :text="faulty ? 'Edit issue' : 'Mark as faulty'" location="top">
          <template #activator="{ props: tip }">
            <button
                v-bind="tip"
                type="button"
                class="ltx__btn ltx__btn--flag"
                :aria-label="faulty ? 'Edit issue' : 'Mark as faulty'"
                @click="emit('flag-issue')"
            >
              <v-icon size="16">mdi-alert-circle-outline</v-icon>
            </button>
          </template>
        </v-tooltip>
        <v-tooltip text="Dismiss" location="top">
          <template #activator="{ props: tip }">
            <button
                v-bind="tip"
                type="button"
                class="ltx__btn"
                aria-label="Dismiss last transmission"
                @click="emit('clear')"
            >
              <v-icon size="16">mdi-close</v-icon>
            </button>
          </template>
        </v-tooltip>
      </div>
    </header>

    <p class="ltx__text">{{ text }}</p>

    <p v-if="faulty" class="ltx__note">
      {{ faultNote || 'Marked as faulty.' }}
    </p>
  </section>
</template>

<style scoped>
.ltx {
  border-radius: 18px;
  border: 1px solid rgba(34, 211, 238, 0.24);
  background: rgba(34, 211, 238, 0.07);
  padding: 12px 14px 14px;
}

.ltx.is-faulty {
  border-color: rgba(248, 113, 113, 0.32);
  background: rgba(248, 113, 113, 0.08);
}

.ltx__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ltx__icon,
.ltx__title {
  color: #67e8f9;
}

.ltx.is-faulty .ltx__icon,
.ltx.is-faulty .ltx__title {
  color: #fca5a5;
}

.ltx__title {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.ltx__badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #2b0606;
  background: #f87171;
  border-radius: 999px;
  padding: 2px 7px;
}

.ltx__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.ltx__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  border: 1px solid transparent;
  color: var(--t3);
  background: transparent;
  transition: color 120ms ease, background 120ms ease, border-color 120ms ease;
}

.ltx__btn:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

.ltx__btn--flag {
  color: #fbbf24;
}

.ltx__btn--flag:hover {
  color: #fcd34d;
  border-color: rgba(251, 191, 36, 0.4);
  background: rgba(251, 191, 36, 0.12);
}

.ltx.is-faulty .ltx__btn--flag {
  color: #fca5a5;
}

.ltx.is-faulty .ltx__btn--flag:hover {
  color: #fecaca;
  border-color: rgba(248, 113, 113, 0.45);
  background: rgba(248, 113, 113, 0.14);
}

.ltx__text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-line;
  color: var(--text);
}

.ltx__note {
  margin-top: 10px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid rgba(248, 113, 113, 0.28);
  background: rgba(248, 113, 113, 0.1);
  font-size: 12px;
  color: #fecaca;
}
</style>
