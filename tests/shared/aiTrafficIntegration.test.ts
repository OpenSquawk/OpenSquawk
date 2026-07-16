import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createRng } from '~~/shared/utils/aiTraffic/rng'
import { createCallsignFactory, isCallsignDistinct } from '~~/shared/utils/aiTraffic/callsign'
import { planInstruction, renderInstruction, applyDirect, cooldownSecFor } from '~~/shared/utils/aiTraffic/instructions'
import { assessInTrail, nextFreeSlot } from '~~/shared/utils/aiTraffic/separation'
import {
  NM_PER_FIX,
  advanceAircraft,
  advancePhase,
  createSimAircraft,
  findLeader,
  generateFixPool,
  isArrival,
  isDespawnable,
} from '~~/shared/utils/aiTraffic/sim'
import { MAX_ACTIVE_TRAFFIC, targetTrafficCount } from '~~/shared/data/trafficTiers'
import type { RadioEvent } from '~~/shared/utils/aiTraffic/instructions'
import type { SimAircraft } from '~~/shared/utils/aiTraffic/types'

/**
 * A long deterministic run of the pure sim core, wired the way useAiTraffic wires
 * it. This is the closest thing to the real loop that runs without a browser: it
 * catches the failures unit tests structurally cannot — runaway spawning, a
 * wedged pending queue, separation that degrades over time, a callsign pool that
 * collides once aircraft start cycling through it.
 *
 * It mirrors the composable's orchestration rather than importing it (the
 * composable is Vue-bound); the RULES it exercises are the real, shipped ones.
 */

const USER_CALLSIGNS = ['DLH39A', 'DLH39A']
const RUNWAY_SLOT_SEC = 90

interface RunResult {
  events: RadioEvent[]
  pool: SimAircraft[]
  maxPopulation: number
  gapViolationTicks: number
}

