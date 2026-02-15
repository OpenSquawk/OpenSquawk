<template>
  <div class="min-h-screen bg-[#070d1a] text-white flex flex-col overflow-hidden">
    <!-- ═══════ Global Progress Bar (top edge) ═══════ -->
    <div class="fixed top-0 left-0 right-0 z-50 h-1 bg-white/5">
      <div
        class="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 transition-all duration-1000 ease-out global-progress-glow"
        :style="{ width: `${engine.progress.value}%` }"
      />
    </div>

    <!-- ═══════ Sidebar Toggle Button ═══════ -->
    <button
      class="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex h-12 w-6 items-center justify-center rounded-r-lg border border-l-0 border-white/10 bg-[#0b1328]/95 backdrop-blur text-white/40 hover:text-white/80 hover:bg-[#0b1328] transition-all duration-300"
      :class="{ 'left-[300px]': sidebarOpen }"
      @click="sidebarOpen = !sidebarOpen"
    >
      <v-icon :icon="sidebarOpen ? 'mdi-chevron-left' : 'mdi-chevron-right'" size="16" />
    </button>

    <!-- ═══════ Sidebar ═══════ -->
    <Transition name="sidebar">
      <aside
        v-show="sidebarOpen"
        class="fixed left-0 top-0 bottom-0 z-30 w-[300px] border-r border-white/5 bg-[#070d1a]/98 backdrop-blur-xl flex flex-col pt-6"
      >
        <!-- Sidebar Header -->
        <div class="px-4 mb-4">
          <div class="flex items-center gap-2 mb-1">
            <v-icon icon="mdi-airplane-takeoff" size="18" class="text-cyan-400/70" />
            <span class="text-sm font-medium text-white/70">{{ engine.scenario.title }}</span>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <div class="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-700"
                :style="{ width: `${engine.progress.value}%` }"
              />
            </div>
            <span class="text-xs text-white/40 tabular-nums">{{ engine.progress.value }}%</span>
          </div>
        </div>

        <!-- Phase Stepper -->
        <div class="flex-1 overflow-y-auto px-4 pb-4 sidebar-scroll">
          <p class="text-[10px] uppercase tracking-widest text-white/30 mb-3">Phasen</p>
          <div class="space-y-1">
            <button
              v-for="(phaseId, idx) in mainPhaseIds"
              :key="phaseId"
              class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-300"
              :class="getPhaseStepClass(phaseId, idx)"
              @click="handlePhaseJump(phaseId)"
            >
              <!-- Step indicator -->
              <div class="relative flex h-7 w-7 shrink-0 items-center justify-center">
                <!-- Completed check -->
                <div
                  v-if="isPhaseCompleted(phaseId, idx)"
                  class="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center phase-check-enter"
                >
                  <v-icon icon="mdi-check" size="14" class="text-emerald-300" />
                </div>
                <!-- Current pulse -->
                <div
                  v-else-if="isPhaseActive(phaseId)"
                  class="h-7 w-7 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center"
                >
                  <div class="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <!-- Future -->
                <div v-else class="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span class="text-[10px] text-white/30 font-mono">{{ idx + 1 }}</span>
                </div>
                <!-- Connecting line -->
                <div
                  v-if="idx < mainPhaseIds.length - 1"
                  class="absolute top-full left-1/2 -translate-x-1/2 w-px h-1 transition-colors duration-500"
                  :class="isPhaseCompleted(phaseId, idx) ? 'bg-emerald-400/30' : 'bg-white/5'"
                />
              </div>
              <!-- Label -->
              <span class="text-sm truncate transition-colors duration-300"
                :class="isPhaseActive(phaseId) ? 'text-cyan-200 font-medium' : isPhaseCompleted(phaseId, idx) ? 'text-emerald-300/70' : 'text-white/30'"
              >
                {{ getPhaseLabel(phaseId) }}
              </span>
            </button>
          </div>
        </div>

        <!-- SimBridge Conditions Panel -->
        <div
          v-if="currentPhase?.simConditions"
          class="border-t border-white/5 p-4 shrink-0"
        >
          <div class="flex items-center gap-2 mb-3">
            <v-icon icon="mdi-connection" size="16" class="text-cyan-400/70" />
            <span class="text-[10px] uppercase tracking-widest text-white/30">SimBridge</span>
            <div v-if="engine.currentTelemetry.value" class="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div v-else class="ml-auto h-2 w-2 rounded-full bg-red-400/50" />
          </div>
          <div class="space-y-2">
            <div
              v-for="(cond, idx) in currentPhase.simConditions.conditions"
              :key="idx"
              class="rounded-lg bg-white/5 p-2"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] text-white/50">{{ conditionLabels[cond.variable] || cond.variable }}</span>
                <span class="text-[11px] font-mono" :class="isConditionMet(cond) ? 'text-emerald-300' : 'text-white/40'">
                  {{ getConditionIcon(cond) }}
                </span>
              </div>
              <!-- Value bar -->
              <div v-if="typeof cond.value === 'number'" class="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  :class="isConditionMet(cond) ? 'bg-emerald-400' : 'bg-cyan-500/70'"
                  :style="{ width: `${getConditionProgress(cond)}%` }"
                />
                <!-- Target marker -->
                <div
                  class="absolute top-0 bottom-0 w-0.5 bg-white/30"
                  :style="{ left: `${getTargetPosition(cond)}%` }"
                />
              </div>
              <!-- Boolean indicator -->
              <div v-else class="flex items-center gap-1.5">
                <div class="h-2 w-2 rounded-full" :class="isConditionMet(cond) ? 'bg-emerald-400' : 'bg-white/20'" />
                <span class="text-[10px]" :class="isConditionMet(cond) ? 'text-emerald-300' : 'text-white/30'">
                  {{ getCurrentBooleanLabel(cond) }}
                </span>
              </div>
              <!-- Current / Target -->
              <div v-if="typeof cond.value === 'number'" class="flex items-center justify-between mt-1">
                <span class="text-[10px] font-mono text-white/40">
                  {{ getCurrentValue(cond) }}{{ conditionUnits[cond.variable] ? ' ' + conditionUnits[cond.variable] : '' }}
                </span>
                <span class="text-[10px] text-white/30">
                  Ziel: {{ cond.operator }} {{ cond.value }}{{ conditionUnits[cond.variable] ? ' ' + conditionUnits[cond.variable] : '' }}
                </span>
              </div>
            </div>
          </div>
          <!-- Logic indicator -->
          <p class="text-[10px] text-white/20 mt-2 text-center">
            {{ currentPhase.simConditions.logic === 'AND' ? 'Alle Bedingungen müssen erfüllt sein' : 'Eine Bedingung reicht' }}
          </p>
        </div>
      </aside>
    </Transition>

    <!-- ═══════ Header Bar ═══════ -->
    <header class="shrink-0 border-b border-white/5 bg-[#070d1a]/90 backdrop-blur px-4 py-3 mt-1 relative z-20">
      <div class="mx-auto flex max-w-screen-lg items-center justify-between gap-3">
        <!-- Left: Back + Title -->
        <div class="flex items-center gap-3">
          <NuxtLink to="/flightlab" class="text-white/40 transition hover:text-white/80">
            <v-icon icon="mdi-arrow-left" size="20" />
          </NuxtLink>
          <div class="flex items-center gap-2">
            <v-icon icon="mdi-airplane-takeoff" size="18" class="text-cyan-400/70" />
            <span class="text-sm font-medium text-white/70">{{ engine.scenario.title }}</span>
          </div>
        </div>

        <!-- Right: Auto-Advance Toggle + Session + Controls -->
        <div class="flex items-center gap-2">
          <!-- Auto-Advance Toggle -->
          <div class="flex items-center gap-1.5">
            <v-switch
              :model-value="engine.autoAdvanceEnabled.value"
              density="compact"
              hide-details
              color="cyan"
              class="auto-advance-toggle"
              @update:model-value="engine.toggleAutoAdvance()"
            />
            <span class="text-xs text-white/40 hidden sm:inline">Sim Auto</span>
          </div>

          <!-- Session indicator -->
          <div v-if="sync.isConnected.value" class="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 px-3 py-1">
            <div class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span class="text-xs text-emerald-300">{{ sync.sessionCode.value }}</span>
          </div>

          <!-- Session input (when not connected) -->
          <div v-else class="flex items-center gap-1">
            <input
              v-model="joinCode"
              type="text"
              maxlength="4"
              placeholder="CODE"
              class="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-xs font-mono uppercase text-white/80 placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none"
              @keyup.enter="handleJoin"
            />
            <v-btn
              v-if="joinCode.length === 4"
              size="x-small"
              variant="flat"
              color="primary"
              class="rounded-lg"
              @click="handleJoin"
            >
              Join
            </v-btn>
          </div>

          <!-- Sidebar toggle (mobile) -->
          <v-btn
            icon
            size="x-small"
            variant="text"
            class="text-white/30 hover:text-white/70 sm:hidden"
            @click="sidebarOpen = !sidebarOpen"
          >
            <v-icon icon="mdi-menu" size="18" />
          </v-btn>

          <!-- Restart -->
          <v-btn
            icon
            size="x-small"
            variant="text"
            class="text-white/30 hover:text-white/70"
            @click="showRestartConfirm = true"
          >
            <v-icon icon="mdi-refresh" size="18" />
          </v-btn>
        </div>
      </div>
    </header>

    <!-- ═══════ Main Content ═══════ -->
    <main class="flex-1 flex flex-col justify-center px-4 py-6 sm:py-10 transition-all duration-300" :class="{ 'sm:ml-[300px]': sidebarOpen }">
      <div class="mx-auto w-full max-w-screen-sm space-y-6">
        <!-- Paused overlay -->
        <Transition name="fade-slide">
          <div v-if="engine.isPaused.value" class="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-center">
            <v-icon icon="mdi-pause-circle" size="24" class="text-amber-300 mb-1" />
            <p class="text-sm text-amber-200">Pausiert - der Instructor setzt gleich fort</p>
          </div>
        </Transition>

        <!-- Help Message Banner -->
        <Transition name="fade-slide">
          <div
            v-if="engine.showingHelpMessage.value && engine.helpMessageText.value"
            class="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4"
          >
            <div class="flex items-start gap-3">
              <v-icon icon="mdi-lightbulb" size="22" class="text-amber-300 mt-0.5 shrink-0" />
              <div class="flex-1">
                <p class="text-sm text-amber-200 leading-relaxed">{{ engine.helpMessageText.value }}</p>
                <v-btn
                  size="small"
                  variant="text"
                  color="amber"
                  class="mt-2 -ml-2"
                  @click="engine.dismissHelpMessage()"
                >
                  Verstanden
                </v-btn>
              </div>
            </div>
          </div>
        </Transition>

        <!-- ATC Message Area -->
        <Transition name="phase-enter" mode="out-in">
          <div
            v-if="currentPhase"
            :key="engine.currentPhaseId.value"
            class="rounded-3xl border border-white/10 bg-[#0b1328]/90 p-6 sm:p-8 shadow-xl shadow-cyan-500/5"
          >
            <!-- Voice Animation + Skip Button -->
            <div v-if="audio.isSpeaking.value" class="mb-4 flex items-center gap-2">
              <div class="voice-bars flex items-end gap-[3px]">
                <span v-for="i in 8" :key="i" class="voice-bar" :style="{ animationDelay: `${(i - 1) * 80}ms` }" />
              </div>
              <span class="text-xs text-cyan-300/70">Spricht...</span>
              <v-spacer />
              <!-- ══ Skip Speech Button ══ -->
              <button
                class="skip-btn flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/50 hover:text-white/80 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                @click="audio.skipSpeech()"
              >
                <v-icon icon="mdi-skip-next" size="14" />
                <span>Skip</span>
              </button>
            </div>

            <!-- Phase progress bar (TTS duration indicator) -->
            <div v-if="audio.isSpeaking.value" class="mb-4 h-0.5 rounded-full bg-white/5 overflow-hidden">
              <div class="h-full bg-cyan-400/50 rounded-full phase-progress-animate" />
            </div>

            <!-- ATC text -->
            <p class="text-lg sm:text-xl leading-relaxed text-white/90 font-light">
              {{ currentPhase.atcMessage }}
            </p>

            <!-- Replay + Details row -->
            <div class="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
              <!-- Replay button -->
              <v-btn
                v-if="audio.canReplay.value"
                size="small"
                variant="text"
                color="cyan"
                prepend-icon="mdi-replay"
                class="-ml-2"
                :disabled="audio.isSpeaking.value"
                @click="audio.replayLastMessage()"
              >
                Nochmal anhören
              </v-btn>

              <v-spacer />

              <!-- More details button -->
              <v-btn
                v-if="currentPhase.explanation || currentPhase.simConditions || currentPhase.instructorNote"
                size="small"
                variant="text"
                class="text-white/40 -mr-2"
                prepend-icon="mdi-information-outline"
                @click="showDetails = true"
              >
                Mehr Details
              </v-btn>
            </div>
          </div>
        </Transition>

        <!-- End screen -->
        <Transition name="fade-scale">
          <div v-if="engine.isFinished.value" class="text-center py-4">
            <div class="inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 mb-4 finished-icon">
              <v-icon icon="mdi-check-circle" size="36" class="text-emerald-300" />
            </div>
            <p class="text-lg font-semibold text-emerald-200">Geschafft!</p>
          </div>
        </Transition>

        <!-- Buttons -->
        <div v-if="currentPhase" class="flex flex-col gap-3">
          <TransitionGroup name="btn-list">
            <v-btn
              v-for="btn in currentPhase.buttons"
              :key="btn.id"
              :color="getButtonColor(btn.type)"
              :variant="btn.type === 'primary' ? 'flat' : 'outlined'"
              size="large"
              block
              class="rounded-xl text-left justify-start min-h-[56px]"
              :class="{ 'border-white/10': btn.type !== 'primary' }"
              :disabled="engine.isPaused.value || audio.isSpeaking.value"
              :prepend-icon="btn.icon"
              @click="handleButtonPress(btn)"
            >
              <span class="text-sm sm:text-base">{{ btn.label }}</span>
            </v-btn>
          </TransitionGroup>
        </div>
      </div>
    </main>

    <!-- ═══════ Details Dialog ═══════ -->
    <v-dialog v-model="showDetails" max-width="440">
      <v-card class="rounded-2xl bg-[#0b1328] border border-white/10">
        <v-card-title class="text-base font-semibold pt-5 px-5 flex items-center gap-2">
          <v-icon icon="mdi-information-outline" size="20" class="text-cyan-400" />
          Details
        </v-card-title>
        <v-card-text class="px-5 space-y-4">
          <!-- Explanation -->
          <div v-if="currentPhase?.explanation">
            <p class="text-xs text-white/40 uppercase tracking-wider mb-1">Erklärung</p>
            <p class="text-sm text-white/80 leading-relaxed">{{ currentPhase.explanation }}</p>
          </div>

          <!-- Sim Conditions -->
          <div v-if="currentPhase?.simConditions">
            <p class="text-xs text-white/40 uppercase tracking-wider mb-1">Sim-Bedingungen</p>
            <div class="space-y-1">
              <div
                v-for="(cond, idx) in currentPhase.simConditions.conditions"
                :key="idx"
                class="flex items-center gap-2 text-sm text-white/70"
              >
                <v-icon icon="mdi-chevron-right" size="14" class="text-cyan-400/50" />
                <span>{{ formatCondition(cond) }}</span>
              </div>
              <p class="text-xs text-white/30 mt-1">
                Logik: {{ currentPhase.simConditions.logic === 'AND' ? 'Alle müssen zutreffen' : 'Mindestens eine muss zutreffen' }}
              </p>
            </div>
          </div>

          <!-- Instructor Note -->
          <div v-if="currentPhase?.instructorNote">
            <p class="text-xs text-white/40 uppercase tracking-wider mb-1">Instructor-Hinweis</p>
            <p class="text-sm text-white/60 leading-relaxed italic">{{ currentPhase.instructorNote }}</p>
          </div>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" class="text-white/50" @click="showDetails = false">Schließen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══════ Restart confirmation dialog ═══════ -->
    <v-dialog v-model="showRestartConfirm" max-width="340">
      <v-card class="rounded-2xl bg-[#0b1328] border border-white/10">
        <v-card-title class="text-base font-semibold pt-5 px-5">Nochmal von vorne?</v-card-title>
        <v-card-text class="text-sm text-white/60 px-5">
          Der aktuelle Fortschritt geht verloren.
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" class="text-white/50" @click="showRestartConfirm = false">Abbrechen</v-btn>
          <v-btn color="primary" variant="flat" class="rounded-xl" @click="handleRestart">Neustart</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { takeoffEddf } from '~~/shared/data/flightlab/takeoff-eddf'
