<template>
  <v-app>
    <!-- Login Screen -->
    <div v-if="currentScreen === 'login'" class="login-screen">
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="6" lg="4">
            <v-card class="elevation-12 login-card">
              <v-card-title class="text-center">
                <div class="radio-icon mb-4">
                  <v-icon size="48" color="primary">mdi-radio-handheld</v-icon>
                </div>
                <h1 class="text-h4 font-weight-bold">Pilot Monitoring</h1>
                <p class="text-subtitle-1 text-medium-emphasis">VATSIM ATC Training Platform</p>
              </v-card-title>

              <v-card-text>
                <v-form @submit.prevent="loadFlightPlans">
                  <v-text-field
                      v-model="vatsimId"
                      label="VATSIM ID"
                      placeholder="Enter your VATSIM ID"
                      variant="outlined"
                      :rules="[rules.required]"
                      prepend-inner-icon="mdi-account"
                      class="mb-4"
                  />

                  <v-btn
                      type="submit"
                      color="primary"
                      size="large"
                      block
                      :loading="loading"
                      :disabled="!vatsimId"
                  >
                    Load Flight Plans
                  </v-btn>
                </v-form>

                <v-alert
                    v-if="error"
                    type="error"
                    variant="tonal"
                    class="mt-4"
                >
                  {{ error }}
                </v-alert>

                <v-alert
                    type="info"
                    variant="tonal"
                    class="mt-4"
                    prominent
                >
                  <v-icon>mdi-information</v-icon>
                  <div class="ml-3">
                    <strong>Live VATSIM Integration</strong>
                    <p class="text-body-2 mt-1">Loading real flight plans from VATSIM network. Ensure microphone permissions are granted for PTT functionality.</p>
                  </div>
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Flight Selection Screen -->
    <div v-else-if="currentScreen === 'flightselect'">
      <v-app-bar>
        <v-btn icon @click="currentScreen = 'login'">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-app-bar-title>Select Flight Plan</v-app-bar-title>
        <v-spacer />
        <v-chip label color="primary">{{ vatsimId }}</v-chip>
      </v-app-bar>

      <v-container>
        <v-row v-if="loading">
          <v-col>
            <v-progress-circular indeterminate color="primary" class="d-block mx-auto" />
            <p class="text-center mt-4">Loading flight plans from VATSIM...</p>
          </v-col>
        </v-row>

        <v-row v-else-if="flightPlans.length === 0">
          <v-col>
            <v-alert type="warning" variant="tonal">
              <v-icon>mdi-alert</v-icon>
              <div class="ml-3">
                <strong>No flight plans found</strong>
                <p class="text-body-2 mt-1">No recent flight plans found for VATSIM ID {{ vatsimId }}. Make sure you have filed flight plans or try a different ID.</p>
              </div>
            </v-alert>
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col v-for="plan in flightPlans" :key="plan.id" cols="12">
            <v-card @click="startMonitoring(plan)" hover class="flight-plan-card">
              <v-card-text>
                <v-row align="center">
                  <v-col cols="auto">
                    <v-avatar size="48" color="primary">
                      <v-icon color="white">mdi-airplane</v-icon>
                    </v-avatar>
                  </v-col>

                  <v-col>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <h3 class="text-h6 font-weight-bold">{{ plan.callsign }}</h3>
                      <div class="text-right">
                        <div class="text-h6">{{ plan.dep }} → {{ plan.arr }}</div>
                        <div class="text-caption text-medium-emphasis">FL{{ Math.floor(parseInt(plan.altitude) / 100).toString().padStart(3, '0') }}</div>
                      </div>
                    </div>

                    <v-row class="text-body-2 text-medium-emphasis">
                      <v-col cols="6">
                        <div><strong>Aircraft:</strong> {{ plan.aircraft?.split('/')[0] || 'Unknown' }}</div>
                        <div><strong>Departure:</strong> {{ plan.deptime }}Z</div>
                      </v-col>
                      <v-col cols="6">
                        <div><strong>Route:</strong></div>
                        <div class="text-truncate">{{ plan.route || 'DCT' }}</div>
                      </v-col>
                    </v-row>

                    <div v-if="plan.assignedsquawk" class="mt-2">
                      <v-chip size="small" color="secondary" label>
                        Squawk: {{ plan.assignedsquawk }}
                      </v-chip>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Main Monitoring Screen -->
    <div v-else-if="currentScreen === 'monitor'">
      <!-- Top App Bar -->
      <v-app-bar color="primary" dark>
        <v-btn icon @click="currentScreen = 'flightselect'">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <v-app-bar-title>
          <div>
            <div class="text-h6">{{ selectedFlightPlan?.callsign }}</div>
            <div class="text-caption">{{ currentPhase.name }}</div>
          </div>
        </v-app-bar-title>

        <v-spacer />

        <!-- Signal Strength -->
        <div class="signal-bars mr-2">
          <div
              v-for="i in 5"
              :key="i"
              class="signal-bar"
              :class="{ active: i <= signalStrength }"
          />
        </div>

        <v-btn icon @click="showSettings = true">
          <v-icon>mdi-cog</v-icon>
        </v-btn>
      </v-app-bar>

      <!-- Flight Info -->
      <div class="flight-info-bar">
        <v-container>
          <v-row align="center">
            <v-col cols="4" class="text-center">
              <div class="text-body-2">{{ selectedFlightPlan?.dep }} → {{ selectedFlightPlan?.arr }}</div>
            </v-col>
            <v-col cols="4" class="text-center">
              <div class="text-body-2">FL{{ Math.floor(parseInt(selectedFlightPlan?.altitude || '0') / 100).toString().padStart(3, '0') }}</div>
            </v-col>
            <v-col cols="4" class="text-center">
              <div class="text-body-2">{{ selectedFlightPlan?.aircraft?.split('/')[0] }}</div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Phase Navigation -->
      <v-card class="mx-4 my-2 phase-nav">
        <v-card-text class="py-2">
          <v-row align="center">
            <v-col cols="2">
              <v-btn
                  icon
                  size="small"
                  @click="previousPhase"
                  :disabled="currentPhaseIndex === 0"
              >
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
            </v-col>

            <v-col cols="8" class="text-center">
              <h3 class="text-h6">{{ currentPhase.name }}</h3>
              <p class="text-caption text-medium-emphasis">{{ currentPhase.description }}</p>
            </v-col>

            <v-col cols="2" class="text-right">
              <v-btn
                  icon
                  size="small"
                  @click="nextPhase"
                  :disabled="currentPhaseIndex === FLIGHT_PHASES.length - 1"
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </v-col>
          </v-row>

          <!-- Progress Dots -->
          <v-row justify="center" class="mt-2">
            <div class="d-flex ga-1">
              <div
                  v-for="(phase, index) in FLIGHT_PHASES"
                  :key="phase.id"
                  class="progress-dot"
                  :class="{
                  active: index === currentPhaseIndex,
                  completed: index < currentPhaseIndex
                }"
              />
            </div>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Frequency Display -->
      <v-card class="mx-4 my-2 freq-display">
        <v-card-text>
          <v-row align="center">
            <v-col cols="4" class="text-center">
              <div class="text-caption text-medium-emphasis mb-1">ACTIVE</div>
              <div class="text-h4 font-mono font-weight-bold text-success">{{ frequencies.active }}</div>
            </v-col>

            <v-col cols="4" class="text-center">
              <v-btn
                  icon
                  size="large"
                  color="primary"
                  @click="swapFrequencies"
                  class="freq-swap-btn"
              >
                <v-icon>mdi-swap-horizontal</v-icon>
              </v-btn>
            </v-col>

            <v-col cols="4" class="text-center">
              <div class="text-caption text-medium-emphasis mb-1">STANDBY</div>
              <div class="text-h4 font-mono font-weight-bold text-warning">{{ frequencies.standby }}</div>
            </v-col>
          </v-row>

          <v-row justify="center" class="mt-2">
            <v-btn
                size="small"
                variant="outlined"
                @click="performRadioCheck"
                :loading="radioCheckLoading"
            >
              <v-icon>mdi-radio-handheld</v-icon>
              Radio Check
            </v-btn>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- PTT Controls -->
      <v-container>
        <!-- ATC PTT -->
        <v-card class="mb-4 ptt-card">
          <v-card-text class="text-center">
            <h4 class="text-subtitle-1 text-medium-emphasis mb-3">ATC COMMUNICATION</h4>
            <v-btn
                size="x-large"
                color="primary"
                block
                class="ptt-btn"
                :class="{ 'ptt-active': isRecording && !isIntercomMode }"
                @mousedown="startRecording(false)"
                @mouseup="stopRecording"
                @touchstart="startRecording(false)"
                @touchend="stopRecording"
                :disabled="!micPermission"
            >
              <v-icon>mdi-radio-handheld</v-icon>
              <span class="ml-2">{{ isRecording && !isIntercomMode ? 'TRANSMITTING...' : 'HOLD TO TALK' }}</span>
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Intercom PTT -->
        <v-card class="mb-4 ptt-card">
          <v-card-text class="text-center">
            <h4 class="text-subtitle-1 text-medium-emphasis mb-3">INTERCOM</h4>
            <v-btn
                size="large"
                color="purple"
                block
                class="intercom-btn"
                :class="{ 'ptt-active': isRecording && isIntercomMode }"
                @mousedown="startRecording(true)"
                @mouseup="stopRecording"
                @touchstart="startRecording(true)"
                @touchend="stopRecording"
                :disabled="!micPermission"
            >
              <v-icon>mdi-headphones</v-icon>
              <span class="ml-2">{{ isRecording && isIntercomMode ? 'INTERCOM ON...' : 'INTERCOM' }}</span>
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Quick Actions -->
        <v-row>
          <v-col cols="6">
            <v-btn
                color="success"
                block
                size="large"
                @click="openChecklist"
                :disabled="availableChecklists.length === 0"
            >
              <v-icon>mdi-clipboard-check</v-icon>
              <span class="ml-2">Checklist</span>
            </v-btn>
          </v-col>

          <v-col cols="6">
            <v-btn
                color="error"
                block
                size="large"
                @click="declareEmergency"
            >
              <v-icon>mdi-alert</v-icon>
              <span class="ml-2">Emergency</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>

      <!-- Communication Log -->
      <v-card class="mx-4 my-2 comm-log">
        <v-card-title class="text-subtitle-1 pb-2">Communication Log</v-card-title>
        <v-card-text class="pt-0">
          <div class="log-container">
            <div
                v-for="(log, index) in communicationLog.slice(-5)"
                :key="index"
                class="log-entry text-caption font-mono"
            >
              {{ log }}
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Last Transmission -->
      <v-card v-if="lastTransmission" class="mx-4 my-2" color="info" variant="tonal">
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-1">LAST TRANSMISSION</div>
          <div class="text-body-2">{{ lastTransmission }}</div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Checklist Dialog -->
    <v-dialog v-model="showChecklistModal" max-width="500">
      <v-card v-if="currentChecklist">
        <v-card-title>{{ currentChecklist.name }}</v-card-title>

        <v-card-text>
          <v-list>
            <v-list-item
                v-for="(item, index) in currentChecklist.items"
                :key="index"
                @click="toggleChecklistItem(index)"
            >
              <template #prepend>
                <v-checkbox
                    :model-value="item.completed"
                    color="success"
                    hide-details
                />
              </template>

              <v-list-item-title
                  :class="{ 'text-decoration-line-through text-medium-emphasis': item.completed }"
              >
                {{ item.text }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showChecklistModal = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettings" max-width="400">
      <v-card>
        <v-card-title>Settings</v-card-title>

        <v-card-text>
          <v-row>
            <v-col>
              <v-slider
                  v-model="signalStrength"
                  label="Signal Strength"
                  min="1"
                  max="5"
                  step="1"
                  show-ticks
                  tick-labels
              />
            </v-col>
          </v-row>

          <v-text-field
              v-model="frequencies.standby"
              label="Standby Frequency"
              variant="outlined"
          />

          <v-switch
              v-model="randomTaxi"
              label="Random Taxi Routes (Training Mode)"
              color="primary"
              hide-details
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showSettings = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Connection Status -->
    <div class="connection-status">
      <v-chip
          :color="micPermission ? 'success' : 'error'"
          size="small"
          label
      >
        <v-icon size="12">{{ micPermission ? 'mdi-microphone' : 'mdi-microphone-off' }}</v-icon>
        <span class="ml-1">{{ micPermission ? 'Connected' : 'No Mic' }}</span>
      </v-chip>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import useRadioTTS from '~/../composables/radioTtsNew'

// Types
interface VatsimFlightPlan {
  id: number
  vatsim_id: string
  callsign: string
  aircraft: string
  dep: string
  arr: string
  alt: string
  altitude: string
  route: string
  deptime: string
  filed: string
  assignedsquawk?: string
}

interface FlightPhase {
  id: string
  name: string
  description: string
  frequency: string
  expectedCommunications: string[]
}

interface ChecklistItem {
  text: string
  completed: boolean
}

interface Checklist {
  name: string
  phase: string
  items: ChecklistItem[]
}

// Flight Phases
const FLIGHT_PHASES: FlightPhase[] = [
  {
    id: 'prefile',
    name: 'Pre-file',
    description: 'Select and review flight plan',
    frequency: '',
    expectedCommunications: []
  },
  {
    id: 'radiocheck',
    name: 'Radio Check',
    description: 'Test radio communication',
    frequency: '121.900',
    expectedCommunications: ['Radio check request', 'Read you loud and clear']
  },
  {
    id: 'clearance',
    name: 'Clearance Delivery',
    description: 'Request IFR clearance',
    frequency: '121.700',
    expectedCommunications: [
      'Ready to copy clearance',
      'Cleared to destination via...',
      'Readback clearance'
    ]
  },
  {
    id: 'ground',
    name: 'Ground Control',
    description: 'Taxi clearance and pushback',
    frequency: '121.900',
    expectedCommunications: [
      'Request taxi',
      'Taxi via...',
      'Hold short of runway'
    ]
  },
  {
    id: 'tower',
    name: 'Tower',
    description: 'Takeoff clearance',
    frequency: '119.100',
    expectedCommunications: [
      'Ready for departure',
      'Line up and wait',
      'Cleared for takeoff'
    ]
  },
  {
    id: 'departure',
    name: 'Departure Control',
    description: 'Initial vectors and climb',
    frequency: '123.800',
    expectedCommunications: [
      'Check in with departure',
      'Radar contact',
      'Climb and maintain'
    ]
  }
]

// A320 Checklists
const A320_CHECKLISTS: Checklist[] = [
  {
    name: 'Cockpit Preparation',
    phase: 'prefile',
    items: [
      { text: 'PARKING BRAKE...SET', completed: false },
      { text: 'ENGINE MASTER SWITCHES...OFF', completed: false },
      { text: 'BEACON...ON', completed: false },
      { text: 'EXTERNAL POWER...AVAILABLE', completed: false },
      { text: 'BAT 1 & 2...ON', completed: false },
      { text: 'FUEL PUMPS...ON', completed: false }
    ]
  },
  {
    name: 'Before Start',
    phase: 'clearance',
    items: [
      { text: 'DOORS...CLOSED', completed: false },
      { text: 'BEACON...ON', completed: false },
      { text: 'SPOILERS...RETRACTED', completed: false },
      { text: 'FLAPS...AS REQUIRED', completed: false },
      { text: 'FLIGHT CONTROLS...CHECKED', completed: false },
      { text: 'TO CONFIG...SET', completed: false }
    ]
  },
  {
    name: 'After Start',
    phase: 'ground',
    items: [
      { text: 'ENGINE PARAMETERS...NORMAL', completed: false },
      { text: 'FLAPS...AS REQUIRED', completed: false },
      { text: 'FLIGHT CONTROLS...CHECKED', completed: false },
      { text: 'ANTI-ICE...AS REQUIRED', completed: false },
      { text: 'ECAM...NORMAL', completed: false }
    ]
  },
  {
    name: 'Before Takeoff',
    phase: 'tower',
    items: [
      { text: 'TO CONFIG...CHECKED', completed: false },
      { text: 'CABIN CREW...SEATED', completed: false },
      { text: 'TCAS...TA/RA', completed: false },
      { text: 'AUTO BRAKE...MAX', completed: false },
      { text: 'TRANSPONDER...ON', completed: false }
    ]
  }
]

// State
const currentScreen = ref<'login' | 'flightselect' | 'monitor'>('login')
const vatsimId = ref('')
const flightPlans = ref<VatsimFlightPlan[]>([])
const selectedFlightPlan = ref<VatsimFlightPlan | null>(null)
const currentPhase = ref<FlightPhase>(FLIGHT_PHASES[0])
const currentPhaseIndex = computed(() => FLIGHT_PHASES.findIndex(p => p.id === currentPhase.value.id))

// Communication State
const frequencies = ref({ active: '121.900', standby: '118.100' })
const isRecording = ref(false)
const isIntercomMode = ref(false)
const lastTransmission = ref('')
const communicationLog = ref<string[]>([])
const micPermission = ref(false)

// UI State
const loading = ref(false)
const error = ref('')
const showSettings = ref(false)
const showChecklistModal = ref(false)
const currentChecklist = ref<Checklist | null>(null)
const signalStrength = ref(5)
const radioCheckLoading = ref(false)
const randomTaxi = ref(false)

// Audio
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])

