<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <v-app class="bg-transparent">
      <v-main>
        <div class="mx-auto w-full max-w-[420px] px-4 pb-24 pt-6 sm:px-6">
          <header class="flex items-center justify-between pb-6">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-cyan-400/80">OpenSquawk</p>
              <h1 class="text-2xl font-semibold">Pilot Monitoring</h1>
              <p class="mt-1 text-sm text-white/70">Mobile First · VATSIM Companion · PTT</p>
            </div>
            <v-icon icon="mdi-airplane-takeoff" size="36" class="text-cyan-300" />
          </header>

          <section v-if="!hasFlightPlan" class="space-y-6">
            <v-card class="bg-white/5 backdrop-blur border border-white/10">
              <v-card-text class="space-y-4">
                <div>
                  <h2 class="text-lg font-semibold">VATSIM Flightplan</h2>
                  <p class="text-sm text-white/70">Gib deine CID ein, wir holen deine gefilten Flugpläne von VATSIM.</p>
                </div>
                <v-text-field
                  v-model="vatsimIdInput"
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
                  :loading="flightPlanLoading"
                  @click="handleFetchFlightPlans"
                >
                  Flugpläne abrufen
                </v-btn>
                <v-alert
                  v-if="flightPlanError"
                  type="warning"
                  density="compact"
                  variant="tonal"
                  class="bg-amber-500/10 text-amber-200"
                >
                  {{ flightPlanError }}
                </v-alert>
              </v-card-text>
            </v-card>

            <div v-if="flightPlans.length" class="space-y-3">
              <p class="text-sm uppercase tracking-[0.28em] text-white/40">Verfügbare Flugpläne</p>
              <v-card
                v-for="plan in flightPlans"
                :key="plan.id"
                class="bg-white/5 border border-white/10 backdrop-blur transition hover:border-cyan-400/60"
                @click="handleSelectFlight(plan)"
              >
                <v-card-text class="space-y-2">
                  <div class="flex items-baseline justify-between">
                    <h3 class="text-xl font-semibold tracking-tight">{{ plan.callsign }}</h3>
                    <span class="text-xs uppercase text-white/50">{{ plan.aircraft }}</span>
                  </div>
                  <div class="flex flex-col gap-1 text-sm text-white/70">
                    <div class="flex items-center gap-2">
                      <v-icon icon="mdi-map-marker" size="16" class="text-cyan-300" />
                      <span>{{ plan.departure.icao }} → {{ plan.arrival.icao }}</span>
                    </div>
                    <div v-if="plan.route" class="flex items-start gap-2">
                      <v-icon icon="mdi-routes" size="16" class="text-cyan-300" />
                      <span class="text-xs leading-tight text-white/60">{{ plan.route }}</span>
                    </div>
                    <div v-if="plan.remarks" class="flex items-start gap-2">
                      <v-icon icon="mdi-information" size="16" class="text-cyan-300" />
                      <span class="text-xs leading-tight text-white/60">{{ plan.remarks }}</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </section>

          <section v-else class="space-y-6">
            <v-card class="bg-white/5 border border-white/10">
              <v-card-text class="space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-white/50">Aktiver Flug</p>
                    <h2 class="text-2xl font-semibold">{{ selectedFlight?.callsign }}</h2>
                    <p class="text-sm text-white/70">{{ selectedFlight?.departure.icao }} → {{ selectedFlight?.arrival.icao }}</p>
                  </div>
                  <v-chip color="cyan" variant="flat" size="small" class="font-semibold">
                    Phase: {{ activePhase?.title }}
                  </v-chip>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <v-text-field
                    v-model="activeFrequencyModel"
                    label="Active"
                    variant="outlined"
                    color="cyan"
                    hide-details
                    density="comfortable"
                  />
                  <v-text-field
                    v-model="standbyFrequencyModel"
                    label="Standby"
                    variant="outlined"
                    color="cyan"
                    hide-details
                    density="comfortable"
                  />
                </div>
                <v-btn block color="cyan" variant="tonal" prepend-icon="mdi-swap-horizontal" @click="swapFrequencies">
                  Frequenzen tauschen
                </v-btn>
                <v-alert
                  v-if="!microphoneGranted"
                  type="info"
                  variant="tonal"
                  class="bg-cyan-500/10 text-cyan-100"
                >
                  Mikrofonberechtigung erforderlich. Bitte erlaube den Zugriff, um Push-To-Talk nutzen zu können.
                  <template #append>
                    <v-btn color="cyan" size="small" variant="flat" @click="requestMicAccess">Erlauben</v-btn>
                  </template>
                </v-alert>
                <v-alert
                  v-if="microphoneError"
                  type="warning"
                  variant="tonal"
                  class="bg-amber-500/10 text-amber-100"
                >
                  {{ microphoneError }}
                </v-alert>
              </v-card-text>
            </v-card>

            <div>
              <p class="mb-2 text-xs uppercase tracking-[0.3em] text-white/40">Push to Talk</p>
              <v-sheet class="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-transparent p-4 shadow-lg">
                <v-btn-toggle
                  v-model="radioModeModel"
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
                    :class="isTransmitting ? 'ring-4 ring-cyan-400/70 shadow-2xl' : 'ring-1 ring-white/5'"
                    @touchstart.prevent="handlePttPress"
                    @touchend.prevent="handlePttRelease"
                    @touchcancel.prevent="handlePttRelease"
                    @mousedown.prevent="handlePttPress"
                    @mouseup.prevent="handlePttRelease"
                    @mouseleave="handlePttRelease"
                  >
                    <div>
                      <p class="text-xs uppercase tracking-[0.35em] text-white/40">Hold to transmit</p>
                      <p class="pt-3 text-3xl font-semibold">{{ radioModeLabel }}</p>
                      <p class="mt-2 text-sm text-white/60">{{ pttHint }}</p>
                    </div>
                  </div>
                </ClientOnly>
              </v-sheet>
            </div>

            <v-card class="bg-white/5 border border-white/10">
              <v-card-text class="space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-white/40">Radio Check</p>
                    <h3 class="text-lg font-semibold">Audio prüfen</h3>
                  </div>
                  <v-chip :color="radioCheckCompleted ? 'green' : 'cyan'" variant="tonal" size="small">
                    {{ radioCheckCompleted ? 'bereit' : 'offen' }}
                  </v-chip>
                </div>
                <div class="space-y-2 rounded-2xl bg-black/40 p-3 text-sm text-white/70">
                  <p><strong>PTT:</strong> Halte den Button und sprich:</p>
                  <p class="font-semibold text-white">{{ radioCheckPhrase }}</p>
                  <p class="text-xs text-white/50">Beispielantwort: {{ radioCheckReply }}</p>
                </div>
                <div class="flex gap-2">
                  <v-btn block color="cyan" variant="flat" @click="markRadioCheck">Radio Check erledigt</v-btn>
                  <v-btn block color="cyan" variant="tonal" @click="playPracticePrompt">Üben</v-btn>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="bg-white/5 border border-white/10">
              <v-card-text class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold">Flugphasen</h3>
                  <v-btn variant="text" color="cyan" density="comfortable" @click="resetPhase">
                    <v-icon icon="mdi-refresh" />
                  </v-btn>
                </div>
                <v-slide-group
                  v-model="phaseModel"
                  class="phase-group"
                  show-arrows
                  center-active
                >
                  <v-slide-group-item
                    v-for="phase in communicationPlaybook"
                    :key="phase.id"
                    :value="phase.id"
                  >
                    <v-chip
                      :color="phase.id === currentPhaseId ? 'cyan' : 'white'"
                      :variant="phase.id === currentPhaseId ? 'flat' : 'outlined'"
                      class="mx-1"
                    >
                      {{ phase.title }}
                    </v-chip>
                  </v-slide-group-item>
                </v-slide-group>
                <div class="space-y-3">
                  <div
                    v-for="step in activePhase?.steps || []"
                    :key="step.id"
                    class="rounded-2xl border border-white/10 bg-black/40 p-3"
                  >
                    <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                      <span>{{ step.speaker === 'pilot' ? 'Pilot' : 'ATC' }}</span>
                      <span>{{ step.trigger }}</span>
                    </div>
                    <p class="mt-2 text-sm font-semibold text-white">{{ renderStep(step) }}</p>
                    <p v-if="step.expectation" class="mt-1 text-xs text-white/50">{{ step.expectation }}</p>
                    <v-btn
                      v-if="step.requiresPtt === 'atc'"
                      size="small"
                      class="mt-3"
                      :color="isStepDone(step.id) ? 'green' : 'cyan'"
                      :variant="isStepDone(step.id) ? 'tonal' : 'outlined'"
                      prepend-icon="mdi-check"
                      @click="toggleStep(step.id)"
                    >
                      {{ isStepDone(step.id) ? 'Bestätigt' : 'Check' }}
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="bg-white/5 border border-white/10">
              <v-card-text class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold">A320 Checklist</h3>
                  <span class="text-xs uppercase tracking-[0.3em] text-white/40">Intercom</span>
                </div>
                <div v-if="activeChecklist.length" class="space-y-2">
                  <div
                    v-for="section in activeChecklist"
                    :key="section.id"
                    class="rounded-2xl border border-white/10 bg-black/40 p-3"
                  >
                    <h4 class="text-sm font-semibold text-white/80">{{ section.title }}</h4>
                    <ul class="mt-2 space-y-2">
                      <li
                        v-for="item in section.items"
                        :key="item.id"
                        class="flex items-center justify-between gap-3 text-sm"
                      >
                        <div>
                          <p class="font-medium text-white">{{ item.challenge }}</p>
                          <p class="text-xs text-white/50">{{ item.response }}</p>
                        </div>
                        <v-checkbox-btn
                          :model-value="isChecklistChecked(item.id)"
                          color="cyan"
                          @update:model-value="(value) => toggleChecklist(item.id, value as boolean)"
                        />
                      </li>
                    </ul>
                  </div>
                </div>
                <v-alert v-else type="info" variant="tonal" class="bg-cyan-500/10 text-cyan-100">
                  Für diese Phase liegt keine Checklist vor.
                </v-alert>
              </v-card-text>
            </v-card>

            <v-card class="bg-white/5 border border-white/10">
              <v-card-text class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold">METAR & WX</h3>
                  <v-btn variant="text" color="cyan" density="comfortable" @click="refreshMetar">
                    <v-icon icon="mdi-refresh" />
                  </v-btn>
                </div>
                <div class="space-y-2 text-sm">
                  <p><span class="text-white/40">DEP</span> {{ metar.departure || 'n/a' }}</p>
                  <p><span class="text-white/40">ARR</span> {{ metar.arrival || 'n/a' }}</p>
                  <p v-if="selectedFlight?.alternate?.icao"><span class="text-white/40">ALT</span> {{ metar.alternate || 'n/a' }}</p>
                  <p class="text-xs text-white/40">Stand {{ formattedMetarTimestamp }}</p>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="bg-white/5 border border-white/10">
              <v-card-text class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold">Settings</h3>
                  <v-switch
                    v-model="taxiRandomnessModel"
                    color="cyan"
                    inset
                    label="Taxi Randomizer"
                    hide-details
                  />
                </div>
                <p class="text-xs text-white/60">
                  Aktiviert zufällige Taxi-Routen, um Readbacks und Situational Awareness zu trainieren.
                </p>
              </v-card-text>
            </v-card>

            <v-card class="bg-white/5 border border-white/10">
              <v-card-text class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold">Radio Log</h3>
                  <span class="text-xs text-white/40">Live Feed</span>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="entry in transmissions"
                    :key="entry.id"
                    class="rounded-2xl border border-white/10 bg-black/40 p-3"
                  >
                    <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                      <span>{{ entry.speaker }}</span>
                      <span>{{ formatTimestamp(entry.timestamp) }}</span>
                    </div>
                    <p class="mt-2 text-sm text-white">{{ entry.text }}</p>
                  </div>
                  <p v-if="!transmissions.length" class="text-xs text-white/50">Noch keine Transmissions aufgezeichnet.</p>
                </div>
              </v-card-text>
            </v-card>
          </section>
        </div>
      </v-main>
    </v-app>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {storeToRefs} from 'pinia'
