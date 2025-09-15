<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <div class="mx-auto w-full max-w-[420px] px-4 pb-24 pt-6 sm:px-6">
      <!-- Header -->
      <header class="flex items-center justify-between pb-6">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-cyan-400/80">OpenSquawk</p>
          <h1 class="text-2xl font-semibold">Pilot Monitoring</h1>
          <p class="mt-1 text-sm text-white/70">VATSIM Companion • PTT</p>
        </div>
        <v-icon icon="mdi-airplane-takeoff" size="36" class="text-cyan-300" />
      </header>

      <!-- Login Section -->
      <section v-if="currentScreen === 'login'" class="space-y-6">
        <v-card class="bg-white/5 backdrop-blur border border-white/10">
          <v-card-text class="space-y-4">
            <div>
              <h2 class="text-lg font-semibold">VATSIM Flightplan</h2>
              <p class="text-sm text-white/70">Gib deine CID ein, wir holen deine gefilten Flugpläne von VATSIM.</p>
            </div>
            <v-text-field
                v-model="vatsimId"
                label="VATSIM CID"
                variant="outlined"
                density="comfortable"
                color="cyan"
                prepend-inner-icon="mdi-account-circle"
                class="text-white"
                hide-details
                inputmode="numeric"
            />
            <v-btn
                block
                color="cyan"
                variant="flat"
                :loading="loading"
                @click="loadFlightPlans"
            >
              Flugpläne abrufen
            </v-btn>
            <v-alert
                v-if="error"
                type="warning"
                density="compact"
                variant="tonal"
                class="bg-amber-500/10 text-amber-200"
            >
              {{ error }}
            </v-alert>
          </v-card-text>
        </v-card>
      </section>

      <!-- Flight Selection -->
      <section v-else-if="currentScreen === 'flightselect'" class="space-y-6">
        <div class="flex items-center justify-between">
          <v-btn icon @click="currentScreen = 'login'" class="text-cyan-300">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h2 class="text-lg font-semibold">Verfügbare Flugpläne</h2>
          <v-chip color="cyan" variant="outlined" size="small">{{ vatsimId }}</v-chip>
        </div>

        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="cyan" class="mb-4" />
          <p class="text-sm text-white/70">Lade Flugpläne von VATSIM...</p>
        </div>

        <div v-else-if="flightPlans.length === 0" class="text-center py-8">
          <v-icon size="48" class="text-white/30 mb-4">mdi-airplane-off</v-icon>
          <p class="text-white/70">Keine Flugpläne gefunden</p>
        </div>

        <div v-else class="space-y-3">
          <v-card
              v-for="plan in flightPlans"
              :key="plan.id"
              class="bg-white/5 border border-white/10 backdrop-blur transition hover:border-cyan-400/60"
              @click="startMonitoring(plan)"
          >
            <v-card-text class="space-y-2">
              <div class="flex items-baseline justify-between">
                <h3 class="text-xl font-semibold tracking-tight">{{ plan.callsign }}</h3>
                <span class="text-xs uppercase text-white/50">{{ plan.aircraft?.split('/')[0] }}</span>
              </div>
              <div class="flex flex-col gap-1 text-sm text-white/70">
                <div class="flex items-center gap-2">
                  <v-icon icon="mdi-map-marker" size="16" class="text-cyan-300" />
                  <span>{{ plan.dep }} → {{ plan.arr }}</span>
                </div>
                <div v-if="plan.route" class="flex items-start gap-2">
                  <v-icon icon="mdi-routes" size="16" class="text-cyan-300" />
                  <span class="text-xs leading-tight text-white/60">{{ plan.route }}</span>
                </div>
                <div v-if="plan.assignedsquawk" class="flex items-start gap-2">
                  <v-icon icon="mdi-radar" size="16" class="text-cyan-300" />
                  <span class="text-xs leading-tight text-white/60">Squawk: {{ plan.assignedsquawk }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </section>

      <!-- Main Monitoring Screen -->
      <section v-else class="space-y-6">
        <!-- Flight Info Card -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-white/50">Aktiver Flug</p>
                <h2 class="text-2xl font-semibold">{{ flightContext.callsign }}</h2>
                <p class="text-sm text-white/70">{{ flightContext.departure }} → {{ flightContext.arrival }}</p>
              </div>
              <div class="text-right">
                <v-chip color="cyan" variant="flat" size="small" class="font-semibold mb-2">
                  {{ currentStep?.frequencyName || 'Standby' }}
                </v-chip>
                <div class="text-xs text-white/50">{{ currentStep?.action }}</div>
              </div>
            </div>

            <!-- Frequency Controls -->
            <div class="grid grid-cols-2 gap-3">
              <v-text-field
                  v-model="frequencies.active"
                  label="Active"
                  variant="outlined"
                  color="cyan"
                  hide-details
                  density="comfortable"
                  class="freq-input-active"
              />
              <v-text-field
                  v-model="frequencies.standby"
                  label="Standby"
                  variant="outlined"
                  color="cyan"
                  hide-details
                  density="comfortable"
                  class="freq-input-standby"
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

            <!-- Microphone Status -->
            <v-alert
                v-if="!micPermission"
                type="info"
                variant="tonal"
                class="bg-cyan-500/10 text-cyan-100"
            >
              Mikrofonberechtigung erforderlich für Push-To-Talk.
              <template #append>
                <v-btn color="cyan" size="small" variant="flat" @click="requestMicAccess">Erlauben</v-btn>
              </template>
            </v-alert>

            <!-- Signal Strength -->
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

        <!-- Expected Communication -->
        <v-card v-if="currentStep?.pilot" class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs uppercase tracking-[0.3em] text-white/40">Erwartete Eingabe</p>
              <v-chip color="orange" variant="tonal" size="small">Pilot</v-chip>
            </div>
            <div class="space-y-2 rounded-2xl bg-black/40 p-3 text-sm">
              <p class="font-semibold text-white">{{ normalizeExpectedText(currentStep.pilot) }}</p>
              <p class="text-xs text-white/50">Verwende PTT und sprich diesen Text</p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Push to Talk -->
        <div>
          <p class="mb-2 text-xs uppercase tracking-[0.3em] text-white/40">Push to Talk</p>
          <v-sheet class="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-transparent p-4 shadow-lg">
            <v-btn-toggle
                v-model="radioMode"
                color="cyan"
                class="mb-4 flex"
                mandatory
            >
              <v-btn value="atc" prepend-icon="mdi-radio-handheld">ATC</v-btn>
              <v-btn value="intercom" prepend-icon="mdi-account-voice">Intercom</v-btn>
            </v-btn-toggle>

            <ClientOnly>
              <div
                  class="ptt-pad flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-center transition"
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

        <!-- Radio Check -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-white/40">Radio Check</p>
                <h3 class="text-lg font-semibold">Audio prüfen</h3>
              </div>
              <v-chip :color="radioCheckCompleted ? 'green' : 'cyan'" variant="tonal" size="small">
                {{ radioCheckCompleted ? 'erledigt' : 'ausstehend' }}
              </v-chip>
            </div>
            <div class="space-y-2 rounded-2xl bg-black/40 p-3 text-sm text-white/70">
              <p><strong>Beispiel:</strong></p>
              <p class="font-semibold text-white">{{ generateRadioCheck() }}</p>
            </div>
            <div class="flex gap-2">
              <v-btn
                  block
                  color="orange"
                  variant="flat"
                  @click="performRadioCheck"
                  :loading="radioCheckLoading"
              >
                Radio Check
              </v-btn>
              <v-btn
                  block
                  color="cyan"
                  variant="tonal"
                  @click="playRadioCheckExample"
              >
                Beispiel anhören
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Communication Flow -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Kommunikationsablauf</h3>
              <v-btn variant="text" color="cyan" density="comfortable" @click="resetCommunications">
                <v-icon icon="mdi-refresh" />
              </v-btn>
            </div>

            <!-- Phase Progress -->
            <div class="space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-white/40">Phase {{ currentPhaseIndex + 1 }} von {{ FLIGHT_PHASES.length }}</span>
                <span class="text-cyan-300">{{ currentPhase.name }}</span>
              </div>
              <v-progress-linear
                  :model-value="(currentPhaseIndex / (FLIGHT_PHASES.length - 1)) * 100"
                  color="cyan"
                  height="4"
                  rounded
              />
            </div>

            <!-- Current Step -->
            <div v-if="currentStep" class="rounded-2xl border border-white/10 bg-black/40 p-3">
              <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40 mb-2">
                <span>{{ currentStep.trigger === 'pilot' ? 'Pilot' : 'ATC' }}</span>
                <span>{{ currentStep.frequencyName }}</span>
              </div>

              <div v-if="currentStep.atc" class="mb-3">
                <p class="text-sm font-semibold text-white/80 mb-1">ATC sagt:</p>
                <p class="text-sm text-white">{{ normalizeExpectedText(currentStep.atc) }}</p>
              </div>

              <div v-if="currentStep.pilotResponse" class="mb-3">
                <p class="text-sm font-semibold text-white/80 mb-1">Erwartete Antwort:</p>
                <p class="text-sm text-white">{{ normalizeExpectedText(currentStep.pilotResponse) }}</p>
              </div>

              <div class="flex gap-2 mt-3">
                <v-btn
                    size="small"
                    color="cyan"
                    variant="outlined"
                    @click="previousPhase"
                    :disabled="currentPhaseIndex === 0"
                >
                  Zurück
                </v-btn>
                <v-btn
                    size="small"
                    color="cyan"
                    variant="flat"
                    @click="nextPhase"
                    :disabled="currentPhaseIndex === FLIGHT_PHASES.length - 1"
                >
                  Weiter
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- A320 Checklist -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">A320 Checklist</h3>
              <span class="text-xs uppercase tracking-[0.3em] text-white/40">Intercom</span>
            </div>

            <div v-if="availableChecklists.length" class="space-y-2">
              <div
                  v-for="checklist in availableChecklists"
                  :key="checklist.name"
                  class="rounded-2xl border border-white/10 bg-black/40 p-3"
              >
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-semibold text-white/80">{{ checklist.name }}</h4>
                  <v-btn
                      size="small"
                      color="cyan"
                      variant="outlined"
                      @click="openChecklistModal(checklist)"
                  >
                    Öffnen
                  </v-btn>
                </div>
                <div class="text-xs text-white/50">
                  {{ checklist.items.length }} Punkte • Phase: {{ checklist.phase }}
                </div>
              </div>
            </div>

            <v-alert v-else type="info" variant="tonal" class="bg-cyan-500/10 text-cyan-100">
              Für diese Phase liegt keine Checklist vor.
            </v-alert>

            <div class="text-xs text-white/50">
              Sage "checklist" über Intercom um Checklisten zu aktivieren.
            </div>
          </v-card-text>
        </v-card>

        <!-- Communication Log -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Radio Log</h3>
              <v-btn variant="text" color="cyan" density="comfortable" @click="clearCommunicationLog">
                <v-icon icon="mdi-delete-sweep" />
              </v-btn>
            </div>

            <div class="space-y-2">
              <div
                  v-for="entry in communicationLog.slice(-5)"
                  :key="entry.timestamp"
                  class="rounded-2xl border border-white/10 bg-black/40 p-3"
              >
                <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                  <span class="flex items-center gap-2">
                    <v-icon
                        :icon="entry.speaker === 'pilot' ? 'mdi-account-pilot' : 'mdi-radio-tower'"
                        size="12"
                    />
                    {{ entry.speaker.toUpperCase() }}
                  </span>
                  <span>{{ formatTime(entry.timestamp) }}</span>
                </div>
                <p class="mt-2 text-sm text-white">{{ entry.message }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <v-chip size="x-small" color="cyan" variant="outlined">{{ entry.frequency }}</v-chip>
                  <span class="text-xs text-white/40">{{ entry.step }}</span>
                </div>
              </div>

              <p v-if="communicationLog.length === 0" class="text-xs text-white/50 text-center py-4">
                Noch keine Übertragungen aufgezeichnet.
              </p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Last Transmission -->
        <v-card v-if="lastTransmission" class="bg-cyan-500/10 border border-cyan-400/20">
          <v-card-text class="space-y-2">
            <div class="flex items-center gap-2">
              <v-icon icon="mdi-microphone-outline" size="16" class="text-cyan-300" />
              <span class="text-xs uppercase tracking-[0.3em] text-cyan-300">Letzte Übertragung</span>
            </div>
            <p class="text-sm text-white font-mono">{{ lastTransmission }}</p>
          </v-card-text>
        </v-card>

        <!-- Settings -->
        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Einstellungen</h3>
              <v-switch
                  v-model="radioEffectsEnabled"
                  color="cyan"
                  inset
                  label="Radio-Effekte"
                  hide-details
              />
            </div>

            <div class="space-y-4">
              <div>
                <label class="text-xs uppercase tracking-[0.3em] text-white/40 block mb-2">
                  Signal-Stärke
                </label>
                <v-slider
                    v-model="signalStrength"
                    min="1"
                    max="5"
                    step="1"
                    show-ticks="always"
                    color="cyan"
                    thumb-label
                />
              </div>

              <v-switch
                  v-model="randomTaxi"
                  color="cyan"
                  inset
                  label="Zufällige Taxi-Routen"
                  hide-details
              />
            </div>

            <p class="text-xs text-white/60">
              Zufällige Routen trainieren Situational Awareness und Readback-Fähigkeiten.
            </p>
          </v-card-text>
        </v-card>
      </section>

      <!-- Checklist Modal -->
      <v-dialog v-model="showChecklistModal" max-width="400" persistent>
        <v-card v-if="currentChecklist" class="bg-[#050910] border border-white/20">
          <v-card-title class="flex items-center justify-between border-b border-white/10">
            <span>{{ currentChecklist.name }}</span>
            <v-btn icon size="small" @click="closeChecklistModal">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="space-y-3 max-h-96 overflow-y-auto">
            <div class="text-center mb-4">
              <v-progress-linear
                  :model-value="checklistProgress"
                  color="cyan"
                  height="6"
                  rounded
              />
              <div class="text-xs text-white/50 mt-1">
                {{ completedChecklistItems }}/{{ currentChecklist.items.length }} abgeschlossen
              </div>
            </div>

            <div
                v-for="(item, index) in currentChecklist.items"
                :key="index"
                class="flex items-center justify-between gap-3 p-3 rounded-lg border border-white/10 bg-black/20"
                :class="{ 'opacity-60': item.completed }"
            >
              <div class="flex-1">
                <p class="text-sm font-medium" :class="{ 'line-through': item.completed }">
                  {{ item.text }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <v-btn
                    icon
                    size="small"
                    variant="plain"
                    color="cyan"
                    @click="readChecklistItem(item.text)"
                >
                  <v-icon size="16">mdi-volume-high</v-icon>
                </v-btn>

                <v-checkbox
                    :model-value="item.completed"
                    color="cyan"
                    hide-details
                    @update:model-value="toggleChecklistItem(index)"
                />
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="border-t border-white/10">
            <v-btn
                color="cyan"
                variant="flat"
                block
                @click="readAllChecklist"
                :loading="readingChecklist"
                :disabled="checklistProgress === 100"
            >
              <v-icon>mdi-volume-high</v-icon>
              <span class="ml-2">Komplette Checklist vorlesen</span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import useRadioTTS from '~/composables/radioTtsNew'
import useCommunicationsEngine from '~/composables/communicationsEngine'

// Types from the original pilot-monitoring.vue
type RadioMode = 'atc' | 'intercom'

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

// Import the flight phases from communications engine
import { FLIGHT_PHASES, COMMUNICATION_STEPS } from '~/composables/communicationsEngine'

// Core State
const currentScreen = ref<'login' | 'flightselect' | 'monitor'>('login')
const vatsimId = ref('')
const flightPlans = ref<VatsimFlightPlan[]>([])
const selectedFlightPlan = ref<VatsimFlightPlan | null>(null)
const radioMode = ref<RadioMode>('atc')

// Communications Engine
const communicationsEngine = useCommunicationsEngine()
const { flightContext, currentStep, communicationLog, processUserTransmission, initializeFlight } = communicationsEngine

// Communication State
const frequencies = ref({ active: '121.700', standby: '118.100' })
const isRecording = ref(false)
const lastTransmission = ref('')
const micPermission = ref(false)
const swapAnimation = ref(false)

// UI State
const loading = ref(false)
const error = ref('')
const showChecklistModal = ref(false)
const currentChecklist = ref<Checklist | null>(null)
const signalStrength = ref(4)
const radioCheckLoading = ref(false)
const radioCheckCompleted = ref(false)
const randomTaxi = ref(false)
const radioEffectsEnabled = ref(true)
const readingChecklist = ref(false)

// Audio
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])

// TTS Integration
const tts = useRadioTTS()

// Computed Properties
const currentPhase = computed(() => FLIGHT_PHASES.find(p => p.id === flightContext.value.phase) || FLIGHT_PHASES[0])
const currentPhaseIndex = computed(() => FLIGHT_PHASES.findIndex(p => p.id === flightContext.value.phase))

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

const completedChecklistItems = computed(() => {
  if (!currentChecklist.value) return 0
  return currentChecklist.value.items.filter(item => item.completed).length
})

// Methods
const loadFlightPlans = async () => {
  if (!vatsimId.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch(`/api/vatsim/flightplans?cid=${vatsimId.value}`)

    if (Array.isArray(response) && response.length > 0) {
      flightPlans.value = response.slice(0, 10)
      currentScreen.value = 'flightselect'
    } else {
      error.value = 'Keine Flugpläne für diese VATSIM ID gefunden'
    }
  } catch (err) {
    console.error('Error loading flight plans:', err)
    error.value = 'Fehler beim Laden der Flugpläne. Bitte VATSIM ID prüfen.'
  } finally {
    loading.value = false
  }
}

const startMonitoring = (flightPlan: VatsimFlightPlan) => {
  selectedFlightPlan.value = flightPlan
  initializeFlight(flightPlan)
  currentScreen.value = 'monitor'

  if (currentStep.value) {
    frequencies.value.active = currentStep.value.frequency
  }
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

// PTT Functions with enhanced radio effects
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

    playPTTBeep(true)

  } catch (err) {
    console.error('Failed to start recording:', err)
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
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

        if (transcription.includes('checklist') || transcription.includes('check list')) {
          if (availableChecklists.value.length > 0) {
            openChecklistModal(availableChecklists.value[0])
            await speakWithRadioEffects(`Checklist verfügbar: ${availableChecklists.value[0].name}`)
          } else {
            await speakWithRadioEffects('Keine Checklisten für aktuelle Phase verfügbar')
          }
        }
      }
    } else {
      // Handle ATC communication
      const result = await tts.submitPTT(audioBlob, {
        expectedText: currentStep.value?.pilot || 'radio communication',
        moduleId: 'pilot-monitoring',
        lessonId: currentStep.value?.id || 'general',
        format: 'webm'
      })

      if (result.success) {
        lastTransmission.value = result.transcription

        const atcResponse = processUserTransmission(result.transcription)

        if (atcResponse) {
          setTimeout(async () => {
            await speakWithRadioEffects(atcResponse)
          }, 1000 + Math.random() * 2000)
        }
      }
    }
  } catch (err) {
    console.error('Error processing transmission:', err)
    error.value = 'Fehler bei der Übertragungsverarbeitung'
  }
}