// TTS Integration
const tts = useRadioTTS()

// Validation rules
const rules = {
  required: (v: string) => !!v || 'This field is required'
}

// Computed
const availableChecklists = computed(() =>
    A320_CHECKLISTS.filter(cl => cl.phase === currentPhase.value.id)
)

// Methods
const loadFlightPlans = async () => {
  if (!vatsimId.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch(`https://api.vatsim.net/v2/members/${vatsimId.value}/flightplans`)

    if (Array.isArray(response) && response.length > 0) {
      flightPlans.value = response
      currentScreen.value = 'flightselect'
    } else {
      error.value = 'No flight plans found for this VATSIM ID'
    }
  } catch (err) {
    console.error('Error loading flight plans:', err)
    error.value = 'Failed to load flight plans. Please check your VATSIM ID and try again.'
  } finally {
    loading.value = false
  }
}

const startMonitoring = (flightPlan: VatsimFlightPlan) => {
  selectedFlightPlan.value = flightPlan
  currentPhase.value = FLIGHT_PHASES[1] // Start with radio check
  currentScreen.value = 'monitor'
  addToCommunicationLog(`Session started for ${flightPlan.callsign}`)
}

// PTT Functions
const startRecording = async (isIntercom = false) => {
  if (!micPermission.value) return

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
    isIntercomMode.value = isIntercom

  } catch (err) {
    console.error('Failed to start recording:', err)
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
  }
}