import {communicationPlaybook, renderStepText, type CommunicationStep} from '~/data/communications'
import {getChecklistForPhase} from '~/data/checklists'
import {normalizeAtcText} from '~/utils/phraseology'
import {usePilotMonitoringStore, type RadioMode, type VatsimFlightPlan} from '~/stores/pilotMonitoring'

const store = usePilotMonitoringStore()

interface ScenarioContext {
  squawk: string
  cruiseAltitude: string
  requestedAltitude: string
  sid: string
  star: string
  handoffController: string
  wind: string
  fix: string
}
const {
  vatsimId,
  flightPlans,
  flightPlanLoading,
  flightPlanError,
  selectedFlight,
  hasFlightPlan,
  microphoneGranted,
  microphoneError,
  activeFrequency,
  standbyFrequency,
  radioMode,
  isTransmitting,
  radioCheckCompleted,
  taxiRandomness,
  currentPhaseId,
  completedSteps,
  transmissions,
  metar,
  canTransmit,
} = storeToRefs(store)

const vatsimIdInput = ref(vatsimId.value)
const phaseModel = ref(currentPhaseId.value)
const taxiRoute = ref('A via A5, B2')
const scenarioContext = ref<ScenarioContext>(buildScenarioContext(selectedFlight.value))

const radioModeModel = computed({
  get: () => radioMode.value,
  set: (value: RadioMode) => {
    radioMode.value = value
  },
})