import { useFlightLabEngine } from '~~/shared/composables/flightlab/useFlightLabEngine'
import { useFlightLabAudio } from '~~/shared/composables/flightlab/useFlightLabAudio'
import { useFlightLabSync } from '~~/shared/composables/flightlab/useFlightLabSync'
import type { FlightLabButton, SimCondition, FlightLabTelemetryState } from '~~/shared/data/flightlab/types'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false, middleware: ['require-auth'] })
useHead({ title: 'FlightLab - Dein erster Start' })

const engine = useFlightLabEngine(takeoffEddf)
const audio = useFlightLabAudio()
const sync = useFlightLabSync()
const authStore = useAuthStore()

const joinCode = ref('')
const showRestartConfirm = ref(false)
const showDetails = ref(false)
const sidebarOpen = ref(false)

// --- Direct Bridge Telemetry Polling (solo mode, no WS session) ---
let telemetryPollInterval: ReturnType<typeof setInterval> | null = null

function startTelemetryPolling() {
  stopTelemetryPolling()
  if (!authStore.accessToken || sync.isConnected.value) return
  telemetryPollInterval = setInterval(async () => {
    try {
      const res = await $fetch<{ telemetry: FlightLabTelemetryState | null }>('/api/flightlab/telemetry', {
        headers: { Authorization: `Bearer ${authStore.accessToken}` },
      })
      if (res.telemetry) {
        engine.updateTelemetry(res.telemetry)
      }
    } catch {}
  }, 500)
}

