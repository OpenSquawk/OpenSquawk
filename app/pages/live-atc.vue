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
    <section v-else class="pm-shell learn-theme">
      <!-- Persistent top bar (HUD): brand + freq controls + actions -->
      <header class="hud" role="banner">
        <nav class="hud-inner" aria-label="Global">
          <div class="hud-left">
            <NuxtLink class="hud-logo" to="/bridge" title="Back to bridge">
              <v-icon size="22" class="hud-logo-icon">mdi-radar</v-icon>
            </NuxtLink>
            <div class="hud-divider" aria-hidden="true"></div>
            <span class="brand">OpenSquawk</span>
            <v-menu v-model="experienceMenu" :offset="[0, 8]" location="bottom start" transition="scale-transition">
              <template #activator="{ props }">
                <button
                    class="mode-switch"
                    type="button"
                    v-bind="props"
                    aria-haspopup="menu"
                    :aria-expanded="experienceMenu ? 'true' : 'false'"
                >
                  <span class="mode-switch-label">Live ATC</span>
                  <v-icon size="16" class="mode-switch-icon">mdi-chevron-down</v-icon>
                </button>
              </template>
              <div class="experience-menu" role="menu" aria-label="Select experience">
                <NuxtLink
                    to="/classroom"
                    role="menuitemradio"
                    class="experience-option"
                    aria-checked="false"
                >
                  <v-icon size="18" class="experience-option-icon">mdi-school</v-icon>
                  <div class="experience-option-body">
                    <div class="experience-option-title">Classroom</div>
                    <div class="experience-option-sub">Mission hub & drills</div>
                  </div>
                </NuxtLink>
                <div
                    role="menuitemradio"
                    class="experience-option is-active"
                    aria-checked="true"
                >
                  <v-icon size="18" class="experience-option-icon">mdi-radio-handheld</v-icon>
                  <div class="experience-option-body">
                    <div class="experience-option-title">Live ATC</div>
                    <div class="experience-option-sub">Live radio with AI controllers</div>
                  </div>
                  <v-icon size="16" class="experience-option-check">mdi-check</v-icon>
                </div>
              </div>
            </v-menu>

            <div class="hud-context-group" aria-label="Flight context">
              <button
                  type="button"
                  class="hud-context-btn"
                  title="Edit flight"
                  @click="showFlightSheet = true"
              >
                <span class="hud-context-callsign">{{ flightContext.callsign || 'N/A' }}</span>
                <span class="hud-context-route">{{ flightContext.dep }} → {{ flightContext.dest }}</span>
              </button>
              <v-menu
                  v-model="hudStatusMenu"
                  :offset="[8, 0]"
                  location="bottom end"
                  :close-on-content-click="false"
              >
                <template #activator="{ props }">
                  <button
                      type="button"
                      class="hud-context-toggle"
                      :class="{ 'is-open': hudStatusMenu }"
                      :aria-expanded="hudStatusMenu ? 'true' : 'false'"
                      aria-label="Show flight status"
                      v-bind="props"
                  >
                    <v-icon size="16">mdi-chevron-down</v-icon>
                  </button>
                </template>
                <div class="hud-status-panel" role="menu">
                  <div class="hud-status-row">
                    <span class="hud-status-key">State</span>
                    <v-chip :color="flags.in_air ? 'green' : 'grey'" size="x-small" variant="flat">
                      {{ flags.in_air ? 'IN-AIR' : 'GROUND' }}
                    </v-chip>
                  </div>
                  <div class="hud-status-row">
                    <span class="hud-status-key">Unit</span>
                    <v-chip color="cyan" size="x-small" variant="outlined">{{ flags.current_unit }}</v-chip>
                  </div>
                  <div class="hud-status-row">
                    <span class="hud-status-key">Emergency</span>
                    <v-chip :color="flags.emergency_active ? 'red' : 'grey'" size="x-small" variant="outlined">
                      {{ flags.emergency_active ? 'ACTIVE' : 'NONE' }}
                    </v-chip>
                  </div>
                  <div class="hud-status-row">
                    <span class="hud-status-key">Radio checks</span>
                    <span class="hud-status-val">{{ flags.radio_checks_done || 0 }}</span>
                  </div>
                  <div class="hud-status-row">
                    <span class="hud-status-key">Off-schema</span>
                    <span class="hud-status-val">{{ flags.off_schema_count || 0 }}</span>
                  </div>
                </div>
              </v-menu>
            </div>
          </div>

          <div class="hud-right">
            <v-tooltip
                v-if="bridgeConnected"
                :text="bridgeSimActiveFreq ? `SimBridge connected · COM1 ${bridgeSimActiveFreq}` : 'SimBridge connected'"
                location="bottom"
            >
              <template #activator="{ props }">
                <span class="bridge-badge" v-bind="props" role="status" aria-label="SimBridge connected">
                  <span class="bridge-badge-dot" aria-hidden="true"></span>
                  <v-icon size="15">mdi-bridge</v-icon>
                  <span class="bridge-badge-label">Bridge</span>
                </span>
              </template>
            </v-tooltip>
            <v-tooltip
                v-else
                text="Connect your simulator so frequency and position sync automatically"
                location="bottom"
            >
              <template #activator="{ props }">
                <NuxtLink class="bridge-connect-hint" to="/bridge" v-bind="props">
                  <v-icon size="15">mdi-bridge</v-icon>
                  <span class="bridge-connect-hint-label">Connect simulator</span>
                </NuxtLink>
              </template>
            </v-tooltip>
            <!-- Report issue carries a filled treatment: it is the most-reached-for
                 secondary tool, so it outranks the neighbouring ghost icons. -->
            <button
                type="button"
                class="btn hud-report-btn"
                title="Fehler melden"
                :disabled="bugReportCapturing"
                @click="openBugReport"
            >
              <v-icon size="18">{{ bugReportCapturing ? 'mdi-loading mdi-spin' : 'mdi-bug-outline' }}</v-icon>
              <span class="btn-label">{{ bugReportCapturing ? '…' : 'Report issue' }}</span>
            </button>
            <button
                type="button"
                class="btn ghost hud-icon-btn"
                title="Settings"
                @click="showSettingsSheet = true"
            >
              <v-icon size="18">mdi-cog</v-icon>
            </button>
            <button
                type="button"
                class="btn ghost hud-icon-btn"
                :title="helpLang === 'de' ? 'Hilfe — wie funktioniert /live-atc' : 'Help — how /live-atc works'"
                @click="openHelp"
            >
              <v-icon size="18">mdi-help-circle-outline</v-icon>
            </button>
            <div class="hud-divider" aria-hidden="true"></div>
            <NuxtLink class="btn ghost hud-icon-btn" to="/logout" title="Logout">
              <v-icon size="18">mdi-logout</v-icon>
            </NuxtLink>
          </div>
        </nav>
      </header>

      <div class="pm-body">
        <!-- Main tab content -->
        <main class="pm-main">
          <div class="pm-main-inner">
            <!-- =============== FUNK TAB =============== -->
            <!-- Radio Panel: the primary frequency control (was: header freq chips) -->
            <div v-show="activeTab === 'funk'" class="pm-block">
              <RadioPanel
                  :active="frequencies.active"
                  :standby="frequencies.standby"
                  :channels="displayAirportFrequencies"
                  :preset-options="presetOptions"
                  :readability-options="readabilityOptions"
                  :signal-strength="signalStrength"
                  :swap-animation="swapAnimation"
                  :airport-name="airportName"
                  v-model:manual-freq-active="manualFreqActive"
                  v-model:manual-freq-standby="manualFreqStandby"
                  @swap="swapFrequencies"
                  @select-active="onPresetSelectActive"
                  @select-standby="onPresetSelectStandby"
                  @select-channel="setStandbyFrequencyFromList"
                  @select-readability="onReadabilitySelect"
                  @apply-manual="(target, close) => applyManualFrequency(target, close)"
              />
            </div>

            <!-- Input mode switch: voice / text -->
            <div v-show="activeTab === 'funk'" class="pm-block">
              <div class="pm-seg">
                <button
                    type="button"
                    class="pm-seg-btn"
                    :class="{ 'is-active': inputMode === 'voice' }"
                    @click="inputMode = 'voice'"
                >
                  <v-icon size="18">mdi-microphone</v-icon>
                  <span>Voice</span>
                </button>
                <button
                    type="button"
                    class="pm-seg-btn"
                    :class="{ 'is-active': inputMode === 'text' }"
                    @click="inputMode = 'text'"
                >
                  <v-icon size="18">mdi-keyboard</v-icon>
                  <span>Text</span>
                </button>
              </div>
            </div>

            <!-- Transmit block: the expected-comm hint is docked to the PTT pad so it
                 reads as guidance for the next transmission, not as a separate card. -->
            <div
                v-show="activeTab === 'funk'"
                v-if="inputMode === 'voice' || showExpectedComm"
                class="pm-block transmit-stack"
            >
              <ExpectedCommStrip
                  v-if="learningMode && (displayControllerSay || displayExpectedPhrase)"
                  :controller-say="displayControllerSay"
                  :expected-phrase="displayExpectedPhrase"
                  v-model:show-pronunciation="showRadioPronunciation"
              />
              <PttPad
                  v-show="inputMode === 'voice'"
                  :is-recording="isRecording"
                  :mic-permission="micPermission"
                  :bridge-ptt-connected="bridgePttConnected"
                  :active-frequency="frequencies.active"
                  @start="startRecording(false)"
                  @stop="stopRecording"
                  @request-mic="requestMicAccess"
              />
            </div>

            <!-- Manual text input (text mode) -->
            <div v-show="activeTab === 'funk' && inputMode === 'text'" class="pm-block">
              <TextInputPanel
                  v-model="pilotInput"
                  :active-frequency="frequencies.active"
                  :expected-phrase="backendExpectedPhrase"
                  @send="sendPilotText"
              />
            </div>

            <!-- Last Transmission (funk) -->
            <div
                v-show="activeTab === 'funk'"
                v-if="lastTransmission"
                class="pm-block"
            >
              <LastTransmissionCard
                  :text="lastTransmission"
                  :faulty="lastTransmissionFaulty"
                  :fault-note="lastTransmissionFaultNote"
                  @flag-issue="startTransmissionIssueFlow"
                  @clear="clearLastTransmission"
              />
            </div>

            <!-- =============== LOG TAB (mobile only) =============== -->
            <div v-show="activeTab === 'log'" class="pm-block pm-log-tab">
              <CommLog :entries="log" :limit="20" @clear="clearLog" />
            </div>

          </div>
        </main>

        <!-- Desktop log rail -->
        <aside class="pm-lograil">
          <CommLogRail
              :log="log"
              :readback-report="lastReadbackReport"
              :readback-transcript="lastReadbackTranscript"
              @clear="clearLog"
          />
        </aside>
      </div>

      <!-- Bottom nav (mobile) -->
      <nav class="pm-bottomnav">
        <button
            v-for="tab in visibleTabs"
            :key="tab.id"
            type="button"
            class="pm-navbtn"
            :class="{ 'is-active': activeTab === tab.id }"
            @click="activeTab = tab.id"
        >
          <v-icon size="22">{{ tab.icon }}</v-icon>
          <span>{{ tab.label }}</span>
        </button>
      </nav>

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
          @set-theme="setPmTheme"
      />

      <BugReportDialog :bug="bugReport" :theme="pmTheme" />

      <!-- Transmission issue dialog -->
      <v-dialog v-model="showTransmissionIssueDialog" max-width="420" :content-class="pmTheme === 'light' ? 'pm-dialog-light' : ''">
        <v-card :class="pmTheme === 'light' ? 'bg-white border border-black/10 text-[#0f1420]' : 'bg-[#0b101d] border border-white/10 text-white'">
          <v-card-title class="flex items-center gap-2 text-base font-semibold">
            <v-icon icon="mdi-alert-circle-outline" color="#f87171" size="20" />
            Mark transmission as faulty
          </v-card-title>
          <v-card-text class="space-y-4 text-sm text-white/70">
            <p>
              Optionally leave a short note so the dev team can follow up on the transmission.
            </p>
            <v-textarea
                v-model="transmissionIssueNote"
                label="Issue description (optional)"
                variant="outlined"
                color="red"
                rows="3"
                auto-grow
            />
          </v-card-text>
          <v-card-actions class="justify-end gap-2">
            <v-btn variant="text" color="grey" @click="cancelTransmissionIssue">
              Cancel
            </v-btn>
            <v-btn
                v-if="lastTransmissionFaulty"
                variant="text"
                color="cyan"
                @click="removeTransmissionIssue"
            >
              Remove flag
            </v-btn>
            <v-btn color="red" variant="flat" @click="confirmTransmissionIssue">
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Help / how-it-works overlay (first-run + reopenable via the ? button) -->
      <v-dialog v-model="showHelp" max-width="560" scrollable :content-class="pmTheme === 'light' ? 'pm-dialog-light' : ''">
        <v-card :class="pmTheme === 'light' ? 'bg-white text-[#0f1420] border border-black/10' : 'bg-[#0b1220] text-white border border-white/10'">
          <v-card-title class="d-flex align-center justify-space-between gap-2">
            <span class="text-base font-semibold">{{ helpContent.title }}</span>
            <v-btn size="small" variant="tonal" color="cyan" @click="toggleHelpLang">
              {{ helpLang === 'de' ? 'EN' : 'DE' }}
            </v-btn>
          </v-card-title>
          <v-card-text>
            <p class="text-sm text-white/70 mb-4">{{ helpContent.intro }}</p>
            <div class="space-y-3">
              <div v-for="(step, i) in helpContent.steps" :key="i" class="flex gap-3">
                <v-icon size="22" class="text-cyan-300 shrink-0 mt-1">{{ step.icon }}</v-icon>
                <div>
                  <div class="text-sm font-semibold">{{ step.title }}</div>
                  <div class="text-[13px] text-white/65 leading-snug">{{ step.text }}</div>
                </div>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="cyan" variant="flat" @click="dismissHelp">
              {{ helpLang === 'de' ? 'Verstanden' : 'Got it' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
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
import RadioPanel from '~/components/live-atc/cockpit/RadioPanel.vue'
import ExpectedCommStrip from '~/components/live-atc/cockpit/ExpectedCommStrip.vue'
import PttPad from '~/components/live-atc/cockpit/PttPad.vue'
import TextInputPanel from '~/components/live-atc/cockpit/TextInputPanel.vue'
import LastTransmissionCard from '~/components/live-atc/cockpit/LastTransmissionCard.vue'
import CommLogRail from '~/components/live-atc/cockpit/CommLogRail.vue'
import { useAtisPlayback } from '~/composables/useAtisPlayback'
import { usePttRecording } from '~/composables/usePttRecording'
import { useBugReport } from '~/composables/useBugReport'
import { useSimBridgeSync } from '~/composables/useSimBridgeSync'
import FlightInfoSheet from '~/components/live-atc/cockpit/FlightInfoSheet.vue'
import SettingsSheet from '~/components/live-atc/cockpit/SettingsSheet.vue'
import BugReportDialog from '~/components/live-atc/cockpit/BugReportDialog.vue'
import DebugPanel from '~/components/live-atc/cockpit/DebugPanel.vue'
import { CHAIN_GROUPS, DRILL_SCENARIOS } from '../../shared/constants/scenarios'
import FlightSourceStep from '~/components/live-atc/FlightSourceStep.vue'
import FlightSelectStep from '~/components/live-atc/FlightSelectStep.vue'
import ScenarioPickerStep from '~/components/live-atc/ScenarioPickerStep.vue'
import SessionCompleteStep from '~/components/live-atc/SessionCompleteStep.vue'
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
  helpSeen: 'pm_help_seen',
  helpLang: 'pm_help_lang',
} as const

// ── Help / how-it-works overlay ────────────────────────────────────────────
const HELP_CONTENT = {
  de: {
    title: 'Wie /live-atc funktioniert',
    intro: 'Du bist der Pilot. Du sprichst per Funk mit der Flugsicherung (ATC) und arbeitest ein realistisches Szenario ab.',
    steps: [
      { icon: 'mdi-radio-handheld', title: 'Frequenz einstellen', text: 'Stelle die aktive COM1-Frequenz auf den zuständigen Lotsen. Auf der falschen Frequenz kommt dein Funkspruch nicht durch.' },
      { icon: 'mdi-microphone', title: 'Sprechtaste (PTT)', text: 'Halte die Sprechtaste gedrückt, sprich, lass los. Beim Senden wird die Taste grün. Ein neuer Funkspruch unterbricht die laufende ATC-Ausgabe.' },
      { icon: 'mdi-repeat', title: 'Readback', text: 'Lies Anweisungen zurück (Frequenz, Piste, Squawk, Höhe …). Stimmt es nicht, sagt ATC „say again“. Nach 3 Versuchen wird übersprungen.' },
      { icon: 'mdi-alert-octagon', title: 'Notfall', text: 'Mit „Mayday“ oder „Pan-Pan“ rufst du einen Notfall aus, mit „cancel mayday“ beendest du ihn wieder.' },
      { icon: 'mdi-bug-outline', title: 'Fehler melden', text: 'Mit dem Bug-Knopf meldest du einen Fehler — die ganze Funksession wird mitgeschickt.' },
    ],
  },
  en: {
    title: 'How /live-atc works',
    intro: 'You are the pilot. You talk to ATC over the radio and work through a realistic scenario.',
    steps: [
      { icon: 'mdi-radio-handheld', title: 'Tune the frequency', text: 'Set the active COM1 frequency to the controller you need. On the wrong frequency your call will not get through.' },
      { icon: 'mdi-microphone', title: 'Push-to-talk (PTT)', text: 'Hold the talk button, speak, release. The pad turns green while you transmit. A new transmission cuts any ATC speech still playing.' },
      { icon: 'mdi-repeat', title: 'Read back', text: 'Read instructions back (frequency, runway, squawk, altitude …). If it is wrong ATC says “say again”. After 3 tries it is skipped.' },
      { icon: 'mdi-alert-octagon', title: 'Emergency', text: 'Say “Mayday” or “Pan-Pan” to declare an emergency, and “cancel mayday” to end it.' },
      { icon: 'mdi-bug-outline', title: 'Report a bug', text: 'Use the Bug button to report an issue — the whole radio session is attached.' },
    ],
  },
} as const

const showHelp = ref(false)
const helpLang = ref<'de' | 'en'>('de')
const helpContent = computed(() => HELP_CONTENT[helpLang.value])
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

// ── Bug Report ───────────────────────────────────────────────────────────────
// Owned here rather than by the dialog: the HUD button starts the screenshot
// capture before the dialog ever renders. The dialog gets the whole handle.
const bugReport = useBugReport(engine, { activeScenario })
const { bugReportCapturing, openBugReport } = bugReport

// Layout / view state
const activeTab = ref<'funk' | 'log'>('funk')
const experienceMenu = ref(false)
const inputMode = ref<'voice' | 'text'>('voice')
const learningMode = ref(true)
const showExpectedComm = computed(
  () => learningMode.value && Boolean(displayControllerSay.value || displayExpectedPhrase.value),
)

// Overlays / sheets opened from HUD controls
const showFlightSheet = ref(false)
const showSettingsSheet = ref(false)
const hudStatusMenu = ref(false)

/** The one gate for developer tooling: DebugPanel is not mounted while this is off. */
const debugMode = ref(true)

type PmTab = {
  id: 'funk' | 'log'
  label: string
  icon: string
  mobileOnly?: boolean
}
const TABS: PmTab[] = [
  { id: 'funk', label: 'Radio', icon: 'mdi-radio-handheld' },
  { id: 'log', label: 'Log', icon: 'mdi-format-list-bulleted', mobileOnly: true },
]
const visibleTabs = computed(() => TABS)

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

const speech = useRadioSpeech(engine, freq, speechInterrupt, {
  setLastTransmission,
  handlePilotTransmission,
  lastControllerSay,
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

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

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

const {
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
  persistSelectedPlan,
  maybeShowFirstRunHelp,
})
const {
  loadFlightPlans,
  startMonitoring,
  startDemoFlight,
  launchScenario,
  flyAgain,
  backToSetup,
  sendPilotText,
  restoreBugReportState,
} = session

onUnmounted(() => {
  stopAtisLoop()
  stopPrerecCapture()
  cancelAirportDataRefresh()
})
</script>

<style scoped>
/* Expected-comm strip + PTT pad share one frame, so the hint reads as part of
   the transmit control rather than as another card above it. */
.transmit-stack {
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid var(--border);
  background:
    linear-gradient(165deg,
      color-mix(in srgb, var(--bg2) 90%, transparent),
      color-mix(in srgb, var(--bg) 96%, transparent));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--text) 6%, transparent),
    0 20px 44px -28px rgba(0, 0, 0, 0.9);
}

