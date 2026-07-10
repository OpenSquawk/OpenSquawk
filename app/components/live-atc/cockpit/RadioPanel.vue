<script setup lang="ts">
import { computed } from 'vue'
import type { HoldSelectOption } from '~/components/HoldSelect.vue'
import { normalizeManualFreq } from '../../../../shared/utils/frequency'
import {
  FREQUENCY_PLACEHOLDER,
  FREQ_ROLE_LABEL,
  normalizedFrequencyValue,
  type DisplayAirportFrequencyEntry,
} from '~/composables/useFrequencyPresets'

const props = defineProps<{
  active: string
  standby: string
  /** Published frequencies for the current airport — feeds the channel row. */
  channels: DisplayAirportFrequencyEntry[]
  presetOptions: HoldSelectOption[]
  readabilityOptions: HoldSelectOption[]
  signalStrength: number
  swapAnimation: boolean
  airportName?: string
}>()

const emit = defineEmits<{
  (e: 'swap'): void
  (e: 'select-active', option: HoldSelectOption): void
  (e: 'select-standby', option: HoldSelectOption): void
  (e: 'select-channel', entry: DisplayAirportFrequencyEntry): void
  (e: 'select-readability', option: HoldSelectOption): void
  (e: 'apply-manual', target: 'active' | 'standby', close: () => void): void
}>()

const manualFreqActive = defineModel<string>('manualFreqActive', { required: true })
const manualFreqStandby = defineModel<string>('manualFreqStandby', { required: true })

const tunableChannels = computed(() =>
  props.channels.filter(entry => entry.frequency && entry.frequency !== FREQUENCY_PLACEHOLDER),
)

/** The station that owns a frequency, e.g. "Frankfurt Tower" — shown under each window. */
const stationFor = (frequency: string): string => {
  const normalized = normalizedFrequencyValue(frequency)
  if (!normalized) return ''
  const entry = tunableChannels.value.find(
    candidate => normalizedFrequencyValue(candidate.frequency) === normalized,
  )
  if (!entry) return ''
  const role = FREQ_ROLE_LABEL[entry.type] || entry.type
  return props.airportName ? `${props.airportName} ${role}` : role
}

const activeStation = computed(() => stationFor(props.active))
const standbyStation = computed(() => stationFor(props.standby))

const isTuned = (entry: DisplayAirportFrequencyEntry) =>
  Boolean(props.active) && normalizedFrequencyValue(entry.frequency) === normalizedFrequencyValue(props.active)

const channelLabel = (entry: DisplayAirportFrequencyEntry) => FREQ_ROLE_LABEL[entry.type] || entry.type
</script>