function stopTelemetryPolling() {
  if (telemetryPollInterval) {
    clearInterval(telemetryPollInterval)
    telemetryPollInterval = null
  }
}

// Start polling when phase has simConditions (solo mode only)
watch(() => engine.currentPhase.value, (phase) => {
  if (phase?.simConditions && !sync.isConnected.value) {
    startTelemetryPolling()
  } else {
    stopTelemetryPolling()
  }
}, { immediate: true })

const currentPhase = computed(() => engine.currentPhase.value)

// Main phase IDs for sidebar stepper
const mainPhaseIds = ['welcome', 'briefing', 'runway', 'engines_pre', 'engines_spool', 'takeoff_roll', 'rotation', 'gear_retract', 'climb', 'climb_high', 'leveloff', 'debrief', 'end']

// Collect all unique sound IDs for preloading
const allSoundIds = computed(() => {
  const ids = new Set<string>()
  for (const phase of takeoffEddf.phases) {
    if (phase.sounds) {
      for (const s of phase.sounds) ids.add(s.id)
    }
  }
  return [...ids]
})

// --- Phase Stepper Helpers ---

function getPhaseLabel(id: string): string {
  const labels: Record<string, string> = {
    welcome: 'Willkommen',
    briefing: 'Briefing',
    runway: 'Startbahn',
    engines_pre: 'Triebwerke (Vorb.)',
    engines_spool: 'Triebwerke (Schub)',
    takeoff_roll: 'Startlauf',
    rotation: 'Abheben',
    gear_retract: 'Fahrwerk ein',
    climb: 'Steigflug',
    climb_high: 'Steigflug (hoch)',
    leveloff: 'Level-off',
    debrief: 'Nachbesprechung',
    end: 'Ende',
  }
  return labels[id] || id
}

