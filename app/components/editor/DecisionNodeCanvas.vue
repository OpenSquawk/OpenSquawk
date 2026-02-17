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
              stroke-linecap="round"
              stroke-linejoin="round"
              class="transition-all duration-150"
              opacity="0.9"
            />
          </g>
        </svg>

        <div
          v-for="node in preparedNodes"
          :key="node.id"
          class="group absolute rounded-2xl border backdrop-blur transition-all duration-150"
          :class="[
            node.selected ? 'ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/20' : 'shadow-lg shadow-black/40',
            node.dimmed ? 'opacity-30' : 'opacity-100',
          ]"
          :style="nodeStyle(node)"
          data-node
          @pointerdown.stop="(event) => onNodePointerDown(event, node)"
          @dblclick.prevent="() => emit('select', node.id)"
        >
          <v-tooltip location="top" :open-delay="120">
            <template #activator="{ props }">
              <button
                class="node-add node-add--top"
                :class="{ 'node-add--connected': connections(node.id, 'incoming').length > 0 }"
                v-bind="props"
                @click.stop="emit('add-before', node.id)"
              >
                <v-icon icon="mdi-plus" size="16" />
              </button>
            </template>
            <div class="node-connection-tooltip">
              <p class="node-connection-tooltip__title">Eingehende Verbindungen</p>
              <p
                v-if="!connections(node.id, 'incoming').length"
                class="node-connection-tooltip__empty"
              >
                Keine eingehenden Verbindungen
              </p>
              <ul v-else class="node-connection-tooltip__list">
                <li
                  v-for="connection in connections(node.id, 'incoming')"
                  :key="connection.key"
                  class="node-connection-tooltip__item"
                >
                  <span class="node-connection-tooltip__id">{{ connection.id }}</span>
                  <span v-if="connection.title" class="node-connection-tooltip__title-text">— {{ connection.title }}</span>
                  <span
                    class="node-connection-tooltip__badge"
                    :class="{ 'node-connection-tooltip__badge--auto': connection.auto }"
                  >
                    {{ connectionLabel(connection) }}
                  </span>
                </li>
              </ul>
            </div>
          </v-tooltip>
          <v-tooltip location="bottom" :open-delay="120">
            <template #activator="{ props }">
              <button
                class="node-add node-add--bottom"
                :class="{ 'node-add--connected': connections(node.id, 'outgoing').length > 0 }"
                v-bind="props"
                @click.stop="emit('add-after', node.id)"
              >
                <v-icon icon="mdi-plus" size="16" />
              </button>
            </template>
            <div class="node-connection-tooltip">
              <p class="node-connection-tooltip__title">Ausgehende Verbindungen</p>
              <p
                v-if="!connections(node.id, 'outgoing').length"
                class="node-connection-tooltip__empty"
              >
                Keine ausgehenden Verbindungen
              </p>
              <ul v-else class="node-connection-tooltip__list">
                <li
                  v-for="connection in connections(node.id, 'outgoing')"
                  :key="connection.key"
                  class="node-connection-tooltip__item"
                >
                  <span class="node-connection-tooltip__id">{{ connection.id }}</span>
                  <span v-if="connection.title" class="node-connection-tooltip__title-text">— {{ connection.title }}</span>
                  <span
                    class="node-connection-tooltip__badge"
                    :class="{ 'node-connection-tooltip__badge--auto': connection.auto }"
                  >
                    {{ connectionLabel(connection) }}
                  </span>
                </li>
              </ul>
            </div>
          </v-tooltip>
          <span class="node-connector node-connector--input" />
          <span class="node-connector node-connector--output" />
          <div class="flex h-full flex-col">
            <div class="flex items-center justify-between gap-2 px-4 pt-4">
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
            <div class="flex flex-1 flex-col gap-2 px-4 pb-4 pt-2">
              <div class="space-y-1">
                <p class="font-mono text-xs tracking-wider text-cyan-200/80">{{ node.id }}</p>
                <p class="text-base font-semibold text-white/90">{{ node.title || 'Untitled node' }}</p>
                <p class="line-clamp-2 text-sm text-white/60">{{ node.summary }}</p>
              </div>
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
    </div>
    <div class="pointer-events-none fixed left-4 top-20 flex flex-col gap-2 text-white">
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
    <div
      ref="minimapRef"
      class="pointer-events-auto fixed bottom-4 left-4 z-1000 rounded-xl border border-white/10 bg-black/40 p-3 shadow-lg"
      style="z-index:1000"
      @click="onMinimapClick"
    >
      <svg :width="minimapSize.width" :height="minimapSize.height" class="block text-white/70">
        <g>
          <rect
            v-for="node in preparedNodes"
            :key="node.id"
            :x="(node.layout.x - minimapBounds.minX) * minimapScale"
            :y="(node.layout.y - minimapBounds.minY) * minimapScale"
            :width="Math.max(6, node.width * minimapScale)"
            :height="Math.max(6, node.height * minimapScale)"
            :fill="node.selected ? '#22d3ee' : 'rgba(148, 163, 184, 0.45)'"
            :opacity="node.selected ? 0.9 : 0.5"
            rx="4"
            ry="4"
          />
        </g>
        <rect
          :x="viewportRect.x"
          :y="viewportRect.y"
          :width="viewportRect.width"
          :height="viewportRect.height"
          fill="rgba(34, 211, 238, 0.12)"
          stroke="#22d3ee"
          stroke-width="1.2"
          rx="6"
          ry="6"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  DecisionNodeModel,
  DecisionNodeTransition,
  DecisionNodeLayout,
} from '~~/shared/types/decision'