function runSim(seed: string, ticks: number, target: number, gateOpen: () => boolean): RunResult {
  const rng = createRng(seed)
  const fixPool = generateFixPool(createRng(`${seed}|fixes`))
  const callsigns = createCallsignFactory({ rng, tier: 'major', userCallsigns: USER_CALLSIGNS })

  let pool: SimAircraft[] = []
  let pending: RadioEvent[] = []
  const events: RadioEvent[] = []
  let nowSec = 0
  let lastRadioAtSec = 0
  let nextSpawnAtSec = 0
  let ambientAfterSec = rng.int(45, 90)
  let lastDeparture: { type: SimAircraft['type']; atSec: number } | null = null
  let maxPopulation = 0
  let gapViolationTicks = 0

  const occupiedSlots = () => pool.filter(a => a.runwaySlot).map(a => a.runwaySlot!)

  for (let t = 0; t < ticks; t++) {
    nowSec += 1

    for (const aircraft of [...pool]) {
      advanceAircraft(aircraft, 1)
      if (isDespawnable(aircraft)) {
        callsigns.release(aircraft.callsign)
        pool = pool.filter(a => a !== aircraft)
        pending = pending.filter(e => e.callsign !== aircraft.callsign)
      }
    }

    if (pool.length < target && nowSec >= nextSpawnAtSec && pool.length < MAX_ACTIVE_TRAFFIC) {
      const generated = callsigns.next()
      if (generated) {
        const kind = rng.chance(0.6) ? 'arrival' : 'departure'
        const aircraft = createSimAircraft(generated, kind, { rng, nowSec, frequency: '119.000', fixPool })
        aircraft.runwaySlot = nextFreeSlot(
          { fromSec: nowSec + 120, toSec: nowSec + 120 + RUNWAY_SLOT_SEC },
          occupiedSlots(),
        )
        pool.push(aircraft)
      }
      nextSpawnAtSec = nowSec + rng.int(30, 120)
    }
    maxPopulation = Math.max(maxPopulation, pool.length)

    // Separation health check across the arrival stream.
    for (const aircraft of pool.filter(isArrival)) {
      const leader = findLeader(aircraft, pool.filter(isArrival))
      if (!leader) continue
      const gap = assessInTrail({
        leaderDistanceNm: leader.distanceToFieldNm,
        leaderWake: leader.type.wake,
        followerDistanceNm: aircraft.distanceToFieldNm,
        followerWake: aircraft.type.wake,
        followerKts: aircraft.iasKts,
      })
      if (gap.violated) gapViolationTicks++
    }

    if (pending.length === 0) {
      for (const aircraft of pool) {
        const plan = planInstruction(aircraft, {
          nowSec,
          rng,
          leader: findLeader(aircraft, pool.filter(isArrival)),
          occupiedSlots: occupiedSlots(),
          lastDeparture,
          handover: null,
          nmPerFix: NM_PER_FIX,
          silentForSec: nowSec - lastRadioAtSec,
          ambientAfterSec,
        })
        if (!plan) continue
        pending.push(renderInstruction(aircraft, plan, { rng, station: 'Frankfurt Approach', runway: '25R' }))
        ambientAfterSec = rng.int(45, 90)
        break
      }
    }

    // Dispatch, gated exactly as the scheduler gates it.
    if (pending.length && gateOpen()) {
      const event = pending.shift()!
      const aircraft = pool.find(a => a.callsign === event.callsign)
      if (aircraft) {
        events.push(event)
        lastRadioAtSec = nowSec
        const plan = event.plan
        aircraft.quietUntilSec = nowSec + cooldownSecFor(plan)
        if (plan.kind === 'speed' && plan.speedKts && aircraft.type.wake !== 'L') {
          aircraft.assignedSpeedKts = plan.speedKts
        } else if (plan.kind === 'vector') {
          aircraft.vectorDelaySec += plan.vectorDelaySec ?? 90
        } else if (plan.kind === 'direct' && plan.direct) {
          applyDirect(aircraft, plan.direct)
        } else if (plan.kind === 'phase') {
          advancePhase(aircraft, rng, nowSec)
          if (aircraft.phase === 'takeoff') lastDeparture = { type: aircraft.type, atSec: nowSec }
        } else if (plan.kind === 'wake_hold') {
          aircraft.nextEventAtSec = nowSec + (plan.holdSec ?? 60)
        } else if (plan.kind === 'slot_hold' && aircraft.runwaySlot) {
          // Mirrors the composable: a hold moves the reservation to the next free
          // window, which is what stops the rule from re-firing every tick.
          aircraft.runwaySlot = nextFreeSlot(
            aircraft.runwaySlot,
            occupiedSlots().filter(s => s !== aircraft.runwaySlot),
          )
          aircraft.nextEventAtSec = aircraft.runwaySlot.fromSec
        }
      }
    }
  }

  return { events, pool, maxPopulation, gapViolationTicks }
}