/* ---------------------------------------------------------------------------
   App shell layout (monitor screen)
   --------------------------------------------------------------------------- */
.pm-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

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

/* HUD top bar (matches classroom design) */
.hud {
  flex: 0 0 auto;
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: blur(10px);
  padding-top: env(safe-area-inset-top);
}
.hud-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  margin: 0 auto;
  width: 100%;
}
.hud-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.hud-right {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: flex-end;
  margin-left: auto;
}
.hud-right .btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 12px;
}
.hud-right .btn-label {
  white-space: nowrap;
}
.hud-right .hud-icon-btn {
  padding: 8px;
  min-width: 40px;
  justify-content: center;
}
.hud-report-btn {
  border: 1px solid rgba(245, 158, 11, 0.5);
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
  font-weight: 600;
  font-size: 0.82rem;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}
.hud-report-btn:hover:not(:disabled),
.hud-report-btn:focus-visible:not(:disabled) {
  background: rgba(245, 158, 11, 0.28);
  border-color: rgba(245, 158, 11, 0.7);
  color: #fde68a;
  outline: none;
}
.hud-report-btn:disabled {
  opacity: 0.6;
  cursor: progress;
}
.pm-page[data-theme="light"] .hud-report-btn {
  background: rgba(180, 83, 9, 0.12);
  border-color: rgba(180, 83, 9, 0.4);
  color: #92400e;
}
.bridge-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(52, 211, 153, 0.4);
  background: rgba(16, 185, 129, 0.14);
  color: rgba(167, 243, 208, 0.95);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: default;
}
.bridge-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #34d399;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.8);
  animation: bridge-badge-pulse 1.8s ease-in-out infinite;
}
.bridge-badge-label {
  white-space: nowrap;
}
@keyframes bridge-badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@media (max-width: 900px) {
  .bridge-badge-label { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .bridge-badge-dot { animation: none; }
}
/* Discovery hint for the desktop Bridge companion app — shown instead of the
   bridge-badge when no sim is linked, so the feature is findable without
   nagging (muted, no pulse, just a quiet link to /bridge). */
.bridge-connect-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  color: var(--t3);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  transition: color .2s ease, border-color .2s ease, background .2s ease;
}
.bridge-connect-hint:hover,
.bridge-connect-hint:focus-visible {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 32%, transparent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  outline: none;
}
.bridge-connect-hint-label {
  white-space: nowrap;
}
@media (max-width: 900px) {
  .bridge-connect-hint-label { display: none; }
}
.hud-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  transition: border-color .2s ease, background .2s ease, color .2s ease;
}
.hud-logo:hover {
  border-color: color-mix(in srgb, var(--accent) 54%, transparent);
  background: color-mix(in srgb, var(--accent) 20%, transparent);
}
.hud-logo-icon {
  color: currentColor;
}
.hud-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
  border-radius: 999px;
}
.brand {
  font-weight: 600;
  white-space: nowrap;
}
.mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--t2);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: color .2s ease, background .2s ease, border-color .2s ease;
}
.mode-switch:hover,
.mode-switch:focus-visible {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: color-mix(in srgb, var(--accent) 22%, transparent);
  outline: none;
}
.mode-switch-icon { color: currentColor; }