const processTransmission = async (audioBlob: Blob, isIntercom: boolean) => {
  try {
    if (!selectedFlightPlan.value) return

    if (isIntercom) {
      // Handle intercom for checklists
      const transcription = "Intercom: Checklist item completed"
      setLastTransmission(transcription)
      addToCommunicationLog(`INTERCOM: ${transcription}`)
    } else {
      // Handle ATC communication using existing TTS system
      const result = await tts.submitPTT(audioBlob, {
        expectedText: `${selectedFlightPlan.value.callsign}, ${frequencies.value.active}, radio check`,
        moduleId: 'pilot-monitoring',
        lessonId: currentPhase.value.id,
        format: 'webm'
      })

      if (result.success) {
        setLastTransmission(result.transcription)
        addToCommunicationLog(`TX: ${result.transcription}`)

        // Generate ATC response
        setTimeout(() => {
          const response = generateATCResponse(result.transcription)
          addToCommunicationLog(`RX: ${response}`)

          // Play ATC response
          if (response) {
            tts.speakServer(response, {
              level: 4,
              voice: 'alloy',
              moduleId: 'pilot-monitoring',
              lessonId: currentPhase.value.id
            })
          }
        }, 1500)
      }
    }
  } catch (err) {
    console.error('Error processing transmission:', err)
  }
}

