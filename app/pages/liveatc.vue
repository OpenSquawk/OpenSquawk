<template>
  <div class="scene learn-theme">
    <!-- ═══════ SETUP SCREEN ═══════ -->
    <div v-if="screen === 'setup'" class="container setup-container">
      <header class="setup-header">
        <v-icon icon="mdi-radar" size="28" color="var(--accent)" />
        <h1 class="h2">Live ATC</h1>
        <span class="muted small" style="margin-left: auto">Phase Machine v2</span>
      </header>

      <div class="panel setup-form">
        <div class="setup-field">
          <label class="setup-label">Callsign</label>
          <input v-model="setupForm.callsign" class="input-field" placeholder="DLH39A" />
        </div>
        <div class="setup-row">
          <div class="setup-field">
            <label class="setup-label">Departure</label>
            <input v-model="setupForm.dep" class="input-field" placeholder="EDDF" />
          </div>
          <div class="setup-field">
            <label class="setup-label">Arrival</label>
            <input v-model="setupForm.arr" class="input-field" placeholder="EDDM" />
          </div>
        </div>
        <div class="setup-row">
          <div class="setup-field">
            <label class="setup-label">Aircraft</label>
            <input v-model="setupForm.aircraft" class="input-field" placeholder="A320" />
          </div>
          <div class="setup-field">
            <label class="setup-label">Squawk</label>
            <input v-model="setupForm.squawk" class="input-field" placeholder="4723" />
          </div>
        </div>

        <button class="btn primary" :disabled="!canStart" @click="startFlight">
          <v-icon icon="mdi-airplane-takeoff" size="20" />
          Start Flight
        </button>

        <button class="btn soft" @click="startDemo">
          <v-icon icon="mdi-play-circle-outline" size="18" />
          Demo: EDDF → EDDM
        </button>
      </div>
    </div>

    <!-- ═══════ LIVE SESSION ═══════ -->
    <div v-else-if="screen === 'session'" class="session-layout">
      <!-- Flight Header -->
      <header class="hud flight-header">
        <div class="flight-header-left">
          <span class="flight-callsign">{{ engine.state.vars.callsign }}</span>
          <span class="muted small">{{ engine.state.vars.dep }} → {{ engine.state.vars.dest }}</span>
        </div>
        <div class="flight-header-right">
          <span class="phase-badge">
            <span class="phase-dot" :class="{ 'phase-dot--emergency': engine.state.flags.emergencyActive }" />
            {{ engine.currentPhase.value?.unit ?? '—' }}
          </span>
          <span class="flight-freq">{{ engine.currentPhase.value?.frequency ?? '—' }}</span>
          <span v-if="telemetryConnected" class="telem-on" title="SimBridge connected">
            <v-icon icon="mdi-wifi" size="14" />
          </span>
          <span v-else class="telem-off" title="SimBridge disconnected">
            <v-icon icon="mdi-wifi-off" size="14" />
          </span>
        </div>
      </header>

      <!-- Phase Progress -->
      <AtcPhaseIndicator :current-phase="engine.state.currentPhase" />

      <!-- Latest ATC message -->
      <div v-if="latestAtcTx" class="panel latest-atc">
        <div class="latest-atc-header">
          <v-icon icon="mdi-tower-fire" size="16" color="var(--accent)" />
          <span class="latest-atc-label">ATC</span>
          <span v-if="isSpeaking" class="speaking-indicator">
            <span class="speaking-dot" /><span class="speaking-dot" /><span class="speaking-dot" />
          </span>
        </div>
        <div class="latest-atc-text">{{ latestAtcTx.message }}</div>
      </div>

      <!-- ═══════ PILOT SUGGESTION BUTTONS ═══════ -->
      <div class="suggestions-section">
        <div class="suggestions-header">
          <v-icon icon="mdi-account-voice" size="14" />
          <span>Your turn{{ engine.state.waitingFor === 'readback' ? ' (readback)' : '' }}</span>
        </div>
        <div class="suggestions-list">
          <template v-for="s in suggestions" :key="s.id">
            <!-- atc_initiates: shown as ATC action button -->
            <button
              v-if="s.type === 'atc_initiates'"
              class="btn mini suggestion-btn suggestion-btn--atc"
              :disabled="!s.available || processing"
              :title="s.available ? 'Trigger ATC action: ' + s.intent : 'Not available yet'"
              @click="handleAtcInitiated(s.id)"
            >
              <v-icon icon="mdi-tower-fire" size="14" />
              <span class="suggestion-intent">{{ s.intent }}</span>
            </button>
            <!-- pilot_initiates / readback_check: clickable pilot text -->
            <button
              v-else
              class="btn mini suggestion-btn"
              :class="{ 'suggestion-btn--disabled': !s.available }"
              :disabled="!s.available || processing"
              :title="s.available ? (s.example || s.intent) : `Requires: ${s.whenKey}`"
              @mousedown="startLongPress(s)"
              @mouseup="endLongPress(s)"
              @mouseleave="cancelLongPress"
              @touchstart.prevent="startLongPress(s)"
              @touchend.prevent="endLongPress(s)"
              @touchcancel="cancelLongPress"
            >
              <span class="suggestion-text">{{ s.example || s.intent }}</span>
            </button>
          </template>
        </div>

        <!-- Inline edit field (shown on long press) -->
        <form v-if="editingSuggestion" class="suggestion-edit" @submit.prevent="sendEditedSuggestion">
          <input
            ref="editInput"
            v-model="editText"
            class="input-field"
            @keydown.escape="editingSuggestion = null"
          />
          <button type="submit" class="btn primary mini" :disabled="!editText.trim() || processing">
            <v-icon icon="mdi-send" size="14" /> Send
          </button>
          <button type="button" class="btn ghost mini" @click="editingSuggestion = null">
            Cancel
          </button>
        </form>
      </div>

      <!-- PTT Button -->
      <AtcPttButton
        :frequency="engine.currentPhase.value?.frequency ?? '—'"
        :unit="engine.currentPhase.value?.unit ?? '—'"
        :disabled="processing"
        :loading="processing"
        @recording-complete="handleRecordingComplete"
      />

      <!-- Frequency Panel + Text Input -->
      <AtcFrequencyPanel
        :active-freq="engine.currentPhase.value?.frequency ?? '—'"
        :active-unit="engine.currentPhase.value?.unit ?? '—'"
        :standby-freq="standbyFreq"
        :standby-unit="standbyUnit"
        :loading="processing"
        @text-submit="handleTextSubmit"
        @swap="handleFreqSwap"
      />

      <!-- Emergency Button -->
      <div class="emergency-row">
        <button
          v-if="!engine.state.flags.emergencyActive"
          class="btn mini emergency-btn"
          @click="showEmergencyMenu = !showEmergencyMenu"
        >
          <v-icon icon="mdi-alert" size="16" /> EMERGENCY
        </button>
        <div v-if="showEmergencyMenu && !engine.state.flags.emergencyActive" class="emergency-menu panel">
          <button class="btn mini emergency-opt--mayday" @click="handleEmergency('mayday')">MAYDAY</button>
          <button class="btn mini emergency-opt--panpan" @click="handleEmergency('panpan')">PAN PAN</button>
        </div>
        <span v-if="engine.state.flags.emergencyActive" class="emergency-active-badge">
          <v-icon icon="mdi-alert" size="14" /> EMERGENCY ACTIVE
        </span>
      </div>

      <!-- Communication Log -->
      <div class="comm-log">
        <div class="comm-log-header muted small">
          <v-icon icon="mdi-format-list-text" size="16" />
          <span>Communications ({{ engine.state.transmissions.length }})</span>
        </div>
        <div ref="commLogScroll" class="comm-log-scroll">
          <AtcTransmissionCard
            v-for="tx in reversedTransmissions"
            :key="tx.id"
            :transmission="tx"
          />
          <div v-if="engine.state.transmissions.length === 0" class="comm-log-empty muted small">
            No transmissions yet. Start by requesting clearance.
          </div>
        </div>
      </div>

      <!-- ═══════ TELEMETRY DEBUGGER ═══════ -->
      <details class="panel debug-panel">
        <summary class="debug-summary">
          <v-icon icon="mdi-bug" size="16" /> Telemetry Debugger
        </summary>
        <div class="debug-body">
          <!-- Preset buttons -->
          <div class="debug-presets">
            <button
              v-for="preset in telemetryPresets"
              :key="preset.label"
              class="btn mini"
              :class="{ 'btn-active': activePreset === preset.label }"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          </div>

          <!-- Manual sliders -->
          <div class="debug-sliders">
            <div class="debug-slider-row">
              <label>Altitude (ft)</label>
              <input v-model.number="debugTelemetry.altitude_ft" type="range" min="0" max="45000" step="500" @input="applyDebugTelemetry" />
              <span class="debug-value">{{ debugTelemetry.altitude_ft }}</span>
            </div>
            <div class="debug-slider-row">
              <label>Speed (kts)</label>
              <input v-model.number="debugTelemetry.speed_kts" type="range" min="0" max="600" step="5" @input="applyDebugTelemetry" />
              <span class="debug-value">{{ debugTelemetry.speed_kts }}</span>
            </div>
            <div class="debug-slider-row">
              <label>Heading (deg)</label>
              <input v-model.number="debugTelemetry.heading_deg" type="range" min="0" max="360" step="1" @input="applyDebugTelemetry" />
              <span class="debug-value">{{ debugTelemetry.heading_deg }}°</span>
            </div>
            <div class="debug-slider-row">
              <label>VS (fpm)</label>
              <input v-model.number="debugTelemetry.vertical_speed_fpm" type="range" min="-4000" max="4000" step="100" @input="applyDebugTelemetry" />
              <span class="debug-value">{{ debugTelemetry.vertical_speed_fpm }}</span>
            </div>
            <div class="debug-slider-row">
              <label>On Ground</label>
              <input v-model="debugTelemetry.on_ground" type="checkbox" @change="applyDebugTelemetry" />
              <span class="debug-value">{{ debugTelemetry.on_ground ? 'Yes' : 'No' }}</span>
            </div>
          </div>

          <!-- Current engine state summary -->
          <div class="debug-state">
            <div class="debug-state-title muted small">Engine State</div>
            <div class="debug-state-row"><span>Phase:</span> <strong>{{ engine.state.currentPhase }}</strong></div>
            <div class="debug-state-row"><span>Interaction:</span> <code>{{ engine.state.currentInteraction ?? 'none' }}</code></div>
            <div class="debug-state-row"><span>Waiting for:</span> <code>{{ engine.state.waitingFor }}</code></div>
            <div class="debug-state-row"><span>In Air:</span> {{ engine.state.flags.inAir ? 'Yes' : 'No' }}</div>
          </div>
        </div>
      </details>

      <!-- Settings (collapsible) -->
      <details class="panel settings-panel">
        <summary class="settings-summary">
          <v-icon icon="mdi-cog" size="16" /> Settings
        </summary>
        <div class="settings-body">
          <div class="setting-row">
            <label>Signal Strength</label>
            <input v-model.number="settings.signalLevel" type="range" min="1" max="5" step="1" />
            <span class="debug-value">{{ settings.signalLevel }}</span>
          </div>
          <div class="setting-row">
            <label>Speech Speed</label>
            <input v-model.number="settings.speechSpeed" type="range" min="0.7" max="1.3" step="0.1" />
            <span class="debug-value">{{ settings.speechSpeed.toFixed(1) }}x</span>
          </div>
          <div class="setting-row">
            <label>Radio Effects</label>
            <input v-model="settings.radioEffects" type="checkbox" />
          </div>
          <div class="setting-row">
            <label>SimBridge Poll</label>
            <input v-model="settings.telemetryPoll" type="checkbox" />
            <span class="muted small">Poll /api/bridge/data every 2s</span>
          </div>
          <button class="btn soft mini" style="margin-top: 8px" @click="resetSession">
            <v-icon icon="mdi-restart" size="16" /> Reset Session
          </button>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAtcEngine, type InteractionSuggestion } from '~~/shared/atc/engine'