function isPhaseActive(phaseId: string): boolean {
  // Check if we're on this main phase or one of its sub-phases
  if (engine.currentPhaseId.value === phaseId) return true
  // Check if current phase is a sub-phase of this main phase
  const idx = mainPhaseIds.indexOf(phaseId)
  const nextMain = mainPhaseIds[idx + 1]
  if (idx >= 0 && !mainPhaseIds.includes(engine.currentPhaseId.value)) {
    // We're in a sub-phase — find closest main phase from history
    for (let i = engine.history.value.length - 1; i >= 0; i--) {
      const entry = engine.history.value[i]
      if (entry && mainPhaseIds.includes(entry.phaseId)) {
        return entry.phaseId === phaseId
      }
    }
  }
  return false
}

function isPhaseCompleted(phaseId: string, idx: number): boolean {
  const currentIdx = mainPhaseIds.indexOf(engine.currentPhaseId.value)
  if (currentIdx > idx) return true
  // If we're in a sub-phase, check from history
  if (currentIdx === -1) {
    for (let i = engine.history.value.length - 1; i >= 0; i--) {
      const entry = engine.history.value[i]
      if (entry && mainPhaseIds.includes(entry.phaseId)) {
        return mainPhaseIds.indexOf(entry.phaseId) > idx
      }
    }
  }
  return false
}

