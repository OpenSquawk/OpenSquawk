import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeMetarPhrase,
  normalizeRadioPhrase,
  spellIcaoDigits,
  spellIcaoLetters,
  toIcaoPhonetic,
} from '~~/shared/utils/radioSpeech'

describe('radioSpeech', () => {
  it('spells ICAO digits and letters', () => {
    assert.equal(spellIcaoDigits('120'), 'wun too zero')
    assert.equal(spellIcaoLetters('eddf'), 'Echo Delta Delta Foxtrot')
    assert.equal(toIcaoPhonetic('A3'), 'Alfa tree')
  })

  it('normalizes a combined phrase with callsign, runway, frequency and taxi route', () => {
    const normalized = normalizeRadioPhrase('DLH359 contact 121.800, RWY 25R via N3 U4', {
      expandCallsigns: true,
      airlineMap: { DLH: 'Lufthansa' },
    })

    assert.match(normalized, /Lufthansa tree fife niner/)
    assert.match(normalized, /wun too wun decimal eight zero zero/)
    assert.match(normalized, /runway too fife right/)
    assert.match(normalized, /November tree,\s+Uniform four/)
  })

  it('normalizes SID suffix and METAR data', () => {
    const sid = normalizeRadioPhrase('MARUN 7F')
    const metar = normalizeMetarPhrase('EDDF 171450Z 28015G25KT 9999 -RA SCT025 BKN040 15/08 Q1013')

    // SID prefix is spelled phonetically so TTS pronounces unfamiliar waypoint names correctly
    assert.equal(sid, 'Mike Alfa Romeo Uniform November seven Foxtrot')
    assert.match(metar, /wind too eight zero degrees/)
    assert.match(metar, /gusting too fife knots/)
    assert.match(metar, /QNH wun zero wun tree/)
  })
})