const NODE_WIDTH = 280
const NODE_HEIGHT = 160
const WORKSPACE_PADDING = 800
const MIN_WORKSPACE_WIDTH = 4000
const MIN_WORKSPACE_HEIGHT = 2800
const MIN_NODE_MARGIN_X = 200
const MIN_NODE_MARGIN_Y = 120
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

interface NodeConnectionPreview {
  key: string
  id: string
  title?: string
  type: DecisionNodeTransition['type']
  auto: boolean
}

type ConnectionDirection = 'incoming' | 'outgoing'

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
  (event: 'add-before', stateId: string): void
  (event: 'add-after', stateId: string): void
  (event: 'node-drag-start', stateId: string): void
  (event: 'node-move', payload: { stateId: string; x: number; y: number }): void
  (event: 'node-drop', payload: { stateId: string; x: number; y: number }): void
  (event: 'update:pan', value: CanvasPan): void
  (event: 'update:zoom', value: number): void
}>()

const canvasRef = ref<HTMLDivElement | null>(null)
const currentPan = ref<CanvasPan>({ ...props.pan })
const currentZoom = ref(props.zoom)
const viewportSize = ref({ width: 0, height: 0 })
const minimapRef = ref<HTMLDivElement | null>(null)

const MINIMAP_WIDTH = 220
const MINIMAP_HEIGHT = 160
const MINIMAP_PADDING = 200

let resizeObserver: ResizeObserver | null = null

const workspaceOffset = computed(() => {
  if (!props.nodes.length) {
    return { x: MIN_NODE_MARGIN_X, y: MIN_NODE_MARGIN_Y }
  }
  const minX = Math.min(...props.nodes.map((node) => node.layout?.x ?? 0))
  const minY = Math.min(...props.nodes.map((node) => node.layout?.y ?? 0))
  return {
    x: Math.max(0, MIN_NODE_MARGIN_X - minX),
    y: Math.max(0, MIN_NODE_MARGIN_Y - minY),
  }
})

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

onMounted(() => {
  if (!canvasRef.value) return
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      viewportSize.value = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }
    }
  })
  resizeObserver.observe(canvasRef.value)
  const rect = canvasRef.value.getBoundingClientRect()
  viewportSize.value = { width: rect.width, height: rect.height }
})

const transformStyle = computed(() => ({
  transform: `translate(${currentPan.value.x}px, ${currentPan.value.y}px) scale(${currentZoom.value})`,
}))

const minimapBounds = computed(() => {
  if (!preparedNodes.value.length) {
    return { minX: 0, minY: 0, width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }
  }
  const minX = Math.min(...preparedNodes.value.map((node) => node.layout.x))
  const minY = Math.min(...preparedNodes.value.map((node) => node.layout.y))
  const maxX = Math.max(...preparedNodes.value.map((node) => node.layout.x + node.width))
  const maxY = Math.max(...preparedNodes.value.map((node) => node.layout.y + node.height))
  const width = Math.max(1, maxX - minX + MINIMAP_PADDING * 2)
  const height = Math.max(1, maxY - minY + MINIMAP_PADDING * 2)
  return {
    minX: minX - MINIMAP_PADDING,
    minY: minY - MINIMAP_PADDING,
    width,
    height,
  }
})

