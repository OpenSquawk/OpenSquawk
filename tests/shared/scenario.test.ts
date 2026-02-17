import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  altitudeToWords,
  createBaseScenario,
  createScenarioSeries,
  minutesToWords,
  runwayToWords,
} from '~~/shared/learn/scenario'

describe('scenario helpers', () => {
  it('formats runway, minutes and altitude values', () => {
    assert.equal(runwayToWords('25R'), 'two fife right')
    assert.equal(minutesToWords(0), 'one minute')
    assert.equal(minutesToWords(4.4), 'four minutes')
    assert.equal(altitudeToWords(4500), 'four thousand fife zero zero')
  })

  it('creates a base scenario with critical data fields', () => {
    const scenario = createBaseScenario()

    assert.match(scenario.callsign, /^[A-Z]{3}\d{3,4}$/)
    assert.equal(scenario.metar.startsWith(`${scenario.airport.icao} `), true)
    assert.equal(scenario.frequencies.length > 0, true)
    assert.equal(typeof scenario.handoff.frequencyWords, 'string')
    assert.equal(scenario.handoff.frequencyWords.length > 0, true)
  })
})

describe('createScenarioSeries', () => {
  it('returns cloned cached data and isolates mutations', () => {
    let sourceCalls = 0
    const series = createScenarioSeries(() => {
      sourceCalls += 1
      return {
        callsign: `SRC${sourceCalls}`,
        nested: { value: 1 },
      } as any
    })

    const first = series()
    const second = series()

    assert.equal(sourceCalls, 1)
    assert.notStrictEqual(first, second)
    assert.deepEqual(first, second)

    first.nested.value = 99
    const third = series()
    assert.equal(third.nested.value, 1)
  })

  it('supports override scenarios and reset', () => {
    const series = createScenarioSeries(() => ({ callsign: 'SRC1', nested: { value: 1 } } as any))

    series.setScenario({ callsign: 'OVR1', nested: { value: 2 } } as any)
    const fromOverride = series()
    assert.equal(fromOverride.callsign, 'OVR1')

    fromOverride.nested.value = 999
    assert.equal(series().nested.value, 2)

    series.setScenario(null)
    series.reset()
    assert.equal(series().callsign, 'SRC1')
  })
})
