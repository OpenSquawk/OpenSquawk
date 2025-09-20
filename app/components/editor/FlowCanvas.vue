<template>
  <div
    ref="container"
    class="flow-canvas"
    @wheel.prevent="onWheel"
    @pointerdown="onBackgroundPointerDown"
  >
    <div class="flow-canvas__viewport" :style="viewportStyle">
      <svg
        class="flow-canvas__edges"
        :width="canvasDimensions.width"
        :height="canvasDimensions.height"
      >
        <g
          v-for="edge in renderedEdges"
          :key="edge.id"
          :class="['flow-edge', `flow-edge-${edge.kind}`, { 'is-animated': edge.animated }]"
        >
          <path :d="edge.path" :stroke="edge.color" stroke-width="2" fill="none" />
          <text
            v-if="edge.label"
            class="flow-edge__label"
            :x="edge.labelPosition.x"
            :y="edge.labelPosition.y"
          >
            {{ edge.label }}
          </text>
        </g>
      </svg>
      <div
        v-for="node in nodesState"
        :key="node.id"
        :data-node-id="node.id"
        class="flow-node"
        :class="[node.className, { 'is-selected': node.id === selectedNodeId }]"
        :style="getNodeStyle(node)"
        @pointerdown.stop="onNodePointerDown(node, $event)"
        @click.stop="emitNodeSelected(node.id)"
        :ref="(el) => registerNodeElement(node.id, el as HTMLElement | null)"
      >
        <div class="flow-node__header">
          <span class="flow-node__role" :class="`role-${node.data.role}`">
            {{ node.data.role?.toUpperCase() }}
          </span>
          <span class="flow-node__phase">{{ node.data.phase }}</span>
        </div>
        <p class="flow-node__title">{{ node.data.label }}</p>
        <p v-if="node.data.autopilot" class="flow-node__automation">
          {{ node.data.autopilot }} automation rule{{ node.data.autopilot === 1 ? '' : 's' }}
        </p>
      </div>
    </div>

    <div class="flow-canvas__controls">
      <button type="button" @click="zoomOut" aria-label="Zoom out">
        <span>−</span>
      </button>
      <button type="button" @click="resetView" aria-label="Reset view">
        <span>⟳</span>
      </button>
      <button type="button" @click="fitView" aria-label="Fit content">
        <span>⬚</span>
      </button>
      <button type="button" @click="zoomIn" aria-label="Zoom in">
        <span>+</span>
      </button>
    </div>

    <div v-if="minimap.nodes.length" class="flow-canvas__minimap">
      <div
        v-for="node in minimap.nodes"
        :key="node.id"
        class="minimap-node"
        :class="[`role-${node.role}`, { 'is-selected': node.selected }]"
        :style="{
          left: `${node.x}%`,
          top: `${node.y}%`,
          width: `${node.w}%`,
          height: `${node.h}%`,
        }"
      />
      <div
        class="minimap-viewport"
        :style="{
          left: `${minimap.viewport.x}%`,
          top: `${minimap.viewport.y}%`,
          width: `${minimap.viewport.w}%`,
          height: `${minimap.viewport.h}%`,
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

export interface FlowCanvasNode {
  id: string
  position: { x: number; y: number }
  data: {
    label: string
    role: string
    phase: string
    autopilot: number
  }
  className?: string
}

export interface FlowCanvasEdge {
  id: string
  source: string
  target: string
  label?: string
  color: string
  kind: string
  animated?: boolean
}

interface RenderedEdge extends FlowCanvasEdge {
  path: string
  labelPosition: { x: number; y: number }
}

interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface MinimapNode {
  id: string
  x: number
  y: number
  w: number
  h: number
  role: string
  selected: boolean
}

interface MinimapViewport {
  x: number
  y: number
  w: number
  h: number
}

const props = defineProps<{
  nodes: FlowCanvasNode[]
  edges: FlowCanvasEdge[]
  selectedNodeId: string | null
}>()

const emit = defineEmits<{
  (e: 'node-selected', id: string): void
  (e: 'node-position-changed', payload: { id: string; position: { x: number; y: number } }): void
}>()

const DEFAULT_NODE_WIDTH = 240
const DEFAULT_NODE_HEIGHT = 120

const container = ref<HTMLDivElement | null>(null)
const containerSize = reactive({ width: 1200, height: 800 })

