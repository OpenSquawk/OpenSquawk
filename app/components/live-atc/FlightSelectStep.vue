<script setup lang="ts">
import SetupCard from '~/components/live-atc/SetupCard.vue'

defineProps<{
  flightPlans: any[]
  loading: boolean
  vatsimId: string
}>()

defineEmits<{
  (e: 'select-plan', plan: any): void
  (e: 'back'): void
}>()
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <v-btn icon class="text-cyan-300" @click="$emit('back')">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <h2 class="text-lg font-semibold">Available flight plans</h2>
      <v-chip color="cyan" variant="outlined" size="small">{{ vatsimId }}</v-chip>
    </div>

    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="cyan" class="mb-4" />
      <p class="text-sm text-[var(--t3)]">Loading flight plans from VATSIM…</p>
    </div>

    <div v-else-if="flightPlans.length === 0" class="text-center py-8">
      <v-icon size="48" class="text-[var(--t4)] mb-4">mdi-airplane-off</v-icon>
      <p class="text-[var(--t3)]">No flight plans found</p>
      <v-btn color="cyan" variant="outlined" class="mt-4" @click="$emit('back')">
        Back
      </v-btn>
    </div>

    <div v-else class="space-y-3">
      <SetupCard
          v-for="plan in flightPlans"
          :key="plan.id"
          interactive
          @click="$emit('select-plan', plan)"
      >
        <div class="space-y-2">
          <div class="flex items-baseline justify-between">
            <h3 class="text-xl font-semibold tracking-tight font-mono">{{ plan.callsign }}</h3>
            <span class="text-xs uppercase text-[var(--t4)]">{{ plan.aircraft?.split('/')[0] }}</span>
          </div>
          <div class="flex flex-col gap-1 text-sm text-[var(--t3)]">
            <div class="flex items-center gap-2">
              <v-icon icon="mdi-map-marker" size="16" class="text-cyan-300" />
              <span class="font-mono">{{ plan.dep }} → {{ plan.arr }}</span>
            </div>
            <div v-if="plan.altitude" class="flex items-center gap-2">
              <v-icon icon="mdi-airplane-takeoff" size="16" class="text-cyan-300" />
              <span class="font-mono">FL{{ Math.floor(parseInt(plan.altitude) / 100) }}</span>
            </div>
            <div v-if="plan.assignedsquawk" class="flex items-start gap-2">
              <v-icon icon="mdi-radar" size="16" class="text-cyan-300" />
              <span class="text-xs text-[var(--t3)]">Squawk: <span class="font-mono">{{ plan.assignedsquawk }}</span></span>
            </div>
          </div>
        </div>
      </SetupCard>
    </div>
  </section>
</template>
