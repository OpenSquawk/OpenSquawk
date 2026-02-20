# Learn PFD Medienstation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive PFD learning station at `/flightlab/medienstationen/learn-pfd` where users progressively learn to read an Airbus PFD through hands-on interaction with a simulated FBW flight model, driven by WebSocket sidestick/throttle input.

**Architecture:** Nuxt 4 page with SVG-based PFD instrument components, a Three.js 3D aircraft model, and a `useAirbusFBW()` composable for flight physics. Input comes via WebSocket (reusing existing `/api/flightlab/ws`). Phase-based stepper with TTS narration reuses existing `useFlightLabEngine` + `useFlightLabAudio` patterns.

**Tech Stack:** Vue 3 SFC, SVG, Three.js (new dep), existing FlightLab composables (engine, audio, sync), WebSocket, Tailwind CSS.

---

## Task 1: Install Three.js and Create Branch

**Files:**
- Modify: `package.json`

**Step 1: Create feature branch**

```bash
git checkout -b feat/learn-pfd
```

**Step 2: Install Three.js**

```bash
bun add three && bun add -d @types/three
```

**Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: add three.js dependency for 3D aircraft model"
```

---

## Task 2: Extend Types for Learn-PFD Phases

**Files:**
- Modify: `shared/data/flightlab/types.ts`

Add the new phase interface extension that learn-pfd needs, alongside existing types.

**Step 1: Add PFD-specific types to `shared/data/flightlab/types.ts`**

Append after the existing `FlightLabScenario` interface (line ~89):

```typescript
// --- Learn PFD Extensions ---

export type PfdElement = 'attitude' | 'speedTape' | 'altitudeTape' | 'verticalSpeed' | 'heading'
export type PfdLayoutMode = 'model-focus' | 'split' | 'pfd-focus'

export interface PfdInteractionGoal {
  /** What to check: pitch angle, altitude, heading, speed, bank */
  parameter: 'pitch' | 'altitude' | 'heading' | 'speed' | 'bankAngle' | 'verticalSpeed'
  /** Target value */
  target: number
  /** Acceptable deviation (+/-) */
  tolerance: number
  /** How long (ms) the user must hold the value within tolerance to pass */
  holdMs?: number
}

export interface LearnPfdPhase extends FlightLabPhase {
  /** Which PFD elements are visible in this phase */
  visibleElements: PfdElement[]
  /** Layout mode controlling PFD vs 3D model sizing */
  layoutMode: PfdLayoutMode
  /** Optional interaction goal — user must achieve this to auto-advance */
  interactionGoal?: PfdInteractionGoal
  /** Timeout (ms) before showing hint if goal not reached. Default 15000 */
  goalTimeoutMs?: number
  /** Hint spoken via TTS if user struggles */
  goalHint?: string
}

export interface LearnPfdScenario {
  id: string
  title: string
  description: string
  icon: string
  phases: LearnPfdPhase[]
}
```

**Step 2: Commit**

```bash
git add shared/data/flightlab/types.ts
git commit -m "feat(types): add LearnPfdPhase and PFD element types"
```

---

## Task 3: Create FBW Physics Composable

**Files:**
- Create: `shared/composables/flightlab/useAirbusFBW.ts`

This is the core flight dynamics model. It takes sidestick + throttle input and outputs realistic flight state.

**Step 1: Create `shared/composables/flightlab/useAirbusFBW.ts`**

```typescript
// shared/composables/flightlab/useAirbusFBW.ts
import { ref, reactive, onBeforeUnmount } from 'vue'

export interface StickInput {
  pitch: number    // -1 (full forward) to +1 (full back)
  roll: number     // -1 (full left) to +1 (full right)
  throttle: number // 0 (idle) to 1 (TOGA)
}

export interface FlightState {
  pitch: number          // degrees (positive = nose up)
  bankAngle: number      // degrees (positive = right bank)
  heading: number        // 0-360
  speed: number          // knots IAS
  altitude: number       // feet
  verticalSpeed: number  // feet per minute
  aoa: number            // angle of attack degrees
  throttlePercent: number // 0-100
  onGround: boolean
}

// --- Airbus Normal Law Constants ---
const MAX_PITCH_UP = 30        // degrees (alpha-floor protection kicks in before)
const MAX_PITCH_DOWN = -15     // degrees
const MAX_BANK = 67            // hard limit
const BANK_NEUTRAL_LIMIT = 33  // bank auto-returns to this if stick neutral
const MAX_ROLL_RATE = 15       // degrees/sec at full stick deflection
const ROLL_RETURN_RATE = 5     // degrees/sec auto-return when bank > 33° and stick neutral

// Pitch: stick commands load factor (G), which translates to pitch rate
const MAX_G_PULL = 2.5
const MIN_G_PUSH = -1.0
const NEUTRAL_G = 1.0
const PITCH_RATE_PER_G_DELTA = 3.5 // degrees/sec per G deviation from target

// Speed / thrust model (simplified)
const IDLE_THRUST = 2000       // lbs equivalent
const MAX_THRUST = 50000       // lbs equivalent (both engines TOGA)
const DRAG_COEFFICIENT = 0.03
const MASS = 150000            // lbs (A320 typical)
const GRAVITY = 32.174         // ft/s²
const KT_TO_FPS = 1.68781     // knots to feet per second

// Initial state
const INITIAL_SPEED = 220      // knots
const INITIAL_ALTITUDE = 5000  // feet
const INITIAL_HEADING = 360

