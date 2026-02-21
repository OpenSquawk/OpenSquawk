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

const readoutBoxWidth = 40
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

    <!-- Airbus-style heading tape -->
    <rect
      x="0"
      y="0"
      :width="width"
      :height="height"
      fill="#1a2628"
      rx="1"
    />
    <rect
      x="1.5"
      y="1.5"
      :width="width - 3"
      :height="height - 3"
      fill="#1d282a"
      stroke="#304c50"
      stroke-width="0.8"
    />

    <!-- Readout box at top center (yellow heading value) -->
    <rect
      :x="centerX - readoutBoxWidth / 2"
      y="2"
      :width="readoutBoxWidth"
      :height="readoutBoxHeight"
      fill="#02040b"
      stroke="#fbe044"
      stroke-width="1"
      rx="2"
    />
    <text
      :x="centerX"
      :y="16"
      fill="#fbe044"
      font-size="12"
      font-weight="bold"
      text-anchor="middle"
      font-family="monospace"
    >
      {{ readoutText }}
    </text>

    <!-- Center pointer triangle (yellow, pointing down from readout box) -->
    <polygon
      :points="`${centerX},${readoutBoxHeight + 6} ${centerX - 4},${readoutBoxHeight + 2} ${centerX + 4},${readoutBoxHeight + 2}`"
      fill="#fbe044"
    />

    <!-- Scrolling compass tape (clipped) — ticks grow upward from bottom -->
    <g :clip-path="`url(#${clipId})`">
      <g v-for="mark in marks" :key="mark.deg">
        <!-- Tick mark (from bottom upward) -->
        <line
          :x1="mark.x"
          :y1="height"
          :x2="mark.x"
          :y2="mark.isMajor ? height - 12 : height - 7"
          stroke="#f4f6fb"
          :stroke-width="mark.isMajor ? 1.5 : 1"
        />
        <!-- Label (above tick) -->
        <text
          v-if="mark.isMajor"
          :x="mark.x"
          :y="height - 15"
          fill="#f4f6fb"
          font-size="11"
          text-anchor="middle"
          font-family="monospace"
        >
          {{ mark.label }}
        </text>
      </g>
    </g>
  </svg>
</template>