:global(.experience-menu) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 240px;
  padding: 8px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  box-shadow: 0 18px 40px rgba(2, 6, 23, .4);
}
:global(.experience-option) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--t2);
  text-align: left;
  font: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}
:global(.experience-option:hover),
:global(.experience-option:focus-visible) {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  border-color: color-mix(in srgb, var(--accent) 26%, transparent);
  color: var(--accent);
  outline: none;
}
:global(.experience-option.is-active) {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  border-color: color-mix(in srgb, var(--accent) 32%, transparent);
  color: var(--accent);
}
:global(.experience-option-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
:global(.experience-option-title) {
  font-weight: 600;
  line-height: 1.2;
}
:global(.experience-option-sub) {
  font-size: 12px;
  color: var(--t3);
}

/* Flight context: styled like freq-control-group, with status dropdown toggle */
.hud-context-group {
  display: inline-flex;
  align-items: stretch;
  min-height: 40px;
  margin-left: 4px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(34, 211, 238, 0.32);
  background: rgba(34, 211, 238, 0.08);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text) 3%, transparent);
}
.hud-context-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1px;
  min-width: 110px;
  padding: 4px 12px;
  background: transparent;
  text-align: left;
  line-height: 1.15;
  color: inherit;
  cursor: pointer;
  transition: background 120ms ease, transform 80ms ease;
}
.hud-context-btn:hover {
  background: rgba(34, 211, 238, 0.1);
}
.hud-context-btn:active {
  transform: scale(0.98);
  background: rgba(34, 211, 238, 0.18);
}
.hud-context-callsign {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.hud-context-route {
  font-size: 11px;
  color: var(--t3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.hud-context-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  min-height: 100%;
  border-left: 1px solid rgba(34, 211, 238, 0.24);
  color: #67e8f9;
  background: rgba(34, 211, 238, 0.06);
  transition: background 120ms ease, color 120ms ease, transform 120ms ease;
  -webkit-tap-highlight-color: transparent;
}
.hud-context-toggle:hover {
  color: #cffafe;
  background: rgba(34, 211, 238, 0.16);
}
.hud-context-toggle.is-open {
  background: rgba(34, 211, 238, 0.22);
}
.hud-context-toggle.is-open .v-icon {
  transform: rotate(180deg);
}

.hud-status-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  background: color-mix(in srgb, var(--bg) 94%, transparent);
  box-shadow: 0 18px 40px rgba(2, 6, 23, .45);
  backdrop-filter: blur(10px);
}
.hud-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}
.hud-status-key {
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 10px;
}
.hud-status-val {
  color: var(--text);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 1180px) {
  .hud-context-btn .hud-context-route {
    display: none;
  }
  .mode-switch,
  .hud-divider,
  .brand {
    display: none;
  }
}
@media (max-width: 720px) {
  .hud-context-group {
    display: none;
  }
}
@media (max-width: 860px) {
  .hud-inner {
    gap: 8px;
    padding: 8px 10px;
  }
  .hud-right { gap: 6px; }
  .hud-right .btn {
    padding: 8px;
    min-width: 40px;
    justify-content: center;
  }
  .hud-right .btn-label { display: none; }
}

