<template>
  <div class="pm-page min-h-screen bg-[var(--bg)] text-[var(--text)]" :data-theme="pmTheme">
    <!-- Session-start overlay: covers the (synchronous) taxi-route computation -->
    <div
        v-if="sessionStarting"
        class="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-[var(--bg)]/80 backdrop-blur"
        role="status"
        aria-live="polite"
    >
      <v-progress-circular indeterminate color="cyan" size="48" width="4" />
      <p class="text-sm text-white/80">{{ sessionStartingMessage }}</p>
    </div>

    <div v-if="currentScreen !== 'monitor'" class="pm-setup">
      <RadarBackdrop />
      <div class="pm-setup__inner mx-auto w-full max-w-[420px] px-4 pb-24 pt-6 sm:px-6">
        <FlightSourceStep
            v-if="currentScreen === 'login'"
            v-model:vatsim-id="vatsimId"
            :loading="loading"
            :error="error"
            @load-flight-plans="loadFlightPlans"
            @start-demo="startDemoFlight"
        />

        <FlightSelectStep
            v-else-if="currentScreen === 'flightselect'"
            :flight-plans="flightPlans"
            :loading="loading"
            :vatsim-id="vatsimId"
            @select-plan="plan => { selectedPlan = plan; currentScreen = 'scenario' }"
            @back="currentScreen = 'login'"
        />

        <ScenarioPickerStep
            v-else-if="currentScreen === 'scenario'"
            :chain-groups="CHAIN_GROUPS"
            :drill-scenarios="DRILL_SCENARIOS"
            :selected-plan="selectedPlan"
            :error="error"
            @launch="launchScenario"
            @back="currentScreen = flightPlans.length > 0 ? 'flightselect' : 'login'"
            @dismiss-error="error = ''"
        />

        <SessionCompleteStep
            v-else-if="currentScreen === 'complete'"
            :completed-scenario="completedScenario"
            :selected-plan="selectedPlan"
            :opposite-scenario="oppositeScenario"
            @fly-again="flyAgain"
            @try-opposite="launchScenario"
            @back-to-scenarios="currentScreen = 'scenario'"
        />
      </div>
    </div>

    <!-- Main Monitoring Screen (full app shell) -->
    <CockpitShell
        v-else
        :flight-context="flightContext"
        :flags="flags"
        :bridge-connected="bridgeConnected"
        :bridge-sim-active-freq="bridgeSimActiveFreq"
        :bug-report-capturing="bugReportCapturing"
        :help-lang="helpLang"
        :frequencies="frequencies"
        :channels="displayAirportFrequencies"
        :preset-options="presetOptions"
        :readability-options="readabilityOptions"
        :signal-strength="signalStrength"
        :swap-animation="swapAnimation"
        :airport-name="airportName"
        :learning-mode="learningMode"
        :controller-say="displayControllerSay"
        :expected-phrase="displayExpectedPhrase"
        :is-recording="isRecording"
        :mic-permission="micPermission"
        :bridge-ptt-connected="bridgePttConnected"
        :backend-expected-phrase="backendExpectedPhrase"
        :last-transmission="lastTransmission"
        :last-transmission-faulty="lastTransmissionFaulty"
        :last-transmission-fault-note="lastTransmissionFaultNote"
        :log="log"
        :readback-report="lastReadbackReport"
        :readback-transcript="lastReadbackTranscript"
        v-model:manual-freq-active="manualFreqActive"
        v-model:manual-freq-standby="manualFreqStandby"
        v-model:show-radio-pronunciation="showRadioPronunciation"
        v-model:pilot-input="pilotInput"
        v-model:input-mode="inputMode"
        @open-flight-sheet="showFlightSheet = true"
        @open-bug-report="openBugReport"
        @open-settings="showSettingsSheet = true"
        @open-help="openHelp"
        @swap="swapFrequencies"
        @select-active="onPresetSelectActive"
        @select-standby="onPresetSelectStandby"
        @select-channel="setStandbyFrequencyFromList"
        @select-readability="onReadabilitySelect"
        @apply-manual="(target, close) => applyManualFrequency(target, close)"
        @ptt-start="startRecording(false)"
        @ptt-stop="stopRecording"
        @request-mic="requestMicAccess"
        @send-text="sendPilotText"
        @flag-issue="startTransmissionIssueFlow"
        @clear-transmission="clearLastTransmission"
        @clear-log="clearLog"
    >
      <template #overlays>
        <DebugPanel
            v-if="debugMode"
            :engine="engine"
            :session-label="sessionLabel"
            :set-last-transmission="setLastTransmission"
            :clear-log="clearLog"
            :start-demo-flight="startDemoFlight"
        />

        <FlightInfoSheet
            v-model="showFlightSheet"
            :flight-context="flightContext"
            :flags="flags"
            :vars="vars"
            :log-length="log.length"
            :theme="pmTheme"
            @back-to-setup="backToSetup"
        />

        <SettingsSheet
            v-model="showSettingsSheet"
            :theme="pmTheme"
            :theme-preference="pmThemePreference"
            :speech-speed-label="speechSpeedLabel"
            v-model:speech-speed="speechSpeed"
            v-model:radio-effects-enabled="radioEffectsEnabled"
            v-model:readback-enabled="readbackEnabled"
            v-model:learning-mode="learningMode"
            v-model:debug-mode="debugMode"
            v-model:prerec-enabled="prerecEnabled"
            v-model:prerec-seconds="prerecSeconds"
            v-model:ai-traffic-enabled="aiTrafficEnabled"
            @set-theme="setPmTheme"
        />

        <BugReportDialog :bug="bugReport" :theme="pmTheme" />

        <TransmissionIssueDialog
            v-model="showTransmissionIssueDialog"
            v-model:note="transmissionIssueNote"
            :faulty="lastTransmissionFaulty"
            :theme="pmTheme"
            @confirm="confirmTransmissionIssue"
            @remove="removeTransmissionIssue"
            @cancel="cancelTransmissionIssue"
        />

        <!-- Help / how-it-works overlay (first-run + reopenable via the ? button) -->
        <HelpDialog
            v-model="showHelp"
            :lang="helpLang"
            :theme="pmTheme"
            @dismiss="dismissHelp"
            @toggle-lang="toggleHelpLang"
        />
      </template>
    </CockpitShell>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import useCommunicationsEngine from "../../shared/utils/communicationsEngine";
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { usePmTheme } from '~/composables/usePmTheme'
import { normalizeManualFreq } from '../../shared/utils/frequency'
import { useFrequencyPresets } from '~/composables/useFrequencyPresets'
import CockpitShell from '~/components/live-atc/cockpit/CockpitShell.vue'
import { useAtisPlayback } from '~/composables/useAtisPlayback'
import { usePttRecording } from '~/composables/usePttRecording'
import { useBugReport } from '~/composables/useBugReport'
import { useSimBridgeSync } from '~/composables/useSimBridgeSync'
import FlightInfoSheet from '~/components/live-atc/cockpit/FlightInfoSheet.vue'
import SettingsSheet from '~/components/live-atc/cockpit/SettingsSheet.vue'
import BugReportDialog from '~/components/live-atc/cockpit/BugReportDialog.vue'
import TransmissionIssueDialog from '~/components/live-atc/cockpit/TransmissionIssueDialog.vue'
import HelpDialog from '~/components/live-atc/cockpit/HelpDialog.vue'
import DebugPanel from '~/components/live-atc/cockpit/DebugPanel.vue'
import { CHAIN_GROUPS, DRILL_SCENARIOS } from '../../shared/constants/scenarios'
import FlightSourceStep from '~/components/live-atc/FlightSourceStep.vue'
import FlightSelectStep from '~/components/live-atc/FlightSelectStep.vue'
import ScenarioPickerStep from '~/components/live-atc/ScenarioPickerStep.vue'
import SessionCompleteStep from '~/components/live-atc/SessionCompleteStep.vue'
import { useAiTraffic } from '~/composables/useAiTraffic'
import { useLiveAtcSession } from '~/composables/useLiveAtcSession'
import { useSessionState } from '~/composables/useSessionState'
import { useSpeechInterrupt } from '~/composables/useSpeechInterrupt'
import { useRadioSpeech } from '~/composables/useRadioSpeech'

