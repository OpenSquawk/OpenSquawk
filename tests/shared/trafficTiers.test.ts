import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_ACTIVE_TRAFFIC,
  resolveTrafficTier,
  targetTrafficCount,
  timeOfDayFactor,
  trafficTierFromFrequencies,
} from '~~/shared/data/trafficTiers'

describe('resolveTrafficTier', () => {
  it('prefers the curated map over the heuristic', () => {
    // EDDF publishes a full set of positions, but the curated answer wins either way.
    assert.equal(resolveTrafficTier('EDDF', ['TWR']), 'major')
    assert.equal(resolveTrafficTier('EDDH', ['DEL', 'GND', 'TWR', 'APP']), 'regional')
  })

  it('ignores casing and surrounding whitespace', () => {
    assert.equal(resolveTrafficTier(' eddm '), 'major')
  })

  it('falls back to the frequency heuristic for unknown airports', () => {
    assert.equal(resolveTrafficTier('ZZZZ', ['DEL', 'GND', 'TWR', 'APP']), 'major')
    assert.equal(resolveTrafficTier('ZZZZ', ['GND', 'TWR']), 'regional')
    assert.equal(resolveTrafficTier('ZZZZ', ['ATIS']), 'ga')
  })

  it('defaults to regional when nothing at all is known', () => {
    assert.equal(resolveTrafficTier(undefined), 'regional')
    assert.equal(resolveTrafficTier(null), 'regional')
    assert.equal(resolveTrafficTier(''), 'regional')
    assert.equal(resolveTrafficTier('ZZZZ', []), 'regional')
  })
})

describe('trafficTierFromFrequencies', () => {
  it('counts four distinct controller positions as major', () => {
    assert.equal(trafficTierFromFrequencies({ frequencyTypes: ['DEL', 'GND', 'TWR', 'DEP'] }), 'major')
  })

  it('does not count ATIS as a controller position', () => {
    assert.equal(trafficTierFromFrequencies({ frequencyTypes: ['ATIS', 'GND', 'TWR', 'CTR'] }), 'regional')
  })

  it('does not let duplicates inflate the count', () => {
    assert.equal(trafficTierFromFrequencies({ frequencyTypes: ['TWR', 'TWR', 'TWR', 'TWR'] }), 'regional')
  })

  it('treats a tower-only field as regional and a towerless one as ga', () => {
    assert.equal(trafficTierFromFrequencies({ frequencyTypes: ['TWR'] }), 'regional')
    assert.equal(trafficTierFromFrequencies({ frequencyTypes: ['ATIS'] }), 'ga')
    assert.equal(trafficTierFromFrequencies({ frequencyTypes: [] }), 'ga')
  })

  it('normalizes casing and junk entries', () => {
    assert.equal(trafficTierFromFrequencies({ frequencyTypes: [' del ', 'gnd', 'twr', 'app', ''] }), 'major')
  })
})

describe('timeOfDayFactor', () => {
  it('covers every hour of the day with a positive factor', () => {
    for (let h = 0; h < 24; h++) {
      assert.ok(timeOfDayFactor(h) > 0, `hour ${h} has no factor`)
    }
  })

  it('applies the design bands', () => {
    assert.equal(timeOfDayFactor(3), 0.2)   // night
    assert.equal(timeOfDayFactor(22), 0.2)
    assert.equal(timeOfDayFactor(5), 0.2)
    assert.equal(timeOfDayFactor(7), 1.3)   // morning bank
    assert.equal(timeOfDayFactor(12), 1.0)  // day
    assert.equal(timeOfDayFactor(18), 1.3)  // evening bank
    assert.equal(timeOfDayFactor(21), 0.6)  // winding down
  })

  it('truncates a fractional hour to its band', () => {
    assert.equal(timeOfDayFactor(21.9), 0.6)
    assert.equal(timeOfDayFactor(22.1), 0.2)
  })
})

describe('targetTrafficCount', () => {
  it('keeps a major airport busy during the banks and calm at night', () => {
    assert.equal(targetTrafficCount('major', 7), 5)   // 4 × 1.3 = 5.2 → 5
    assert.equal(targetTrafficCount('major', 12), 4)
    assert.equal(targetTrafficCount('major', 3), 1)   // 4 × 0.2 = 0.8 → 1
  })

  it('leaves a GA field dead at night', () => {
    assert.equal(targetTrafficCount('ga', 3), 0)      // 1 × 0.2 = 0.2 → 0
    assert.equal(targetTrafficCount('ga', 12), 1)
  })

  it('never exceeds the population cap that protects the speech queue', () => {
    for (const tier of ['major', 'regional', 'ga'] as const) {
      for (let h = 0; h < 24; h++) {
        const n = targetTrafficCount(tier, h)
        assert.ok(n >= 0 && n <= MAX_ACTIVE_TRAFFIC, `${tier}@${h} → ${n}`)
      }
    }
  })
})
