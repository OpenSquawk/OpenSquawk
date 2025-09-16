<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <div class="mx-auto w-full max-w-[420px] px-4 pb-24 pt-6 sm:px-6">
      <!-- Header -->
      <header class="flex items-center justify-between pb-6">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-cyan-400/80">OpenSquawk</p>
          <h1 class="text-2xl font-semibold">Pilot Monitoring</h1>
          <p class="mt-1 text-sm text-white/70">Decision Tree • PTT • Enhanced LLM</p>
        </div>
        <div class="text-right">
          <v-chip size="small" :color="currentState?.phase === 'Interrupt' ? 'red' : 'cyan'" variant="flat" class="mb-1">
            {{ currentState?.id }}
          </v-chip>
          <div class="text-xs text-white/50">{{ currentState?.phase }}</div>
        </div>
      </header>

      <!-- Status Section -->
      <section class="mb-6 space-y-4">
        <v-card class="bg-white/5 backdrop-blur border border-white/10">
          <v-card-text class="space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-white/50">Aktiver Flug</p>
                <h2 class="text-2xl font-semibold">{{ flightContext.callsign || 'N/A' }}</h2>
                <p class="text-sm text-white/70">{{ flightContext.dep }} → {{ flightContext.dest }}</p>
              </div>
              <div class="text-right space-y-1">
                <v-chip
                    :color="flags.in_air ? 'green' : 'grey'"
                    variant="flat"
                    size="small"
                >
                  {{ flags.in_air ? 'IN-AIR' : 'GROUND' }}
                </v-chip>
                <div class="flex gap-1">
                  <v-chip size="x-small" :color="flags.emergency_active ? 'red' : 'grey'" variant="outlined">
                    EMERG
                  </v-chip>
                  <v-chip size="x-small" color="cyan" variant="outlined">
                    {{ flags.current_unit }}
                  </v-chip>
                </div>
              </div>
            </div>

            <!-- Flight Info Grid -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs text-white/40 uppercase tracking-wider">Stand</p>
                <p class="text-white/80 font-mono">{{ vars.stand }}</p>
              </div>
              <div>
                <p class="text-xs text-white/40 uppercase tracking-wider">Runway</p>
                <p class="text-white/80 font-mono">{{ vars.runway }}</p>
              </div>
              <div>
                <p class="text-xs text-white/40 uppercase tracking-wider">Squawk</p>
                <p class="text-white/80 font-mono">{{ vars.squawk }}</p>
              </div>
              <div>
                <p class="text-xs text-white/40 uppercase tracking-wider">SID</p>
                <p class="text-white/80 font-mono">{{ vars.sid }}</p>
              </div>
            </div>

            <!-- Stats -->
            <div class="flex justify-between pt-2 border-t border-white/10">
              <div class="text-center">
                <p class="text-lg font-semibold text-cyan-300">{{ flags.radio_checks_done || 0 }}</p>
                <p class="text-xs text-white/40 uppercase tracking-wider">Radio Checks</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-semibold text-orange-300">{{ flags.off_schema_count || 0 }}</p>
                <p class="text-xs text-white/40 uppercase tracking-wider">Off-Schema</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-semibold text-white">{{ log.length }}</p>
                <p class="text-xs text-white/40 uppercase tracking-wider">Transmissions</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </section>

      <!-- VATSIM Integration -->
      <section v-if="!flightContext.callsign" class="mb-6">
        <v-card class="bg-white/5 backdrop-blur border border-white/10">
          <v-card-text class="space-y-4">
            <div>
              <h2 class="text-lg font-semibold mb-2">VATSIM Integration</h2>
              <p class="text-sm text-white/70 mb-4">Lade deinen Flugplan von VATSIM</p>
            </div>
            <div class="flex gap-3">
              <v-text-field
                  v-model="vatsimId"
                  label="VATSIM CID"
                  variant="outlined"
                  density="comfortable"
                  color="cyan"
                  hide-details
                  class="flex-1"
              />
              <v-btn
                  color="cyan"
                  variant="flat"
                  :loading="loading"
                  @click="initializeFromApis"
              >
                Laden
              </v-btn>
            </div>
            <div v-if="selectedPlan" class="text-sm text-white/70 bg-black/40 rounded-lg p-3">
              <strong>Plan:</strong> {{ selectedPlan.callsign }} • {{ selectedPlan.dep }}→{{ selectedPlan.arr }} • Alt {{ selectedPlan.altitude }}
            </div>
          </v-card-text>
        </v-card>
      </section>

      <!-- Frequency Controls -->
      <section class="mb-6">
        <v-card class="bg-white/5 backdrop-blur border border-white/10">
          <v-card-text class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Radio Setup</h3>
              <v-chip color="cyan" variant="flat" size="small" class="font-mono">
                {{ activeFrequency || '---' }}
              </v-chip>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <v-text-field
                  v-model="frequencies.active"
                  label="Active"
                  variant="outlined"
                  color="cyan"
                  hide-details
                  density="comfortable"
                  class="freq-input-active font-mono"
              />
              <v-text-field
                  v-model="frequencies.standby"
                  label="Standby"
                  variant="outlined"
                  color="cyan"
                  hide-details
                  density="comfortable"
                  class="freq-input-standby font-mono"
              />
            </div>

            <v-btn
                block
                color="cyan"
                variant="tonal"
                prepend-icon="mdi-swap-horizontal"
                @click="swapFrequencies"
                :class="{ 'swap-animation': swapAnimation }"
            >
              Frequenzen tauschen
            </v-btn>

            <!-- Signal Quality -->
            <div class="flex items-center justify-between">
              <span class="text-xs uppercase tracking-[0.3em] text-white/40">Signal</span>
              <div class="flex items-center gap-1">
                <div
                    v-for="i in 5"
                    :key="i"
                    class="signal-bar"
                    :class="{ 'signal-active': i <= signalStrength }"
                />
                <span class="text-xs text-white/50 ml-2">{{ radioQuality.text }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </section>

      <!-- Expected Communication -->
      <section v-if="currentStep" class="mb-6">
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs uppercase tracking-[0.3em] text-white/40">Erwartete Kommunikation</p>
              <v-chip color="orange" variant="tonal" size="small">{{ currentStep.frequencyName }}</v-chip>
            </div>

            <div v-if="currentStep.atc" class="space-y-2 rounded-2xl bg-green-500/10 border border-green-500/20 p-3 text-sm">
              <div class="flex items-center gap-2 text-green-300">
                <v-icon size="16">mdi-radio-tower</v-icon>
                <span class="text-xs uppercase font-semibold">ATC</span>
              </div>
              <p class="font-mono text-white">{{ normalizeExpectedText(currentStep.atc) }}</p>
            </div>

            <div v-if="currentStep.pilot" class="space-y-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 text-sm">
              <div class="flex items-center gap-2 text-blue-300">
                <v-icon size="16">mdi-account-pilot</v-icon>
                <span class="text-xs uppercase font-semibold">Pilot (Du)</span>
              </div>
              <p class="font-mono text-white">{{ normalizeExpectedText(currentStep.pilot) }}</p>
            </div>
          </v-card-text>
        </v-card>
      </section>

      <!-- Push to Talk -->
      <section class="mb-6">
        <div>
          <p class="mb-2 text-xs uppercase tracking-[0.3em] text-white/40">Push to Talk</p>
          <v-sheet class="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-transparent p-4 shadow-lg">
            <v-btn-toggle
                v-model="radioMode"
                color="cyan"
                class="mb-4 flex w-full"
                mandatory
            >
              <v-btn value="atc" prepend-icon="mdi-radio-handheld" class="flex-1">ATC</v-btn>
              <v-btn value="intercom" prepend-icon="mdi-account-voice" class="flex-1">Intercom</v-btn>
            </v-btn-toggle>

            <!-- Microphone Permission Alert -->
            <v-alert
                v-if="!micPermission"
                type="info"
                variant="tonal"
                class="bg-cyan-500/10 text-cyan-100 mb-4"
                density="compact"
            >
              Mikrofonberechtigung erforderlich für Push-To-Talk.
              <template #append>
                <v-btn color="cyan" size="small" variant="flat" @click="requestMicAccess">Erlauben</v-btn>
              </template>
            </v-alert>

            <ClientOnly>
              <div
                  class="ptt-pad flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-center transition cursor-pointer"
                  :class="isRecording ? 'ring-4 ring-cyan-400/70 shadow-2xl bg-cyan-900/20' : 'ring-1 ring-white/5'"
                  @touchstart.prevent="startRecording(radioMode === 'intercom')"
                  @touchend.prevent="stopRecording"
                  @touchcancel.prevent="stopRecording"
                  @mousedown.prevent="startRecording(radioMode === 'intercom')"
                  @mouseup.prevent="stopRecording"
                  @mouseleave="stopRecording"
              >
                <div>
                  <v-icon
                      :icon="isRecording ? 'mdi-record' : (radioMode === 'atc' ? 'mdi-radio-handheld' : 'mdi-headphones')"
                      size="48"
                      :class="isRecording ? 'text-red-400 animate-pulse' : 'text-cyan-300'"
                  />
                  <p class="text-xs uppercase tracking-[0.35em] text-white/40 mt-2">
                    {{ isRecording ? 'TRANSMITTING' : 'Hold to transmit' }}
                  </p>
                  <p class="pt-3 text-3xl font-semibold">
                    {{ radioMode === 'atc' ? 'ATC' : 'INTERCOM' }}
                  </p>
                  <p class="mt-2 text-sm text-white/60">
                    {{ radioMode === 'atc' ? `Sendet auf ${frequencies.active}` : 'Crew Intercom • Checklist' }}
                  </p>
                </div>
              </div>
            </ClientOnly>
          </v-sheet>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="mb-6">
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <h3 class="text-lg font-semibold">Quick Actions</h3>
            <div class="grid grid-cols-2 gap-3">
              <v-btn
                  color="orange"
                  variant="flat"
                  @click="performRadioCheck"
                  :loading="radioCheckLoading"
                  prepend-icon="mdi-radio"
              >
                Radio Check
              </v-btn>
              <v-btn
                  color="cyan"
                  variant="outlined"
                  @click="resetCommunications"
                  prepend-icon="mdi-refresh"
              >
                Reset
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </section>

      <!-- Manual Input Fallback -->
      <section class="mb-6">
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Manual Input</h3>
              <v-chip size="small" color="cyan" variant="outlined">Fallback</v-chip>
            </div>
            <v-text-field
                v-model="pilotInput"
                label="Pilot Transmission (Text)"
                variant="outlined"
                color="cyan"
                hide-details
                @keyup.enter="sendPilotText"
                append-inner-icon="mdi-send"
                @click:append-inner="sendPilotText"
            />
            <p class="text-xs text-white/50">
              Für Notfälle wenn PTT nicht funktioniert oder für Tests
            </p>
          </v-card-text>
        </v-card>
      </section>

      <!-- Next States Debug -->
      <section v-if="nextCandidates.length > 0" class="mb-6">
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Debug: Next States</h3>
              <v-chip size="small" color="grey" variant="outlined">LLM Targets</v-chip>
            </div>
            <div class="flex flex-wrap gap-2">
              <v-chip
                  v-for="nid in nextCandidates"
                  :key="nid"
                  size="small"
                  color="primary"
                  variant="outlined"
                  @click="forceMove(nid)"
                  class="cursor-pointer"
              >
                {{ nid }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </section>

      <!-- Communication Log -->
      <section class="mb-6">
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Communication Log</h3>
              <div class="flex gap-2">
                <v-btn
                    variant="text"
                    color="cyan"
                    density="comfortable"
                    @click="clearCommunicationLog"
                    icon="mdi-delete-sweep"
                />
                <v-chip size="small" color="cyan" variant="outlined">{{ log.length }}</v-chip>
              </div>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                  v-for="entry in log.slice(-8)"
                  :key="entry.timestamp.getTime()"
                  class="rounded-2xl border border-white/10 bg-black/40 p-3"
              >
                <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40 mb-1">
                  <span class="flex items-center gap-2">
                    <v-icon
                        :icon="entry.speaker === 'pilot' ? 'mdi-account-pilot' : 'mdi-radio-tower'"
                        size="12"
                        :class="entry.speaker === 'pilot' ? 'text-blue-400' : 'text-green-400'"
                    />
                    {{ entry.speaker.toUpperCase() }}
                    <v-chip v-if="entry.radioCheck" size="x-small" color="orange" variant="flat">RADIO CHECK</v-chip>
                    <v-chip v-if="entry.offSchema" size="x-small" color="red" variant="flat">OFF-SCHEMA</v-chip>
                  </span>
                  <span>{{ formatTime(entry.timestamp) }}</span>
                </div>
                <p class="text-sm text-white font-mono">{{ entry.message }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <v-chip size="x-small" color="cyan" variant="outlined">{{ entry.frequency || 'N/A' }}</v-chip>
                  <span class="text-xs text-white/40">{{ entry.state }}</span>
                </div>
              </div>

              <p v-if="log.length === 0" class="text-xs text-white/50 text-center py-4">
                Noch keine Kommunikation aufgezeichnet.
              </p>
            </div>
          </v-card-text>
        </v-card>
      </section>

      <!-- Last Transmission -->
      <section v-if="lastTransmission" class="mb-6">
        <v-card class="bg-cyan-500/10 border border-cyan-400/20">
          <v-card-text class="space-y-2">
            <div class="flex items-center gap-2">
              <v-icon icon="mdi-microphone-outline" size="16" class="text-cyan-300" />
              <span class="text-xs uppercase tracking-[0.3em] text-cyan-300">Letzte Übertragung</span>
            </div>
            <p class="text-sm text-white font-mono">{{ lastTransmission }}</p>
          </v-card-text>
        </v-card>
      </section>

      <!-- Settings -->
      <section class="mb-6">
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-4">
            <h3 class="text-lg font-semibold">Settings</h3>

            <div class="space-y-4">
              <div>
                <label class="text-xs uppercase tracking-[0.3em] text-white/40 block mb-2">
                  Signal Stärke
                </label>
                <v-slider
                    v-model="signalStrength"
                    min="1"
                    max="5"
                    step="1"
                    show-ticks="always"
                    color="cyan"
                    thumb-label
                    hide-details
                />
              </div>

              <div class="flex justify-between">
                <v-switch
                    v-model="radioEffectsEnabled"
                    color="cyan"
                    inset
                    label="Radio-Effekte"
                    hide-details
                />
                <v-switch
                    v-model="debugMode"
                    color="orange"
                    inset
                    label="Debug Mode"
                    hide-details
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import useCommunicationsEngine from '~/composables/communicationsEngine'
import { decideNextStateLLM } from '~/utils/openaiDecision'
// import useRadioTTS from '~/composables/radioTtsNew' // Falls verfügbar

// Core State
const engine = useCommunicationsEngine()
const {
  currentState,
  nextCandidates,
  activeFrequency,
  communicationLog: log,
  variables: vars,
  flags,
  flightContext,
  currentStep,
  initializeFlight,
  processPilotTransmission,
  buildLLMContext,
  applyLLMDecision,
  moveTo: forceMove,
  normalizeATCText
} = engine

// UI State
const loading = ref(false)
const pilotInput = ref('')
const lastTransmission = ref('')
const radioMode = ref<'atc' | 'intercom'>('atc')
const isRecording = ref(false)
const micPermission = ref(false)
const swapAnimation = ref(false)
const signalStrength = ref(4)
const radioCheckLoading = ref(false)
const radioEffectsEnabled = ref(true)
const debugMode = ref(false)

// Frequencies
const frequencies = ref({
  active: '121.700',
  standby: '118.100'
})

// VATSIM Integration
const vatsimId = ref('1857215')
const selectedPlan = ref<any>(null)
const dataFeed = ref<any>(null)

// Audio
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])

// Computed Properties
const radioQuality = computed(() => {
  const strength = signalStrength.value
  if (strength >= 5) return { color: 'success', text: 'EXCELLENT' }
  if (strength >= 4) return { color: 'success', text: 'GOOD' }
  if (strength >= 3) return { color: 'warning', text: 'FAIR' }
  if (strength >= 2) return { color: 'orange', text: 'POOR' }
  return { color: 'error', text: 'WEAK' }
})

// Methods
const normalizeExpectedText = (text: string): string => {
  if (!flightContext.value) return text
  return normalizeATCText(text, { ...vars.value, ...flags.value })
}

const requestMicAccess = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true })
    micPermission.value = true
  } catch (err) {
    console.error('Microphone permission denied:', err)
    micPermission.value = false
  }
}