import { getPhase } from '~~/shared/atc/phases'
import type { Transmission, FlightPlan } from '~~/shared/atc/types'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: ['require-auth'] })

const api = useApi()
const auth = useAuthStore()

function authFetch<T = any>(url: string, opts: any = {}): Promise<T> {
  const headers = { ...opts.headers } as Record<string, string>
  if (auth.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return $fetch(url, { ...opts, headers }) as Promise<T>
}

const engine = useAtcEngine({ apiFetch: authFetch as any })
const screen = ref<'setup' | 'session'>('setup')
const processing = ref(false)
const isSpeaking = ref(false)
const showEmergencyMenu = ref(false)
const telemetryConnected = ref(false)
const commLogScroll = ref<HTMLElement | null>(null)

let audioContext: AudioContext | null = null
let telemetryInterval: ReturnType<typeof setInterval> | null = null

// ── Setup form ──
const setupForm = ref({
  callsign: '',
  dep: '',
  arr: '',
  aircraft: '',
  squawk: '',
})

const canStart = computed(() =>
  setupForm.value.callsign.trim() && setupForm.value.dep.trim() && setupForm.value.arr.trim()
)

// ── Settings ──
const settings = ref({
  signalLevel: 4,
  speechSpeed: 1.0,
  radioEffects: true,
  telemetryPoll: false,
})

onMounted(() => {
  const saved = localStorage.getItem('opensquawk-atc-settings')
  if (saved) {
    try { Object.assign(settings.value, JSON.parse(saved)) } catch {}
  }
})

watch(settings, (v) => {
  localStorage.setItem('opensquawk-atc-settings', JSON.stringify(v))
}, { deep: true })

// ── Standby frequency ──
const standbyFreq = computed(() => {
  const phase = engine.currentPhase.value
  if (!phase?.nextPhase) return undefined
  return getPhase(phase.nextPhase)?.frequency
})

const standbyUnit = computed(() => {
  const phase = engine.currentPhase.value
  if (!phase?.nextPhase) return undefined
  return getPhase(phase.nextPhase)?.unit
})

// ── Transmissions ──
const reversedTransmissions = computed<Transmission[]>(() =>
  ([...engine.state.transmissions] as Transmission[]).reverse()
)

const latestAtcTx = computed<Transmission | undefined>(() =>
  [...engine.state.transmissions].reverse().find(t => t.speaker === 'atc')
)

// ── Auto-scroll ──
watch(() => engine.state.transmissions.length, async () => {
  await nextTick()
  if (commLogScroll.value) {
    commLogScroll.value.scrollTop = 0
  }
})

// ── Pilot suggestion buttons ──
const suggestions = computed<InteractionSuggestion[]>(() => engine.getInteractionSuggestions())

// Long-press logic
const editingSuggestion = ref<InteractionSuggestion | null>(null)
const editText = ref('')
const editInput = ref<HTMLInputElement | null>(null)
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressTriggered = false

function startLongPress(s: InteractionSuggestion) {
  if (!s.available || processing.value) return
  longPressTriggered = false
  longPressTimer = setTimeout(() => {
    longPressTriggered = true
    editingSuggestion.value = s
    editText.value = s.example || s.intent
    nextTick(() => editInput.value?.focus())
  }, 500)
}

function endLongPress(s: InteractionSuggestion) {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  if (!longPressTriggered && s.available && !processing.value) {
    const text = s.example || s.intent
    if (text) handleTextSubmit(text)
  }
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function sendEditedSuggestion() {
  const text = editText.value.trim()
  if (!text) return
  editingSuggestion.value = null
  handleTextSubmit(text)
}

// ── ATC-initiated interactions ──
async function handleAtcInitiated(interactionId: string) {
  processing.value = true
  try {
    const atcText = engine.processAtcInitiated(interactionId)
    if (atcText) await speakAtc(atcText)
  } catch (e) {
    console.error('[LiveATC] ATC initiated error:', e)
  } finally {
    processing.value = false
  }
}

// ── Start flight ──
function startFlight() {
  const plan: FlightPlan = {
    callsign: setupForm.value.callsign.toUpperCase(),
    dep: setupForm.value.dep.toUpperCase(),
    arr: setupForm.value.arr.toUpperCase(),
    aircraft: setupForm.value.aircraft.toUpperCase() || undefined,
    squawk: setupForm.value.squawk || undefined,
  }
  engine.initFlight(plan)
  screen.value = 'session'
  startTelemetryPoll()
}

function startDemo() {
  engine.initFlight({
    callsign: 'DLH39A',
    dep: 'EDDF',
    arr: 'EDDM',
    aircraft: 'A320',
    squawk: '4723',
  })
  engine.state.vars.stand = 'V155'
  engine.state.vars.runway = '25R'
  engine.state.vars.sid = 'MARUN 7F'
  engine.state.vars.initial_alt = '5000'
  engine.state.vars.flight_level = 'FL240'
  engine.state.vars.qnh = '1013'
  engine.state.vars.ground_freq = '121.700'
  engine.state.vars.tower_freq = '118.500'
  engine.state.vars.departure_freq = '125.100'
  engine.state.vars.approach_freq = '119.100'
  engine.state.vars.center_freq = '132.600'
  engine.state.vars.atis_code = 'D'
  engine.state.vars.atis_freq = '118.025'
  engine.state.vars.push_direction = 'south'
  engine.state.vars.wind = '250/08'
  engine.state.vars.arrival_runway = '26L'
  engine.state.vars.arrival_stand = 'A22'
  engine.state.vars.approach_type = 'ILS'
  screen.value = 'session'
  startTelemetryPoll()
}

function resetSession() {
  engine.reset()
  screen.value = 'setup'
  stopTelemetryPoll()
  telemetryConnected.value = false
}

// ── PTT ──
async function handleRecordingComplete(payload: { audio: string; format: string }) {
  processing.value = true
  try {
    const sttRes = await api.post<{ success: boolean; transcription: string }>('/api/atc/ptt', {
      audio: payload.audio, format: payload.format,
    })
    if (!sttRes.success || !sttRes.transcription) return

    const atcText = await engine.handlePilotInput(sttRes.transcription, sttRes.transcription)
    await speakAtc(atcText)
  } catch (e) {
    console.error('[LiveATC] PTT error:', e)
    engine.state.transmissions.push({
      id: `err-${Date.now()}`,
      timestamp: new Date(),
      speaker: 'system',
      message: `Error: ${e instanceof Error ? e.message : 'Unknown error'}`,
      phase: engine.state.currentPhase,
      frequency: engine.currentPhase.value?.frequency ?? '',
      debug: {},
    } as any)
  } finally {
    processing.value = false
  }
}

// ── Text input ──
async function handleTextSubmit(text: string) {
  processing.value = true
  try {
    const atcText = await engine.handlePilotInput(text)
    await speakAtc(atcText)
  } catch (e) {
    console.error('[LiveATC] Text submit error:', e)
  } finally {
    processing.value = false
  }
}

// ── TTS ──
async function speakAtc(text: string) {
  if (!text) return
  const parts = text.split('\n').filter(Boolean)
  for (const part of parts) {
    await speakSingle(part)
  }
}

async function speakSingle(text: string) {
  try {
    const res = await api.post<{
      success: boolean
      audio: { base64: string; mime: string }
      normalized: string
    }>('/api/atc/say', {
      text,
      level: settings.value.signalLevel,
      speed: settings.value.speechSpeed,
    })

    if (!res.success || !res.audio?.base64) return

    isSpeaking.value = true
    const audioData = Uint8Array.from(atob(res.audio.base64), c => c.charCodeAt(0))
    if (!audioContext) audioContext = new AudioContext()
    const buffer = await audioContext.decodeAudioData(audioData.buffer.slice(0))
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.destination)
    source.start()

    await new Promise<void>(resolve => {
      source.onended = () => {
        isSpeaking.value = false
        resolve()
      }
    })
  } catch (e) {
    console.error('[LiveATC] TTS error:', e)
    isSpeaking.value = false
  }
}

// ── Emergency ──
function handleEmergency(type: 'mayday' | 'panpan') {
  showEmergencyMenu.value = false
  engine.declareEmergency(type)
}

// ── Frequency swap ──
function handleFreqSwap() {
  const phase = engine.currentPhase.value
  if (phase?.nextPhase) {
    engine.state.currentPhase = phase.nextPhase
    engine.state.currentInteraction = null
    engine.state.waitingFor = 'pilot'
  }
}

// ── Telemetry Polling ──
function startTelemetryPoll() {
  if (!settings.value.telemetryPoll) return
  stopTelemetryPoll()
  telemetryInterval = setInterval(async () => {
    try {
      const data = await api.post<any>('/api/bridge/data', { status: 'poll' }).catch(() => null)
      if (data && typeof data === 'object') {
        telemetryConnected.value = true
        engine.updateTelemetry({
          altitude_ft: data.PLANE_ALTITUDE ?? data.altitude_ft_true ?? 0,
          speed_kts: data.AIRSPEED_INDICATED ?? data.ias_kt ?? 0,
          groundspeed_kts: data.GROUND_VELOCITY ?? data.groundspeed_kt ?? 0,
          vertical_speed_fpm: data.VERTICAL_SPEED ?? data.vertical_speed_fpm ?? 0,
          heading_deg: data.PLANE_HEADING_DEGREES ?? 0,
          on_ground: data.SIM_ON_GROUND ?? data.on_ground ?? true,
        })
      }
    } catch {
      telemetryConnected.value = false
    }
  }, 2000)
}

function stopTelemetryPoll() {
  if (telemetryInterval) {
    clearInterval(telemetryInterval)
    telemetryInterval = null
  }
}

watch(() => settings.value.telemetryPoll, (v) => {
  if (v && screen.value === 'session') startTelemetryPoll()
  else stopTelemetryPoll()
})

// ── Telemetry Debugger ──
const activePreset = ref<string | null>(null)

const debugTelemetry = ref({
  altitude_ft: 0,
  speed_kts: 0,
  heading_deg: 0,
  vertical_speed_fpm: 0,
  on_ground: true,
})

interface TelemetryPreset {
  label: string
  values: {
    altitude_ft: number
    speed_kts: number
    heading_deg: number
    vertical_speed_fpm: number
    on_ground: boolean
  }
}

const telemetryPresets: TelemetryPreset[] = [
  { label: 'On Ground', values: { altitude_ft: 0, speed_kts: 0, heading_deg: 250, vertical_speed_fpm: 0, on_ground: true } },
  { label: 'Climbing', values: { altitude_ft: 5000, speed_kts: 250, heading_deg: 250, vertical_speed_fpm: 2500, on_ground: false } },
  { label: 'Cruise FL350', values: { altitude_ft: 35000, speed_kts: 480, heading_deg: 180, vertical_speed_fpm: 0, on_ground: false } },
  { label: 'Descending', values: { altitude_ft: 12000, speed_kts: 280, heading_deg: 180, vertical_speed_fpm: -1800, on_ground: false } },
  { label: 'On Final', values: { altitude_ft: 2000, speed_kts: 140, heading_deg: 260, vertical_speed_fpm: -700, on_ground: false } },
]

function applyPreset(preset: TelemetryPreset) {
  activePreset.value = preset.label
  Object.assign(debugTelemetry.value, preset.values)
  applyDebugTelemetry()
}

function applyDebugTelemetry() {
  engine.updateTelemetry({
    altitude_ft: debugTelemetry.value.altitude_ft,
    speed_kts: debugTelemetry.value.speed_kts,
    groundspeed_kts: debugTelemetry.value.speed_kts,
    heading_deg: debugTelemetry.value.heading_deg,
    vertical_speed_fpm: debugTelemetry.value.vertical_speed_fpm,
    on_ground: debugTelemetry.value.on_ground,
  })
}

onUnmounted(() => {
  stopTelemetryPoll()
  if (audioContext) audioContext.close()
})
</script>

<style scoped>
/* ═══════ BASE (self-contained, no classroom dependency) ═══════ */
.scene {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
}

/* ═══════ LAYOUT ═══════ */
.setup-container {
  max-width: 460px;
  margin: 0 auto;
  padding: 48px 20px 32px;
}

.session-layout {
  max-width: 520px;
  margin: 0 auto;
  padding: 12px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ═══════ SETUP ═══════ */
.setup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 20px;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.setup-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.setup-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--t3);
}

