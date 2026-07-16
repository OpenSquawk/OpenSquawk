// shared/composables/flightlab/useWebSimFlightModel.ts
//
// Vue wrapper around shared/utils/webSimPhysics.ts: holds reactive state,
// drives it with a requestAnimationFrame loop, and exposes the actions the
// WebSim cockpit UI (sidestick, FCU, radio/systems panel) calls.
// docs/plans/2026-07-16-websim-design.md

import { onBeforeUnmount, reactive } from 'vue'
import { clamp, startEngines as pureStartEngines, stepWebSimPhysics, toBridgeTelemetryFields, type WebSimControlInput, type WebSimState } from '../../utils/webSimPhysics'
import { WEBSIM_AIRPORTS } from '../../data/websim/spawnPresets'
import type { WebSimApMode, WebSimSpawnPreset } from '../../data/websim/types'

function stateFromPreset(preset: WebSimSpawnPreset): WebSimState {
  const s = preset.initialState
  return {
    lat: s.lat,
    lon: s.lon,
    heading_deg: s.heading_deg,
    pitch_deg: 0,
    bank_deg: 0,
    altitude_ft: s.altitude_ft,
    ias_kts: s.ias_kts,
    gs_kts: s.ias_kts,
    vs_fpm: 0,
    aoa_deg: 2,
    on_ground: s.on_ground,
    engineState: s.engineState,
    n1_pct: s.engineState === 'RUNNING' ? 55 : 0,
    gearDown: s.gearDown,
    flapsIndex: s.flapsIndex,
    parkingBrake: s.parkingBrake,
    transponder_code: s.transponder_code,
    com_active: s.com_active,
    com_standby: s.com_standby,
    apMode: s.apMode,
    target_ias: s.target_ias,
    target_hdg: s.target_hdg,
    target_alt: s.target_alt,
    activeWaypointIndex: s.activeWaypointIndex,
    targetRunwayId: preset.runwayId,
  }
}

export function useWebSimFlightModel(initialPreset: WebSimSpawnPreset) {
  let currentIcao = initialPreset.icao
  const state = reactive<WebSimState>(stateFromPreset(initialPreset))
  const manualInput = reactive<WebSimControlInput>({ stickPitch: 0, stickRoll: 0, throttle: 0 })

  let smoothedPitchRate = 0
  let animFrame: number | null = null
  let lastTime: number | null = null
  let running = false

  function airport() {
    return WEBSIM_AIRPORTS[currentIcao]!
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

    const result = stepWebSimPhysics(state as WebSimState, manualInput, dt, airport(), smoothedPitchRate)
    Object.assign(state, result.state)
    smoothedPitchRate = result.smoothedPitchRate

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

  function spawn(preset: WebSimSpawnPreset) {
    currentIcao = preset.icao
    Object.assign(state, stateFromPreset(preset))
    smoothedPitchRate = 0
    lastTime = null
  }

  /** Partial state overwrite (e.g. a frequency-sim-control `setup_approach` reposition) — switches airport context too if `icao` is given. */
  function reposition(partial: Partial<WebSimState> & { icao?: string }) {
    const { icao, ...rest } = partial
    if (icao) currentIcao = icao
    Object.assign(state, rest)
    smoothedPitchRate = 0
    lastTime = null
  }

  // --- Manual controls (sidestick pad) ---
  function setStick(pitch: number, roll: number) {
    manualInput.stickPitch = clamp(pitch, -1, 1)
    manualInput.stickRoll = clamp(roll, -1, 1)
  }

  function setThrottle(value: number) {
    manualInput.throttle = clamp(value, 0, 1)
  }

  // --- FCU ---
  function setFcuTarget(target: { ias?: number; hdg?: number; alt?: number }) {
    if (target.ias !== undefined) state.target_ias = clamp(target.ias, 100, 350)
    if (target.hdg !== undefined) state.target_hdg = ((target.hdg % 360) + 360) % 360
    if (target.alt !== undefined) state.target_alt = clamp(target.alt, 0, 41000)
  }

  function pressAp() {
    state.apMode = state.apMode === 'OFF' ? 'SELECTED' : 'OFF'
  }

  function pressNav() {
    state.apMode = 'NAV'
  }

  function pressAppr() {
    state.apMode = 'APPR_ARMED'
  }

  function setApMode(mode: WebSimApMode) {
    state.apMode = mode
  }

  // --- Radio / systems panel ---
  function setCom(active?: number, standby?: number) {
    if (active !== undefined) state.com_active = active
    if (standby !== undefined) state.com_standby = standby
  }

  function swapCom() {
    const active = state.com_active
    state.com_active = state.com_standby
    state.com_standby = active
  }

  function setTransponder(code: number) {
    state.transponder_code = clamp(Math.round(code), 0, 7777)
  }

  function toggleGear() {
    state.gearDown = !state.gearDown
  }

  function setFlaps(index: number) {
    state.flapsIndex = clamp(Math.round(index), 0, 4)
  }

  function toggleParkingBrake() {
    state.parkingBrake = !state.parkingBrake
  }

  function startEngines() {
    Object.assign(state, pureStartEngines(state as WebSimState))
  }

  function bridgeTelemetryFields(): Record<string, unknown> {
    return toBridgeTelemetryFields(state as WebSimState)
  }

  onBeforeUnmount(() => stop())

  return {
    state,
    manualInput,
    start,
    stop,
    spawn,
    reposition,
    setStick,
    setThrottle,
    setFcuTarget,
    pressAp,
    pressNav,
    pressAppr,
    setApMode,
    setCom,
    swapCom,
    setTransponder,
    toggleGear,
    setFlaps,
    toggleParkingBrake,
    startEngines,
    bridgeTelemetryFields,
  }
}