export function useAirbusFBW() {
  const input = reactive<StickInput>({ pitch: 0, roll: 0, throttle: 0.5 })

  const state = reactive<FlightState>({
    pitch: 2,
    bankAngle: 0,
    heading: INITIAL_HEADING,
    speed: INITIAL_SPEED,
    altitude: INITIAL_ALTITUDE,
    verticalSpeed: 0,
    aoa: 2,
    throttlePercent: 50,
    onGround: false,
  })

  let animFrame: number | null = null
  let lastTime: number | null = null
  let running = false

  function updateInput(newInput: Partial<StickInput>) {
    if (newInput.pitch !== undefined) input.pitch = clamp(newInput.pitch, -1, 1)
    if (newInput.roll !== undefined) input.roll = clamp(newInput.roll, -1, 1)
    if (newInput.throttle !== undefined) input.throttle = clamp(newInput.throttle, 0, 1)
  }

  function reset() {
    input.pitch = 0
    input.roll = 0
    input.throttle = 0.5
    state.pitch = 2
    state.bankAngle = 0
    state.heading = INITIAL_HEADING
    state.speed = INITIAL_SPEED
    state.altitude = INITIAL_ALTITUDE
    state.verticalSpeed = 0
    state.aoa = 2
    state.throttlePercent = 50
    state.onGround = false
    lastTime = null
  }

  function tick(timestamp: number) {
    if (!running) return
    if (lastTime === null) {
      lastTime = timestamp
      animFrame = requestAnimationFrame(tick)
      return
    }

    const dt = Math.min((timestamp - lastTime) / 1000, 0.1) // seconds, capped at 100ms
    lastTime = timestamp

    // --- Throttle ---
    state.throttlePercent = input.throttle * 100
    const thrust = IDLE_THRUST + input.throttle * (MAX_THRUST - IDLE_THRUST)

    // --- Roll (Normal Law: stick = roll rate command) ---
    const targetRollRate = input.roll * MAX_ROLL_RATE
    const isStickNeutral = Math.abs(input.roll) < 0.05

    if (isStickNeutral) {
      // Auto-return if bank > neutral limit
      if (Math.abs(state.bankAngle) > BANK_NEUTRAL_LIMIT) {
        const returnDir = state.bankAngle > 0 ? -1 : 1
        state.bankAngle += returnDir * ROLL_RETURN_RATE * dt
        // Don't overshoot the limit
        if (returnDir > 0 && state.bankAngle < -BANK_NEUTRAL_LIMIT) state.bankAngle = -BANK_NEUTRAL_LIMIT
        if (returnDir < 0 && state.bankAngle > BANK_NEUTRAL_LIMIT) state.bankAngle = BANK_NEUTRAL_LIMIT
      }
      // Otherwise hold current bank angle (Normal Law behavior)
    } else {
      state.bankAngle += targetRollRate * dt
    }
    state.bankAngle = clamp(state.bankAngle, -MAX_BANK, MAX_BANK)

    // --- Pitch (Normal Law: stick = load factor command) ---
    // Map stick to target G
    const targetG = input.pitch > 0
      ? NEUTRAL_G + input.pitch * (MAX_G_PULL - NEUTRAL_G)   // pull: 1G → 2.5G
      : NEUTRAL_G + input.pitch * (NEUTRAL_G - MIN_G_PUSH)    // push: 1G → -1G

    // Current G based on pitch rate (simplified)
    const speedFps = state.speed * KT_TO_FPS
    const currentG = speedFps > 50 ? 1 + (state.pitch * Math.PI / 180) * speedFps / GRAVITY * 0.01 : 1

    // Pitch rate from G delta
    const gDelta = targetG - currentG
    const pitchRate = gDelta * PITCH_RATE_PER_G_DELTA
    state.pitch += pitchRate * dt
    state.pitch = clamp(state.pitch, MAX_PITCH_DOWN, MAX_PITCH_UP)

    // --- Speed ---
    // Simplified: thrust - drag = acceleration
    const speedFps2 = state.speed * KT_TO_FPS
    const drag = DRAG_COEFFICIENT * speedFps2 * speedFps2
    const climbPenalty = Math.sin(state.pitch * Math.PI / 180) * MASS * GRAVITY * 0.3
    const netForce = thrust - drag - climbPenalty
    const acceleration = netForce / MASS // ft/s²
    const speedDelta = (acceleration / KT_TO_FPS) * dt
    state.speed += speedDelta
    state.speed = clamp(state.speed, 80, 380) // Vmin to Vmo (simplified)

    // --- Vertical Speed ---
    // VS = speed * sin(pitch) adjusted for bank
    const bankFactor = Math.cos(state.bankAngle * Math.PI / 180)
    state.verticalSpeed = speedFps2 * Math.sin(state.pitch * Math.PI / 180) * 60 * bankFactor // fpm

    // --- Altitude ---
    state.altitude += (state.verticalSpeed / 60) * dt
    state.altitude = Math.max(0, state.altitude)
    state.onGround = state.altitude <= 0

    // --- Heading ---
    // Standard rate turn: bank angle → turn rate
    if (speedFps2 > 50) {
      const turnRate = (GRAVITY * Math.tan(state.bankAngle * Math.PI / 180)) / speedFps2
      const headingDelta = turnRate * (180 / Math.PI) * dt
      state.heading = ((state.heading + headingDelta) % 360 + 360) % 360
    }

    // --- AoA (simplified) ---
    state.aoa = state.pitch - (state.verticalSpeed > 0 ? 1 : -1) * Math.min(Math.abs(state.verticalSpeed) / 500, 5)

    animFrame = requestAnimationFrame(tick)
  }

  function start() {
    if (running) return
    running = true
    lastTime = null
    animFrame = requestAnimationFrame(tick)
  }

  function stop() {
    running = false
    if (animFrame !== null) {
      cancelAnimationFrame(animFrame)
      animFrame = null
    }
  }

  function cleanup() {
    stop()
  }

  onBeforeUnmount(() => cleanup())

  return {
    input,
    state,
    updateInput,
    reset,
    start,
    stop,
    cleanup,
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}
```

**Step 2: Commit**

```bash
git add shared/composables/flightlab/useAirbusFBW.ts
git commit -m "feat(fbw): add Airbus Normal Law FBW physics composable"
```

---

## Task 4: Add `stick-input` WebSocket Message Type

**Files:**
- Modify: `server/api/flightlab/ws.ts` (add case in switch ~line 82)
- Modify: `shared/composables/flightlab/useFlightLabSync.ts` (add callback + handler)
- Modify: `shared/data/flightlab/types.ts` (add WS event type)

**Step 1: Add to WS event union in `shared/data/flightlab/types.ts`**

Add to the `FlightLabWSEvent` type union (line ~109):

```typescript
  | { type: 'stick-input'; data: { pitch: number; roll: number; throttle: number } }
```

**Step 2: Add server handler in `server/api/flightlab/ws.ts`**

Add a new case in the `switch (data.type)` block (after `subscribe-telemetry` case, before closing `}`):

```typescript
      case 'stick-input': {
        // Broadcast stick/throttle input to all peers in session (for PFD display)
        const session = findSessionByPeer(peerId)
        if (!session) return
        broadcastToSession(session, { type: 'stick-input', data: data.data }, peerId)
        break
      }