.setup-row {
  display: flex;
  gap: 12px;
}

/* ═══════ SHARED INPUT ═══════ */
.input-field {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--text) 7%, transparent),
    color-mix(in srgb, var(--text) 3%, transparent));
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
  font-size: 0.95rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
}

.input-field::placeholder {
  color: var(--t3);
}

/* ═══════ FLIGHT HEADER ═══════ */
.flight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  gap: 10px;
}

.flight-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-shrink: 1;
}

.flight-callsign {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.flight-header-left .muted {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.flight-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.phase-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
  white-space: nowrap;
}

.phase-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
  animation: phase-glow 2s ease-in-out infinite;
}

.phase-dot--emergency {
  background: #ef4444;
  animation: emergency-blink 0.6s ease-in-out infinite;
}

@keyframes phase-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes emergency-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.flight-freq {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  color: var(--t2);
  white-space: nowrap;
}

.telem-on { color: #22c55e; display: flex; align-items: center; }
.telem-off { color: var(--t3); opacity: 0.4; display: flex; align-items: center; }

/* ═══════ LATEST ATC ═══════ */
.latest-atc { padding: 14px 16px; }

.latest-atc-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.latest-atc-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  font-weight: 600;
}

.speaking-indicator { display: flex; gap: 3px; margin-left: 4px; }

