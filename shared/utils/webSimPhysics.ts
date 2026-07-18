// shared/utils/webSimPhysics.ts
//
// Pure (no Vue, no timers) physics/autopilot tick for the WebSim flight model
// (docs/plans/2026-07-16-websim-design.md). Kept side-effect free and
// independently importable so the tick math — the highest-risk part of the
// feature — is unit-testable without mounting a component or driving a
// requestAnimationFrame loop. shared/composables/flightlab/useWebSimFlightModel.ts
// wraps this in a reactive rAF loop for the page to consume.
//
// The airborne pitch/roll/speed integration follows the same normal-law
// approach as useAirbusFBW.ts (stick = load-factor/roll-rate command), with
// the constants re-derived here rather than imported since useAirbusFBW's
// tick() is a private closure, not an importable pure function.

import { angleDiffDeg, bearingDeg, destinationPoint, distanceNm, normalizeHeading } from './geo'
import type { WebSimAirport, WebSimApMode, WebSimEngineState, WebSimWaypoint } from '../data/websim/types'

export interface WebSimControlInput {
  /** -1 (full forward/push) to +1 (full back/pull). Ignored while the AP flies the pitch axis. */
  stickPitch: number
  /** -1 (full left) to +1 (full right). Ignored while the AP flies the roll axis. */
  stickRoll: number
  /** 0 (idle) to 1 (TOGA). Ignored while the AP/autothrust flies the speed target. */
  throttle: number
}

export interface WebSimState {
  lat: number
  lon: number
  heading_deg: number
  pitch_deg: number
  bank_deg: number
  altitude_ft: number
  ias_kts: number
  gs_kts: number
  vs_fpm: number
  aoa_deg: number

  on_ground: boolean
  engineState: WebSimEngineState
  n1_pct: number

  gearDown: boolean
  flapsIndex: number
  parkingBrake: boolean
  transponder_code: number
  com_active: number
  com_standby: number

  apMode: WebSimApMode
  target_ias: number
  target_hdg: number
  target_alt: number
  /** Index into `airport.star` of the waypoint currently being flown toward. */
  activeWaypointIndex: number
  /** Runway (within `airport.runways`) APPR/AUTOLAND capture against. */
  targetRunwayId: string
}

// --- Airborne normal-law constants (mirrors useAirbusFBW.ts) --------------
const MAX_PITCH_UP = 30
const MAX_PITCH_DOWN = -15
const MAX_BANK_MANUAL = 67
const MAX_BANK_AP = 25
const BANK_NEUTRAL_LIMIT = 33
const MAX_ROLL_RATE = 12
const ROLL_RETURN_RATE = 3
const MAX_G_PULL = 2.5
const MIN_G_PUSH = -1.0
const NEUTRAL_G = 1.0
const PITCH_RATE_PER_G_DELTA = 2.5
const PITCH_SMOOTH_TAU = 0.8
const IDLE_THRUST = 2000
const MAX_THRUST = 50000
const DRAG_COEFFICIENT = 0.03
const MASS = 150000
const GRAVITY = 32.174
const KT_TO_FPS = 1.68781
// Unlike useAirbusFBW.ts (pure manual flying, trim offset never bites), this
// model runs an altitude-hold autopilot for hundreds of ticks: the roll/pitch
// G-loop's neutral-stick equilibrium is pitch=0deg, so the climb/accel term
// below MUST treat 0deg as its level-flight reference too, or the AP settling
// on "pitch=0 to hold altitude" silently drifts off-trim and free-accelerates
// forever. Keep this at 0 (see docs/plans/2026-07-16-websim-design.md).
const SPEED_PITCH_COUPLING = 2.0
const MIN_SPEED = 80
const MAX_SPEED = 380

// --- Ground constants --------------------------------------------------
const GROUND_MAX_ACCEL_FPS2 = 6.5 // full throttle takeoff-roll acceleration
const GROUND_IDLE_DRAG_FPS2 = 3 // rolling resistance at idle thrust, brakes off
const GROUND_BRAKE_DECEL_FPS2 = 8 // parking-brake-set deceleration
const GROUND_MAX_TURN_RATE_DEG_S = 15 // nosewheel steering, at any taxi speed > 0
const ROTATE_SPEED_KTS = 140 // Vr — below this the aircraft stays glued to the runway
const INITIAL_CLIMB_PITCH_DEG = 8 // pitch attitude handed to stepAirborne at liftoff

