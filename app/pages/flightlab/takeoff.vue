<template>
  <div class="min-h-screen bg-[#070d1a] text-white flex flex-col">
    <!-- Header Bar -->
    <header class="shrink-0 border-b border-white/5 bg-[#070d1a]/90 backdrop-blur px-4 py-3">
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

        <!-- Center: Progress -->
        <div class="hidden sm:flex items-center gap-2 flex-1 max-w-xs mx-4">
          <div class="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-700 ease-out"
              :style="{ width: `${engine.progress.value}%` }"
            />
          </div>
          <span class="text-xs text-white/40 tabular-nums">{{ engine.progress.value }}%</span>
        </div>

        <!-- Right: Session + Controls -->
        <div class="flex items-center gap-2">
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

      <!-- Mobile progress -->
      <div class="sm:hidden mt-2">
        <div class="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-700"
            :style="{ width: `${engine.progress.value}%` }"
          />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col justify-center px-4 py-6 sm:py-10">
      <div class="mx-auto w-full max-w-screen-sm space-y-6">
        <!-- Paused overlay -->
        <div v-if="engine.isPaused.value" class="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-center">
          <v-icon icon="mdi-pause-circle" size="24" class="text-amber-300 mb-1" />
          <p class="text-sm text-amber-200">Pausiert - der Instructor setzt gleich fort</p>
        </div>

        <!-- ATC Message Area -->
        <div
          v-if="currentPhase"
          class="rounded-3xl border border-white/10 bg-[#0b1328]/90 p-6 sm:p-8 shadow-xl shadow-cyan-500/5"
        >
          <!-- Speaking indicator -->
          <div v-if="audio.isSpeaking.value" class="mb-4 flex items-center gap-2">
            <div class="flex items-center gap-1">
              <span class="h-3 w-0.5 animate-pulse rounded-full bg-cyan-400" style="animation-delay: 0ms" />
              <span class="h-4 w-0.5 animate-pulse rounded-full bg-cyan-400" style="animation-delay: 150ms" />
              <span class="h-2 w-0.5 animate-pulse rounded-full bg-cyan-400" style="animation-delay: 300ms" />
              <span class="h-5 w-0.5 animate-pulse rounded-full bg-cyan-400" style="animation-delay: 100ms" />
              <span class="h-3 w-0.5 animate-pulse rounded-full bg-cyan-400" style="animation-delay: 250ms" />
            </div>
            <span class="text-xs text-cyan-300/70">Spricht...</span>
          </div>

          <!-- ATC text -->
          <p class="text-lg sm:text-xl leading-relaxed text-white/90 font-light">
            {{ currentPhase.atcMessage }}
          </p>

          <!-- Explanation -->
          <p v-if="currentPhase.explanation" class="mt-4 text-sm text-white/50 leading-relaxed border-t border-white/5 pt-4">
            <v-icon icon="mdi-information-outline" size="14" class="mr-1 text-cyan-400/50" />
            {{ currentPhase.explanation }}
          </p>
        </div>

        <!-- End screen -->
        <div v-if="engine.isFinished.value" class="text-center py-4">
          <div class="inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 mb-4">
            <v-icon icon="mdi-check-circle" size="36" class="text-emerald-300" />
          </div>
          <p class="text-lg font-semibold text-emerald-200">Geschafft!</p>
        </div>

        <!-- Buttons -->
        <div v-if="currentPhase" class="flex flex-col gap-3">
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
        </div>
      </div>
    </main>

    <!-- Restart confirmation dialog -->
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
import { takeoffEddf } from '~/../../shared/data/flightlab/takeoff-eddf'
import { useFlightLabEngine } from '~/../../shared/composables/flightlab/useFlightLabEngine'
import { useFlightLabAudio } from '~/../../shared/composables/flightlab/useFlightLabAudio'
import { useFlightLabSync } from '~/../../shared/composables/flightlab/useFlightLabSync'
import type { FlightLabButton } from '~/../../shared/data/flightlab/types'

definePageMeta({ layout: false })
useHead({ title: 'FlightLab - Dein erster Start' })

const engine = useFlightLabEngine(takeoffEddf)
const audio = useFlightLabAudio()
const sync = useFlightLabSync()

const joinCode = ref('')
const showRestartConfirm = ref(false)

const currentPhase = computed(() => engine.currentPhase.value)

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

  // Sync with instructor if connected
  if (sync.isConnected.value) {
    sync.sendParticipantAction(engine.currentPhaseId.value, btn.id, btn.next)
  }
}

async function handleJoin() {
  if (joinCode.value.length !== 4) return
  try {
    await sync.joinSession(joinCode.value)
  } catch (e) {
    console.error('[FlightLab] Join failed:', e)
  }
}

function handleRestart() {
  showRestartConfirm.value = false
  audio.stopAllSounds()
  engine.restart()
  if (sync.isConnected.value) {
    sync.sendParticipantAction('restart', 'restart', 'welcome')
  }
}

// Watch phase changes to trigger TTS + sounds
watch(() => engine.currentPhaseId.value, async (newId, oldId) => {
  if (!newId || newId === oldId) return
  const phase = engine.currentPhase.value
  if (!phase) return

  // Handle sounds for this phase
  if (phase.sounds && phase.sounds.length > 0) {
    audio.handlePhaseSounds(phase.sounds)
  }

  // Speak ATC message
  if (phase.atcMessage) {
    await audio.speakAtcMessage(phase.atcMessage, { speed: 0.9, readability: 5 })
  }
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
  // Preload cockpit sounds
  await audio.preloadSounds(allSoundIds.value)

  // Speak initial welcome
  const phase = engine.currentPhase.value
  if (phase?.atcMessage) {
    // Small delay to let audio context init after user gesture
    setTimeout(() => {
      audio.speakAtcMessage(phase.atcMessage, { speed: 0.9, readability: 5 })
    }, 500)
  }
})

onBeforeUnmount(() => {
  audio.dispose()
  sync.disconnect()
})
</script>
