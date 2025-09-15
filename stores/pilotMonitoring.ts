import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type {
    FlightPhaseDefinition,
    FlightPhaseId,
    FrequencyChannel,
    ProcedureAction,
} from '~/data/communications'
import { flightPhases, getDefaultFrequencyForPhase, getPhaseById } from '~/data/communications'
import type { ChecklistSection } from '~/data/checklists'
import { findChecklistByIcao } from '~/data/checklists'
import { formatFrequencyForSpeech } from '~/composables/radioSpeechNormalizer'

export interface FlightPlanTime {
    proposed?: string | null
    actual?: string | null
}

export interface AircraftFlightPlan {
    flight_rules?: 'I' | 'V' | 'Y' | 'Z'
    aircraft?: string
    departure?: string
    departure_time?: FlightPlanTime
    arrival?: string
    alternate?: string | null
    route?: string | null
    cruise_altitude?: string | null
    remarks?: string | null
}

export interface FlightPlan {
    id: number
    callsign: string
    created_at?: string
    updated_at?: string
    filed_at?: string
    aircraft_flight_plan: AircraftFlightPlan
}

export interface MetarReport {
    icao: string
    rawText: string
    fetchedAt: string
    error?: string
}

export type TransmissionActor = 'pilot' | 'atc' | 'system'

export interface TransmissionLog {
    id: string
    channel: FrequencyChannel | 'system'
    timestamp: string
    summary: string
    transcript?: string
    actor: TransmissionActor
    metadata?: Record<string, string>
}

export interface FrequencyState {
    active: string
    standby: string
}

