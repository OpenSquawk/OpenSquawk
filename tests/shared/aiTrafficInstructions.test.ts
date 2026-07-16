import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createRng } from '~~/shared/utils/aiTraffic/rng'
import { findSimAircraftType } from '~~/shared/data/simAircraftTypes'
import {
  SPEED_LADDER,
  applyDirect,
  isAtMinimumSpeed,
  nextSpeedStep,
  planInstruction,
  renderInstruction,
  speedLadderFor,
  validateDirect,
  type PlannerContext,
} from '~~/shared/utils/aiTraffic/instructions'
import type { SimAircraft, SimPhase } from '~~/shared/utils/aiTraffic/types'

const A320 = findSimAircraftType('A320')!   // Medium, Vref 130
const B77W = findSimAircraftType('B77W')!   // Heavy, Vref 145
const C172 = findSimAircraftType('C172')!   // Light

function aircraft(overrides: Partial<SimAircraft> = {}): SimAircraft {
  return {
    callsign: 'BAW118',
    callsignSpoken: 'Speedbird one one eight',
    type: A320,
    voiceId: 'nova',
    phase: 'approach',
    frequency: '119.000',
    routeFixes: ['KOTAP', 'RIVAK', 'DOMUX'],
    distanceToFieldNm: 20,
    altitudeFt: 6000,
    iasKts: 250,
    assignedSpeedKts: null,
    vectorDelaySec: 0,
    runwaySlot: null,
    nextEventAtSec: Number.POSITIVE_INFINITY,
    quietUntilSec: 0,
    ...overrides,
  }
}

describe('nextSpeedStep — the ladder', () => {
  it('steps down one rung at a time, ending on the type approach speed', () => {
    let ac = aircraft({ iasKts: 250, assignedSpeedKts: null })
    const issued: number[] = []
    for (let i = 0; i < 10; i++) {
      const step = nextSpeedStep(ac)
      if (step === null) break
      issued.push(step)
      ac = { ...ac, assignedSpeedKts: step }
    }
    assert.deepEqual(issued, [220, 210, 190, 180, 170, 160, A320.approachKts])
  })

  it('drops rungs that sit below a slower type approach speed', () => {
    // B744 rotates at Vref 150 — the 160 rung is its last fixed one, then 150.
    assert.deepEqual(speedLadderFor(findSimAircraftType('B744')!), [250, 220, 210, 190, 180, 170, 160, 150])
    // A hypothetical fast-approaching type never sees the low rungs at all.
    assert.deepEqual(speedLadderFor({ ...A320, approachKts: 185 }), [250, 220, 210, 190, 185])
  })

  it('never assigns above 250 kt below 10,000 ft', () => {
    const fast = aircraft({ altitudeFt: 8000, iasKts: 300, assignedSpeedKts: null })
    const step = nextSpeedStep(fast)!
    assert.ok(step <= 250, `assigned ${step} below 10,000 ft`)
    assert.equal(step, 250)
  })

  it('may assign above 250 kt above 10,000 ft', () => {
    const high = aircraft({ altitudeFt: 14000, iasKts: 300, assignedSpeedKts: null })
    assert.equal(nextSpeedStep(high), 250)
  })

  it('bottoms out at the type Vref and has nothing left to say below it', () => {
    // A320 Vref 130: 160 → 130, and 130 is the end of the road.
    assert.equal(nextSpeedStep(aircraft({ assignedSpeedKts: 160 })), 130)
    assert.equal(nextSpeedStep(aircraft({ assignedSpeedKts: 130 })), null)
    // B77W Vref 145 — its floor is higher than the A320's, as it must be.
    assert.equal(nextSpeedStep(aircraft({ type: B77W, assignedSpeedKts: 160 })), 145)
    assert.equal(nextSpeedStep(aircraft({ type: B77W, assignedSpeedKts: 145 })), null)
  })

  it('never assigns below Vref for any type, from any rung', () => {
    for (const type of [A320, B77W, findSimAircraftType('E190')!, findSimAircraftType('A388')!, findSimAircraftType('B744')!]) {
      for (const rung of [...SPEED_LADDER, type.approachKts]) {
        const step = nextSpeedStep(aircraft({ type, assignedSpeedKts: rung + 1 }))
        if (step !== null) assert.ok(step >= type.approachKts, `${type.icao}: ${step} < Vref ${type.approachKts}`)
      }
    }
  })

  it('gives a Cessna no jet speed callout at all', () => {
    assert.equal(nextSpeedStep(aircraft({ type: C172, iasKts: 110 })), null)
    assert.equal(isAtMinimumSpeed(aircraft({ type: C172 })), true)
  })

  it('only controls speed in phases where it makes sense', () => {
    const controllable: SimPhase[] = ['inbound', 'approach']
    const nonsense: SimPhase[] = ['final', 'rollout', 'taxi_out', 'lineup', 'takeoff', 'climbout', 'handed_off']
    for (const phase of controllable) {
      assert.notEqual(nextSpeedStep(aircraft({ phase })), null, `${phase} should allow speed control`)
    }
    for (const phase of nonsense) {
      assert.equal(nextSpeedStep(aircraft({ phase })), null, `${phase} must not get an approach reduction`)
    }
  })

  it('measures from the assigned speed, not the current one, while IAS is still catching up', () => {
    // Told 220, still decelerating through 240 — the next rung is 210, not 220 again.
    assert.equal(nextSpeedStep(aircraft({ iasKts: 240, assignedSpeedKts: 220 })), 210)
  })
})