<template>
  <section class="radio-panel" aria-label="Radio">
    <header class="radio-panel__head">
      <span class="radio-panel__title">COM 1</span>

      <HoldSelect
          :options="readabilityOptions"
          placement="down"
          title="Readability"
          @select="emit('select-readability', $event)"
      >
        <template #default="{ open }">
          <button type="button" class="signal-chip" :class="{ 'is-open': open }" aria-label="Set readability">
            <span class="signal-bars">
              <span
                  v-for="i in 5"
                  :key="i"
                  class="signal-bar"
                  :class="{ 'signal-active': i <= signalStrength }"
              />
            </span>
          </button>
        </template>
      </HoldSelect>
    </header>

    <div class="radio-panel__windows">
      <HoldSelect
          :options="presetOptions"
          placement="down"
          title="Select standby frequency"
          menu-class="freq-hold-menu"
          @select="emit('select-standby', $event)"
      >
        <template #default="{ open }">
          <button type="button" class="freq-window freq-window--sby" :class="{ 'is-open': open }">
            <span class="freq-window__tag">STANDBY</span>
            <span class="freq-window__value">{{ standby || '---.---' }}</span>
            <span class="freq-window__station">{{ standbyStation || '—' }}</span>
          </button>
        </template>
        <template #option="{ option }">
          <v-tooltip :text="`Source: ${option.sourceLabel}`" location="end" open-delay="200">
            <template #activator="{ props: tip }">
              <div v-bind="tip" class="freq-option">
                <div class="freq-option-main">
                  <span class="freq-option-label">{{ option.label }}</span>
                  <span class="freq-option-sub">{{ option.sublabel }}</span>
                </div>
                <span class="freq-option-source" :aria-label="`Source ${option.sourceLabel}`">
                  {{ option.sourceLabel }}
                </span>
              </div>
            </template>
          </v-tooltip>
        </template>
        <template #header="{ close }">
          <form class="freq-manual" @submit.prevent="emit('apply-manual', 'standby', close)">
            <input
                v-model="manualFreqStandby"
                class="freq-manual-input"
                type="text"
                inputmode="decimal"
                placeholder="Manuell, z.B. 121.500"
                maxlength="7"
                aria-label="Manual standby frequency"
            >
            <button type="submit" class="freq-manual-btn" :disabled="!normalizeManualFreq(manualFreqStandby)">SET</button>
          </form>
        </template>
      </HoldSelect>

      <button
          type="button"
          class="freq-swap-btn"
          aria-label="Swap active and standby frequencies"
          @click="emit('swap')"
      >
        <v-icon :class="{ 'swap-animation': swapAnimation }">mdi-swap-horizontal</v-icon>
      </button>

      <HoldSelect
          :options="presetOptions"
          placement="down"
          title="Select active frequency"
          menu-class="freq-hold-menu"
          @select="emit('select-active', $event)"
      >
        <template #default="{ open }">
          <button type="button" class="freq-window freq-window--act" :class="{ 'is-open': open }">
            <span class="freq-window__tag">ACTIVE</span>
            <span class="freq-window__value">{{ active || '---.---' }}</span>
            <span class="freq-window__station">{{ activeStation || '—' }}</span>
          </button>
        </template>
        <template #option="{ option }">
          <v-tooltip :text="`Source: ${option.sourceLabel}`" location="end" open-delay="200">
            <template #activator="{ props: tip }">
              <div v-bind="tip" class="freq-option">
                <div class="freq-option-main">
                  <span class="freq-option-label">{{ option.label }}</span>
                  <span class="freq-option-sub">{{ option.sublabel }}</span>
                </div>
                <span class="freq-option-source" :aria-label="`Source ${option.sourceLabel}`">
                  {{ option.sourceLabel }}
                </span>
              </div>
            </template>
          </v-tooltip>
        </template>
        <template #header="{ close }">
          <form class="freq-manual" @submit.prevent="emit('apply-manual', 'active', close)">
            <input
                v-model="manualFreqActive"
                class="freq-manual-input"
                type="text"
                inputmode="decimal"
                placeholder="Manuell, z.B. 121.500"
                maxlength="7"
                aria-label="Manual active frequency"
            >
            <button type="submit" class="freq-manual-btn" :disabled="!normalizeManualFreq(manualFreqActive)">SET</button>
          </form>
        </template>
      </HoldSelect>
    </div>

    <!-- Published channels for this airport; tapping one stages it in standby. -->
    <div v-if="tunableChannels.length" class="radio-panel__channels" role="group" aria-label="Published frequencies">
      <button
          v-for="entry in tunableChannels"
          :key="entry.displayKey"
          type="button"
          class="chan"
          :class="{ on: isTuned(entry) }"
          :title="`${channelLabel(entry)} · ${entry.frequency}`"
          @click="emit('select-channel', entry)"
      >
        <span class="chan__role">{{ channelLabel(entry) }}</span>
        <span class="chan__freq">{{ entry.frequency }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.radio-panel {
  position: relative;
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

.radio-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.radio-panel__title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--t4);
}

/* Two windows flanking the swap button, like a physical radio stack. */
.radio-panel__windows {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  gap: 10px;
}

.radio-panel__windows > :deep(*) {
  min-width: 0;
}

.freq-window {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  transition: border-color 120ms ease, background 120ms ease;
  text-align: left;
}

.freq-window:hover,
.freq-window.is-open {
  border-color: rgba(34, 211, 238, 0.5);
  background: rgba(34, 211, 238, 0.07);
}

.freq-window__tag {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--t4);
}

.freq-window__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  /* Scales down on narrow phones so 7 monospace digits never overflow the window. */
  font-size: clamp(18px, 6vw, 26px);
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
  color: var(--t2);
  max-width: 100%;
}

