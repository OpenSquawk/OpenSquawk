<script setup lang="ts">
import type { WebSimEngineState } from '~~/shared/data/websim/types'

const props = defineProps<{
  comActive: number
  comStandby: number
  transponder: number
  gearDown: boolean
  parkingBrake: boolean
  engineState: WebSimEngineState
  onGround: boolean
}>()

const emit = defineEmits<{
  swapCom: []
  setStandby: [value: number]
  toggleGear: []
  toggleParkingBrake: []
  startEngines: []
}>()

const canStartEngines = computed(() => props.onGround && props.engineState === 'OFF')

function stepStandby(delta: number) {
  emit('setStandby', Math.round((props.comStandby + delta) * 1000) / 1000)
}

// Click-to-edit standby: real controllers sit on 8.33 kHz channels (118.780,
// 119.905, …) which coarse stepping can never reach — and /live-atc rejects
// calls from the wrong frequency, so exact tuning matters.
const editingStandby = ref(false)
const standbyDraft = ref('')

function beginStandbyEdit() {
  standbyDraft.value = props.comStandby.toFixed(3)
  editingStandby.value = true
}

function commitStandbyEdit() {
  editingStandby.value = false
  const parsed = Number.parseFloat(standbyDraft.value.replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed < 118 || parsed >= 137) return
  emit('setStandby', Math.round(parsed * 1000) / 1000)
}
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-[#0b1328]/90 p-3 space-y-2.5 h-full flex flex-col">
    <span class="text-[10px] uppercase tracking-widest text-white/30">Radio / Systeme</span>

    <div class="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
      <div class="flex items-center justify-between text-[9px] text-white/30 mb-1">
        <span>COM1</span>
        <button class="rounded border border-white/10 px-1.5 py-0.5 text-white/50 hover:bg-white/10 hover:text-white/80" @click="emit('swapCom')">⇄</button>
      </div>
      <div class="flex items-center justify-between font-mono text-sm">
        <span class="text-cyan-200">{{ comActive.toFixed(3) }}</span>
        <input
          v-if="editingStandby"
          v-model="standbyDraft"
          class="w-20 rounded border border-cyan-400/40 bg-black/60 text-right text-white/80 outline-none px-1"
          autofocus
          @keydown.enter="commitStandbyEdit"
          @blur="commitStandbyEdit"
        >
        <button v-else class="text-white/40 hover:text-white/80" title="Klicken zum Eintippen" @click="beginStandbyEdit">
          {{ comStandby.toFixed(3) }}
        </button>
      </div>
      <div class="flex justify-end gap-1 mt-1">
        <button class="fcu-btn" @click="stepStandby(-0.005)">−</button>
        <button class="fcu-btn" @click="stepStandby(0.005)">+</button>
      </div>
    </div>

    <div class="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-center">
      <div class="text-[9px] text-white/30">SQUAWK</div>
      <div class="font-mono text-sm text-cyan-200">{{ String(transponder).padStart(4, '0') }}</div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <button class="sys-btn" :class="gearDown ? 'sys-btn--on' : ''" @click="emit('toggleGear')">Gear {{ gearDown ? 'DOWN' : 'UP' }}</button>
      <button class="sys-btn" :class="parkingBrake ? 'sys-btn--on' : ''" @click="emit('toggleParkingBrake')">Park Brake {{ parkingBrake ? 'SET' : 'OFF' }}</button>
    </div>

    <button
      class="w-full sys-btn"
      :class="engineState === 'RUNNING' ? 'sys-btn--on' : engineState === 'STARTING' ? 'sys-btn--armed' : ''"
      :disabled="!canStartEngines"
      @click="emit('startEngines')"
    >
      {{ engineState === 'OFF' ? 'Start Engines' : engineState === 'STARTING' ? 'Starting…' : 'Engines Running' }}
    </button>
  </div>
</template>

<style scoped>
.fcu-btn {
  @apply w-6 h-5 rounded border border-white/10 bg-white/5 text-white/50 text-xs leading-none hover:bg-white/10 hover:text-white/80;
}
.sys-btn {
  @apply rounded-lg border border-white/10 bg-white/5 py-1.5 text-[11px] font-medium text-white/50 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5;
}
.sys-btn--on {
  @apply border-emerald-400/50 bg-emerald-500/15 text-emerald-200;
}
.sys-btn--armed {
  @apply border-amber-400/50 bg-amber-500/10 text-amber-200;
}
</style>