describe('validateDirect', () => {
  const ctx = { gapNm: 30, requiredNm: 5, nmPerFix: 8 }

  it('accepts a fix that lies ahead with plenty of air', () => {
    const result = validateDirect(aircraft(), 'DOMUX', ctx)
    assert.equal(result.valid, true)
    assert.equal(result.fixIndex, 2)
    assert.equal(result.savedNm, 16)
  })

  it('rejects the fix the aircraft is already proceeding to', () => {
    assert.deepEqual(validateDirect(aircraft(), 'KOTAP', ctx), { valid: false, reason: 'behind' })
  })

  it('rejects a fix that is not on the remaining route', () => {
    assert.deepEqual(validateDirect(aircraft(), 'NOWAY', ctx), { valid: false, reason: 'not_on_route' })
  })

  it('rejects a direct without the headroom that makes it a reward, not a fix', () => {
    const result = validateDirect(aircraft(), 'DOMUX', { ...ctx, gapNm: 9 })
    assert.deepEqual(result, { valid: false, reason: 'no_headroom' })
  })

  it('rejects a shortcut that would bust the minimum the moment it is read back', () => {
    // 20 NM gap clears the 2× headroom, but cutting 16 NM leaves only 4 < 5 required.
    const result = validateDirect(aircraft(), 'DOMUX', { ...ctx, gapNm: 20 })
    assert.deepEqual(result, { valid: false, reason: 'gap_conflict' })
  })

  it('is never generated outside the phases where a shortcut means anything', () => {
    for (const phase of ['final', 'climbout', 'taxi_out', 'rollout'] as SimPhase[]) {
      assert.deepEqual(validateDirect(aircraft({ phase }), 'DOMUX', ctx), { valid: false, reason: 'wrong_phase' })
    }
  })
})

describe('applyDirect', () => {
  it('shortens the route and the distance together, so later phraseology stays consistent', () => {
    const ac = aircraft({ distanceToFieldNm: 40 })
    const validation = validateDirect(ac, 'DOMUX', { gapNm: 60, requiredNm: 5, nmPerFix: 8 })
    applyDirect(ac, validation)
    assert.deepEqual(ac.routeFixes, ['DOMUX'])
    assert.equal(ac.distanceToFieldNm, 24)
  })

  it('ignores an invalid direct rather than corrupting the route', () => {
    const ac = aircraft()
    applyDirect(ac, { valid: false, reason: 'behind' })
    assert.deepEqual(ac.routeFixes, ['KOTAP', 'RIVAK', 'DOMUX'])
    assert.equal(ac.distanceToFieldNm, 20)
  })

  it('never drives the distance to the field negative', () => {
    const ac = aircraft({ distanceToFieldNm: 4 })
    applyDirect(ac, { valid: true, fixIndex: 2, fix: 'DOMUX', savedNm: 16 })
    assert.equal(ac.distanceToFieldNm, 0)
  })
})

