<script setup lang="ts">
import type { PfdElement, PfdSpeedTargetRange } from '~~/shared/data/flightlab/types'

const props = withDefaults(defineProps<{
  pitch: number
  bankAngle: number
  heading: number
  speed: number
  altitude: number
  verticalSpeed: number
  visibleElements: PfdElement[]
  speedTargetRange?: PfdSpeedTargetRange | null
  scale?: number
}>(), {
  scale: 1,
  speedTargetRange: null,
})

// Base dimensions from licarth/a320pfd reference (631.18 x 604.72)
// We add a heading tape at the bottom since the reference doesn't include one
const BASE_W = 631
const BASE_H = 550 // trimmed — no FMA labels, add heading tape at bottom
const HEADING_H = 44

const s = computed(() => props.scale)

// Instrument dimensions (matching licarth proportions)
// Speed tape: left=25.5, top=152.4, w=100, h=319.8
const speedTape = computed(() => ({
  left: 26 * s.value,
  top: 120 * s.value,
  width: 100 * s.value,
  height: 320 * s.value,
}))

// Attitude indicator: centered at (281, 313) in reference, circular ~280px diameter
const attitude = computed(() => {
  const size = 290 * s.value
  return {
    left: (281 - 145) * s.value,
    top: (280 - 145) * s.value,
    size,
  }
})

// Altitude tape: left=440, top=151, w=110, h=325
const altTape = computed(() => ({
  left: 440 * s.value,
  top: 119 * s.value,
  width: 110 * s.value,
  height: 325 * s.value,
}))

// Vertical speed: left=576, top=121, w=48, h=385
const vsTape = computed(() => ({
  left: 562 * s.value,
  top: 89 * s.value,
  width: 48 * s.value,
  height: 385 * s.value,
}))

// Heading tape: below the attitude indicator
const headingTape = computed(() => ({
  left: attitude.value.left - 10 * s.value,
  top: (attitude.value.top + attitude.value.size + 4 * s.value),
  width: attitude.value.size + 20 * s.value,
  height: HEADING_H * s.value,
}))

// Total container
const totalWidth = computed(() => BASE_W * s.value)
const totalHeight = computed(() => BASE_H * s.value)

function isVisible(element: PfdElement): boolean {
  return props.visibleElements.includes(element)
}
</script>

<template>
  <div
    class="pfd-container"
    :style="{
      width: `${totalWidth}px`,
      height: `${totalHeight}px`,
      position: 'relative',
      overflow: 'hidden',
      background: '#000',
    }"
  >
    <!-- Attitude Indicator (center, behind everything) -->
    <Transition name="pfd-fade">
      <div
        v-if="isVisible('attitude')"
        :style="{
          position: 'absolute',
          left: `${attitude.left}px`,
          top: `${attitude.top}px`,
          zIndex: 0,
        }"
      >
        <FlightlabPfdAttitudeIndicator
          :pitch="pitch"
          :bank-angle="bankAngle"
          :size="attitude.size"
        />
      </div>
    </Transition>

    <!-- Speed Tape (left) -->
    <Transition name="pfd-fade">
      <div
        v-if="isVisible('speedTape')"
        :style="{
          position: 'absolute',
          left: `${speedTape.left}px`,
          top: `${speedTape.top}px`,
          zIndex: 2,
        }"
      >
        <FlightlabPfdSpeedTape
          :speed="speed"
          :target-range="speedTargetRange ?? undefined"
          :width="speedTape.width"
          :height="speedTape.height"
        />
      </div>
    </Transition>

    <!-- Altitude Tape (right of attitude) -->
    <Transition name="pfd-fade">
      <div
        v-if="isVisible('altitudeTape')"
        :style="{
          position: 'absolute',
          left: `${altTape.left}px`,
          top: `${altTape.top}px`,
          zIndex: 2,
        }"
      >
        <FlightlabPfdAltitudeTape
          :altitude="altitude"
          :width="altTape.width"
          :height="altTape.height"
        />
      </div>
    </Transition>

    <!-- Vertical Speed (far right) -->
    <Transition name="pfd-fade">
      <div
        v-if="isVisible('verticalSpeed')"
        :style="{
          position: 'absolute',
          left: `${vsTape.left}px`,
          top: `${vsTape.top}px`,
          zIndex: 2,
        }"
      >
        <FlightlabPfdVerticalSpeed
          :vertical-speed="verticalSpeed"
          :width="vsTape.width"
          :height="vsTape.height"
        />
      </div>
    </Transition>

    <!-- Heading Indicator (bottom center) -->
    <Transition name="pfd-fade">
      <div
        v-if="isVisible('heading')"
        :style="{
          position: 'absolute',
          left: `${headingTape.left}px`,
          top: `${headingTape.top}px`,
          zIndex: 2,
        }"
      >
        <FlightlabPfdHeadingIndicator
          :heading="heading"
          :width="headingTape.width"
          :height="headingTape.height"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pfd-fade-enter-active {
  transition: all 0.8s ease;
}
.pfd-fade-leave-active {
  transition: all 0.4s ease;
}
.pfd-fade-enter-from {
  opacity: 0;
  transform: scale(0.9);
}
.pfd-fade-leave-to {
  opacity: 0;
}
</style>
