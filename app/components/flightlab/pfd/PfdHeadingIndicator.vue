<script setup lang="ts">
const props = withDefaults(defineProps<{
  heading: number
  width?: number
  height?: number
}>(), {
  width: 300,
  height: 44,
})

const uid = useId()
const clipId = computed(() => `hdg-clip-${uid}`)

const centerX = computed(() => props.width / 2)
const pixelsPerDeg = computed(() => props.width / 100) // ~3px/deg at 300px width

function hdgToX(deg: number): number {
  let delta = deg - props.heading
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  return centerX.value + delta * pixelsPerDeg.value
}

const cardinals: Record<number, string> = {
  0: 'N',
  90: 'E',
  180: 'S',
  270: 'W',
}

function headingLabel(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360
  if (cardinals[normalized]) return cardinals[normalized]
  return (normalized / 10).toString()
}

const visibleRange = computed(() => {
  const halfVisible = props.width / 2 / pixelsPerDeg.value + 15
  return {
    min: Math.floor(props.heading - halfVisible),
    max: Math.ceil(props.heading + halfVisible),
  }
})

const marks = computed(() => {
  const result: Array<{ deg: number; x: number; isMajor: boolean; label: string }> = []
  const startDeg = Math.floor(visibleRange.value.min / 5) * 5
  for (let deg = startDeg; deg <= visibleRange.value.max; deg += 5) {
    const x = hdgToX(deg)
    const isMajor = deg % 10 === 0
    const normalized = ((deg % 360) + 360) % 360
    result.push({
      deg,
      x,
      isMajor,
      label: isMajor ? headingLabel(normalized) : '',
    })
  }
  return result
})

const readoutText = computed(() => {
  const h = Math.round(props.heading) % 360
  const normalized = ((h % 360) + 360) % 360
  return normalized.toString().padStart(3, '0')
})

const readoutBoxWidth = 40
const readoutBoxHeight = 18
const labelFontSize = computed(() => Math.max(9, Math.round(props.height * 0.26)))
const readoutFontSize = computed(() => Math.max(10, Math.round(props.height * 0.3)))
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
      <radialGradient :id="`hdg-bg-${uid}`" cx="0.5" cy="0.5" r="1">
        <stop offset="0%" stop-color="#1f2a2c" />
        <stop offset="57%" stop-color="#304c50" />
        <stop offset="100%" stop-color="#1d282a" />
      </radialGradient>
    </defs>

    <!-- Background matching licarth bezel style -->
    <rect
      x="0" y="0"
      :width="width" :height="height"
      :fill="`url(#hdg-bg-${uid})`"
    />

    <!-- Readout box at top center (yellow heading value) -->
    <rect
      :x="centerX - readoutBoxWidth / 2"
      y="2"
      :width="readoutBoxWidth"
      :height="readoutBoxHeight"
      fill="black"
      stroke="#fbe044"
      stroke-width="1.5"
      rx="1"
    />
    <text
      :x="centerX"
      :y="readoutBoxHeight - 2"
      fill="#fbe044"
      :font-size="readoutFontSize"
      font-weight="bold"
      text-anchor="middle"
      font-family="monospace"
    >
      {{ readoutText }}
    </text>

    <!-- Center pointer triangle (yellow, pointing down) -->
    <polygon
      :points="`${centerX},${readoutBoxHeight + 6} ${centerX - 5},${readoutBoxHeight + 1} ${centerX + 5},${readoutBoxHeight + 1}`"
      fill="#fbe044"
    />

    <!-- Scrolling compass tape (clipped) -->
    <g :clip-path="`url(#${clipId})`">
      <g v-for="mark in marks" :key="mark.deg">
        <!-- Tick mark (from bottom upward) -->
        <line
          :x1="mark.x"
          :y1="height"
          :x2="mark.x"
          :y2="mark.isMajor ? height - 12 : height - 7"
          stroke="white"
          :stroke-width="mark.isMajor ? 1.5 : 1"
        />
        <!-- Label -->
        <text
          v-if="mark.isMajor"
          :x="mark.x"
          :y="height - 15"
          fill="white"
          :font-size="labelFontSize"
          text-anchor="middle"
          font-family="monospace"
        >
          {{ mark.label }}
        </text>
      </g>
    </g>
  </svg>
</template>