.pm-body {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.pm-main {
  flex: 1 1 auto;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.pm-main-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px 14px 24px;
}
.pm-block {
  margin-bottom: 16px;
}
.pm-block:last-child {
  margin-bottom: 0;
}

.pm-lograil {
  display: none;
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

.pm-bottomnav {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  gap: 2px;
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 95%, transparent);
  backdrop-filter: blur(10px);
  padding: 6px 6px calc(env(safe-area-inset-bottom) + 6px);
}

.pm-navbtn {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 12px;
  border: 1px solid transparent;
  color: var(--t2);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: transparent;
  transition: color .2s ease, background .2s ease, border-color .2s ease;
  -webkit-tap-highlight-color: transparent;
}
.pm-navbtn:hover,
.pm-navbtn:focus-visible {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: color-mix(in srgb, var(--accent) 22%, transparent);
  outline: none;
}
.pm-navbtn.is-active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  border-color: color-mix(in srgb, var(--accent) 32%, transparent);
}

/* Unified segmented control (voice / text, etc.) */
.pm-seg {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 4%, transparent);
}
.pm-seg-btn {
  flex: 1 1 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--t3);
  transition: color 130ms ease, background 130ms ease;
  -webkit-tap-highlight-color: transparent;
}
.pm-seg-btn:hover {
  color: color-mix(in srgb, var(--text) 85%, transparent);
}
.pm-seg-btn.is-active {
  color: #050910;
  background: #22d3ee;
}

/* Tablet / desktop: use the extra space ----------------------------------- */
@media (min-width: 1024px) {
  .pm-lograil {
    display: block;
    flex: 0 0 360px;
    width: 360px;
    overflow-y: auto;
    border-left: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
    padding: 16px 14px;
  }
  .pm-bottomnav {
    display: none;
  }
  .pm-main-inner {
    max-width: 760px;
    padding: 20px 20px 28px;
  }
  /* Log lives in the right rail on desktop, so its tab body is redundant */
  .pm-log-tab {
    display: none !important;
  }
}

</style>