const taxiRandomnessModel = computed({
  get: () => taxiRandomness.value,
  set: (value: boolean) => store.setTaxiRandomness(value),
})

const activeFrequencyModel = computed({
  get: () => activeFrequency.value,
  set: (value: string) => {
    activeFrequency.value = sanitizeFrequency(value)
  },
})

const standbyFrequencyModel = computed({
  get: () => standbyFrequency.value,
  set: (value: string) => {
    standbyFrequency.value = sanitizeFrequency(value)
  },
})

const activePhase = computed(() => communicationPlaybook.find((phase) => phase.id === currentPhaseId.value))

const radioModeLabel = computed(() => (radioMode.value === 'atc' ? 'ATC' : 'INTERCOM'))

const pttHint = computed(() =>
  radioMode.value === 'atc'
    ? 'Sendet auf der aktiven Frequenz'
    : 'Crew Intercom – Checklist, Callouts',
)

const radioCheckPhrase = computed(() =>
  normalizeAtcText(
    'West Palm Tower, {{callsign|callsign}}, radio check on {{frequency|frequency}}.',
    {
      callsign: selectedFlight.value?.callsign,
      frequency: activeFrequency.value,
    },
  ),
)

const radioCheckReply = computed(() =>
  normalizeAtcText(
    '{{callsign|callsign}}, West Palm Tower, read you five.',
    {
      callsign: selectedFlight.value?.callsign,
    },
  ),
)