const generateATCResponse = (pilotTransmission: string): string => {
  if (!selectedFlightPlan.value) return ''

  const callsign = selectedFlightPlan.value.callsign

  if (pilotTransmission.toLowerCase().includes('radio check')) {
    return `${callsign}, ${currentPhase.value.name}, read you five by five`
  }

  if (pilotTransmission.toLowerCase().includes('request taxi')) {
    return `${callsign}, taxi to runway two five via Alpha, Bravo, hold short of runway two five`
  }

  if (pilotTransmission.toLowerCase().includes('ready for departure')) {
    return `${callsign}, runway two five, cleared for takeoff`
  }

  return `${callsign}, roger`
}

const performRadioCheck = async () => {
  if (!selectedFlightPlan.value) return

  radioCheckLoading.value = true
  const message = `${currentPhase.value.name}, ${selectedFlightPlan.value.callsign}, radio check`

  addToCommunicationLog(`TX: ${message}`)

  // Use TTS system to speak the radio check
  try {
    await tts.speakServer(message, {
      level: 4,
      voice: 'alloy',
      moduleId: 'pilot-monitoring',
      lessonId: currentPhase.value.id
    })
  } catch (err) {
    console.error('TTS failed:', err)
  }

  setTimeout(() => {
    const response = `${selectedFlightPlan.value?.callsign}, ${currentPhase.value.name}, read you loud and clear`
    addToCommunicationLog(`RX: ${response}`)
    radioCheckLoading.value = false
  }, 2000)
}

