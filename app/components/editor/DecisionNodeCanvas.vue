<template>
  <div class="relative h-full w-full overflow-hidden">
    <div
      ref="canvasRef"
      class="relative h-full w-full cursor-grab select-none"
      @pointerdown="onBackgroundPointerDown"
      @wheel.prevent="onWheel"
    >
      <div class="absolute inset-0" :style="gridStyle"></div>
      <div
        class="absolute top-0 left-0 origin-top-left"
        :style="transformStyle"
      >
        <svg class="absolute top-0 left-0" :width="canvasBounds.width" :height="canvasBounds.height" fill="none">
          <g>
            <path
              v-for="edge in edges"
              :key="edge.id"
              :d="edge.path"
              :stroke="edge.color"
              :stroke-width="edge.highlighted ? 3 : 1.75"
              :stroke-dasharray="edge.dashed ? '6 6' : undefined"
              stroke-linecap="'round'"
              stroke-linejoin="'round'"
              class="transition-all duration-150"
              opacity="0.9"
            />
          </g>
        </svg>

        <div
          v-for="node in preparedNodes"
          :key="node.id"
          class="absolute rounded-2xl border backdrop-blur transition-all duration-150"
          :class="[
            node.selected ? 'ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/20' : 'shadow-lg shadow-black/40',
            node.dimmed ? 'opacity-30' : 'opacity-100',
          ]"
          :style="nodeStyle(node)"
          data-node
          @pointerdown.stop="(event) => onNodePointerDown(event, node)"
          @dblclick.prevent="() => emit('select', node.id)"
        >
          <div class="flex items-center justify-between gap-2 px-4 pt-3">
            <div class="flex items-center gap-2">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                :style="{ backgroundColor: node.accent, color: '#041726' }"
              >
                {{ node.role }}
              </span>
              <span class="text-xs uppercase tracking-wider text-white/50">{{ node.phase }}</span>
            </div>
            <div class="flex items-center gap-1 text-xs text-white/60">
              <span v-if="node.isStart" class="rounded bg-emerald-400/20 px-1.5 py-0.5 text-emerald-200">Start</span>
              <span v-if="node.isEnd" class="rounded bg-purple-400/20 px-1.5 py-0.5 text-purple-200">End</span>
            </div>
          </div>
          <div class="space-y-1 px-4 pb-3 pt-1">
            <p class="font-mono text-xs tracking-wider text-cyan-200/80">{{ node.id }}</p>
            <p class="text-base font-semibold text-white/90">{{ node.title || 'Untitled node' }}</p>
            <p class="line-clamp-2 text-sm text-white/60">{{ node.summary }}</p>
            <div class="flex flex-wrap gap-1 pt-1">
              <span
                v-for="transition in node.previewTransitions"
                :key="transition.key"
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                :class="transition.class"
                @click.stop="emit('navigate', transition.target)"
              >
                <span class="font-mono">→ {{ transition.target }}</span>
                <span v-if="transition.type !== 'next'" class="uppercase tracking-wider">{{ transition.type }}</span>
              </span>
            </div>
            <div v-if="node.autopCount > 0" class="flex items-center gap-1 text-xs text-amber-200">
              <v-icon icon="mdi-auto-fix" size="16" class="text-amber-300" />
              <span>{{ node.autopCount }} auto trigger{{ node.autopCount > 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="pointer-events-none absolute right-4 top-4 flex flex-col gap-2 text-white">
      <button class="control-btn" @click.prevent="adjustZoom(1.1)">
        <v-icon icon="mdi-magnify-plus-outline" size="18" />
      </button>
      <button class="control-btn" @click.prevent="adjustZoom(0.9)">
        <v-icon icon="mdi-magnify-minus-outline" size="18" />
      </button>
      <button class="control-btn" @click.prevent="resetView">
        <v-icon icon="mdi-crosshairs-gps" size="18" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type {
  DecisionNodeModel,
  DecisionNodeTransition,
  DecisionNodeLayout,
} from '~/shared/types/decision'

const NODE_WIDTH = 280
const NODE_HEIGHT = 160
const WORKSPACE_PADDING = 800
const MIN_WORKSPACE_WIDTH = 4000
const MIN_WORKSPACE_HEIGHT = 2800
const DRAG_MARGIN = 200

interface CanvasNodePreviewTransition {
  key: string
  target: string
  type: DecisionNodeTransition['type']
  class: string
}

interface CanvasNodeInput {
  id: string
  model: DecisionNodeModel
  layout: DecisionNodeLayout
  role: string
  phase: string
  title?: string
  summary?: string
  selected: boolean
  highlight: boolean
  dimmed: boolean
  isStart: boolean
  isEnd: boolean
  autopCount: number
  accent: string
}

interface CanvasPan {
  x: number
  y: number
}

const props = withDefaults(
  defineProps<{
    nodes: CanvasNodeInput[]
    zoom: number
    pan: CanvasPan
    roleColors: Record<string, string>
  }>(),
  {
    zoom: 1,
    pan: () => ({ x: 0, y: 0 }),
  }
)

const emit = defineEmits<{
  (event: 'select', stateId: string): void
  (event: 'navigate', stateId: string): void
  (event: 'node-move', payload: { stateId: string; x: number; y: number }): void
  (event: 'node-drop', payload: { stateId: string; x: number; y: number }): void
  (event: 'update:pan', value: CanvasPan): void
  (event: 'update:zoom', value: number): void
}>()

const canvasRef = ref<HTMLDivElement | null>(null)
const currentPan = ref<CanvasPan>({ ...props.pan })
const currentZoom = ref(props.zoom)

watch(
  () => props.pan,
  (value) => {
    currentPan.value = { ...value }
  },
  { deep: true }
)

watch(
  () => props.zoom,
  (value) => {
    currentZoom.value = value
  }
)

const transformStyle = computed(() => ({
  transform: `translate(${currentPan.value.x}px, ${currentPan.value.y}px) scale(${currentZoom.value})`,
}))

const preparedNodes = computed(() =>
  props.nodes.map((node) => {
    const width = node.layout?.width ?? NODE_WIDTH
    const height = node.layout?.height ?? NODE_HEIGHT
    const accent = node.layout?.color || props.roleColors[node.role] || '#22d3ee'
    const transitions = (node.model.transitions || []).slice(0, 3).map((transition) => ({
      key: transition.key || `${node.id}_${transition.target}_${transition.type}`,
      target: transition.target,
      type: transition.type,
      class: transitionClass(transition),
    }))

    return {
      ...node,
      width,
      height,
      accent,
      previewTransitions: transitions as CanvasNodePreviewTransition[],
    }
  })
)

const canvasBounds = computed(() => {
  const defaultWidth = MIN_WORKSPACE_WIDTH - WORKSPACE_PADDING
  const defaultHeight = MIN_WORKSPACE_HEIGHT - WORKSPACE_PADDING
  const maxX = Math.max(
    ...preparedNodes.value.map((node) => node.layout.x + node.width),
    defaultWidth
  )
  const maxY = Math.max(
    ...preparedNodes.value.map((node) => node.layout.y + node.height),
    defaultHeight
  )
  return {
    width: Math.max(maxX + WORKSPACE_PADDING, MIN_WORKSPACE_WIDTH),
    height: Math.max(maxY + WORKSPACE_PADDING, MIN_WORKSPACE_HEIGHT),
  }
})

interface EdgeDefinition {
  id: string
  from: string
  to: string
  path: string
  color: string
  dashed: boolean
  highlighted: boolean
}

const edges = computed<EdgeDefinition[]>(() => {
  const positions = new Map(
    preparedNodes.value.map((node) => [
      node.id,
      {
        x: node.layout.x,
        y: node.layout.y,
        width: node.width,
        height: node.height,
        highlighted: node.highlight || node.selected,
      },
    ])
  )

  const lines: EdgeDefinition[] = []

  for (const node of preparedNodes.value) {
    const source = positions.get(node.id)
    if (!source) continue

    for (const transition of node.model.transitions || []) {
      const target = positions.get(transition.target)
      if (!target) continue
      const path = computeEdgePath(source, target)
      const color = transitionColor(transition)
      const dashed = Boolean(transition.autoTrigger || transition.type === 'auto')
      const highlighted = node.selected || source.highlighted
      const key = transition.key || `${node.id}_${transition.target}_${transition.type}`

      lines.push({
        id: key,
        from: node.id,
        to: transition.target,
        path,
        color,
        dashed,
        highlighted,
      })
    }
  }

  return lines
})

const gridStyle = computed(() => ({
  backgroundImage:
    'radial-gradient(circle at 1px 1px, rgba(120, 148, 196, 0.18) 1px, transparent 0)',
  backgroundSize: '32px 32px',
  transform: `translate(${currentPan.value.x}px, ${currentPan.value.y}px) scale(${currentZoom.value})`,
  transformOrigin: '0 0',
  opacity: 0.5,
}))

function transitionClass(transition: DecisionNodeTransition) {
  switch (transition.type) {
    case 'ok':
      return 'bg-emerald-500/15 text-emerald-200'
    case 'bad':
      return 'bg-orange-500/15 text-orange-200'
    case 'timer':
      return 'bg-amber-500/15 text-amber-200'
    case 'auto':
      return 'bg-cyan-500/15 text-cyan-200'
    case 'interrupt':
      return 'bg-rose-500/15 text-rose-200'
    case 'return':
      return 'bg-purple-500/15 text-purple-200'
    default:
      return 'bg-slate-500/10 text-slate-200'
  }
}

function transitionColor(transition: DecisionNodeTransition) {
  if (transition.autoTrigger || transition.type === 'auto') {
    return '#38bdf8'
  }
  switch (transition.type) {
    case 'ok':
      return '#22c55e'
    case 'bad':
      return '#f97316'
    case 'timer':
      return '#eab308'
    case 'interrupt':
      return '#f43f5e'
    case 'return':
      return '#a855f7'
    default:
      return '#7dd3fc'
  }
}

function computeEdgePath(source: { x: number; y: number; width: number; height: number }, target: { x: number; y: number; width: number; height: number }) {
  const startX = source.x + source.width
  const startY = source.y + source.height / 2
  const endX = target.x
  const endY = target.y + target.height / 2
  const deltaX = Math.max(80, Math.abs(endX - startX) / 1.5)
  const control1X = startX + deltaX
  const control2X = endX - deltaX
  return `M ${startX} ${startY} C ${control1X} ${startY}, ${control2X} ${endY}, ${endX} ${endY}`
}

let panPointerId: number | null = null
let panStart: CanvasPan = { x: 0, y: 0 }
let pointerOrigin = { x: 0, y: 0 }

function onBackgroundPointerDown(event: PointerEvent) {
  if ((event.target as HTMLElement)?.closest('[data-node]')) {
    return
  }
  if (event.button !== 0) return
  panPointerId = event.pointerId
  panStart = { ...currentPan.value }
  pointerOrigin = { x: event.clientX, y: event.clientY }
  canvasRef.value?.setPointerCapture(event.pointerId)
  canvasRef.value?.classList.add('cursor-grabbing')
  window.addEventListener('pointermove', onPanPointerMove)
  window.addEventListener('pointerup', onPanPointerUp, { once: true })
}

function onPanPointerMove(event: PointerEvent) {
  if (panPointerId !== event.pointerId) return
  const dx = event.clientX - pointerOrigin.x
  const dy = event.clientY - pointerOrigin.y
  const updated = { x: panStart.x + dx, y: panStart.y + dy }
  currentPan.value = updated
  emit('update:pan', updated)
}

function onPanPointerUp(event: PointerEvent) {
  if (panPointerId !== event.pointerId) return
  panPointerId = null
  canvasRef.value?.classList.remove('cursor-grabbing')
  window.removeEventListener('pointermove', onPanPointerMove)
}

interface DragState {
  nodeId: string
  offsetX: number
  offsetY: number
  width: number
  height: number
}

let dragState: DragState | null = null

function onNodePointerDown(event: PointerEvent, node: ReturnType<typeof preparedNodes.value[number]>) {
  if (event.button !== 0) return
  emit('select', node.id)
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  const canvasX = (event.clientX - rect.left - currentPan.value.x) / currentZoom.value
  const canvasY = (event.clientY - rect.top - currentPan.value.y) / currentZoom.value
  dragState = {
    nodeId: node.id,
    offsetX: canvasX - node.layout.x,
    offsetY: canvasY - node.layout.y,
    width: node.width,
    height: node.height,
  }
  window.addEventListener('pointermove', onNodePointerMove)
  window.addEventListener('pointerup', onNodePointerUp, { once: true })
}

function onNodePointerMove(event: PointerEvent) {
  if (!dragState) return
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  const canvasX = (event.clientX - rect.left - currentPan.value.x) / currentZoom.value
  const canvasY = (event.clientY - rect.top - currentPan.value.y) / currentZoom.value
  const x = canvasX - dragState.offsetX
  const y = canvasY - dragState.offsetY
  const clamped = clampToWorkspace(x, y, {
    width: dragState.width,
    height: dragState.height,
  })
  emit('node-move', { stateId: dragState.nodeId, x: clamped.x, y: clamped.y })
}

function onNodePointerUp(event: PointerEvent) {
  if (!dragState) return
  const rect = canvasRef.value?.getBoundingClientRect()
  if (rect) {
    const canvasX = (event.clientX - rect.left - currentPan.value.x) / currentZoom.value
    const canvasY = (event.clientY - rect.top - currentPan.value.y) / currentZoom.value
    const x = canvasX - dragState.offsetX
    const y = canvasY - dragState.offsetY
    const clamped = clampToWorkspace(x, y, {
      width: dragState.width,
      height: dragState.height,
    })
    emit('node-drop', { stateId: dragState.nodeId, x: clamped.x, y: clamped.y })
  }
  dragState = null
  window.removeEventListener('pointermove', onNodePointerMove)
}

function clampToWorkspace(x: number, y: number, size: { width: number; height: number }) {
  const maxX = Math.max(0, canvasBounds.value.width - size.width - DRAG_MARGIN)
  const maxY = Math.max(0, canvasBounds.value.height - size.height - DRAG_MARGIN)
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  }
}

function adjustZoom(multiplier: number) {
  const next = Math.min(2.6, Math.max(0.3, currentZoom.value * multiplier))
  currentZoom.value = next
  emit('update:zoom', next)
}

function resetView() {
  currentZoom.value = 1
  currentPan.value = { x: 0, y: 0 }
  emit('update:zoom', 1)
  emit('update:pan', { x: 0, y: 0 })
}

function onWheel(event: WheelEvent) {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  const wheelDelta = event.deltaY > 0 ? 0.9 : 1.1
  const targetZoom = Math.min(2.6, Math.max(0.3, currentZoom.value * wheelDelta))

  const offsetX = event.clientX - rect.left
  const offsetY = event.clientY - rect.top

  const scale = targetZoom / currentZoom.value
  const nextPanX = offsetX - (offsetX - currentPan.value.x) * scale
  const nextPanY = offsetY - (offsetY - currentPan.value.y) * scale

  currentZoom.value = targetZoom
  currentPan.value = { x: nextPanX, y: nextPanY }
  emit('update:zoom', targetZoom)
  emit('update:pan', { x: nextPanX, y: nextPanY })
}

function nodeStyle(node: ReturnType<typeof preparedNodes.value[number]>) {
  return {
    width: `${node.width}px`,
    height: `${node.height}px`,
    left: `${node.layout.x}px`,
    top: `${node.layout.y}px`,
    background: 'rgba(7, 13, 26, 0.85)',
    borderColor: node.selected ? '#22d3ee' : 'rgba(148, 163, 184, 0.3)',
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onNodePointerMove)
  window.removeEventListener('pointermove', onPanPointerMove)
})
</script>

<style scoped>
.control-btn {
  @apply pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-white/80 transition hover:border-cyan-400 hover:text-cyan-200;
}
</style>