// Core State
const engine = useCommunicationsEngine()
const auth = useAuthStore()
const api = useApi()
const { effectiveTheme: pmTheme, preference: pmThemePreference, setPreference: setPmTheme } = usePmTheme()
const router = useRouter()
const route = useRoute()
const radioBackend = useRadioBackend()
const config = useRuntimeConfig()

const STORAGE_KEYS = {
  selectedPlan: 'pm_selected_plan',
  vatsimId: 'pm_vatsim_id',
  prerecEnabled: 'pm_prerec_enabled',
  prerecSeconds: 'pm_prerec_seconds',
  aiTrafficEnabled: 'pm_ai_traffic_enabled',
  helpSeen: 'pm_help_seen',
  helpLang: 'pm_help_lang',
} as const

const showHelp = ref(false)
const helpLang = ref<'de' | 'en'>('de')
const openHelp = () => { showHelp.value = true }
const dismissHelp = () => {
  showHelp.value = false
  try { window.localStorage.setItem(STORAGE_KEYS.helpSeen, '1') } catch { /* ignore */ }
}
const toggleHelpLang = () => {
  helpLang.value = helpLang.value === 'de' ? 'en' : 'de'
  try { window.localStorage.setItem(STORAGE_KEYS.helpLang, helpLang.value) } catch { /* ignore */ }
}
/** Open the help overlay automatically the first time a session is entered. */
const maybeShowFirstRunHelp = () => {
  if (typeof window === 'undefined') return
  try {
    const lang = window.localStorage.getItem(STORAGE_KEYS.helpLang)
    if (lang === 'de' || lang === 'en') helpLang.value = lang
    if (!window.localStorage.getItem(STORAGE_KEYS.helpSeen)) showHelp.value = true
  } catch { /* ignore */ }
}

