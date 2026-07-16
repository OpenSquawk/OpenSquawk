import { test } from 'node:test'
import assert from 'node:assert/strict'
import { angleDiffDeg, bearingDeg, destinationPoint, distanceNm, normalizeHeading } from '../../shared/utils/geo.ts'

test('normalizeHeading wraps into [0, 360)', () => {
  assert.equal(normalizeHeading(370), 10)
  assert.equal(normalizeHeading(-10), 350)
  assert.equal(normalizeHeading(0), 0)
})

test('angleDiffDeg returns the shortest signed turn', () => {
  assert.equal(angleDiffDeg(350, 10), 20)
  assert.equal(angleDiffDeg(10, 350), -20)
  assert.equal(Math.abs(angleDiffDeg(0, 180)), 180) // antipodal turn: sign is ambiguous
})

test('destinationPoint then distanceNm round-trips the requested distance', () => {
  const start = { lat: 50.04, lon: 8.57 }
  const dest = destinationPoint(start.lat, start.lon, 70, 10)
  const measured = distanceNm(start.lat, start.lon, dest.lat, dest.lon)
  assert.ok(Math.abs(measured - 10) < 0.01, `expected ~10nm, got ${measured}`)
})

test('bearingDeg from destinationPoint matches the requested bearing', () => {
  const start = { lat: 48.68, lon: 9.21 }
  const dest = destinationPoint(start.lat, start.lon, 145, 30)
  const measured = bearingDeg(start.lat, start.lon, dest.lat, dest.lon)
  assert.ok(Math.abs(angleDiffDeg(145, measured)) < 0.01, `expected ~145deg, got ${measured}`)
})

test('destinationPoint at bearing 0 moves north (lat increases, lon unchanged)', () => {
  const dest = destinationPoint(50, 8, 0, 60) // 60nm = ~1 degree latitude
  assert.ok(dest.lat > 50.9 && dest.lat < 51.1)
  assert.ok(Math.abs(dest.lon - 8) < 0.001)
})