function makeId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`
}

export const usePilotMonitoringStore = defineStore('pilotMonitoring', () => {
    const vatsimId = ref('')
    const flights = ref<FlightPlan[]>([])
    const isFetchingFlights = ref(false)
    const fetchError = ref<string | null>(null)

    const selectedFlightId = ref<number | null>(null)
    const metarLoading = ref(false)
    const metarReports = reactive<Record<'departure' | 'arrival' | 'alternate', MetarReport | null>>({
        departure: null,
        arrival: null,
        alternate: null,
    })

    const frequency = reactive<FrequencyState>({
        active: '118.500',
        standby: '121.900',
    })

    const microphoneStatus = ref<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
    const microphoneError = ref<string | null>(null)
    const mediaStream = ref<MediaStream | null>(null)

    const transmittingChannel = ref<FrequencyChannel | null>(null)
    const pendingTransmissionId = ref<string | null>(null)
    const transmissions = ref<TransmissionLog[]>([])

    const activePhaseId = ref<FlightPhaseId>('startup')
    const randomTaxi = ref(false)
    const radioCheckCompleted = ref(false)
    const radioCheckHistory = ref<string[]>([])

    const checklistVisibility = ref(false)

    const selectedFlight = computed(() =>
        flights.value.find((plan) => plan.id === selectedFlightId.value) ?? null,
    )

    const availablePhases = computed<FlightPhaseDefinition[]>(() => flightPhases)

    const activePhase = computed<FlightPhaseDefinition | undefined>(() =>
        availablePhases.value.find((phase) => phase.id === activePhaseId.value),
    )

    const activePhaseActions = computed<ProcedureAction[]>(() => activePhase.value?.actions ?? [])

    const isMicrophoneGranted = computed(() => microphoneStatus.value === 'granted')

    const aircraftIcao = computed(() => selectedFlight.value?.aircraft_flight_plan.aircraft ?? null)

    const applicableChecklists = computed<ChecklistSection[]>(() =>
        findChecklistByIcao(aircraftIcao.value),
    )

    const hasChecklist = computed(() => applicableChecklists.value.length > 0)

    function resetMetars() {
        metarReports.departure = null
        metarReports.arrival = null
        metarReports.alternate = null
    }

    function sanitizeFrequency(value: string): string {
        if (!value) {
            return ''
        }
        const trimmed = value.replace(/[^0-9.]/g, '')
        const [integer, decimal] = trimmed.split('.')
        const safeInteger = integer?.slice(0, 3) ?? ''
        const safeDecimal = decimal?.slice(0, 3) ?? ''
        return safeDecimal ? `${safeInteger}.${safeDecimal}` : safeInteger
    }

    function setFrequency(field: keyof FrequencyState, value: string) {
        frequency[field] = sanitizeFrequency(value)
    }

    function swapFrequencies() {
        const currentActive = frequency.active
        frequency.active = frequency.standby
        frequency.standby = currentActive
    }

    function applyPhaseFrequencyDefaults(phaseId: FlightPhaseId) {
        const atcFrequency = getDefaultFrequencyForPhase(phaseId, 'atc')
        if (atcFrequency?.value) {
            setFrequency('active', atcFrequency.value)
        }
        const standbyCandidate = getDefaultFrequencyForPhase(phaseId, 'atc')
        if (standbyCandidate?.value && standbyCandidate.value !== frequency.active) {
            setFrequency('standby', standbyCandidate.value)
        }
    }

    async function fetchFlightPlansForMember(memberId?: string) {
        const id = (memberId ?? vatsimId.value).trim()
        if (!id) {
            fetchError.value = 'Bitte VATSIM-ID eingeben.'
            return []
        }
        fetchError.value = null
        isFetchingFlights.value = true
        try {
            const response = await $fetch<{ data?: FlightPlan[]; flightplans?: FlightPlan[] }>(
                `https://api.vatsim.net/v2/members/${id}/flightplans`,
            )
            const list = response.data ?? response.flightplans ?? []
            flights.value = Array.isArray(list) ? list : []
            if (!flights.value.length) {
                fetchError.value = 'Kein Flightplan gefunden. Bitte sicherstellen, dass auf VATSIM vorgefiled wurde.'
            }
            return flights.value
        } catch (error) {
            console.error('Flightplan fetch failed', error)
            fetchError.value =
                error instanceof Error
                    ? error.message
                    : 'Unbekannter Fehler beim Laden der Flightplans.'
            return []
        } finally {
            isFetchingFlights.value = false
        }
    }

    async function selectFlight(planId: number) {
        if (selectedFlightId.value === planId) {
            return
        }
        selectedFlightId.value = planId
        activePhaseId.value = 'startup'
        radioCheckCompleted.value = false
        radioCheckHistory.value = []
        applyPhaseFrequencyDefaults('startup')
        await fetchMetarsForSelectedFlight()
    }

    function clearFlightSelection() {
        selectedFlightId.value = null
        resetMetars()
        transmissions.value = []
        activePhaseId.value = 'startup'
        radioCheckCompleted.value = false
        radioCheckHistory.value = []
    }

    async function fetchMetar(icao?: string | null): Promise<MetarReport | null> {
        if (!icao) {
            return null
        }
        const trimmed = icao.trim().toUpperCase()
        if (!trimmed) {
            return null
        }
        try {
            const raw = await $fetch<string>('https://metar.vatsim.net/metar.php', {
                query: { id: trimmed },
            })
            return {
                icao: trimmed,
                rawText: raw,
                fetchedAt: new Date().toISOString(),
            }
        } catch (error) {
            console.error('METAR fetch failed', error)
            return {
                icao: trimmed,
                rawText: '',
                fetchedAt: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unbekannter Fehler',
            }
        }
    }

    async function fetchMetarsForSelectedFlight() {
        const plan = selectedFlight.value
        if (!plan) {
            resetMetars()
            return
        }
        metarLoading.value = true
        try {
            const [dep, arr, alt] = await Promise.all([
                fetchMetar(plan.aircraft_flight_plan.departure),
                fetchMetar(plan.aircraft_flight_plan.arrival),
                fetchMetar(plan.aircraft_flight_plan.alternate),
            ])
            metarReports.departure = dep
            metarReports.arrival = arr
            metarReports.alternate = alt
        } finally {
            metarLoading.value = false
        }
    }

    async function requestMicrophoneAccess() {
        if (!process.client) {
            return false
        }
        if (microphoneStatus.value === 'granted' && mediaStream.value) {
            return true
        }
        microphoneStatus.value = 'requesting'
        microphoneError.value = null
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaStream.value = stream
            microphoneStatus.value = 'granted'
            return true
        } catch (error) {
            microphoneStatus.value = 'denied'
            microphoneError.value =
                error instanceof Error ? error.message : 'Zugriff auf Mikrofon verweigert.'
            return false
        }
    }

    function releaseMicrophone() {
        mediaStream.value?.getTracks().forEach((track) => track.stop())
        mediaStream.value = null
        microphoneStatus.value = 'idle'
    }

    function beginTransmission(channel: FrequencyChannel, summary = 'PTT aktiv') {
        const id = makeId('tx')
        pendingTransmissionId.value = id
        transmittingChannel.value = channel
        transmissions.value.unshift({
            id,
            channel,
            timestamp: new Date().toISOString(),
            summary,
            actor: 'pilot',
        })
        return id
    }

    function completeTransmission(payload?: {
        summary?: string
        transcript?: string
        actor?: TransmissionActor
        metadata?: Record<string, string>
    }) {
        if (!pendingTransmissionId.value) {
            transmittingChannel.value = null
            return
        }
        const entry = transmissions.value.find((item) => item.id === pendingTransmissionId.value)
        if (entry) {
            entry.summary = payload?.summary ?? entry.summary
            if (payload?.transcript) {
                entry.transcript = payload.transcript
            }
            if (payload?.actor) {
                entry.actor = payload.actor
            }
            entry.metadata = { ...entry.metadata, ...payload?.metadata }
        }
        pendingTransmissionId.value = null
        transmittingChannel.value = null
    }

    function logTransmission(entry: Omit<TransmissionLog, 'id' | 'timestamp'> & { timestamp?: string }) {
        transmissions.value.unshift({
            id: makeId('log'),
            timestamp: entry.timestamp ?? new Date().toISOString(),
            ...entry,
        })
    }

    function setPhase(phaseId: FlightPhaseId) {
        activePhaseId.value = phaseId
        applyPhaseFrequencyDefaults(phaseId)
        logTransmission({
            channel: 'system',
            summary: `Phase gewechselt zu ${getPhaseById(phaseId)?.title ?? phaseId}`,
            actor: 'system',
        })
    }

    function goToNextPhase() {
        const index = availablePhases.value.findIndex((phase) => phase.id === activePhaseId.value)
        if (index >= 0 && index < availablePhases.value.length - 1) {
            setPhase(availablePhases.value[index + 1].id)
        }
    }

    function goToPreviousPhase() {
        const index = availablePhases.value.findIndex((phase) => phase.id === activePhaseId.value)
        if (index > 0) {
            setPhase(availablePhases.value[index - 1].id)
        }
    }

    function markRadioCheckCompleted(transcript: string) {
        radioCheckCompleted.value = true
        radioCheckHistory.value.unshift(transcript)
        logTransmission({
            channel: 'atc',
            summary: 'Radio Check abgeschlossen',
            transcript,
            actor: 'pilot',
        })
    }

    function setRandomTaxi(value: boolean) {
        randomTaxi.value = value
    }

    function toggleChecklistVisibility(value?: boolean) {
        checklistVisibility.value = value ?? !checklistVisibility.value
    }

    const formattedActiveFrequency = computed(() => formatFrequencyForSpeech(frequency.active))

    return {
        vatsimId,
        flights,
        isFetchingFlights,
        fetchError,
        selectedFlightId,
        selectedFlight,
        metarReports,
        metarLoading,
        frequency,
        formattedActiveFrequency,
        microphoneStatus,
        microphoneError,
        isMicrophoneGranted,
        mediaStream,
        transmittingChannel,
        transmissions,
        activePhaseId,
        activePhase,
        activePhaseActions,
        availablePhases,
        randomTaxi,
        radioCheckCompleted,
        radioCheckHistory,
        applicableChecklists,
        hasChecklist,
        checklistVisibility,
        fetchFlightPlansForMember,
        selectFlight,
        clearFlightSelection,
        fetchMetarsForSelectedFlight,
        requestMicrophoneAccess,
        releaseMicrophone,
        beginTransmission,
        completeTransmission,
        logTransmission,
        setPhase,
        goToNextPhase,
        goToPreviousPhase,
        markRadioCheckCompleted,
        setFrequency,
        swapFrequencies,
        setRandomTaxi,
        toggleChecklistVisibility,
    }
})

