<script setup lang="ts">
import type { WebSimApMode } from '~~/shared/data/websim/types'

const props = defineProps<{
  targetIas: number
  targetHdg: number
  targetAlt: number
  apMode: WebSimApMode
}>()

const emit = defineEmits<{
  setIas: [value: number]
  setHdg: [value: number]
  setAlt: [value: number]
  pressAp: []
  pressNav: []
  pressAppr: []
}>()

function step(kind: 'ias' | 'hdg' | 'alt', delta: number) {
  if (kind === 'ias') emit('setIas', props.targetIas + delta)
  if (kind === 'hdg') emit('setHdg', ((props.targetHdg + delta) % 360 + 360) % 360)
  if (kind === 'alt') emit('setAlt', props.targetAlt + delta)
}

const apEngaged = computed(() => props.apMode !== 'OFF')
const navActive = computed(() => props.apMode === 'NAV')
const apprArmed = computed(() => props.apMode === 'APPR_ARMED')
const apprCaptured = computed(() => props.apMode === 'APPR_CAPTURED' || props.apMode === 'AUTOLAND')

const modeLabel = computed<Record<WebSimApMode, string>>(() => ({
  OFF: 'Manuell',
  SELECTED: 'AP: HDG/ALT/SPD',
  NAV: 'AP: NAV (STAR)',
  APPR_ARMED: 'AP: APPR armed',
  APPR_CAPTURED: 'AP: ILS captured',
  AUTOLAND: 'AP: AUTOLAND',
}))
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-[#0b1328]/90 p-3">
    <div class="flex items-center justify-between mb-2">
      <span class="text-[10px] uppercase tracking-widest text-white/30">FCU</span>
      <span class="text-[10px] font-mono" :class="apEngaged ? 'text-cyan-300' : 'text-white/30'">{{ modeLabel[apMode] }}</span>
    </div>

    <div class="grid grid-cols-3 gap-2 mb-3">
      <div class="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-center">
        <div class="text-[9px] text-white/30">SPD</div>
        <div class="font-mono text-sm text-cyan-200">{{ Math.round(targetIas) }}</div>
        <div class="flex justify-center gap-1 mt-1">
          <button class="fcu-btn" @click="step('ias', -10)">−</button>
          <button class="fcu-btn" @click="step('ias', 10)">+</button>
        </div>
      </div>
      <div class="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-center">
        <div class="text-[9px] text-white/30">HDG</div>
        <div class="font-mono text-sm text-cyan-200">{{ String(Math.round(targetHdg)).padStart(3, '0') }}</div>
        <div class="flex justify-center gap-1 mt-1">
          <button class="fcu-btn" @click="step('hdg', -5)">−</button>
          <button class="fcu-btn" @click="step('hdg', 5)">+</button>
        </div>
      </div>
      <div class="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-center">
        <div class="text-[9px] text-white/30">ALT</div>
        <div class="font-mono text-sm text-cyan-200">{{ Math.round(targetAlt) }}</div>
        <div class="flex justify-center gap-1 mt-1">
          <button class="fcu-btn" @click="step('alt', -500)">−</button>
          <button class="fcu-btn" @click="step('alt', 500)">+</button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <button class="mode-btn" :class="apEngaged ? 'mode-btn--engaged' : ''" @click="emit('pressAp')">AP</button>
      <button class="mode-btn" :class="navActive ? 'mode-btn--engaged' : ''" @click="emit('pressNav')">NAV</button>
      <button
        class="mode-btn"
        :class="apprCaptured ? 'mode-btn--engaged' : apprArmed ? 'mode-btn--armed' : ''"
        @click="emit('pressAppr')"
      >
        APPR
      </button>
    </div>
  </div>
</template>

<style scoped>
.fcu-btn {
  @apply w-6 h-5 rounded border border-white/10 bg-white/5 text-white/50 text-xs leading-none hover:bg-white/10 hover:text-white/80;
}
.mode-btn {
  @apply rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs font-semibold text-white/50 hover:bg-white/10;
}
.mode-btn--engaged {
  @apply border-cyan-400/50 bg-cyan-500/20 text-cyan-200;
}
.mode-btn--armed {
  @apply border-amber-400/50 bg-amber-500/10 text-amber-200;
}
</style>
