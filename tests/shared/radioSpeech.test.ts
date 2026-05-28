import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeAtisForSpeech,
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

  it('normalizes a full VATSIM ATIS into ICAO phraseology', () => {
    const eddmAtis = `MUENCHEN INFORMATION A AUTOMATIC MET REPORT TIME 0620 EXPECT VECTORS FOR INDEPENDENT PARALLEL ILS APPROACH RUNWAY 08L AND 08R RUNWAYS IN USE 08L AND 08R TRL 60 WIND 030 DEGREES 4 KNOTS VARIABLE BETWEEN 340 AND 060 DEGREES CAVOK TEMPERATURE 18 DEW POINT 7 QNH 1024 TREND NOSIG MUENCHEN INFORMATION A OUT`
    const spoken = normalizeAtisForSpeech(eddmAtis)

    assert.match(spoken, /Information Alfa/)
    assert.match(spoken, /time zero six too zero/)
    assert.match(spoken, /wind zero tree zero/)
    assert.match(spoken, /four knots/)
    assert.match(spoken, /between tree four zero and zero six zero degrees/)
    assert.match(spoken, /runway zero eight left/)
    assert.match(spoken, /zero eight right/)
    assert.match(spoken, /transition level six zero/)
    assert.match(spoken, /temperature wun eight/)
    assert.match(spoken, /dew point seven/)
    assert.match(spoken, /QNH wun zero too four/)
    assert.match(spoken, /no significant change/)
    assert.doesNotMatch(spoken, /\bNOSIG\b/)
    assert.doesNotMatch(spoken, /\bTRL 60\b/)
    assert.doesNotMatch(spoken, /TEMPERATURE 18/)
  })

  it('normalizes ATIS cloud layers', () => {
    const out = normalizeAtisForSpeech('BKN030 SCT025 FEW005 CB OVC100')
    assert.match(out, /broken tree thousand/)
    assert.match(out, /scattered too thousand five hundred/)
    assert.match(out, /few five hundred cumulonimbus/)
    assert.match(out, /overcast wun zero thousand/)
  })

  it('normalizes negative temperatures and low QNH', () => {
    const out = normalizeAtisForSpeech('TEMPERATURE -5 DEW POINT -12 QNH 0995')
    assert.match(out, /temperature minus fife/)
    assert.match(out, /dew point minus wun too/)
    assert.match(out, /QNH zero niner niner fife/)
  })

  it('normalizes visibility in km and meters', () => {
    const out = normalizeAtisForSpeech('VIS 10 KM VIS 5000 M VISIBILITY 1500 M')
    assert.match(out, /visibility wun zero kilometers/)
    assert.match(out, /fife thousand meters/)
    assert.match(out, /wun thousand five hundred meters/)
  })
})
