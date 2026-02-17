import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { atcReplyPrompt, atcSeedPrompt, atcSystemPrompt, normalizeATC } from '~~/server/utils/normalize'

describe('normalize smoke', () => {
  it('builds prompt templates with key context', () => {
    const systemPrompt = atcSystemPrompt({ regionHint: 'EUR' })
    const seedPrompt = atcSeedPrompt({
      airport: 'EDDF',
      aircraft: 'A320',
      type: 'IFR',
      stand: 'V155',
      dep: 'EHAM',
      runway: '25R',
      phase: 'taxi',
    })
    const replyPrompt = atcReplyPrompt('DLH359 ready for departure RWY 25R', {
      airport: 'EDDF',
      runway: '25R',
      phase: 'lineup',
      lastFreq: '121.800',
    })

    assert.match(systemPrompt, /OUTPUT RULES \(STRICT\):/)
    assert.match(seedPrompt, /Airport EDDF/)
    assert.match(seedPrompt, /Phase: taxi/)
    assert.match(replyPrompt, /Pilot said: "DLH359 ready for departure RWY 25R"/)
    assert.match(replyPrompt, /Phase: lineup/)
  })

  it('normalizes ICAO phrase fragments for TTS pipeline', () => {
    const normalized = normalizeATC('DLH359, taxi RWY 25R via N3 U4')

    assert.match(normalized, /Lufthansa tree fife niner/)
    assert.match(normalized, /runway too fife right/)
    assert.match(normalized, /November tree Uniform four/)
  })
})