let restoringFromStorage = true

const persistSelectedPlan = (plan: any | null) => {
  if (typeof window === 'undefined') return

  try {
    if (plan) {
      window.localStorage.setItem(STORAGE_KEYS.selectedPlan, JSON.stringify(plan))
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.selectedPlan)
    }
  } catch (err) {
    console.warn('Failed to persist flight selection', err)
  }
}

const {
  currentState,
  activeFrequency,
  communicationLog: log,
  variables: vars,
  flags,
  flightContext,
  availableFlows,
  fetchRuntimeTree,
  moveTo: forceMove,
} = engine

const state = useSessionState(engine)
const {
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
  startTransmissionIssueFlow,
  confirmTransmissionIssue,
  removeTransmissionIssue,
  cancelTransmissionIssue,
  clearLog,
  sessionLabel,
} = state

// UI State
const signalStrength = ref(5)
const speechSpeed = ref(0.95)
const radioCheckLoading = ref(false)
const radioEffectsEnabled = ref(true)
const readbackEnabled = ref(false)
// Simulated background traffic. Off by default: it costs TTS per lively minute,
// so it stays an opt-in the user turns on once they want the busier frequency.
const aiTrafficEnabled = ref(false)

// ── Bug Report ───────────────────────────────────────────────────────────────
// Owned here rather than by the dialog: the HUD button starts the screenshot
// capture before the dialog ever renders. The dialog gets the whole handle.
const bugReport = useBugReport(engine, { activeScenario })
const { bugReportCapturing, openBugReport } = bugReport

// Layout / view state. The tab, HUD menu and mode-switch state live inside
// CockpitShell; `inputMode` stays here because a watcher below drives the
// pre-recording buffer off it.
const inputMode = ref<'voice' | 'text'>('voice')
const learningMode = ref(true)

// Overlays / sheets opened from HUD controls
const showFlightSheet = ref(false)
const showSettingsSheet = ref(false)

