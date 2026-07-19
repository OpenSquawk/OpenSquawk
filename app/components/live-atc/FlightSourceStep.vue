<script setup lang="ts">
import { reactive, computed } from 'vue'
import SetupCard from '~/components/live-atc/SetupCard.vue'

defineProps<{
  loading: boolean
  error: string
}>()

const vatsimId = defineModel<string>('vatsimId', { required: true })

const emit = defineEmits<{
  (e: 'load-flight-plans'): void
  (e: 'start-demo'): void
  (e: 'start-manual', plan: { callsign: string; dep: string; arr: string; aircraft: string; altitude: string }): void
}>()

const manual = reactive({
  callsign: '',
  dep: '',
  arr: '',
  aircraft: '',
  altitude: '',
})

const manualValid = computed(() =>
  manual.callsign.trim().length >= 2 &&
  manual.dep.trim().length >= 3 &&
  manual.arr.trim().length >= 3
)

const startManual = () => {
  if (!manualValid.value) return
  emit('start-manual', {
    callsign: manual.callsign,
    dep: manual.dep,
    arr: manual.arr,
    aircraft: manual.aircraft,
    altitude: manual.altitude,
  })
}
</script>

<template>
  <section class="space-y-6">
    <SetupCard>
      <div class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold">VATSIM Integration</h2>
          <p class="text-sm text-[var(--t3)]">Enter your CID to load your filtered flight plans.</p>
        </div>
        <v-text-field
            v-model="vatsimId"
            label="VATSIM CID"
            variant="outlined"
            density="comfortable"
            color="cyan"
            prepend-inner-icon="mdi-account-circle"
            hide-details
            inputmode="numeric"
        />
        <v-btn
            block
            color="cyan"
            variant="flat"
            :loading="loading"
            @click="$emit('load-flight-plans')"
        >
          Load flight plans
        </v-btn>
        <v-alert
            v-if="error"
            type="warning"
            density="compact"
            variant="tonal"
            class="bg-amber-500/10 text-amber-200"
        >
          {{ error }}
        </v-alert>
      </div>
    </SetupCard>

    <!-- Manual flight entry -->
    <SetupCard>
      <div class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold">Manual flight</h2>
          <p class="text-sm text-[var(--t3)]">Enter a flight by hand — no VATSIM account needed.</p>
        </div>
        <v-text-field
            v-model="manual.callsign"
            label="Callsign"
            placeholder="DLH39A"
            variant="outlined"
            density="comfortable"
            color="cyan"
            prepend-inner-icon="mdi-radio-tower"
            hide-details
            @keyup.enter="startManual"
        />
        <div class="grid grid-cols-2 gap-3">
          <v-text-field
              v-model="manual.dep"
              label="From (ICAO)"
              placeholder="EDDF"
              variant="outlined"
              density="comfortable"
              color="cyan"
              prepend-inner-icon="mdi-airplane-takeoff"
              maxlength="4"
              hide-details
              @keyup.enter="startManual"
          />
          <v-text-field
              v-model="manual.arr"
              label="To (ICAO)"
              placeholder="EDDM"
              variant="outlined"
              density="comfortable"
              color="cyan"
              prepend-inner-icon="mdi-airplane-landing"
              maxlength="4"
              hide-details
              @keyup.enter="startManual"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <v-text-field
              v-model="manual.aircraft"
              label="Aircraft (opt.)"
              placeholder="A320/L"
              variant="outlined"
              density="comfortable"
              color="cyan"
              prepend-inner-icon="mdi-airplane"
              hide-details
          />
          <v-text-field
              v-model="manual.altitude"
              label="Cruise ft (opt.)"
              placeholder="36000"
              variant="outlined"
              density="comfortable"
              color="cyan"
              prepend-inner-icon="mdi-arrow-expand-vertical"
              inputmode="numeric"
              hide-details
          />
        </div>
        <v-btn
            block
            color="cyan"
            variant="tonal"
            :disabled="!manualValid"
            @click="startManual"
        >
          Continue with this flight
        </v-btn>
      </div>
    </SetupCard>

    <!-- Demo Mode -->
    <SetupCard>
      <div class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold">Demo Mode</h2>
          <p class="text-sm text-[var(--t3)]">Start with a sample flight plan for testing.</p>
        </div>
        <v-btn
            block
            color="orange"
            variant="outlined"
            @click="$emit('start-demo')"
        >
          Start demo (DLH39A EDDF→EDDM)
        </v-btn>
      </div>
    </SetupCard>
  </section>
</template>