```

**Step 3: Add client handler in `shared/composables/flightlab/useFlightLabSync.ts`**

Add to the `callbacks` object (after `onError` line ~18):

```typescript
    onStickInput: [] as Array<(data: { pitch: number; roll: number; throttle: number }) => void>,
```

Add to the `handleMessage` switch (after the `error` case):

```typescript
      case 'stick-input':
        callbacks.onStickInput.forEach(cb => cb(data.data))
        break
```

Add the registration function (after `onError` function):

```typescript
  function onStickInput(cb: (data: { pitch: number; roll: number; throttle: number }) => void) { callbacks.onStickInput.push(cb) }
```

Add `sendStickInput` helper:

```typescript
  function sendStickInput(data: { pitch: number; roll: number; throttle: number }) {
    send({ type: 'stick-input', data })
  }
```

Add both to the return object:

```typescript
    onStickInput,
    sendStickInput,
```

**Step 4: Commit**

```bash
git add shared/data/flightlab/types.ts server/api/flightlab/ws.ts shared/composables/flightlab/useFlightLabSync.ts
git commit -m "feat(ws): add stick-input WebSocket message type for PFD input"
```

---

## Task 5: Create PFD SVG Components

**Files:**
- Create: `app/components/flightlab/pfd/PfdAttitudeIndicator.vue`
- Create: `app/components/flightlab/pfd/PfdSpeedTape.vue`
- Create: `app/components/flightlab/pfd/PfdAltitudeTape.vue`
- Create: `app/components/flightlab/pfd/PfdVerticalSpeed.vue`
- Create: `app/components/flightlab/pfd/PfdHeadingIndicator.vue`
- Create: `app/components/flightlab/pfd/PfdContainer.vue`

Each component gets the flight state as props. Build them as realistic Airbus PFD instruments.

### 5a: PfdAttitudeIndicator.vue

The artificial horizon — the central and largest instrument. Shows sky (blue) / ground (brown), pitch ladder markings, bank angle arc with pointer, and aircraft reference symbol.

```vue
<template>
  <svg :viewBox="`0 0 ${size} ${size}`" :width="size" :height="size" class="pfd-attitude">
    <defs>
      <clipPath id="att-clip">
        <rect x="0" y="0" :width="size" :height="size" rx="8" />
      </clipPath>
      <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a5fb4" />
        <stop offset="100%" stop-color="#62a0ea" />
      </linearGradient>
      <linearGradient id="ground-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8b6914" />
        <stop offset="100%" stop-color="#5e4108" />
      </linearGradient>
    </defs>

    <g clip-path="url(#att-clip)">
      <!-- Rotating group for pitch + roll -->
      <g :transform="`translate(${cx}, ${cy}) rotate(${-bankAngle})`">
        <!-- Sky -->
        <rect :x="-size * 2" :y="-size * 4 + pitchOffset" :width="size * 4" :height="size * 4" fill="url(#sky-grad)" />
        <!-- Ground -->
        <rect :x="-size * 2" :y="pitchOffset" :width="size * 4" :height="size * 4" fill="url(#ground-grad)" />
        <!-- Horizon line -->
        <line :x1="-size * 2" :y1="pitchOffset" :x2="size * 2" :y2="pitchOffset" stroke="white" stroke-width="2" />

        <!-- Pitch ladder -->
        <g v-for="deg in pitchMarks" :key="deg">
          <line
            :x1="deg % 10 === 0 ? -40 : -20"
            :y1="pitchOffset - deg * pitchScale"
            :x2="deg % 10 === 0 ? 40 : 20"
            :y2="pitchOffset - deg * pitchScale"
            stroke="white"
            :stroke-width="deg % 10 === 0 ? 2 : 1"
            :opacity="deg % 10 === 0 ? 0.9 : 0.5"
          />
          <text
            v-if="deg % 10 === 0 && deg !== 0"
            :x="-50"
            :y="pitchOffset - deg * pitchScale + 4"
            fill="white"
            font-size="11"
            font-family="monospace"
            text-anchor="end"
            opacity="0.8"
          >{{ Math.abs(deg) }}</text>
          <text
            v-if="deg % 10 === 0 && deg !== 0"
            :x="50"
            :y="pitchOffset - deg * pitchScale + 4"
            fill="white"
            font-size="11"
            font-family="monospace"
            text-anchor="start"
            opacity="0.8"
          >{{ Math.abs(deg) }}</text>
        </g>
      </g>

      <!-- Bank angle arc (fixed to screen) -->
      <g :transform="`translate(${cx}, ${bankArcY})`">
        <!-- Arc ticks at 10, 20, 30, 45, 60 degrees -->
        <g v-for="tick in bankTicks" :key="tick.deg" :transform="`rotate(${tick.deg})`">
          <line :x1="0" :y1="-bankArcRadius" :x2="0" :y2="-bankArcRadius + tick.len" stroke="white" :stroke-width="tick.thick ? 2 : 1" :opacity="tick.thick ? 0.9 : 0.6" />
        </g>
        <!-- Bank pointer (moves with bank angle) -->
        <g :transform="`rotate(${-bankAngle})`">
          <polygon :points="`0,${-bankArcRadius + 12} -6,${-bankArcRadius + 22} 6,${-bankArcRadius + 22}`" fill="#22d3ee" />
        </g>
      </g>

      <!-- Fixed aircraft reference (yellow/black wings + dot) -->
      <g :transform="`translate(${cx}, ${cy})`">
        <line x1="-50" y1="0" x2="-18" y2="0" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
        <line x1="18" y1="0" x2="50" y2="0" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
        <circle cx="0" cy="0" r="4" fill="#fbbf24" />
        <!-- small down-tick for wing reference -->
        <line x1="-18" y1="0" x2="-18" y2="8" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
        <line x1="18" y1="0" x2="18" y2="8" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
      </g>
    </g>

    <!-- Border -->
    <rect x="0" y="0" :width="size" :height="size" rx="8" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  pitch: number       // degrees
  bankAngle: number   // degrees
  size?: number
}>(), { size: 300 })

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)
const pitchScale = computed(() => props.size / 60) // pixels per degree
const pitchOffset = computed(() => props.pitch * pitchScale.value)
const bankArcRadius = computed(() => props.size * 0.38)
const bankArcY = computed(() => props.size * 0.15)