const formattedMetarTimestamp = computed(() => {
  if (!metar.value.fetchedAt) return 'n/a'
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(metar.value.fetchedAt))
})

const activeChecklist = computed(() => {
  if (!currentPhaseId.value) return []
  return getChecklistForPhase('a320', currentPhaseId.value)
})

watch(vatsimIdInput, (value) => {
  store.setVatsimId(value)
})

watch(currentPhaseId, (value) => {
  phaseModel.value = value
})

watch(phaseModel, (value) => {
  if (value && value !== currentPhaseId.value) {
    store.setPhase(value)
    store.resetPhaseProgress()
  }
})

watch(
  () => taxiRandomness.value,
  () => {
    updateTaxiRoute()
  },
  {immediate: true},
)

watch(
  () => selectedFlight.value,
  async (plan) => {
    updateTaxiRoute()
    scenarioContext.value = buildScenarioContext(plan ?? null)
    await store.fetchMetarForFlight(plan ?? undefined)
  },
  {immediate: true},
)

onMounted(() => {
  store.requestMicrophone()
})

function sanitizeFrequency(value: string): string {
  return value.replace(/[^0-9.]/g, '').slice(0, 7)
}

function updateTaxiRoute() {
  const defaults = ['A via A5, B2', 'B via B3, C1', 'M via M5, N3']
  const randomRoutes = ['A via H3, P1, S2', 'K via L2, P8, Z3', 'N via Q1, T2, V3']
  taxiRoute.value = taxiRandomness.value
    ? randomRoutes[Math.floor(Math.random() * randomRoutes.length)]
    : defaults[Math.floor(Math.random() * defaults.length)]
}

