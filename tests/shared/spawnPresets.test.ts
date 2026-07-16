import { test } from 'node:test'
import assert from 'node:assert/strict'
import { distanceNm } from '../../shared/utils/geo.ts'
import { EDDF, EDDS, WEBSIM_SPAWN_PRESETS } from '../../shared/data/websim/spawnPresets.ts'

test('all four presets are present with unique ids', () => {
  assert.equal(WEBSIM_SPAWN_PRESETS.length, 4)
  assert.equal(new Set(WEBSIM_SPAWN_PRESETS.map((p) => p.id)).size, 4)
})

test('eddf-10nm-final is ~10nm from the runway threshold, aligned with the runway course', () => {
  const preset = WEBSIM_SPAWN_PRESETS.find((p) => p.id === 'eddf-10nm-final')!
  const runway = EDDF.runways[0]!
  const dist = distanceNm(preset.initialState.lat, preset.initialState.lon, runway.thresholdLat, runway.thresholdLon)
  assert.ok(Math.abs(dist - 10) < 0.1, `expected ~10nm, got ${dist}`)
  assert.equal(preset.initialState.heading_deg, runway.course_deg)
  assert.equal(preset.initialState.apMode, 'APPR_CAPTURED')
})

test('edds-30nm-star spawns at the STAR IAF, off the runway axis, heading toward the IF', () => {
  const preset = WEBSIM_SPAWN_PRESETS.find((p) => p.id === 'edds-30nm-star')!
  const iaf = EDDS.star[0]!
  const runway = EDDS.runways[0]!
  assert.equal(preset.initialState.lat, iaf.lat)
  assert.equal(preset.initialState.lon, iaf.lon)
  // Spawn heading must differ meaningfully from the runway's inbound course —
  // otherwise the STAR wouldn't actually require any turns.
  assert.ok(Math.abs(preset.initialState.heading_deg - runway.course_deg) > 10)
  assert.equal(preset.initialState.apMode, 'NAV')
})

test('EDDS STAR waypoints get closer to the threshold and descend in order', () => {
  const runway = EDDS.runways[0]!
  const distances = EDDS.star.map((wp) => distanceNm(wp.lat, wp.lon, runway.thresholdLat, runway.thresholdLon))
  for (let i = 1; i < distances.length; i++) {
    assert.ok(distances[i]! < distances[i - 1]!, 'each waypoint should be closer to the threshold than the last')
  }
  const altitudes = EDDS.star.map((wp) => wp.altitude_ft)
  for (let i = 1; i < altitudes.length; i++) {
    assert.ok(altitudes[i]! < altitudes[i - 1]!, 'each waypoint should be lower than the last')
  }
})

test('gate and runway presets are on the ground with sane systems state', () => {
  const gate = WEBSIM_SPAWN_PRESETS.find((p) => p.id === 'eddf-gate-cold-dark')!
  assert.equal(gate.initialState.on_ground, true)
  assert.equal(gate.initialState.engineState, 'OFF')
  assert.equal(gate.initialState.parkingBrake, true)

  const runway = WEBSIM_SPAWN_PRESETS.find((p) => p.id === 'eddf-runway-ready')!
  assert.equal(runway.initialState.on_ground, true)
  assert.equal(runway.initialState.engineState, 'RUNNING')
  assert.equal(runway.initialState.parkingBrake, false)
})