.speaking-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: var(--accent);
  animation: speak-bounce 0.8s ease-in-out infinite;
}
.speaking-dot:nth-child(2) { animation-delay: 0.15s; }
.speaking-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes speak-bounce {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.latest-atc-text {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text);
  word-break: break-word;
}

/* ═══════ PILOT SUGGESTIONS ═══════ */
.suggestions-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 2px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.suggestion-btn {
  text-align: left;
  white-space: normal;
  line-height: 1.4;
  padding: 10px 14px;
  font-size: 0.82rem;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  word-break: break-word;
}

.suggestion-text {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
}

.suggestion-intent {
  font-size: 0.78rem;
  color: var(--t2);
}

.suggestion-btn--atc {
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.suggestion-btn--disabled { opacity: 0.35; }

.suggestion-edit {
  display: flex;
  gap: 8px;
  align-items: center;
}

.suggestion-edit .input-field {
  flex: 1;
  font-size: 0.85rem;
  padding: 8px 10px;
  min-width: 0;
}

/* ═══════ EMERGENCY ═══════ */
.emergency-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.emergency-btn {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.emergency-btn:hover { background: rgba(239, 68, 68, 0.2); }

.emergency-menu {
  display: flex;
  gap: 8px;
  padding: 8px;
}

.emergency-opt--mayday {
  background: #ef4444 !important;
  color: #fff !important;
  border-color: #ef4444 !important;
  font-weight: 700;
}

.emergency-opt--panpan {
  background: #f59e0b !important;
  color: #000 !important;
  border-color: #f59e0b !important;
  font-weight: 700;
}

.emergency-active-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  color: #ef4444;
  font-size: 0.7rem;
  font-weight: 700;
  animation: emergency-blink 0.6s ease-in-out infinite;
}

/* ═══════ COMM LOG ═══════ */
.comm-log {
  margin-top: 2px;
}

.comm-log-header {
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  margin-bottom: 8px;
  padding: 0 2px;
}

.comm-log-scroll {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 400px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.comm-log-scroll::-webkit-scrollbar { width: 4px; }
.comm-log-scroll::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 2px;
}

.comm-log-empty { text-align: center; padding: 24px; }

/* ═══════ DEBUG & SETTINGS ═══════ */
.debug-panel, .settings-panel {
  margin-top: 2px;
}

.debug-summary, .settings-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--t3);
  user-select: none;
}

