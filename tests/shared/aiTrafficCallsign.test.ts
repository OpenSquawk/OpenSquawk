import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createRng, trafficSeed } from '~~/shared/utils/aiTraffic/rng'
import {
  TRAFFIC_AIRLINES,
  VFR_REGISTRATION_POOL,
  callsignPrefix,
  callsignTail,
  createCallsignFactory,
  isCallsignDistinct,
  levenshtein,
  spokenCallsign,
} from '~~/shared/utils/aiTraffic/callsign'
import { findSimAircraftType } from '~~/shared/data/simAircraftTypes'

describe('seeded rng', () => {
  it('replays identically for the same seed', () => {
    const a = createRng('seed-1')
    const b = createRng('seed-1')
    for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next())
  })

  it('diverges for different seeds', () => {
    const a = createRng('seed-1')
    const b = createRng('seed-2')
    const left = Array.from({ length: 20 }, () => a.next())
    const right = Array.from({ length: 20 }, () => b.next())
    assert.notDeepEqual(left, right)
  })

  it('stays inside its declared ranges', () => {
    const rng = createRng('ranges')
    for (let i = 0; i < 500; i++) {
      const u = rng.next()
      assert.ok(u >= 0 && u < 1)
      const n = rng.int(3, 7)
      assert.ok(Number.isInteger(n) && n >= 3 && n <= 7)
      const f = rng.float(1, 2)
      assert.ok(f >= 1 && f < 2)
    }
  })

  it('hits both ends of an int range', () => {
    const rng = createRng('ends')
    const seen = new Set<number>()
    for (let i = 0; i < 200; i++) seen.add(rng.int(0, 1))
    assert.deepEqual([...seen].sort(), [0, 1])
  })

  it('respects weights', () => {
    const rng = createRng('weights')
    let heavy = 0
    for (let i = 0; i < 1000; i++) {
      if (rng.weighted([{ value: 'a', weight: 90 }, { value: 'b', weight: 10 }]) === 'a') heavy++
    }
    assert.ok(heavy > 850 && heavy < 950, `expected ~900 'a', got ${heavy}`)
  })

  it('never returns a zero-weight option', () => {
    const rng = createRng('zero-weight')
    for (let i = 0; i < 100; i++) {
      assert.equal(rng.weighted([{ value: 'a', weight: 1 }, { value: 'b', weight: 0 }]), 'a')
    }
  })

  it('rejects degenerate inputs instead of returning undefined', () => {
    const rng = createRng('degenerate')
    assert.throws(() => rng.pick([]), /empty list/)
    assert.throws(() => rng.weighted([]), /no positive weights/)
    assert.throws(() => rng.weighted([{ value: 'a', weight: 0 }]), /no positive weights/)
  })

  it('does not degenerate when the seed hashes to zero', () => {
    const rng = createRng(0)
    const values = Array.from({ length: 10 }, () => rng.next())
    assert.equal(new Set(values).size, 10)
  })

  it('derives a per-session, per-day seed', () => {
    const day = new Date(2026, 6, 16)
    assert.equal(trafficSeed('abc', day), 'abc|2026-7-16')
    assert.notEqual(trafficSeed('abc', day), trafficSeed('abc', new Date(2026, 6, 17)))
    assert.notEqual(trafficSeed('abc', day), trafficSeed('abd', day))
  })
})

describe('callsign decomposition', () => {
  it('splits airline callsigns into designator and tail', () => {
    assert.equal(callsignPrefix('DLH472'), 'DLH')
    assert.equal(callsignTail('DLH472'), '472')
    assert.equal(callsignPrefix('EZY93A'), 'EZY')
    assert.equal(callsignTail('EZY93A'), '93A')
  })

  it('treats registrations as prefix-less', () => {
    assert.equal(callsignPrefix('D-EMIL'), '')
    assert.equal(callsignTail('D-EMIL'), 'EMIL')
    assert.equal(callsignPrefix('N123AB'), '')
    assert.equal(callsignTail('N123AB'), '123AB')
  })
})

describe('levenshtein', () => {
  it('measures the edits between spoken tails', () => {
    assert.equal(levenshtein('39A', '39A'), 0)
    assert.equal(levenshtein('39A', '39B'), 1)
    assert.equal(levenshtein('39A', '47B'), 3)
    assert.equal(levenshtein('', '472'), 3)
    assert.equal(levenshtein('472', ''), 3)
  })
})

describe('isCallsignDistinct — the three collision rules', () => {
  it('rule 1: rejects the user callsign verbatim', () => {
    assert.equal(isCallsignDistinct('DLH39A', ['DLH39A']), false)
  })

  it('rule 1: ignores casing and hyphens when comparing', () => {
    assert.equal(isCallsignDistinct('d-emil', ['D-EMIL']), false)
  })

  it('rule 2: rejects any aircraft from the user airline', () => {
    assert.equal(isCallsignDistinct('DLH8172', ['DLH39A']), false)
  })

  it('rule 3: rejects a confusable tail across airlines', () => {
    // BAW39A vs DLH39A — different airline, identical spoken number.
    assert.equal(isCallsignDistinct('BAW39A', ['DLH39A']), false)
    // One digit apart is still one mishearing away.
    assert.equal(isCallsignDistinct('BAW39B', ['DLH39A']), false)
  })

  it('rule 3: accepts a tail that differs in two positions', () => {
    assert.equal(isCallsignDistinct('BAW47B', ['DLH39A']), true)
  })

  it('rule 3: guards VFR registrations too', () => {
    assert.equal(isCallsignDistinct('D-EMIT', ['D-EMIL']), false)
    assert.equal(isCallsignDistinct('D-EKLM', ['D-EMIL']), true)
  })

  it('rejects an empty candidate', () => {
    assert.equal(isCallsignDistinct('', ['DLH39A']), false)
  })

  it('accepts anything when nothing is blocked', () => {
    assert.equal(isCallsignDistinct('DLH472', []), true)
  })
})

