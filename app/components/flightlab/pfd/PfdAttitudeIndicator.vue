<script setup lang="ts">
const props = withDefaults(defineProps<{
  pitch: number
  bankAngle: number
  size?: number
}>(), {
  size: 290,
})

const uid = useId()

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)

// licarth: oneDegreeInPixels = 6.7 at full size
const pitchScale = computed(() => props.size / 43.3)

const clipId = computed(() => `att-clip-${uid}`)
const skyGradId = computed(() => `att-sky-${uid}`)
const groundGradId = computed(() => `att-ground-${uid}`)

const WHITE = '#fff'
const YELLOW = 'yellow'

// Pitch ladder marks matching licarth pattern
const pitchMarks = computed(() => {
  const marks: Array<{ deg: number; y: number; type: 'S' | 'M' | 'L'; halfWidth: number }> = []
  for (let deg = -80; deg <= 80; deg += 2.5) {
    if (deg === 0) continue
    const y = -deg * pitchScale.value
    if (deg % 10 === 0) {
      marks.push({ deg, y, type: 'L', halfWidth: props.size * 0.12 })
    } else if (deg % 5 === 0) {
      marks.push({ deg, y, type: 'M', halfWidth: props.size * 0.066 })
    } else {
      marks.push({ deg, y, type: 'S', halfWidth: props.size * 0.035 })
    }
  }
  return marks
})

// Bank angle ticks
const bankAngles = [10, 20, 30, 45, 60]
const bankTicks = computed(() => {
  const r = props.size * 0.44
  const ticks: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (const a of bankAngles) {
    for (const sign of [-1, 1]) {
      const angle = sign * a
      const len = (a === 30 || a === 60) ? 12 : 8
      const rad = ((angle - 90) * Math.PI) / 180
      ticks.push({
        x1: cx.value + r * Math.cos(rad),
        y1: cy.value + r * Math.sin(rad),
        x2: cx.value + (r - len) * Math.cos(rad),
        y2: cy.value + (r - len) * Math.sin(rad),
      })
    }
  }
  return ticks
})

const bankPointer = computed(() => {
  const r = props.size * 0.44
  const s = 7
  const tipY = cy.value - r
  return `${cx.value},${tipY} ${cx.value - s},${tipY - s * 1.5} ${cx.value + s},${tipY - s * 1.5}`
})

const zeroRef = computed(() => {
  const r = props.size * 0.44
  const tipY = cy.value - r
  return `${cx.value},${tipY} ${cx.value - 6},${tipY - 10} ${cx.value + 6},${tipY - 10}`
})

const horizonTransform = computed(() => {
  const pitchOffset = props.pitch * pitchScale.value
  return `translate(${cx.value}, ${cy.value}) rotate(${-props.bankAngle}) translate(0, ${pitchOffset})`
})

const bankPointerTransform = computed(() => {
  return `rotate(${-props.bankAngle}, ${cx.value}, ${cy.value})`
})

// Aircraft symbol (licarth-style L-shaped wings)
// licarth: wings from ±75 to ±133, tip drops to y=22, center square 10x10
const rightWingPoints = computed(() => {
  const wi = props.size * 0.259
  const wo = props.size * 0.459
  const td = props.size * 0.076
  const c = cy.value
  return `${cx.value + wi},${c - 5} ${cx.value + wo},${c - 5} ${cx.value + wo},${c + 5} ${cx.value + wi + 10},${c + 5} ${cx.value + wi + 10},${c + td} ${cx.value + wi},${c + td}`
})

const leftWingPoints = computed(() => {
  const wi = props.size * 0.259
  const wo = props.size * 0.459
  const td = props.size * 0.076
  const c = cy.value
  return `${cx.value - wi},${c - 5} ${cx.value - wo},${c - 5} ${cx.value - wo},${c + 5} ${cx.value - wi - 10},${c + 5} ${cx.value - wi - 10},${c + td} ${cx.value - wi},${c + td}`
})
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
        <stop offset="0%" stop-color="#0a4080" />
        <stop offset="100%" stop-color="#19b5e6" />
      </linearGradient>
      <linearGradient :id="groundGradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#64241a" />
        <stop offset="100%" stop-color="#3a1510" />
      </linearGradient>
    </defs>

    <!-- Clipped viewport -->
    <g :clip-path="`url(#${clipId})`">
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
          stroke-width="2.5"
        />

        <!-- Pitch ladder -->
        <g v-for="mark in pitchMarks" :key="mark.deg">
          <line
            :x1="-mark.halfWidth"
            :y1="mark.y"
            :x2="mark.halfWidth"
            :y2="mark.y"
            :stroke="WHITE"
            :stroke-width="mark.type === 'L' ? 2.5 : mark.type === 'M' ? 2 : 1.5"
            stroke-linecap="round"
          />
          <template v-if="mark.type === 'L'">
            <text
              :x="-mark.halfWidth - 28"
              :y="mark.y + 5"
              :fill="WHITE"
              font-size="13"
              text-anchor="middle"
              font-family="monospace"
            >
              {{ Math.abs(mark.deg) }}
            </text>
            <text
              :x="mark.halfWidth + 28"
              :y="mark.y + 5"
              :fill="WHITE"
              font-size="13"
              text-anchor="middle"
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

    <!-- Zero-bank reference triangle (fixed, top center, white) -->
    <polygon :points="zeroRef" :fill="WHITE" />

    <!-- Bank pointer (rotates with bank, yellow) -->
    <polygon :points="bankPointer" :transform="bankPointerTransform" :fill="YELLOW" />

    <!-- Fixed aircraft reference symbol (licarth-style L-shaped wings) -->
    <!-- Center square -->
    <rect
      :x="cx - 5"
      :y="cy - 5"
      width="10"
      height="10"
      fill="none"
      :stroke="YELLOW"
      stroke-width="2"
    />
    <!-- Right wing -->
    <polygon
      :points="rightWingPoints"
      fill="black"
      :stroke="YELLOW"
      stroke-width="2"
      stroke-linecap="round"
    />
    <!-- Left wing -->
    <polygon
      :points="leftWingPoints"
      fill="black"
      :stroke="YELLOW"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
</template>
