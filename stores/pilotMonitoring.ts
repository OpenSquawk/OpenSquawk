import {computed, reactive, ref, shallowRef} from 'vue'
import {defineStore} from 'pinia'

export type RadioMode = 'atc' | 'intercom'

export interface AirportInfo {
  icao: string
  name?: string
  runway?: string
  time?: string
}

export interface VatsimFlightPlan {
  id: number
  callsign: string
  aircraft?: string
  departure: AirportInfo
  arrival: AirportInfo
  alternate?: AirportInfo | null
  route?: string
  remarks?: string
  etd?: string
  eta?: string
  createdAt?: string
}

export interface MetarSnapshot {
  departure?: string
  arrival?: string
  alternate?: string
  fetchedAt?: string
}

export interface TransmissionLogEntry {
  id: string
  timestamp: number
  mode: RadioMode
  speaker: 'pilot' | 'atc' | 'system'
  text: string
  metadata?: Record<string, unknown>
}

const fallbackFlightPlans: VatsimFlightPlan[] = [
  {
    id: 1,
    callsign: 'DLH4AB',
    aircraft: 'A20N',
    departure: {icao: 'EDDF', name: 'Frankfurt/Main', runway: '25C'},
    arrival: {icao: 'LEPA', name: 'Palma de Mallorca', runway: '24L'},
    alternate: {icao: 'LEBL', name: 'Barcelona'},
    route: 'ANEKI UZ29 KOVAN UL975 BCN UN725 LOMAS',
    remarks: 'Training flight · Example fallback data',
    etd: '2025-09-15T17:00:00Z',
    eta: '2025-09-15T19:10:00Z',
    createdAt: '2025-09-15T16:10:00Z',
  },
  {
    id: 2,
    callsign: 'EZY82WP',
    aircraft: 'A319',
    departure: {icao: 'EGKK', name: 'London Gatwick', runway: '26L'},
    arrival: {icao: 'EDDF', name: 'Frankfurt/Main', runway: '07C'},
    alternate: {icao: 'EDDL', name: 'Düsseldorf'},
    route: 'LAM3M L9 DVR UL9 KONAN UY28 SPI L620 PSA',
    remarks: 'Fallback plan when API is unreachable',
    etd: '2025-09-15T18:25:00Z',
    eta: '2025-09-15T20:05:00Z',
    createdAt: '2025-09-15T17:40:00Z',
  },
]

function toAirportInfo(raw: any, fallbackIcao = ''): AirportInfo {
  if (!raw) {
    return {icao: fallbackIcao}
  }

  if (typeof raw === 'string') {
    return {icao: raw}
  }

  return {
    icao: raw.icao_code || raw.icao || raw.code || fallbackIcao,
    name: raw.name || raw.airport_name || raw.full_name,
    runway: raw.runway || raw.runway_name || raw.planned_runway,
    time: raw.time || raw.planned_time || raw.estimated_time,
  }
}

function mapFlightPlans(payload: any[]): VatsimFlightPlan[] {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload
    .map((entry, idx) => {
      const fp = entry.flight_plan || entry

      const departure = toAirportInfo(entry.departure || fp?.departure, fp?.departure)
      const arrival = toAirportInfo(entry.arrival || fp?.arrival, fp?.arrival)
      const alternate = entry.alternate || fp?.alternate

      return {
        id: Number(entry.id ?? fp?.id ?? idx + 1),
        callsign: String(entry.callsign || fp?.callsign || fp?.flight_number || 'UNKNOWN'),
        aircraft: fp?.aircraft || fp?.aircraft_faa || entry.aircraft,
        departure,
        arrival,
        alternate: alternate ? toAirportInfo(alternate) : null,
        route: fp?.route || entry.route,
        remarks: fp?.remarks || entry.remarks,
        etd: fp?.etd || entry.etd || entry.estimated_off_block_time,
        eta: fp?.eta || entry.eta,
        createdAt: entry.created_at || entry.submitted_at || fp?.created_at,
      }
    })
    .filter((plan) => Boolean(plan.departure.icao) && Boolean(plan.arrival.icao))
}

