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
const pixelsPerDeg = 3

function hdgToX(deg: number): number {
  let delta = deg - props.heading
  // Wrap around 180 for shortest path
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  return centerX.value + delta * pixelsPerDeg
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
  const halfVisible = props.width / 2 / pixelsPerDeg + 15
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

const readoutBoxWidth = 36
const readoutBoxHeight = 18
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

    <!-- Scrolling compass tape (clipped) -->
    <g :clip-path="`url(#${clipId})`">
      <g v-for="mark in marks" :key="mark.deg">
        <!-- Tick mark -->
        <line
          :x1="mark.x"
          y1="0"
          :x2="mark.x"
          :y2="mark.isMajor ? 12 : 7"
          stroke="white"
          :stroke-width="mark.isMajor ? 1.5 : 1"
        />
        <!-- Label -->
        <text
          v-if="mark.isMajor"
          :x="mark.x"
          y="24"
          fill="white"
          font-size="11"
          text-anchor="middle"
          font-family="monospace"
        >
          {{ mark.label }}
        </text>
      </g>
    </g>

    <!-- Center pointer triangle (cyan) -->
    <polygon
      :points="`${centerX},2 ${centerX - 5},0 ${centerX + 5},0`"
      fill="#22d3ee"
    />

    <!-- Readout box at bottom -->
    <rect
      :x="centerX - readoutBoxWidth / 2"
      :y="height - readoutBoxHeight - 2"
      :width="readoutBoxWidth"
      :height="readoutBoxHeight"
      fill="rgba(10,10,30,0.95)"
      stroke="#22d3ee"
      stroke-width="1"
      rx="2"
    />
    <text
      :x="centerX"
      :y="height - 6"
      fill="#22d3ee"
      font-size="12"
      font-weight="bold"
      text-anchor="middle"
      font-family="monospace"
    >
      {{ readoutText }}
    </text>
  </svg>
</template>
