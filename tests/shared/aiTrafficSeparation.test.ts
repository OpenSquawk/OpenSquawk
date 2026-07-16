import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  TERMINAL_STANDARD_NM,
  assessInTrail,
  departureWakeDelaySec,
  gapToTimeSec,
  isGapViolated,
  needsSpacing,
  nextFreeSlot,
  requiredGapNm,
  slotIsFree,
  slotsOverlap,
  wakeSeparationNm,
} from '~~/shared/utils/aiTraffic/separation'

describe('wake separation matrix', () => {
  it('reproduces the design table, leader → follower', () => {
    assert.equal(wakeSeparationNm('J', 'H'), 6)
    assert.equal(wakeSeparationNm('J', 'M'), 7)
    assert.equal(wakeSeparationNm('J', 'L'), 8)
    assert.equal(wakeSeparationNm('H', 'H'), 4)
    assert.equal(wakeSeparationNm('H', 'M'), 5)
    assert.equal(wakeSeparationNm('H', 'L'), 6)
    assert.equal(wakeSeparationNm('M', 'L'), 5)
  })

  it('has no supplement where the standard already covers it', () => {
    assert.equal(wakeSeparationNm('M', 'M'), 0)
    assert.equal(wakeSeparationNm('M', 'H'), 0)
    assert.equal(wakeSeparationNm('L', 'L'), 0)
    assert.equal(wakeSeparationNm('L', 'M'), 0)
    assert.equal(wakeSeparationNm('L', 'H'), 0)
  })

  it('is not symmetric — the leader is what generates the wake', () => {
    assert.notEqual(wakeSeparationNm('H', 'L'), wakeSeparationNm('L', 'H'))
  })
})

describe('requiredGapNm', () => {
  it('is the design reading: a Medium behind a Heavy needs 5 NM, not 3+5', () => {
    assert.equal(requiredGapNm('H', 'M'), 5)
  })

  it('falls back to the terminal standard for pairs with no supplement', () => {
    assert.equal(requiredGapNm('M', 'M'), TERMINAL_STANDARD_NM)
    assert.equal(requiredGapNm('L', 'L'), TERMINAL_STANDARD_NM)
  })

  it('never returns less than the terminal standard', () => {
    for (const leader of ['L', 'M', 'H', 'J'] as const) {
      for (const follower of ['L', 'M', 'H', 'J'] as const) {
        assert.ok(requiredGapNm(leader, follower) >= TERMINAL_STANDARD_NM)
      }
    }
  })
})

describe('gapToTimeSec', () => {
  it('converts distance into time at the follower speed', () => {
    assert.equal(gapToTimeSec(3, 180), 60)   // 3 NM at 180 kt = 1 minute
    assert.equal(gapToTimeSec(5, 150), 120)
  })

  it('treats a stationary follower as never closing', () => {
    assert.equal(gapToTimeSec(3, 0), Number.POSITIVE_INFINITY)
    assert.equal(gapToTimeSec(3, -10), Number.POSITIVE_INFINITY)
  })
})

describe('spacing thresholds', () => {
  it('acts on the 20% buffer before the minimum is actually busted', () => {
    // Required 5 NM → act below 6 NM, violated below 5 NM.
    assert.equal(needsSpacing(6.1, 5), false)
    assert.equal(needsSpacing(5.5, 5), true)
    assert.equal(isGapViolated(5.5, 5), false)
    assert.equal(isGapViolated(4.9, 5), true)
  })

  it('treats a violated gap as also needing action', () => {
    assert.equal(needsSpacing(4.9, 5), true)
  })
})

describe('departureWakeDelaySec', () => {
  it('holds a Medium three minutes behind a Heavy', () => {
    assert.equal(departureWakeDelaySec('H', 'M'), 180)
    assert.equal(departureWakeDelaySec('H', 'L'), 180)
    assert.equal(departureWakeDelaySec('J', 'M'), 180)
  })

  it('holds a Heavy two minutes behind a Heavy', () => {
    assert.equal(departureWakeDelaySec('H', 'H'), 120)
    assert.equal(departureWakeDelaySec('J', 'J'), 120)
  })

  it('imposes no time delay behind a non-heavy — runway occupancy covers it', () => {
    assert.equal(departureWakeDelaySec('M', 'M'), 0)
    assert.equal(departureWakeDelaySec('M', 'L'), 0)
    assert.equal(departureWakeDelaySec('L', 'M'), 0)
  })
})

