<template>
  <div
    class="tx-card"
    :class="[`tx-card--${speaker}`, { 'tx-card--entered': entered }]"
  >
    <!-- Header row -->
    <div class="tx-header">
      <div class="tx-speaker">
        <v-icon :icon="speakerIcon" size="16" :color="speakerColor" />
        <span class="tx-speaker-label" :style="{ color: speakerColor }">
          {{ speakerLabel }}
        </span>
      </div>

      <div class="tx-badges">
        <span v-if="transmission.debug?.telemetryTrigger" class="tx-badge tx-badge--telemetry">
          <span class="tx-badge-bolt">&#9889;</span> TELEMETRY
        </span>
        <span v-if="transmission.debug?.readbackResult && !transmission.debug.readbackResult.complete" class="tx-badge tx-badge--readback">
          READBACK INCOMPLETE
        </span>
        <span class="tx-badge tx-badge--phase">{{ transmission.phase }}</span>
        <span class="tx-badge tx-badge--freq">{{ transmission.frequency }}</span>
        <span class="tx-timestamp">{{ formattedTime }}</span>
      </div>
    </div>

    <!-- Message body -->
    <div class="tx-message">{{ transmission.message }}</div>

    <!-- Normalized text (if different) -->
    <div
      v-if="transmission.normalized && transmission.normalized !== transmission.message"
      class="tx-normalized"
    >
      <span class="tx-normalized-label">Normalized:</span> {{ transmission.normalized }}
    </div>

    <!-- Debug toggle -->
    <button
      v-if="hasDebug"
      class="tx-details-toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <v-icon
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="14"
      />
      <span>{{ expanded ? 'Hide details' : 'Details' }}</span>
    </button>

    <!-- Debug section -->
    <div v-show="expanded" class="tx-debug glass">
      <!-- STT Raw -->
      <div v-if="debug.sttRaw" class="tx-debug-section">
        <div class="tx-debug-title">STT Raw Input</div>
        <code class="tx-debug-code">{{ debug.sttRaw }}</code>
      </div>

      <!-- LLM Decision -->
      <div v-if="debug.llmRequest || debug.llmResponse" class="tx-debug-section">
        <div class="tx-debug-title">LLM Decision</div>

        <div v-if="debug.llmResponse" class="tx-debug-meta">
          <span
            class="tx-badge tx-badge--confidence"
            :class="`tx-badge--confidence-${debug.llmResponse.confidence}`"
          >
            {{ debug.llmResponse.confidence }}
          </span>
          <span class="tx-debug-dim">
            {{ debug.llmResponse.model }} &middot;
            {{ debug.llmResponse.tokensUsed }} tokens &middot;
            {{ debug.llmResponse.durationMs }}ms
          </span>
        </div>

        <!-- Candidates -->
        <div v-if="debug.llmRequest?.candidates" class="tx-debug-candidates">
          <div
            v-for="c in debug.llmRequest.candidates"
            :key="c.id"
            class="tx-candidate"
            :class="{ 'tx-candidate--chosen': isChosen(c.id) }"
          >
            <span class="tx-candidate-icon">{{ isChosen(c.id) ? '\u2713' : '\u2717' }}</span>
            <span class="tx-candidate-id">{{ c.id }}</span>
            <span class="tx-candidate-intent">{{ c.intent }}</span>
          </div>
        </div>

        <div v-if="debug.llmResponse?.reason" class="tx-debug-reason">
          <span class="tx-debug-dim">Reason:</span> {{ debug.llmResponse.reason }}
        </div>
      </div>

      <!-- Engine Action -->
      <div v-if="debug.engineAction" class="tx-debug-section">
        <div class="tx-debug-title">Engine Action</div>

        <div v-if="debug.engineAction.templateUsed" class="tx-debug-row">
          <span class="tx-debug-dim">Template:</span>
          <code class="tx-debug-code">{{ debug.engineAction.templateUsed }}</code>
        </div>

        <div v-if="debug.engineAction.variablesUpdated && Object.keys(debug.engineAction.variablesUpdated).length" class="tx-debug-row">
          <span class="tx-debug-dim">Variables:</span>
          <span
            v-for="(val, key) in debug.engineAction.variablesUpdated"
            :key="String(key)"
            class="tx-var-chip"
          >
            {{ key }}={{ val }}
          </span>
        </div>

        <div v-if="debug.engineAction.handoff" class="tx-debug-row">
          <span class="tx-debug-dim">Handoff:</span>
          {{ debug.engineAction.handoff.from }} &rarr; {{ debug.engineAction.handoff.to }}
        </div>

        <div v-if="debug.engineAction.phaseChanged" class="tx-debug-row">
          <span class="tx-debug-dim">Phase:</span>
          {{ debug.engineAction.phaseChanged.from }} &rarr; {{ debug.engineAction.phaseChanged.to }}
        </div>
      </div>

      <!-- Telemetry Trigger -->
      <div v-if="debug.telemetryTrigger" class="tx-debug-section">
        <div class="tx-debug-title">Telemetry Trigger</div>
        <div class="tx-debug-row">
          <span class="tx-debug-dim">Parameter:</span> {{ debug.telemetryTrigger.parameter }}
        </div>
        <div class="tx-debug-row">
          <span class="tx-debug-dim">Condition:</span> {{ debug.telemetryTrigger.condition }}
        </div>
        <div class="tx-debug-row">
          <span class="tx-debug-dim">Value:</span>
          <code class="tx-debug-code">{{ debug.telemetryTrigger.value }}</code>
        </div>
      </div>

      <!-- Readback Result -->
      <div v-if="debug.readbackResult" class="tx-debug-section">
        <div class="tx-debug-title">Readback</div>
        <div class="tx-debug-row">
          <span
            class="tx-badge"
            :class="debug.readbackResult.complete ? 'tx-badge--rb-ok' : 'tx-badge--rb-fail'"
          >
            {{ debug.readbackResult.complete ? 'Complete' : 'Incomplete' }}
          </span>
          <span v-if="debug.readbackResult.missing?.length" class="tx-debug-dim">
            Missing: {{ debug.readbackResult.missing.join(', ') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Transmission, TransmissionDebug } from '~~/shared/atc/types'

const props = defineProps<{ transmission: Transmission }>()

const expanded = ref(false)
const entered = ref(false)

onMounted(() => {
  requestAnimationFrame(() => { entered.value = true })
})

const speaker = computed(() => props.transmission.speaker)
const debug = computed(() => props.transmission.debug ?? ({} as TransmissionDebug))

const hasDebug = computed(() => {
  const d = debug.value
  return !!(d.sttRaw || d.llmRequest || d.llmResponse || d.engineAction || d.telemetryTrigger || d.readbackResult)
})

const speakerIcon = computed(() => {
  const map = { pilot: 'mdi-account-voice', atc: 'mdi-tower-fire', system: 'mdi-cog' }
  return map[speaker.value] ?? 'mdi-cog'
})

const speakerColor = computed(() => {
  const map = { pilot: '#3b82f6', atc: '#22d3ee', system: 'rgba(255,255,255,0.3)' }
  return map[speaker.value] ?? 'rgba(255,255,255,0.3)'
})

const speakerLabel = computed(() => {
  const map = { pilot: 'PILOT', atc: 'ATC', system: 'SYSTEM' }
  return map[speaker.value] ?? 'SYSTEM'
})

const formattedTime = computed(() => {
  const d = new Date(props.transmission.timestamp)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':')
})