const nodesState = ref<FlowCanvasNode[]>([])
const edgesState = ref<FlowCanvasEdge[]>([])
const nodeRects = reactive<Record<string, { width: number; height: number }>>({})
const nodeObservers = new Map<string, ResizeObserver>()

watch(
  () => props.nodes,
  (value) => {
    nodesState.value = value.map((node) => ({
      ...node,
      position: { ...node.position },
      data: { ...node.data },
    }))
  },
  { deep: true, immediate: true },
)

watch(
  () => props.edges,
  (value) => {
    edgesState.value = value.map((edge) => ({ ...edge }))
  },
  { deep: true, immediate: true },
)

const selectedNodeId = computed(() => props.selectedNodeId || null)

const zoom = ref(1)
const viewportOffset = reactive({ x: 0, y: 0 })

const panState = ref<null | { pointerId: number; startX: number; startY: number; originX: number; originY: number }>(null)
const dragState = ref<
  | null
  | {
      pointerId: number
      nodeId: string
      startX: number
      startY: number
      originX: number
      originY: number
    }
>(null)

const canvasDimensions = computed(() => {
  const bounds = computeBounds()
  const padding = 800
  const width = Math.max(bounds.maxX - bounds.minX + padding, containerSize.width)
  const height = Math.max(bounds.maxY - bounds.minY + padding, containerSize.height)
  return { width, height }
})

