import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { AUTO_TUNE_DELAY_MS, planAutoTune } from '~~/shared/utils/autoTune'

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