const startRecording = async (isIntercom = false) => {
  if (!micPermission.value) {
    await requestMicAccess()
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    })

    mediaRecorder.value = new MediaRecorder(stream)
    audioChunks.value = []

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }

    mediaRecorder.value.onstop = () => {
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
      processTransmission(audioBlob, isIntercom)
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.value.start()
    isRecording.value = true

    if (radioEffectsEnabled.value) {
      playPTTBeep(true)
    }

  } catch (err) {
    console.error('Failed to start recording:', err)
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false

    if (radioEffectsEnabled.value) {
      playPTTBeep(false)
    }
  }
}

const processTransmission = async (audioBlob: Blob, isIntercom: boolean) => {
  try {
    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    const result = await $fetch('/api/atc/ptt', {
      method: 'POST',
      body: {
        audio: base64Audio,
        expectedText: currentStep.value?.pilot || 'radio communication',
        moduleId: 'pilot-monitoring',
        lessonId: currentState.value?.id || 'general',
        format: 'webm'
      }
    })

    if (result.success) {
      lastTransmission.value = result.transcription

      if (isIntercom) {
        // Handle intercom (for checklists, etc.)
        const transcription = result.transcription.toLowerCase()
        if (transcription.includes('checklist') || transcription.includes('check list')) {
          // Show checklist modal or respond accordingly
          setTimeout(() => speakWithRadioEffects('Checklist functionality not yet implemented'), 1000)
        }
      } else {
        // Handle ATC communication
        await processPilotAndLLM(result.transcription)
      }
    }
  } catch (err) {
    console.error('Error processing transmission:', err)
    lastTransmission.value = 'Error processing audio'
  }
}

