import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createRng } from '~~/shared/utils/aiTraffic/rng'
import { findSimAircraftType } from '~~/shared/data/simAircraftTypes'
import { PILOT_VOICES, pilotVoiceFor } from '~~/shared/utils/voicePool'
import {
  SPEED_DRIFT_KTS_PER_SEC,
  advanceAircraft,
  advancePhase,
  createSimAircraft,
  findLeader,
  generateFixPool,
  isArrival,
  isDespawnable,
  nextPhase,
} from '~~/shared/utils/aiTraffic/sim'
import type { SimAircraft, SimPhase } from '~~/shared/utils/aiTraffic/types'

const A320 = findSimAircraftType('A320')!
const B77W = findSimAircraftType('B77W')!

function aircraft(overrides: Partial<SimAircraft> = {}): SimAircraft {
  return {
    callsign: 'BAW118',
    callsignSpoken: 'Speedbird one one eight',
    type: A320,
    voiceId: 'nova',
    phase: 'approach',
    frequency: '119.000',
    routeFixes: ['KOTAP', 'RIVAK'],
    distanceToFieldNm: 20,
    altitudeFt: 6000,
    iasKts: 200,
    assignedSpeedKts: null,
    vectorDelaySec: 0,
    runwaySlot: null,
    nextEventAtSec: Number.POSITIVE_INFINITY,
    quietUntilSec: 0,
    ...overrides,
  }
}

describe('generateFixPool', () => {
  it('produces distinct, pronounceable 5-letter fixes', () => {
    const fixes = generateFixPool(createRng('EDDF'), 8)
    assert.equal(fixes.length, 8)
    assert.equal(new Set(fixes).size, 8, 'fixes must be distinct')
    for (const fix of fixes) assert.match(fix, /^[A-Z]{5}$/)
  })

  it('is deterministic per airport seed', () => {
    assert.deepEqual(generateFixPool(createRng('EDDF')), generateFixPool(createRng('EDDF')))
    assert.notDeepEqual(generateFixPool(createRng('EDDF')), generateFixPool(createRng('EDDM')))
  })
})

describe('createSimAircraft', () => {
  const generated = { callsign: 'BAW118', callsignSpoken: 'Speedbird one one eight', type: A320 }
  const opts = { rng: createRng('spawn'), nowSec: 0, frequency: '119.000', fixPool: generateFixPool(createRng('EDDF')) }

  it('spawns an arrival out on the STAR, descending', () => {
    const ac = createSimAircraft(generated, 'arrival', { ...opts, rng: createRng('arr') })
    assert.equal(ac.phase, 'inbound')
    assert.ok(ac.distanceToFieldNm >= 25 && ac.distanceToFieldNm <= 60)
    assert.ok(ac.altitudeFt >= 7000 && ac.altitudeFt <= 12000)
    assert.ok(ac.iasKts <= 250, 'an inbound below 10,000 ft must not spawn above the speed limit')
    assert.ok(ac.iasKts >= A320.approachKts)
    assert.ok(ac.nextEventAtSec > 0 && Number.isFinite(ac.nextEventAtSec))
  })

  it('spawns a departure at the stand, stationary', () => {
    const ac = createSimAircraft(generated, 'departure', { ...opts, rng: createRng('dep') })
    assert.equal(ac.phase, 'taxi_out')
    assert.equal(ac.distanceToFieldNm, 0)
    assert.equal(ac.altitudeFt, 0)
    assert.equal(ac.iasKts, 0)
  })

  it('gives the aircraft the voice its callsign hashes to', () => {
    const ac = createSimAircraft(generated, 'arrival', opts)
    assert.equal(ac.voiceId, pilotVoiceFor('BAW118'))
    assert.ok(PILOT_VOICES.includes(ac.voiceId))
  })

  it('draws its route from the airport fix pool', () => {
    const ac = createSimAircraft(generated, 'arrival', opts)
    assert.ok(ac.routeFixes.length >= 2)
    for (const fix of ac.routeFixes) assert.ok(opts.fixPool.includes(fix))
  })

  it('is deterministic for a given seed', () => {
    const build = () => createSimAircraft(generated, 'arrival', { ...opts, rng: createRng('fixed') })
    assert.deepEqual(build(), build())
  })
})