const pitchMarks = computed(() => {
  const marks: number[] = []
  for (let d = -30; d <= 30; d += 5) {
    if (d !== 0) marks.push(d)
  }
  return marks
})

const bankTicks = computed(() => [
  { deg: -60, len: 10, thick: true },
  { deg: -45, len: 8, thick: false },
  { deg: -30, len: 10, thick: true },
  { deg: -20, len: 8, thick: false },
  { deg: -10, len: 8, thick: false },
  { deg: 0, len: 12, thick: true },
  { deg: 10, len: 8, thick: false },
  { deg: 20, len: 8, thick: false },
  { deg: 30, len: 10, thick: true },
  { deg: 45, len: 8, thick: false },
  { deg: 60, len: 10, thick: true },
])
</script>
```

### 5b: PfdSpeedTape.vue

Scrolling speed tape on the left side. Shows current IAS with a scrolling numeric scale and a readout box.

```vue
<template>
  <svg :viewBox="`0 0 ${width} ${height}`" :width="width" :height="height" class="pfd-speed-tape">
    <defs>
      <clipPath id="speed-clip">
        <rect x="0" y="0" :width="width" :height="height" rx="4" />
      </clipPath>
      <linearGradient id="speed-bg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(10,10,30,0.95)" />
        <stop offset="100%" stop-color="rgba(10,10,30,0.8)" />
      </linearGradient>
    </defs>

    <g clip-path="url(#speed-clip)">
      <!-- Background -->
      <rect x="0" y="0" :width="width" :height="height" fill="url(#speed-bg)" />

      <!-- Scrolling scale -->
      <g :transform="`translate(0, ${scrollOffset})`">
        <g v-for="spd in visibleSpeeds" :key="spd">
          <line
            :x1="spd % 10 === 0 ? width - 18 : width - 10"
            :y1="speedToY(spd)"
            :x2="width"
            :y2="speedToY(spd)"
            stroke="white"
            :stroke-width="spd % 10 === 0 ? 1.5 : 0.5"
            :opacity="spd % 10 === 0 ? 0.9 : 0.4"
          />
          <text
            v-if="spd % 20 === 0"
            :x="width - 22"
            :y="speedToY(spd) + 4"
            fill="white"
            font-size="13"
            font-family="monospace"
            text-anchor="end"
            opacity="0.9"
          >{{ spd }}</text>
        </g>
      </g>

      <!-- Current speed readout box -->
      <rect :x="0" :y="centerY - 16" :width="width - 6" height="32" fill="#0a0a1e" stroke="#22d3ee" stroke-width="1.5" rx="3" />
      <text :x="width - 12" :y="centerY + 6" fill="#22d3ee" font-size="18" font-family="monospace" font-weight="bold" text-anchor="end">
        {{ Math.round(speed) }}
      </text>

      <!-- Speed trend arrow (if VS causes speed change) -->
      <line v-if="Math.abs(speedTrend) > 2" :x1="width / 2" :y1="centerY" :x2="width / 2" :y2="centerY - speedTrend * 0.5" stroke="#10b981" stroke-width="2" marker-end="url(#arrow)" />
    </g>

    <rect x="0" y="0" :width="width" :height="height" rx="4" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  speed: number
  speedTrend?: number
  width?: number
  height?: number
}>(), { speedTrend: 0, width: 70, height: 300 })

const centerY = computed(() => props.height / 2)
const pixelsPerKnot = 3
const scrollOffset = computed(() => 0) // offset handled in speedToY

function speedToY(spd: number): number {
  return centerY.value + (props.speed - spd) * pixelsPerKnot
}

