import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_AIRLINE_TELEPHONY,
  normalizeAtisForSpeech,
  normalizeMetarPhrase,
  normalizeRadioPhrase,
  speakToken,
  spellIcaoDigits,
  spellIcaoLetters,
  toIcaoPhonetic,
} from '~~/shared/utils/radioSpeech'

describe('normalizeRadioPhrase — PM radio pronunciation', () => {
  const opts = {
    expandCallsigns: true,
    expandAirports: true,
    airlineMap: DEFAULT_AIRLINE_TELEPHONY,
    sidSuffixIcao: true,
  }

  it('expands a callsign with a multi-letter suffix (DLH6RK)', () => {
    assert.equal(normalizeRadioPhrase('DLH6RK', opts), 'Lufthansa six Romeo Kilo')
  })

  it('spells a 4-letter ICAO airport code', () => {
    assert.equal(normalizeRadioPhrase('EDDC', opts), spellIcaoLetters('EDDC'))
  })

  it('speaks a bare altitude in a clearance context', () => {
    assert.match(normalizeRadioPhrase('climb initially 5000', opts), /thousand feet$/)
  })

  it('leaves sub-1000 numbers (speeds/headings) untouched', () => {
    assert.equal(normalizeRadioPhrase('maintain 250 knots', opts), 'maintain 250 knots')
  })
})

describe('speakToken', () => {
  it('speaks a runway with its side', () => {
    assert.equal(speakToken('25R'), `${spellIcaoDigits('25')} right`)
  })
  it('speaks a frequency with decimal', () => {
    assert.equal(speakToken('121.800'), `${spellIcaoDigits('121')} decimal ${spellIcaoDigits('800')}`)
  })
  it('speaks a flight level', () => {
    assert.equal(speakToken('FL150'), `flight level ${spellIcaoDigits('150')}`)
  })
  it('spells a pure number digit by digit', () => {
    assert.equal(speakToken('2341'), spellIcaoDigits('2341'))
  })
  it('spells an alphanumeric identifier phonetically', () => {
    assert.equal(speakToken('BIBAX1N'), toIcaoPhonetic('BIBAX1N'))
  })
  it('returns empty for plain words (caller keeps raw)', () => {
    assert.equal(speakToken('west'), '')
  })
})

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

    // SID identifier: the named waypoint is spoken as a word, the number and suffix letter are spelled out
    assert.equal(sid, 'Marun seven Foxtrot')
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

  it('normalizes a full METAR-form ATIS with EDDF (user report sample)', () => {
    const input = 'EDDF ATIS. METAR EDDF 281050Z AUTO 02008KT 320V070 CAVOK 24/02 Q1025 NOSIG. Frequency 118.030'
    const out = normalizeAtisForSpeech(input, {
      airportIcao: 'EDDF',
      airportName: 'Frankfurt am Main',
    })

    // Airport code → city name
    assert.match(out, /Frankfurt am Main atis/)
    assert.doesNotMatch(out, /\bEDDF\b/)
    // ATIS / METAR lowercased so TTS reads as word
    assert.match(out, /\batis\b/)
    assert.match(out, /\bmetar\b/)
    // Date/time DDHHMMZ
    assert.match(out, /on the too eight at wun zero fife zero zulu/)
    // AUTO
    assert.match(out, /automatic observation/)
    // Wind 02008KT
    assert.match(out, /wind zero too zero degrees at zero eight knots/)
    // Wind variability 320V070
    assert.match(out, /variable between tree too zero and zero seven zero degrees/)
    // CAVOK stays as a word
    assert.match(out, /\bCAVOK\b/)
    // Temp/Dewpoint slash form
    assert.match(out, /temperature too four, dewpoint zero too/)
    // QNH Q-form
    assert.match(out, /QNH wun zero too fife/)
    // NOSIG expanded
    assert.match(out, /no significant change/)
    // Frequency normalized
    assert.match(out, /wun wun eight decimal zero tree zero/)
  })

  it('handles wind edge cases (calm, VRB, gusts)', () => {
    assert.match(normalizeAtisForSpeech('00000KT'), /wind calm/)
    assert.match(normalizeAtisForSpeech('VRB05KT'), /wind variable at zero fife knots/)
    assert.match(normalizeAtisForSpeech('28015G25KT'), /wind too eight zero degrees at wun fife knots, gusting too fife knots/)
  })

  it('expands METAR weather phenomena', () => {
    const out = normalizeAtisForSpeech('-RA +TSRA VCSH RERA FZRA BR FG')
    assert.match(out, /light rain/)
    assert.match(out, /heavy thunderstorm rain/)
    assert.match(out, /in the vicinity shower/)
    assert.match(out, /recent rain/)
    assert.match(out, /freezing rain/)
    assert.match(out, /mist/)
    assert.match(out, /fog/)
  })

  it('expands RVR and wind shear', () => {
    const out = normalizeAtisForSpeech('R25L/1500N R07/P2000U R34/M0050 WS R25')
    assert.match(out, /runway too fife left visibility wun fife zero zero meters/)
    assert.match(out, /runway zero seven visibility more than too zero zero zero meters, increasing/)
    assert.match(out, /runway tree four visibility less than zero zero fife zero meters/)
    assert.match(out, /wind shear runway too fife/)
  })

  it('handles cloud cover special codes', () => {
    const out = normalizeAtisForSpeech('NSC SKC CLR NCD VV003')
    assert.match(out, /no significant cloud/)
    assert.match(out, /sky clear/)
    assert.match(out, /no cloud detected/)
    assert.match(out, /vertical visibility tree hundred feet/)
  })

  it('handles trend forecasts and altimeter', () => {
    const out = normalizeAtisForSpeech('BECMG TEMPO FM1230 TL1500 A2992')
    assert.match(out, /becoming/)
    assert.match(out, /temporary/)
    assert.match(out, /from wun too tree zero zulu/)
    assert.match(out, /until wun fife zero zero zulu/)
    assert.match(out, /altimeter too niner niner too/)
  })

  it('strips RMK remarks', () => {
    const out = normalizeAtisForSpeech('Q1013 NOSIG RMK AO2 SLP188 T01510092')
    assert.match(out, /QNH wun zero wun tree/)
    assert.match(out, /no significant change/)
    assert.doesNotMatch(out, /\bRMK\b/)
    assert.doesNotMatch(out, /SLP188/)
  })
})
