<script setup lang="ts">
import type { PmThemePreference } from '~/composables/usePmTheme'

defineProps<{
  theme: 'light' | 'dark'
  /** Raw preference (may be 'system'), distinct from the resolved `theme`. */
  themePreference: PmThemePreference
  speechSpeedLabel: string
}>()

/** Routed through the parent so usePmTheme's setPreference still persists it. */
const emit = defineEmits<{ (e: 'set-theme', preference: PmThemePreference): void }>()

const open = defineModel<boolean>({ required: true })
const speechSpeed = defineModel<number>('speechSpeed', { required: true })
const radioEffectsEnabled = defineModel<boolean>('radioEffectsEnabled', { required: true })
const readbackEnabled = defineModel<boolean>('readbackEnabled', { required: true })
const learningMode = defineModel<boolean>('learningMode', { required: true })
const debugMode = defineModel<boolean>('debugMode', { required: true })
const prerecEnabled = defineModel<boolean>('prerecEnabled', { required: true })
const prerecSeconds = defineModel<number>('prerecSeconds', { required: true })
const aiTrafficEnabled = defineModel<boolean>('aiTrafficEnabled', { required: true })

/**
 * Shown while AI traffic is on. These are deliberate v1 boundaries from the
 * architecture design, not bugs — stating them up front is cheaper than having
 * someone discover them mid-session and file them as defects.
 */
const AI_TRAFFIC_LIMITS = [
  'Background scenery only — it never affects how your own radio work is scored.',
  'Audible on the tuned frequency only. Other frequencies stay busy, just silent.',
  'Never transmits while you hold PTT, while ATC is answering you, or in the ~12s after an instruction.',
  'Fixed phraseology, no AI text generation. Invented waypoint names, not real SIDs/STARs.',
  'Traffic never conflicts with you: it always yields, and you get no extra instructions from it.',
]
</script>

<template>
  <v-dialog v-model="open" max-width="560" :content-class="theme === 'light' ? 'pm-dialog-light' : ''">
    <v-card :class="theme === 'light' ? 'bg-white border border-black/10 text-[#0f1420]' : 'bg-[#0b101d] border border-white/10 text-white'">
      <v-card-title class="flex items-center justify-between gap-2 text-base font-semibold">
        <div class="flex items-center gap-2">
          <v-icon icon="mdi-cog" size="20" color="cyan" />
          Settings
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="open = false" />
      </v-card-title>
      <v-card-text class="space-y-4">
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-white/40 mb-2 block">Theme</label>
          <div class="pm-seg">
            <button
                type="button"
                class="pm-seg-btn"
                :class="{ 'is-active': themePreference === 'dark' }"
                @click="emit('set-theme', 'dark')"
            >
              <v-icon size="16">mdi-weather-night</v-icon>
              Dark
            </button>
            <button
                type="button"
                class="pm-seg-btn"
                :class="{ 'is-active': themePreference === 'light' }"
                @click="emit('set-theme', 'light')"
            >
              <v-icon size="16">mdi-white-balance-sunny</v-icon>
              Light
            </button>
            <button
                type="button"
                class="pm-seg-btn"
                :class="{ 'is-active': themePreference === 'system' }"
                @click="emit('set-theme', 'system')"
            >
              <v-icon size="16">mdi-theme-light-dark</v-icon>
              System
            </button>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs uppercase tracking-[0.3em] text-white/40">
              Speech speed
            </label>
            <span class="text-xs font-mono text-white/60">{{ speechSpeedLabel }}</span>
          </div>
          <v-slider
              v-model="speechSpeed"
              :min="0.7"
              :max="1.3"
              :step="0.05"
              color="cyan"
              thumb-label
              hide-details
          />
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <v-switch
              v-model="radioEffectsEnabled"
              color="cyan"
              inset
              label="Radio effects"
              hide-details
          />
          <v-switch
              v-model="readbackEnabled"
              color="cyan"
              inset
              label="Readback voice"
              hide-details
          />
          <v-switch
              v-model="learningMode"
              color="cyan"
              inset
              label="Learning aid (expected comm)"
              hide-details
          />
          <!-- The single gate for all developer tooling; the debug panel is not
               even mounted while this is off. -->
          <v-switch
              v-model="debugMode"
              color="orange"
              inset
              label="Developer debug"
              hide-details
          />
        </div>

        <div class="pt-2 border-t border-white/10 space-y-3">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-white/40">Frequency</p>
            <p class="text-[11px] text-white/50 mt-1">
              Simulated other aircraft on your frequency — callsigns, readbacks, handovers — so the
              band sounds alive while you fly.
            </p>
          </div>
          <v-switch
              v-model="aiTrafficEnabled"
              color="cyan"
              inset
              label="AI traffic (background chatter)"
              hide-details
          />
          <!-- Surfaced rather than buried in a doc: every one of these is a
               deliberate v1 boundary, and knowing them up front is what stops
               them from reading as broken behaviour. -->
          <v-expand-transition>
            <ul v-if="aiTrafficEnabled" class="pm-ai-limits">
              <li v-for="limit in AI_TRAFFIC_LIMITS" :key="limit">
                <v-icon size="13" class="pm-ai-limits__icon">mdi-information-outline</v-icon>
                <span>{{ limit }}</span>
              </li>
            </ul>
          </v-expand-transition>
        </div>

        <div class="pt-2 border-t border-white/10 space-y-3">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-white/40">Voice input</p>
            <p class="text-[11px] text-white/50 mt-1">
              Pre-recording keeps the mic listening in the background so the start of your transmission isn't clipped.
            </p>
          </div>
          <v-switch
              v-model="prerecEnabled"
              color="cyan"
              inset
              label="Pre-recording (rolling buffer)"
              hide-details
          />
          <div :class="{ 'opacity-50 pointer-events-none': !prerecEnabled }">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs uppercase tracking-[0.3em] text-white/40">
                Pre-recording lead-in
              </label>
              <span class="text-xs font-mono text-white/60">{{ prerecSeconds.toFixed(1) }}s</span>
            </div>
            <v-slider
                v-model="prerecSeconds"
                :min="0.3"
                :max="2.5"
                :step="0.1"
                color="cyan"
                thumb-label
                hide-details
                :disabled="!prerecEnabled"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* The AI-traffic caveats. Quiet by design — they inform, they don't warn. */
.pm-ai-limits {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, #22d3ee 22%, transparent);
  background: color-mix(in srgb, #22d3ee 7%, transparent);
  list-style: none;
}
.pm-ai-limits li {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--t3);
}
.pm-ai-limits__icon {
  flex: none;
  margin-top: 1px;
  color: #22d3ee;
  opacity: 0.75;
}

/* Mirrors the page's segmented control so the sheet doesn't depend on
   live-atc.vue's scoped styles reaching a teleported dialog. */
.pm-seg {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
}
.pm-seg-btn {
  flex: 1 1 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--t3);
  transition: color 130ms ease, background 130ms ease;
  -webkit-tap-highlight-color: transparent;
}
.pm-seg-btn:hover {
  color: color-mix(in srgb, var(--text) 85%, transparent);
}
.pm-seg-btn.is-active {
  color: #050910;
  background: #22d3ee;
}
</style>