/** The one gate for developer tooling: DebugPanel is not mounted while this is off. */
const debugMode = ref(true)

// Send unauthenticated visitors to login while preserving where they were
// headed (e.g. /live-atc?token=… so the bridge link survives the round-trip),
// instead of dropping them on the classroom fallback after sign-in.
const redirectToLogin = () => {
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

onMounted(async () => {
  try {
    if (!auth.accessToken) {
      const refreshed = await auth.tryRefresh()
      if (!refreshed) {
        redirectToLogin()
        return
      }
    }

    if (!auth.user) {
      await auth.fetchUser().catch((err) => {
        console.error('Session initialisation failed', err)
        redirectToLogin()
      })
    }

    try {
      await fetchRuntimeTree('icao_atc_decision_tree', config.public.radioBackendUrl as string)
    } catch (err) {
      console.error('Failed to load decision tree from Python backend', err)
      error.value = 'Decision engine konnte nicht initialisiert werden.'
      return
    }

    if (typeof window !== 'undefined') {
      const storedVatsimId = window.localStorage.getItem(STORAGE_KEYS.vatsimId)
      if (storedVatsimId) {
        vatsimId.value = storedVatsimId
      }

      const storedPrerecEnabled = window.localStorage.getItem(STORAGE_KEYS.prerecEnabled)
      if (storedPrerecEnabled !== null) {
        prerecEnabled.value = storedPrerecEnabled === '1'
      }
      const storedAiTraffic = window.localStorage.getItem(STORAGE_KEYS.aiTrafficEnabled)
      if (storedAiTraffic !== null) {
        aiTrafficEnabled.value = storedAiTraffic === '1'
      }

      const storedPrerecSeconds = window.localStorage.getItem(STORAGE_KEYS.prerecSeconds)
      if (storedPrerecSeconds !== null) {
        const parsed = Number.parseFloat(storedPrerecSeconds)
        if (Number.isFinite(parsed) && parsed >= 0.2 && parsed <= 3) {
          prerecSeconds.value = parsed
        }
      }

      const storedPlanRaw = window.localStorage.getItem(STORAGE_KEYS.selectedPlan)
      if (storedPlanRaw) {
        try {
          const parsedPlan = JSON.parse(storedPlanRaw)
          selectedPlan.value = parsedPlan
          currentScreen.value = 'scenario'
        } catch (err) {
          console.warn('Failed to restore stored flight plan', err)
          window.localStorage.removeItem(STORAGE_KEYS.selectedPlan)
        }
      }
    }

    // Restore state from bug report (admin link: /live-atc?restoreBugReport=<id>)
    const restoreId = route.query.restoreBugReport as string | undefined
    if (restoreId) {
      await restoreBugReportState(restoreId)
    }
  } finally {
    restoringFromStorage = false
  }
})

watch(
  () => auth.accessToken,
  (token) => {
    if (!token) {
      persistSelectedPlan(null)
      redirectToLogin()
    }
  }
)

watch(vatsimId, (id) => {
  if (restoringFromStorage || typeof window === 'undefined') {
    return
  }

  const trimmed = id.trim()
  if (trimmed) {
    window.localStorage.setItem(STORAGE_KEYS.vatsimId, trimmed)
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.vatsimId)
  }
})

// Computed Properties

const speechInterrupt = useSpeechInterrupt()
const { stopCurrentSpeech } = speechInterrupt

const freq = useFrequencyPresets(engine, stopCurrentSpeech)
const {
  frequencies,
  airportName,
  activeAirportIcao,
  displayAirportFrequencies,
  swapAnimation,
  manualFreqActive,
  manualFreqStandby,
  setStandbyFrequencyFromList,
  swapFrequencies,
  presetOptions,
  onPresetSelectActive,
  onPresetSelectStandby,
  applyManualFrequency,
} = freq

const {
  atisPlaybackLoading,
  atisLoopKey,
  cancelAirportDataRefresh,
  stopAtisLoop,
  playAtisBroadcast,
  prefetchAtisAudio,
} = useAtisPlayback(engine, freq, currentScreen, signalStrength, setLastTransmission)

