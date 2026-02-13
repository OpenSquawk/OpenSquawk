<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { takeoffEddf } from '~~/shared/data/flightlab/takeoff-eddf'
import { useFlightLabEngine } from '~~/shared/composables/flightlab/useFlightLabEngine'
import { useFlightLabSync } from '~~/shared/composables/flightlab/useFlightLabSync'

const engine = useFlightLabEngine(takeoffEddf)
const sync = useFlightLabSync()

const customMessage = ref('')
const withRadioEffect = ref(true)
const alerts = ref<string[]>([])

const phase = computed(() => engine.currentPhase.value)
const sessionCode = computed(() => sync.sessionCode.value ?? '----')

function sendCommand(command: string, targetPhaseId?: string) {
  sync.sendInstructorCommand(command, targetPhaseId)
}

function sendMessage() {
  if (!customMessage.value.trim()) {
    return
  }
  sync.sendInstructorMessage(customMessage.value, withRadioEffect.value)
  customMessage.value = ''
}

sync.onStateChange((state, action) => {
  engine.goToPhase(state.currentPhaseId)
  if (state.isPaused) {
    engine.pause()
  } else {
    engine.resume()
  }

  if (action && action.buttonId && action.buttonId.includes('afraid')) {
    alerts.value.unshift(`Angst-Signal in Phase ${action.phaseId}`)
  }
})

onMounted(async () => {
  await sync.createSession('takeoff-eddf')
})

onBeforeUnmount(() => {
  sync.disconnect()
})
</script>

<template>
  <v-container fluid class="py-6 px-4 md:px-8">
    <v-row>
      <v-col cols="12" lg="7">
        <v-card class="glass-card pa-4 pa-md-6" rounded="xl" elevation="0">
          <h1 class="text-h4 text-white mb-3">Instructor Panel</h1>
          <v-progress-linear :model-value="engine.progress.value" color="primary" height="10" rounded class="mb-4" />
          <h2 class="text-h5 text-white mb-3">{{ phase?.id.replaceAll('_', ' ') }}</h2>
          <v-alert v-if="phase" color="info" variant="tonal" class="mb-4">{{ phase.atcMessage }}</v-alert>
          <v-chip-group column>
            <v-chip v-for="button in phase?.buttons ?? []" :key="button.id" color="primary" variant="outlined">
              {{ button.label }}
            </v-chip>
          </v-chip-group>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="glass-card pa-4" rounded="xl" elevation="0">
          <div class="d-flex justify-space-between align-center mb-3">
            <h3 class="text-h6 text-white">Session Code</h3>
            <v-chip :color="sync.isConnected.value ? 'success' : 'grey'" variant="flat">
              {{ sync.isConnected.value ? 'Verbunden' : 'Offline' }}
            </v-chip>
          </div>
          <div class="text-h3 text-primary mb-4" style="letter-spacing: 0.25em">{{ sessionCode }}</div>

          <v-select
            :items="takeoffEddf.phases.map((p) => ({ title: p.id, value: p.id }))"
            label="Zu Phase springen"
            @update:model-value="(value) => value && sendCommand('goto', value)"
          />

          <div class="d-flex ga-2 mb-3 flex-wrap">
            <v-btn color="primary" @click="sendCommand('pause')">Pause</v-btn>
            <v-btn color="success" @click="sendCommand('resume')">Resume</v-btn>
            <v-btn color="warning" @click="sendCommand('restart')">Restart</v-btn>
          </div>

          <v-textarea v-model="customMessage" label="Custom Message" rows="3" />
          <v-checkbox v-model="withRadioEffect" label="Mit Funkeffekt" hide-details class="mb-2" />
          <v-btn block color="secondary" class="mb-4" @click="sendMessage">Senden</v-btn>

          <h4 class="text-subtitle-1 text-white mb-2">Anxiety Monitor</h4>
          <v-alert v-if="!alerts.length" color="success" variant="tonal">Keine kritischen Signale.</v-alert>
          <div v-else class="d-flex flex-column ga-2 mb-4">
            <v-alert v-for="(alert, idx) in alerts.slice(0, 5)" :key="idx" color="warning" variant="tonal">{{ alert }}</v-alert>
          </div>

          <h4 class="text-subtitle-1 text-white mb-2">Participant Log</h4>
          <div class="max-h-56 overflow-auto pr-1">
            <div
              v-for="item in sync.remoteState.value?.history ?? []"
              :key="`${item.timestamp}-${item.buttonId}`"
              class="text-slate-300 text-body-2 mb-1"
            >
              {{ new Date(item.timestamp).toLocaleTimeString() }} · {{ item.phaseId }} → {{ item.buttonId }}
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