describe('planInstruction — the decision table', () => {
  const baseCtx = (overrides: Partial<PlannerContext> = {}): PlannerContext => ({
    nowSec: 1000,
    rng: createRng('planner'),
    leader: null,
    occupiedSlots: [],
    lastDeparture: null,
    handover: null,
    nmPerFix: 8,
    silentForSec: 0,
    ambientAfterSec: 60,
    ...overrides,
  })

  it('row 7: a sector boundary hands the aircraft off', () => {
    const plan = planInstruction(
      aircraft({ nextEventAtSec: 900 }),
      baseCtx({ handover: { station: 'Frankfurt Tower', frequency: '119.900' } }),
    )
    assert.equal(plan?.kind, 'handover')
    assert.equal(plan?.handoverFrequency, '119.900')
  })

  it('row 3: a departure behind a heavy is held for the wake timer', () => {
    const plan = planInstruction(
      aircraft({ phase: 'lineup', nextEventAtSec: 900 }),
      baseCtx({ lastDeparture: { type: B77W, atSec: 950 } }),
    )
    assert.equal(plan?.kind, 'wake_hold')
    assert.equal(plan?.holdSec, 130) // 180 required − 50 elapsed
  })

  it('row 3: no hold once the wake timer has run out', () => {
    const plan = planInstruction(
      aircraft({ phase: 'lineup', nextEventAtSec: 900 }),
      baseCtx({ lastDeparture: { type: B77W, atSec: 800 } }),
    )
    assert.notEqual(plan?.kind, 'wake_hold')
  })

  it('row 3: no hold behind a medium — runway occupancy covers that', () => {
    const plan = planInstruction(
      aircraft({ phase: 'lineup', nextEventAtSec: 900 }),
      baseCtx({ lastDeparture: { type: A320, atSec: 995 } }),
    )
    assert.notEqual(plan?.kind, 'wake_hold')
  })

  it('row 2: simulated traffic yields to the user runway reservation', () => {
    const plan = planInstruction(
      aircraft({ phase: 'final', runwaySlot: { fromSec: 1000, toSec: 1060 }, nextEventAtSec: 900 }),
      baseCtx({ occupiedSlots: [{ fromSec: 1030, toSec: 1120 }] }),
    )
    assert.equal(plan?.kind, 'slot_hold')
  })

  it('row 2: a free slot does not trigger a hold', () => {
    const plan = planInstruction(
      aircraft({ phase: 'final', runwaySlot: { fromSec: 1000, toSec: 1060 } }),
      baseCtx({ occupiedSlots: [{ fromSec: 1200, toSec: 1260 }] }),
    )
    assert.notEqual(plan?.kind, 'slot_hold')
  })

  it('row 2: an aircraft does not conflict with its own reservation', () => {
    // The caller passes the whole runway timeline, own slot included. Counting it
    // would hold every aircraft against itself forever instead of ever flying.
    const slot = { fromSec: 1000, toSec: 1060 }
    const plan = planInstruction(
      aircraft({ phase: 'final', runwaySlot: slot }),
      baseCtx({ occupiedSlots: [slot] }),
    )
    assert.notEqual(plan?.kind, 'slot_hold')
  })

  it('row 1: a due phase change produces a phase call', () => {
    const plan = planInstruction(aircraft({ nextEventAtSec: 999 }), baseCtx())
    assert.equal(plan?.kind, 'phase')
  })

  it('row 4: closing up with speed left produces one step down', () => {
    const plan = planInstruction(
      aircraft({ distanceToFieldNm: 15.5, iasKts: 250 }),
      baseCtx({ leader: { distanceToFieldNm: 10, type: B77W } }), // required 5, gap 5.5
    )
    assert.equal(plan?.kind, 'speed')
    assert.equal(plan?.speedKts, 220)
  })

  it('row 5: a busted minimum at minimum speed produces a vector', () => {
    // Already told to fly its Vref — speed control has nothing left to give.
    const plan = planInstruction(
      aircraft({ distanceToFieldNm: 14, iasKts: 130, assignedSpeedKts: A320.approachKts }),
      baseCtx({ leader: { distanceToFieldNm: 10, type: B77W } }), // required 5, gap 4
    )
    assert.equal(plan?.kind, 'vector')
    assert.ok(plan!.headingDeg! >= 10 && plan!.headingDeg! <= 360)
    assert.ok(plan!.vectorDelaySec! >= 60 && plan!.vectorDelaySec! <= 120)
  })

  it('row 5: prefers speed over a vector while a rung remains', () => {
    const plan = planInstruction(
      aircraft({ distanceToFieldNm: 14, iasKts: 250 }),
      baseCtx({ leader: { distanceToFieldNm: 10, type: B77W } }),
    )
    assert.equal(plan?.kind, 'speed', 'a vector is the last resort, not the first')
  })

  it('row 5: a GA aircraft with no ladder left goes straight to a vector', () => {
    const plan = planInstruction(
      aircraft({ type: C172, distanceToFieldNm: 12, iasKts: 90 }),
      baseCtx({ leader: { distanceToFieldNm: 10, type: B77W } }),
    )
    assert.equal(plan?.kind, 'vector')
  })

  it('row 6: a direct only shows up with a lot of air, and only rarely', () => {
    const kinds = Array.from({ length: 400 }, (_, i) =>
      planInstruction(
        aircraft({ distanceToFieldNm: 60 }),
        baseCtx({ rng: createRng(`direct-${i}`), leader: { distanceToFieldNm: 10, type: A320 } }),
      )?.kind,
    )
    const directs = kinds.filter(k => k === 'direct').length
    assert.ok(directs > 0, 'a direct should occasionally fire on a quiet picture')
    assert.ok(directs < 100, `a direct should stay rare, fired ${directs}/400`)
  })

  it('row 6: never issues a direct when the picture is tight', () => {
    for (let i = 0; i < 200; i++) {
      const plan = planInstruction(
        aircraft({ distanceToFieldNm: 14, iasKts: 130, assignedSpeedKts: A320.approachKts }),
        baseCtx({ rng: createRng(`tight-${i}`), leader: { distanceToFieldNm: 10, type: B77W } }),
      )
      assert.notEqual(plan?.kind, 'direct')
    }
  })

  it('row 8: a long-silent frequency gets ambient chatter', () => {
    const plan = planInstruction(aircraft(), baseCtx({ silentForSec: 75, ambientAfterSec: 60 }))
    assert.equal(plan?.kind, 'ambient')
  })

  it('row 8: no ambient chatter while the frequency is still busy', () => {
    const plan = planInstruction(aircraft(), baseCtx({ silentForSec: 20, ambientAfterSec: 60 }))
    assert.equal(plan, null)
  })

  it('says nothing at all when no row matches', () => {
    assert.equal(planInstruction(aircraft(), baseCtx()), null)
  })

  it('is deterministic for a given seed', () => {
    const run = () =>
      planInstruction(
        aircraft({ distanceToFieldNm: 14, iasKts: 130, assignedSpeedKts: A320.approachKts }),
        baseCtx({ rng: createRng('fixed'), leader: { distanceToFieldNm: 10, type: B77W } }),
      )
    assert.deepEqual(run(), run())
  })
})

