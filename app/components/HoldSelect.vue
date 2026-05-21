<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from 'vue'

export interface HoldSelectOption {
  value: string | number
  label: string
  sublabel?: string
  color?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: HoldSelectOption[]
  placement?: 'auto' | 'up' | 'down'
  disabled?: boolean
  title?: string
}>(), {
  placement: 'auto',
  disabled: false,
  title: '',
})

const emit = defineEmits<{
  (e: 'select', option: HoldSelectOption): void
}>()

const open = ref(false)
const sticky = ref(false)
const highlightIndex = ref(-1)

const triggerRef = ref<HTMLElement>()
const menuRef = ref<HTMLElement>()
const optionEls = ref<HTMLElement[]>([])
const menuStyle = ref<Record<string, string>>({})

let startX = 0
let startY = 0
let moved = false
let activePointerId: number | null = null
const MOVE_THRESHOLD = 8

const setOptionEl = (el: any, i: number) => {
  if (el) optionEls.value[i] = el as HTMLElement
}

function vibrate(ms: number) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms)
  } catch { /* ignore */ }
}

async function openMenu() {
  open.value = true
  sticky.value = false
  highlightIndex.value = -1
  optionEls.value = []
  await nextTick()
  positionMenu()
}

function positionMenu() {
  const trigger = triggerRef.value
  const menu = menuRef.value
  if (!trigger || !menu) return
  const t = trigger.getBoundingClientRect()
  const m = menu.getBoundingClientRect()
  const vh = window.innerHeight
  const vw = window.innerWidth
  const gap = 8

  let placeUp = props.placement === 'up'
  if (props.placement === 'auto') placeUp = t.top > vh / 2

  let top = placeUp ? t.top - gap - m.height : t.bottom + gap
  top = Math.max(8, Math.min(top, vh - m.height - 8))

  let left = t.left
  left = Math.max(8, Math.min(left, vw - m.width - 8))

  menuStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    minWidth: `${Math.max(t.width, 160)}px`,
  }
}

function closeMenu() {
  open.value = false
  sticky.value = false
  highlightIndex.value = -1
  removeOutsideListener()
}

function optionIndexAt(x: number, y: number): number {
  for (let i = 0; i < optionEls.value.length; i++) {
    const el = optionEls.value[i]
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i
  }
  return -1
}

function updateHighlight(x: number, y: number) {
  const idx = optionIndexAt(x, y)
  if (idx !== highlightIndex.value) {
    highlightIndex.value = idx
    if (idx >= 0 && !props.options[idx]?.disabled) vibrate(8)
  }
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled || !props.options.length) return
  if (e.pointerType === 'mouse' && e.button !== 0) return

  // If already open in sticky mode, a press on the trigger toggles it closed.
  if (sticky.value) {
    closeMenu()
    return
  }

  e.preventDefault()
  activePointerId = e.pointerId
  startX = e.clientX
  startY = e.clientY
  moved = false
  void openMenu()

  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (e.pointerId !== activePointerId) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!moved && Math.hypot(dx, dy) > MOVE_THRESHOLD) moved = true
  if (moved) {
    e.preventDefault()
    updateHighlight(e.clientX, e.clientY)
  }
}

function onPointerUp(e: PointerEvent) {
  if (e.pointerId !== activePointerId) return
  cleanupDragListeners()
  activePointerId = null

  if (moved) {
    const idx = optionIndexAt(e.clientX, e.clientY)
    const opt = idx >= 0 ? props.options[idx] : undefined
    if (opt && !opt.disabled) selectOption(opt)
    closeMenu()
  } else {
    // Plain tap: keep menu open so the user can tap an option normally.
    sticky.value = true
    highlightIndex.value = -1
    addOutsideListener()
  }
}

function cleanupDragListeners() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

function onOptionClick(opt: HoldSelectOption) {
  if (opt.disabled) return
  selectOption(opt)
  closeMenu()
}

function selectOption(opt: HoldSelectOption) {
  vibrate(12)
  emit('select', opt)
}

function onOutsidePointer(e: PointerEvent) {
  const target = e.target as Node
  if (menuRef.value?.contains(target)) return
  if (triggerRef.value?.contains(target)) return
  closeMenu()
}

function addOutsideListener() {
  window.addEventListener('pointerdown', onOutsidePointer, true)
}
function removeOutsideListener() {
  window.removeEventListener('pointerdown', onOutsidePointer, true)
}

onBeforeUnmount(() => {
  cleanupDragListeners()
  removeOutsideListener()
})
</script>

<template>
  <div
      ref="triggerRef"
      class="hold-select"
      :class="{ 'is-open': open, 'is-disabled': disabled }"
      @pointerdown="onPointerDown"
  >
    <slot :open="open" :sticky="sticky" />

    <Teleport to="body">
      <div
          v-if="open"
          ref="menuRef"
          class="hold-select-menu"
          :style="menuStyle"
      >
        <p v-if="title" class="hs-title">{{ title }}</p>
        <div
            v-for="(opt, i) in options"
            :key="opt.value"
            :ref="(el) => setOptionEl(el, i)"
            class="hs-option"
            :class="{
              'is-highlight': i === highlightIndex,
              'is-disabled': opt.disabled,
            }"
            :style="opt.color ? { '--hs-accent': opt.color } : undefined"
            @click="onOptionClick(opt)"
        >
          <slot name="option" :option="opt" :highlighted="i === highlightIndex">
            <span class="hs-opt-label">{{ opt.label }}</span>
            <span v-if="opt.sublabel" class="hs-opt-sub">{{ opt.sublabel }}</span>
          </slot>
        </div>
        <p v-if="!options.length" class="hs-empty">Keine Optionen</p>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.hold-select {
  display: inline-flex;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.hold-select.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.hold-select-menu {
  position: fixed;
  z-index: 4000;
  max-height: min(60vh, 420px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  border-radius: 18px;
  background: rgba(8, 13, 24, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px);
  animation: hs-pop 120ms ease-out;
}
@keyframes hs-pop {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.hs-title {
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  padding: 4px 10px 2px;
}

.hs-option {
  --hs-accent: #22d3ee;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 90ms ease, border-color 90ms ease;
}
.hs-option.is-highlight {
  background: color-mix(in srgb, var(--hs-accent) 22%, transparent);
  border-color: color-mix(in srgb, var(--hs-accent) 60%, transparent);
}
@media (hover: hover) {
  .hs-option:hover {
    background: rgba(255, 255, 255, 0.06);
  }
}
.hs-option.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hs-opt-label {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}
.hs-opt-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.hs-empty {
  padding: 12px 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
