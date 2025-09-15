<template>
  <v-app>
    <!-- Login Screen -->
    <div v-if="currentScreen === 'login'" class="login-screen">
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="6" lg="4">
            <v-card class="elevation-12 login-card glass-card">
              <v-card-text class="text-center pa-8">
                <div class="radio-icon mb-6">
                  <v-icon size="64" color="primary" class="radio-pulse">mdi-radio-handheld</v-icon>
                </div>
                <h1 class="text-h3 font-weight-bold mb-2 text-gradient">Pilot Monitoring</h1>
                <p class="text-h6 text-medium-emphasis mb-6">VATSIM ATC Training Platform</p>

                <v-form @submit.prevent="loadFlightPlans" class="mb-4">
                  <v-text-field
                      v-model="vatsimId"
                      label="VATSIM ID"
                      placeholder="Enter your VATSIM ID"
                      variant="outlined"
                      :rules="[rules.required]"
                      prepend-inner-icon="mdi-account-aviation"
                      class="mb-4 input-glow"
                      hide-details="auto"
                  />

                  <v-btn
                      type="submit"
                      color="primary"
                      size="large"
                      block
                      :loading="loading"
                      :disabled="!vatsimId"
                      class="btn-glow"
                      elevation="8"
                  >
                    <v-icon>mdi-airplane-takeoff</v-icon>
                    <span class="ml-2">Load Flight Plans</span>
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
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Flight Selection Screen -->
    <div v-else-if="currentScreen === 'flightselect'">
      <v-app-bar color="primary" dark class="app-bar-glow">
        <v-btn icon @click="currentScreen = 'login'">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-app-bar-title>Select Flight Plan</v-app-bar-title>
        <v-spacer />
        <v-chip label color="accent" class="chip-glow">{{ vatsimId }}</v-chip>
      </v-app-bar>

      <v-container class="py-4">
        <v-row v-if="loading">
          <v-col class="text-center">
            <v-progress-circular size="64" indeterminate color="primary" class="mb-4" />
            <h3 class="text-h5 text-primary">Loading Flight Plans</h3>
            <p class="text-body-1 text-medium-emphasis">Fetching data from VATSIM network...</p>
          </v-col>
        </v-row>

        <v-row v-else-if="flightPlans.length === 0">
          <v-col>
            <v-alert type="warning" variant="elevated" class="glass-card">
              <template v-slot:prepend>
                <v-icon>mdi-alert-circle</v-icon>
              </template>
              <v-alert-title>No Flight Plans Found</v-alert-title>
              <div>No recent flight plans found for VATSIM ID {{ vatsimId }}. Ensure you have filed flight plans or try a different ID.</div>
            </v-alert>
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col v-for="plan in flightPlans" :key="plan.id" cols="12">
            <v-card
                @click="startMonitoring(plan)"
                hover
                class="flight-plan-card glass-card"
                elevation="4"
            >
              <v-card-text>
                <v-row align="center">
                  <v-col cols="auto">
                    <v-avatar size="56" color="primary" class="avatar-glow">
                      <v-icon size="32" color="white">mdi-airplane</v-icon>
                    </v-avatar>
                  </v-col>

                  <v-col>
                    <v-row align="center" class="mb-2">
                      <v-col cols="auto">
                        <h3 class="text-h5 font-weight-bold text-primary">{{ plan.callsign }}</h3>
                      </v-col>
                      <v-spacer />
                      <v-col cols="auto">
                        <div class="text-right">
                          <div class="text-h6 font-weight-bold">{{ plan.dep }} → {{ plan.arr }}</div>
                          <v-chip size="small" color="secondary" label class="chip-glow">
                            FL{{ Math.floor(parseInt(plan.altitude) / 100).toString().padStart(3, '0') }}
                          </v-chip>
                        </div>
                      </v-col>
                    </v-row>

                    <v-row class="text-body-2">
                      <v-col cols="6">
                        <div class="mb-1"><strong>Aircraft:</strong> {{ plan.aircraft?.split('/')[0] || 'Unknown' }}</div>
                        <div><strong>Departure:</strong> {{ plan.deptime }}Z</div>
                      </v-col>
                      <v-col cols="6">
                        <div class="mb-1"><strong>Route:</strong></div>
                        <div class="text-truncate">{{ plan.route || 'DCT' }}</div>
                      </v-col>
                    </v-row>

                    <div v-if="plan.assignedsquawk" class="mt-3">
                      <v-chip size="small" color="success" variant="outlined" label>
                        <v-icon size="16">mdi-radar</v-icon>
                        <span class="ml-1">{{ plan.assignedsquawk }}</span>
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
    <div v-else-if="currentScreen === 'monitor'" class="monitoring-screen">
      <!-- Top App Bar with Radio Style -->
      <v-app-bar color="primary" dark class="radio-bar">
        <v-btn icon @click="currentScreen = 'flightselect'">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <v-app-bar-title>
          <div class="radio-display">
            <div class="text-h6 font-weight-bold">{{ flightContext.callsign }}</div>
            <div class="text-caption radio-freq">{{ communicationsEngine.currentStep?.frequencyName || 'STANDBY' }}</div>
          </div>
        </v-app-bar-title>

        <v-spacer />

        <!-- Signal Strength Display -->
        <div class="signal-display mr-3">
          <div
              v-for="i in 5"
              :key="i"
              class="signal-bar"
              :class="{ 'signal-active': i <= signalStrength }"
          />
        </div>

        <!-- Radio Quality Indicator -->
        <v-chip
            size="small"
            :color="radioQuality.color"
            label
            class="mr-2"
        >
          {{ radioQuality.text }}
        </v-chip>

        <v-btn icon @click="showSettings = true">
          <v-icon>mdi-tune</v-icon>
        </v-btn>
      </v-app-bar>

      <!-- Flight Info Bar -->
      <div class="flight-info-bar">
        <v-container class="py-2">
          <v-row align="center" class="text-center">
            <v-col cols="3">
              <div class="info-item">
                <v-icon size="16" color="primary">mdi-map-marker</v-icon>
                <div class="text-body-2 font-weight-medium">{{ flightContext.departure }} → {{ flightContext.arrival }}</div>
              </div>
            </v-col>
            <v-col cols="3">
              <div class="info-item">
                <v-icon size="16" color="primary">mdi-altimeter</v-icon>
                <div class="text-body-2 font-weight-medium">{{ flightContext.flightLevel }}</div>
              </div>
            </v-col>
            <v-col cols="3">
              <div class="info-item">
                <v-icon size="16" color="primary">mdi-airplane</v-icon>
                <div class="text-body-2 font-weight-medium">{{ flightContext.aircraft }}</div>
              </div>
            </v-col>
            <v-col cols="3">
              <div class="info-item">
                <v-icon size="16" color="primary">mdi-gate</v-icon>
                <div class="text-body-2 font-weight-medium">{{ flightContext.gate }}</div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Communication Step Display -->
      <v-card class="mx-3 mt-3 step-card glass-card" elevation="4">
        <v-card-text class="text-center py-3">
          <v-chip color="primary" size="large" label class="mb-2 chip-glow">
            <v-icon>mdi-radio-tower</v-icon>
            <span class="ml-2">{{ communicationsEngine.currentStep?.action || 'Ready' }}</span>
          </v-chip>
          <div class="text-subtitle-2 text-medium-emphasis">
            {{ communicationsEngine.currentStep?.frequencyName || 'Awaiting Instructions' }}
          </div>
        </v-card-text>
      </v-card>

      <!-- Main Frequency Display -->
      <v-card class="mx-3 my-3 freq-card glass-card" elevation="6">
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col cols="4" class="text-center">
              <div class="freq-label">ACTIVE</div>
              <div class="freq-display freq-active">{{ frequencies.active }}</div>
              <div class="freq-name">{{ communicationsEngine.currentStep?.frequencyName?.toUpperCase() || 'STANDBY' }}</div>
            </v-col>

            <v-col cols="4" class="text-center">
              <v-btn
                  icon
                  size="large"
                  color="accent"
                  @click="swapFrequencies"
                  class="freq-swap-btn elevation-8"
                  :class="{ 'freq-swap-active': swapAnimation }"
              >
                <v-icon size="28">mdi-swap-horizontal</v-icon>
              </v-btn>
              <div class="text-caption mt-1">SWAP</div>
            </v-col>

            <v-col cols="4" class="text-center">
              <div class="freq-label">STANDBY</div>
              <div class="freq-display freq-standby">{{ frequencies.standby }}</div>
              <div class="freq-name">STBY</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- PTT Controls Section -->
      <v-container class="pa-3">
        <!-- ATC Communication PTT -->
        <v-card class="mb-3 ptt-card glass-card" elevation="8">
          <v-card-text class="text-center pa-4">
            <h4 class="text-subtitle-1 text-medium-emphasis mb-3 font-weight-bold">
              <v-icon>mdi-radio-tower</v-icon>
              ATC COMMUNICATION
            </h4>

            <!-- Expected Response Preview -->
            <div v-if="communicationsEngine.currentStep?.pilot" class="expected-text mb-3">
              <v-card variant="outlined" class="pa-2">
                <div class="text-caption text-medium-emphasis mb-1">EXPECTED:</div>
                <div class="text-body-2 font-style-italic">
                  "{{ normalizeExpectedText(communicationsEngine.currentStep.pilot) }}"
                </div>
              </v-card>
            </div>

            <v-btn
                size="x-large"
                :color="isRecording && !isIntercomMode ? 'error' : 'primary'"
                block
                class="ptt-btn elevation-8"
                :class="{
                'ptt-active': isRecording && !isIntercomMode,
                'btn-pulse': isRecording && !isIntercomMode
              }"
                @mousedown="startRecording(false)"
                @mouseup="stopRecording"
                @touchstart="startRecording(false)"
                @touchend="stopRecording"
                :disabled="!micPermission"
                style="height: 80px;"
            >
              <v-icon size="32" class="mr-2">
                {{ isRecording && !isIntercomMode ? 'mdi-record' : 'mdi-radio-handheld' }}
              </v-icon>
              <div>
                <div class="text-h6 font-weight-bold">
                  {{ isRecording && !isIntercomMode ? 'TRANSMITTING' : 'HOLD TO TALK' }}
                </div>
                <div class="text-caption">{{ frequencies.active }}</div>
              </div>
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Intercom PTT for Checklists -->
        <v-card class="mb-3 intercom-card glass-card" elevation="6">
          <v-card-text class="text-center pa-3">
            <h4 class="text-subtitle-1 text-medium-emphasis mb-3 font-weight-bold">
              <v-icon>mdi-headphones</v-icon>
              INTERCOM
            </h4>

            <v-btn
                size="large"
                :color="isRecording && isIntercomMode ? 'orange' : 'purple'"
                block
                class="intercom-btn elevation-6"
                :class="{
                'ptt-active': isRecording && isIntercomMode,
                'btn-pulse': isRecording && isIntercomMode
              }"
                @mousedown="startRecording(true)"
                @mouseup="stopRecording"
                @touchstart="startRecording(true)"
                @touchend="stopRecording"
                :disabled="!micPermission"
                style="height: 60px;"
            >
              <v-icon size="24" class="mr-2">
                {{ isRecording && isIntercomMode ? 'mdi-microphone' : 'mdi-headphones' }}
              </v-icon>
              <div class="text-subtitle-1 font-weight-bold">
                {{ isRecording && isIntercomMode ? 'INTERCOM ACTIVE' : 'INTERCOM' }}
              </div>
            </v-btn>

            <div class="text-caption text-medium-emphasis mt-2">
              Say "checklist" to start A320 procedures
            </div>
          </v-card-text>
        </v-card>

        <!-- Quick Action Buttons -->
        <v-row class="mb-3">
          <v-col cols="6">
            <v-btn
                color="success"
                block
                size="large"
                @click="openChecklist"
                :disabled="availableChecklists.length === 0"
                class="action-btn elevation-4"
            >
              <v-icon>mdi-clipboard-check-outline</v-icon>
              <span class="ml-2">Checklist</span>
            </v-btn>
          </v-col>

          <v-col cols="6">
            <v-btn
                color="orange"
                block
                size="large"
                @click="performRadioCheck"
                :loading="radioCheckLoading"
                class="action-btn elevation-4"
            >
              <v-icon>mdi-radio</v-icon>
              <span class="ml-2">Radio Check</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>

      <!-- Communication Log -->
      <v-card class="mx-3 mb-3 comm-log glass-card" elevation="4">
        <v-card-title class="text-subtitle-1 pb-2 d-flex align-center">
          <v-icon class="mr-2">mdi-message-text-outline</v-icon>
          Communication Log
          <v-spacer />
          <v-btn icon size="small" @click="clearCommunicationLog">
            <v-icon size="16">mdi-delete-sweep</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-2" style="max-height: 200px; overflow-y: auto;">
          <div v-if="communicationLog.length === 0" class="text-center py-4 text-medium-emphasis">
            <v-icon size="48" class="mb-2">mdi-radio-off</v-icon>
            <div>No communications yet</div>
          </div>
          <div
              v-else
              v-for="(log, index) in communicationLog.slice(-8)"
              :key="index"
              class="log-entry mb-2"
              :class="{ 'log-pilot': log.speaker === 'pilot', 'log-atc': log.speaker === 'atc' }"
          >
            <div class="d-flex align-start">
              <v-avatar size="24" :color="log.speaker === 'pilot' ? 'primary' : 'secondary'" class="mr-2 mt-1">
                <v-icon size="12" color="white">
                  {{ log.speaker === 'pilot' ? 'mdi-account-pilot' : 'mdi-radio-tower' }}
                </v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-caption font-weight-bold text-medium-emphasis">
                    {{ log.speaker.toUpperCase() }} - {{ log.frequency }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTime(log.timestamp) }}
                  </div>
                </div>
                <div class="text-body-2 font-mono">{{ log.message }}</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Last Transmission Display -->
      <v-card v-if="lastTransmission" class="mx-3 mb-3 last-tx glass-card" color="info" variant="tonal" elevation="4">
        <v-card-text class="pa-3">
          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2">mdi-microphone-outline</v-icon>
            <div class="text-caption font-weight-bold">LAST TRANSMISSION</div>
          </div>
          <div class="text-body-2 font-mono">{{ lastTransmission }}</div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Checklist Dialog -->
    <v-dialog v-model="showChecklistModal" max-width="500" persistent>
      <v-card v-if="currentChecklist" class="glass-card" elevation="12">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-clipboard-check</v-icon>
          {{ currentChecklist.name }}
          <v-spacer />
          <v-btn icon size="small" @click="closeChecklist">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <div class="mb-3 text-center">
            <v-progress-linear
                :model-value="checklistProgress"
                color="success"
                height="8"
                rounded
            />
            <div class="text-caption mt-1">
              {{ completedItems }}/{{ currentChecklist.items.length }} Complete
            </div>
          </div>

          <v-list class="pa-0">
            <v-list-item
                v-for="(item, index) in currentChecklist.items"
                :key="index"
                @click="toggleChecklistItem(index)"
                class="checklist-item px-2"
                :class="{ 'item-completed': item.completed }"
            >
              <template v-slot:prepend>
                <v-checkbox
                    :model-value="item.completed"
                    color="success"
                    hide-details
                    @click.stop="toggleChecklistItem(index)"
                />
              </template>

              <v-list-item-title
                  class="text-body-2"
                  :class="{ 'text-decoration-line-through text-medium-emphasis': item.completed }"
              >
                {{ item.text }}
              </v-list-item-title>

              <template v-slot:append>
                <v-btn
                    icon
                    size="small"
                    variant="plain"
                    @click.stop="readChecklistItem(item.text)"
                >
                  <v-icon size="16">mdi-volume-high</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-btn
              color="primary"
              block
              size="large"
              @click="readAllChecklist"
              :disabled="checklistProgress === 100"
              :loading="readingChecklist"
          >
            <v-icon>mdi-volume-high</v-icon>
            <span class="ml-2">Read Full Checklist</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettings" max-width="400">
      <v-card class="glass-card" elevation="12">
        <v-card-title>
          <v-icon class="mr-2">mdi-tune</v-icon>
          Radio Settings
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <div class="mb-4">
            <v-slider
                v-model="signalStrength"
                label="Signal Strength"
                min="1"
                max="5"
                step="1"
                show-ticks="always"
                thumb-label
                color="primary"
            />
          </div>

          <v-text-field
              v-model="frequencies.standby"
              label="Standby Frequency"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-4"
          />

          <v-switch
              v-model="randomTaxi"
              label="Random Taxi Routes"
              color="primary"
              hide-details
              class="mb-4"
          />

          <v-switch
              v-model="radioEffectsEnabled"
              label="Radio Static Effects"
              color="primary"
              hide-details
          />
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn @click="showSettings = false" color="primary">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Connection Status -->
    <div class="connection-status">
      <v-chip
          :color="micPermission ? 'success' : 'error'"
          size="small"
          variant="elevated"
          class="chip-glow"
      >
        <v-icon size="12">{{ micPermission ? 'mdi-microphone' : 'mdi-microphone-off' }}</v-icon>
        <span class="ml-1">{{ micPermission ? 'MIC OK' : 'NO MIC' }}</span>
      </v-chip>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import useRadioTTS from '~/../composables/radioTtsNew'