// --- Engine start --------------------------------------------------------
const ENGINE_START_SECONDS = 15
const ENGINE_IDLE_N1_PCT = 55

// --- Autopilot gains -----------------------------------------------------
const AP_BANK_PER_DEG_ERROR = 1.5
const AP_ALT_FULL_DEFLECTION_FT = 1000
const AP_SPEED_GAIN_KTS = 40
const NAV_WAYPOINT_CAPTURE_NM = 1
const LOC_CAPTURE_ANGLE_DEG = 2.5
const LOC_MAX_RANGE_NM = 15
const GS_CAPTURE_ANGLE_DEG = 0.7
const GLIDE_ANGLE_DEG = 3
const NM_TO_FT = 6076.12
const AUTOLAND_ENGAGE_HEIGHT_FT = 200
const LOC_TRACK_GAIN = 1.5 // deg of heading correction per deg of localizer deviation

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

export function glideslopeAltitudeFt(runwayElevationFt: number, distanceNmToThreshold: number): number {
  return runwayElevationFt + distanceNmToThreshold * NM_TO_FT * Math.tan((GLIDE_ANGLE_DEG * Math.PI) / 180)
}

/** Signed lateral deviation (degrees) of the aircraft from the extended runway centerline, as seen from the threshold. */
export function localizerDeviationDeg(
  lat: number,
  lon: number,
  thresholdLat: number,
  thresholdLon: number,
  courseDeg: number,
): number {
  const bearingFromThreshold = bearingDeg(thresholdLat, thresholdLon, lat, lon)
  const extendedCenterline = normalizeHeading(courseDeg + 180)
  return angleDiffDeg(extendedCenterline, bearingFromThreshold)
}

export interface LocGsCaptureResult {
  captured: boolean
  distanceNm: number
  locDeviationDeg: number
  glideAltFt: number
  verticalDeviationFt: number
}

/** Whether the aircraft is currently inside the ILS capture cone for the given runway. */
export function checkIlsCapture(
  state: Pick<WebSimState, 'lat' | 'lon' | 'altitude_ft' | 'heading_deg'>,
  runway: { thresholdLat: number; thresholdLon: number; course_deg: number; elevation_ft: number },
): LocGsCaptureResult {
  const dist = distanceNm(state.lat, state.lon, runway.thresholdLat, runway.thresholdLon)
  const locDev = localizerDeviationDeg(state.lat, state.lon, runway.thresholdLat, runway.thresholdLon, runway.course_deg)
  const glideAlt = glideslopeAltitudeFt(runway.elevation_ft, dist)
  const verticalDev = state.altitude_ft - glideAlt
  const verticalToleranceFt = dist * NM_TO_FT * Math.tan((GS_CAPTURE_ANGLE_DEG * Math.PI) / 180)
  const headingTowardRunway = Math.abs(angleDiffDeg(state.heading_deg, runway.course_deg)) < 90

  const captured =
    dist <= LOC_MAX_RANGE_NM &&
    headingTowardRunway &&
    Math.abs(locDev) <= LOC_CAPTURE_ANGLE_DEG &&
    Math.abs(verticalDev) <= verticalToleranceFt

  return { captured, distanceNm: dist, locDeviationDeg: locDev, glideAltFt: glideAlt, verticalDeviationFt: verticalDev }
}

function findRunway(airport: WebSimAirport, runwayId: string) {
  return airport.runways.find((r) => r.id === runwayId) ?? airport.runways[0]!
}

/** SELECTED-mode-style target: hold whatever target_hdg/target_alt/target_ias are already dialed. Identity — kept for readability at call sites. */
function selectedTargets(state: WebSimState) {
  return { target_hdg: state.target_hdg, target_alt: state.target_alt }
}

