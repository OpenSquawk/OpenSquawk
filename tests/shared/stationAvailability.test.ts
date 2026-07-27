import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  offeredAirports,
  stationReachable,
  vhfRangeNm,
} from '~~/shared/utils/stationAvailability'

describe('vhfRangeNm', () => {
  it('grows with the square root of height, not linearly', () => {
    const low = vhfRangeNm(1000)
    const high = vhfRangeNm(4000)
    // Four times the height is about twice the range, never four times.
    assert.ok(high < low * 2.2, `${high} vs ${low}`)
    assert.ok(high > low * 1.7, `${high} vs ${low}`)
  })

  it('matches the textbook figures closely enough to trust', () => {
    // 1.23·√ft plus the ground antenna's own horizon.
    assert.ok(Math.abs(vhfRangeNm(1000) - 48) < 5, String(vhfRangeNm(1000)))
    assert.ok(Math.abs(vhfRangeNm(10_000) - 132) < 8, String(vhfRangeNm(10_000)))
    assert.ok(Math.abs(vhfRangeNm(35_000) - 239) < 12, String(vhfRangeNm(35_000)))
  })

  it('still gives a station some range on the ground', () => {
    assert.ok(vhfRangeNm(0) > 5)
  })

  it('treats rubbish as zero rather than NaN', () => {
    assert.ok(Number.isFinite(vhfRangeNm(NaN as unknown as number)))
    assert.ok(Number.isFinite(vhfRangeNm(-1000)))
  })
})

describe('stationReachable', () => {
  it('reaches a nearby station from the ground', () => {
    assert.equal(stationReachable({ distanceNm: 5, altitudeFt: 0 }), true)
  })

  it('does not reach a distant station from the ground', () => {
    assert.equal(stationReachable({ distanceNm: 150, altitudeFt: 0 }), false)
  })

  it('reaches the same station once high enough', () => {
    assert.equal(stationReachable({ distanceNm: 150, altitudeFt: 35_000 }), true)
  })

  // The no-bridge case, and the reason this defaults the way it does: a station
  // that cannot be proven out of range must stay usable, or someone flying
  // without a simulator loses their radio.
  it('treats an unknown position as reachable', () => {
    assert.equal(stationReachable({}), true)
    assert.equal(stationReachable({ altitudeFt: 3000 }), true)
    assert.equal(stationReachable({ distanceNm: 400 }), true)
  })
})

describe('offeredAirports', () => {
  const flight = { departureIcao: 'EDDF', destinationIcao: 'EDDM' }

  it('offers both airports of the flight', () => {
    const out = offeredAirports({ ...flight, phase: 'tower' })
    assert.deepEqual(out.map(a => a.icao), ['EDDF', 'EDDM'])
  })

  it('marks the departure primary while still on the ground there', () => {
    for (const phase of ['clearance', 'taxi', 'tower', 'departure']) {
      const out = offeredAirports({ ...flight, phase })
      assert.equal(out.find(a => a.role === 'departure')?.primary, true, phase)
      assert.equal(out.find(a => a.role === 'destination')?.primary, false, phase)
    }
  })

  it('marks the destination primary once the arrival is being flown', () => {
    for (const phase of ['enroute', 'approach', 'arrival']) {
      const out = offeredAirports({ ...flight, phase })
      assert.equal(out.find(a => a.role === 'destination')?.primary, true, phase)
      assert.equal(out.find(a => a.role === 'departure')?.primary, false, phase)
    }
  })

  it('falls back to the departure when the phase is unknown', () => {
    const out = offeredAirports(flight)
    assert.equal(out.find(a => a.role === 'departure')?.primary, true)
  })

  it('does not list the same airport twice on a circuit', () => {
    const out = offeredAirports({ departureIcao: 'EDDF', destinationIcao: 'EDDF', phase: 'tower' })
    assert.deepEqual(out.map(a => a.icao), ['EDDF'])
  })

  it('copes with only one airport known', () => {
    assert.deepEqual(offeredAirports({ departureIcao: 'EDDF' }).map(a => a.icao), ['EDDF'])
    assert.deepEqual(offeredAirports({ destinationIcao: 'EDDM' }).map(a => a.icao), ['EDDM'])
    assert.deepEqual(offeredAirports({}), [])
  })
})
