import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeSimFreq,
  normalizeBridgeTelemetry,
  telemetrySignature,
} from '../../shared/utils/bridgeTelemetry.ts'

test('normalizeSimFreq formats a valid COM value to 3 decimals', () => {
  assert.equal(normalizeSimFreq(119.9), '119.900')
})

test('normalizeSimFreq rejects out-of-band values', () => {
  assert.equal(normalizeSimFreq(50), null)
  assert.equal(normalizeSimFreq('not-a-number'), null)
})

test('normalizeBridgeTelemetry maps SimConnect field names', () => {
  const result = normalizeBridgeTelemetry({
    PLANE_ALTITUDE: 3500,
    AIRSPEED_INDICATED: 140,
    GROUND_VELOCITY: 138,
    VERTICAL_SPEED: 800,
    PLANE_HEADING_DEGREES_TRUE: 270,
    SIM_ON_GROUND: false,
  })
  assert.deepEqual(result, {
    altitude_ft: 3500,
    ias_kts: 140,
    gs_kts: 138,
    vs_fpm: 800,
    heading_deg: 270,
    on_ground: false,
  })
})

test('normalizeBridgeTelemetry returns null for non-object input', () => {
  assert.equal(normalizeBridgeTelemetry(null), null)
})

test('normalizeBridgeTelemetry forwards the position', () => {
  const result = normalizeBridgeTelemetry({
    PLANE_ALTITUDE: 3500,
    PLANE_LATITUDE: 50.02671,
    PLANE_LONGITUDE: 8.55835,
  })
  assert.equal(result?.lat, 50.02671)
  assert.equal(result?.lon, 8.55835)
})

test('normalizeBridgeTelemetry drops the 0/0 no-GPS default position', () => {
  const result = normalizeBridgeTelemetry({
    PLANE_ALTITUDE: 3500,
    PLANE_LATITUDE: 0,
    PLANE_LONGITUDE: 0,
  })
  assert.equal(result?.lat, undefined)
  assert.equal(result?.lon, undefined)
})

test('telemetrySignature is stable under sub-threshold jitter', () => {
  const a = telemetrySignature({ altitude_ft: 3500, ias_kts: 140, on_ground: false })
  const b = telemetrySignature({ altitude_ft: 3540, ias_kts: 141, on_ground: false })
  assert.equal(a, b)
})

test('telemetrySignature changes on a meaningful altitude change', () => {
  const a = telemetrySignature({ altitude_ft: 3500, on_ground: false })
  const b = telemetrySignature({ altitude_ft: 4200, on_ground: false })
  assert.notEqual(a, b)
})

test('telemetrySignature changes as the aircraft moves (~0.6 nm)', () => {
  const a = telemetrySignature({ altitude_ft: 3500, lat: 50.0, lon: 8.0 })
  const b = telemetrySignature({ altitude_ft: 3500, lat: 50.02, lon: 8.0 })
  assert.notEqual(a, b)
})
