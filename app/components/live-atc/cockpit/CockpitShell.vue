<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { HoldSelectOption } from '~/components/HoldSelect.vue'
import type { DisplayAirportFrequencyEntry } from '~/composables/useFrequencyPresets'
import type { ReadbackFieldDetail } from '~/composables/useRadioBackend'
import RadioPanel from '~/components/live-atc/cockpit/RadioPanel.vue'
import ExpectedCommStrip from '~/components/live-atc/cockpit/ExpectedCommStrip.vue'
import PttPad from '~/components/live-atc/cockpit/PttPad.vue'
import TextInputPanel from '~/components/live-atc/cockpit/TextInputPanel.vue'
import LastTransmissionCard from '~/components/live-atc/cockpit/LastTransmissionCard.vue'
import CommLogRail from '~/components/live-atc/cockpit/CommLogRail.vue'

const props = defineProps<{
  // HUD
  flightContext: { callsign?: string, dep?: string, dest?: string }
  flags: Record<string, any>
  bridgeConnected: boolean
  bridgeSimActiveFreq: string
  bugReportCapturing: boolean
  helpLang: 'de' | 'en'

  // Radio panel
  frequencies: { active: string, standby: string }
  channels: DisplayAirportFrequencyEntry[]
  presetOptions: HoldSelectOption[]
  readabilityOptions: HoldSelectOption[]
  signalStrength: number
  swapAnimation: boolean
  airportName?: string

  // Expected comm + PTT
  learningMode: boolean
  controllerSay: string
  expectedPhrase: string
  isRecording: boolean
  micPermission: boolean
  bridgePttConnected: boolean

  // Text input
  backendExpectedPhrase: string

  // Last transmission
  lastTransmission: string
  lastTransmissionFaulty: boolean
  lastTransmissionFaultNote: string

  // Comm log
  log: readonly any[]
  readbackReport: readonly ReadbackFieldDetail[]
  readbackTranscript: string
}>()

const emit = defineEmits<{
  (e: 'open-flight-sheet'): void
  (e: 'open-bug-report'): void
  (e: 'open-settings'): void
  (e: 'open-help'): void
  (e: 'swap'): void
  (e: 'select-active', option: HoldSelectOption): void
  (e: 'select-standby', option: HoldSelectOption): void
  (e: 'select-channel', entry: DisplayAirportFrequencyEntry): void
  (e: 'select-readability', option: HoldSelectOption): void
  (e: 'apply-manual', target: 'active' | 'standby', close: () => void): void
  (e: 'ptt-start'): void
  (e: 'ptt-stop'): void
  (e: 'request-mic'): void
  (e: 'send-text'): void
  (e: 'flag-issue'): void
  (e: 'clear-transmission'): void
  (e: 'clear-log'): void
}>()

const manualFreqActive = defineModel<string>('manualFreqActive', { required: true })
const manualFreqStandby = defineModel<string>('manualFreqStandby', { required: true })
const showRadioPronunciation = defineModel<boolean>('showRadioPronunciation', { required: true })
const pilotInput = defineModel<string>('pilotInput', { required: true })
/** Owned by the page: a watcher there drives the pre-recording buffer off it. */
const inputMode = defineModel<'voice' | 'text'>('inputMode', { required: true })

// Purely presentational state — nothing outside the shell reads it.
const activeTab = ref<'funk' | 'log'>('funk')
const experienceMenu = ref(false)
const hudStatusMenu = ref(false)

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

const showExpectedComm = computed(
  () => props.learningMode && Boolean(props.controllerSay || props.expectedPhrase),
)

// First-run coach mark that points pilots at the "Report issue" button. Live ATC
// is an early alpha and bug reports are how we improve it, so make it obvious on
// the very first visit. Dismissed permanently once seen.
const REPORT_HINT_STORAGE_KEY = 'os_live_atc_report_hint_seen'
const showReportCoach = ref(false)

function dismissReportCoach() {
  showReportCoach.value = false
  try {
    window.localStorage.setItem(REPORT_HINT_STORAGE_KEY, '1')
  } catch { /* ignore */ }
}

function onReportClick() {
  dismissReportCoach()
  emit('open-bug-report')
}

onMounted(() => {
  try {
    if (!window.localStorage.getItem(REPORT_HINT_STORAGE_KEY)) {
      showReportCoach.value = true
    }
  } catch { /* ignore */ }
})
</script>

