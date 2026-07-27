import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { AUTO_TUNE_DELAY_MS, createAutoTuneScheduler, planAutoTune } from '~~/shared/utils/autoTune'

const plan = (over: Partial<Parameters<typeof planAutoTune>[0]> = {}) =>
  planAutoTune({ enabled: true, active: '118.700', expected: '121.800', ...over })

describe('planAutoTune', () => {
  it('tunes to the frequency the new state expects', () => {
    const result = plan()
    assert.equal(result?.frequency, '121.800')
    assert.equal(result?.delayMs, AUTO_TUNE_DELAY_MS)
  })

  it('announces the change before making it', () => {
    assert.equal(plan()?.announcement, 'OpenSquawk changing frequency to 121.800')
  })

  it('does nothing when the setting is off', () => {
    assert.equal(plan({ enabled: false }), null)
  })

  it('does nothing when already on the expected frequency', () => {
    assert.equal(plan({ active: '121.800' }), null)
  })

  it('treats a comma decimal and stray spacing as the same frequency', () => {
    assert.equal(plan({ active: '121,800', expected: ' 121.800 ' }), null)
  })

  it('leaves the pilot alone on any frequency the position publishes', () => {
    const result = plan({
      active: '118.500',
      expected: '118.700',
      accepted: ['118.700', '118.500'],
    })
    assert.equal(result, null)
  })

  it('tunes when on none of the published frequencies', () => {
    const result = plan({
      active: '121.800',
      expected: '118.700',
      accepted: ['118.700', '118.500'],
    })
    assert.equal(result?.frequency, '118.700')
  })

  it('does nothing where the state expects no frequency', () => {
    assert.equal(plan({ expected: undefined }), null)
    assert.equal(plan({ expected: '' }), null)
  })

  // The two cases that must never tune. Both leave the session resting on the
  // state that still expects the frequency already dialled in, so "expected
  // equals active" is what actually guards them.
  it('does not tune while the frequency readback is still owed', () => {
    // Still on the handoff readback state: it belongs to the current position.
    assert.equal(plan({ active: '118.700', expected: '118.700' }), null)
  })

  it('does not tune after a wrong frequency readback', () => {
    // A wrong readback loops back to the same state — same frequency, no change.
    assert.equal(plan({ active: '118.700', expected: '118.700' }), null)
  })
})

describe('createAutoTuneScheduler — the wait between announcing and tuning', () => {
  function harness(over: Partial<Parameters<typeof planAutoTune>[0]> = {}) {
    const calls = { announced: [] as string[], tuned: [] as string[], cancelled: [] as string[] }
    let sessionId: string | null = 'session-1'
    let active = '118.700'
    let fire: (() => void) | null = null
    let delay = 0

    const scheduler = createAutoTuneScheduler({
      announce: t => calls.announced.push(t),
      tune: f => { calls.tuned.push(f); active = f },
      currentSessionId: () => sessionId,
      currentActive: () => active,
      onCancelled: r => calls.cancelled.push(r),
      setTimeoutFn: (fn, ms) => { fire = fn; delay = ms; return 1 },
      clearTimeoutFn: () => { fire = null },
    })

    return {
      calls,
      scheduler,
      get delay() { return delay },
      run: () => { const f = fire; fire = null; f?.() },
      endSession: () => { sessionId = null },
      tuneManually: (f: string) => { active = f },
      schedule: (extra: Record<string, unknown> = {}) => scheduler.schedule({
        enabled: true, active, expected: '121.800', ...over, ...extra,
      } as any),
    }
  }

  it('announces immediately and tunes only after the delay', () => {
    const h = harness()
    h.schedule()
    assert.deepEqual(h.calls.announced, ['OpenSquawk changing frequency to 121.800'])
    assert.deepEqual(h.calls.tuned, [], 'tuned before the announcement was heard')
    assert.equal(h.delay, AUTO_TUNE_DELAY_MS)

    h.run()
    assert.deepEqual(h.calls.tuned, ['121.800'])
  })

  it('says nothing at all when no change is due', () => {
    const h = harness()
    assert.equal(h.schedule({ active: '121.800' }), null)
    assert.deepEqual(h.calls.announced, [])
    assert.equal(h.scheduler.pending, false)
  })

  it('drops the change when the pilot tunes the radio first', () => {
    const h = harness()
    h.schedule()
    h.tuneManually('119.500')
    h.run()
    assert.deepEqual(h.calls.tuned, [], 'overrode the pilot')
    assert.deepEqual(h.calls.cancelled, ['tuned_manually'])
  })

  it('drops the change when the session ended while waiting', () => {
    const h = harness()
    h.schedule()
    h.endSession()
    h.run()
    assert.deepEqual(h.calls.tuned, [])
    assert.deepEqual(h.calls.cancelled, ['session_changed'])
  })

  it('a second handoff supersedes the first rather than tuning twice', () => {
    const h = harness()
    h.schedule()
    h.schedule({ expected: '131.150' })
    assert.deepEqual(h.calls.cancelled, ['superseded'])
    h.run()
    assert.deepEqual(h.calls.tuned, ['131.150'], 'tuned to the stale frequency')
  })

  it('cancel() stops a pending change', () => {
    const h = harness()
    h.schedule()
    assert.equal(h.scheduler.pending, true)
    h.scheduler.cancel()
    assert.equal(h.scheduler.pending, false)
    h.run()
    assert.deepEqual(h.calls.tuned, [])
  })
})
