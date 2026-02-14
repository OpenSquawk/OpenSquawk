<template>
  <div class="atc-scene">
    <!-- ═══════ SETUP SCREEN ═══════ -->
    <div v-if="screen === 'setup'" class="atc-setup">
      <header class="setup-header">
        <v-icon icon="mdi-radar" size="28" color="var(--accent)" />
        <h1 class="setup-title">Live ATC</h1>
        <span class="setup-sub">Phase Machine v2</span>
      </header>

      <div class="setup-form glass panel">
        <div class="setup-field">
          <label class="setup-label">Callsign</label>
          <input v-model="setupForm.callsign" class="setup-input" placeholder="DLH39A" />
        </div>
        <div class="setup-row">
          <div class="setup-field">
            <label class="setup-label">Departure</label>
            <input v-model="setupForm.dep" class="setup-input" placeholder="EDDF" />
          </div>
          <div class="setup-field">
            <label class="setup-label">Arrival</label>
            <input v-model="setupForm.arr" class="setup-input" placeholder="EDDM" />
          </div>
        </div>
        <div class="setup-row">
          <div class="setup-field">
            <label class="setup-label">Aircraft</label>
            <input v-model="setupForm.aircraft" class="setup-input" placeholder="A320" />
          </div>
          <div class="setup-field">
            <label class="setup-label">Squawk</label>
            <input v-model="setupForm.squawk" class="setup-input" placeholder="4723" />
          </div>
        </div>

        <button class="setup-start-btn" :disabled="!canStart" @click="startFlight">
          <v-icon icon="mdi-airplane-takeoff" size="20" />
          Start Flight
        </button>

        <button class="setup-demo-btn" @click="startDemo">
          <v-icon icon="mdi-play-circle-outline" size="18" />
          Demo: EDDF → EDDM
        </button>
      </div>
    </div>

    <!-- ═══════ LIVE SESSION ═══════ -->
    <div v-else-if="screen === 'session'" class="atc-session">
      <!-- Flight Header -->
      <header class="flight-header hud">
        <div class="flight-header-left">
          <span class="flight-callsign">{{ engine.state.vars.callsign }}</span>
          <span class="flight-route">{{ engine.state.vars.dep }} → {{ engine.state.vars.dest }}</span>
        </div>
        <div class="flight-header-right">
          <span class="flight-phase-badge">
            <span class="phase-dot" :class="{ 'phase-dot--emergency': engine.state.flags.emergencyActive }" />
            {{ engine.currentPhase.value?.unit ?? '—' }}
          </span>
          <span class="flight-freq">{{ engine.currentPhase.value?.frequency ?? '—' }}</span>
          <span v-if="telemetryConnected" class="telem-indicator telem-indicator--on" title="SimBridge connected">
            <v-icon icon="mdi-wifi" size="14" />
          </span>
          <span v-else class="telem-indicator telem-indicator--off" title="SimBridge disconnected">
            <v-icon icon="mdi-wifi-off" size="14" />
          </span>
        </div>
      </header>

      <!-- Phase Progress -->
      <AtcPhaseIndicator :current-phase="engine.state.currentPhase" />

      <!-- Latest ATC message (highlighted) -->
      <div v-if="latestAtcTx" class="latest-atc glass panel">
        <div class="latest-atc-header">
          <v-icon icon="mdi-tower-beach" size="16" color="var(--accent)" />
          <span class="latest-atc-label">ATC</span>
          <span v-if="isSpeaking" class="speaking-indicator">
            <span class="speaking-dot" /><span class="speaking-dot" /><span class="speaking-dot" />
          </span>
        </div>
        <div class="latest-atc-text">{{ latestAtcTx.message }}</div>
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
          class="emergency-btn"
          @click="showEmergencyMenu = !showEmergencyMenu"
        >
          <v-icon icon="mdi-alert" size="16" /> EMERGENCY
        </button>
        <div v-if="showEmergencyMenu && !engine.state.flags.emergencyActive" class="emergency-menu glass">
          <button class="emergency-option emergency-option--mayday" @click="handleEmergency('mayday')">
            MAYDAY
          </button>
          <button class="emergency-option emergency-option--panpan" @click="handleEmergency('panpan')">
            PAN PAN
          </button>
        </div>
        <span v-if="engine.state.flags.emergencyActive" class="emergency-active-badge">
          <v-icon icon="mdi-alert" size="14" /> EMERGENCY ACTIVE
        </span>
      </div>

      <!-- Communication Log -->
      <div class="comm-log">
        <div class="comm-log-header">
          <v-icon icon="mdi-format-list-text" size="16" />
          <span>Communications ({{ engine.state.transmissions.length }})</span>
        </div>
        <div ref="commLogScroll" class="comm-log-scroll">
          <AtcTransmissionCard
            v-for="tx in reversedTransmissions"
            :key="tx.id"
            :transmission="tx"
          />
          <div v-if="engine.state.transmissions.length === 0" class="comm-log-empty">
            No transmissions yet. Start by requesting clearance.
          </div>
        </div>
      </div>

      <!-- Settings (collapsible) -->
      <details class="settings-panel glass">
        <summary class="settings-summary">
          <v-icon icon="mdi-cog" size="16" /> Settings
        </summary>
        <div class="settings-body">
          <div class="setting-row">
            <label>Signal Strength</label>
            <input v-model.number="settings.signalLevel" type="range" min="1" max="5" step="1" />
            <span class="setting-value">{{ settings.signalLevel }}</span>
          </div>
          <div class="setting-row">
            <label>Speech Speed</label>
            <input v-model.number="settings.speechSpeed" type="range" min="0.7" max="1.3" step="0.1" />
            <span class="setting-value">{{ settings.speechSpeed.toFixed(1) }}x</span>
          </div>
          <div class="setting-row">
            <label>Radio Effects</label>
            <input v-model="settings.radioEffects" type="checkbox" />
          </div>
          <div class="setting-row">
            <label>SimBridge Poll</label>
            <input v-model="settings.telemetryPoll" type="checkbox" />
            <span class="setting-hint">Poll /api/bridge/data every 2s</span>
          </div>
          <button class="setup-demo-btn" style="margin-top: 8px" @click="resetSession">
            <v-icon icon="mdi-restart" size="16" /> Reset Session
          </button>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAtcEngine } from '~~/shared/atc/engine'
