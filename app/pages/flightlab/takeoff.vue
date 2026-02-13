<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { takeoffEddf } from '~~/shared/data/flightlab/takeoff-eddf'
import { useFlightLabEngine } from '~~/shared/composables/flightlab/useFlightLabEngine'
import { useFlightLabAudio } from '~~/shared/composables/flightlab/useFlightLabAudio'
import { useFlightLabSync } from '~~/shared/composables/flightlab/useFlightLabSync'
import type { FlightLabButton } from '~~/shared/data/flightlab/types'

const engine = useFlightLabEngine(takeoffEddf)
const audio = useFlightLabAudio()
const sync = useFlightLabSync()

const sessionInput = ref('')
const joining = ref(false)
const status = ref('Solo-Modus')

const phase = computed(() => engine.currentPhase.value)
const elapsedMinutes = computed(() => Math.floor((Date.now() - engine.startedAt.value) / 60000))

async function joinSession() {
  if (!sessionInput.value || sessionInput.value.length < 4) {
    return
  }
  joining.value = true
  try {
    await sync.joinSession(sessionInput.value, 'participant')
    status.value = 'Verbunden'
  } catch {
    status.value = 'Verbindung fehlgeschlagen'
  } finally {
    joining.value = false
  }
}

function startSolo() {
  status.value = 'Solo-Modus'
}

async function handleButton(button: FlightLabButton) {
  if (!phase.value) {
    return
  }
  const currentPhaseId = phase.value.id
  const selected = engine.selectOption(button)
  if (!selected) {
    return
  }
  if (sync.isConnected.value) {
    sync.sendParticipantAction(currentPhaseId, button.id, button.next)
  }
}

watch(() => engine.currentPhaseId.value, async () => {
  const current = engine.currentPhase.value
  if (!current) {
    return
  }

  if (current.sounds?.length) {
    await audio.preloadSounds(current.sounds.map((s) => s.id))
    audio.handlePhaseSounds(current.sounds)
  }
  await audio.speakAtcMessage(current.atcMessage, { speed: 0.9, readability: 5 })
})

sync.onStateChange((state) => {
  if (state.currentPhaseId !== engine.currentPhaseId.value) {
    engine.goToPhase(state.currentPhaseId)
  }
  if (state.isPaused) {
    engine.pause()
  } else {
    engine.resume()
  }
})

sync.onInstructorMessage(async (text) => {
  await audio.speakAtcMessage(text, { speed: 0.95, readability: 5 })
})

onMounted(async () => {
  if (phase.value?.sounds?.length) {
    await audio.preloadSounds(phase.value.sounds.map((s) => s.id))
    audio.handlePhaseSounds(phase.value.sounds)
  }
  if (phase.value) {
    await audio.speakAtcMessage(phase.value.atcMessage)
  }
})

onBeforeUnmount(() => {
  audio.dispose()
  sync.disconnect()
})
</script>

<template>
  <v-container fluid class="py-6 px-4 md:px-8">
    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="glass-card pa-4 pa-md-6" rounded="xl" elevation="0">
          <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-3">
            <div>
              <h1 class="text-h4 text-white">A320 Guided Takeoff</h1>
              <p class="text-slate-300">{{ takeoffEddf.airport }} · RWY {{ takeoffEddf.runway }} · {{ takeoffEddf.callsign }}</p>
            </div>
            <v-chip :color="sync.isConnected.value ? 'success' : 'grey'" variant="flat">{{ status }}</v-chip>
          </div>

          <v-progress-linear :model-value="engine.progress.value" color="primary" height="12" rounded class="mb-4" />

          <div v-if="phase" class="mb-4">
            <h2 class="text-h5 text-white mb-2">{{ phase.id.replaceAll('_', ' ') }}</h2>
            <v-alert color="info" variant="tonal" class="mb-3">{{ phase.atcMessage }}</v-alert>
            <p v-if="phase.explanation" class="text-slate-300 mb-4">{{ phase.explanation }}</p>
          </div>

          <v-row>
            <v-col v-for="button in phase?.buttons ?? []" :key="button.id" cols="12" md="6">
              <v-btn block size="x-large" :color="button.type === 'comfort' ? 'warning' : button.type === 'info' ? 'secondary' : 'primary'" @click="handleButton(button)">
                <v-icon v-if="button.icon" start :icon="button.icon" />
                {{ button.label }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="glass-card pa-4" rounded="xl" elevation="0">
          <h3 class="text-h6 text-white mb-3">Session</h3>
          <v-text-field v-model="sessionInput" label="Session-Code eingeben" maxlength="4" density="comfortable" />
          <v-btn block color="success" class="mb-2" :loading="joining" @click="joinSession">Verbinden</v-btn>
          <v-btn block variant="tonal" @click="startSolo">Solo starten</v-btn>
          <v-divider class="my-4" />
          <p class="text-slate-300">Fortschritt: {{ engine.progress.value }}%</p>
          <p class="text-slate-300">Zeit: {{ elapsedMinutes }} min</p>
          <p class="text-slate-300">TTS: {{ audio.isSpeaking.value ? 'spricht...' : 'bereit' }}</p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