describe('phase chains', () => {
  it('walks an arrival to handoff', () => {
    const chain: SimPhase[] = []
    let phase: SimPhase = 'inbound'
    for (let i = 0; i < 5; i++) { chain.push(phase); phase = nextPhase(phase) }
    assert.deepEqual(chain, ['inbound', 'approach', 'final', 'rollout', 'handed_off'])
  })

  it('walks a departure to handoff', () => {
    const chain: SimPhase[] = []
    let phase: SimPhase = 'taxi_out'
    for (let i = 0; i < 5; i++) { chain.push(phase); phase = nextPhase(phase) }
    assert.deepEqual(chain, ['taxi_out', 'lineup', 'takeoff', 'climbout', 'handed_off'])
  })

  it('terminates at handed_off', () => {
    assert.equal(nextPhase('handed_off'), 'handed_off')
    assert.equal(isDespawnable(aircraft({ phase: 'handed_off' })), true)
    assert.equal(isDespawnable(aircraft({ phase: 'final' })), false)
  })

  it('classifies arrivals and departures', () => {
    for (const phase of ['inbound', 'approach', 'final', 'rollout'] as SimPhase[]) {
      assert.equal(isArrival(aircraft({ phase })), true, phase)
    }
    for (const phase of ['taxi_out', 'lineup', 'takeoff', 'climbout'] as SimPhase[]) {
      assert.equal(isArrival(aircraft({ phase })), false, phase)
    }
  })
})

describe('advancePhase', () => {
  it('pins an arrival to its Vref once it turns final', () => {
    const ac = aircraft({ phase: 'approach' })
    advancePhase(ac, createRng('final'), 100)
    assert.equal(ac.phase, 'final')
    assert.equal(ac.assignedSpeedKts, A320.approachKts)
    assert.ok(ac.nextEventAtSec > 100)
  })

  it('releases the speed restriction on climbout', () => {
    const ac = aircraft({ phase: 'takeoff', assignedSpeedKts: 160 })
    advancePhase(ac, createRng('climb'), 100)
    assert.equal(ac.phase, 'climbout')
    assert.equal(ac.assignedSpeedKts, null)
  })

  it('stops scheduling events once handed off', () => {
    const ac = aircraft({ phase: 'rollout' })
    advancePhase(ac, createRng('done'), 100)
    assert.equal(ac.phase, 'handed_off')
    assert.equal(ac.nextEventAtSec, Number.POSITIVE_INFINITY)
  })
})