/** NAV-mode target: bearing/altitude toward the active STAR waypoint, advancing the sequence when captured. */
export function navTargets(state: WebSimState, airport: WebSimAirport): {
  target_hdg: number
  target_alt: number
  activeWaypointIndex: number
  starExhausted: boolean
} {
  const waypoint: WebSimWaypoint | undefined = airport.star[state.activeWaypointIndex]
  if (!waypoint) {
    return { ...selectedTargets(state), activeWaypointIndex: state.activeWaypointIndex, starExhausted: true }
  }
  const dist = distanceNm(state.lat, state.lon, waypoint.lat, waypoint.lon)
  if (dist <= NAV_WAYPOINT_CAPTURE_NM) {
    const nextIndex = state.activeWaypointIndex + 1
    const nextWaypoint = airport.star[nextIndex]
    if (!nextWaypoint) {
      return { ...selectedTargets(state), activeWaypointIndex: state.activeWaypointIndex, starExhausted: true }
    }
    return {
      target_hdg: bearingDeg(state.lat, state.lon, nextWaypoint.lat, nextWaypoint.lon),
      target_alt: nextWaypoint.altitude_ft,
      activeWaypointIndex: nextIndex,
      starExhausted: false,
    }
  }
  return {
    target_hdg: bearingDeg(state.lat, state.lon, waypoint.lat, waypoint.lon),
    target_alt: waypoint.altitude_ft,
    activeWaypointIndex: state.activeWaypointIndex,
    starExhausted: false,
  }
}

/**
 * Cascaded AP controller: heading/altitude/speed error -> stick/throttle
 * command. Roll is a bank-hold inner loop (target bank proportional to
 * heading error) rather than a direct heading->roll-rate P term — the latter
 * is a double integrator (stick -> bank rate -> turn rate) with no damping
 * and oscillates forever instead of settling on the target heading.
 */
function rollCommandForHeading(state: WebSimState, targetHdg: number): number {
  const hdgError = angleDiffDeg(state.heading_deg, targetHdg)
  const targetBankDeg = clamp(hdgError * AP_BANK_PER_DEG_ERROR, -MAX_BANK_AP, MAX_BANK_AP)
  const bankError = targetBankDeg - state.bank_deg
  return clamp(bankError / MAX_BANK_AP, -1, 1)
}

function apControlInput(state: WebSimState, targetHdg: number, targetAlt: number): WebSimControlInput {
  const altError = targetAlt - state.altitude_ft
  const speedError = state.target_ias - state.ias_kts
  return {
    stickRoll: rollCommandForHeading(state, targetHdg),
    stickPitch: clamp(altError / AP_ALT_FULL_DEFLECTION_FT, -1, 1),
    throttle: clamp(0.5 + speedError / AP_SPEED_GAIN_KTS, 0, 1),
  }
}

interface ApStepResult {
  input: WebSimControlInput
  apMode: WebSimApMode
  target_hdg: number
  target_alt: number
  activeWaypointIndex: number
}

