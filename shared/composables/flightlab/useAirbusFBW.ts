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
const MAX_PITCH_UP = 30
const MAX_PITCH_DOWN = -15
const MAX_BANK = 67
const BANK_NEUTRAL_LIMIT = 33
const MAX_ROLL_RATE = 15
const ROLL_RETURN_RATE = 5

const MAX_G_PULL = 2.5
const MIN_G_PUSH = -1.0
const NEUTRAL_G = 1.0
const PITCH_RATE_PER_G_DELTA = 3.5

const IDLE_THRUST = 2000
const MAX_THRUST = 50000
const DRAG_COEFFICIENT = 0.03
const MASS = 150000
const GRAVITY = 32.174
const KT_TO_FPS = 1.68781
const SPEED_PITCH_COUPLING = 0.5

const INITIAL_SPEED = 220
const INITIAL_ALTITUDE = 5000
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

    const dt = Math.min((timestamp - lastTime) / 1000, 0.1)
    lastTime = timestamp

    // --- Throttle ---
    state.throttlePercent = input.throttle * 100
    const thrust = IDLE_THRUST + input.throttle * (MAX_THRUST - IDLE_THRUST)

    // --- Roll (Normal Law: stick = roll rate command) ---
    const targetRollRate = input.roll * MAX_ROLL_RATE
    const isStickNeutral = Math.abs(input.roll) < 0.05

    if (isStickNeutral) {
      if (Math.abs(state.bankAngle) > BANK_NEUTRAL_LIMIT) {
        const returnDir = state.bankAngle > 0 ? -1 : 1
        state.bankAngle += returnDir * ROLL_RETURN_RATE * dt
        if (returnDir > 0 && state.bankAngle < -BANK_NEUTRAL_LIMIT) state.bankAngle = -BANK_NEUTRAL_LIMIT
        if (returnDir < 0 && state.bankAngle > BANK_NEUTRAL_LIMIT) state.bankAngle = BANK_NEUTRAL_LIMIT
      }
    } else {
      state.bankAngle += targetRollRate * dt
    }
    state.bankAngle = clamp(state.bankAngle, -MAX_BANK, MAX_BANK)

    // --- Pitch (Normal Law: stick = load factor command) ---
    const targetG = input.pitch > 0
      ? NEUTRAL_G + input.pitch * (MAX_G_PULL - NEUTRAL_G)
      : NEUTRAL_G + input.pitch * (NEUTRAL_G - MIN_G_PUSH)

    const speedFps = state.speed * KT_TO_FPS
    const currentG = speedFps > 50 ? 1 + (state.pitch * Math.PI / 180) * speedFps / GRAVITY * 0.01 : 1

    const gDelta = targetG - currentG
    const pitchRate = gDelta * PITCH_RATE_PER_G_DELTA
    state.pitch += pitchRate * dt
    state.pitch = clamp(state.pitch, MAX_PITCH_DOWN, MAX_PITCH_UP)

    // --- Speed ---
    const speedFps2 = state.speed * KT_TO_FPS
    const pitchRad = state.pitch * Math.PI / 180
    const drag = DRAG_COEFFICIENT * speedFps2 * speedFps2
    const climbPenalty = Math.sin(pitchRad) * MASS * GRAVITY * SPEED_PITCH_COUPLING
    const netForce = thrust - drag - climbPenalty
    const acceleration = netForce / MASS
    const speedDelta = (acceleration / KT_TO_FPS) * dt
    state.speed += speedDelta
    state.speed = clamp(state.speed, 80, 380)

    // --- Vertical Speed ---
    const bankFactor = Math.cos(state.bankAngle * Math.PI / 180)
    state.verticalSpeed = speedFps2 * Math.sin(state.pitch * Math.PI / 180) * 60 * bankFactor

    // --- Altitude ---
    state.altitude += (state.verticalSpeed / 60) * dt
    state.altitude = Math.max(0, state.altitude)
    state.onGround = state.altitude <= 0

    // --- Heading ---
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