<template>
  <section class="pm-shell learn-theme">
    <!-- Persistent top bar (HUD): brand + flight context + actions -->
    <header class="hud" role="banner">
      <nav class="hud-inner" aria-label="Global">
        <div class="hud-left">
          <NuxtLink class="hud-logo" to="/bridge" title="Back to bridge">
            <v-icon size="22" class="hud-logo-icon">mdi-radar</v-icon>
          </NuxtLink>
          <div class="hud-divider" aria-hidden="true"></div>
          <span class="brand">OpenSquawk</span>
          <v-menu v-model="experienceMenu" :offset="[0, 8]" location="bottom start" transition="scale-transition">
            <template #activator="{ props: menu }">
              <button
                  class="mode-switch"
                  type="button"
                  v-bind="menu"
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
                @click="emit('open-flight-sheet')"
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
              <template #activator="{ props: menu }">
                <button
                    type="button"
                    class="hud-context-toggle"
                    :class="{ 'is-open': hudStatusMenu }"
                    :aria-expanded="hudStatusMenu ? 'true' : 'false'"
                    aria-label="Show flight status"
                    v-bind="menu"
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
            <template #activator="{ props: tip }">
              <span class="bridge-badge" v-bind="tip" role="status" aria-label="SimBridge connected">
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
            <template #activator="{ props: tip }">
              <NuxtLink class="bridge-connect-hint" to="/bridge" v-bind="tip">
                <v-icon size="15">mdi-bridge</v-icon>
                <span class="bridge-connect-hint-label">Connect simulator</span>
              </NuxtLink>
            </template>
          </v-tooltip>
          <!-- Report issue carries a filled treatment: it is the most-reached-for
               secondary tool, so it outranks the neighbouring ghost icons. -->
          <div class="hud-report-wrap">
            <button
                type="button"
                class="btn hud-report-btn"
                :class="{ 'is-coaching': showReportCoach }"
                title="Fehler melden"
                :disabled="bugReportCapturing"
                @click="onReportClick"
            >
              <v-icon size="18">{{ bugReportCapturing ? 'mdi-loading mdi-spin' : 'mdi-bug-outline' }}</v-icon>
              <span class="btn-label">{{ bugReportCapturing ? '…' : 'Report issue' }}</span>
            </button>
            <span v-if="showReportCoach" class="report-coach-ring" aria-hidden="true"></span>
            <transition name="coach-fade">
              <div v-if="showReportCoach" class="report-coach" role="dialog" aria-label="Report issues">
                <span class="report-coach-arrow" aria-hidden="true"></span>
                <div class="report-coach-body">
                  <div class="report-coach-title">
                    <v-icon size="16">mdi-bug-outline</v-icon>
                    Found a bug?
                  </div>
                  <p class="report-coach-text">
                    Live ATC is an early alpha. Hit <strong>Report issue</strong> anytime something
                    feels off — it captures the session and helps us fix it.
                  </p>
                  <button type="button" class="report-coach-dismiss" @click="dismissReportCoach">
                    Got it
                  </button>
                </div>
              </div>
            </transition>
          </div>
          <button
              type="button"
              class="btn ghost hud-icon-btn"
              title="Settings"
              @click="emit('open-settings')"
          >
            <v-icon size="18">mdi-cog</v-icon>
          </button>
          <button
              type="button"
              class="btn ghost hud-icon-btn"
              :title="helpLang === 'de' ? 'Hilfe — wie funktioniert /live-atc' : 'Help — how /live-atc works'"
              @click="emit('open-help')"
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
                :channels="channels"
                :preset-options="presetOptions"
                :readability-options="readabilityOptions"
                :signal-strength="signalStrength"
                :swap-animation="swapAnimation"
                :airport-name="airportName"
                v-model:manual-freq-active="manualFreqActive"
                v-model:manual-freq-standby="manualFreqStandby"
                @swap="emit('swap')"
                @select-active="emit('select-active', $event)"
                @select-standby="emit('select-standby', $event)"
                @select-channel="emit('select-channel', $event)"
                @select-readability="emit('select-readability', $event)"
                @apply-manual="(target, close) => emit('apply-manual', target, close)"
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
                v-if="showExpectedComm"
                :controller-say="controllerSay"
                :expected-phrase="expectedPhrase"
                v-model:show-pronunciation="showRadioPronunciation"
            />
            <PttPad
                v-show="inputMode === 'voice'"
                :is-recording="isRecording"
                :mic-permission="micPermission"
                :bridge-ptt-connected="bridgePttConnected"
                :active-frequency="frequencies.active"
                @start="emit('ptt-start')"
                @stop="emit('ptt-stop')"
                @request-mic="emit('request-mic')"
            />
          </div>

          <!-- Manual text input (text mode) -->
          <div v-show="activeTab === 'funk' && inputMode === 'text'" class="pm-block">
            <TextInputPanel
                v-model="pilotInput"
                :active-frequency="frequencies.active"
                :expected-phrase="backendExpectedPhrase"
                @send="emit('send-text')"
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
                @flag-issue="emit('flag-issue')"
                @clear="emit('clear-transmission')"
            />
          </div>

          <!-- =============== LOG TAB (mobile only) =============== -->
          <div v-show="activeTab === 'log'" class="pm-block pm-log-tab">
            <CommLog :entries="log" :limit="20" @clear="emit('clear-log')" />
          </div>

        </div>
      </main>

      <!-- Desktop log rail -->
      <aside class="pm-lograil">
        <CommLogRail
            :log="log"
            :readback-report="readbackReport"
            :readback-transcript="readbackTranscript"
            @clear="emit('clear-log')"
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

    <!-- Dialogs, sheets and the debug panel stay owned by the page, but render
         inside the shell so they inherit its .learn-theme CSS variables. -->
    <slot name="overlays" />
  </section>