const processPilotAndLLM = async (transcript: string) => {
  // Process pilot transmission (logs it, handles basic routing)
  const quickResponse = processPilotTransmission(transcript)

  if (quickResponse) {
    // Radio check or emergency was handled directly
    return
  }

  // Build context for LLM
  const ctx = buildLLMContext(transcript)

  try {
    const decision = await decideNextStateLLM(ctx)
    applyLLMDecision(decision)

    // If ATC should respond, speak it
    if (decision.controller_say_tpl && !decision.radio_check) {
      setTimeout(async () => {
        await speakWithRadioEffects(decision.controller_say_tpl!)
      }, 1000 + Math.random() * 2000)
    }
  } catch (e) {
    console.error('LLM decision failed', e)
    lastTransmission.value += ' (LLM failed - logged only)'
  }
}

const sendPilotText = async () => {
  const text = pilotInput.value.trim()
  if (!text) return

  pilotInput.value = ''
  lastTransmission.value = text

  await processPilotAndLLM(text)
}

const speakWithRadioEffects = async (text: string) => {
  try {
    const response = await $fetch('/api/atc/say', {
      method: 'POST',
      body: {
        text,
        level: signalStrength.value,
        voice: 'alloy',
        speed: 0.95,
        moduleId: 'pilot-monitoring',
        lessonId: currentState.value?.id || 'general'
      }
    })

    if (response.success && response.audio) {
      // Play the audio
      const audio = new Audio(`data:audio/wav;base64,${response.audio.base64}`)
      audio.play().catch(console.error)
    }
  } catch (err) {
    console.error('TTS failed:', err)
  }
}

