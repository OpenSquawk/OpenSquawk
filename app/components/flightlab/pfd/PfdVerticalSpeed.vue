<script setup lang="ts">
const props = withDefaults(defineProps<{
  verticalSpeed: number
  width?: number
  height?: number
}>(), {
  width: 40,
  height: 300,
})

const uid = useId()
const clipId = computed(() => `vs-clip-${uid}`)

const centerY = computed(() => props.height / 2)
const scaleHeight = computed(() => props.height * 0.42)

function vsToY(fpm: number): number {
  const normalized = Math.sign(fpm) * Math.sqrt(Math.abs(fpm) / 6000)
  return centerY.value - normalized * scaleHeight.value
}

const majorMarks = [-6000, -4000, -2000, -1000, 0, 1000, 2000, 4000, 6000]

const marks = computed(() => {
  return majorMarks.map(fpm => ({
    fpm,
    y: vsToY(fpm),
    label: fpm === 0 ? '0' : (Math.abs(fpm) / 1000).toString(),
  }))
})

const needleY = computed(() => {
  const clamped = Math.max(-6000, Math.min(6000, props.verticalSpeed))
  return vsToY(clamped)
})

const readoutText = computed(() => {
  const rounded = Math.round(props.verticalSpeed / 50) * 50
  if (rounded === 0) return '0'
  return rounded > 0 ? `+${rounded}` : `${rounded}`
})

const bandY = computed(() => Math.min(centerY.value, needleY.value))
const bandHeight = computed(() => Math.abs(needleY.value - centerY.value))
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

    <g :clip-path="`url(#${clipId})`">
      <!-- Scale line -->
      <line
        :x1="width * 0.3"
        :y1="vsToY(6000)"
        :x2="width * 0.3"
        :y2="vsToY(-6000)"
        stroke="white"
        stroke-width="1"
        opacity="0.4"
      />

      <!-- Major marks -->
      <g v-for="mark in marks" :key="mark.fpm">
        <line
          :x1="width * 0.15"
          :y1="mark.y"
          :x2="width * 0.45"
          :y2="mark.y"
          stroke="white"
          :stroke-width="mark.fpm === 0 ? 1.5 : 1"
        />
        <text
          v-if="mark.fpm !== 0"
          :x="width * 0.55"
          :y="mark.y + 4"
          fill="white"
          font-size="9"
          text-anchor="start"
          font-family="monospace"
        >
          {{ mark.label }}
        </text>
      </g>

      <!-- VS band from center to needle -->
      <rect
        v-if="Math.abs(verticalSpeed) > 10"
        :x="width * 0.15"
        :y="bandY"
        :width="width * 0.3"
        :height="Math.max(bandHeight, 1)"
        fill="#22d3ee"
        opacity="0.7"
      />

      <!-- Needle indicator -->
      <polygon
        :points="`${width * 0.05},${needleY} ${width * 0.3},${needleY - 4} ${width * 0.3},${needleY + 4}`"
        fill="#22d3ee"
      />
    </g>

    <!-- Readout -->
    <text
      v-if="Math.abs(verticalSpeed) > 50"
      :x="width / 2"
      :y="height - 6"
      fill="#22d3ee"
      font-size="9"
      font-weight="bold"
      text-anchor="middle"
      font-family="monospace"
    >
      {{ readoutText }}
    </text>
  </svg>
</template>