const minimapScale = computed(() => {
  const bounds = minimapBounds.value
  const scaleX = MINIMAP_WIDTH / bounds.width
  const scaleY = MINIMAP_HEIGHT / bounds.height
  return Math.min(scaleX, scaleY)
})

const minimapSize = computed(() => {
  const bounds = minimapBounds.value
  const scale = minimapScale.value
  return {
    width: Math.max(80, bounds.width * scale),
    height: Math.max(60, bounds.height * scale),
  }
})

const viewportRect = computed(() => {
  const bounds = minimapBounds.value
  const scale = minimapScale.value
  const zoom = currentZoom.value || 1
  const viewWidth = viewportSize.value.width / zoom
  const viewHeight = viewportSize.value.height / zoom
  const worldX = (-currentPan.value.x) / zoom
  const worldY = (-currentPan.value.y) / zoom
  return {
    x: (worldX - bounds.minX) * scale,
    y: (worldY - bounds.minY) * scale,
    width: Math.max(12, viewWidth * scale),
    height: Math.max(12, viewHeight * scale),
  }
})

const preparedNodes = computed(() => {
  const offset = workspaceOffset.value
  return props.nodes.map((node) => {
    const width = node.layout?.width ?? NODE_WIDTH
    const height = node.layout?.height ?? NODE_HEIGHT
    const accent = node.layout?.color || props.roleColors[node.role] || '#22d3ee'
    const transitions = (node.model.transitions || []).slice(0, 3).map((transition: DecisionNodeTransition) => ({
      key: transition.key || `${node.id}_${transition.target}_${transition.type}`,
      target: transition.target,
      type: transition.type,
      class: transitionClass(transition),
    }))

    const baseLayout: DecisionNodeLayout = {
      x: node.layout?.x ?? 0,
      y: node.layout?.y ?? 0,
      width: node.layout?.width,
      height: node.layout?.height,
      color: node.layout?.color,
      icon: node.layout?.icon,
      locked: node.layout?.locked,
    }
    const displayLayout: DecisionNodeLayout = {
      ...baseLayout,
      x: (baseLayout.x ?? 0) + offset.x,
      y: (baseLayout.y ?? 0) + offset.y,
      width,
      height,
    }

    return {
      ...node,
      width,
      height,
      accent,
      layout: displayLayout,
      previewTransitions: transitions as CanvasNodePreviewTransition[],
    }
  })
})

type PreparedNode = typeof preparedNodes.value[number]

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