.debug-body, .settings-body {
  padding: 4px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.debug-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.btn-active {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent) !important;
  color: var(--accent) !important;
  background: color-mix(in srgb, var(--accent) 14%, transparent) !important;
}

.debug-sliders {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.debug-slider-row, .setting-row {
  display: grid;
  grid-template-columns: 90px 1fr 55px;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--t2);
}

.debug-slider-row label, .setting-row label {
  color: var(--t3);
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.debug-slider-row input[type="range"], .setting-row input[type="range"] {
  width: 100%;
  accent-color: var(--accent);
}

.debug-slider-row input[type="checkbox"], .setting-row input[type="checkbox"] {
  accent-color: var(--accent);
  justify-self: start;
}

.debug-value {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  color: var(--accent);
  text-align: right;
  white-space: nowrap;
}

.debug-state {
  border-top: 1px solid var(--border, rgba(255,255,255,.1));
  padding-top: 10px;
}

.debug-state-title {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.debug-state-row {
  display: flex;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--t2);
  padding: 2px 0;
}

.debug-state-row span { color: var(--t3); min-width: 90px; flex-shrink: 0; }

.debug-state-row code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  color: var(--accent);
  word-break: break-all;
}

/* ═══════ RESPONSIVE ═══════ */
@media (max-width: 400px) {
  .session-layout {
    padding: 8px 12px 24px;
    gap: 12px;
  }

  .flight-header {
    padding: 8px 10px;
  }

  .flight-callsign {
    font-size: 1rem;
  }

  .debug-slider-row, .setting-row {
    grid-template-columns: 80px 1fr 45px;
    gap: 6px;
  }
}
</style>