const visibleSpeeds = computed(() => {
  const range = Math.ceil(props.height / pixelsPerKnot / 2) + 20
  const min = Math.floor(props.speed - range)
  const max = Math.ceil(props.speed + range)
  const speeds: number[] = []
  for (let s = Math.floor(min / 5) * 5; s <= max; s += 5) {
    if (s >= 0) speeds.push(s)
  }
  return speeds
})
</script>
```

### 5c: PfdAltitudeTape.vue

Same pattern as speed tape but on the right, showing altitude in feet.

```vue
<template>
  <svg :viewBox="`0 0 ${width} ${height}`" :width="width" :height="height" class="pfd-alt-tape">
    <defs>
      <clipPath id="alt-clip">
        <rect x="0" y="0" :width="width" :height="height" rx="4" />
      </clipPath>
    </defs>

    <g clip-path="url(#alt-clip)">
      <rect x="0" y="0" :width="width" :height="height" fill="rgba(10,10,30,0.95)" />

      <!-- Scrolling scale -->
      <g v-for="alt in visibleAlts" :key="alt">
        <line
          x1="0"
          :y1="altToY(alt)"
          :x2="alt % 500 === 0 ? 18 : 10"
          :y2="altToY(alt)"
          stroke="white"
          :stroke-width="alt % 500 === 0 ? 1.5 : 0.5"
          :opacity="alt % 500 === 0 ? 0.9 : 0.4"
        />
        <text
          v-if="alt % 500 === 0"
          x="22"
          :y="altToY(alt) + 4"
          fill="white"
          font-size="13"
          font-family="monospace"
          text-anchor="start"
          opacity="0.9"
        >{{ alt }}</text>
      </g>

      <!-- Current altitude readout -->
      <rect x="6" :y="centerY - 16" :width="width - 8" height="32" fill="#0a0a1e" stroke="#22d3ee" stroke-width="1.5" rx="3" />
      <text x="12" :y="centerY + 6" fill="#22d3ee" font-size="16" font-family="monospace" font-weight="bold" text-anchor="start">
        {{ Math.round(altitude) }}
      </text>
    </g>

    <rect x="0" y="0" :width="width" :height="height" rx="4" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  altitude: number
  width?: number
  height?: number
}>(), { width: 80, height: 300 })

const centerY = computed(() => props.height / 2)
const pixelsPerFoot = 0.15

function altToY(alt: number): number {
  return centerY.value + (props.altitude - alt) * pixelsPerFoot
}

const visibleAlts = computed(() => {
  const range = Math.ceil(props.height / pixelsPerFoot / 2) + 500
  const min = Math.floor((props.altitude - range) / 100) * 100
  const max = Math.ceil((props.altitude + range) / 100) * 100
  const alts: number[] = []
  for (let a = min; a <= max; a += 100) {
    if (a >= 0) alts.push(a)
  }
  return alts
})
</script>
```

### 5d: PfdVerticalSpeed.vue

VS indicator to the right of the altitude tape. A vertical scale with a moving band/needle.

```vue
<template>
  <svg :viewBox="`0 0 ${width} ${height}`" :width="width" :height="height" class="pfd-vs">
    <defs>
      <clipPath id="vs-clip">
        <rect x="0" y="0" :width="width" :height="height" rx="4" />
      </clipPath>
    </defs>

    <g clip-path="url(#vs-clip)">
      <rect x="0" y="0" :width="width" :height="height" fill="rgba(10,10,30,0.9)" />

      <!-- Scale markings: -6000 to +6000 fpm, non-linear -->
      <g v-for="mark in vsMarks" :key="mark.fpm">
        <line x1="0" :y1="mark.y" :x2="mark.major ? 12 : 6" :y2="mark.y" stroke="white" :stroke-width="mark.major ? 1.5 : 0.5" :opacity="mark.major ? 0.8 : 0.4" />
        <text v-if="mark.major && mark.fpm !== 0" x="16" :y="mark.y + 4" fill="white" font-size="10" font-family="monospace" opacity="0.7">
          {{ Math.abs(mark.fpm / 1000) }}
        </text>
      </g>

      <!-- Zero line -->
      <line x1="0" :y1="centerY" :x2="width" :y2="centerY" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />

      <!-- VS needle/band -->
      <rect x="2" :y="Math.min(centerY, needleY)" :width="8" :height="Math.abs(needleY - centerY)" fill="#22d3ee" opacity="0.7" rx="2" />

      <!-- Readout -->
      <text :x="width - 2" :y="centerY + (verticalSpeed >= 0 ? -8 : 16)" fill="#22d3ee" font-size="11" font-family="monospace" text-anchor="end" font-weight="bold">
        {{ vsFormatted }}
      </text>
    </g>

    <rect x="0" y="0" :width="width" :height="height" rx="4" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  verticalSpeed: number // fpm
  width?: number
  height?: number
}>(), { width: 40, height: 300 })

const centerY = computed(() => props.height / 2)

// Non-linear VS scale: compress larger values
function vsToY(fpm: number): number {
  const maxFpm = 6000
  const halfH = props.height / 2
  const normalized = Math.sign(fpm) * Math.sqrt(Math.abs(fpm) / maxFpm)
  return centerY.value - normalized * halfH * 0.85
}

const needleY = computed(() => vsToY(props.verticalSpeed))

const vsFormatted = computed(() => {
  const abs = Math.abs(Math.round(props.verticalSpeed / 50) * 50)
  if (abs === 0) return '0'
  return (props.verticalSpeed >= 0 ? '+' : '-') + abs
})