function getPhaseStepClass(phaseId: string, idx: number): string {
  if (isPhaseActive(phaseId)) return 'bg-cyan-500/10 border border-cyan-400/20'
  if (isPhaseCompleted(phaseId, idx)) return 'hover:bg-emerald-500/5'
  return 'opacity-50 hover:opacity-70'
}

function handlePhaseJump(phaseId: string) {
  engine.goToPhase(phaseId)
  if (sync.isConnected.value) {
    sync.sendParticipantAction(engine.currentPhaseId.value, 'jump', phaseId)
  }
}

// --- SimBridge Condition Helpers ---

const conditionLabels: Record<string, string> = {
  AIRSPEED_INDICATED: 'Geschwindigkeit',
  GROUND_VELOCITY: 'Bodengeschw.',
  VERTICAL_SPEED: 'Steigrate',
  PLANE_ALTITUDE: 'Höhe',
  PLANE_PITCH_DEGREES: 'Neigung',
  TURB_ENG_N1_1: 'Engine 1 N1',
  TURB_ENG_N1_2: 'Engine 2 N1',
  SIM_ON_GROUND: 'Am Boden',
  GEAR_HANDLE_POSITION: 'Fahrwerk',
  FLAPS_HANDLE_INDEX: 'Klappen',
  BRAKE_PARKING_POSITION: 'Parkbremse',
  AUTOPILOT_MASTER: 'Autopilot',
}