describe('spokenCallsign', () => {
  it('renders the airline telephony name and per-digit number', () => {
    // Digits come out in the product's ICAO spelling ("too", "tree", "niner").
    const spoken = spokenCallsign('DLH472', findSimAircraftType('A320')!)
    assert.match(spoken, /^Lufthansa four seven too$/i)
  })

  it('appends heavy for a widebody and super for the A380', () => {
    assert.match(spokenCallsign('BAW118', findSimAircraftType('B77W')!), /heavy$/i)
    assert.match(spokenCallsign('UAL900', findSimAircraftType('A388')!), /super$/i)
  })

  it('leaves a medium without a wake suffix', () => {
    const spoken = spokenCallsign('EZY93', findSimAircraftType('A320')!)
    assert.doesNotMatch(spoken, /heavy|super/i)
  })
})

describe('createCallsignFactory', () => {
  const userCallsigns = ['DLH39A', 'DLH39A']

  it('never issues anything that collides with the user or with itself', () => {
    // Fresh seeds, many draws: no run may ever produce a confusable callsign.
    for (let seed = 0; seed < 40; seed++) {
      const factory = createCallsignFactory({
        rng: createRng(`factory-${seed}`),
        tier: 'major',
        userCallsigns,
      })
      const issued: string[] = []
      for (let i = 0; i < 5; i++) {
        const generated = factory.next()
        assert.ok(generated, 'factory ran out of distinct callsigns')
        assert.ok(
          isCallsignDistinct(generated.callsign, [...userCallsigns, ...issued]),
          `${generated.callsign} collides (issued: ${issued.join(', ')})`,
        )
        issued.push(generated.callsign)
      }
    }
  })

  it('never issues a callsign from the user airline', () => {
    const factory = createCallsignFactory({ rng: createRng('airline'), tier: 'major', userCallsigns })
    for (let i = 0; i < 5; i++) {
      assert.notEqual(callsignPrefix(factory.next()!.callsign), 'DLH')
    }
  })

  it('never issues a registration from the VFR pool the user may be flying', () => {
    const factory = createCallsignFactory({ rng: createRng('vfr'), tier: 'ga', userCallsigns: ['D-EMIL'] })
    for (let i = 0; i < 5; i++) {
      const cs = factory.next()!.callsign
      assert.equal(VFR_REGISTRATION_POOL.includes(cs), false, `${cs} is in the VFR pool`)
    }
  })

  it('only uses airline designators the radiotelephony normalizer can speak', () => {
    const factory = createCallsignFactory({ rng: createRng('speakable'), tier: 'major', userCallsigns })
    for (let i = 0; i < 5; i++) {
      const prefix = callsignPrefix(factory.next()!.callsign)
      if (prefix) assert.ok(TRAFFIC_AIRLINES.includes(prefix), `${prefix} has no telephony name`)
    }
  })

  it('is deterministic for a given seed', () => {
    const draw = () => {
      const factory = createCallsignFactory({ rng: createRng('fixed'), tier: 'major', userCallsigns })
      return [factory.next(), factory.next(), factory.next()].map(g => `${g!.callsign}/${g!.type.icao}`)
    }
    assert.deepEqual(draw(), draw())
  })

  it('weights the type mix by tier', () => {
    const classesFor = (tier: 'major' | 'ga') => {
      const factory = createCallsignFactory({ rng: createRng(`mix-${tier}`), tier, userCallsigns })
      // Release each draw so the collision rules don't exhaust the pool.
      return Array.from({ length: 200 }, () => {
        const g = factory.next()
        if (g) factory.release(g.callsign)
        return g?.type.class
      }).filter(Boolean)
    }
    const major = classesFor('major')
    const ga = classesFor('ga')
    assert.ok(major.filter(c => c === 'narrowbody').length > major.length * 0.5, 'major should be narrowbody-heavy')
    assert.equal(major.filter(c => c === 'ga').length, 0, 'major must not spawn GA singles')
    assert.ok(ga.filter(c => c === 'ga').length > ga.length * 0.6, 'ga field should be GA-heavy')
    assert.equal(ga.filter(c => c === 'widebody').length, 0, 'a GA field must not spawn widebodies')
  })

  it('frees a callsign again on release', () => {
    const factory = createCallsignFactory({ rng: createRng('release'), tier: 'major', userCallsigns })
    const first = factory.next()!
    assert.deepEqual(factory.issued(), [first.callsign])
    factory.release(first.callsign)
    assert.deepEqual(factory.issued(), [])
  })
})
