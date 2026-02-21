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
  width: 100,
  height: 320,
})

const uid = useId()
const clipId = computed(() => `spd-clip-${uid}`)

const centerY = computed(() => props.height / 2)

// licarth: oneKtInPx = 3.808 at height=319.8
// Scale proportionally
const pxPerKt = computed(() => props.height * 3.808 / 319.8)

// Tape area: left 68% for numbers/ticks, right 32% for tick marks edge
const tapeW = computed(() => props.width * 0.68)
function speedToY(spd: number): number {
  return centerY.value + (props.speed - spd) * pxPerKt.value
}

const targetZone = computed(() => {
  if (!props.targetRange) return null
  const minY = speedToY(props.targetRange.min)
  const maxY = speedToY(props.targetRange.max)
  const top = Math.min(minY, maxY)
  const bottom = Math.max(minY, maxY)
  return { top, bottom, height: Math.max(2, bottom - top) }
})

const visibleRange = computed(() => {
  const halfVisible = props.height / 2 / pxPerKt.value + 10
  return {
    min: Math.floor((props.speed - halfVisible) / 10) * 10,
    max: Math.ceil((props.speed + halfVisible) / 10) * 10,
  }
})

const marks = computed(() => {
  const result: Array<{ spd: number; y: number; isLabel: boolean; label: string }> = []
  for (let spd = visibleRange.value.min; spd <= visibleRange.value.max; spd += 10) {
    if (spd < 30) continue
    const y = speedToY(spd)
    const isLabel = spd % 20 === 0
    const label = isLabel ? String(spd).padStart(3, '0') : ''
    result.push({ spd, y, isLabel, label })
  }
  return result
})

const readoutText = computed(() => Math.round(props.speed).toString().padStart(3, ' '))

const trendLineEndY = computed(() => {
  if (Math.abs(props.speedTrend) < 1) return centerY.value
  return centerY.value - props.speedTrend * pxPerKt.value
})

// Readout box dimensions
const readoutBoxH = 26
const readoutBoxW = computed(() => props.width * 0.7)

// Font sizes scaled to width
const labelFontSize = computed(() => Math.round(props.width * 0.22))
const readoutFontSize = computed(() => Math.round(props.width * 0.24))
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
      <radialGradient :id="`spd-bg-${uid}`" cx="1" cy="0.5" r="1.2">
        <stop offset="0%" stop-color="#1f2a2c" />
        <stop offset="57%" stop-color="#304c50" />
        <stop offset="100%" stop-color="#1d282a" />
      </radialGradient>
    </defs>

    <!-- Background (matching back.svg gradient) -->
    <rect
      x="0" y="0"
      :width="width" :height="height"
      :fill="`url(#spd-bg-${uid})`"
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
        v-if="speedToY(vfeSpeed) > 0 && speedToY(vfeSpeed) < height"
        x1="1"
        :y1="speedToY(vfeSpeed)"
        :x2="width - 1"
        :y2="speedToY(vfeSpeed)"
        stroke="#ef4444"
        stroke-width="1.5"
        stroke-dasharray="9,9"
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
        v-if="speedToY(minSpeed) > 0 && speedToY(minSpeed) < height"
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
      </g>

      <!-- Vertical reference line (right edge of tape) -->
      <line
        :x1="tapeW"
        y1="0"
        :x2="tapeW"
        :y2="height"
        stroke="white"
        stroke-width="1"
      />

      <!-- Speed marks and labels -->
      <g v-for="mark in marks" :key="mark.spd">
        <!-- Tick mark (right side) -->
        <line
          :x1="tapeW"
          :y1="mark.y"
          :x2="tapeW + 14"
          :y2="mark.y"
          stroke="white"
          stroke-width="1.5"
        />
        <!-- Speed number label -->
        <text
          v-if="mark.isLabel"
          :x="tapeW - 8"
          :y="mark.y + labelFontSize * 0.35"
          fill="white"
          :font-size="labelFontSize"
          text-anchor="end"
          font-family="monospace"
        >
          {{ mark.label }}
        </text>
      </g>

      <!-- Speed trend arrow -->
      <line
        v-if="Math.abs(speedTrend) >= 1"
        :x1="width / 2"
        :y1="centerY"
        :x2="width / 2"
        :y2="trendLineEndY"
        stroke="#3ae061"
        stroke-width="2"
        opacity="0.8"
      />
    </g>

    <!-- Bottom edge line -->
    <line
      x1="0" :y1="height"
      :x2="tapeW + 14" :y2="height"
      stroke="white"
      stroke-width="1"
    />

    <!-- Current speed readout box (fixed at center) -->
    <rect
      :x="(width - readoutBoxW) / 2 - 2"
      :y="centerY - readoutBoxH / 2"
      :width="readoutBoxW"
      :height="readoutBoxH"
      fill="black"
      stroke="#fbe044"
      stroke-width="1.5"
      rx="1"
    />
    <text
      :x="width / 2 - 4"
      :y="centerY + readoutFontSize * 0.35"
      fill="#3ae061"
      :font-size="readoutFontSize"
      font-weight="bold"
      text-anchor="middle"
      font-family="monospace"
    >
      {{ readoutText }}
    </text>
  </svg>
</template>