import useCommunicationsEngine from '~/../composables/communicationsEngine'

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

interface ChecklistItem {
  text: string
  completed: boolean
}

interface Checklist {
  name: string
  phase: string
  items: ChecklistItem[]
}

// A320 Checklists
const A320_CHECKLISTS: Checklist[] = [
  {
    name: 'Cockpit Preparation',
    phase: 'clearance',
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

// Core State
const currentScreen = ref<'login' | 'flightselect' | 'monitor'>('login')
const vatsimId = ref('')
const flightPlans = ref<VatsimFlightPlan[]>([])
const selectedFlightPlan = ref<VatsimFlightPlan | null>(null)

// Communications Engine
const communicationsEngine = useCommunicationsEngine()
const { flightContext, currentStep, communicationLog, processUserTransmission, initializeFlight } = communicationsEngine

// Communication State
const frequencies = ref({ active: '121.700', standby: '118.100' })
const isRecording = ref(false)
const isIntercomMode = ref(false)
const lastTransmission = ref('')
const micPermission = ref(false)
const swapAnimation = ref(false)

// UI State
const loading = ref(false)
const error = ref('')
const showSettings = ref(false)
const showChecklistModal = ref(false)
const currentChecklist = ref<Checklist | null>(null)
const signalStrength = ref(4)
const radioCheckLoading = ref(false)
const randomTaxi = ref(false)
const radioEffectsEnabled = ref(true)
const readingChecklist = ref(false)

// Audio
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])

