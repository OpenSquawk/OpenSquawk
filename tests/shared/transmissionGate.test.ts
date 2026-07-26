import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { gateTransmission } from '~~/shared/utils/transmissionGate'

const ptt = (transcript: string, extra = {}) =>
  gateTransmission(transcript, { source: 'ptt', minPttWords: 2, ...extra })

const text = (transcript: string, extra = {}) =>
  gateTransmission(transcript, { source: 'text', minPttWords: 2, ...extra })

describe('gateTransmission — content-free PTT is not graded', () => {
  it('drops an empty or whitespace-only transcript', () => {
    for (const t of ['', '   ', '\n']) {
      assert.equal(ptt(t).accept, false, `accepted ${JSON.stringify(t)}`)
      assert.equal(ptt(t).reason, 'empty')
    }
  })

  it('drops punctuation-only output from near-silent audio', () => {
    for (const t of ['.', '...', '?!', '—', '. . .']) {
      const result = ptt(t)
      assert.equal(result.accept, false, `accepted ${JSON.stringify(t)}`)
      assert.equal(result.reason, 'no_speech')
    }
  })

  it('drops a truncated syllable', () => {
    for (const t of ['Lu', 'ah', 'D-']) {
      assert.equal(ptt(t).accept, false, `accepted ${JSON.stringify(t)}`)
    }
  })

  it('drops the phrases Whisper hallucinates on silence', () => {
    for (const t of ['Thank you.', 'thanks for watching', 'Bye.', 'Okay', 'you']) {
      const result = ptt(t)
      assert.equal(result.accept, false, `accepted ${JSON.stringify(t)}`)
      assert.equal(result.reason, 'hallucination')
    }
  })
})

describe('gateTransmission — valid short calls still get through', () => {
  it('accepts standard one-word transmissions', () => {
    for (const t of [
      'roger', 'Roger.', 'wilco', 'affirm', 'affirmative',
      'negative', 'standby', 'mayday',
    ]) {
      assert.equal(ptt(t).accept, true, `dropped ${JSON.stringify(t)}`)
    }
  })

  it('accepts a short call carrying real content', () => {
    for (const t of ['squawk 2341', 'runway 25L', 'say again']) {
      assert.equal(ptt(t).accept, true, `dropped ${JSON.stringify(t)}`)
    }
  })

  it('never gates typed input — a deliberate short command is intended', () => {
    for (const t of ['Lu', 'Okay', 'roger']) {
      assert.equal(text(t).accept, true, `dropped typed ${JSON.stringify(t)}`)
    }
    assert.equal(text('').accept, false, 'empty text should still be dropped')
  })

  it('honours a minimum of 1 word as "gate disabled"', () => {
    assert.equal(ptt('Lu', { minPttWords: 1 }).accept, true)
  })
})

describe('gateTransmission — the current state decides', () => {
  it('grades a bare acknowledgement where a readback is owed', () => {
    // "roger" is not a valid readback of a clearance, but it IS a real
    // transmission: it must reach the engine so ATC can ask for the readback,
    // rather than being silently swallowed.
    const result = ptt('roger', { readbackRequired: ['squawk', 'sid'] })
    assert.equal(result.accept, true)
  })

  it('still drops content-free audio where a readback is owed', () => {
    const result = ptt('...', { readbackRequired: ['squawk'] })
    assert.equal(result.accept, false)
    assert.equal(result.reason, 'no_speech')
  })
})
