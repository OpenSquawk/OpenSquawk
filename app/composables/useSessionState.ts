import { computed, ref, watch } from 'vue'
import { normalizeRadioPhrase, DEFAULT_AIRLINE_TELEPHONY } from '../../shared/utils/radioSpeech'
import useCommunicationsEngine from '../../shared/utils/communicationsEngine'
import type { ReadbackFieldDetail } from '~/composables/useRadioBackend'
import { SCENARIOS, type Scenario } from '../../shared/constants/scenarios'

/**
 * Reactive state of one /live-atc session: which screen we're on, the backend
 * session identity, and the "last transmission" strip with its fault-reporting
 * dialog.
 *
 * Split out from useLiveAtcSession (the controller) because almost every other
 * composable needs some of this — useAtisPlayback wants currentScreen,
 * usePttRecording wants backendSessionId, useRadioSpeech wants
 * setLastTransmission — while the controller itself needs those composables to
 * exist first. State is constructed first, the controller last.
 */
export function useSessionState(engine: ReturnType<typeof useCommunicationsEngine>) {
  const { clearCommunicationLog, sessionId: engineSessionId, flags } = engine

  const currentScreen = ref<'login' | 'flightselect' | 'scenario' | 'monitor' | 'complete'>('login')
  const loading = ref(false)
  const error = ref('')
  const pilotInput = ref('')

  // VATSIM flight selection
  const vatsimId = ref('1857215')
  const flightPlans = ref<any[]>([])
  const selectedPlan = ref<any>(null)

  /** The scenario the user just finished (used on the completion screen). */
  const completedScenario = ref<Scenario | null>(null)
  /** The scenario currently being flown. */
  const activeScenario = ref<Scenario | null>(null)

  const oppositeScenario = computed<Scenario | null>(() => {
    if (!completedScenario.value) return null
    if (completedScenario.value.id === 'ifr-departure')
      return SCENARIOS.find(s => s.id === 'vfr-arrival') ?? null
    if (completedScenario.value.id === 'vfr-arrival')
      return SCENARIOS.find(s => s.id === 'ifr-departure') ?? null
    return null
  })

  // Overlay shown while a session is being created. For taxi flows the backend
  // computes a real OSM taxi route synchronously, so the create call can take a
  // few seconds — the spinner tells the user that work is happening.
  const sessionStarting = ref(false)
  const sessionStartingMessage = ref('Starting session…')

  const backendSessionId = ref<string | null>(null)
  // Last ATC utterance returned by the backend (pre-rendered, correct variables).
  const lastControllerSay = ref<string | null>(null)
  // When that utterance was scheduled — opens the readback window during which
  // simulated background traffic must stay silent (useAiTraffic's gating chain).
  const lastControllerSpeechAtMs = ref<number | null>(null)
  // Authoritative expected pilot phrase from the backend — replaces local engine rendering.
  const backendExpectedPhrase = ref<string | null>(null)
  // Per-field readback diagnostic from the last transmission (STT debug panel).
  const lastReadbackReport = ref<ReadbackFieldDetail[]>([])
  const lastReadbackTranscript = ref<string>('')
  // Toggle: show radio pronunciation (wun, tree, squawk niner…) vs plain text.
  const showRadioPronunciation = ref(false)

  function toRadioSpeech(text: string): string {
    return normalizeRadioPhrase(text, {
      expandCallsigns: true,
      expandAirports: true,
      airlineMap: DEFAULT_AIRLINE_TELEPHONY,
      sidSuffixIcao: true,
    })
  }

  // Display helpers — apply ICAO phonetics when the toggle is on.
  const displayControllerSay = computed(() =>
    lastControllerSay.value
      ? (showRadioPronunciation.value ? toRadioSpeech(lastControllerSay.value) : lastControllerSay.value)
      : null,
  )
  const displayExpectedPhrase = computed(() =>
    backendExpectedPhrase.value
      ? (showRadioPronunciation.value ? toRadioSpeech(backendExpectedPhrase.value) : backendExpectedPhrase.value)
      : null,
  )

  const lastTransmission = ref('')
  const lastTransmissionFaulty = ref(false)
  const lastTransmissionFaultNote = ref('')
  const showTransmissionIssueDialog = ref(false)
  const transmissionIssueNote = ref('')

  function setLastTransmission(text: string) {
    lastTransmission.value = text
    lastTransmissionFaulty.value = false
    lastTransmissionFaultNote.value = ''
  }

  function clearLastTransmission() {
    setLastTransmission('')
  }

  function markLastTransmissionFault(note: string) {
    if (!lastTransmission.value) return
    lastTransmissionFaulty.value = true
    lastTransmissionFaultNote.value = note
  }

  function resetLastTransmissionFault() {
    lastTransmissionFaulty.value = false
    lastTransmissionFaultNote.value = ''
  }

  function startTransmissionIssueFlow() {
    if (!lastTransmission.value) return
    transmissionIssueNote.value = lastTransmissionFaultNote.value
    showTransmissionIssueDialog.value = true
  }

  function confirmTransmissionIssue() {
    if (!lastTransmission.value) {
      showTransmissionIssueDialog.value = false
      return
    }

    markLastTransmissionFault(transmissionIssueNote.value.trim())
    showTransmissionIssueDialog.value = false
  }

  function removeTransmissionIssue() {
    resetLastTransmissionFault()
    showTransmissionIssueDialog.value = false
  }

  function cancelTransmissionIssue() {
    showTransmissionIssueDialog.value = false
  }

  watch(showTransmissionIssueDialog, (open) => {
    if (!open) {
      transmissionIssueNote.value = ''
    }
  })

  const clearLog = () => {
    clearCommunicationLog()
    clearLastTransmission()
  }

  const sessionLabel = computed(() => engineSessionId.value || flags.value.session_id || '-')

  return {
    currentScreen,
    loading,
    error,
    pilotInput,
    vatsimId,
    flightPlans,
    selectedPlan,
    completedScenario,
    activeScenario,
    oppositeScenario,
    sessionStarting,
    sessionStartingMessage,
    backendSessionId,
    lastControllerSay,
    lastControllerSpeechAtMs,
    backendExpectedPhrase,
    lastReadbackReport,
    lastReadbackTranscript,
    showRadioPronunciation,
    displayControllerSay,
    displayExpectedPhrase,
    lastTransmission,
    lastTransmissionFaulty,
    lastTransmissionFaultNote,
    showTransmissionIssueDialog,
    transmissionIssueNote,
    setLastTransmission,
    clearLastTransmission,
    resetLastTransmissionFault,
    startTransmissionIssueFlow,
    confirmTransmissionIssue,
    removeTransmissionIssue,
    cancelTransmissionIssue,
    clearLog,
    sessionLabel,
  }
}