// TTS Integration
const tts = useRadioTTS()

// Validation rules
const rules = {
  required: (v: string) => !!v || 'This field is required'
}

// Computed Properties
const availableChecklists = computed(() =>
    A320_CHECKLISTS.filter(cl => cl.phase === flightContext.value.phase)
)

const radioQuality = computed(() => {
  const strength = signalStrength.value
  if (strength >= 5) return { color: 'success', text: 'EXCELLENT' }
  if (strength >= 4) return { color: 'success', text: 'GOOD' }
  if (strength >= 3) return { color: 'warning', text: 'FAIR' }
  if (strength >= 2) return { color: 'orange', text: 'POOR' }
  return { color: 'error', text: 'WEAK' }
})

const checklistProgress = computed(() => {
  if (!currentChecklist.value) return 0
  const completed = currentChecklist.value.items.filter(item => item.completed).length
  return Math.round((completed / currentChecklist.value.items.length) * 100)
})

const completedItems = computed(() => {
  if (!currentChecklist.value) return 0
  return currentChecklist.value.items.filter(item => item.completed).length
})

// Methods
const loadFlightPlans = async () => {
  if (!vatsimId.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch(`https://api.vatsim.net/v2/members/${vatsimId.value}/flightplans`)

    if (Array.isArray(response) && response.length > 0) {
      flightPlans.value = response.slice(0, 10) // Limit to 10 most recent
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
  initializeFlight(flightPlan)
  currentScreen.value = 'monitor'

  // Set initial frequency based on first communication step
  if (currentStep.value) {
    frequencies.value.active = currentStep.value.frequency
  }
}

// PTT Functions with Radio Effects
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

    // Play PTT beep
    playPTTBeep(true)

  } catch (err) {
    console.error('Failed to start recording:', err)
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false

    // Play PTT release beep
    playPTTBeep(false)
  }
}

