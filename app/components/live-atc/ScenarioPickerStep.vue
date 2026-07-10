<script setup lang="ts">
import SetupCard from '~/components/live-atc/SetupCard.vue'
import type { Scenario } from '../../../shared/constants/scenarios'

type ChainGroup = {
  category: string
  chains: Array<{ id: string; complete: Scenario; segments: Scenario[] }>
}

defineProps<{
  chainGroups: ChainGroup[]
  drillScenarios: Scenario[]
  selectedPlan: any
  error: string
}>()

defineEmits<{
  (e: 'launch', scenario: Scenario): void
  (e: 'back'): void
  (e: 'dismiss-error'): void
}>()
</script>

<template>
  <section class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <v-btn icon variant="text" class="text-cyan-300" @click="$emit('back')">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <h2 class="text-lg font-semibold">Choose your scenario</h2>
        <p v-if="selectedPlan" class="text-sm text-[var(--t4)] font-mono">
          {{ selectedPlan.callsign }} · {{ selectedPlan.dep }} → {{ selectedPlan.arr }}
        </p>
      </div>
    </div>

    <v-alert
        v-if="error"
        type="warning"
        density="compact"
        variant="tonal"
        closable
        class="bg-amber-500/10 text-amber-200"
        @click:close="$emit('dismiss-error')"
    >
      {{ error }}
    </v-alert>

    <!-- Scenarios grouped by journey, each chain shown as a flow -->
    <div v-for="grp in chainGroups" :key="grp.category" class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-[var(--t4)]">
        {{ grp.category }}
      </p>

      <SetupCard v-for="chain in grp.chains" :key="chain.id">
        <div class="space-y-3">
          <!-- Chain header + run-the-whole-thing button -->
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <v-icon :icon="chain.complete.icon" class="text-cyan-300 shrink-0" size="24" />
              <div class="min-w-0">
                <div class="font-semibold text-sm leading-tight">{{ chain.complete.name }}</div>
                <div class="text-[11px] text-[var(--t4)] leading-snug truncate">{{ chain.complete.subtitle }}</div>
              </div>
            </div>
            <v-btn size="small" color="cyan" variant="flat" class="shrink-0" @click="$emit('launch', chain.complete)">
              Fly full
            </v-btn>
          </div>

          <!-- Phase flow: tap a step to practise just that phase -->
          <div class="pm-flow">
            <template v-for="(seg, i) in chain.segments" :key="seg.id">
              <button
                  type="button"
                  class="pm-flow-node"
                  :title="seg.subtitle"
                  @click="$emit('launch', seg)"
              >
                <v-icon :icon="seg.icon" size="13" />
                <span>{{ seg.name }}</span>
              </button>
              <v-icon v-if="i < chain.segments.length - 1" size="13" class="pm-flow-arrow">
                mdi-arrow-right
              </v-icon>
            </template>
          </div>
        </div>
      </SetupCard>
    </div>

    <!-- Standalone drills -->
    <div v-if="drillScenarios.length" class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-[var(--t4)]">
        Drills
      </p>
      <SetupCard v-for="drill in drillScenarios" :key="drill.id">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <v-icon :icon="drill.icon" class="text-cyan-300 shrink-0" size="24" />
            <div class="min-w-0">
              <div class="font-semibold text-sm leading-tight">{{ drill.name }}</div>
              <div class="text-[11px] text-[var(--t4)] leading-snug truncate">{{ drill.subtitle }}</div>
            </div>
          </div>
          <v-btn size="small" color="cyan" variant="flat" class="shrink-0" @click="$emit('launch', drill)">
            Start
          </v-btn>
        </div>
      </SetupCard>
    </div>

    <p class="text-[10px] text-[var(--t4)] text-center">
      Tap a step to practise just that phase · “Fly full” runs the whole chain.
    </p>
  </section>
</template>

<style scoped>
/* Scenario chooser — phase flow with arrows */
.pm-flow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.pm-flow-node {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 8px;
  background: var(--pm-surface-1);
  border: 1px solid var(--border);
  font-size: 11.5px;
  line-height: 1.2;
  color: var(--t2);
  transition: border-color .15s, background .15s, color .15s;
}
.pm-flow-node:hover {
  border-color: rgba(34, 211, 238, 0.6);
  background: rgba(34, 211, 238, 0.1);
  color: var(--text);
}
.pm-flow-arrow {
  color: var(--t4);
}
</style>
