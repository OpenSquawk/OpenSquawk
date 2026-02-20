<script setup lang="ts">
const props = withDefaults(defineProps<{
  altitude: number
  width?: number
  height?: number
}>(), {
  width: 80,
  height: 300,
})

const uid = useId()
const clipId = computed(() => `alt-clip-${uid}`)

const centerY = computed(() => props.height / 2)
const pixelsPerFoot = 0.15

function altToY(alt: number): number {
  return centerY.value + (props.altitude - alt) * pixelsPerFoot
}

const visibleRange = computed(() => {
  const halfVisible = props.height / 2 / pixelsPerFoot + 200
  return {
    min: Math.floor((props.altitude - halfVisible) / 100) * 100,
    max: Math.ceil((props.altitude + halfVisible) / 100) * 100,
  }
})

const marks = computed(() => {
  const result: Array<{ alt: number; y: number; isLabel: boolean }> = []
  for (let alt = visibleRange.value.min; alt <= visibleRange.value.max; alt += 100) {
    const y = altToY(alt)
    const isLabel = alt % 500 === 0
    result.push({ alt, y, isLabel })
  }
  return result
})

const readoutText = computed(() => Math.round(props.altitude).toString())

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
      <g v-for="mark in marks" :key="mark.alt">
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
          x="4"
          :y="mark.y + 4"
          fill="#f4f6fb"
          font-size="12"
          text-anchor="start"
          font-family="monospace"
        >
          {{ Math.round(mark.alt / 100) }}
        </text>
      </g>
    </g>

    <!-- Current altitude readout box -->
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
      font-size="14"
      font-weight="bold"
      text-anchor="middle"
      font-family="monospace"
    >
      {{ readoutText }}
    </text>
  </svg>
</template>
