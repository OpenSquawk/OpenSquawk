<script setup lang="ts">
const props = withDefaults(defineProps<{
  pitch: number
  bankAngle: number
  size?: number
}>(), {
  size: 300,
})

const uid = useId()

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)
const pitchScale = computed(() => props.size / 60)

const clipId = computed(() => `att-clip-${uid}`)
const skyGradId = computed(() => `att-sky-${uid}`)
const groundGradId = computed(() => `att-ground-${uid}`)
const WHITE = '#f4f6fb'
const YELLOW = '#ffe100'

const pitchMarks = computed(() => {
  const marks: Array<{ deg: number; y: number; isLabel: boolean; width: number }> = []
  for (let deg = -30; deg <= 30; deg += 5) {
    if (deg === 0) continue
    const y = -deg * pitchScale.value
    const isLabel = deg % 10 === 0
    const width = isLabel ? props.size * 0.2 : props.size * 0.1
    marks.push({ deg, y, isLabel, width })
  }
  return marks
})

const bankTicks = computed(() => {
  const angles = [10, 20, 30, 45, 60]
  const ticks: Array<{ angle: number; length: number }> = []
  const r = props.size * 0.42
  for (const a of angles) {
    const len = a === 30 || a === 60 ? 12 : 8
    ticks.push({ angle: -a, length: len })
    ticks.push({ angle: a, length: len })
  }
  return ticks.map(t => {
    const rad = ((t.angle - 90) * Math.PI) / 180
    const x1 = cx.value + r * Math.cos(rad)
    const y1 = cy.value + r * Math.sin(rad)
    const x2 = cx.value + (r - t.length) * Math.cos(rad)
    const y2 = cy.value + (r - t.length) * Math.sin(rad)
    return { x1, y1, x2, y2 }
  })
})

const bankPointer = computed(() => {
  const r = props.size * 0.42
  const s = 8
  const tipX = cx.value
  const tipY = cy.value - r
  return `${tipX},${tipY} ${tipX - s},${tipY - s * 1.5} ${tipX + s},${tipY - s * 1.5}`
})

const horizonTransform = computed(() => {
  const pitchOffset = props.pitch * pitchScale.value
  return `translate(${cx.value}, ${cy.value}) rotate(${-props.bankAngle}) translate(0, ${pitchOffset})`
})

const bankPointerTransform = computed(() => {
  return `rotate(${-props.bankAngle}, ${cx.value}, ${cy.value})`
})

const wingSpan = computed(() => props.size * 0.18)
const wingThickness = computed(() => 3)
const dotRadius = computed(() => 4)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <clipPath :id="clipId">
        <circle :cx="cx" :cy="cy" :r="size * 0.46" />
      </clipPath>
      <linearGradient :id="skyGradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0a4a8a" />
        <stop offset="100%" stop-color="#22a7eb" />
      </linearGradient>
      <linearGradient :id="groundGradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b26113" />
        <stop offset="100%" stop-color="#5a2e08" />
      </linearGradient>
    </defs>

    <!-- Clipped viewport -->
    <g :clip-path="`url(#${clipId})`">
      <!-- Rotating group for pitch + bank -->
      <g :transform="horizonTransform">
        <!-- Sky -->
        <rect
          :x="-size"
          :y="-size * 3"
          :width="size * 3"
          :height="size * 3"
          :fill="`url(#${skyGradId})`"
        />
        <!-- Ground -->
        <rect
          :x="-size"
          :y="0"
          :width="size * 3"
          :height="size * 3"
          :fill="`url(#${groundGradId})`"
        />
        <!-- Horizon line -->
        <line
          :x1="-size"
          :y1="0"
          :x2="size * 2"
          :y2="0"
          :stroke="WHITE"
          stroke-width="2"
        />

        <!-- Pitch ladder -->
        <g v-for="mark in pitchMarks" :key="mark.deg">
          <line
            :x1="-mark.width / 2"
            :y1="mark.y"
            :x2="mark.width / 2"
            :y2="mark.y"
            :stroke="WHITE"
            :stroke-width="mark.isLabel ? 1.5 : 1"
          />
          <template v-if="mark.isLabel">
            <text
              :x="-mark.width / 2 - 6"
              :y="mark.y + 4"
              :fill="WHITE"
              font-size="11"
              text-anchor="end"
              font-family="monospace"
            >
              {{ Math.abs(mark.deg) }}
            </text>
            <text
              :x="mark.width / 2 + 6"
              :y="mark.y + 4"
              :fill="WHITE"
              font-size="11"
              text-anchor="start"
              font-family="monospace"
            >
              {{ Math.abs(mark.deg) }}
            </text>
          </template>
        </g>
      </g>
    </g>

    <!-- Bank arc ticks (fixed) -->
    <line
      v-for="(tick, i) in bankTicks"
      :key="i"
      :x1="tick.x1"
      :y1="tick.y1"
      :x2="tick.x2"
      :y2="tick.y2"
      :stroke="WHITE"
      stroke-width="1.5"
    />

    <!-- Zero-bank reference triangle (fixed, top center) -->
    <polygon
      :points="`${cx},${cy - size * 0.42} ${cx - 6},${cy - size * 0.42 - 10} ${cx + 6},${cy - size * 0.42 - 10}`"
      :fill="WHITE"
    />

    <!-- Bank pointer (rotates with bank) -->
    <polygon
      :points="bankPointer"
      :transform="bankPointerTransform"
      :fill="YELLOW"
    />

    <!-- Fixed aircraft reference symbol (W-shape) -->
    <g>
      <!-- Left wing -->
      <rect
        :x="cx - wingSpan - dotRadius"
        :y="cy - wingThickness / 2"
        :width="wingSpan"
        :height="wingThickness"
        :fill="YELLOW"
        rx="1"
      />
      <!-- Left wing tip (descending) -->
      <line
        :x1="cx - wingSpan - dotRadius"
        :y1="cy"
        :x2="cx - wingSpan - dotRadius"
        :y2="cy + 5"
        :stroke="YELLOW"
        stroke-width="3"
        stroke-linecap="round"
      />
      <!-- Right wing -->
      <rect
        :x="cx + dotRadius"
        :y="cy - wingThickness / 2"
        :width="wingSpan"
        :height="wingThickness"
        :fill="YELLOW"
        rx="1"
      />
      <!-- Right wing tip (descending) -->
      <line
        :x1="cx + wingSpan + dotRadius"
        :y1="cy"
        :x2="cx + wingSpan + dotRadius"
        :y2="cy + 5"
        :stroke="YELLOW"
        stroke-width="3"
        stroke-linecap="round"
      />
      <!-- Center dot -->
      <circle
        :cx="cx"
        :cy="cy"
        :r="dotRadius"
        :fill="YELLOW"
      />
    </g>
  </svg>
</template>
