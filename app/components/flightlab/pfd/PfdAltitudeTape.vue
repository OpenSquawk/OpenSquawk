<script setup lang="ts">
const props = withDefaults(defineProps<{
  altitude: number
  width?: number
  height?: number
}>(), {
  width: 110,
  height: 325,
})

const uid = useId()
const clipId = computed(() => `alt-clip-${uid}`)
const readoutClipId = computed(() => `alt-readout-${uid}`)

const centerY = computed(() => props.height / 2)

// licarth: oneLfInPx = 28.5 at height=325 for FL (100ft) marks
const pxPerHundredFt = computed(() => props.height * 28.5 / 325)

function altToY(alt: number): number {
  return centerY.value + (props.altitude - alt) * pxPerHundredFt.value / 100
}

const visibleRange = computed(() => {
  const halfVisible = props.height / 2 / pxPerHundredFt.value * 100 + 200
  return {
    min: Math.floor((props.altitude - halfVisible) / 100) * 100,
    max: Math.ceil((props.altitude + halfVisible) / 100) * 100,
  }
})

const marks = computed(() => {
  const result: Array<{ alt: number; y: number; isLabel: boolean; label: string }> = []
  for (let alt = visibleRange.value.min; alt <= visibleRange.value.max; alt += 100) {
    const y = altToY(alt)
    const isLabel = alt % 500 === 0
    const fl = Math.round(alt / 100)
    const label = isLabel ? String(fl).padStart(3, '0') : ''
    result.push({ alt, y, isLabel, label })
  }
  return result
})

// --- Readout dimensions ---
const readoutH = computed(() => Math.max(28, props.height * 0.11))
// Big digits box starts right after the tape ticks
const tapeTickW = 10
const readoutX = computed(() => tapeTickW + 4)
// Big digits: occupies ~55% of remaining width
const readoutAvailW = computed(() => props.width - readoutX.value - 2)
const bigBoxW = computed(() => readoutAvailW.value * 0.6)
const smallBoxW = computed(() => readoutAvailW.value * 0.4)

// Font sizes: make sure digits fit
const bigFontSize = computed(() => Math.max(12, Math.min(28, bigBoxW.value / 3.2)))
const smallFontSize = computed(() => Math.max(10, Math.min(20, smallBoxW.value / 2.4)))
const labelFontSize = computed(() => Math.max(10, Math.min(20, props.width * 0.16)))

// Drum roller: display altitude as separate digit groups
// Big digits: 10000s, 1000s, 100s
const bigDigits = computed(() => {
  const alt = Math.max(0, props.altitude)
  const d1 = Math.floor(alt / 10000)
  const d2 = Math.floor((alt % 10000) / 1000)
  const d3 = Math.floor((alt % 1000) / 100)

  let d1val = d1
  let d2val = d2
  let d3val = d3
  const lastTwo = alt % 100
  if (lastTwo > 80) {
    const offset = (lastTwo - 80) / 20
    d3val += offset
    if (alt % 1000 > 980) d2val += offset
    if (alt % 10000 > 9980) d1val += offset
  }
  return { d1: d1val, d2: d2val, d3: d3val }
})

// Small digits: 00,20,40,60,80 drum
const smallDigitOffset = computed(() => {
  return (props.altitude % 100) / 20
})

// Digit spacing for the big drum — tighter horizontal packing
const bigDigitSpacing = computed(() => bigBoxW.value / 3.5)