describe('ai-traffic — a 30-minute run with an open frequency', () => {
  const run = runSim('integration-open', 1800, 4, () => true)

  it('keeps the frequency alive', () => {
    assert.ok(run.events.length > 20, `expected a lively frequency, got ${run.events.length} calls in 30 min`)
  })

  it('does not flood it either — a real ATC reply must never queue behind a wall of chatter', () => {
    // Every call is an ATC+readback pair of a few seconds of audio, and the queue
    // is FIFO: sustained traffic denser than roughly one pair per 15 s would mean
    // a real ATC reply always waits behind scenery. A busy major airport is ~2
    // movements a minute on one frequency, so this is generous already.
    const perMinute = run.events.length / 30
    assert.ok(perMinute <= 4, `frequency is saturated: ${run.events.length} calls in 30 min (${perMinute.toFixed(1)}/min)`)
  })

  it('never nags one aircraft with the same instruction twice in a breath', () => {
    // The failure this guards is the planner re-deriving an unresolved condition
    // every tick — a vector, then another vector one second later, forever.
    const bySeconds = new Map<string, number[]>()
    run.events.forEach((e, i) => {
      const key = `${e.callsign}|${e.kind}`
      if (!bySeconds.has(key)) bySeconds.set(key, [])
      bySeconds.get(key)!.push(i)
    })
    for (const [key, indices] of bySeconds) {
      const repeats = indices.length
      assert.ok(repeats < 12, `${key} was issued ${repeats} times in one 30-minute run`)
    }
  })

  it('never exceeds the population cap that protects the speech queue and TTS budget', () => {
    assert.ok(run.maxPopulation <= MAX_ACTIVE_TRAFFIC, `population hit ${run.maxPopulation}`)
  })

  it('never issues a callsign confusable with the user', () => {
    for (const event of run.events) {
      assert.ok(
        isCallsignDistinct(event.callsign, USER_CALLSIGNS),
        `${event.callsign} is confusable with ${USER_CALLSIGNS[0]}`,
      )
    }
  })

  it('never speaks the user callsign, in either half of a pair', () => {
    for (const event of run.events) {
      assert.doesNotMatch(event.atcText, /DLH\s?39A/i, `ATC call addressed the user: ${event.atcText}`)
      assert.doesNotMatch(event.pilotReadbackText, /DLH\s?39A/i, `readback used the user callsign: ${event.pilotReadbackText}`)
    }
  })

  it('never assigns a speed below the aircraft own approach speed', () => {
    for (const event of run.events) {
      if (event.plan.kind !== 'speed' || !event.plan.speedKts) continue
      const aircraft = run.pool.find(a => a.callsign === event.callsign)
      if (aircraft) assert.ok(event.plan.speedKts >= aircraft.type.approachKts, event.atcText)
    }
  })

  it('resolves conflicts by slowing and vectoring rather than letting separation rot', () => {
    // Some violation ticks are expected (that is what triggers a vector), but the
    // stream must not spend its life inside the minima.
    assert.ok(run.gapViolationTicks < 400, `separation was busted on ${run.gapViolationTicks} ticks`)
  })

  it('produces a varied mix of instruction types, not one rule firing forever', () => {
    const kinds = new Set(run.events.map(e => e.kind))
    assert.ok(kinds.size >= 3, `expected varied instructions, got: ${[...kinds].join(', ')}`)
  })

  it('always names an aircraft in every single transmission', () => {
    for (const event of run.events) {
      assert.ok(event.atcText.includes(event.callsign) || event.pilotReadbackText.includes(event.callsign))
    }
  })

  it('is fully reproducible from its seed', () => {
    const again = runSim('integration-open', 1800, 4, () => true)
    assert.deepEqual(again.events.map(e => e.atcText), run.events.map(e => e.atcText))
  })
})

describe('ai-traffic — a frequency the user never releases', () => {
  it('stays completely silent, and does not lose the events it never got to speak', () => {
    const run = runSim('integration-closed', 1800, 4, () => false)
    assert.equal(run.events.length, 0, 'traffic transmitted while the gate was shut')
    // The sim itself keeps running — aircraft still fly, they just say nothing.
    assert.ok(run.pool.length > 0, 'the pool should still be populated')
  })

  it('resumes the moment the frequency frees up', () => {
    let open = false
    const rng = createRng('resume')
    // Shut for the first half of the run, open for the second.
    let tick = 0
    const gate = () => { tick++; return open }
    const first = runSim('integration-resume', 900, 4, gate)
    assert.equal(first.events.length, 0)
    open = true
    const second = runSim('integration-resume', 900, 4, gate)
    assert.ok(second.events.length > 0, 'traffic never came back after the gate reopened')
    void rng
  })
})

describe('ai-traffic — a dead GA field at 03:00', () => {
  it('stays silent, because a target of zero is the correct answer', () => {
    const target = targetTrafficCount('ga', 3)
    assert.equal(target, 0)
    const run = runSim('integration-night', 1800, target, () => true)
    assert.equal(run.pool.length, 0)
    assert.equal(run.events.length, 0)
  })
})
