<template>
  <div ref="pageRoot" class="h-screen bg-[#070d1a] text-white flex flex-col overflow-hidden">
    <!-- Global Progress Bar -->
    <div class="fixed top-0 left-0 right-0 z-50 h-1 bg-white/5">
      <div
        class="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 transition-all duration-1000 ease-out global-progress-glow"
        :style="{ width: `${engine.progress.value}%` }"
      />
    </div>

    <!-- Sidebar + Toggle -->
    <div
      class="fixed left-0 top-0 bottom-0 z-10 flex transition-transform duration-300"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-[300px]'"
    >
      <aside class="w-[300px] border-r border-white/5 bg-[#070d1a]/98 backdrop-blur-xl flex flex-col pt-6">
        <!-- Sidebar Header -->
        <div class="px-4 mb-4">
          <div class="flex items-center gap-2 mb-1">
            <v-icon icon="mdi-gauge" size="18" class="text-cyan-400/70" />
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
              v-for="(phaseId, idx) in sidebarPhaseIds"
              :key="phaseId"
              class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-300"
              :class="getPhaseStepClass(phaseId, idx)"
              @click="engine.goToPhase(phaseId)"
            >
              <div class="relative flex h-7 w-7 shrink-0 items-center justify-center">
                <div
                  v-if="isPhaseCompleted(phaseId, idx)"
                  class="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center phase-check-enter"
                >
                  <v-icon icon="mdi-check" size="14" class="text-emerald-300" />
                </div>
                <div
                  v-else-if="isPhaseActive(phaseId)"
                  class="h-7 w-7 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center"
                >
                  <div class="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <div v-else class="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span class="text-[10px] text-white/30 font-mono">{{ idx + 1 }}</span>
                </div>
                <div
                  v-if="idx < sidebarPhaseIds.length - 1"
                  class="absolute top-full left-1/2 -translate-x-1/2 w-px h-1 transition-colors duration-500"
                  :class="isPhaseCompleted(phaseId, idx) ? 'bg-emerald-400/30' : 'bg-white/5'"
                />
              </div>
              <span
                class="text-sm truncate transition-colors duration-300"
                :class="isPhaseActive(phaseId) ? 'text-cyan-200 font-medium' : isPhaseCompleted(phaseId, idx) ? 'text-emerald-300/70' : 'text-white/30'"
              >
                {{ phaseLabels[phaseId] || phaseId }}
              </span>
            </button>
          </div>
        </div>

        <!-- Goal Progress Panel -->
        <div
          v-if="currentPhase?.interactionGoal && !engine.goalMet.value"
          class="border-t border-white/5 p-4 shrink-0"
        >
          <div class="flex items-center gap-2 mb-3">
            <v-icon icon="mdi-target" size="16" class="text-cyan-400/70" />
            <span class="text-[10px] uppercase tracking-widest text-white/30">Aufgabe</span>
          </div>
          <!-- Progress bar -->
          <div class="relative h-2 rounded-full bg-white/10 overflow-hidden mb-2">
            <div
              class="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
              :class="engine.goalProgress.value > 0.8 ? 'bg-emerald-400' : 'bg-cyan-500/70'"
              :style="{ width: `${Math.round(engine.goalProgress.value * 100)}%` }"
            />
          </div>
          <p class="text-xs text-white/40">
            {{ goalDescription }}
          </p>
        </div>

        <!-- Goal met indicator -->
        <div
          v-if="engine.goalMet.value"
          class="border-t border-white/5 p-4 shrink-0"
        >
          <div class="flex items-center gap-2 text-emerald-300">
            <v-icon icon="mdi-check-circle" size="18" />
            <span class="text-sm font-medium">Geschafft!</span>
          </div>
        </div>
      </aside>
      <button
        class="flex h-12 w-6 self-center items-center justify-center rounded-r-lg border border-l-0 border-white/10 bg-[#0b1328]/95 backdrop-blur text-white/40 hover:text-white/80 hover:bg-[#0b1328] transition-colors duration-300"
        @click="sidebarOpen = !sidebarOpen"
      >
        <v-icon :icon="sidebarOpen ? 'mdi-chevron-left' : 'mdi-chevron-right'" size="16" />
      </button>
    </div>

    <!-- Header Bar -->
    <header class="shrink-0 border-b border-white/5 bg-[#070d1a]/90 backdrop-blur px-4 py-3 mt-1 relative z-20">
      <div class="mx-auto flex max-w-screen-2xl items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <NuxtLink to="/flightlab/medienstationen" class="text-white/40 transition hover:text-white/80">
            <v-icon icon="mdi-arrow-left" size="20" />
          </NuxtLink>
          <div class="flex items-center gap-2">
            <v-icon icon="mdi-gauge" size="18" class="text-cyan-400/70" />
            <span class="text-sm font-medium text-white/70">{{ engine.scenario.title }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Touch input connection status -->
          <div v-if="sync.isConnected.value" class="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5">
            <v-icon icon="mdi-gamepad-variant" size="16" class="text-cyan-400/70" />
            <span class="text-xs text-white/50">Input:</span>
            <span class="text-xs font-semibold text-cyan-200">Direkt verbunden</span>
            <v-icon
              v-if="sync.isConnected.value"
              icon="mdi-wifi"
              size="14"
              class="text-emerald-400"
              title="Verbunden"
            />
          </div>
          <div v-else-if="wsConnected" class="flex items-center gap-1.5 text-xs text-white/30">
            <v-icon icon="mdi-loading" size="14" class="animate-spin text-cyan-400/50" />
            Session wird erstellt...
          </div>

          <v-btn
            v-if="canFullscreen"
            size="small"
            variant="text"
            :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
            class="text-white/50"
            :title="isFullscreen ? 'Vollbild beenden' : 'Vollbild aktivieren'"
            @click="toggleFullscreen"
          />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main
      class="flex-1 flex flex-col overflow-hidden transition-all duration-300"
      :class="{ 'sm:ml-[300px]': sidebarOpen }"
    >
      <!-- Dynamic Layout: 3D Model + PFD -->
      <div
        class="flex-1 grid transition-all duration-600 ease-in-out gap-2 p-2"
        :style="layoutGridStyle"
      >
        <!-- 3D Aircraft Model -->
        <div class="relative rounded-2xl overflow-hidden border border-white/5 bg-[#050a15] min-h-[200px]">
          <ClientOnly>
            <FlightlabPfdAircraftModel
              :pitch="fbw.state.pitch"
              :bank-angle="fbw.state.bankAngle"
              :heading="fbw.state.heading"
              :speed="fbw.state.speed"
              :altitude="fbw.state.altitude"
            />
          </ClientOnly>
          <!-- Altitude/Speed overlay on 3D model -->
          <div class="absolute bottom-3 left-3 flex gap-2 text-xs font-mono text-white/40">
            <span>{{ Math.round(fbw.state.speed) }} kt</span>
            <span>{{ Math.round(fbw.state.altitude) }} ft</span>
            <span>HDG {{ String(Math.round(fbw.state.heading) % 360).padStart(3, '0') }}</span>
          </div>
        </div>

        <!-- PFD Instruments -->
        <div class="relative flex items-center justify-center rounded-2xl overflow-hidden border border-white/5 bg-[#030712] min-h-[200px]">
          <!-- Black screen when no elements visible -->
          <Transition name="fade-scale">
            <div
              v-if="engine.visibleElements.value.length === 0"
              class="absolute inset-0 bg-[#030712] flex items-center justify-center"
            >
              <div class="text-center">
                <div class="h-20 w-20 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center mb-4 mx-auto">
                  <v-icon icon="mdi-monitor" size="36" class="text-white/10" />
                </div>
                <p class="text-sm text-white/20">Display aus</p>
              </div>
            </div>
          </Transition>

          <!-- PFD Container -->
          <FlightlabPfdContainer
            :pitch="fbw.state.pitch"
            :bank-angle="fbw.state.bankAngle"
            :heading="fbw.state.heading"
            :speed="fbw.state.speed"
            :altitude="fbw.state.altitude"
            :vertical-speed="fbw.state.verticalSpeed"
            :speed-target-range="speedTargetRange"
            :visible-elements="engine.visibleElements.value"
            :scale="pfdScale"
          />
        </div>
      </div>

      <!-- Bottom: Instruction Panel -->
      <div class="shrink-0 px-2 pb-2">
        <div class="mx-auto max-w-screen-lg">
          <!-- Goal Hint Banner -->
          <Transition name="fade-slide">
            <div
              v-if="engine.showingGoalHint.value && engine.goalHintText.value"
              class="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 mb-2"
            >
              <div class="flex items-start gap-3">
                <v-icon icon="mdi-lightbulb" size="22" class="text-amber-300 mt-0.5 shrink-0" />
                <div class="flex-1">
                  <p class="text-sm text-amber-200 leading-relaxed">{{ engine.goalHintText.value }}</p>
                  <v-btn
                    size="small"
                    variant="text"
                    color="amber"
                    class="mt-2 -ml-2"
                    @click="engine.dismissGoalHint()"
                  >
                    Verstanden
                  </v-btn>
                </div>
              </div>
            </div>
          </Transition>

          <!-- ATC Message + Buttons -->
          <Transition name="phase-enter" mode="out-in">
            <div
              v-if="currentPhase"
              :key="engine.currentPhaseId.value"
              class="rounded-2xl border border-white/10 bg-[#0b1328]/90 p-4 sm:p-6 shadow-xl shadow-cyan-500/5"
            >
              <!-- Voice animation + Skip -->
              <div v-if="audio.isSpeaking.value" class="mb-3 flex items-center gap-2">
                <div class="voice-bars flex items-end gap-[3px]">
                  <span v-for="i in 8" :key="i" class="voice-bar" :style="{ animationDelay: `${(i - 1) * 80}ms` }" />
                </div>
                <span class="text-xs text-cyan-300/70">Spricht...</span>
                <v-spacer />
                <button
                  class="skip-btn flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/50 hover:text-white/80 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                  @click="audio.skipSpeech()"
                >
                  <v-icon icon="mdi-skip-next" size="14" />
                  <span>Skip</span>
                </button>
              </div>

              <!-- Phase progress bar -->
              <div v-if="audio.isSpeaking.value" class="mb-3 h-0.5 rounded-full bg-white/5 overflow-hidden">
                <div class="h-full bg-cyan-400/50 rounded-full phase-progress-animate" />
              </div>

              <!-- ATC text -->
              <p class="text-base sm:text-lg leading-relaxed text-white/90 font-light">
                {{ currentPhase.atcMessage }}
              </p>

              <!-- Replay + Details -->
              <div class="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
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
                  Nochmal
                </v-btn>
                <v-spacer />
                <v-btn
                  v-if="currentPhase.explanation"
                  size="small"
                  variant="text"
                  class="text-white/40 -mr-2"
                  prepend-icon="mdi-information-outline"
                  @click="showDetails = true"
                >
                  Details
                </v-btn>
              </div>

              <!-- Buttons -->
              <div v-if="currentPhase.buttons?.length" class="mt-3 flex flex-wrap gap-2">
                <v-btn
                  v-for="btn in currentPhase.buttons"
                  :key="btn.id"
                  :color="btn.type === 'primary' ? 'primary' : undefined"
                  :variant="btn.type === 'primary' ? 'flat' : 'outlined'"
                  size="default"
                  class="rounded-xl"
                  :class="{ 'border-white/10': btn.type !== 'primary' }"
                  :disabled="engine.isPaused.value || audio.isSpeaking.value"
                  :prepend-icon="btn.icon"
                  @click="handleButtonPress(btn)"
                >
                  {{ btn.label }}
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
              <p class="text-lg font-semibold text-emerald-200">Du verstehst das PFD!</p>
              <NuxtLink to="/flightlab/medienstationen" class="mt-3 inline-block">
                <v-btn variant="outlined" color="cyan" prepend-icon="mdi-arrow-left" class="rounded-xl">
                  Zurück zu Medienstationen
                </v-btn>
              </NuxtLink>
            </div>
          </Transition>
        </div>
      </div>
    </main>

    <!-- Details Dialog -->
    <v-dialog v-model="showDetails" max-width="440">
      <v-card class="rounded-2xl bg-[#0b1328] border border-white/10">
        <v-card-title class="text-base font-semibold pt-5 px-5 flex items-center gap-2">
          <v-icon icon="mdi-information-outline" size="20" class="text-cyan-400" />
          Details
        </v-card-title>
        <v-card-text class="px-5">
          <p v-if="currentPhase?.explanation" class="text-sm text-white/80 leading-relaxed">
            {{ currentPhase.explanation }}
          </p>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" class="text-white/50" @click="showDetails = false">Schließen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { learnPfd } from '~~/shared/data/flightlab/learn-pfd'
import { useAirbusFBW } from '~~/shared/composables/flightlab/useAirbusFBW'
import { useLearnPfdEngine } from '~~/shared/composables/flightlab/useLearnPfdEngine'
import { useFlightLabAudio } from '~~/shared/composables/flightlab/useFlightLabAudio'
import { useFlightLabSync } from '~~/shared/composables/flightlab/useFlightLabSync'
import type { FlightLabButton } from '~~/shared/data/flightlab/types'

definePageMeta({ layout: false, middleware: ['require-auth'] })
useHead({ title: 'FlightLab - PFD verstehen' })

// --- Core composables ---
const fbw = useAirbusFBW()
const engine = useLearnPfdEngine(learnPfd, fbw.state)
const audio = useFlightLabAudio()
const sync = useFlightLabSync()

// --- UI state ---
const showDetails = ref(false)
const sidebarOpen = ref(true)
const pageRoot = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const canFullscreen = ref(false)
const wsConnected = ref(false)
const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']

let initialSpeechTimeout: ReturnType<typeof setTimeout> | null = null

// --- Sidebar phase IDs (main phases only) ---
const sidebarPhaseIds = ['welcome', 'horizon_intro', 'pitch_intro', 'speed_intro', 'speed_hold_pitch', 'alt_intro', 'vs_intro', 'heading_intro', 'combined', 'free_practice', 'end']

const phaseLabels: Record<string, string> = {
  welcome: 'Willkommen',
  horizon_intro: 'Horizont',
  pitch_intro: 'Pitch',
  speed_intro: 'Schub 70%',
  speed_hold_pitch: 'Speed halten',
  alt_intro: 'Altitude Tape',
  vs_intro: 'Vertical Speed',
  heading_intro: 'Heading',
  combined: 'Zusammenspiel',
  free_practice: 'Freies Üben',
  end: 'Ende',
}

const currentPhase = computed(() => engine.currentPhase.value)
const speedTargetRange = computed(() => currentPhase.value?.speedTargetRange ?? null)
const isPitchSpeedHoldPhase = computed(() => engine.currentPhaseId.value === 'speed_hold_pitch')

// --- PFD Scale (responsive) ---
const pfdScale = computed(() => {
  // Base dimensions are 631x550 (licarth reference proportions)
  // Scale to fit learning UI layout while keeping instruments readable
  if (engine.layoutMode.value === 'model-focus') return 0.7
  if (engine.layoutMode.value === 'pfd-focus') return 0.95
  return 0.82
})

// --- Layout ---
const layoutGridStyle = computed(() => {
  switch (engine.layoutMode.value) {
    case 'model-focus':
      return { gridTemplateColumns: '2fr 1fr' }
    case 'split':
      return { gridTemplateColumns: '1fr 1fr' }
    case 'pfd-focus':
      return { gridTemplateColumns: '1fr 2fr' }
    default:
      return { gridTemplateColumns: '1fr 1fr' }
  }
})

// --- Goal description for sidebar ---
const goalDescription = computed(() => {
  if (engine.currentPhaseId.value === 'speed_hold_pitch') {
    return 'Geschwindigkeit im roten Band halten (nur mit Pitch bei 70% Schub)'
  }

  const goal = currentPhase.value?.interactionGoal
  if (!goal) return ''
  const labels: Record<string, string> = {
    pitch: 'Pitch',
    bankAngle: 'Querneigung',
    heading: 'Heading',
    speed: 'Geschwindigkeit',
    altitude: 'Höhe',
    verticalSpeed: 'Steigrate',
    throttlePercent: 'Schub',
  }
  const unit = goal.parameter === 'throttlePercent' ? '%' : ''
  return `${labels[goal.parameter] || goal.parameter}: ${goal.target}${unit} (± ${goal.tolerance}${unit})`
})

// --- Phase stepper helpers ---
function isPhaseActive(phaseId: string): boolean {
  if (engine.currentPhaseId.value === phaseId) return true
  if (!sidebarPhaseIds.includes(engine.currentPhaseId.value)) {
    for (let i = engine.history.value.length - 1; i >= 0; i--) {
      const entry = engine.history.value[i]
      if (entry && sidebarPhaseIds.includes(entry.phaseId)) {
        return entry.phaseId === phaseId
      }
    }
  }
  return false
}

function isPhaseCompleted(phaseId: string, idx: number): boolean {
  const currentIdx = sidebarPhaseIds.indexOf(engine.currentPhaseId.value)
  if (currentIdx > idx) return true
  if (currentIdx === -1) {
    for (let i = engine.history.value.length - 1; i >= 0; i--) {
      const entry = engine.history.value[i]
      if (entry && sidebarPhaseIds.includes(entry.phaseId)) {
        return sidebarPhaseIds.indexOf(entry.phaseId) > idx
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

// --- Fullscreen ---
function onFullscreenChange() {
  if (typeof document === 'undefined') return
  isFullscreen.value = Boolean(document.fullscreenElement)
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (initialSpeechTimeout) {
    clearTimeout(initialSpeechTimeout)
    initialSpeechTimeout = null
  }
  audio.skipSpeech()
}

async function toggleFullscreen() {
  if (typeof document === 'undefined') return
  try {
    if (!document.fullscreenElement) {
      const target = pageRoot.value ?? document.documentElement
      if (target.requestFullscreen) {
        await target.requestFullscreen()
      }
    } else if (document.exitFullscreen) {
      await document.exitFullscreen()
    }
  } catch (error) {
    console.error('Failed to toggle fullscreen', error)
  }
}

// --- Button handling ---
function handleButtonPress(btn: FlightLabButton) {
  if (engine.isPaused.value || audio.isSpeaking.value) return
  engine.selectOption(btn)
}

// --- Goal hint TTS callback ---
engine.onGoalHint(async (text: string) => {
  await audio.speakAtcMessage(text, { speed: 0.85, readability: 5 })
})
engine.setAutoAdvanceBlocker(() => audio.isSpeaking.value)

// --- WebSocket stick input ---
sync.onStickInput((data) => {
  fbw.updateInput({
    pitch: data.pitch,
    roll: data.roll,
    throttle: isPitchSpeedHoldPhase.value ? 0.7 : data.throttle,
  })
})

// --- TTS on phase change ---
watch(() => engine.currentPhaseId.value, async (newId, oldId) => {
  if (!newId || newId === oldId) return
  if (newId === 'speed_hold_pitch') {
    fbw.updateInput({ throttle: 0.7 })
  }
  if (initialSpeechTimeout) {
    clearTimeout(initialSpeechTimeout)
    initialSpeechTimeout = null
  }
  audio.skipSpeech()
  const phase = engine.currentPhase.value
  if (!phase) return
  if (phase.atcMessage) {
    await audio.speakAtcMessage(phase.atcMessage, { speed: 0.9, readability: 5 })
  }
})

// --- Lifecycle ---
onMounted(async () => {
  // Start FBW physics
  fbw.start()

  if (typeof document !== 'undefined') {
    canFullscreen.value = document.fullscreenEnabled !== false
    fullscreenEvents.forEach((eventName) => {
      document.addEventListener(eventName, onFullscreenChange)
    })
    onFullscreenChange()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onGlobalKeydown)
  }

  // Create WebSocket session for stick input
  try {
    await sync.createSession('learn-pfd')
    wsConnected.value = true
  } catch (e) {
    console.warn('[learn-pfd] WS session creation failed:', e)
  }

  // Speak initial welcome
  const phase = engine.currentPhase.value
  if (phase?.atcMessage) {
    initialSpeechTimeout = setTimeout(() => {
      audio.speakAtcMessage(phase.atcMessage, { speed: 0.9, readability: 5 })
      initialSpeechTimeout = null
    }, 500)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onGlobalKeydown)
  }
  if (typeof document !== 'undefined') {
    fullscreenEvents.forEach((eventName) => {
      document.removeEventListener(eventName, onFullscreenChange)
    })
  }
  if (initialSpeechTimeout) {
    clearTimeout(initialSpeechTimeout)
    initialSpeechTimeout = null
  }
  sync.disconnect()
  fbw.cleanup()
  engine.cleanup()
  audio.dispose()
})
</script>

<style scoped>
/* Global progress glow */
.global-progress-glow {
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.4), 0 0 4px rgba(34, 211, 238, 0.2);
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

/* Layout grid transition */
.duration-600 {
  transition-duration: 600ms;
}

/* Phase enter transition */
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

/* Fade slide transition */
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

/* Fade scale transition */
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

/* Voice animation bars */
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

/* Phase progress animation */
.phase-progress-animate {
  animation: phase-progress 8s linear forwards;
}
@keyframes phase-progress {
  from { width: 0%; }
  to { width: 100%; }
}

/* Phase check enter animation */
.phase-check-enter {
  animation: check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes check-pop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Finished icon animation */
.finished-icon {
  animation: finished-pulse 2s ease-in-out infinite;
}
@keyframes finished-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.3); }
  50% { box-shadow: 0 0 20px 8px rgba(52, 211, 153, 0.15); }
}

/* Skip button hover */
.skip-btn:hover {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
}
</style>