// useLiveAtcSession is constructed last — it calls into speech, PTT and the
// bridge. Those three in turn need to call back into it, so they get these thin
// closures instead: they resolve `session` at call time, not at setup time.
const handlePilotTransmission = (message: string, source: 'text' | 'ptt' = 'text') =>
  session.handlePilotTransmission(message, source)
const applyBackendDecision = (
  response: import('~/composables/useRadioBackend').RadioTransmitResponse,
) => session.applyBackendDecision(response)
const handleSimControlResult = (
  result: import('../../shared/utils/simControl').SimControlCommandResult,
) => session.handleSimControlResult(result)
// Named distinctly from the `transmitInFlight` destructured from `session` below
// (used for AI-traffic gating) — same underlying ref, just needed earlier here
// for useSimBridgeSync, which is constructed before `session` exists.
const bridgeSyncTransmitInFlight = computed(() => session.transmitInFlight.value)

const speech = useRadioSpeech(engine, freq, speechInterrupt, {
  setLastTransmission,
  handlePilotTransmission,
  lastControllerSay,
  lastControllerSpeechAtMs,
  signalStrength,
  speechSpeed,
  radioCheckLoading,
  radioEffectsEnabled,
  readbackEnabled,
})
const {
  speechSpeedLabel,
  speakWithRadioEffects,
  performRadioCheck,
  readabilityOptions,
  onReadabilitySelect,
} = speech

const {
  isRecording,
  micPermission,
  prerecEnabled,
  prerecSeconds,
  requestMicAccess,
  stopPrerecCapture,
  startPrerecCapture,
  restartPrerecCaptureIfActive,
  resumePrerecIfSuspended,
  startRecording,
  stopRecording,
} = usePttRecording(engine, {
  stopCurrentSpeech,
  speakWithRadioEffects,
  radioEffectsEnabled,
  inputMode,
  backendSessionId,
  backendExpectedPhrase,
  setLastTransmission,
  handlePilotTransmission,
})

// Lifecycle
onMounted(async () => {
  await requestMicAccess()
})

// Watch for frequency changes from engine
watch(() => activeFrequency.value, (newFreq) => {
  if (newFreq && newFreq !== frequencies.value.active) {
    frequencies.value.active = newFreq
  }
})

// Pre-recording: manage continuous mic capture lifecycle
watch([inputMode, micPermission, prerecEnabled], ([mode, mic, enabled]) => {
  if (mode === 'voice' && mic && enabled) {
    void startPrerecCapture()
  } else {
    stopPrerecCapture()
  }
}, { immediate: true })

watch(prerecSeconds, (val) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEYS.prerecSeconds, String(val))
  }
  restartPrerecCaptureIfActive()
})

watch(prerecEnabled, (val) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEYS.prerecEnabled, val ? '1' : '0')
  }
})

watch(aiTrafficEnabled, (val) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEYS.aiTrafficEnabled, val ? '1' : '0')
  }
})

const {
  bridgeToken,
  bridgeConnected,
  bridgeSimActiveFreq,
  bridgePosition,
  bridgePttConnected,
} = useSimBridgeSync(freq, {
  backendSessionId,
  radioBackend,
  applyBackendDecision,
  stopCurrentSpeech,
  resumePrerecIfSuspended,
  startRecording,
  stopRecording,
  onCommandResult: handleSimControlResult,
  transmitInFlight: bridgeSyncTransmitInFlight,
})

const session = useLiveAtcSession(engine, {
  state,
  freq,
  speech,
  radioBackend,
  api,
  config,
  prefetchAtisAudio,
  isRecording,
  bridgeConnected,
  bridgePosition,
  bridgeToken,
  persistSelectedPlan,
  maybeShowFirstRunHelp,
})
const {
  transmitInFlight,
  loadFlightPlans,
  startMonitoring,
  startDemoFlight,
  launchScenario,
  flyAgain,
  backToSetup,
  sendPilotText,
  restoreBugReportState,
} = session