import { getPhaseOrder, getPhase } from '~~/shared/atc/phases'
import type { Transmission, FlightPlan } from '~~/shared/atc/types'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: ['require-auth'] })

// For radio effects (conditional import)
let applyRadioEffect: ((audioBuffer: AudioBuffer, ctx: AudioContext, level: number) => AudioBuffer) | null = null

const api = useApi()
const auth = useAuthStore()

// Create an authenticated fetch wrapper for the engine
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

// TTS speech queue
const speechQueue = ref<string[]>([])
let audioContext: AudioContext | null = null

// Telemetry polling
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

// ── Settings (persisted) ──
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

// ── Standby frequency (next phase) ──
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

// ── Auto-scroll comm log ──
watch(() => engine.state.transmissions.length, async () => {
  await nextTick()
  if (commLogScroll.value) {
    commLogScroll.value.scrollTop = 0 // reversed order, scroll to top = newest
  }
})

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
  // Pre-fill some vars for demo
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
  screen.value = 'session'
  startTelemetryPoll()
}

function resetSession() {
  engine.reset()
  screen.value = 'setup'
  stopTelemetryPoll()
  telemetryConnected.value = false
}

// ── Handle PTT recording complete ──
async function handleRecordingComplete(payload: { audio: string; format: string }) {
  processing.value = true
  try {
    // 1. STT via ptt endpoint
    const sttRes = await api.post<{ success: boolean; transcription: string }>('/api/atc/ptt', {
      audio: payload.audio, format: payload.format,
    })
    if (!sttRes.success || !sttRes.transcription) return

    // 2. Engine handles pilot input → gets ATC response
    const atcText = await engine.handlePilotInput(sttRes.transcription, sttRes.transcription)

    // 3. Speak ATC response
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

// ── Handle text input ──
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

// ── TTS Playback ──
async function speakAtc(text: string) {
  if (!text) return

  // Split by newlines (handoff messages come as "main\nhandoff")
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

    // Decode and play audio
    isSpeaking.value = true
    const audioData = Uint8Array.from(atob(res.audio.base64), c => c.charCodeAt(0))
    if (!audioContext) audioContext = new AudioContext()
    const buffer = await audioContext.decodeAudioData(audioData.buffer.slice(0))
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.destination)
    source.onended = () => { isSpeaking.value = false }
    source.start()

    // Wait for playback to finish
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
  // In the phase-based system, freq swap triggers the next phase advance
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

onUnmounted(() => {
  stopTelemetryPoll()
  if (audioContext) audioContext.close()
})
</script>

<style scoped>
.atc-scene {
  min-height: 100vh;
  max-width: 460px;
  margin: 0 auto;
  padding: 0 12px 24px;
}

/* ═══════ SETUP SCREEN ═══════ */
.setup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 32px 0 16px;
}

.setup-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.setup-sub {
  font-size: 0.75rem;
  color: var(--t3);
  margin-left: auto;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setup-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setup-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--t3);
}