const vsMarks = computed(() => {
  const marks: Array<{ fpm: number; y: number; major: boolean }> = []
  for (const fpm of [-6000, -4000, -2000, -1000, 0, 1000, 2000, 4000, 6000]) {
    marks.push({ fpm, y: vsToY(fpm), major: true })
  }
  for (const fpm of [-3000, -1500, -500, 500, 1500, 3000, 5000]) {
    marks.push({ fpm, y: vsToY(fpm), major: false })
  }
  return marks.sort((a, b) => a.y - b.y)
})
</script>
```

### 5e: PfdHeadingIndicator.vue

Horizontal heading band at the bottom. A scrolling compass tape.

```vue
<template>
  <svg :viewBox="`0 0 ${width} ${height}`" :width="width" :height="height" class="pfd-heading">
    <defs>
      <clipPath id="hdg-clip">
        <rect x="0" y="0" :width="width" :height="height" rx="4" />
      </clipPath>
    </defs>

    <g clip-path="url(#hdg-clip)">
      <rect x="0" y="0" :width="width" :height="height" fill="rgba(10,10,30,0.95)" />

      <!-- Scrolling compass tape -->
      <g v-for="hdg in visibleHeadings" :key="hdg.raw">
        <line
          :x1="hdgToX(hdg.deg)"
          y1="0"
          :x2="hdgToX(hdg.deg)"
          :y2="hdg.major ? 14 : 8"
          stroke="white"
          :stroke-width="hdg.major ? 1.5 : 0.5"
          :opacity="hdg.major ? 0.9 : 0.4"
        />
        <text
          v-if="hdg.major"
          :x="hdgToX(hdg.deg)"
          y="26"
          fill="white"
          font-size="12"
          font-family="monospace"
          text-anchor="middle"
          opacity="0.8"
        >{{ hdg.label }}</text>
      </g>

      <!-- Center pointer -->
      <polygon :points="`${centerX - 5},0 ${centerX + 5},0 ${centerX},8`" fill="#22d3ee" />

      <!-- Current heading readout -->
      <rect :x="centerX - 22" :y="height - 22" width="44" height="20" fill="#0a0a1e" stroke="#22d3ee" stroke-width="1.5" rx="3" />
      <text :x="centerX" :y="height - 7" fill="#22d3ee" font-size="14" font-family="monospace" font-weight="bold" text-anchor="middle">
        {{ headingFormatted }}
      </text>
    </g>

    <rect x="0" y="0" :width="width" :height="height" rx="4" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  heading: number
  width?: number
  height?: number
}>(), { width: 300, height: 44 })

const centerX = computed(() => props.width / 2)
const pixelsPerDeg = 3

function hdgToX(deg: number): number {
  let delta = deg - props.heading
  // Wrap around for shortest path
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return centerX.value + delta * pixelsPerDeg
}

const headingFormatted = computed(() => String(Math.round(props.heading) % 360).padStart(3, '0'))

const cardinalLabels: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }

const visibleHeadings = computed(() => {
  const range = Math.ceil(props.width / pixelsPerDeg / 2) + 10
  const hdgs: Array<{ deg: number; raw: number; major: boolean; label: string }> = []
  const base = Math.round(props.heading)
  for (let d = base - range; d <= base + range; d += 5) {
    const normalized = ((d % 360) + 360) % 360
    const major = normalized % 10 === 0
    const label = cardinalLabels[normalized] ?? String(normalized / 10)
    hdgs.push({ deg: normalized, raw: d, major, label })
  }
  return hdgs
})
</script>
```

### 5f: PfdContainer.vue

Orchestration component — arranges all instruments in PFD layout, controls visibility per phase.

```vue
<template>
  <div class="pfd-container relative" :style="{ width: `${totalWidth}px`, height: `${totalHeight}px` }">
    <!-- Attitude Indicator (center) -->
    <Transition name="pfd-fade">
      <div v-if="showElement('attitude')" class="absolute" :style="attitudeStyle">
        <PfdAttitudeIndicator :pitch="pitch" :bank-angle="bankAngle" :size="attSize" />
      </div>
    </Transition>

    <!-- Speed Tape (left of attitude) -->
    <Transition name="pfd-fade">
      <div v-if="showElement('speedTape')" class="absolute" :style="speedTapeStyle">
        <PfdSpeedTape :speed="speed" :width="tapeWidth" :height="attSize" />
      </div>
    </Transition>

    <!-- Altitude Tape (right of attitude) -->
    <Transition name="pfd-fade">
      <div v-if="showElement('altitudeTape')" class="absolute" :style="altTapeStyle">
        <PfdAltitudeTape :altitude="altitude" :width="altTapeWidth" :height="attSize" />
      </div>
    </Transition>

    <!-- Vertical Speed (far right) -->
    <Transition name="pfd-fade">
      <div v-if="showElement('verticalSpeed')" class="absolute" :style="vsStyle">
        <PfdVerticalSpeed :vertical-speed="verticalSpeed" :width="vsWidth" :height="attSize" />
      </div>
    </Transition>

    <!-- Heading (bottom) -->
    <Transition name="pfd-fade">
      <div v-if="showElement('heading')" class="absolute" :style="headingStyle">
        <PfdHeadingIndicator :heading="heading" :width="attSize + tapeWidth * 2" :height="headingHeight" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PfdElement } from '~~/shared/data/flightlab/types'

const props = withDefaults(defineProps<{
  pitch: number
  bankAngle: number
  heading: number
  speed: number
  altitude: number
  verticalSpeed: number
  visibleElements: PfdElement[]
  scale?: number
}>(), { scale: 1 })

const attSize = computed(() => Math.round(280 * props.scale))
const tapeWidth = computed(() => Math.round(70 * props.scale))
const altTapeWidth = computed(() => Math.round(80 * props.scale))
const vsWidth = computed(() => Math.round(40 * props.scale))
const headingHeight = computed(() => Math.round(44 * props.scale))
const gap = computed(() => Math.round(4 * props.scale))

const totalWidth = computed(() => tapeWidth.value + attSize.value + altTapeWidth.value + vsWidth.value + gap.value * 3)
const totalHeight = computed(() => attSize.value + headingHeight.value + gap.value)

function showElement(el: PfdElement): boolean {
  return props.visibleElements.includes(el)
}

const speedTapeStyle = computed(() => ({
  left: '0px',
  top: '0px',
}))

const attitudeStyle = computed(() => ({
  left: `${tapeWidth.value + gap.value}px`,
  top: '0px',
}))

const altTapeStyle = computed(() => ({
  left: `${tapeWidth.value + attSize.value + gap.value * 2}px`,
  top: '0px',
}))

const vsStyle = computed(() => ({
  left: `${tapeWidth.value + attSize.value + altTapeWidth.value + gap.value * 3}px`,
  top: '0px',
}))

const headingStyle = computed(() => ({
  left: `${tapeWidth.value}px`,
  top: `${attSize.value + gap.value}px`,
}))
</script>