// Simulated background traffic. A pure observer alongside the engine and the
// session — it reads state and writes only to the speech queue and the log, and
// never touches radioBackend. Constructed after `session` because it needs that
// composable's transmitInFlight for its gating chain.
const aiTraffic = useAiTraffic(engine, {
  aiTrafficEnabled,
  isRecording,
  transmitInFlight,
  backendSessionId,
  backendExpectedPhrase,
  lastControllerSpeechAtMs,
  currentScreen,
  freq,
  speech,
})

// The single owner of the traffic lifecycle: it runs exactly while the toggle is
// on, a backend session exists and we're on the monitor screen. Every entry and
// exit the design lists — startMonitoring() succeeding, session_complete,
// backToSetup, toggling mid-session — moves one of these three, so they need no
// separate hooks. Toggling back on rebuilds from a fresh spawn-up.
watch(
  [backendSessionId, currentScreen, aiTrafficEnabled],
  ([sessionId, screen, enabled]) => {
    if (enabled && sessionId && screen === 'monitor') {
      aiTraffic.start(sessionId, activeAirportIcao.value)
    } else {
      aiTraffic.stop()
    }
  },
)

onUnmounted(() => {
  stopAtisLoop()
  stopPrerecCapture()
  cancelAirportDataRefresh()
  aiTraffic.stop()
})
</script>

<style scoped>
/* ---------------------------------------------------------------------------
   Light theme — re-tint the handful of Tailwind white/black opacity utilities
   used throughout this page (and its child components: CommLog, HoldSelect,
   teleported Vuetify menus/dialogs) rather than touching every occurrence
   individually. :global() is required here — <style scoped> would otherwise
   only reach markup owned directly by this SFC, missing child components and
   anything Vuetify teleports to <body>. [data-theme="light"] is mirrored onto
   <html> by usePmTheme so it matches regardless of where the node landed in
   the DOM. Secondary/decorative surfaces (chips, gradients) are left as-is;
   they still read fine on the light background.
   --------------------------------------------------------------------------- */
/* .text-white (no opacity suffix) collides with Vuetify's own !important
   utility of the same name (node_modules/vuetify/lib/styles/main.css) — match
   its specificity or the forced white would always win over ours. */
:global([data-theme="light"] .text-white) {
  color: #0f1420 !important;
}
:global([data-theme="light"] .text-white\/90),
:global([data-theme="light"] .text-white\/85),
:global([data-theme="light"] .text-white\/80) {
  color: #0f1420;
}

:global([data-theme="light"] .text-white\/70),
:global([data-theme="light"] .text-white\/65),
:global([data-theme="light"] .text-white\/60) {
  color: rgba(15, 20, 32, 0.75);
}

:global([data-theme="light"] .text-white\/55),
:global([data-theme="light"] .text-white\/50),
:global([data-theme="light"] .text-white\/45),
:global([data-theme="light"] .text-white\/40) {
  color: rgba(15, 20, 32, 0.55);
}

:global([data-theme="light"] .text-white\/35),
:global([data-theme="light"] .text-white\/30) {
  color: rgba(15, 20, 32, 0.38);
}

:global([data-theme="light"] .border-white\/10),
:global([data-theme="light"] .border-white\/5) {
  border-color: rgba(15, 20, 32, 0.14);
}

:global([data-theme="light"] .bg-white\/5) {
  background-color: rgba(15, 20, 32, 0.035);
}

:global([data-theme="light"] .bg-black\/30),
:global([data-theme="light"] .bg-black\/40),
:global([data-theme="light"] .bg-black\/55) {
  background-color: rgba(15, 20, 32, 0.05);
}

:global([data-theme="light"] .ring-white\/5) {
  --tw-ring-color: rgba(15, 20, 32, 0.08);
}

/* Setup screens sit above the shared radar backdrop. */
.pm-setup {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
}
.pm-setup__inner {
  position: relative;
  z-index: 1;
}

</style>