function stepAutopilot(state: WebSimState, airport: WebSimAirport): ApStepResult {
  const runway = findRunway(airport, state.targetRunwayId)

  if (state.apMode === 'OFF' || state.on_ground) {
    return { input: { stickPitch: 0, stickRoll: 0, throttle: 0 }, apMode: state.apMode, target_hdg: state.target_hdg, target_alt: state.target_alt, activeWaypointIndex: state.activeWaypointIndex }
  }

  if (state.apMode === 'SELECTED') {
    const targets = selectedTargets(state)
    return { input: apControlInput(state, targets.target_hdg, targets.target_alt), apMode: 'SELECTED', ...targets, activeWaypointIndex: state.activeWaypointIndex }
  }

  if (state.apMode === 'NAV') {
    const nav = navTargets(state, airport)
    // STAR exhausted -> hand off to an armed approach so capture keeps being checked.
    const nextMode: WebSimApMode = nav.starExhausted ? 'APPR_ARMED' : 'NAV'
    return { input: apControlInput(state, nav.target_hdg, nav.target_alt), apMode: nextMode, target_hdg: nav.target_hdg, target_alt: nav.target_alt, activeWaypointIndex: nav.activeWaypointIndex }
  }

  if (state.apMode === 'APPR_ARMED') {
    // Keep flying NAV (if waypoints remain) or SELECTED while watching for the capture cone.
    const stillOnStar = airport.star[state.activeWaypointIndex] !== undefined
    const nav = stillOnStar ? navTargets(state, airport) : { ...selectedTargets(state), activeWaypointIndex: state.activeWaypointIndex, starExhausted: true }
    const capture = checkIlsCapture(state, runway)
    if (capture.captured) {
      return { input: apControlInput(state, runway.course_deg, capture.glideAltFt), apMode: 'APPR_CAPTURED', target_hdg: runway.course_deg, target_alt: capture.glideAltFt, activeWaypointIndex: nav.activeWaypointIndex }
    }
    return { input: apControlInput(state, nav.target_hdg, nav.target_alt), apMode: 'APPR_ARMED', target_hdg: nav.target_hdg, target_alt: nav.target_alt, activeWaypointIndex: nav.activeWaypointIndex }
  }

  if (state.apMode === 'APPR_CAPTURED') {
    const capture = checkIlsCapture(state, runway)
    const trackedHdg = normalizeHeading(runway.course_deg - capture.locDeviationDeg * LOC_TRACK_GAIN)
    const heightAboveRunway = state.altitude_ft - runway.elevation_ft
    const nextMode: WebSimApMode = heightAboveRunway <= AUTOLAND_ENGAGE_HEIGHT_FT ? 'AUTOLAND' : 'APPR_CAPTURED'
    return { input: apControlInput(state, trackedHdg, capture.glideAltFt), apMode: nextMode, target_hdg: trackedHdg, target_alt: capture.glideAltFt, activeWaypointIndex: state.activeWaypointIndex }
  }

  // AUTOLAND: track localizer, flare the vertical path toward touchdown.
  const capture = checkIlsCapture(state, runway)
  const trackedHdg = normalizeHeading(runway.course_deg - capture.locDeviationDeg * LOC_TRACK_GAIN)
  const heightAboveRunway = Math.max(0, state.altitude_ft - runway.elevation_ft)
  const desiredVsFpm = -Math.max(150, heightAboveRunway * 3)
  const vsError = desiredVsFpm - state.vs_fpm
  const flarePitch = clamp(vsError / 2000, -1, 1)
  // Autothrottle retards to idle for the flare, same as a real approach — the
  // small proportional term only keeps a hair of thrust above bare idle.
  const flareThrottle = clamp(heightAboveRunway / AUTOLAND_ENGAGE_HEIGHT_FT, 0, 1) * 0.02
  return {
    input: { stickPitch: flarePitch, stickRoll: rollCommandForHeading(state, trackedHdg), throttle: flareThrottle },
    apMode: 'AUTOLAND',
    target_hdg: trackedHdg,
    target_alt: runway.elevation_ft,
    activeWaypointIndex: state.activeWaypointIndex,
  }
}

function stepGround(state: WebSimState, input: WebSimControlInput, dt: number): Partial<WebSimState> {
  const speedFps = state.gs_kts * KT_TO_FPS
  let accelFps2: number
  if (state.parkingBrake) {
    accelFps2 = -GROUND_BRAKE_DECEL_FPS2
  } else if (input.throttle > 0.05) {
    accelFps2 = input.throttle * GROUND_MAX_ACCEL_FPS2
  } else {
    accelFps2 = -GROUND_IDLE_DRAG_FPS2
  }
  const newSpeedFps = Math.max(0, speedFps + accelFps2 * dt)
  const newSpeedKts = newSpeedFps / KT_TO_FPS

  const turnRateDegS = newSpeedKts > 0.5 ? input.stickRoll * GROUND_MAX_TURN_RATE_DEG_S : 0
  const heading_deg = normalizeHeading(state.heading_deg + turnRateDegS * dt)
  const { lat, lon } = destinationPoint(state.lat, state.lon, heading_deg, (newSpeedKts / 3600) * dt)

  // Rotation: past Vr with the stick pulled — or the AP commanding a climb —
  // the wheels leave the ground and stepAirborne takes over next tick. Without
  // this the takeoff spawn preset could accelerate forever but never fly.
  const wantsLiftoff =
    input.stickPitch > 0.1
    || (state.apMode !== 'OFF' && state.target_alt > state.altitude_ft + 100)
  if (newSpeedKts >= ROTATE_SPEED_KTS && wantsLiftoff) {
    return {
      lat,
      lon,
      heading_deg,
      pitch_deg: INITIAL_CLIMB_PITCH_DEG,
      bank_deg: 0,
      ias_kts: newSpeedKts,
      gs_kts: newSpeedKts,
      vs_fpm: 0,
      on_ground: false,
    }
  }

  return {
    lat,
    lon,
    heading_deg,
    pitch_deg: 0,
    bank_deg: 0,
    ias_kts: newSpeedKts,
    gs_kts: newSpeedKts,
    vs_fpm: 0,
    on_ground: true,
  }
}