const speakWithRadioEffects = async (text: string) => {
  try {
    await tts.speakServer(text, {
      level: signalStrength.value,
      voice: 'alloy',
      speed: 0.95,
      moduleId: 'pilot-monitoring',
      lessonId: currentStep.value?.id || 'general'
    })
  } catch (err) {
    console.error('TTS failed:', err)
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

const normalizeExpectedText = (text: string): string => {
  if (!flightContext.value) return text
  return communicationsEngine.normalizeATCText(text, flightContext.value)
}

const generateRadioCheck = (): string => {
  if (!flightContext.value.callsign || !frequencies.value.active) return ''

  return communicationsEngine.normalizeATCText(
      `${frequencies.value.active}, ${flightContext.value.callsign}, radio check`,
      flightContext.value
  )
}

const performRadioCheck = async () => {
  if (!flightContext.value.callsign) return

  radioCheckLoading.value = true

  const message = generateRadioCheck()
  lastTransmission.value = message

  try {
    await speakWithRadioEffects(message)

    setTimeout(async () => {
      const response = `${flightContext.value.callsign}, read you five by five`
      await speakWithRadioEffects(response)
      radioCheckCompleted.value = true
      radioCheckLoading.value = false
    }, 2000)
  } catch (err) {
    console.error('Radio check failed:', err)
    radioCheckLoading.value = false
  }
}

const playRadioCheckExample = async () => {
  const example = generateRadioCheck()
  await speakWithRadioEffects(example)
}

const resetCommunications = () => {
  communicationLog.value.splice(0)
  lastTransmission.value = ''
  radioCheckCompleted.value = false
}

const nextPhase = () => {
  if (currentPhaseIndex.value < FLIGHT_PHASES.length - 1) {
    const nextPhase = FLIGHT_PHASES[currentPhaseIndex.value + 1]
    flightContext.value.phase = nextPhase.id
    if (nextPhase.frequency) {
      frequencies.value.active = nextPhase.frequency
    }
  }
}

const previousPhase = () => {
  if (currentPhaseIndex.value > 0) {
    const prevPhase = FLIGHT_PHASES[currentPhaseIndex.value - 1]
    flightContext.value.phase = prevPhase.id
  }
}

// Checklist Functions
const openChecklistModal = (checklist: Checklist) => {
  currentChecklist.value = { ...checklist }
  showChecklistModal.value = true
}

const closeChecklistModal = () => {
  showChecklistModal.value = false
  currentChecklist.value = null
}

const toggleChecklistItem = async (itemIndex: number) => {
  if (!currentChecklist.value) return

  currentChecklist.value.items[itemIndex].completed = !currentChecklist.value.items[itemIndex].completed

  if (currentChecklist.value.items[itemIndex].completed) {
    await readChecklistItem(currentChecklist.value.items[itemIndex].text)
  }
}

const readChecklistItem = async (itemText: string) => {
  try {
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
  return date.toLocaleTimeString('de-DE', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const clearCommunicationLog = () => {
  communicationLog.value.splice(0)
}

// Initialize
onMounted(async () => {
  await requestMicAccess()
})

// Watch for communication step changes
watch(() => currentStep.value?.frequency, (newFreq) => {
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
  cursor: pointer;
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

/* Custom animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse {
  animation: pulse 1s infinite;
}

/* Responsive adjustments */
@media (max-width: 400px) {
  .ptt-pad {
    height: 180px !important;
  }
}
</style>