const processTransmission = async (audioBlob: Blob, isIntercom: boolean) => {
  try {
    if (isIntercom) {
      // Handle intercom for checklists
      const result = await tts.submitPTT(audioBlob, {
        expectedText: 'checklist request',
        moduleId: 'pilot-monitoring',
        lessonId: 'intercom',
        format: 'webm'
      })

      if (result.success) {
        const transcription = result.transcription.toLowerCase()
        lastTransmission.value = `INTERCOM: ${result.transcription}`

        // Check if user requested checklist
        if (transcription.includes('checklist') || transcription.includes('check list')) {
          if (availableChecklists.value.length > 0) {
            openChecklist()
            await speakWithRadioEffects(`Checklist available for ${availableChecklists.value[0].name}`)
          } else {
            await speakWithRadioEffects('No checklists available for current phase')
          }
        }
      }
    } else {
      // Handle ATC communication using communications engine
      const result = await tts.submitPTT(audioBlob, {
        expectedText: currentStep.value?.pilot || 'radio communication',
        moduleId: 'pilot-monitoring',
        lessonId: currentStep.value?.id || 'general',
        format: 'webm'
      })

      if (result.success) {
        lastTransmission.value = result.transcription

        // Process through communications engine
        const atcResponse = processUserTransmission(result.transcription)

        if (atcResponse) {
          // Delay ATC response to simulate real-world timing
          setTimeout(async () => {
            await speakWithRadioEffects(atcResponse)
          }, 1000 + Math.random() * 2000) // 1-3 second delay
        }
      }
    }
  } catch (err) {
    console.error('Error processing transmission:', err)
    error.value = 'Failed to process transmission'
  }
}

