<script setup lang="ts">
import { ref } from 'vue'
import type useCommunicationsEngine from '../../../../shared/utils/communicationsEngine'
import { useDebugSimulation } from '~/composables/useDebugSimulation'

/**
 * Mounted only while `debugMode` is on — the parent gates with `v-if`, so none of
 * the simulation machinery below exists on the normal cockpit path.
 */
const props = defineProps<{
  engine: ReturnType<typeof useCommunicationsEngine>
  sessionLabel: string
  setLastTransmission: (text: string) => void
  clearLog: () => void
  startDemoFlight: () => void
}>()

const showDebugDrawer = ref(false)

const forceMove = props.engine.moveTo

const {
  simulationRunning,
  simulationTrace,
  simulationError,
  simulationStepCount,
  completedPilotSteps,
  timelineSteps,
  timelineUsedFallback,
  traceAutoSelection,
  traceFallback,
  debugState,
  debugNextStates,
  describeElimination,
  formatTracePayload,
} = useDebugSimulation(props.engine, {
  setLastTransmission: props.setLastTransmission,
  clearLog: props.clearLog,
  startDemoFlight: props.startDemoFlight,
})
</script>

<template>
  <!-- Debug FAB (bottom-left) -->
  <button
      type="button"
      class="debug-fab"
      :class="{ 'is-open': showDebugDrawer }"
      :aria-pressed="showDebugDrawer ? 'true' : 'false'"
      :aria-label="showDebugDrawer ? 'Close debug panel' : 'Open debug panel'"
      title="Debug panel"
      @click="showDebugDrawer = !showDebugDrawer"
  >
    <v-icon size="22">{{ showDebugDrawer ? 'mdi-close' : 'mdi-bug' }}</v-icon>
  </button>

  <!-- Debug drawer (left, non-blocking) -->
  <Transition name="debug-drawer">
    <aside
        v-if="showDebugDrawer"
        class="debug-drawer"
        role="complementary"
        aria-label="Debug panel"
    >
      <header class="debug-drawer-head">
        <div class="flex items-center gap-2">
          <v-icon size="18" color="orange">mdi-bug</v-icon>
          <h3 class="text-base font-semibold">Debug</h3>
          <v-chip size="x-small" color="grey" variant="outlined">LLM</v-chip>
        </div>
        <button
            type="button"
            class="debug-drawer-close"
            aria-label="Close debug panel"
            @click="showDebugDrawer = false"
        >
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </header>

      <div class="debug-drawer-body">
        <v-card
            v-if="simulationRunning || simulationTrace.length"
            class="bg-white/5 border border-white/10 mb-3"
        >
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-semibold">Simulation Trace</h4>
                <v-chip size="x-small" color="cyan" variant="outlined">
                  {{ completedPilotSteps }} / {{ simulationStepCount }}
                </v-chip>
              </div>
              <v-chip size="x-small" :color="simulationRunning ? 'orange' : 'grey'" variant="tonal">
                {{ simulationRunning ? 'Running' : 'Ready' }}
              </v-chip>
            </div>

            <v-alert
                v-if="simulationError"
                type="warning"
                variant="tonal"
                density="compact"
                class="bg-amber-500/10 text-amber-200"
            >
              {{ simulationError }}
            </v-alert>

            <div
                v-if="simulationRunning && simulationTrace.length === 0"
                class="text-xs text-white/60"
            >
              Simulation initializing...
            </div>

            <div v-else class="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div
                  v-for="(entry, idx) in simulationTrace"
                  :key="idx"
                  class="rounded-xl border border-white/10 bg-black/40 p-2 space-y-1"
              >
                <div class="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-white/40">
                  <span>{{ entry.label }}</span>
                  <span class="text-white/60">{{ entry.id }}</span>
                </div>
                <div v-if="entry.kind === 'pilot' || entry.kind === 'atc'" class="space-y-1">
                  <p class="text-xs font-mono text-white">{{ entry.payload?.text }}</p>
                  <p class="text-[10px] text-white/50 font-mono">{{ entry.payload?.normalized }}</p>
                </div>
                <pre
                    v-else-if="entry.payload"
                    class="text-[10px] text-white/60 font-mono whitespace-pre-wrap"
                >{{ formatTracePayload(entry.payload) }}</pre>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="bg-white/5 border border-white/10">
          <v-card-text class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold">Flow Insights</h4>
            </div>

            <div class="flex items-center justify-between text-[10px] text-white/50">
              <span>Session: {{ sessionLabel }}</span>
              <div class="flex flex-wrap gap-1" v-if="traceAutoSelection || (traceFallback?.used) || timelineUsedFallback">
                <v-chip v-if="traceAutoSelection" size="x-small" color="cyan" variant="outlined">
                  Auto: {{ traceAutoSelection.id }}
                </v-chip>
                <v-chip v-if="timelineUsedFallback" size="x-small" color="orange" variant="tonal">
                  Fallback candidates
                </v-chip>
                <v-chip v-if="traceFallback?.used" size="x-small" color="red" variant="tonal">
                  Fallback: {{ traceFallback.reason || 'triggered' }}
                </v-chip>
              </div>
            </div>

            <div class="space-y-2 rounded-xl border border-white/10 bg-black/30 p-2">
              <p class="text-[10px] uppercase tracking-[0.25em] text-white/40">Current node</p>
              <p class="font-mono text-xs text-white">{{ debugState?.id || '—' }}</p>
              <p class="text-[10px] text-white/50">
                {{ debugState ? `${debugState.role} • ${debugState.phase}` : 'N/A' }}
                <span v-if="debugState?.frequencyName" class="ml-1 text-white/40">({{ debugState.frequencyName }})</span>
              </p>
              <p v-if="debugState?.sayPlain" class="text-[11px] text-white/70">
                Auto (LLM): <span class="font-mono text-white">{{ debugState.sayPlain }}</span>
              </p>
              <p v-if="debugState?.sayNormalized" class="text-[10px] text-white/40">
                Radio: {{ debugState.sayNormalized }}
              </p>
            </div>

            <div>
              <p class="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Upcoming decisions</p>
              <div v-if="debugNextStates.length" class="space-y-2">
                <div
                    v-for="state in debugNextStates"
                    :key="state.id"
                    class="space-y-1 rounded-xl border border-white/10 bg-black/30 p-2"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="font-mono text-xs text-white">{{ state.id }}</p>
                      <p class="text-[10px] text-white/50">
                        {{ state.role || '—' }} • {{ state.phase || '—' }}
                        <span v-if="state.frequencyName" class="ml-1 text-white/40">({{ state.frequencyName }})</span>
                      </p>
                    </div>
                    <v-chip
                        size="x-small"
                        color="cyan"
                        variant="outlined"
                        class="cursor-pointer"
                        @click="forceMove(state.id)"
                    >
                      Jump
                    </v-chip>
                  </div>
                  <p v-if="state.sayPlain" class="text-[11px] text-white/70">
                    ATC: <span class="font-mono text-white">{{ state.sayPlain }}</span>
                  </p>
                  <p v-if="state.sayNormalized" class="text-[10px] text-white/40">
                    Radio: {{ state.sayNormalized }}
                  </p>
                </div>
              </div>
              <p v-else class="text-[10px] text-white/50">No further decisions available.</p>
            </div>

            <div class="space-y-2 rounded-xl border border-white/10 bg-black/30 p-2">
              <p class="text-[10px] uppercase tracking-[0.25em] text-white/40">Decision timeline</p>
              <div v-if="timelineSteps.length" class="space-y-2">
                <div
                  v-for="(step, index) in timelineSteps"
                  :key="`${step.stage}-${index}`"
                  class="space-y-2 rounded-lg border border-white/10 bg-black/40 p-2"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="font-semibold text-xs text-white">{{ step.label }}</p>
                      <p class="text-[10px] text-white/50 uppercase tracking-[0.2em]">{{ step.stage }}</p>
                    </div>
                    <v-chip size="x-small" color="cyan" variant="outlined">
                      {{ step.candidates.length }} cand.
                    </v-chip>
                  </div>
                  <p v-if="step.note" class="text-[10px] text-white/50">{{ step.note }}</p>
                  <div v-if="step.candidates.length" class="space-y-1">
                    <div
                      v-for="candidate in step.candidates"
                      :key="candidate.id"
                      class="rounded-md border border-white/10 bg-black/30 p-1.5"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <span class="font-mono text-[11px] text-white">{{ candidate.id }}</span>
                        <span class="text-[10px] text-white/50">{{ candidate.flow || 'current' }}</span>
                      </div>
                      <p v-if="candidate.summary" class="text-[10px] text-white/60 mt-0.5">{{ candidate.summary }}</p>
                    </div>
                  </div>
                  <div v-if="step.eliminated?.length" class="space-y-1">
                    <p class="text-[10px] text-red-200/80 uppercase tracking-[0.25em]">Eliminated</p>
                    <div
                      v-for="elim in step.eliminated"
                      :key="`${step.stage}-${elim.candidate.id}`"
                      class="space-y-1 rounded-md border border-red-400/30 bg-red-500/10 p-1.5 text-[10px] text-red-100"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <span class="font-mono text-[11px]">{{ elim.candidate.id }}</span>
                        <span class="text-[10px] text-red-200/80">{{ elim.kind }}</span>
                      </div>
                      <p class="text-[10px] text-red-100/80">{{ elim.reason }}</p>
                      <p v-if="describeElimination(elim)" class="text-[10px] text-red-100/70">{{ describeElimination(elim) }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p v-else class="text-[10px] text-white/50">No decision timeline available yet.</p>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.debug-fab {
  position: fixed;
  left: 16px;
  /* Clear the mobile bottom nav (~64px) by default; desktop overrides below. */
  bottom: calc(env(safe-area-inset-bottom) + 78px);
  z-index: 60;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(249, 115, 22, 0.45);
  background: rgba(249, 115, 22, 0.16);
  color: #fdba74;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease, transform 160ms ease, border-color 160ms ease;
}
.debug-fab:hover {
  background: rgba(249, 115, 22, 0.26);
  color: #fed7aa;
  transform: translateY(-1px);
}
.debug-fab.is-open {
  background: rgba(249, 115, 22, 0.35);
  border-color: rgba(249, 115, 22, 0.7);
  color: #fff;
}

.debug-drawer {
  position: fixed;
  top: 72px;
  left: 12px;
  bottom: calc(env(safe-area-inset-bottom) + 76px);
  width: min(420px, calc(100vw - 24px));
  z-index: 55;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 13, 24, 0.96);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(14px);
  pointer-events: auto;
}
.debug-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.debug-drawer-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  background: transparent;
  transition: background 120ms ease, color 120ms ease;
}
.debug-drawer-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.debug-drawer-body {
  padding: 12px 14px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.debug-drawer-enter-active,
.debug-drawer-leave-active {
  transition: transform 220ms ease, opacity 220ms ease;
}
.debug-drawer-enter-from,
.debug-drawer-leave-to {
  transform: translateX(-12px);
  opacity: 0;
}

/* No bottom nav on desktop: drop the FAB back down to the corner. */
@media (min-width: 1024px) {
  .debug-fab {
    bottom: calc(env(safe-area-inset-bottom) + 16px);
  }
  .debug-drawer {
    bottom: calc(env(safe-area-inset-bottom) + 16px);
  }
}

@media (max-width: 640px) {
  .debug-drawer {
    top: 64px;
    left: 8px;
    right: 8px;
    width: auto;
    bottom: calc(env(safe-area-inset-bottom) + 84px);
  }
}
</style>