const nodeConnections = computed(() => {
  const lookup = new Map<string, CanvasNodeInput>()
  const result = new Map<string, { incoming: NodeConnectionPreview[]; outgoing: NodeConnectionPreview[] }>()

  for (const node of props.nodes) {
    lookup.set(node.id, node)
    result.set(node.id, { incoming: [], outgoing: [] })
  }

  for (const node of props.nodes) {
    const transitions = node.model.transitions || []
    for (const transition of transitions) {
      const key = transition.key || `${node.id}_${transition.target}_${transition.type}`
      const outgoingEntry = result.get(node.id)
      if (outgoingEntry) {
        outgoingEntry.outgoing.push({
          key: `out-${key}`,
          id: transition.target,
          title: lookup.get(transition.target)?.title,
          type: transition.type,
          auto: Boolean(transition.autoTrigger || transition.type === 'auto'),
        })
      }

      const targetEntry = result.get(transition.target)
      if (targetEntry) {
        targetEntry.incoming.push({
          key: `in-${key}`,
          id: node.id,
          title: node.title,
          type: transition.type,
          auto: Boolean(transition.autoTrigger || transition.type === 'auto'),
        })
      }
    }
  }

  return result
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

interface NodePosition {
  x: number
  y: number
  width: number
  height: number
  highlighted?: boolean
}

const edges = computed<EdgeDefinition[]>(() => {
  const positions = new Map<string, NodePosition>(
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
      const path = computeEdgePath(source, target, {
        selfLoop: transition.target === node.id,
      })
      const color = transitionColor(transition)
      const dashed = Boolean(transition.autoTrigger || transition.type === 'auto')
      const highlighted = Boolean(node.selected || source.highlighted)
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

function focusNode(stateId: string) {
  const node = preparedNodes.value.find((entry) => entry.id === stateId)
  if (!node) return
  const width = viewportSize.value.width || canvasBounds.value.width
  const height = viewportSize.value.height || canvasBounds.value.height
  const zoomX = width / (node.width + 160)
  const zoomY = height / (node.height + 200)
  const targetZoom = Math.min(2.5, Math.max(0.4, Math.min(zoomX, zoomY)))
  currentZoom.value = targetZoom
  const centerX = node.layout.x + node.width / 2
  const centerY = node.layout.y + node.height / 2
  const panX = width / 2 - centerX * targetZoom
  const panY = height / 2 - centerY * targetZoom
  currentPan.value = { x: panX, y: panY }
  emit('update:zoom', targetZoom)
  emit('update:pan', { x: panX, y: panY })
}

defineExpose({ focusNode })

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

function connections(nodeId: string, direction: ConnectionDirection) {
  const entry = nodeConnections.value.get(nodeId)
  if (!entry) return []
  return entry[direction]
}

function connectionLabel(connection: NodeConnectionPreview) {
  if (connection.auto) {
    return 'AUTO'
  }
  return connection.type.toUpperCase()
}

type PathPoint = { x: number; y: number }

function computeEdgePath(
  source: NodePosition,
  target: NodePosition,
  options: { selfLoop?: boolean } = {}
) {
  if (options.selfLoop) {
    return computeSelfLoopPath(source)
  }

  const startX = source.x + source.width / 2
  const startY = source.y + source.height
  const endX = target.x + target.width / 2
  const endY = target.y

  if (endY >= startY) {
    const verticalDistance = endY - startY
    const deltaY = Math.max(80, verticalDistance / 1.5)
    const control1Y = startY + deltaY
    const control2Y = endY - Math.min(deltaY, verticalDistance / 2)
    return `M ${startX} ${startY} C ${startX} ${control1Y}, ${endX} ${control2Y}, ${endX} ${endY}`
  }

  const exitOffset = Math.max(24, Math.min(72, source.height * 0.25))
  const horizontalGap = Math.abs(endX - startX)
  const horizontalExtra = Math.max(180, horizontalGap * 0.6)
  const outerRight = Math.max(source.x + source.width, target.x + target.width)
  const outerLeft = Math.min(source.x, target.x)
  const direction = endX >= startX ? 1 : -1
  const sideX = direction === 1 ? outerRight + horizontalExtra : outerLeft - horizontalExtra
  const dropY = startY + exitOffset
  const topCandidate = Math.min(source.y, target.y) - 100
  const topLimit = Math.min(startY - 60, endY - 60)
  let loopTop = Math.min(topCandidate, topLimit)

  if (!Number.isFinite(loopTop)) {
    loopTop = topLimit
  }
  if (!Number.isFinite(loopTop)) {
    loopTop = startY - 80
  }
  if (loopTop >= dropY - 20) {
    loopTop = dropY - 60
  }

  const points: PathPoint[] = [
    { x: startX, y: startY },
    { x: startX, y: dropY },
    { x: sideX, y: dropY },
    { x: sideX, y: loopTop },
    { x: endX, y: loopTop },
    { x: endX, y: endY },
  ]

  return buildSmoothPath(points, 48)
}

function computeSelfLoopPath(node: NodePosition) {
  const startX = node.x + node.width / 2
  const startY = node.y + node.height
  const exitOffset = Math.max(28, Math.min(72, node.height * 0.25))
  const sideOffset = Math.max(200, node.width * 0.75)
  const sideX = node.x + node.width + sideOffset
  const loopTop = node.y - 120

  const points: PathPoint[] = [
    { x: startX, y: startY },
    { x: startX, y: startY + exitOffset },
    { x: sideX, y: startY + exitOffset },
    { x: sideX, y: loopTop },
    { x: startX, y: loopTop },
    { x: startX, y: node.y },
  ]

  return buildSmoothPath(points, 44)
}

function buildSmoothPath(points: PathPoint[], radius = 32) {
  if (points.length < 2) {
    return ''
  }

  const first = points[0]!
  const commands: string[] = [`M ${first.x} ${first.y}`]

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const next = points[i + 1]

    if (!next) {
      commands.push(`L ${curr.x} ${curr.y}`)
      continue
    }

    const prevVectorX = curr.x - prev.x
    const prevVectorY = curr.y - prev.y
    const nextVectorX = next.x - curr.x
    const nextVectorY = next.y - curr.y
    const prevLength = Math.hypot(prevVectorX, prevVectorY)
    const nextLength = Math.hypot(nextVectorX, nextVectorY)

    if (prevLength === 0 || nextLength === 0) {
      commands.push(`L ${curr.x} ${curr.y}`)
      continue
    }

    const startOffset = Math.min(radius, prevLength / 2)
    const endOffset = Math.min(radius, nextLength / 2)

    const startX = curr.x - (prevVectorX / prevLength) * startOffset
    const startY = curr.y - (prevVectorY / prevLength) * startOffset
    const endX = curr.x + (nextVectorX / nextLength) * endOffset
    const endY = curr.y + (nextVectorY / nextLength) * endOffset

    commands.push(`L ${startX} ${startY}`)
    commands.push(`Q ${curr.x} ${curr.y} ${endX} ${endY}`)
  }

  return commands.join(' ')
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

function onNodePointerDown(event: PointerEvent, node: PreparedNode) {
  if (event.button !== 0) return
  emit('select', node.id)
  emit('node-drag-start', node.id)
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
  const actual = toActualPosition(clamped)
  emit('node-move', { stateId: dragState.nodeId, x: actual.x, y: actual.y })
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
    const actual = toActualPosition(clamped)
    emit('node-drop', { stateId: dragState.nodeId, x: actual.x, y: actual.y })
  }
  dragState = null
  window.removeEventListener('pointermove', onNodePointerMove)
}

function toActualPosition(position: { x: number; y: number }) {
  const offset = workspaceOffset.value
  return {
    x: Math.max(0, position.x - offset.x),
    y: Math.max(0, position.y - offset.y),
  }
}

function clampToWorkspace(x: number, y: number, size: { width: number; height: number }) {
  const offset = workspaceOffset.value
  const minX = offset.x
  const minY = offset.y
  const maxX = Math.max(minX, canvasBounds.value.width - size.width - DRAG_MARGIN)
  const maxY = Math.max(minY, canvasBounds.value.height - size.height - DRAG_MARGIN)
  return {
    x: Math.min(Math.max(minX, x), maxX),
    y: Math.min(Math.max(minY, y), maxY),
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

function onMinimapClick(event: MouseEvent) {
  const container = minimapRef.value
  if (!container) return
  const svgElement = container.querySelector('svg')
  const target = svgElement || container
  const rect = target.getBoundingClientRect()
  const offsetX = event.clientX - rect.left
  const offsetY = event.clientY - rect.top
  const clampedX = Math.min(Math.max(0, offsetX), rect.width)
  const clampedY = Math.min(Math.max(0, offsetY), rect.height)
  const bounds = minimapBounds.value
  const scale = minimapScale.value || 1
  const worldX = clampedX / scale + bounds.minX
  const worldY = clampedY / scale + bounds.minY
  const zoom = currentZoom.value || 1
  const panX = viewportSize.value.width / 2 - worldX * zoom
  const panY = viewportSize.value.height / 2 - worldY * zoom
  currentPan.value = { x: panX, y: panY }
  emit('update:pan', { x: panX, y: panY })
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

function nodeStyle(node: PreparedNode) {
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
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.control-btn {
  @apply pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-white/80 transition hover:border-cyan-400 hover:text-cyan-200;
}

.node-add {
  @apply pointer-events-auto absolute z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white opacity-0 transition;
}

.node-add--connected {
  @apply border-cyan-400/60 bg-cyan-500/20 text-cyan-100;
}

.group:hover .node-add {
  @apply opacity-100;
}

.node-add--top {
  top: -18px;
  left: 50%;
  transform: translate(-50%, 0);
}

.node-add--bottom {
  bottom: -18px;
  left: 50%;
  transform: translate(-50%, 0);
}

.node-connector {
  @apply pointer-events-none absolute h-3 w-3 rounded-full border-2 border-white/60 bg-[#070d1a];
}

.node-connector--input {
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
}

.node-connector--output {
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
}

.node-connection-tooltip {
  @apply max-w-[240px] space-y-2 text-left;
}

.node-connection-tooltip__title {
  @apply text-xs font-semibold uppercase tracking-[0.35em] text-white/60;
}

.node-connection-tooltip__empty {
  @apply text-xs text-white/50;
}

.node-connection-tooltip__list {
  @apply space-y-1;
}

.node-connection-tooltip__item {
  @apply flex flex-wrap items-center gap-1 text-xs text-white/80;
}

.node-connection-tooltip__id {
  @apply font-mono text-cyan-200;
}

.node-connection-tooltip__title-text {
  @apply text-white/60;
}

.node-connection-tooltip__badge {
  @apply rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-white/60;
}

.node-connection-tooltip__badge--auto {
  @apply bg-cyan-500/25 text-cyan-200;
}
</style>
