import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_READBACK_SILENCE_MS,
  silenceWindowFor,
} from '~~/shared/utils/silenceTimer'

describe('silenceWindowFor', () => {
  it('arms the flow-authored window on an auto-advance state', () => {
    const window = silenceWindowFor({
      auto_advance_on_silence: true,
      auto_advance_timeout_ms: 45000,
    })
    assert.deepEqual(window, { kind: 'auto_advance', ms: 45000 })
  })

  // The bug: a readback state carries no auto_advance_timeout_ms, so nothing
  // was ever armed and ATC never asked again when the readback did not come.
  it('arms a readback state, which has no auto-advance window of its own', () => {
    const window = silenceWindowFor({
      readback_required: ['squawk', 'sid'],
      readback_silence_ms: 12000,
    })
    assert.deepEqual(window, { kind: 'readback', ms: 12000 })
  })

  it('chases a missing readback far sooner than an auto-advance', () => {
    const readback = silenceWindowFor({
      readback_required: ['runway'],
      readback_silence_ms: 12000,
    })!
    const autoAdvance = silenceWindowFor({
      auto_advance_on_silence: true,
      auto_advance_timeout_ms: 45000,
    })!
    assert.ok(readback.ms < autoAdvance.ms)
    assert.ok(readback.ms >= 10_000 && readback.ms <= 15_000, `${readback.ms}ms`)
  })

  it('falls back to the built-in window when the server published none', () => {
    const window = silenceWindowFor({ readback_required: ['runway'] })
    assert.equal(window?.ms, DEFAULT_READBACK_SILENCE_MS)
  })

  it('arms nothing where the pilot holds the next transmission', () => {
    assert.equal(silenceWindowFor({}), null)
    assert.equal(silenceWindowFor({ readback_required: [] }), null)
    assert.equal(silenceWindowFor(null), null)
    assert.equal(silenceWindowFor(undefined), null)
  })

  it('prefers the auto-advance window when a state somehow has both', () => {
    const window = silenceWindowFor({
      auto_advance_on_silence: true,
      auto_advance_timeout_ms: 45000,
      readback_required: ['runway'],
      readback_silence_ms: 12000,
    })
    assert.equal(window?.kind, 'auto_advance')
  })

  it('never arms a timer that would fire immediately', () => {
    assert.equal(silenceWindowFor({ readback_required: ['x'], readback_silence_ms: 0 })?.ms, 1000)
    assert.equal(
      silenceWindowFor({ auto_advance_on_silence: true, auto_advance_timeout_ms: -5 })?.ms,
      1000,
    )
  })
})
