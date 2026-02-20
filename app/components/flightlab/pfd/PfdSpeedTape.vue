<script setup lang="ts">
interface SpeedTargetRange {
  min: number
  max: number
}

const props = withDefaults(defineProps<{
  speed: number
  speedTrend?: number
  targetRange?: SpeedTargetRange
  width?: number
  height?: number
}>(), {
  speedTrend: 0,
  width: 70,
  height: 300,
})

const uid = useId()
const clipId = computed(() => `spd-clip-${uid}`)

const centerY = computed(() => props.height / 2)
const pixelsPerKnot = 3

function speedToY(spd: number): number {
  return centerY.value + (props.speed - spd) * pixelsPerKnot
}

const targetZone = computed(() => {
  if (!props.targetRange) return null
  const min = Math.min(props.targetRange.min, props.targetRange.max)
  const max = Math.max(props.targetRange.min, props.targetRange.max)
  const minY = speedToY(min)
  const maxY = speedToY(max)
  const top = Math.min(minY, maxY)
  const bottom = Math.max(minY, maxY)
  return {
    min,
    max,
    top,
    bottom,
    height: Math.max(2, bottom - top),
  }
})

const visibleRange = computed(() => {
  const halfVisible = props.height / 2 / pixelsPerKnot + 10
  return {
    min: Math.floor((props.speed - halfVisible) / 5) * 5,
    max: Math.ceil((props.speed + halfVisible) / 5) * 5,
  }
})

const marks = computed(() => {
  const result: Array<{ spd: number; y: number; isLabel: boolean }> = []
  for (let spd = visibleRange.value.min; spd <= visibleRange.value.max; spd += 5) {
    if (spd < 0) continue
    const y = speedToY(spd)
    const isLabel = spd % 20 === 0
    result.push({ spd, y, isLabel })
  }
  return result
})

const readoutText = computed(() => Math.round(props.speed).toString())

const trendLineEndY = computed(() => {
  if (Math.abs(props.speedTrend) < 1) return centerY.value
  return centerY.value - props.speedTrend * pixelsPerKnot
})

const readoutBoxHeight = 24
const readoutBoxWidth = computed(() => props.width - 8)
const tapeInnerX = 2
const tapeInnerY = 2
const tapeInnerWidth = computed(() => props.width - 4)
const tapeInnerHeight = computed(() => props.height - 4)
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <clipPath :id="clipId">
        <rect x="0" y="0" :width="width" :height="height" />
      </clipPath>
    </defs>

    <!-- Airbus-style tape body -->
    <rect
      x="0"
      y="0"
      :width="width"
      :height="height"
      fill="#8f9198"
      rx="1"
    />
    <rect
      :x="tapeInnerX"
      :y="tapeInnerY"
      :width="tapeInnerWidth"
      :height="tapeInnerHeight"
      fill="#93959c"
      stroke="#d2d4da"
      stroke-width="0.8"
    />

    <!-- Scrolling tape (clipped) -->
    <g :clip-path="`url(#${clipId})`">
      <!-- Target hold zone -->
      <g v-if="targetZone">
        <rect
          x="1"
          :y="targetZone.top"
          :width="width - 2"
          :height="targetZone.height"
          fill="rgba(239, 68, 68, 0.22)"
          stroke="rgba(248, 113, 113, 0.95)"
          stroke-width="1.2"
        />
        <line
          x1="1"
          :y1="targetZone.top"
          :x2="width - 1"
          :y2="targetZone.top"
          stroke="rgba(254, 202, 202, 0.95)"
          stroke-width="1"
        />
        <line
          x1="1"
          :y1="targetZone.bottom"
          :x2="width - 1"
          :y2="targetZone.bottom"
          stroke="rgba(254, 202, 202, 0.95)"
          stroke-width="1"
        />
      </g>

      <g v-for="mark in marks" :key="mark.spd">
        <!-- Tick mark -->
        <line
          :x1="width - 10"
          :y1="mark.y"
          :x2="width - 1"
          :y2="mark.y"
          stroke="#f4f6fb"
          stroke-width="1"
        />
        <!-- Label -->
        <text
          v-if="mark.isLabel"
          :x="width - 14"
          :y="mark.y + 4"
          fill="#f4f6fb"
          font-size="12"
          text-anchor="end"
          font-family="monospace"
        >
          {{ mark.spd }}
        </text>
      </g>

      <!-- Speed trend arrow -->
      <line
        v-if="Math.abs(speedTrend) >= 1"
        :x1="width / 2"
        :y1="centerY"
        :x2="width / 2"
        :y2="trendLineEndY"
        stroke="#30e3ff"
        stroke-width="2"
        opacity="0.8"
      />
    </g>

    <!-- Current speed readout box -->
    <rect
      :x="(width - readoutBoxWidth) / 2"
      :y="centerY - readoutBoxHeight / 2"
      :width="readoutBoxWidth"
      :height="readoutBoxHeight"
      fill="#02040b"
      stroke="#2fe5ff"
      stroke-width="1.4"
      rx="1.5"
    />
    <text
      :x="width / 2"
      :y="centerY + 5"
      fill="#2fe5ff"
      font-size="15"
      font-weight="bold"
      text-anchor="middle"
      font-family="monospace"
    >
      {{ readoutText }}
    </text>
  </svg>
</template>