.freq-window__station {
  font-size: 10.5px;
  color: var(--t4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* The active window is the one the pilot is transmitting on — make it read as "live". */
.freq-window--act {
  border-color: rgba(34, 211, 238, 0.35);
  background: rgba(34, 211, 238, 0.08);
}

.freq-window--act .freq-window__tag {
  color: #67e8f9;
}

.freq-window--act .freq-window__value {
  color: #a5f3fc;
  text-shadow: 0 0 12px rgba(34, 211, 238, 0.55);
}

.freq-swap-btn {
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(34, 211, 238, 0.4);
  background: rgba(34, 211, 238, 0.1);
  color: #67e8f9;
  transition: background 120ms ease, transform 80ms ease;
}

.freq-swap-btn:hover {
  background: rgba(34, 211, 238, 0.2);
}

.freq-swap-btn:active {
  transform: scale(0.94);
}

.swap-animation {
  transform: rotate(180deg);
  transition: transform 0.5s ease;
}

/* Channel row — horizontally scrollable on narrow screens. */
.radio-panel__channels {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}

.radio-panel__channels::-webkit-scrollbar {
  display: none;
}

.chan {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 5px 10px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--pm-surface-1);
  transition: border-color 120ms ease, background 120ms ease, color 120ms ease;
}

.chan:hover {
  border-color: rgba(34, 211, 238, 0.5);
  background: rgba(34, 211, 238, 0.08);
}

.chan__role {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--t4);
}

.chan__freq {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  color: var(--t2);
  font-variant-numeric: tabular-nums;
}

.chan.on {
  border-color: rgba(34, 211, 238, 0.65);
  background: rgba(34, 211, 238, 0.14);
}

.chan.on .chan__role {
  color: #67e8f9;
}

.chan.on .chan__freq {
  color: #a5f3fc;
}

/* Readability trigger */
.signal-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 32px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid rgba(34, 211, 238, 0.35);
  background: rgba(34, 211, 238, 0.09);
  transition: background 120ms ease, transform 80ms ease;
}

.signal-chip:hover {
  background: rgba(34, 211, 238, 0.16);
}

.signal-chip.is-open {
  background: rgba(34, 211, 238, 0.18);
  transform: scale(0.97);
}

.signal-bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
}

.signal-bar {
  width: 3px;
  height: 12px;
  background: color-mix(in srgb, var(--text) 20%, transparent);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.signal-bar:nth-child(1) { height: 4px; }
.signal-bar:nth-child(2) { height: 6px; }
.signal-bar:nth-child(3) { height: 8px; }
.signal-bar:nth-child(4) { height: 10px; }
.signal-bar:nth-child(5) { height: 12px; }

.signal-bar.signal-active {
  background: #22d3ee;
  box-shadow: 0 0 4px #22d3ee;
}

/* Hold-select menu internals (rendered inside HoldSelect's menu slot) */
.freq-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}
.freq-option-main {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}
.freq-option-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.1;
}
.freq-option-sub {
  font-size: 11px;
  color: color-mix(in srgb, var(--text) 55%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: 1.1;
}
.freq-option-source {
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(103, 232, 249, 0.78);
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(34, 211, 238, 0.4);
  background: rgba(34, 211, 238, 0.08);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Manual free-tune frequency entry inside the freq hold-select menu */
.freq-manual {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 0;
  margin-bottom: 4px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.freq-manual-input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
  background: color-mix(in srgb, var(--text) 4%, transparent);
  color: var(--text);
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  outline: none;
}
.freq-manual-input::placeholder {
  color: var(--t4);
  font-family: inherit;
}
.freq-manual-input:focus {
  border-color: rgba(34, 211, 238, 0.6);
  background: rgba(34, 211, 238, 0.06);
}
.freq-manual-btn {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid rgba(34, 211, 238, 0.4);
  background: rgba(34, 211, 238, 0.12);
  color: #67e8f9;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 90ms ease, opacity 90ms ease;
}
.freq-manual-btn:hover {
  background: rgba(34, 211, 238, 0.2);
}
.freq-manual-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .freq-window,
  .chan,
  .signal-chip,
  .freq-swap-btn,
  .swap-animation {
    transition: none;
  }
}
</style>