const viewportStyle = computed(() => ({
  transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px) scale(${zoom.value})`,
  width: `${canvasDimensions.value.width}px`,
  height: `${canvasDimensions.value.height}px`,
  transformOrigin: '0 0',
}))

const renderedEdges = computed<RenderedEdge[]>(() => {
  const results: RenderedEdge[] = []
  for (const edge of edgesState.value) {
    const source = nodesState.value.find((node) => node.id === edge.source)
    const target = nodesState.value.find((node) => node.id === edge.target)
    if (!source || !target) continue
    const sourceRect = nodeRects[source.id] || { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }
    const targetRect = nodeRects[target.id] || { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }
    const startX = source.position.x + sourceRect.width
    const startY = source.position.y + sourceRect.height / 2
    const endX = target.position.x
    const endY = target.position.y + targetRect.height / 2
    const dx = Math.max(Math.abs(endX - startX) * 0.45, 80)
    const path = `M ${startX} ${startY} C ${startX + dx} ${startY} ${endX - dx} ${endY} ${endX} ${endY}`
    const labelPosition = {
      x: startX + (endX - startX) / 2,
      y: startY + (endY - startY) / 2 - 6,
    }
    results.push({ ...edge, path, labelPosition })
  }
  return results
})

const minimap = computed<{ nodes: MinimapNode[]; viewport: MinimapViewport }>(() => {
  const bounds = computeBounds()
  const width = Math.max(bounds.maxX - bounds.minX, 1)
  const height = Math.max(bounds.maxY - bounds.minY, 1)
  const nodes: MinimapNode[] = nodesState.value.map((node) => {
    const rect = nodeRects[node.id] || { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }
    return {
      id: node.id,
      x: ((node.position.x - bounds.minX) / width) * 100,
      y: ((node.position.y - bounds.minY) / height) * 100,
      w: (rect.width / width) * 100,
      h: (rect.height / height) * 100,
      role: node.data.role,
      selected: node.id === selectedNodeId.value,
    }
  })

  const viewport = {
    x: ((-viewportOffset.x / zoom.value - bounds.minX) / width) * 100,
    y: ((-viewportOffset.y / zoom.value - bounds.minY) / height) * 100,
    w: ((containerSize.width / zoom.value) / width) * 100,
    h: ((containerSize.height / zoom.value) / height) * 100,
  }

  return {
    nodes,
    viewport: {
      x: clamp(viewport.x, -50, 150),
      y: clamp(viewport.y, -50, 150),
      w: clamp(viewport.w, 5, 180),
      h: clamp(viewport.h, 5, 180),
    },
  }
})

function registerNodeElement(id: string, el: HTMLElement | null) {
  const previous = nodeObservers.get(id)
  if (previous) {
    previous.disconnect()
    nodeObservers.delete(id)
  }

  if (el) {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        nodeRects[id] = { width, height }
      }
    })
    observer.observe(el)
    nodeObservers.set(id, observer)
    const rect = el.getBoundingClientRect()
    nodeRects[id] = { width: rect.width, height: rect.height }
  } else {
    delete nodeRects[id]
  }
}

function computeBounds(): Bounds {
  if (!nodesState.value.length) {
    return { minX: -200, minY: -200, maxX: 200, maxY: 200 }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const node of nodesState.value) {
    const rect = nodeRects[node.id] || { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }
    const x1 = node.position.x
    const y1 = node.position.y
    const x2 = node.position.x + rect.width
    const y2 = node.position.y + rect.height
    minX = Math.min(minX, x1)
    minY = Math.min(minY, y1)
    maxX = Math.max(maxX, x2)
    maxY = Math.max(maxY, y2)
  }
  if (minX === Infinity || minY === Infinity) {
    return { minX: -200, minY: -200, maxX: 200, maxY: 200 }
  }
  return { minX, minY, maxX, maxY }
}

function getNodeStyle(node: FlowCanvasNode) {
  return {
    transform: `translate(${node.position.x}px, ${node.position.y}px)`,
  }
}

function emitNodeSelected(id: string) {
  emit('node-selected', id)
}

function onNodePointerDown(node: FlowCanvasNode, event: PointerEvent) {
  if (event.button !== 0) return
  dragState.value = {
    pointerId: event.pointerId,
    nodeId: node.id,
    startX: event.clientX,
    startY: event.clientY,
    originX: node.position.x,
    originY: node.position.y,
  }
  emitNodeSelected(node.id)
}

function onBackgroundPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  const target = event.target as HTMLElement | null
  if (target && target.closest('.flow-node')) return
  panState.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: viewportOffset.x,
    originY: viewportOffset.y,
  }
}

function onPointerMove(event: PointerEvent) {
  if (dragState.value && event.pointerId === dragState.value.pointerId) {
    const dx = (event.clientX - dragState.value.startX) / zoom.value
    const dy = (event.clientY - dragState.value.startY) / zoom.value
    const node = nodesState.value.find((entry) => entry.id === dragState.value!.nodeId)
    if (node) {
      node.position.x = dragState.value.originX + dx
      node.position.y = dragState.value.originY + dy
    }
    return
  }

  if (panState.value && event.pointerId === panState.value.pointerId) {
    const dx = event.clientX - panState.value.startX
    const dy = event.clientY - panState.value.startY
    viewportOffset.x = panState.value.originX + dx
    viewportOffset.y = panState.value.originY + dy
  }
}

function onPointerUp(event: PointerEvent) {
  if (dragState.value && event.pointerId === dragState.value.pointerId) {
    const node = nodesState.value.find((entry) => entry.id === dragState.value!.nodeId)
    if (node) {
      emit('node-position-changed', { id: node.id, position: { ...node.position } })
    }
    dragState.value = null
  }
  if (panState.value && event.pointerId === panState.value.pointerId) {
    panState.value = null
  }
}

function onWheel(event: WheelEvent) {
  const delta = event.deltaY < 0 ? 0.1 : -0.1
  const newZoom = clamp(zoom.value + delta, 0.25, 1.75)
  const rect = container.value?.getBoundingClientRect()
  if (!rect) {
    zoom.value = newZoom
    return
  }
  const mx = event.clientX - rect.left
  const my = event.clientY - rect.top
  const ratio = newZoom / zoom.value
  viewportOffset.x = mx - ratio * (mx - viewportOffset.x)
  viewportOffset.y = my - ratio * (my - viewportOffset.y)
  zoom.value = newZoom
}

function zoomIn() {
  setZoom(zoom.value + 0.15)
}

function zoomOut() {
  setZoom(zoom.value - 0.15)
}

function setZoom(value: number) {
  const clamped = clamp(value, 0.25, 1.75)
  if (clamped === zoom.value) return
  const rect = container.value?.getBoundingClientRect()
  if (!rect) {
    zoom.value = clamped
    return
  }
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const ratio = clamped / zoom.value
  viewportOffset.x = centerX - ratio * (centerX - viewportOffset.x)
  viewportOffset.y = centerY - ratio * (centerY - viewportOffset.y)
  zoom.value = clamped
}

function resetView() {
  zoom.value = 1
  viewportOffset.x = containerSize.width / 2 - canvasDimensions.value.width / 2
  viewportOffset.y = containerSize.height / 2 - canvasDimensions.value.height / 2
}

function fitView() {
  const bounds = computeBounds()
  const width = Math.max(bounds.maxX - bounds.minX, 1)
  const height = Math.max(bounds.maxY - bounds.minY, 1)
  const padding = 0.15
  const targetZoom = Math.min(
    (containerSize.width * (1 - padding)) / width,
    (containerSize.height * (1 - padding)) / height,
  )
  zoom.value = clamp(targetZoom, 0.25, 1.75)
  const centerX = bounds.minX + width / 2
  const centerY = bounds.minY + height / 2
  viewportOffset.x = containerSize.width / 2 - centerX * zoom.value
  viewportOffset.y = containerSize.height / 2 - centerY * zoom.value
}

function focusNode(id: string) {
  const node = nodesState.value.find((entry) => entry.id === id)
  if (!node) return
  const rect = nodeRects[id] || { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }
  const centerX = node.position.x + rect.width / 2
  const centerY = node.position.y + rect.height / 2
  viewportOffset.x = containerSize.width / 2 - centerX * zoom.value
  viewportOffset.y = containerSize.height / 2 - centerY * zoom.value
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

onMounted(() => {
  if (container.value) {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerSize.width = entry.contentRect.width
        containerSize.height = entry.contentRect.height
      }
    })
    observer.observe(container.value)
    onBeforeUnmount(() => observer.disconnect())
  }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  nextTick(() => fitView())
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  for (const observer of nodeObservers.values()) {
    observer.disconnect()
  }
  nodeObservers.clear()
})

defineExpose({
  focusNode,
  fitView,
  zoomIn,
  zoomOut,
  resetView,
})
</script>

<style scoped>
.flow-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(circle at top, rgba(34, 211, 238, 0.08), transparent 45%), #050b1a;
  cursor: grab;
}

.flow-canvas:active {
  cursor: grabbing;
}

.flow-canvas__viewport {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

.flow-canvas__edges {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.flow-edge path {
  stroke-linecap: round;
  stroke-linejoin: round;
}

.flow-edge.is-animated path {
  stroke-dasharray: 6 4;
  animation: dash 1.6s linear infinite;
}

.flow-edge-timer path {
  stroke-dasharray: 2 6;
}

.flow-edge-ok path {
  stroke-dasharray: 4 4;
}

.flow-edge__label {
  fill: rgba(226, 232, 240, 0.75);
  font-size: 11px;
  pointer-events: none;
  text-shadow: 0 0 6px rgba(5, 10, 20, 0.7);
}

.flow-node {
  position: absolute;
  min-width: 220px;
  max-width: 320px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(9, 15, 28, 0.92);
  color: #e2e8f0;
  font-size: 12px;
  box-shadow: 0 16px 38px -20px rgba(34, 211, 238, 0.55);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
}

.flow-node.is-selected {
  border-color: #22d3ee;
  box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.35), 0 18px 44px -22px rgba(34, 211, 238, 0.7);
}

.flow-node.is-dimmed {
  opacity: 0.32;
}

.flow-node__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 8px;
}

.flow-node__role {
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 600;
}

.flow-node__role.role-pilot {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.flow-node__role.role-atc {
  background: rgba(14, 165, 233, 0.2);
  color: #38bdf8;
}

.flow-node__role.role-system {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

.flow-node__phase {
  color: rgba(226, 232, 240, 0.6);
}

.flow-node__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  margin-bottom: 6px;
}

.flow-node__automation {
  font-size: 11px;
  color: rgba(226, 232, 240, 0.65);
}

.flow-canvas__controls {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
  background: rgba(8, 12, 24, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 16px 32px -22px rgba(15, 118, 110, 0.6);
}

.flow-canvas__controls button {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.9);
  color: rgba(226, 232, 240, 0.85);
  font-size: 16px;
  display: grid;
  place-items: center;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.flow-canvas__controls button:hover {
  background: rgba(34, 211, 238, 0.15);
  border-color: rgba(34, 211, 238, 0.6);
}

.flow-canvas__minimap {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 180px;
  height: 120px;
  border-radius: 16px;
  background: rgba(8, 12, 24, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.18);
  overflow: hidden;
}

.minimap-node {
  position: absolute;
  border-radius: 6px;
  opacity: 0.7;
}

.minimap-node.role-pilot {
  background: rgba(34, 197, 94, 0.65);
}

.minimap-node.role-atc {
  background: rgba(14, 165, 233, 0.65);
}

.minimap-node.role-system {
  background: rgba(168, 85, 247, 0.65);
}

.minimap-node.is-selected {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.minimap-viewport {
  position: absolute;
  border: 1px solid rgba(226, 232, 240, 0.7);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.2);
}

@keyframes dash {
  from {
    stroke-dashoffset: 16;
  }
  to {
    stroke-dashoffset: 0;
  }
}
</style>
