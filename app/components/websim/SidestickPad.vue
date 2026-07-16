<script setup lang="ts">
// Inline sidestick: click+drag sets pitch/roll (springs back to center on
// release, like a real sidestick); mouse wheel over the same pad sets
// throttle. Adapted from app/pages/flightlab/medienstationen/stick-input.vue,
// which used a separate throttle slider — here the wheel replaces it per the
// WebSim design (docs/plans/2026-07-16-websim-design.md).

const props = defineProps<{
  throttle: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  stick: [pitch: number, roll: number]
  throttle: [value: number]
}>()

const pad = ref<HTMLElement | null>(null)
const stickX = ref(0) // -1 left .. +1 right (roll)
const stickY = ref(0) // -1 push .. +1 pull (pitch)
const active = ref(false)

function updateFromPointer(e: PointerEvent) {
  const el = pad.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const rawX = ((e.clientX - rect.left) / rect.width) * 2 - 1
  const rawY = ((e.clientY - rect.top) / rect.height) * 2 - 1
  stickX.value = Math.max(-1, Math.min(1, rawX))
  // Pad top = push (nose down, negative pitch); pad bottom = pull (nose up, positive pitch).
  stickY.value = Math.max(-1, Math.min(1, -rawY))
  emit('stick', stickY.value, stickX.value)
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled) return
  active.value = true
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  updateFromPointer(e)
}

function onPointerMove(e: PointerEvent) {
  if (!active.value) return
  updateFromPointer(e)
}

function onPointerUp() {
  active.value = false
  stickX.value = 0
  stickY.value = 0
  emit('stick', 0, 0)
}

function onWheel(e: WheelEvent) {
  if (props.disabled) return
  e.preventDefault()
  const delta = -e.deltaY / 1000
  emit('throttle', Math.max(0, Math.min(1, props.throttle + delta)))
}
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-[#0b1328]/90 p-3 h-full flex flex-col">
    <span class="text-[10px] uppercase tracking-widest text-white/30">Sidestick + Thrust (Mausrad)</span>
    <div class="flex-1 flex items-center justify-center">
      <div
        ref="pad"
        class="relative w-48 h-48 rounded-lg border border-white/10 bg-black/40 overflow-hidden select-none touch-none"
        :class="disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel="onWheel"
      >
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />
          <div class="absolute top-1/2 left-0 right-0 h-px bg-white/5" />
        </div>
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-white/5" />
        <div
          class="absolute w-10 h-10 rounded-full border-2 transition-transform duration-75"
          :class="active ? 'border-cyan-400 bg-cyan-500/20' : 'border-white/20 bg-white/5'"
          :style="{
            left: `calc(${(stickX + 1) / 2 * 100}% - 20px)`,
            top: `calc(${(1 - (stickY + 1) / 2) * 100}% - 20px)`,
          }"
        >
          <div class="absolute inset-0 m-auto w-3 h-3 rounded-full" :class="active ? 'bg-cyan-400' : 'bg-white/30'" />
        </div>
        <div class="absolute bottom-1 left-0 right-0 text-center text-[9px] text-white/20">Thrust {{ Math.round(throttle * 100) }}%</div>
      </div>
    </div>
  </div>
</template>
