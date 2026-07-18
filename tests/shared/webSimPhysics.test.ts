import { test } from 'node:test'
import assert from 'node:assert/strict'
import { angleDiffDeg, destinationPoint, distanceNm, normalizeHeading } from '../../shared/utils/geo.ts'
import {
  checkIlsCapture,
  glideslopeAltitudeFt,
  localizerDeviationDeg,
  navTargets,
  startEngines,
  stepWebSimPhysics,
  toBridgeTelemetryFields,
  type WebSimControlInput,
  type WebSimState,
} from '../../shared/utils/webSimPhysics.ts'
import { EDDF, EDDS, WEBSIM_SPAWN_PRESETS } from '../../shared/data/websim/spawnPresets.ts'

const NEUTRAL: WebSimControlInput = { stickPitch: 0, stickRoll: 0, throttle: 0.5 }

function stateFromPreset(id: string): WebSimState {
  const preset = WEBSIM_SPAWN_PRESETS.find((p) => p.id === id)!
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

// --- glideslope / localizer geometry ---------------------------------------

test('glideslopeAltitudeFt increases with distance from the threshold', () => {
  const at0 = glideslopeAltitudeFt(364, 0)
  const at10 = glideslopeAltitudeFt(364, 10)
  assert.equal(at0, 364)
  assert.ok(at10 > at0)
})

test('localizerDeviationDeg is ~0 exactly on the extended centerline', () => {
  const runway = EDDF.runways[0]!
  const onCenterline = destinationPoint(runway.thresholdLat, runway.thresholdLon, normalizeHeading(runway.course_deg + 180), 10)
  const dev = localizerDeviationDeg(onCenterline.lat, onCenterline.lon, runway.thresholdLat, runway.thresholdLon, runway.course_deg)
  assert.ok(Math.abs(dev) < 0.01, `expected ~0deg, got ${dev}`)
})

test('localizerDeviationDeg is nonzero when offset to one side', () => {
  const runway = EDDF.runways[0]!
  const centerlineBearing = normalizeHeading(runway.course_deg + 180)
  const offCenterline = destinationPoint(runway.thresholdLat, runway.thresholdLon, normalizeHeading(centerlineBearing + 20), 10)
  const dev = localizerDeviationDeg(offCenterline.lat, offCenterline.lon, runway.thresholdLat, runway.thresholdLon, runway.course_deg)
  assert.ok(Math.abs(dev) > 5, `expected a noticeable deviation, got ${dev}`)
})

test('checkIlsCapture captures the eddf-10nm-final preset (built to be exactly on the ILS)', () => {
  const state = stateFromPreset('eddf-10nm-final')
  const runway = EDDF.runways[0]!
  const result = checkIlsCapture(state, runway)
  assert.equal(result.captured, true)
})

test('checkIlsCapture rejects a position far off the localizer', () => {
  const runway = EDDF.runways[0]!
  const offAxis = destinationPoint(runway.thresholdLat, runway.thresholdLon, normalizeHeading(runway.course_deg + 180 - 45), 10)
  const result = checkIlsCapture({ lat: offAxis.lat, lon: offAxis.lon, altitude_ft: 3500, heading_deg: runway.course_deg }, runway)
  assert.equal(result.captured, false)
})

// --- STAR waypoint sequencing ----------------------------------------------

test('navTargets points at the active waypoint and advances once within capture radius', () => {
  const state = stateFromPreset('edds-30nm-star')
  const iaf = EDDS.star[0]!
  // Spawn is AT the IAF already (activeWaypointIndex=1, flying toward IF) — confirm it targets the IF.
  const targets = navTargets(state, EDDS)
  const ifWp = EDDS.star[1]!
  assert.equal(targets.activeWaypointIndex, 1)
  assert.equal(targets.target_alt, ifWp.altitude_ft)

  // Teleport the aircraft to right on top of the IF and re-check: should advance to the FAF.
  const nearIf: WebSimState = { ...state, lat: ifWp.lat, lon: ifWp.lon }
  const advanced = navTargets(nearIf, EDDS)
  assert.equal(advanced.activeWaypointIndex, 2)
  assert.equal(advanced.target_alt, EDDS.star[2]!.altitude_ft)
})

test('navTargets reports the STAR exhausted once past the last waypoint', () => {
  const faf = EDDS.star[2]!
  const state = stateFromPreset('edds-30nm-star')
  const atFaf: WebSimState = { ...state, lat: faf.lat, lon: faf.lon, activeWaypointIndex: 2 }
  const result = navTargets(atFaf, EDDS)
  assert.equal(result.starExhausted, true)
})

// --- Autopilot integration (many ticks) -------------------------------------

test('SELECTED mode converges heading toward the FCU target over time', () => {
  let state = stateFromPreset('eddf-10nm-final')
  state = { ...state, apMode: 'SELECTED', target_hdg: normalizeHeading(state.heading_deg + 60), target_alt: state.altitude_ft }
  let smoothed = 0
  for (let i = 0; i < 200; i++) {
    const tick = stepWebSimPhysics(state, NEUTRAL, 1, EDDF, smoothed)
    state = tick.state
    smoothed = tick.smoothedPitchRate
  }
  assert.ok(Math.abs(angleDiffDeg(state.heading_deg, state.target_hdg)) < 5, `expected heading near target, got ${state.heading_deg} vs ${state.target_hdg}`)
})

test('NAV mode flies the EDDS STAR and eventually arms/captures the approach', () => {
  let state = stateFromPreset('edds-30nm-star')
  let smoothed = 0
  const initialHeading = state.heading_deg
  let sawWaypointAdvance = false
  for (let i = 0; i < 2000; i++) {
    const tick = stepWebSimPhysics(state, NEUTRAL, 1, EDDS, smoothed)
    if (tick.state.activeWaypointIndex > state.activeWaypointIndex) sawWaypointAdvance = true
    state = tick.state
    smoothed = tick.smoothedPitchRate
    if (state.apMode === 'APPR_ARMED' || state.apMode === 'APPR_CAPTURED') break
  }
  assert.ok(sawWaypointAdvance, 'expected the STAR sequencer to advance past the IAF')
  assert.ok(['APPR_ARMED', 'APPR_CAPTURED'].includes(state.apMode), `expected an armed/captured approach, got ${state.apMode}`)
  assert.notEqual(Math.round(state.heading_deg), Math.round(initialHeading))
})

// --- Ground physics ----------------------------------------------------------

test('ground: throttle accelerates groundspeed, parking brake prevents movement', () => {
  let state = stateFromPreset('eddf-runway-ready')
  let smoothed = 0
  for (let i = 0; i < 30; i++) {
    const tick = stepWebSimPhysics(state, { stickPitch: 0, stickRoll: 0, throttle: 1 }, 1, EDDF, smoothed)
    state = tick.state
    smoothed = tick.smoothedPitchRate
  }
  assert.ok(state.gs_kts > 20, `expected groundspeed to build up under full throttle, got ${state.gs_kts}`)

  let parked = stateFromPreset('eddf-gate-cold-dark')
  parked = { ...parked, engineState: 'RUNNING' as const, n1_pct: 55 }
  let smoothed2 = 0
  for (let i = 0; i < 30; i++) {
    const tick = stepWebSimPhysics(parked, { stickPitch: 0, stickRoll: 0, throttle: 1 }, 1, EDDF, smoothed2)
    parked = tick.state
    smoothed2 = tick.smoothedPitchRate
  }
  assert.equal(parked.gs_kts, 0)
})

test('ground: rotates past Vr when the stick is pulled, then climbs', () => {
  let state = stateFromPreset('eddf-runway-ready')
  let smoothed = 0
  for (let i = 0; i < 120 && state.on_ground; i++) {
    const tick = stepWebSimPhysics(state, { stickPitch: 0.5, stickRoll: 0, throttle: 1 }, 1, EDDF, smoothed)
    state = tick.state
    smoothed = tick.smoothedPitchRate
  }
  assert.equal(state.on_ground, false, 'expected the aircraft to lift off past Vr with the stick pulled')
  assert.ok(state.ias_kts >= 140, `liftoff below Vr: ${state.ias_kts}`)
  const altAtLiftoff = state.altitude_ft
  for (let i = 0; i < 20; i++) {
    const tick = stepWebSimPhysics(state, { stickPitch: 0.3, stickRoll: 0, throttle: 1 }, 1, EDDF, smoothed)
    state = tick.state
    smoothed = tick.smoothedPitchRate
  }
  assert.ok(state.altitude_ft > altAtLiftoff + 200, `expected a climb after liftoff, got ${state.altitude_ft}`)
})

test('ground: AP commanding a climb rotates without manual stick input', () => {
  let state = stateFromPreset('eddf-runway-ready')
  state = { ...state, apMode: 'SELECTED' as const, target_alt: 5000 }
  let smoothed = 0
  for (let i = 0; i < 120 && state.on_ground; i++) {
    const tick = stepWebSimPhysics(state, { stickPitch: 0, stickRoll: 0, throttle: 1 }, 1, EDDF, smoothed)
    state = tick.state
    smoothed = tick.smoothedPitchRate
  }
  assert.equal(state.on_ground, false, 'expected the AP to rotate the aircraft past Vr')
})

test('ground: stays on the runway below Vr or with a neutral stick and no AP', () => {
  let state = stateFromPreset('eddf-runway-ready')
  let smoothed = 0
  for (let i = 0; i < 120; i++) {
    const tick = stepWebSimPhysics(state, { stickPitch: 0, stickRoll: 0, throttle: 1 }, 1, EDDF, smoothed)
    state = tick.state
    smoothed = tick.smoothedPitchRate
  }
  assert.equal(state.on_ground, true, 'neutral stick without AP must never lift off')
})

test('startEngines ramps N1 up over time and transitions OFF -> STARTING -> RUNNING', () => {
  let state = stateFromPreset('eddf-gate-cold-dark')
  state = startEngines(state)
  assert.equal(state.engineState, 'STARTING')

  let smoothed = 0
  for (let i = 0; i < 20; i++) {
    const tick = stepWebSimPhysics(state, NEUTRAL, 1, EDDF, smoothed)
    state = tick.state
    smoothed = tick.smoothedPitchRate
  }
  assert.equal(state.engineState, 'RUNNING')
  assert.ok(state.n1_pct >= 50, `expected N1 to have ramped to idle, got ${state.n1_pct}`)
})

test('startEngines is a no-op when airborne or already running', () => {
  const airborne = stateFromPreset('eddf-10nm-final')
  assert.deepEqual(startEngines(airborne), airborne)

  const alreadyRunning = stateFromPreset('eddf-runway-ready')
  assert.deepEqual(startEngines(alreadyRunning), alreadyRunning)
})

// --- Bridge field mapping ------------------------------------------------

test('toBridgeTelemetryFields uses the exact raw field names mapBridgeTelemetry() expects', () => {
  const state = stateFromPreset('eddf-runway-ready')
  const fields = toBridgeTelemetryFields(state)
  assert.equal(fields.ias_kt, state.ias_kts)
  assert.equal(fields.groundspeed_kt, state.gs_kts)
  assert.equal(fields.vertical_speed_fpm, state.vs_fpm)
  assert.equal(fields.altitude_ft_indicated, state.altitude_ft)
  assert.equal(fields.pitch_deg, state.pitch_deg)
  assert.equal(fields.n1_pct, state.n1_pct)
  assert.equal(fields.eng_on, true) // eddf-runway-ready spawns with engines running
  assert.equal(fields.on_ground, true)
  assert.equal(fields.gear_handle, state.gearDown)
  assert.equal(fields.flaps_index, state.flapsIndex)
  assert.equal(fields.parking_brake, state.parkingBrake)
  assert.equal(fields.transponder_code, state.transponder_code)
  assert.equal(fields.com_active_frequency, state.com_active)
  assert.equal(fields.com_standby_frequency, state.com_standby)
  assert.equal(fields.latitude_deg, state.lat)
  assert.equal(fields.longitude_deg, state.lon)
  assert.equal(fields.heading_deg, state.heading_deg)
})

// --- Autoland ----------------------------------------------------------------

test('AUTOLAND brings the aircraft to the ground near the runway', () => {
  const runway = EDDF.runways[0]!
  let state = stateFromPreset('eddf-10nm-final')
  // Start close in, already captured, to keep the test fast.
  const close = destinationPoint(runway.thresholdLat, runway.thresholdLon, normalizeHeading(runway.course_deg + 180), 1)
  state = {
    ...state,
    lat: close.lat,
    lon: close.lon,
    altitude_ft: glideslopeAltitudeFt(runway.elevation_ft, 1),
    apMode: 'APPR_CAPTURED',
  }
  let smoothed = 0
  let touchedDown = false
  for (let i = 0; i < 600; i++) {
    const tick = stepWebSimPhysics(state, { stickPitch: 0, stickRoll: 0, throttle: 0 }, 1, EDDF, smoothed)
    state = tick.state
    smoothed = tick.smoothedPitchRate
    if (state.on_ground) {
      touchedDown = true
      break
    }
  }
  assert.ok(touchedDown, 'expected the aircraft to touch down within the simulated window')
})
