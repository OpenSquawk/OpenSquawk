<script setup lang="ts">
import type { Scenario } from '../../../shared/constants/scenarios'

defineProps<{
  completedScenario: Scenario | null
  selectedPlan: any
  oppositeScenario: Scenario | null
}>()

defineEmits<{
  (e: 'fly-again'): void
  (e: 'try-opposite', scenario: Scenario): void
  (e: 'back-to-scenarios'): void
}>()
</script>

<template>
  <section class="space-y-6">
    <div class="text-center space-y-3 pt-10 pb-6">
      <v-icon size="72" class="text-green-400">mdi-check-circle-outline</v-icon>
      <h2 class="text-2xl font-semibold">
        {{ completedScenario?.name ?? 'Session' }} complete
      </h2>
      <p class="text-[var(--t4)] text-sm font-mono">
        {{ selectedPlan?.callsign }} ·
        {{ selectedPlan?.dep }} → {{ selectedPlan?.arr }}
      </p>
    </div>

    <div class="space-y-3">
      <v-btn block color="cyan" variant="flat" @click="$emit('fly-again')">
        <v-icon start>mdi-refresh</v-icon>
        Fly again
      </v-btn>

      <v-btn
          v-if="oppositeScenario"
          block
          color="white"
          variant="outlined"
          @click="$emit('try-opposite', oppositeScenario)"
      >
        <v-icon start>{{ oppositeScenario.icon }}</v-icon>
        Try {{ oppositeScenario.name }}
      </v-btn>

      <v-btn block variant="text" class="text-[var(--t3)]" @click="$emit('back-to-scenarios')">
        Back to scenarios
      </v-btn>
    </div>
  </section>
</template>