const swapFrequencies = () => {
  const temp = frequencies.value.active
  frequencies.value.active = frequencies.value.standby
  frequencies.value.standby = temp
  addToCommunicationLog(`Frequency changed to ${frequencies.value.active}`)
}

const nextPhase = () => {
  if (currentPhaseIndex.value < FLIGHT_PHASES.length - 1) {
    currentPhase.value = FLIGHT_PHASES[currentPhaseIndex.value + 1]
    if (currentPhase.value.frequency) {
      frequencies.value.active = currentPhase.value.frequency
    }
  }
}

const previousPhase = () => {
  if (currentPhaseIndex.value > 0) {
    currentPhase.value = FLIGHT_PHASES[currentPhaseIndex.value - 1]
  }
}

const openChecklist = () => {
  if (availableChecklists.value.length > 0) {
    currentChecklist.value = { ...availableChecklists.value[0] }
    showChecklistModal.value = true
  }
}

const toggleChecklistItem = (itemIndex: number) => {
  if (currentChecklist.value) {
    currentChecklist.value.items[itemIndex].completed = !currentChecklist.value.items[itemIndex].completed
  }
}

const declareEmergency = () => {
  addToCommunicationLog('EMERGENCY: Mayday declared')
  if (selectedFlightPlan.value) {
    const emergency = `Mayday, mayday, mayday, ${selectedFlightPlan.value.callsign}`
    setLastTransmission(emergency)
  }
}

const addToCommunicationLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  communicationLog.value.push(`${timestamp}: ${message}`)
}

const setLastTransmission = (message: string) => {
  lastTransmission.value = message
}

// Initialize microphone permissions
onMounted(async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true })
    micPermission.value = true
  } catch (err) {
    console.error('Microphone permission denied:', err)
    micPermission.value = false
  }
})

// Watch for phase changes to update frequency
watch(() => currentPhase.value.id, (newPhase) => {
  const phase = FLIGHT_PHASES.find(p => p.id === newPhase)
  if (phase?.frequency) {
    frequencies.value.active = phase.frequency
  }
})
</script>

<style scoped>
.login-screen {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
}

.login-card {
  border-radius: 16px;
}

.radio-icon {
  display: flex;
  justify-content: center;
}

.flight-plan-card {
  cursor: pointer;
  transition: all 0.2s;
}

.flight-plan-card:hover {
  transform: translateY(-2px);
}

.flight-info-bar {
  background: rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  padding: 8px 0;
}

.phase-nav {
  background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  transition: all 0.2s;
}

.progress-dot.active {
  background: #1976d2;
  transform: scale(1.2);
}

.progress-dot.completed {
  background: #4caf50;
}

.freq-display {
  background: linear-gradient(135deg, #263238 0%, #37474f 100%);
  color: white;
}

.freq-swap-btn {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.ptt-card .ptt-btn {
  height: 80px;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.2s;
}

.ptt-btn.ptt-active {
  background: #f44336 !important;
  animation: pulse 1s infinite;
}

.intercom-btn {
  height: 60px;
  font-weight: bold;
}

.comm-log {
  background: rgba(0, 0, 0, 0.02);
}

.log-container {
  max-height: 150px;
  overflow-y: auto;
}

.log-entry {
  padding: 2px 0;
  opacity: 0.8;
}

.signal-bars {
  display: flex;
  gap: 1px;
  align-items: flex-end;
  height: 16px;
}

.signal-bar {
  width: 2px;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.2s;
}

.signal-bar:nth-child(1) { height: 20%; }
.signal-bar:nth-child(2) { height: 40%; }
.signal-bar:nth-child(3) { height: 60%; }
.signal-bar:nth-child(4) { height: 80%; }
.signal-bar:nth-child(5) { height: 100%; }

.signal-bar.active {
  background: #4caf50;
}

.connection-status {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 999;
}
</style>