const conditionUnits: Record<string, string> = {
  AIRSPEED_INDICATED: 'kts',
  GROUND_VELOCITY: 'kts',
  VERTICAL_SPEED: 'fpm',
  PLANE_ALTITUDE: 'ft',
  PLANE_PITCH_DEGREES: '°',
  TURB_ENG_N1_1: '%',
  TURB_ENG_N1_2: '%',
  FLAPS_HANDLE_INDEX: '',
}

const operatorLabels: Record<string, string> = {
  '>': 'größer als',
  '<': 'kleiner als',
  '>=': 'mindestens',
  '<=': 'höchstens',
  '==': 'gleich',
  '!=': 'ungleich',
}

function formatCondition(cond: SimCondition): string {
  const label = conditionLabels[cond.variable] || cond.variable
  const op = operatorLabels[cond.operator] || cond.operator
  const unit = conditionUnits[cond.variable] || ''
  if (typeof cond.value === 'boolean') {
    if (cond.variable === 'SIM_ON_GROUND') return cond.value ? `${label}: Ja` : `${label}: Nein (in der Luft)`
    if (cond.variable === 'GEAR_HANDLE_POSITION') return cond.value ? `${label}: Ausgefahren` : `${label}: Eingefahren`
    if (cond.variable === 'BRAKE_PARKING_POSITION') return cond.value ? `${label}: Angezogen` : `${label}: Gelöst`
    return `${label}: ${cond.value ? 'An' : 'Aus'}`
  }
  return `${label} ${op} ${cond.value}${unit ? ' ' + unit : ''}`
}