async function safeFetch(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(url, {signal: controller.signal})
    clearTimeout(timeout)
    if (!response.ok) {
      throw new Error(`${response.status}`)
    }
    return response
  } catch (error) {
    console.warn('[pilotMonitoring] fetch failed for', url, error)
    return null
  }
}

export const usePilotMonitoringStore = defineStore('pilotMonitoring', () => {
  const vatsimId = ref('')
  const flightPlans = ref<VatsimFlightPlan[]>([])
  const flightPlanLoading = ref(false)
  const flightPlanError = ref<string | null>(null)
  const selectedFlightId = ref<number | null>(null)

  const metar = reactive<MetarSnapshot>({})
  const lastMetarRefresh = ref<number | null>(null)

  const microphoneGranted = ref(false)
  const microphoneError = ref<string | null>(null)
  const microphoneStream = shallowRef<MediaStream | null>(null)
  const radioMode = ref<RadioMode>('atc')
  const activeFrequency = ref('118.500')
  const standbyFrequency = ref('121.800')
  const isTransmitting = ref(false)
  const radioCheckCompleted = ref(false)
  const taxiRandomness = ref(false)
  const currentPhaseId = ref('preflight')
  const completedSteps = ref<Set<string>>(new Set())
  const transmissions = ref<TransmissionLogEntry[]>([])
  const checklistProgress = ref<Record<string, boolean>>({})

  const selectedFlight = computed(() =>
    flightPlans.value.find((plan) => plan.id === selectedFlightId.value) || null,
  )

  const hasFlightPlan = computed(() => Boolean(selectedFlight.value))

  const canTransmit = computed(() => microphoneGranted.value && hasFlightPlan.value)

  function setVatsimId(id: string) {
    vatsimId.value = id.trim()
  }

  async function fetchFlightPlans(idOverride?: string) {
    const id = (idOverride ?? vatsimId.value).trim()
    if (!id) {
      flightPlans.value = []
      flightPlanError.value = 'Bitte VATSIM ID eingeben.'
      return
    }

    flightPlanLoading.value = true
    flightPlanError.value = null

    const endpoint = `https://api.vatsim.net/v2/members/${encodeURIComponent(id)}/flightplans`
    const response = await safeFetch(endpoint)

    if (!response) {
      flightPlans.value = fallbackFlightPlans
      flightPlanError.value =
        'Live-API momentan nicht erreichbar – zeige Beispiel-Flugpläne.'
      flightPlanLoading.value = false
      return
    }

    try {
      const data = await response.json()
      const mapped = mapFlightPlans(data)
      flightPlans.value = mapped.length ? mapped : fallbackFlightPlans
      if (!mapped.length) {
        flightPlanError.value =
          'Keine aktiven Flugpläne gefunden – zeige Beispiel-Flugpläne.'
      }
    } catch (error) {
      console.warn('[pilotMonitoring] Failed to parse flightplan payload', error)
      flightPlans.value = fallbackFlightPlans
      flightPlanError.value =
        'Antwort konnte nicht verarbeitet werden – zeige Beispiel-Flugpläne.'
    } finally {
      flightPlanLoading.value = false
    }
  }

  function selectFlight(planId: number) {
    selectedFlightId.value = planId
    radioCheckCompleted.value = false
    currentPhaseId.value = 'startup'
    completedSteps.value = new Set()
  }

  async function fetchMetarForFlight(plan?: VatsimFlightPlan | null) {
    const activePlan = plan ?? selectedFlight.value
    if (!activePlan) return

    const now = Date.now()
    if (lastMetarRefresh.value && now - lastMetarRefresh.value < 60_000) {
      return
    }

    const fetchers = [
      activePlan.departure.icao,
      activePlan.arrival.icao,
      activePlan.alternate?.icao,
    ].map((icao) => (icao ? fetchMetar(icao) : Promise.resolve('')))

    const [dep, arr, alt] = await Promise.all(fetchers)

    metar.departure = dep
    metar.arrival = arr
    metar.alternate = alt
    metar.fetchedAt = new Date().toISOString()
    lastMetarRefresh.value = now
  }

  async function fetchMetar(icao: string): Promise<string> {
    const url = `https://metar.vatsim.net/metar.php?id=${encodeURIComponent(icao)}`
    const response = await safeFetch(url)
    if (!response) {
      return `METAR ${icao}: n/a`
    }
    try {
      const text = await response.text()
      return text?.trim() || `METAR ${icao}: n/a`
    } catch (error) {
      console.warn('[pilotMonitoring] Failed to parse METAR', error)
      return `METAR ${icao}: n/a`
    }
  }

  async function requestMicrophone(): Promise<MediaStream | null> {
    if (microphoneGranted.value && microphoneStream.value) {
      return microphoneStream.value
    }

    if (typeof navigator === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      microphoneError.value = 'Mikrofonzugriff ist in diesem Browser nicht verfügbar.'
      return null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true})
      microphoneStream.value = stream
      microphoneGranted.value = true
      microphoneError.value = null
      return stream
    } catch (error: any) {
      microphoneError.value =
        error?.message || 'Zugriff auf das Mikrofon wurde verweigert.'
      microphoneGranted.value = false
      microphoneStream.value = null
      return null
    }
  }

  function releaseMicrophone() {
    microphoneStream.value?.getTracks().forEach((track) => track.stop())
    microphoneStream.value = null
    microphoneGranted.value = false
  }

  async function beginTransmit(mode: RadioMode) {
    radioMode.value = mode
    const stream = await requestMicrophone()
    if (!stream) return
    isTransmitting.value = true
  }

  function endTransmit() {
    isTransmitting.value = false
  }

  function logTransmission(entry: Omit<TransmissionLogEntry, 'id' | 'timestamp'>) {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    transmissions.value.unshift({
      id,
      timestamp: Date.now(),
      ...entry,
    })
    if (transmissions.value.length > 60) {
      transmissions.value.length = 60
    }
  }

  function setFrequencies(active: string, standby: string) {
    activeFrequency.value = active
    standbyFrequency.value = standby
  }

  function swapFrequencies() {
    const nextActive = standbyFrequency.value
    standbyFrequency.value = activeFrequency.value
    activeFrequency.value = nextActive
  }

  function setTaxiRandomness(enabled: boolean) {
    taxiRandomness.value = enabled
  }

  function setPhase(phaseId: string) {
    currentPhaseId.value = phaseId
  }

  function completeStep(stepId: string) {
    completedSteps.value = new Set([...completedSteps.value, stepId])
  }

  function resetPhaseProgress() {
    completedSteps.value = new Set()
  }

  function setChecklistItem(itemId: string, value: boolean) {
    checklistProgress.value = {
      ...checklistProgress.value,
      [itemId]: value,
    }
  }

  function markRadioCheckDone() {
    radioCheckCompleted.value = true
  }

  return {
    vatsimId,
    flightPlans,
    flightPlanError,
    flightPlanLoading,
    selectedFlightId,
    selectedFlight,
    hasFlightPlan,
    microphoneGranted,
    microphoneError,
    radioMode,
    activeFrequency,
    standbyFrequency,
    isTransmitting,
    radioCheckCompleted,
    taxiRandomness,
    currentPhaseId,
    completedSteps,
    transmissions,
    checklistProgress,
    metar,
    canTransmit,
    setVatsimId,
    fetchFlightPlans,
    selectFlight,
    fetchMetarForFlight,
    requestMicrophone,
    releaseMicrophone,
    beginTransmit,
    endTransmit,
    logTransmission,
    setFrequencies,
    swapFrequencies,
    setTaxiRandomness,
    setPhase,
    completeStep,
    resetPhaseProgress,
    setChecklistItem,
    markRadioCheckDone,
  }
})