// Readout clip
const readoutClipY = computed(() => centerY.value - readoutH.value / 2)
const readoutClipH = computed(() => readoutH.value)
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
      <clipPath :id="readoutClipId">
        <rect
          :x="readoutX - 1"
          :y="readoutClipY"
          :width="bigBoxW + smallBoxW + 6"
          :height="readoutClipH"
        />
      </clipPath>
      <radialGradient :id="`alt-bg-${uid}`" cx="0" cy="0.5" r="1.2">
        <stop offset="0%" stop-color="#1f2a2c" />
        <stop offset="57%" stop-color="#304c50" />
        <stop offset="100%" stop-color="#1d282a" />
      </radialGradient>
    </defs>

    <!-- Background -->
    <rect x="0" y="0" :width="width" :height="height" :fill="`url(#alt-bg-${uid})`" />

    <!-- Scrolling tape (clipped) -->
    <g :clip-path="`url(#${clipId})`">
      <!-- Vertical reference line (left side) -->
      <line :x1="tapeTickW" y1="0" :x2="tapeTickW" :y2="height" stroke="white" stroke-width="1" />

      <g v-for="mark in marks" :key="mark.alt">
        <!-- Tick mark (left side) -->
        <line x1="0" :y1="mark.y" :x2="tapeTickW" :y2="mark.y" stroke="white" stroke-width="1.5" />
        <!-- Label (only every 500ft) -->
        <text
          v-if="mark.isLabel"
          :x="tapeTickW + 4"
          :y="mark.y + labelFontSize * 0.35"
          fill="white"
          :font-size="labelFontSize"
          text-anchor="start"
          font-family="monospace"
        >
          {{ mark.label }}
        </text>
      </g>
    </g>

    <!-- Big digits box (100s, 1000s, 10000s) — yellow top+bottom border, black fill -->
    <rect
      :x="readoutX"
      :y="centerY - readoutH / 2"
      :width="bigBoxW"
      :height="readoutH"
      fill="black"
    />
    <line
      :x1="readoutX" :y1="centerY - readoutH / 2"
      :x2="readoutX + bigBoxW" :y2="centerY - readoutH / 2"
      stroke="#fbe044" stroke-width="2"
    />
    <line
      :x1="readoutX" :y1="centerY + readoutH / 2"
      :x2="readoutX + bigBoxW" :y2="centerY + readoutH / 2"
      stroke="#fbe044" stroke-width="2"
    />

    <!-- Big digit drum rollers (clipped) -->
    <g :clip-path="`url(#${readoutClipId})`">
      <!-- Digit 1 (ten-thousands) -->
      <g :transform="`translate(${readoutX + bigDigitSpacing * 0.2}, ${centerY + bigFontSize * 0.35 - bigDigits.d1 * bigFontSize * 1.03})`">
        <text
          v-for="d in 10" :key="`d1-${d}`"
          x="0" :y="(d - 1) * bigFontSize * 1.03"
          fill="#3ae061" :font-size="bigFontSize" font-weight="bold" font-family="monospace"
        >{{ d - 1 }}</text>
      </g>
      <!-- Digit 2 (thousands) -->
      <g :transform="`translate(${readoutX + bigDigitSpacing * 1.1}, ${centerY + bigFontSize * 0.35 - bigDigits.d2 * bigFontSize * 1.03})`">
        <text
          v-for="d in 10" :key="`d2-${d}`"
          x="0" :y="(d - 1) * bigFontSize * 1.03"
          fill="#3ae061" :font-size="bigFontSize" font-weight="bold" font-family="monospace"
        >{{ d - 1 }}</text>
      </g>
      <!-- Digit 3 (hundreds) -->
      <g :transform="`translate(${readoutX + bigDigitSpacing * 2.0}, ${centerY + bigFontSize * 0.35 - bigDigits.d3 * bigFontSize * 1.03})`">
        <text
          v-for="d in 10" :key="`d3-${d}`"
          x="0" :y="(d - 1) * bigFontSize * 1.03"
          fill="#3ae061" :font-size="bigFontSize" font-weight="bold" font-family="monospace"
        >{{ d - 1 }}</text>
      </g>
    </g>

    <!-- Small digits box (tens: 00,20,40,60,80) — full yellow border -->
    <rect
      :x="readoutX + bigBoxW"
      :y="centerY - readoutH / 2 - 4"
      :width="smallBoxW"
      :height="readoutH + 8"
      fill="black"
      stroke="#fbe044"
      stroke-width="2"
    />
    <!-- Small digit roller (clipped) -->
    <g :clip-path="`url(#${readoutClipId})`">
      <g :transform="`translate(${readoutX + bigBoxW + smallBoxW * 0.1}, ${centerY + smallFontSize * 0.35 - smallDigitOffset * smallFontSize * 1.05})`">
        <text
          v-for="(val, i) in ['20', '00', '80', '60', '40', '20', '00', '80']"
          :key="`sm-${i}`"
          x="0" :y="i * smallFontSize * 1.05"
          fill="#3ae061" :font-size="smallFontSize" font-weight="bold" font-family="monospace"
        >{{ val }}</text>
      </g>
    </g>

    <!-- Yellow pointer triangle (left of readout, pointing right) -->
    <polygon
      :points="`${readoutX - 5},${centerY - 6} ${readoutX},${centerY} ${readoutX - 5},${centerY + 6}`"
      fill="#fbe044"
    />
  </svg>
</template>
