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

const attSize = computed(() => 280 * props.scale)
const tapeWidth = computed(() => 70 * props.scale)
const altTapeWidth = computed(() => 80 * props.scale)
const vsWidth = computed(() => 40 * props.scale)
const headingHeight = computed(() => 44 * props.scale)
const gap = computed(() => 4 * props.scale)

const totalWidth = computed(() =>
  tapeWidth.value + gap.value + attSize.value + gap.value + altTapeWidth.value + gap.value + vsWidth.value,
)
const totalHeight = computed(() =>
  attSize.value + gap.value + headingHeight.value,
)

function isVisible(element: PfdElement): boolean {
  return props.visibleElements.includes(element)
}

// Positions
const speedTapePos = computed(() => ({
  left: 0,
  top: 0,
}))

const attitudePos = computed(() => ({
  left: tapeWidth.value + gap.value,
  top: 0,
}))

const altTapePos = computed(() => ({
  left: tapeWidth.value + attSize.value + gap.value * 2,
  top: 0,
}))

const vsPos = computed(() => ({
  left: tapeWidth.value + attSize.value + altTapeWidth.value + gap.value * 3,
  top: 0,
}))

const headingPos = computed(() => ({
  left: attitudePos.value.left - gap.value,
  top: attSize.value + gap.value,
}))

const headingWidth = computed(() => attSize.value + gap.value * 2)
</script>

<template>
  <div
    class="pfd-container"
    :style="{
      width: `${totalWidth}px`,
      height: `${totalHeight}px`,
      position: 'relative',
    }"
  >
    <!-- Speed Tape (left) -->
    <Transition name="pfd-fade">
      <div
        v-if="isVisible('speedTape')"
        :style="{
          position: 'absolute',
          left: `${speedTapePos.left}px`,
          top: `${speedTapePos.top}px`,
        }"
      >
        <FlightlabPfdSpeedTape
          :speed="speed"
          :target-range="speedTargetRange ?? undefined"
          :width="tapeWidth"
          :height="attSize"
        />
      </div>
    </Transition>

    <!-- Attitude Indicator (center) -->
    <Transition name="pfd-fade">
      <div
        v-if="isVisible('attitude')"
        :style="{
          position: 'absolute',
          left: `${attitudePos.left}px`,
          top: `${attitudePos.top}px`,
        }"
      >
        <FlightlabPfdAttitudeIndicator
          :pitch="pitch"
          :bank-angle="bankAngle"
          :size="attSize"
        />
      </div>
    </Transition>

    <!-- Altitude Tape (right of attitude) -->
    <Transition name="pfd-fade">
      <div
        v-if="isVisible('altitudeTape')"
        :style="{
          position: 'absolute',
          left: `${altTapePos.left}px`,
          top: `${altTapePos.top}px`,
        }"
      >
        <FlightlabPfdAltitudeTape
          :altitude="altitude"
          :width="altTapeWidth"
          :height="attSize"
        />
      </div>
    </Transition>

    <!-- Vertical Speed (far right) -->
    <Transition name="pfd-fade">
      <div
        v-if="isVisible('verticalSpeed')"
        :style="{
          position: 'absolute',
          left: `${vsPos.left}px`,
          top: `${vsPos.top}px`,
        }"
      >
        <FlightlabPfdVerticalSpeed
          :vertical-speed="verticalSpeed"
          :width="vsWidth"
          :height="attSize"
        />
      </div>
    </Transition>

    <!-- Heading Indicator (bottom, spanning below attitude) -->
    <Transition name="pfd-fade">
      <div
        v-if="isVisible('heading')"
        :style="{
          position: 'absolute',
          left: `${headingPos.left}px`,
          top: `${headingPos.top}px`,
        }"
      >
        <FlightlabPfdHeadingIndicator
          :heading="heading"
          :width="headingWidth"
          :height="headingHeight"
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