function isChosen(id: string): boolean {
  return debug.value.llmResponse?.chosenInteraction === id
}
</script>

<style scoped>
.tx-card {
  position: relative;
  padding: 10px 14px;
  border-left: 3px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.tx-card--entered {
  opacity: 1;
  transform: translateY(0);
}

.tx-card--pilot {
  border-left-color: #3b82f6;
}

.tx-card--atc {
  border-left-color: var(--accent);
}

.tx-card--system {
  border-left-color: rgba(255, 255, 255, 0.15);
}

.tx-card--system .tx-message {
  font-size: 0.82rem;
  color: var(--t3);
}

/* Header */
.tx-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.tx-speaker {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.tx-speaker-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.tx-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tx-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--t2);
}

.tx-badge--phase {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 25%, transparent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.tx-badge--freq {
  color: var(--t3);
}

.tx-badge--telemetry {
  color: #facc15;
  border-color: rgba(250, 204, 21, 0.3);
  background: rgba(250, 204, 21, 0.08);
}

.tx-badge-bolt {
  font-size: 0.7rem;
}

.tx-badge--readback {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.08);
}

.tx-timestamp {
  font-size: 0.65rem;
  color: var(--t3);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

/* Message */
.tx-message {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text);
  margin: 2px 0 4px;
}

.tx-normalized {
  font-size: 0.76rem;
  color: var(--t3);
  margin-bottom: 4px;
}

.tx-normalized-label {
  font-weight: 600;
  color: var(--t3);
}

/* Details toggle */
.tx-details-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--t3);
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;
}

.tx-details-toggle:hover {
  color: var(--accent);
  background: rgba(255, 255, 255, 0.04);
}

/* Debug panel */
.tx-debug {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.78rem;
  line-height: 1.6;
  color: var(--t2);
}

.tx-debug-section {
  padding: 6px 0;
}

.tx-debug-section + .tx-debug-section {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.tx-debug-title {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 4px;
}

.tx-debug-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.tx-debug-dim {
  color: var(--t3);
  font-size: 0.74rem;
}

.tx-debug-code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.74rem;
  background: rgba(255, 255, 255, 0.04);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--t2);
}

.tx-debug-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 1px 0;
}

.tx-debug-reason {
  margin-top: 4px;
  font-style: italic;
  color: var(--t3);
}

/* Confidence badges */
.tx-badge--confidence {
  font-weight: 700;
  text-transform: uppercase;
}

.tx-badge--confidence-high {
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.08);
}

.tx-badge--confidence-medium {
  color: #facc15;
  border-color: rgba(250, 204, 21, 0.3);
  background: rgba(250, 204, 21, 0.08);
}

.tx-badge--confidence-low {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.08);
}

/* Candidates */
.tx-debug-candidates {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 4px 0;
}

.tx-candidate {
  display: grid;
  grid-template-columns: 16px auto 1fr;
  align-items: baseline;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.72rem;
  color: var(--t3);
}

.tx-candidate--chosen {
  background: rgba(74, 222, 128, 0.06);
  color: #4ade80;
}

.tx-candidate-icon {
  font-size: 0.8rem;
  text-align: center;
  flex-shrink: 0;
}

.tx-candidate--chosen .tx-candidate-icon {
  color: #4ade80;
}

.tx-candidate-id {
  font-weight: 600;
  white-space: nowrap;
}

.tx-candidate-intent {
  color: var(--t3);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Variable chips */
.tx-var-chip {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.7rem;
  background: rgba(255, 255, 255, 0.04);
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--t2);
}

/* Readback */
.tx-badge--rb-ok {
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.08);
}

.tx-badge--rb-fail {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.08);
}
</style>