.setup-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
  font-size: 0.95rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
  outline: none;
  transition: border-color 0.2s;
}

.setup-input:focus {
  border-color: var(--accent);
}

.setup-input::placeholder {
  color: var(--t3);
}

.setup-row {
  display: flex;
  gap: 10px;
}

.setup-start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  margin-top: 4px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #000;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.setup-start-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.setup-start-btn:not(:disabled):active {
  transform: scale(0.97);
}

.setup-demo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--t2);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.setup-demo-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* ═══════ SESSION SCREEN ═══════ */
.atc-session {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

/* Flight Header */
.flight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px !important;
  border-radius: var(--glass-radius) !important;
  margin-top: 8px;
}

.flight-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flight-callsign {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.04em;
}

.flight-route {
  font-size: 0.8rem;
  color: var(--t2);
}

.flight-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flight-phase-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
}

.phase-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
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
}

.telem-indicator {
  display: flex;
  align-items: center;
}

.telem-indicator--on {
  color: #22c55e;
}

.telem-indicator--off {
  color: var(--t3);
  opacity: 0.4;
}

/* Latest ATC Message */
.latest-atc {
  padding: 12px 14px !important;
}

.latest-atc-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.latest-atc-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  font-weight: 600;
}

.speaking-indicator {
  display: flex;
  gap: 3px;
  margin-left: 4px;
}

.speaking-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
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
}

/* Emergency */
.emergency-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.emergency-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.2s;
}

.emergency-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.emergency-menu {
  display: flex;
  gap: 6px;
  padding: 6px !important;
  border-radius: 10px !important;
}

.emergency-option {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  border: none;
}

.emergency-option--mayday {
  background: #ef4444;
  color: #fff;
}

.emergency-option--panpan {
  background: #f59e0b;
  color: #000;
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

/* Communication Log */
.comm-log {
  margin-top: 4px;
}

.comm-log-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
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

.comm-log-scroll::-webkit-scrollbar {
  width: 4px;
}

.comm-log-scroll::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 2px;
}

.comm-log-empty {
  text-align: center;
  padding: 24px;
  color: var(--t3);
  font-size: 0.8rem;
}

/* Settings */
.settings-panel {
  margin-top: 4px;
  border-radius: var(--glass-radius) !important;
}

.settings-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--t3);
  user-select: none;
}

.settings-body {
  padding: 0 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--t2);
}

.setting-row label {
  min-width: 100px;
  color: var(--t3);
  font-size: 0.75rem;
}

.setting-row input[type="range"] {
  flex: 1;
  accent-color: var(--accent);
}

.setting-row input[type="checkbox"] {
  accent-color: var(--accent);
}

.setting-value {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  color: var(--accent);
  min-width: 32px;
  text-align: right;
}

.setting-hint {
  font-size: 0.65rem;
  color: var(--t3);
}
</style>
