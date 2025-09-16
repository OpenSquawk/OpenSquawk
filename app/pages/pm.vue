<template>
  <v-container class="py-6" max-width="1100">
    <!-- Header -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-3">
          <v-icon>mdi-radio-handheld</v-icon>
          <span class="text-h6">OpenSquawk · PM (Decision-Tree)</span>
          <v-chip size="small" color="primary" variant="flat">{{ currentState?.id }}</v-chip>
          <v-chip size="small" :color="currentState?.phase==='Interrupt'?'red':'secondary'" variant="text">{{ currentState?.phase }}</v-chip>
          <v-chip size="small" variant="text">{{ currentState?.role }}</v-chip>
        </div>
        <div class="d-flex align-center ga-2">
          <v-chip size="small" :color="flags.in_air ? 'green' : 'grey'">in-air: {{ flags.in_air }}</v-chip>
          <v-chip size="small" :color="flags.emergency_active ? 'red' : 'grey'">emerg: {{ flags.emergency_active }}</v-chip>
          <v-chip size="small" variant="text">unit: {{ flags.current_unit }}</v-chip>
        </div>
      </v-card-title>
      <v-card-subtitle class="d-flex align-center ga-4 px-4 pb-4">
        <span>Freq: <strong>{{ activeFrequency || '—' }}</strong></span>
        <span v-if="vars.callsign">Callsign: <strong>{{ vars.callsign }}</strong></span>
        <span v-if="vars.dep && vars.dest">Route: <strong>{{ vars.dep }} → {{ vars.dest }}</strong></span>
        <span v-if="vars.sid">SID: <strong>{{ vars.sid }}</strong></span>
        <span v-if="vars.cruise_flight_level">CFL: <strong>{{ vars.cruise_flight_level }}</strong></span>
        <v-spacer />
        <v-btn size="small" variant="outlined" :loading="loading" @click="initializeFromApis">Reload</v-btn>
      </v-card-subtitle>
    </v-card>

    <!-- VATSIM Inputs / Plan -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center ga-3">
        <v-icon>mdi-database-search</v-icon>
        VATSIM Quellen
      </v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap ga-3 align-center">
          <v-text-field
              v-model="vatsimId"
              label="VATSIM Member ID"
              density="compact"
              style="max-width: 220px"
          />
          <v-btn color="primary" :loading="loading" @click="initializeFromApis">Laden</v-btn>
          <v-divider vertical class="mx-2" />
          <div v-if="selectedPlan" class="text-body-2">
            <strong>Plan:</strong>
            <span>{{ selectedPlan.callsign }}</span> ·
            <span>{{ selectedPlan.dep }}→{{ selectedPlan.arr }}</span> ·
            <span>Alt {{ selectedPlan.altitude }}</span>
          </div>
          <div class="text-caption text-medium-emphasis">
            DataFeed: Pilots {{ dataFeed?.pilots?.length ?? 0 }} · ATC {{ dataFeed?.controllers?.length ?? 0 }} · Updated {{ feedUpdatedAt }}
          </div>
        </div>

        <div v-if="liveFreqs" class="mt-3 d-flex flex-wrap ga-2">
          <v-chip size="small" color="secondary" variant="outlined" v-if="liveFreqs.DEL">DEL {{ liveFreqs.DEL }}</v-chip>
          <v-chip size="small" color="secondary" variant="outlined" v-if="liveFreqs.GND">GND {{ liveFreqs.GND }}</v-chip>
          <v-chip size="small" color="secondary" variant="outlined" v-if="liveFreqs.TWR">TWR {{ liveFreqs.TWR }}</v-chip>
          <v-chip size="small" color="secondary" variant="outlined" v-if="liveFreqs.DEP">DEP {{ liveFreqs.DEP }}</v-chip>
          <v-chip size="small" color="secondary" variant="outlined" v-if="liveFreqs.APP">APP {{ liveFreqs.APP }}</v-chip>
          <v-chip size="small" color="secondary" variant="outlined" v-if="liveFreqs.CTR">CTR {{ liveFreqs.CTR }}</v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- PTT / Pilot Input -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center ga-3">
        <v-icon>mdi-microphone</v-icon>
        Pilot Transmission
      </v-card-title>
      <v-card-text>
        <div class="d-flex ga-3 align-center">
          <v-text-field
              v-model="pilotInput"
              label="Say something… (e.g., “Frankfurt Ground, DLH39A, request taxi”)"
              density="comfortable"
              hide-details
              @keyup.enter="sendPilot"
          />
          <v-btn color="primary" @click="sendPilot">Send</v-btn>
        </div>
        <div class="mt-2 text-caption text-medium-emphasis">
          Interrupts (nur in-air): „MAYDAY…“ / „PAN PAN…“; Router/LLM entscheidet die Transition.
        </div>
      </v-card-text>
    </v-card>

    <!-- Next candidates -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center ga-3">
        <v-icon>mdi-arrow-right-bold</v-icon>
        Nächste States (LLM-Ziele)
      </v-card-title>
      <v-card-text>
        <v-chip-group>
          <v-chip
              v-for="nid in nextCandidates"
              :key="nid"
              class="ma-1"
              color="primary"
              variant="text"
              @click="forceMove(nid)"
          >
            {{ nid }}
          </v-chip>
        </v-chip-group>
      </v-card-text>
    </v-card>

    <!-- Log -->
    <v-card>
      <v-card-title class="d-flex align-center ga-3">
        <v-icon>mdi-format-list-bulleted</v-icon>
        Log
      </v-card-title>
      <v-card-text>
        <v-list density="compact">
          <v-list-item
              v-for="(entry, idx) in log"
              :key="idx"
              :title="formatLogTitle(entry)"
              :subtitle="entry.normalized"
          >
            <template #prepend>
              <v-avatar size="20" :color="entry.speaker==='pilot' ? 'blue' : entry.speaker==='atc' ? 'green' : 'grey'"></v-avatar>
            </template>
            <template #append>
              <v-chip size="x-small" variant="text">{{ entry.state }}</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">