describe('runway slots', () => {
  it('detects overlap and treats touching slots as free', () => {
    assert.equal(slotsOverlap({ fromSec: 0, toSec: 60 }, { fromSec: 30, toSec: 90 }), true)
    assert.equal(slotsOverlap({ fromSec: 0, toSec: 60 }, { fromSec: 60, toSec: 90 }), false)
    assert.equal(slotsOverlap({ fromSec: 60, toSec: 90 }, { fromSec: 0, toSec: 60 }), false)
  })

  it('detects full containment', () => {
    assert.equal(slotsOverlap({ fromSec: 10, toSec: 20 }, { fromSec: 0, toSec: 100 }), true)
  })

  it('reports a slot free only when it clears everything', () => {
    const occupied = [{ fromSec: 0, toSec: 60 }, { fromSec: 120, toSec: 180 }]
    assert.equal(slotIsFree({ fromSec: 60, toSec: 120 }, occupied), true)
    assert.equal(slotIsFree({ fromSec: 100, toSec: 130 }, occupied), false)
    assert.equal(slotIsFree({ fromSec: 0, toSec: 10 }, []), true)
  })

  it('pushes a blocked slot past the blocker, preserving its duration', () => {
    const slot = nextFreeSlot({ fromSec: 30, toSec: 90 }, [{ fromSec: 0, toSec: 60 }])
    assert.deepEqual(slot, { fromSec: 60, toSec: 120 })
  })

  it('walks past a chain of back-to-back blockers', () => {
    const occupied = [
      { fromSec: 0, toSec: 60 },
      { fromSec: 60, toSec: 120 },
      { fromSec: 120, toSec: 200 },
    ]
    const slot = nextFreeSlot({ fromSec: 10, toSec: 40 }, occupied)
    assert.deepEqual(slot, { fromSec: 200, toSec: 230 })
    assert.equal(slotIsFree(slot, occupied), true)
  })

  it('leaves an already-free slot exactly where it was', () => {
    const desired = { fromSec: 300, toSec: 360 }
    assert.deepEqual(nextFreeSlot(desired, [{ fromSec: 0, toSec: 60 }]), desired)
  })

  it('only ever moves a slot later — simulated traffic yields, it never cuts in', () => {
    const occupied = [{ fromSec: 100, toSec: 200 }]
    for (let from = 0; from < 300; from += 17) {
      const result = nextFreeSlot({ fromSec: from, toSec: from + 30 }, occupied)
      assert.ok(result.fromSec >= from, `slot moved earlier: ${from} → ${result.fromSec}`)
      assert.equal(slotIsFree(result, occupied), true)
    }
  })
})

describe('assessInTrail', () => {
  const heavyLeaderMediumFollower = {
    leaderDistanceNm: 10,
    leaderWake: 'H' as const,
    followerWake: 'M' as const,
    followerKts: 180,
  }

  it('measures the 1D gap along the approach', () => {
    const result = assessInTrail({ ...heavyLeaderMediumFollower, followerDistanceNm: 18 })
    assert.equal(result.gapNm, 8)
    assert.equal(result.requiredNm, 5)
    assert.equal(result.needsAction, false)
    assert.equal(result.violated, false)
  })

  it('flags a gap inside the buffer as needing action but not yet violated', () => {
    const result = assessInTrail({ ...heavyLeaderMediumFollower, followerDistanceNm: 15.5 })
    assert.equal(result.gapNm, 5.5)
    assert.equal(result.needsAction, true)
    assert.equal(result.violated, false)
  })

  it('flags a busted minimum', () => {
    const result = assessInTrail({ ...heavyLeaderMediumFollower, followerDistanceNm: 14 })
    assert.equal(result.violated, true)
  })

  it('clamps a follower that has somehow passed the leader to a zero gap', () => {
    const result = assessInTrail({ ...heavyLeaderMediumFollower, followerDistanceNm: 5 })
    assert.equal(result.gapNm, 0)
    assert.equal(result.violated, true)
  })

  it('reports how long the gap lasts at the follower speed', () => {
    const result = assessInTrail({ ...heavyLeaderMediumFollower, followerDistanceNm: 19 })
    assert.equal(result.gapSec, gapToTimeSec(9, 180))
  })
})