<style scoped>
.pfd-fade-enter-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
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
```

**Step: Commit**

```bash
git add app/components/flightlab/pfd/
git commit -m "feat(pfd): add SVG PFD instrument components (attitude, speed, alt, VS, heading)"
```

---

## Task 6: Create 3D Aircraft Model Component

**Files:**
- Create: `app/components/flightlab/pfd/PfdAircraftModel.vue`

Uses Three.js to render a simple 3D aircraft that reacts to flight state. Since we don't have a GLTF model file yet, start with a stylized geometric A320 shape built from Three.js primitives (box geometry fuselage + wings). This can be swapped for a GLTF later.

```vue
<template>
  <div ref="container" class="pfd-3d-model w-full h-full" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps<{
  pitch: number
  bankAngle: number
  heading: number
  speed: number
  altitude: number
}>()

const container = ref<HTMLElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let aircraft: THREE.Group | null = null
let animFrame: number | null = null
let resizeObserver: ResizeObserver | null = null

function createAircraft(): THREE.Group {
  const group = new THREE.Group()

  // Fuselage
  const fuselageGeo = new THREE.CylinderGeometry(0.4, 0.35, 5, 12)
  const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.3, roughness: 0.7 })
  const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat)
  fuselage.rotation.z = Math.PI / 2
  group.add(fuselage)

  // Nose cone
  const noseGeo = new THREE.ConeGeometry(0.35, 1, 12)
  const noseMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.4, roughness: 0.5 })
  const nose = new THREE.Mesh(noseGeo, noseMat)
  nose.rotation.z = -Math.PI / 2
  nose.position.x = 3
  group.add(nose)

  // Wings
  const wingGeo = new THREE.BoxGeometry(0.6, 4.5, 0.08)
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.3, roughness: 0.7 })
  const wings = new THREE.Mesh(wingGeo, wingMat)
  wings.position.x = -0.2
  group.add(wings)

  // Horizontal stabilizer
  const hStabGeo = new THREE.BoxGeometry(0.3, 1.8, 0.06)
  const hStab = new THREE.Mesh(hStabGeo, wingMat)
  hStab.position.x = -2.3
  group.add(hStab)

  // Vertical stabilizer
  const vStabGeo = new THREE.BoxGeometry(0.6, 0.06, 1.2)
  const vStab = new THREE.Mesh(vStabGeo, wingMat)
  vStab.position.set(-2.1, 0, 0.6)
  group.add(vStab)

  // Engines (under wings)
  const engineGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.8, 8)
  const engineMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.4 })
  for (const side of [-1, 1]) {
    const engine = new THREE.Mesh(engineGeo, engineMat)
    engine.rotation.z = Math.PI / 2
    engine.position.set(0.2, side * 1.5, -0.35)
    group.add(engine)
  }

  return group
}

function init() {
  if (!container.value) return

  const w = container.value.clientWidth
  const h = container.value.clientHeight

  // Scene
  scene = new THREE.Scene()

  // Sky gradient background
  const skyColor = new THREE.Color(0x1a5fb4)
  const horizonColor = new THREE.Color(0x62a0ea)
  scene.background = skyColor
  scene.fog = new THREE.Fog(horizonColor, 30, 100)

  // Camera
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200)
  camera.position.set(-8, 3, 5)
  camera.lookAt(0, 0, 0)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = false
  container.value.appendChild(renderer.domElement)

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const directional = new THREE.DirectionalLight(0xffffff, 0.8)
  directional.position.set(5, 10, 5)
  scene.add(directional)

  // Aircraft
  aircraft = createAircraft()
  scene.add(aircraft)

  // Cloud plane (ground reference)
  const cloudGeo = new THREE.PlaneGeometry(200, 200)
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
  const clouds = new THREE.Mesh(cloudGeo, cloudMat)
  clouds.rotation.x = -Math.PI / 2
  clouds.position.y = -8
  scene.add(clouds)

  // Resize observer
  resizeObserver = new ResizeObserver(() => {
    if (!container.value || !renderer || !camera) return
    const w2 = container.value.clientWidth
    const h2 = container.value.clientHeight
    renderer.setSize(w2, h2)
    camera.aspect = w2 / h2
    camera.updateProjectionMatrix()
  })
  resizeObserver.observe(container.value)

  animate()
}

function animate() {
  if (!renderer || !scene || !camera || !aircraft) return

  // Apply flight state to aircraft rotation
  const pitchRad = -(props.pitch * Math.PI) / 180
  const bankRad = -(props.bankAngle * Math.PI) / 180
  // Smooth interpolation
  aircraft.rotation.z = THREE.MathUtils.lerp(aircraft.rotation.z, pitchRad, 0.1)
  aircraft.rotation.x = THREE.MathUtils.lerp(aircraft.rotation.x, bankRad, 0.1)

  renderer.render(scene, camera)
  animFrame = requestAnimationFrame(animate)
}