import useCommunicationsEngine from "../../shared/utils/communicationsEngine";

const engine = useCommunicationsEngine()
const currentState = computed(() => engine.currentState.value)
const nextCandidates = computed(() => engine.nextCandidates.value)
const activeFrequency = computed(() => engine.activeFrequency.value)
const log = computed(() => engine.communicationLog.value)
const vars = computed(() => engine.variables.value as any)
const flags = computed(() => engine.flags.value as any)

// VATSIM
const route = useRoute()
const vatsimId = ref<string>((route.query.vatsimId as string) || '1857215')
const loading = ref(false)
const dataFeed = ref<any>(null)
const memberPlans = ref<any[]>([])
const selectedPlan = ref<any | null>(null)
const feedUpdatedAt = computed(() => dataFeed.value?.general?.update_timestamp?.replace('Z','Z') || '—')

// Live ATC freqs aus DataFeed ableiten (Departure ICAO)
const liveFreqs = computed(() => {
  const icao = vars.value?.dep
  if (!icao || !dataFeed.value?.controllers) return null
  const match = (prefix: string) =>
      dataFeed.value.controllers.find((c: any) => c.callsign?.startsWith(`${icao}_${prefix}`))?.frequency
  return {
    DEL: match('DEL'),
    GND: match('GND'),
    TWR: match('TWR'),
    DEP: match('DEP'),
    APP: match('APP'),
    CTR: match('CTR')
  }
})

// Pilot input
const pilotInput = ref('')

// Timers
let refreshTimer: number | undefined

// ---------- VATSIM API fetch ----------
async function fetchVatsimData() {
  dataFeed.value = await $fetch('https://data.vatsim.net/v3/vatsim-data.json', { method: 'GET' })
}
async function fetchMemberPlans() {
  memberPlans.value = await $fetch(`https://api.vatsim.net/v2/members/${vatsimId.value}/flightplans`, { method: 'GET' })
}

// Pick pilot from live data by callsign
function pickPilotFromFeedByCallsign(callsign?: string) {
  if (!callsign) return null
  return dataFeed.value?.pilots?.find((p: any) => p.callsign === callsign) || null
}

// Map VATSIM plan → Engine.init
function mapPlanToEngine(plan: any, pilotFromFeed?: any) {
  const fpl = {
    callsign: plan?.callsign || pilotFromFeed?.callsign || '',
    aircraft: plan?.aircraft || pilotFromFeed?.flight_plan?.aircraft || '',
    dep: plan?.dep || plan?.departure || pilotFromFeed?.flight_plan?.departure || '',
    arr: plan?.arr || plan?.arrival || pilotFromFeed?.flight_plan?.arrival || '',
    altitude: plan?.altitude || pilotFromFeed?.flight_plan?.altitude || '',
    route: plan?.route || pilotFromFeed?.flight_plan?.route || '',
    assignedsquawk: plan?.assignedsquawk || pilotFromFeed?.flight_plan?.assigned_transponder || ''
  }
  engine.initializeFlight(fpl)
}

// Init from APIs
async function initializeFromApis() {
  loading.value = true
  try {
    await Promise.all([fetchVatsimData(), fetchMemberPlans()])
    const latest = memberPlans.value?.[0] || null
    selectedPlan.value = latest
    const pilot = pickPilotFromFeedByCallsign(latest?.callsign)
    mapPlanToEngine(latest, pilot)
  } finally {
    loading.value = false
  }
}

// ---------- Pilot → LLM → Engine ----------
async function sendPilot() {
  const raw = pilotInput.value.trim()
  if (!raw) return
  engine.processPilotTransmission(raw)
  const ctx = engine.buildLLMContext(raw)
  pilotInput.value = ''
  try {
    const decision = await decideNextStateLLM(ctx)
    engine.applyLLMDecision(decision)
  } catch (e) {
    // Fallback: nichts tun, Log bleibt Pilot only
    console.error('LLM decision failed', e)
  }
}
function forceMove(nextId: string) {
  engine.moveTo(nextId)
}

// ---------- UX helpers ----------
function formatLogTitle(e: any) {
  const ts = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return `[${ts}] ${e.speaker.toUpperCase()} · ${e.message}`
}

// ---------- lifecycle ----------
onMounted(async () => {
  await initializeFromApis()
  // 5min Refresh lt. Docs
  refreshTimer = window.setInterval(fetchVatsimData, 5 * 60 * 1000)
})
onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
})

// React on Member change
watch(vatsimId, async (id, old) => {
  if (id && id !== old) await initializeFromApis()
})
</script>

<style scoped>
.v-list-item__subtitle {
  white-space: pre-wrap;
}
</style>