function getCurrentValue(cond: SimCondition): string {
  const telemetry = engine.currentTelemetry.value
  if (!telemetry) return '—'
  const val = telemetry[cond.variable]
  if (typeof val === 'number') return val.toFixed(typeof cond.value === 'number' && cond.value % 1 === 0 ? 0 : 1)
  if (typeof val === 'boolean') return val ? 'Ja' : 'Nein'
  return '—'
}

function getCurrentBooleanLabel(cond: SimCondition): string {
  const telemetry = engine.currentTelemetry.value
  if (!telemetry) return 'Keine Daten'
  const val = telemetry[cond.variable]
  if (cond.variable === 'BRAKE_PARKING_POSITION') return val ? 'Angezogen' : 'Gelöst'
  if (cond.variable === 'GEAR_HANDLE_POSITION') return val ? 'Ausgefahren' : 'Eingefahren'
  if (cond.variable === 'SIM_ON_GROUND') return val ? 'Am Boden' : 'In der Luft'
  return val ? 'An' : 'Aus'
}

function isConditionMet(cond: SimCondition): boolean {
  const telemetry = engine.currentTelemetry.value
  if (!telemetry) return false
  const actual = telemetry[cond.variable]
  const expected = cond.value
  switch (cond.operator) {
    case '>': return (actual as number) > (expected as number)
    case '<': return (actual as number) < (expected as number)
    case '>=': return (actual as number) >= (expected as number)
    case '<=': return (actual as number) <= (expected as number)
    case '==': return actual === expected
    case '!=': return actual !== expected
    default: return false
  }
}

function getConditionIcon(cond: SimCondition): string {
  return isConditionMet(cond) ? '✓' : '✗'
}

function getConditionProgress(cond: SimCondition): number {
  if (typeof cond.value !== 'number') return 0
  const telemetry = engine.currentTelemetry.value
  if (!telemetry) return 0
  const actual = telemetry[cond.variable] as number
  if (typeof actual !== 'number') return 0
  // Compute progress as ratio toward target
  const target = cond.value
  if (target === 0) return actual === 0 ? 100 : 0
  return Math.min(100, Math.max(0, (actual / target) * 100))
}

function getTargetPosition(cond: SimCondition): number {
  // Where the target marker sits (always at 100% for simplicity since bar shows progress toward target)
  return 100
}

// --- Button handling ---

function getButtonColor(type?: string) {
  switch (type) {
    case 'primary': return 'primary'
    case 'comfort': return 'amber'
    case 'info': return undefined
    default: return undefined
  }
}

function handleButtonPress(btn: FlightLabButton) {
  if (engine.isPaused.value || audio.isSpeaking.value) return
  engine.selectOption(btn)
  if (sync.isConnected.value) {
    sync.sendParticipantAction(engine.currentPhaseId.value, btn.id, btn.next)
  }
}

async function handleJoin() {
  if (joinCode.value.length !== 4) return
  try {
    await sync.joinSession(joinCode.value)
    // Switch to WS-based telemetry
    stopTelemetryPolling()
    if (authStore.user?.id) {
      sync.subscribeTelemetry(authStore.user.id)
    }
  } catch (e) {
    console.error('[FlightLab] Join failed:', e)
  }
}

function handleRestart() {
  showRestartConfirm.value = false
  audio.stopAllSounds()
  audio.clearReplayCache()
  engine.restart()
  if (sync.isConnected.value) {
    sync.sendParticipantAction('restart', 'restart', 'welcome')
  }
}

// --- Help message TTS callback ---
engine.setOnHelpMessage(async (text: string) => {
  await audio.speakAtcMessage(text, { speed: 0.85, readability: 5 })
})

// Watch phase changes to trigger TTS + sounds
watch(() => engine.currentPhaseId.value, async (newId, oldId) => {
  if (!newId || newId === oldId) return
  const phase = engine.currentPhase.value
  if (!phase) return
  if (phase.sounds && phase.sounds.length > 0) {
    audio.handlePhaseSounds(phase.sounds)
  }
  if (phase.atcMessage) {
    await audio.speakAtcMessage(phase.atcMessage, { speed: 0.9, readability: 5 })
  }
})

