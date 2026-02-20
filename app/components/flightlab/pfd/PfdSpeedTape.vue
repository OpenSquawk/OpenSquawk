<script setup lang="ts">
const props = withDefaults(defineProps<{
  speed: number
  speedTrend?: number
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

    <!-- Background -->
    <rect
      x="0"
      y="0"
      :width="width"
      :height="height"
      fill="rgba(10,10,30,0.95)"
      rx="2"
    />

    <!-- Scrolling tape (clipped) -->
    <g :clip-path="`url(#${clipId})`">
      <g v-for="mark in marks" :key="mark.spd">
        <!-- Tick mark -->
        <line
          :x1="width - 8"
          :y1="mark.y"
          :x2="width"
          :y2="mark.y"
          stroke="white"
          stroke-width="1"
        />
        <!-- Label -->
        <text
          v-if="mark.isLabel"
          :x="width - 12"
          :y="mark.y + 4"
          fill="white"
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
        stroke="#22d3ee"
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
      fill="rgba(10,10,30,0.95)"
      stroke="#22d3ee"
      stroke-width="1.5"
      rx="2"
    />
    <text
      :x="width / 2"
      :y="centerY + 5"
      fill="#22d3ee"
      font-size="15"
      font-weight="bold"
      text-anchor="middle"
      font-family="monospace"
    >
      {{ readoutText }}
    </text>
  </svg>
</template>