const performRadioCheck = async () => {
  if (!flightContext.value.callsign) return

  radioCheckLoading.value = true

  const message = `${frequencies.value.active}, ${flightContext.value.callsign}, radio check`
  lastTransmission.value = message

  try {
    // Log pilot transmission
    processPilotTransmission(message)

    // ATC response
    setTimeout(async () => {
      const response = `${flightContext.value.callsign}, read you five by five`
      await speakWithRadioEffects(response)
      radioCheckLoading.value = false
    }, 2000)
  } catch (err) {
    console.error('Radio check failed:', err)
    radioCheckLoading.value = false
  }
}

const swapFrequencies = () => {
  swapAnimation.value = true

  const temp = frequencies.value.active
  frequencies.value.active = frequencies.value.standby
  frequencies.value.standby = temp

  setTimeout(() => {
    swapAnimation.value = false
  }, 500)
}

const resetCommunications = () => {
  log.value.splice(0)
  lastTransmission.value = ''
}

const clearCommunicationLog = () => {
  log.value.splice(0)
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('de-DE', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const playPTTBeep = (start: boolean) => {
  if (!radioEffectsEnabled.value) return

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(start ? 800 : 600, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (err) {
    // Audio context may not be available
  }
}

// VATSIM Integration
const initializeFromApis = async () => {
  loading.value = true
  try {
    const response = await $fetch(`/api/vatsim/flightplans?cid=${vatsimId.value}`)

    if (Array.isArray(response) && response.length > 0) {
      const latest = response[0]
      selectedPlan.value = latest
      initializeFlight(latest)

      // Update frequencies based on departure airport
      if (latest.dep === 'EDDF') {
        frequencies.value.active = '121.900' // Frankfurt Delivery
        frequencies.value.standby = '121.700' // Frankfurt Ground
      }
    }
  } catch (err) {
    console.error('Failed to load VATSIM data:', err)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await requestMicAccess()

  // Initialize with demo data if no VATSIM
  if (!selectedPlan.value) {
    initializeFlight({
      callsign: 'DLH39A',
      aircraft: 'A320/L',
      dep: 'EDDF',
      arr: 'EDDM',
      altitude: '36000',
      assignedsquawk: '1234'
    })
  }
})

// Watch for frequency changes from engine
watch(() => activeFrequency.value, (newFreq) => {
  if (newFreq && newFreq !== frequencies.value.active) {
    frequencies.value.active = newFreq
  }
})
</script>

<style scoped>
.ptt-pad {
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.signal-bar {
  width: 3px;
  height: 12px;
  background: rgba(255, 255, 255, 0.2);
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

.swap-animation {
  transform: rotate(180deg);
  transition: transform 0.5s ease;
}

.freq-input-active :deep(.v-field__outline) {
  --v-field-border-color: #4ade80;
}

.freq-input-standby :deep(.v-field__outline) {
  --v-field-border-color: #f59e0b;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse {
  animation: pulse 1s infinite;
}
</style>
