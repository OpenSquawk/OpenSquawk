<script setup lang="ts">
const props = withDefaults(defineProps<{
  verticalSpeed: number
  width?: number
  height?: number
}>(), {
  width: 48,
  height: 385,
})

const uid = useId()

const centerY = computed(() => props.height / 2)
const GREEN = '#3ae061'

// licarth uses meters/second for VS scale, we get ft/min
// Convert: 1 m/s = 196.85 ft/min
// licarth non-linear scale (in m/s):
//   0-10 m/s: linear, 10px per m/s → 100px range
//   10-20 m/s: 4px per m/s → 40px added
//   20-60 m/s: 1px per m/s → 40px added
//   total one side: ~180px → at height=385, centerY=192.5
// We work in ft/min but scale proportionally to licarth

// Scale factor to match licarth proportions at variable height
const sf = computed(() => props.height / 385)

function vsToPixels(fpm: number): number {
  // Convert ft/min to m/s
  const ms = fpm / 196.85
  const s = Math.sign(ms)
  const a = Math.abs(ms)
  let px: number
  if (a <= 10) {
    px = a * 10
  } else if (a <= 20) {
    px = 100 + (a - 10) * 4
  } else if (a <= 60) {
    px = 140 + (a - 20) * 1
  } else {
    px = 180
  }
  return -s * px * sf.value
}

function vsToY(fpm: number): number {
  return centerY.value + vsToPixels(fpm)
}

// Scale marks matching licarth: 1, 2, 6 (in units of 1000 ft/min)
// licarth labels are 1, 2, 6 which correspond to m/s values
// Actually licarth labels 1,2,6 at pixel positions 100, 140, 180 from center
// These map to ~1000, 2000, 6000 ft/min approximately
const majorMarks = computed(() => {
  const marks: Array<{ label: string; yUp: number; yDown: number; isLong: boolean }> = []
  // licarth positions (from center, in pixels at original scale):
  // L: 1 at 100px, 2 at 140px, 6 at 180px
  // S: at 50px and 120px, and 160px from center (between major marks)

  // Major marks (long, with labels)
  const majors = [
    { label: '1', px: 100 },
    { label: '2', px: 140 },
    { label: '6', px: 180 },
  ]
  for (const m of majors) {
    marks.push({
      label: m.label,
      yUp: centerY.value - m.px * sf.value,
      yDown: centerY.value + m.px * sf.value,
      isLong: true,
    })
  }

  return marks
})

const minorMarks = computed(() => {
  const marks: Array<{ yUp: number; yDown: number }> = []
  // licarth S marks at 50px and 120px from center
  const minors = [50, 120, 160]
  for (const px of minors) {
    marks.push({
      yUp: centerY.value - px * sf.value,
      yDown: centerY.value + px * sf.value,
    })
  }
  return marks
})

const clampedVs = computed(() => Math.max(-6000, Math.min(6000, props.verticalSpeed)))
const needleY = computed(() => vsToY(clampedVs.value))

// Readout (licarth shows when |vs| > ~300 ft/min ≈ 1.5 m/s)
const showReadout = computed(() => Math.abs(props.verticalSpeed) >= 300)
const readoutText = computed(() => {
  const ms = Math.abs(props.verticalSpeed) / 196.85
  if (ms >= 100) return Math.floor(ms).toString()
  return Math.floor(ms).toString().padStart(2, '0')
})

const readoutY = computed(() => {
  const y = needleY.value
  const s = Math.sign(props.verticalSpeed)
  return y - s * 8 * sf.value
})
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient :id="`vs-bg-${uid}`" cx="1" cy="0.5" r="1.5">
        <stop offset="0%" stop-color="#1e3233" />
        <stop offset="57%" stop-color="#1e2d30" />
        <stop offset="100%" stop-color="#0a171d" />
      </radialGradient>
    </defs>

    <!-- Background (matching licarth DescentRate gradient) -->
    <rect
      x="0" y="0"
      :width="width" :height="height"
      :fill="`url(#vs-bg-${uid})`"
    />

    <!-- Yellow zero reference (licarth: rect at top of SVG, -3,-2, 22x4) -->
    <rect
      x="0"
      :y="centerY - 2"
      width="22"
      height="4"
      fill="#fbe044"
    />

    <!-- Major marks with labels -->
    <g v-for="mark in majorMarks" :key="mark.label">
      <!-- Up (climb) -->
      <text
        x="5"
        :y="mark.yUp + 5"
        fill="white"
        :font-size="17 * sf"
        font-family="monospace"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        {{ mark.label }}
      </text>
      <line
        x1="11"
        :y1="mark.yUp"
        x2="19"
        :y2="mark.yUp"
        stroke="white"
        stroke-width="4"
      />
      <!-- Down (descent) -->
      <text
        x="5"
        :y="mark.yDown + 5"
        fill="white"
        :font-size="17 * sf"
        font-family="monospace"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        {{ mark.label }}
      </text>
      <line
        x1="11"
        :y1="mark.yDown"
        x2="19"
        :y2="mark.yDown"
        stroke="white"
        stroke-width="4"
      />
    </g>

    <!-- Minor tick marks -->
    <g v-for="(mark, i) in minorMarks" :key="`minor-${i}`">
      <line
        x1="11"
        :y1="mark.yUp"
        x2="19"
        :y2="mark.yUp"
        stroke="white"
        stroke-width="2"
      />
      <line
        x1="11"
        :y1="mark.yDown"
        x2="19"
        :y2="mark.yDown"
        stroke="white"
        stroke-width="2"
      />
    </g>

    <!-- VS indicator line (green, from center to value) -->
    <line
      x1="15"
      :y1="needleY"
      x2="45"
      :y2="needleY * 0.4 + centerY * 0.6"
      :stroke="GREEN"
      stroke-width="4"
      stroke-linecap="round"
    />

    <!-- Numeric readout -->
    <g v-if="showReadout">
      <rect
        x="18"
        :y="readoutY - 10"
        width="30"
        height="20"
        fill="black"
      />
      <text
        x="20"
        :y="readoutY + 1"
        :fill="GREEN"
        :font-size="17 * sf"
        font-family="monospace"
        dominant-baseline="middle"
      >
        {{ readoutText }}
      </text>
    </g>
  </svg>
</template>