// Listen for telemetry from WebSocket (bridge → server → here)
sync.onTelemetry((data: any) => {
  engine.updateTelemetry(data as FlightLabTelemetryState)
})

// Listen for instructor commands via WebSocket
sync.onStateChange((state) => {
  if (state.currentPhaseId !== engine.currentPhaseId.value) {
    engine.goToPhase(state.currentPhaseId)
  }
  engine.isPaused.value = state.isPaused
})

sync.onInstructorMessage(async (text, withRadioEffect) => {
  if (withRadioEffect) {
    await audio.speakAtcMessage(text, { speed: 0.9, readability: 5 })
  }
})

sync.onError((msg) => {
  console.warn('[FlightLab] WS error:', msg)
})

onMounted(async () => {
  await audio.preloadSounds(allSoundIds.value)

  // Speak initial welcome
  const phase = engine.currentPhase.value
  if (phase?.atcMessage) {
    setTimeout(() => {
      audio.speakAtcMessage(phase.atcMessage, { speed: 0.9, readability: 5 })
    }, 500)
  }
})

onBeforeUnmount(() => {
  stopTelemetryPolling()
  engine.cleanup()
  audio.dispose()
  sync.disconnect()
})
</script>

<style scoped>
/* ═══════ Global progress glow ═══════ */
.global-progress-glow {
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.4), 0 0 4px rgba(34, 211, 238, 0.2);
}

/* ═══════ Sidebar transition ═══════ */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}

.sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}
.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

/* ═══════ Phase enter transition ═══════ */
.phase-enter-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.phase-enter-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.phase-enter-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}
.phase-enter-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

/* ═══════ Fade slide transition ═══════ */
.fade-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ═══════ Fade scale transition ═══════ */
.fade-scale-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-scale-leave-active {
  transition: all 0.2s ease;
}
.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.8);
}
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* ═══════ Button list transition ═══════ */
.btn-list-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-list-leave-active {
  transition: all 0.2s ease;
}
.btn-list-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}
.btn-list-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
.btn-list-move {
  transition: transform 0.3s ease;
}

/* ═══════ Voice animation bars ═══════ */
.voice-bars {
  height: 24px;
}
.voice-bar {
  display: inline-block;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(to top, rgba(34, 211, 238, 0.6), rgba(34, 211, 238, 1));
  animation: voice-bounce 0.6s ease-in-out infinite alternate;
}
.voice-bar:nth-child(1) { height: 8px; }
.voice-bar:nth-child(2) { height: 14px; }
.voice-bar:nth-child(3) { height: 6px; }
.voice-bar:nth-child(4) { height: 18px; }
.voice-bar:nth-child(5) { height: 10px; }
.voice-bar:nth-child(6) { height: 16px; }
.voice-bar:nth-child(7) { height: 7px; }
.voice-bar:nth-child(8) { height: 12px; }

@keyframes voice-bounce {
  0% { transform: scaleY(0.3); opacity: 0.5; }
  100% { transform: scaleY(1); opacity: 1; }
}

/* ═══════ Phase progress animation ═══════ */
.phase-progress-animate {
  animation: phase-progress 8s linear forwards;
}
@keyframes phase-progress {
  from { width: 0%; }
  to { width: 100%; }
}

/* ═══════ Phase check enter animation ═══════ */
.phase-check-enter {
  animation: check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes check-pop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* ═══════ Finished icon animation ═══════ */
.finished-icon {
  animation: finished-pulse 2s ease-in-out infinite;
}
@keyframes finished-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.3); }
  50% { box-shadow: 0 0 20px 8px rgba(52, 211, 153, 0.15); }
}

/* ═══════ Skip button hover ═══════ */
.skip-btn:hover {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
}

/* ═══════ Auto-advance toggle compact styling ═══════ */
.auto-advance-toggle :deep(.v-switch__track) {
  height: 18px;
  min-width: 32px;
}
.auto-advance-toggle :deep(.v-switch__thumb) {
  height: 14px;
  width: 14px;
}
.auto-advance-toggle :deep(.v-selection-control) {
  min-height: 24px;
}
</style>
