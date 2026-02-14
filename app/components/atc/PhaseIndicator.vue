<template>
  <div class="phase-indicator" role="navigation" aria-label="Flight phase progress">
    <div
      v-for="(phase, i) in phases"
      :key="phase.id"
      class="phase-step"
      :class="{
        'phase-step--completed': phaseIndex > i,
        'phase-step--current': phaseIndex === i,
        'phase-step--future': phaseIndex < i,
      }"
    >
      <!-- Connecting line (before dot, except first) -->
      <div
        v-if="i > 0"
        class="phase-line"
        :class="{
          'phase-line--completed': phaseIndex >= i,
          'phase-line--future': phaseIndex < i,
        }"
      />

      <!-- Dot -->
      <div class="phase-dot-wrap">
        <div class="phase-dot">
          <div v-if="phaseIndex === i" class="phase-dot-pulse" />
        </div>
      </div>

      <!-- Label -->
      <span class="phase-label">{{ phase.abbr }}</span>
    </div>

    <!-- Emergency overlay -->
    <div v-if="isEmergency" class="phase-emergency">
      <span class="phase-emergency-badge">EMRG</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ currentPhase: string }>()

const phases = [
  { id: 'clearance', abbr: 'CLR' },
  { id: 'ground', abbr: 'GND' },
  { id: 'tower', abbr: 'TWR' },
  { id: 'departure', abbr: 'DEP' },
  { id: 'enroute', abbr: 'CTR' },
  { id: 'approach', abbr: 'APP' },
  { id: 'landing', abbr: 'LND' },
  { id: 'taxiIn', abbr: 'TXI' },
] as const

const isEmergency = computed(() => props.currentPhase === 'emergency')

const phaseIndex = computed(() => {
  const idx = phases.findIndex(p => p.id === props.currentPhase)
  return idx === -1 ? -1 : idx
})
</script>

<style scoped>
.phase-indicator {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  padding: 6px 4px 0;
  user-select: none;
}

/* Each step: line + dot + label stacked */
.phase-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 0;
}

/* Connecting line */
.phase-line {
  position: absolute;
  top: 10px;
  right: 50%;
  width: 100%;
  height: 2px;
  z-index: 0;
}

.phase-line--completed {
  background: var(--accent);
  opacity: 0.6;
}

.phase-line--future {
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.12) 0,
    rgba(255, 255, 255, 0.12) 4px,
    transparent 4px,
    transparent 8px
  );
}

/* Dot wrapper for positioning */
.phase-dot-wrap {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

/* Dot */
.phase-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.18);
  background: transparent;
  transition: all 0.3s ease;
  position: relative;
}

.phase-step--completed .phase-dot {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 40%, transparent);
}

.phase-step--current .phase-dot {
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 50%, transparent);
}

.phase-step--future .phase-dot {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.18);
}

/* Pulse ring for current */
.phase-dot-pulse {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  opacity: 0;
  animation: phase-pulse 2s ease-in-out infinite;
}

@keyframes phase-pulse {
  0% {
    opacity: 0.6;
    transform: scale(0.8);
  }
  50% {
    opacity: 0;
    transform: scale(1.6);
  }
  100% {
    opacity: 0;
    transform: scale(1.6);
  }
}

/* Label */
.phase-label {
  margin-top: 4px;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.25);
  text-transform: uppercase;
  white-space: nowrap;
}

.phase-step--completed .phase-label {
  color: color-mix(in srgb, var(--accent) 70%, transparent);
}

.phase-step--current .phase-label {
  color: var(--accent);
  font-weight: 700;
}

/* Emergency badge */
.phase-emergency {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.phase-emergency-badge {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 6px;
  padding: 2px 10px;
  animation: emergency-flash 1s ease-in-out infinite alternate;
}

@keyframes emergency-flash {
  0% {
    opacity: 1;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
  }
  100% {
    opacity: 0.5;
    box-shadow: 0 0 2px rgba(239, 68, 68, 0.1);
  }
}

/* Responsive: tighten on small screens */
@media (max-width: 400px) {
  .phase-label {
    font-size: 0.5rem;
  }
}
</style>