function handleFetchFlightPlans() {
  store.fetchFlightPlans(vatsimIdInput.value)
}

function handleSelectFlight(plan: VatsimFlightPlan) {
  store.selectFlight(plan.id)
  store.fetchMetarForFlight(plan)
}

function requestMicAccess() {
  store.requestMicrophone()
}

function handlePttPress() {
  if (!canTransmit.value) {
    requestMicAccess()
    return
  }
  store.beginTransmit(radioMode.value)
}

function handlePttRelease() {
  store.endTransmit()
}

function swapFrequencies() {
  store.swapFrequencies()
}

function renderStep(step: CommunicationStep) {
  return renderStepText(step, selectedFlight.value ?? null, {
    runway: selectedFlight.value?.departure.runway,
    taxiRoute: taxiRoute.value,
    cruiseAltitude: scenarioContext.value.cruiseAltitude,
    requestedAltitude: scenarioContext.value.requestedAltitude,
    nextFrequency: standbyFrequency.value,
    frequency: activeFrequency.value,
    sid: scenarioContext.value.sid,
    star: scenarioContext.value.star,
    squawk: scenarioContext.value.squawk,
    handoffController: scenarioContext.value.handoffController,
    wind: scenarioContext.value.wind,
    fix: scenarioContext.value.fix,
  })
}

function isStepDone(stepId: string) {
  return completedSteps.value.has(stepId)
}

function toggleStep(stepId: string) {
  if (!completedSteps.value.has(stepId)) {
    store.completeStep(stepId)
  }
}

function resetPhase() {
  store.resetPhaseProgress()
}

function toggleChecklist(id: string, value: boolean) {
  store.setChecklistItem(id, value)
}

function isChecklistChecked(id: string) {
  return Boolean(store.checklistProgress.value?.[id])
}

function markRadioCheck() {
  store.logTransmission({
    mode: 'atc',
    speaker: 'pilot',
    text: radioCheckPhrase.value,
  })
  store.markRadioCheckDone()
}

function playPracticePrompt() {
  store.logTransmission({
    mode: 'atc',
    speaker: 'system',
    text: 'Audio prompt für Whisper/LLM (Demo)',
  })
}

function refreshMetar() {
  store.fetchMetarForFlight()
}

function formatTimestamp(ts: number) {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts))
}

function buildScenarioContext(plan: VatsimFlightPlan | null | undefined): ScenarioContext {
  const defaultSquawk = '4712'
  const defaultCruise = 'FL360'
  const defaultRequested = 'FL380'
  const defaultSid = plan?.departure.icao ? `${plan.departure.icao}1` : 'SID'
  const defaultStar = plan?.arrival.icao ? `${plan.arrival.icao}2` : 'STAR'
  const controllerName = plan?.departure.icao ? `${plan.departure.icao} Departure` : 'Departure'

  return {
    squawk: defaultSquawk,
    cruiseAltitude: defaultCruise,
    requestedAltitude: defaultRequested,
    sid: defaultSid,
    star: defaultStar,
    handoffController: controllerName,
    wind: '270/12',
    fix: 'TABUM',
  }
}
</script>

<style scoped>
.phase-group {
  max-width: 100%;
}
.ptt-pad {
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
</style>