</template>

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

/* ── First-run "report issue" coach mark ─────────────────────────────── */
.hud-report-wrap {
  position: relative;
  display: inline-flex;
}
.hud-report-btn.is-coaching {
  animation: report-coach-bob 1.6s ease-in-out infinite;
}
.report-coach-ring {
  position: absolute;
  inset: -6px;
  border-radius: 12px;
  border: 2px solid rgba(245, 158, 11, 0.8);
  pointer-events: none;
  animation: report-coach-pulse 1.6s ease-out infinite;
}
@keyframes report-coach-pulse {
  0%   { transform: scale(0.92); opacity: 0.9; }
  70%  { transform: scale(1.18); opacity: 0; }
  100% { transform: scale(1.18); opacity: 0; }
}
@keyframes report-coach-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}
.report-coach {
  position: absolute;
  top: calc(100% + 14px);
  right: 0;
  z-index: 60;
  width: 260px;
  max-width: 78vw;
}
.report-coach-arrow {
  position: absolute;
  top: -7px;
  right: 22px;
  width: 14px;
  height: 14px;
  background: var(--panel, #10161f);
  border-left: 1px solid rgba(245, 158, 11, 0.55);
  border-top: 1px solid rgba(245, 158, 11, 0.55);
  transform: rotate(45deg);
}
.report-coach-body {
  position: relative;
  border-radius: 14px;
  border: 1px solid rgba(245, 158, 11, 0.55);
  background: var(--panel, #10161f);
  box-shadow: 0 18px 44px rgba(2, 6, 23, 0.5);
  padding: 14px 16px;
}
.report-coach-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #fcd34d;
}
.report-coach-text {
  margin: 6px 0 12px;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--text, #e5e7eb);
  opacity: 0.9;
}
.report-coach-text strong {
  color: #fcd34d;
}
.report-coach-dismiss {
  display: inline-flex;
  align-items: center;
  border-radius: 9px;
  border: 1px solid rgba(245, 158, 11, 0.5);
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
  font-weight: 600;
  font-size: 0.78rem;
  padding: 6px 14px;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease;
}
.report-coach-dismiss:hover {
  background: rgba(245, 158, 11, 0.28);
  border-color: rgba(245, 158, 11, 0.7);
}
.pm-page[data-theme="light"] .report-coach-arrow,
.pm-page[data-theme="light"] .report-coach-body {
  background: #ffffff;
}
.coach-fade-enter-active,
.coach-fade-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}
.coach-fade-enter-from,
.coach-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@media (prefers-reduced-motion: reduce) {
  .hud-report-btn.is-coaching,
  .report-coach-ring {
    animation: none;
  }
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

/* Vuetify teleports the menu body to <body>, out of reach of scoped styles. */
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