const speakWithRadioEffects = async (text: string) => {
  try {
    const audioEffects = currentStep.value?.audioEffects || { static: 15, distortion: 5, volume: 85 }

    await tts.speakServer(text, {
      level: signalStrength.value,
      voice: 'alloy',
      speed: 0.95, // Slightly slower for radio realism
      moduleId: 'pilot-monitoring',
      lessonId: currentStep.value?.id || 'general'
    })
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
    await speakWithRadioEffects(message)

    setTimeout(async () => {
      const response = `${flightContext.value.callsign}, ${frequencies.value.active}, read you five by five`
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

  // Update communication engine if needed
  if (currentStep.value && currentStep.value.frequency !== frequencies.value.active) {
    // Optionally log frequency change
  }

  setTimeout(() => {
    swapAnimation.value = false
  }, 500)
}

const normalizeExpectedText = (text: string): string => {
  if (!flightContext.value) return text
  return communicationsEngine.normalizeATCText(text, flightContext.value)
}

// Checklist Functions
const openChecklist = () => {
  if (availableChecklists.value.length > 0) {
    currentChecklist.value = { ...availableChecklists.value[0] }
    showChecklistModal.value = true
  }
}

const closeChecklist = () => {
  showChecklistModal.value = false
  currentChecklist.value = null
}

const toggleChecklistItem = async (itemIndex: number) => {
  if (!currentChecklist.value) return

  currentChecklist.value.items[itemIndex].completed = !currentChecklist.value.items[itemIndex].completed

  if (currentChecklist.value.items[itemIndex].completed) {
    // Read the item when completed
    await readChecklistItem(currentChecklist.value.items[itemIndex].text)
  }
}

const readChecklistItem = async (itemText: string) => {
  try {
    // Convert checklist item to radio-friendly format
    const radioText = itemText.replace(/\.\.\./g, '').replace(/\s+/g, ' ').trim()
    await speakWithRadioEffects(radioText)
  } catch (err) {
    console.error('Failed to read checklist item:', err)
  }
}

const readAllChecklist = async () => {
  if (!currentChecklist.value) return

  readingChecklist.value = true

  try {
    await speakWithRadioEffects(`Reading ${currentChecklist.value.name} checklist`)

    for (const item of currentChecklist.value.items) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await readChecklistItem(item.text)
    }

    await speakWithRadioEffects('Checklist complete')
  } catch (err) {
    console.error('Failed to read full checklist:', err)
  } finally {
    readingChecklist.value = false
  }
}

// Utility Functions
const playPTTBeep = (start: boolean) => {
  if (!radioEffectsEnabled.value) return

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
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const clearCommunicationLog = () => {
  communicationLog.value.splice(0)
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

// Watch for communication step changes to update frequency
watch(() => currentStep.value?.frequency, (newFreq) => {
  if (newFreq && newFreq !== frequencies.value.active) {
    frequencies.value.active = newFreq
  }
})
</script>

<style scoped>
/* Global Styles */
.monitoring-screen {
  background: linear-gradient(135deg, #0d1421 0%, #1a2332 100%);
  min-height: 100vh;
}

.login-screen {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

/* Glass Card Effect */
.glass-card {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Text Gradient */
.text-gradient {
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* App Bar */
.app-bar-glow {
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.radio-bar {
  background: linear-gradient(90deg, #1976d2, #1565c0) !important;
  box-shadow: 0 4px 20px rgba(25, 118, 210, 0.4);
}

.radio-display .radio-freq {
  opacity: 0.8;
  font-family: 'Roboto Mono', monospace;
}

/* Signal Display */
.signal-display {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 16px;
}

.signal-bar {
  width: 3px;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  border-radius: 1px;
}

.signal-bar:nth-child(1) { height: 20%; }
.signal-bar:nth-child(2) { height: 40%; }
.signal-bar:nth-child(3) { height: 60%; }
.signal-bar:nth-child(4) { height: 80%; }
.signal-bar:nth-child(5) { height: 100%; }

.signal-bar.signal-active {
  background: #4caf50;
  box-shadow: 0 0 4px #4caf50;
}

/* Flight Info Bar */
.flight-info-bar {
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* Step Card */
.step-card {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(21, 101, 192, 0.1));
}

/* Frequency Display */
.freq-card {
  background: linear-gradient(135deg, #263238 0%, #37474f 100%);
  color: white;
}

.freq-label {
  font-size: 11px;
  font-weight: bold;
  opacity: 0.7;
  margin-bottom: 4px;
}

.freq-display {
  font-size: 28px;
  font-family: 'Roboto Mono', monospace;
  font-weight: bold;
  text-shadow: 0 0 10px currentColor;
}

.freq-active {
  color: #4caf50;
}

.freq-standby {
  color: #ff9800;
}

.freq-name {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 2px;
}

.freq-swap-btn {
  transition: all 0.3s ease;
}

.freq-swap-active {
  transform: rotate(180deg);
}

/* PTT Buttons */
.ptt-btn {
  font-weight: bold;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.ptt-btn.ptt-active {
  background: #f44336 !important;
  border-color: #d32f2f;
  transform: scale(1.02);
}

.intercom-btn {
  font-weight: bold;
  transition: all 0.2s ease;
}

.intercom-btn.ptt-active {
  background: #ff9800 !important;
  transform: scale(1.02);
}

.btn-pulse {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1.02);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

/* Action Buttons */
.action-btn {
  font-weight: bold;
}

/* Communication Log */
.comm-log {
  background: rgba(0, 0, 0, 0.2);
}

.log-entry {
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.log-entry:hover {
  background: rgba(255, 255, 255, 0.05);
}

.log-pilot {
  border-left: 3px solid #2196f3;
}

.log-atc {
  border-left: 3px solid #9c27b0;
}

/* Checklist */
.checklist-item {
  transition: all 0.2s ease;
  border-radius: 8px;
}

.checklist-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.item-completed {
  opacity: 0.7;
}

/* Glowing Effects */
.chip-glow {
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
}

.btn-glow {
  box-shadow: 0 4px 15px rgba(25, 118, 210, 0.4);
}

.avatar-glow {
  box-shadow: 0 0 20px rgba(25, 118, 210, 0.3);
}

.input-glow:focus-within {
  box-shadow: 0 0 15px rgba(102, 126, 234, 0.3);
}

.radio-pulse {
  animation: radio-pulse 2s infinite;
}

@keyframes radio-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Card Hover Effects */
.flight-plan-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.flight-plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3);
}

/* Expected Text Styling */
.expected-text {
  font-family: 'Roboto Mono', monospace;
}

/* Connection Status */
.connection-status {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 1000;
}

/* Last Transmission */
.last-tx {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(21, 101, 192, 0.1));
}

/* Radio Effects */
.freq-swap-btn:hover {
  transform: scale(1.1);
}

/* Responsive Design */
@media (max-width: 600px) {
  .freq-display {
    font-size: 24px;
  }

  .ptt-btn {
    height: 70px !important;
  }

  .intercom-btn {
    height: 50px !important;
  }
}
</style>