describe('renderInstruction — phraseology', () => {
  const ctx = { rng: createRng('render'), station: 'Frankfurt Approach', runway: '25R' }

  it('always names the aircraft in both the call and the readback', () => {
    for (const kind of ['speed', 'vector', 'direct', 'handover', 'wake_hold', 'slot_hold', 'phase'] as const) {
      const event = renderInstruction(
        aircraft(),
        {
          kind,
          callsign: 'BAW118',
          speedKts: 180,
          headingDeg: 250,
          direct: { valid: true, fix: 'DOMUX', fixIndex: 2, savedNm: 16 },
          handoverStation: 'Frankfurt Tower',
          handoverFrequency: '119.900',
        },
        { ...ctx, rng: createRng(`render-${kind}`) },
      )
      assert.match(event.atcText, /BAW118/, `${kind} ATC call omits the callsign`)
      assert.match(event.pilotReadbackText, /BAW118/, `${kind} readback omits the callsign`)
    }
  })

  it('gives a Cessna "slowest practical speed" instead of a number', () => {
    const event = renderInstruction(
      aircraft({ type: C172, callsign: 'D-EKLM' }),
      { kind: 'speed', callsign: 'D-EKLM', speedKts: 180 },
      ctx,
    )
    assert.match(event.atcText, /slowest practical|as slow as practical/i)
    assert.doesNotMatch(event.atcText, /180/)
  })

  it('reads the assigned speed back verbatim', () => {
    const event = renderInstruction(aircraft(), { kind: 'speed', callsign: 'BAW118', speedKts: 190 }, ctx)
    assert.match(event.atcText, /190 knots/)
    assert.match(event.pilotReadbackText, /190/)
  })

  it('reads the handover frequency back — the one thing that must not be misheard', () => {
    const event = renderInstruction(
      aircraft(),
      { kind: 'handover', callsign: 'BAW118', handoverStation: 'Frankfurt Tower', handoverFrequency: '119.900' },
      ctx,
    )
    assert.match(event.atcText, /Frankfurt Tower/)
    assert.match(event.pilotReadbackText, /119\.900/)
  })

  it('tells an arrival to continue approach but a departure to hold', () => {
    const arrival = renderInstruction(aircraft({ phase: 'final' }), { kind: 'slot_hold', callsign: 'BAW118' }, ctx)
    assert.match(arrival.atcText, /continue approach/i)
    const departure = renderInstruction(aircraft({ phase: 'lineup' }), { kind: 'slot_hold', callsign: 'BAW118' }, ctx)
    assert.match(departure.atcText, /hold (position|short)/i)
  })

  it('emits every instruction ATC-first', () => {
    for (const kind of ['speed', 'vector', 'direct', 'handover', 'wake_hold', 'slot_hold', 'phase'] as const) {
      const event = renderInstruction(aircraft(), { kind, callsign: 'BAW118', speedKts: 180 }, ctx)
      assert.equal(event.order, 'atc_first', `${kind} must be ATC-first`)
    }
  })

  it('emits an ambient check-in pilot-first — the aircraft calls, ATC answers', () => {
    const event = renderInstruction(aircraft(), { kind: 'ambient', callsign: 'BAW118' }, ctx)
    assert.equal(event.order, 'pilot_first')
    assert.match(event.pilotReadbackText, /Frankfurt Approach/)
  })

  it('varies its wording across draws', () => {
    const texts = new Set(
      Array.from({ length: 20 }, (_, i) =>
        renderInstruction(
          aircraft(),
          { kind: 'speed', callsign: 'BAW118', speedKts: 180 },
          { ...ctx, rng: createRng(`variant-${i}`) },
        ).atcText,
      ),
    )
    assert.ok(texts.size > 1, 'template variants should produce more than one phrasing')
  })

  it('is deterministic for a given seed', () => {
    const render = () =>
      renderInstruction(aircraft(), { kind: 'phase', callsign: 'BAW118' }, { ...ctx, rng: createRng('fixed') })
    assert.deepEqual(render(), render())
  })
})
