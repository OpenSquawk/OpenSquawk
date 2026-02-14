<template>
  <div class="min-h-screen bg-[#070d1a] text-white">
    <!-- Header -->
    <header class="shrink-0 border-b border-white/5 bg-[#070d1a]/90 backdrop-blur px-4 py-3">
      <div class="mx-auto flex max-w-screen-2xl items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <NuxtLink to="/flightlab" class="text-white/40 transition hover:text-white/80">
            <v-icon icon="mdi-arrow-left" size="20" />
          </NuxtLink>
          <v-icon icon="mdi-account-tie" size="20" class="text-cyan-400/70" />
          <span class="text-sm font-medium text-white/70">Instructor Panel</span>
        </div>
        <div class="flex items-center gap-3">
          <!-- Session Code -->
          <div class="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-center">
            <p class="text-[10px] uppercase tracking-widest text-cyan-300/60">Session</p>
            <p class="text-2xl font-bold font-mono tracking-[0.2em] text-cyan-200">{{ sync.sessionCode.value || '----' }}</p>
          </div>
          <!-- Connection status -->
          <div class="flex items-center gap-2 rounded-full px-3 py-1.5" :class="participantConnected ? 'bg-emerald-500/10 border border-emerald-400/30' : 'bg-white/5 border border-white/10'">
            <div class="h-2 w-2 rounded-full" :class="participantConnected ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'" />
            <span class="text-xs" :class="participantConnected ? 'text-emerald-300' : 'text-white/40'">
              {{ participantConnected ? 'Teilnehmer verbunden' : 'Warte auf Teilnehmer...' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-screen-2xl p-4 sm:p-6">
      <div class="grid gap-6 lg:grid-cols-[1fr_420px]">
        <!-- Left: Participant Mirror -->
        <div class="space-y-4">
          <!-- Current phase info -->
          <div class="rounded-2xl border border-white/10 bg-[#0b1328]/90 p-6">
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs uppercase tracking-widest text-white/40">Aktuelle Phase</span>
                <span class="rounded-full bg-cyan-500/10 border border-cyan-400/30 px-2.5 py-0.5 text-xs font-mono text-cyan-300">
                  {{ engine.currentPhaseId.value }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-1.5 w-32 rounded-full bg-white/10 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-cyan-400 transition-all duration-500"
                    :style="{ width: `${engine.progress.value}%` }"
                  />
                </div>
                <span class="text-xs text-white/40 tabular-nums">{{ engine.progress.value }}%</span>
              </div>
            </div>

            <!-- ATC Message -->
            <p v-if="currentPhase" class="text-base leading-relaxed text-white/80">
              {{ currentPhase.atcMessage }}
            </p>

            <!-- Explanation -->
            <p v-if="currentPhase?.explanation" class="mt-3 text-sm text-white/40 border-t border-white/5 pt-3">
              {{ currentPhase.explanation }}
            </p>

            <!-- Participant buttons (read-only mirror) -->
            <div v-if="currentPhase" class="mt-4 flex flex-wrap gap-2">
              <v-chip
                v-for="btn in currentPhase.buttons"
                :key="btn.id"
                size="small"
                :color="btn.type === 'primary' ? 'cyan' : btn.type === 'comfort' ? 'amber' : 'default'"
                variant="outlined"
                :prepend-icon="btn.icon"
              >
                {{ btn.label }}
              </v-chip>
            </div>

            <!-- Instructor note -->
            <div v-if="currentPhase?.instructorNote" class="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3">
              <div class="flex items-start gap-2">
                <v-icon icon="mdi-lightbulb-outline" size="16" class="mt-0.5 text-amber-300/70" />
                <p class="text-sm text-amber-200/80">{{ currentPhase.instructorNote }}</p>
              </div>
            </div>
          </div>

          <!-- Anxiety alerts -->
          <div v-if="anxietyAlerts.length > 0" class="rounded-2xl border border-red-400/20 bg-red-500/5 p-4">
            <div class="mb-2 flex items-center gap-2">
              <v-icon icon="mdi-alert-circle" size="18" class="text-red-400" />
              <span class="text-sm font-semibold text-red-300">Angst-Signale</span>
            </div>
            <div class="space-y-1.5">
              <div v-for="alert in anxietyAlerts" :key="alert.timestamp" class="flex items-center gap-2 text-sm text-red-200/70">
                <span class="text-xs text-red-400/50 tabular-nums">{{ formatTime(alert.timestamp) }}</span>
                <span>{{ alert.message }}</span>
              </div>
            </div>
          </div>

          <!-- Participant log -->
          <div class="rounded-2xl border border-white/10 bg-[#0b1328]/90 p-4">
            <h3 class="mb-3 text-xs uppercase tracking-widest text-white/40">Teilnehmer-Verlauf</h3>
            <div class="max-h-60 space-y-1.5 overflow-y-auto">
              <div v-if="engine.history.value.length === 0" class="text-sm text-white/30 italic">Noch keine Aktionen</div>
              <div
                v-for="(entry, idx) in [...engine.history.value].reverse()"
                :key="idx"
                class="flex items-center gap-2 text-sm"
              >
                <span class="text-xs text-white/30 tabular-nums">{{ formatTime(entry.timestamp) }}</span>
                <span class="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-cyan-300/70">{{ entry.phaseId }}</span>
                <v-icon icon="mdi-arrow-right" size="12" class="text-white/20" />
                <span class="text-white/60">{{ entry.buttonId }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Instructor Controls -->
        <div class="space-y-4">
          <!-- Phase Control -->
          <div class="rounded-2xl border border-white/10 bg-[#0b1328]/90 p-4">
            <h3 class="mb-3 text-xs uppercase tracking-widest text-white/40">Phasen-Steuerung</h3>

            <div class="flex gap-2 mb-3">
              <v-btn
                variant="outlined"
                size="small"
                class="flex-1 rounded-xl border-white/10"
                prepend-icon="mdi-skip-previous"
                :disabled="!canSkipBack"
                @click="handleSkipBack"
              >
                Zurück
              </v-btn>
              <v-btn
                variant="outlined"
                size="small"
                class="flex-1 rounded-xl border-white/10"
                append-icon="mdi-skip-next"
                :disabled="!canSkipForward"
                @click="handleSkipForward"
              >
                Weiter
              </v-btn>
            </div>

            <!-- Phase selector -->
            <v-select
              v-model="selectedPhaseId"
              :items="mainPhases"
              item-title="label"
              item-value="id"
              label="Zu Phase springen"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3"
              @update:model-value="handleGoToPhase"
            />

            <!-- Pause/Resume -->
            <v-btn
              :color="engine.isPaused.value ? 'success' : 'warning'"
              variant="flat"
              block
              class="rounded-xl"
              :prepend-icon="engine.isPaused.value ? 'mdi-play' : 'mdi-pause'"
              @click="handlePauseToggle"
            >
              {{ engine.isPaused.value ? 'Fortsetzen' : 'Pausieren' }}
            </v-btn>
          </div>

          <!-- Custom Message -->
          <div class="rounded-2xl border border-white/10 bg-[#0b1328]/90 p-4">
            <h3 class="mb-3 text-xs uppercase tracking-widest text-white/40">Nachricht an Teilnehmer</h3>
            <v-textarea
              v-model="customMessage"
              variant="outlined"
              density="compact"
              rows="2"
              placeholder="Nachricht eingeben..."
              hide-details
              class="mb-3"
            />
            <div class="flex items-center gap-3">
              <v-checkbox
                v-model="withRadioEffect"
                label="Mit Funkeffekt"
                density="compact"
                hide-details
                class="flex-1"
              />
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                class="rounded-xl"
                :disabled="!customMessage.trim()"
                prepend-icon="mdi-send"
                @click="handleSendMessage"
              >
                Senden
              </v-btn>
            </div>
          </div>

          <!-- Restart -->
          <div class="rounded-2xl border border-white/10 bg-[#0b1328]/90 p-4">
            <v-btn
              color="error"
              variant="outlined"
              block
              class="rounded-xl"
              prepend-icon="mdi-refresh"
              @click="showRestartConfirm = true"
            >
              Szenario neustarten
            </v-btn>
          </div>

          <!-- Elapsed time -->
          <div class="rounded-2xl border border-white/10 bg-[#0b1328]/60 p-4 text-center">
            <p class="text-xs text-white/30 uppercase tracking-widest mb-1">Laufzeit</p>
            <p class="text-2xl font-mono text-white/60 tabular-nums">{{ elapsedTime }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Restart dialog -->
    <v-dialog v-model="showRestartConfirm" max-width="340">
      <v-card class="rounded-2xl bg-[#0b1328] border border-white/10">
        <v-card-title class="text-base font-semibold pt-5 px-5">Szenario neustarten?</v-card-title>
        <v-card-text class="text-sm text-white/60 px-5">
          Der gesamte Fortschritt wird zurückgesetzt. Der Teilnehmer startet bei Phase 1.
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" class="text-white/50" @click="showRestartConfirm = false">Abbrechen</v-btn>
          <v-btn color="error" variant="flat" class="rounded-xl" @click="handleRestart">Neustart</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { takeoffEddf } from '~~/shared/data/flightlab/takeoff-eddf'
import { useFlightLabEngine } from '~~/shared/composables/flightlab/useFlightLabEngine'
import { useFlightLabSync } from '~~/shared/composables/flightlab/useFlightLabSync'

definePageMeta({ layout: false, middleware: ['require-auth'] })
useHead({ title: 'FlightLab - Instructor Panel' })

// Guard: skip all logic on server
if (!import.meta.client) throw new Error('Client-only page')

const engine = useFlightLabEngine(takeoffEddf)
const sync = useFlightLabSync()

const customMessage = ref('')
const withRadioEffect = ref(true)
const showRestartConfirm = ref(false)
const selectedPhaseId = ref(engine.currentPhaseId.value)
const participantConnected = ref(false)
const elapsedTime = ref('00:00')
let elapsedTimer: ReturnType<typeof setInterval> | null = null

const currentPhase = computed(() => engine.currentPhase.value)

const mainPhaseIds = ['welcome', 'briefing', 'runway', 'engines_pre', 'engines_spool', 'takeoff_roll', 'rotation', 'gear_retract', 'climb', 'climb_high', 'leveloff', 'debrief', 'end']

const mainPhases = mainPhaseIds.map(id => ({
  id,
  label: getPhaseLabel(id),
}))

const canSkipBack = computed(() => {
  const idx = mainPhaseIds.indexOf(engine.currentPhaseId.value)
  return idx > 0
})

const canSkipForward = computed(() => {
  const idx = mainPhaseIds.indexOf(engine.currentPhaseId.value)
  return idx >= 0 && idx < mainPhaseIds.length - 1
})

// Track anxiety signals
const anxietyAlerts = computed(() => {
  const alerts: Array<{ message: string; timestamp: number }> = []
  for (const entry of engine.history.value) {
    const phase = takeoffEddf.phases.find(p => p.id === entry.phaseId)
    if (phase) {
      const btn = phase.buttons.find(b => b.id === entry.buttonId)
      if (btn?.instructorAlert) {
        alerts.push({ message: btn.instructorAlert, timestamp: entry.timestamp })
      }
    }
  }
  return alerts
})

function getPhaseLabel(id: string): string {
  const labels: Record<string, string> = {
    welcome: 'Willkommen',
    briefing: 'Briefing',
    runway: 'Startbahn',
    engines_pre: 'Triebwerke (Vorbereitung)',
    engines_spool: 'Triebwerke (Schub)',
    takeoff_roll: 'Startlauf',
    rotation: 'Abheben',
    gear_retract: 'Fahrwerk einfahren',
    climb: 'Steigflug',
    climb_high: 'Steigflug (hoch)',
    leveloff: 'Level-off',
    debrief: 'Nachbesprechung',
    end: 'Ende',
  }
  return labels[id] || id
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

function updateElapsed() {
  const diff = Math.floor((Date.now() - engine.startedAt.value) / 1000)
  const m = Math.floor(diff / 60).toString().padStart(2, '0')
  const s = (diff % 60).toString().padStart(2, '0')
  elapsedTime.value = `${m}:${s}`
}

function handlePauseToggle() {
  if (engine.isPaused.value) {
    engine.resume()
    sync.sendInstructorCommand('resume')
  } else {
    engine.pause()
    sync.sendInstructorCommand('pause')
  }
}

function handleSkipBack() {
  engine.skipBack()
  selectedPhaseId.value = engine.currentPhaseId.value
  sync.sendInstructorCommand('goto', engine.currentPhaseId.value)
}

function handleSkipForward() {
  engine.skipForward()
  selectedPhaseId.value = engine.currentPhaseId.value
  sync.sendInstructorCommand('goto', engine.currentPhaseId.value)
}

function handleGoToPhase(phaseId: string) {
  engine.goToPhase(phaseId)
  sync.sendInstructorCommand('goto', phaseId)
}

function handleSendMessage() {
  if (!customMessage.value.trim()) return
  sync.sendInstructorMessage(customMessage.value.trim(), withRadioEffect.value)
  customMessage.value = ''
}

function handleRestart() {
  showRestartConfirm.value = false
  engine.restart()
  selectedPhaseId.value = 'welcome'
  sync.sendInstructorCommand('restart')
}

// Sync: listen for participant actions
sync.onStateChange((state) => {
  if (state.currentPhaseId !== engine.currentPhaseId.value) {
    engine.goToPhase(state.currentPhaseId)
    selectedPhaseId.value = state.currentPhaseId
  }
  participantConnected.value = state.participantConnected
  // Sync history
  engine.history.value = state.history
})

sync.onPeerJoined((role) => {
  if (role === 'participant') participantConnected.value = true
})

sync.onPeerLeft((role) => {
  if (role === 'participant') participantConnected.value = false
})

onMounted(async () => {
  // Create session
  try {
    await sync.createSession('takeoff-eddf')
  } catch (e) {
    console.error('[Instructor] WS connect failed:', e)
  }

  // Start elapsed timer
  elapsedTimer = setInterval(updateElapsed, 1000)
})

onBeforeUnmount(() => {
  if (elapsedTimer) clearInterval(elapsedTimer)
  sync.disconnect()
})
</script>