function stepAirborne(state: WebSimState, input: WebSimControlInput, dt: number, apEngaged: boolean, smoothedPitchRate: number): Partial<WebSimState> & { smoothedPitchRate: number } {
  const maxBank = apEngaged ? MAX_BANK_AP : MAX_BANK_MANUAL

  // --- Thrust ---
  const thrust = IDLE_THRUST + input.throttle * (MAX_THRUST - IDLE_THRUST)

  // --- Roll ---
  const targetRollRate = input.stickRoll * MAX_ROLL_RATE
  const isStickNeutral = Math.abs(input.stickRoll) < 0.05
  let bank_deg = state.bank_deg
  if (isStickNeutral) {
    if (Math.abs(bank_deg) > BANK_NEUTRAL_LIMIT) {
      const returnDir = bank_deg > 0 ? -1 : 1
      bank_deg += returnDir * ROLL_RETURN_RATE * dt
    }
  } else {
    bank_deg += targetRollRate * dt
  }
  bank_deg = clamp(bank_deg, -maxBank, maxBank)

  // --- Pitch (load-factor command) ---
  const targetG = input.stickPitch > 0 ? NEUTRAL_G + input.stickPitch * (MAX_G_PULL - NEUTRAL_G) : NEUTRAL_G + input.stickPitch * (NEUTRAL_G - MIN_G_PUSH)
  const speedFps = state.ias_kts * KT_TO_FPS
  const currentG = speedFps > 50 ? 1 + ((state.pitch_deg * Math.PI) / 180) * (speedFps / GRAVITY) * 0.01 : 1
  const gDelta = targetG - currentG
  const rawPitchRate = gDelta * PITCH_RATE_PER_G_DELTA
  const alpha = 1 - Math.exp(-dt / PITCH_SMOOTH_TAU)
  const newSmoothedPitchRate = smoothedPitchRate + (rawPitchRate - smoothedPitchRate) * alpha
  let pitch_deg = state.pitch_deg + newSmoothedPitchRate * dt
  pitch_deg = clamp(pitch_deg, MAX_PITCH_DOWN, MAX_PITCH_UP)

  // --- Speed ---
  const trimmedPitchRad = (pitch_deg * Math.PI) / 180
  const drag = DRAG_COEFFICIENT * speedFps * speedFps
  const climbPenalty = Math.sin(trimmedPitchRad) * MASS * GRAVITY * SPEED_PITCH_COUPLING
  const netForce = thrust - drag - climbPenalty
  const acceleration = netForce / MASS
  let ias_kts = state.ias_kts + (acceleration / KT_TO_FPS) * dt
  ias_kts = clamp(ias_kts, MIN_SPEED, MAX_SPEED)

  // --- Vertical speed & altitude ---
  const speedFps2 = ias_kts * KT_TO_FPS
  const bankFactor = Math.cos((bank_deg * Math.PI) / 180)
  const vs_fpm = speedFps2 * Math.sin((pitch_deg * Math.PI) / 180) * 60 * bankFactor
  const altitude_ft = Math.max(0, state.altitude_ft + (vs_fpm / 60) * dt)

  // --- Heading & position ---
  let heading_deg = state.heading_deg
  if (speedFps2 > 50) {
    const turnRate = (GRAVITY * Math.tan((bank_deg * Math.PI) / 180)) / speedFps2
    heading_deg = normalizeHeading(state.heading_deg + turnRate * (180 / Math.PI) * dt)
  }
  const { lat, lon } = destinationPoint(state.lat, state.lon, heading_deg, (ias_kts / 3600) * dt)

  const aoa_deg = pitch_deg - (vs_fpm > 0 ? 1 : -1) * Math.min(Math.abs(vs_fpm) / 500, 5)

  return {
    lat,
    lon,
    heading_deg,
    pitch_deg,
    bank_deg,
    ias_kts,
    gs_kts: ias_kts,
    vs_fpm,
    altitude_ft,
    aoa_deg,
    on_ground: altitude_ft <= 0,
    smoothedPitchRate: newSmoothedPitchRate,
  }
}

