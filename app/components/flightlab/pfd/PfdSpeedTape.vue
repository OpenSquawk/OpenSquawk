<script setup lang="ts">
interface SpeedTargetRange {
  min: number
  max: number
}

const props = withDefaults(defineProps<{
  speed: number
  speedTrend?: number
  targetRange?: SpeedTargetRange
  vfeSpeed?: number
  minSpeed?: number
  width?: number
  height?: number
}>(), {
  speedTrend: 0,
  vfeSpeed: 340,
  minSpeed: 130,
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
      fill="#16181f"
      rx="1"
    />
    <rect
      :x="tapeInnerX"
      :y="tapeInnerY"
      :width="tapeInnerWidth"
      :height="tapeInnerHeight"
      fill="#1c1e26"
      stroke="#3a3d48"
      stroke-width="0.8"
    />

    <!-- Scrolling tape (clipped) -->
    <g :clip-path="`url(#${clipId})`">
      <!-- VFE overspeed band (red) -->
      <rect
        x="1"
        :y="0"
        :width="width - 2"
        :height="Math.max(0, speedToY(vfeSpeed))"
        fill="rgba(239, 40, 40, 0.45)"
      />
      <line
        v-if="speedToY(vfeSpeed) > 0"
        x1="1"
        :y1="speedToY(vfeSpeed)"
        :x2="width - 1"
        :y2="speedToY(vfeSpeed)"
        stroke="#ef4444"
        stroke-width="1.5"
      />

      <!-- Minimum speed band (red) -->
      <rect
        v-if="speedToY(minSpeed) < height"
        x="1"
        :y="speedToY(minSpeed)"
        :width="width - 2"
        :height="Math.max(0, height - speedToY(minSpeed))"
        fill="rgba(239, 40, 40, 0.45)"
      />
      <line
        v-if="speedToY(minSpeed) < height"
        x1="1"
        :y1="speedToY(minSpeed)"
        :x2="width - 1"
        :y2="speedToY(minSpeed)"
        stroke="#ef4444"
        stroke-width="1.5"
      />

      <!-- Target hold zone (cyan) -->
      <g v-if="targetZone">
        <rect
          x="1"
          :y="targetZone.top"
          :width="width - 2"
          :height="targetZone.height"
          fill="rgba(45, 212, 255, 0.18)"
          stroke="rgba(45, 229, 255, 0.8)"
          stroke-width="1.2"
        />
        <line
          x1="1"
          :y1="targetZone.top"
          :x2="width - 1"
          :y2="targetZone.top"
          stroke="rgba(45, 229, 255, 0.5)"
          stroke-width="1"
        />
        <line
          x1="1"
          :y1="targetZone.bottom"
          :x2="width - 1"
          :y2="targetZone.bottom"
          stroke="rgba(45, 229, 255, 0.5)"
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
        stroke="#19e34a"
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
      stroke="#19e34a"
      stroke-width="1.4"
      rx="1.5"
    />
    <text
      :x="width / 2"
      :y="centerY + 5"
      fill="#19e34a"
      font-size="15"
      font-weight="bold"
      text-anchor="middle"
      font-family="monospace"
    >
      {{ readoutText }}
    </text>
  </svg>
</template>
