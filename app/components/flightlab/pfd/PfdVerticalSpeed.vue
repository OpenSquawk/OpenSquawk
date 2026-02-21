<script setup lang="ts">
const props = withDefaults(defineProps<{
  verticalSpeed: number
  width?: number
  height?: number
}>(), {
  width: 48,
  height: 300,
})

const centerY = computed(() => props.height / 2)
const axisX = computed(() => props.width * 0.56)
const wingX = computed(() => props.width * 0.92)
const scaleSpan = computed(() => props.height * 0.43)
const WHITE = '#f4f6fb'
const GREEN = '#19e34a'
const majorMarks = [1000, 2000, 4000, 6000] as const

function speedFraction(absFpm: number): number {
  const f = Math.max(0, Math.min(6000, absFpm))
  if (f <= 1000) return (f / 1000) * 0.24
  if (f <= 2000) return 0.24 + ((f - 1000) / 1000) * 0.14
  if (f <= 4000) return 0.38 + ((f - 2000) / 2000) * 0.28
  return 0.66 + ((f - 4000) / 2000) * 0.24
}

function vsToY(fpm: number): number {
  const sign = Math.sign(fpm)
  if (sign === 0) return centerY.value
  const frac = speedFraction(Math.abs(fpm))
  return centerY.value + sign * frac * scaleSpan.value
}

const markPositions = computed(() => {
  return majorMarks.map((mark) => ({
    mark,
    topY: vsToY(mark),
    bottomY: vsToY(-mark),
    label: String(mark / 1000),
  }))
})

const clampedVs = computed(() => Math.max(-6000, Math.min(6000, props.verticalSpeed)))
const needleY = computed(() => vsToY(clampedVs.value))
const showReadout = computed(() => Math.abs(props.verticalSpeed) >= 100)
const readoutText = computed(() => Math.round(Math.abs(props.verticalSpeed) / 100).toString().padStart(2, '0'))

const channelShape = computed(() => {
  const left = props.width * 0.18
  const right = props.width
  const shoulder = props.width * 0.86
  const topInset = props.height * 0.11
  const bottomInset = props.height * 0.89
  return `${left},0 ${shoulder},0 ${right},${topInset} ${right},${bottomInset} ${shoulder},${props.height} ${left},${props.height}`
})
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Background cutout -->
    <rect x="0" y="0" :width="width" :height="height" fill="#030712" />

    <!-- Airbus-style VS channel -->
    <polygon
      :points="channelShape"
      fill="#1c1e26"
      stroke="#3a3d48"
      stroke-width="0.8"
    />

    <!-- Main vertical axis -->
    <line
      :x1="axisX"
      y1="8"
      :x2="axisX"
      :y2="height - 8"
      :stroke="WHITE"
      stroke-width="1.1"
      opacity="0.95"
    />

    <!-- Zero marker -->
    <line
      :x1="axisX - 12"
      :y1="centerY"
      :x2="axisX + 12"
      :y2="centerY"
      :stroke="WHITE"
      stroke-width="1.5"
    />

    <!-- Major marks and labels -->
    <g v-for="mark in markPositions" :key="mark.mark">
      <line
        :x1="axisX - 10"
        :y1="mark.topY"
        :x2="axisX + 10"
        :y2="mark.topY"
        :stroke="WHITE"
        stroke-width="1.2"
      />
      <line
        :x1="axisX - 10"
        :y1="mark.bottomY"
        :x2="axisX + 10"
        :y2="mark.bottomY"
        :stroke="WHITE"
        stroke-width="1.2"
      />

      <text
        :x="axisX + 14"
        :y="mark.topY + 4"
        :fill="WHITE"
        font-size="8.5"
        font-family="monospace"
      >
        {{ mark.label }}
      </text>
      <text
        :x="axisX + 14"
        :y="mark.bottomY + 4"
        :fill="WHITE"
        font-size="8.5"
        font-family="monospace"
      >
        {{ mark.label }}
      </text>
    </g>

    <!-- Trend vector (center to current VS) -->
    <line
      :x1="axisX"
      :y1="centerY"
      :x2="wingX"
      :y2="needleY"
      :stroke="GREEN"
      stroke-width="3.6"
      stroke-linecap="round"
      opacity="0.95"
    />

    <circle
      :cx="axisX"
      :cy="centerY"
      r="2"
      :fill="GREEN"
    />

    <!-- Numeric readout in hundreds fpm -->
    <text
      v-if="showReadout"
      :x="wingX - 1"
      :y="height - 8"
      :fill="GREEN"
      font-size="10"
      font-weight="bold"
      text-anchor="end"
      font-family="monospace"
    >
      {{ readoutText }}
    </text>
  </svg>
</template>