function cleanup() {
  if (animFrame !== null) cancelAnimationFrame(animFrame)
  resizeObserver?.disconnect()
  if (renderer && container.value) {
    container.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
  scene = null
  camera = null
  renderer = null
  aircraft = null
}

onMounted(() => init())
onBeforeUnmount(() => cleanup())
</script>
```

**Step: Commit**

```bash
git add app/components/flightlab/pfd/PfdAircraftModel.vue
git commit -m "feat(3d): add Three.js aircraft model component for PFD learning"
```

---

## Task 7: Create Learn-PFD Scenario Data

**Files:**
- Create: `shared/data/flightlab/learn-pfd.ts`

Phase definitions following the design — progressive PFD element introduction with TTS messages, interaction goals, and layout modes.

**Step 1: Create scenario data**

Create `shared/data/flightlab/learn-pfd.ts` with the full phase tree. The phases should follow the structure from the design doc: welcome → horizon → pitch → speed tape → altitude tape → VS → heading → zusammenspiel → free practice.

Each phase needs:
- `id`, `atcMessage` (TTS text in German), `explanation`
- `visibleElements: PfdElement[]`
- `layoutMode: PfdLayoutMode`
- `buttons` for navigation
- Optional `interactionGoal` for hands-on tasks
- Optional comfort/info branches

Key points for the TTS messages:
- Simple German, casual tone (like existing takeoff scenario)
- Short sentences for attention span
- Immediately reference what the user should do with the stick
- Celebrate small wins

This file will be ~300-400 lines. Use the same pattern as `takeoff-eddf.ts`.

**Step 2: Commit**

```bash
git add shared/data/flightlab/learn-pfd.ts
git commit -m "feat(data): add learn-pfd scenario phases with progressive PFD element introduction"
```

---

## Task 8: Create Learn-PFD Engine (Phase + Goal Evaluation)

**Files:**
- Create: `shared/composables/flightlab/useLearnPfdEngine.ts`

This composable wraps `useFlightLabEngine` logic but adds interaction goal evaluation against the FBW state instead of SimConnect telemetry.

It needs to:
1. Manage phase navigation (reuse pattern from useFlightLabEngine)
2. Evaluate `interactionGoal` against current FBW `FlightState`
3. Track hold time (user must maintain target for `holdMs`)
4. Trigger hints after `goalTimeoutMs`
5. Auto-advance when goal met

**Step 1: Create composable**

The composable takes a `LearnPfdScenario` and a reactive `FlightState` reference. It checks goals every frame-ish (200ms interval is fine).

**Step 2: Commit**

```bash
git add shared/composables/flightlab/useLearnPfdEngine.ts
git commit -m "feat(engine): add learn-pfd engine with interaction goal evaluation"
```

---

## Task 9: Create Medienstationen Index Page

**Files:**
- Create: `app/pages/flightlab/medienstationen/index.vue`

Grid page listing available media stations. Same style as `/flightlab/index.vue` (dark bg, cards with icons and badges, Tailwind + Vuetify).

First card: "PFD verstehen" linking to `/flightlab/medienstationen/learn-pfd`.
Second card: "Coming soon" placeholder.

**Step 1: Create page**

Follow the exact pattern from `/app/pages/flightlab/index.vue`:
- `definePageMeta({ layout: false, middleware: ['require-auth'] })`
- Same header structure (FlightLab branding, back link to `/flightlab`)
- Hero section adapted for Medienstationen
- Card grid

**Step 2: Also add a link from `/flightlab/index.vue`**

Add a "Medienstationen" section or card below the existing scenarios grid, linking to `/flightlab/medienstationen`.

**Step 3: Commit**

```bash
git add app/pages/flightlab/medienstationen/index.vue app/pages/flightlab/index.vue
git commit -m "feat(pages): add medienstationen index page with learn-pfd card"
```

---

## Task 10: Create Learn-PFD Main Page

**Files:**
- Create: `app/pages/flightlab/medienstationen/learn-pfd.vue`

This is the main experience page. It wires together:
- `useAirbusFBW()` for physics
- `useLearnPfdEngine()` for phase management
- `useFlightLabAudio()` for TTS
- `useFlightLabSync()` for WebSocket stick input
- `PfdContainer` + `PfdAircraftModel` for display
- Dynamic layout switching per phase
- Sidebar stepper (reuse pattern from takeoff.vue)
- Fullscreen support

**Key behaviors:**
1. On mount: connect to WebSocket, register `onStickInput` callback → feeds `fbw.updateInput()`
2. Phase changes → trigger TTS, update visible elements, switch layout
3. Layout transitions: CSS Grid with `transition: grid-template-columns 0.6s ease`
4. Three layout modes:
   - `model-focus`: `grid-template-columns: 1fr 2fr` (PFD small, 3D big)
   - `split`: `grid-template-columns: 1fr 1fr`
   - `pfd-focus`: `grid-template-columns: 2fr 1fr` (PFD big, 3D small)

**Step 1: Create the page**

Follow takeoff.vue patterns for:
- Page meta, head
- Sidebar stepper
- Header bar
- Fullscreen/escape handling
- TTS phase watcher
- onMounted/onBeforeUnmount cleanup

Main content area is a CSS Grid with PFD on one side and 3D model on the other, with an instruction overlay at the bottom.

**Step 2: Commit**

```bash
git add app/pages/flightlab/medienstationen/learn-pfd.vue
git commit -m "feat(learn-pfd): add main learn-pfd page with dynamic layout and WebSocket input"
```

---

## Task 11: Integration Testing & Polish

**Step 1: Run dev server**

```bash
bun run dev
```

**Step 2: Manual testing checklist**

- [ ] Navigate to `/flightlab/medienstationen` — see index with learn-pfd card
- [ ] Click card → navigate to `/flightlab/medienstationen/learn-pfd`
- [ ] Page loads fullscreen-capable with black screen (phase 1)
- [ ] TTS speaks welcome message
- [ ] Click "Weiter" → horizon appears with animation
- [ ] Open a second tab, connect via WebSocket, send stick input → verify PFD reacts
- [ ] Progress through all phases — each element fades in
- [ ] Layout transitions smoothly between modes
- [ ] 3D model reflects pitch/roll changes
- [ ] Stepper sidebar shows progress
- [ ] Interaction goals auto-advance when met

**Step 3: Fix any issues found**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(learn-pfd): polish and integration fixes"
```

---

## Task Dependencies

```
Task 1 (deps)
  → Task 2 (types)
  → Task 3 (FBW) — independent of Task 2
  → Task 4 (WS) — depends on Task 2 for types
  → Task 5 (PFD components) — independent
  → Task 6 (3D model) — depends on Task 1 (Three.js)
  → Task 7 (scenario data) — depends on Task 2 (types)
  → Task 8 (engine) — depends on Task 2, Task 3
  → Task 9 (index page) — independent
  → Task 10 (main page) — depends on ALL above
  → Task 11 (testing) — depends on Task 10
```

**Parallelizable after Task 1+2:** Tasks 3, 4, 5, 6, 7, 9 can all be done in parallel.