export interface WebSimTickResult {
  state: WebSimState
  smoothedPitchRate: number
}

/**
 * Advance the WebSim flight model by `dt` seconds. Pure — takes the previous
 * state + smoothing accumulator, returns the next ones. `manualInput` is
 * used verbatim on the ground and whenever the autopilot is off; it's
 * ignored (autopilot-computed input substituted) in every other AP mode.
 */
export function stepWebSimPhysics(
  state: WebSimState,
  manualInput: WebSimControlInput,
  dt: number,
  airport: WebSimAirport,
  smoothedPitchRate: number,
): WebSimTickResult {
  const enginesOff = state.engineState === 'OFF'

  const ap = stepAutopilot(state, airport)
  const effectiveInput = state.apMode === 'OFF' || state.on_ground ? manualInput : ap.input
  const gatedInput: WebSimControlInput = enginesOff ? { ...effectiveInput, throttle: 0 } : effectiveInput

  // --- Engine start ramp --- (N1 follows the throttle actually applied this tick, AP or manual)
  let engineState = state.engineState
  let n1_pct = state.n1_pct
  if (engineState === 'STARTING') {
    n1_pct = Math.min(ENGINE_IDLE_N1_PCT, n1_pct + (dt / ENGINE_START_SECONDS) * ENGINE_IDLE_N1_PCT)
    if (n1_pct >= ENGINE_IDLE_N1_PCT) engineState = 'RUNNING'
  } else if (engineState === 'RUNNING') {
    n1_pct = clamp(30 + gatedInput.throttle * 70, 30, 100)
  } else {
    n1_pct = 0
  }

  const motion = state.on_ground
    ? { ...stepGround(state, gatedInput, dt), smoothedPitchRate: 0 }
    : stepAirborne(state, gatedInput, dt, state.apMode !== 'OFF', smoothedPitchRate)

  const nextState: WebSimState = {
    ...state,
    ...motion,
    engineState,
    n1_pct,
    apMode: state.on_ground ? state.apMode : ap.apMode,
    target_hdg: state.on_ground ? state.target_hdg : ap.target_hdg,
    target_alt: state.on_ground ? state.target_alt : ap.target_alt,
    activeWaypointIndex: ap.activeWaypointIndex,
  } as WebSimState

  return { state: nextState, smoothedPitchRate: motion.smoothedPitchRate }
}

export function startEngines(state: WebSimState): WebSimState {
  if (!state.on_ground || state.engineState !== 'OFF') return state
  return { ...state, engineState: 'STARTING' }
}

/**
 * Maps WebSim state to the raw SimConnect-style field names a real bridge
 * posts to `POST /api/bridge/data` — must match `mapBridgeTelemetry()` in
 * server/api/bridge/data.post.ts exactly (that function reads these lowercase
 * snake_case keys). Kept here, next to the state it derives from, as the
 * single source of truth for the WebSim's half of that contract.
 */
export function toBridgeTelemetryFields(state: WebSimState): Record<string, unknown> {
  return {
    ias_kt: state.ias_kts,
    groundspeed_kt: state.gs_kts,
    vertical_speed_fpm: state.vs_fpm,
    altitude_ft_indicated: state.altitude_ft,
    pitch_deg: state.pitch_deg,
    n1_pct: state.n1_pct,
    n1_pct_2: state.n1_pct,
    eng_on: state.engineState === 'RUNNING',
    on_ground: state.on_ground,
    gear_handle: state.gearDown,
    flaps_index: state.flapsIndex,
    parking_brake: state.parkingBrake,
    autopilot_master: state.apMode !== 'OFF',
    transponder_code: state.transponder_code,
    com_active_frequency: state.com_active,
    com_standby_frequency: state.com_standby,
    latitude_deg: state.lat,
    longitude_deg: state.lon,
    heading_deg: state.heading_deg,
  }
}