describe('advanceAircraft — 1D kinematics', () => {
  it('closes an arrival on the field at its groundspeed', () => {
    const ac = aircraft({ distanceToFieldNm: 20, iasKts: 180 })
    advanceAircraft(ac, 60) // one minute at 180 kt = 3 NM
    assert.ok(Math.abs(ac.distanceToFieldNm - 17) < 1e-9)
  })

  it('descends an arrival at the type descent rate', () => {
    const ac = aircraft({ altitudeFt: 6000 })
    advanceAircraft(ac, 60)
    assert.equal(ac.altitudeFt, 6000 - A320.descentFpm)
  })

  it('climbs a departure away from the field', () => {
    const ac = aircraft({ phase: 'climbout', altitudeFt: 2000, distanceToFieldNm: 3, iasKts: 180 })
    advanceAircraft(ac, 60)
    assert.equal(ac.altitudeFt, 2000 + A320.climbFpm)
    assert.ok(ac.distanceToFieldNm > 3)
  })

  it('drags IAS toward the assigned speed at ~1 kt/s so phraseology stays honest', () => {
    const ac = aircraft({ iasKts: 250, assignedSpeedKts: 180 })
    advanceAircraft(ac, 10)
    assert.equal(ac.iasKts, 250 - 10 * SPEED_DRIFT_KTS_PER_SEC)
  })

  it('never overshoots the assigned speed', () => {
    const ac = aircraft({ iasKts: 185, assignedSpeedKts: 180 })
    advanceAircraft(ac, 60)
    assert.equal(ac.iasKts, 180)
  })

  it('accelerates as well as decelerates', () => {
    const ac = aircraft({ iasKts: 150, assignedSpeedKts: 180 })
    advanceAircraft(ac, 10)
    assert.equal(ac.iasKts, 160)
  })

  it('burns a vector as time on the timeline instead of closing distance', () => {
    const ac = aircraft({ vectorDelaySec: 90, distanceToFieldNm: 20, altitudeFt: 6000 })
    advanceAircraft(ac, 30)
    assert.equal(ac.vectorDelaySec, 60)
    assert.equal(ac.distanceToFieldNm, 20, 'a vectored aircraft holds its distance to the field')
    assert.equal(ac.altitudeFt, 6000)
  })

  it('resumes closing once the vector is flown out', () => {
    const ac = aircraft({ vectorDelaySec: 10, distanceToFieldNm: 20 })
    advanceAircraft(ac, 10)
    assert.equal(ac.vectorDelaySec, 0)
    advanceAircraft(ac, 60)
    assert.ok(ac.distanceToFieldNm < 20)
  })

  it('never drives distance or altitude negative on landing', () => {
    const ac = aircraft({ phase: 'final', distanceToFieldNm: 0.5, altitudeFt: 200, iasKts: 140 })
    for (let i = 0; i < 200; i++) advanceAircraft(ac, 1)
    assert.equal(ac.distanceToFieldNm, 0)
    assert.equal(ac.altitudeFt, 0)
  })

  it('brakes on rollout without moving the aircraft backwards', () => {
    const ac = aircraft({ phase: 'rollout', iasKts: 130, distanceToFieldNm: 0 })
    advanceAircraft(ac, 10)
    assert.equal(ac.iasKts, 80)
    for (let i = 0; i < 60; i++) advanceAircraft(ac, 1)
    assert.equal(ac.iasKts, 0)
    assert.equal(ac.distanceToFieldNm, 0)
  })

  it('is a no-op for a non-positive tick', () => {
    const ac = aircraft()
    const before = { ...ac }
    advanceAircraft(ac, 0)
    advanceAircraft(ac, -5)
    assert.deepEqual(ac, before)
  })
})

describe('findLeader', () => {
  const follower = aircraft({ callsign: 'BAW118', distanceToFieldNm: 20 })

  it('picks the closest aircraft ahead on the approach', () => {
    const near = aircraft({ callsign: 'DLH1', distanceToFieldNm: 15 })
    const far = aircraft({ callsign: 'AFR2', distanceToFieldNm: 5 })
    assert.equal(findLeader(follower, [far, near, follower])?.callsign, 'DLH1')
  })

  it('returns null when the aircraft is leading the sequence', () => {
    const behind = aircraft({ callsign: 'DLH1', distanceToFieldNm: 30 })
    assert.equal(findLeader(follower, [behind, follower]), null)
    assert.equal(findLeader(follower, [follower]), null)
    assert.equal(findLeader(follower, []), null)
  })

  it('ignores departures — they are not on the approach', () => {
    const departure = aircraft({ callsign: 'DLH1', phase: 'climbout', distanceToFieldNm: 5, type: B77W })
    assert.equal(findLeader(follower, [departure, follower]), null)
  })

  it('never returns the follower itself', () => {
    const twin = aircraft({ callsign: 'BAW118', distanceToFieldNm: 10 })
    assert.equal(findLeader(follower, [twin, follower]), null)
  })
})
