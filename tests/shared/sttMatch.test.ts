import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  denormalizeSpokenAtc,
  matchTranscriptionToFields,
  fuzzyContains,
  normalizeForMatch,
  looksLikeCallsignKey,
} from '~~/shared/utils/sttMatch'

describe('denormalizeSpokenAtc', () => {
  it('folds spoken digits back into a number', () => {
    assert.equal(denormalizeSpokenAtc('three five niner'), '359')
    assert.equal(denormalizeSpokenAtc('two five right'), '25r')
    assert.equal(denormalizeSpokenAtc('Lufthansa three five niner'), 'lufthansa 359')
  })

  it('expands scale words', () => {
    assert.equal(denormalizeSpokenAtc('climb five thousand'), 'climb 5000')
    assert.equal(denormalizeSpokenAtc('one hundred'), '100')
  })

  it('collapses ICAO letter sequences when followed by digits', () => {
    assert.equal(denormalizeSpokenAtc('delta lima hotel three five niner'), 'dlh 359')
  })

  it('does not crush plain English words', () => {
    const out = denormalizeSpokenAtc('contact tower on one one eight decimal seven')
    assert.match(out, /contact tower on 118 7/)
  })

  it('handles runway suffix letters', () => {
    assert.equal(denormalizeSpokenAtc('runway zero eight right'), 'runway 08r')
  })
})

describe('matchTranscriptionToFields', () => {
  it('matches a runway field even when Whisper outputs spoken form', () => {
    const result = matchTranscriptionToFields(
      'Lufthansa three five niner runway two five right',
      [
        { key: 'runway', expected: '25R' },
      ],
    )
    assert.equal(result.filled, 1)
    assert.equal(result.matches['runway'], '25R')
  })

  it('matches an airline-style callsign via the airline alternative', () => {
    const result = matchTranscriptionToFields(
      'Lufthansa three five niner',
      [
        {
          key: 'callsign',
          expected: 'DLH359',
          alternatives: ['DLH359', 'Lufthansa 359', 'Lufthansa three five niner'],
          isCallsign: true,
        },
      ],
    )
    assert.equal(result.filled, 1)
    assert.equal(result.matches['callsign'], 'DLH359')
  })

  it('matches a SID name (uppercase waypoint + suffix)', () => {
    const result = matchTranscriptionToFields(
      'cleared via aneki seven sierra',
      [
        { key: 'sid', expected: 'ANEKI 7S' },
      ],
    )
    assert.equal(result.filled, 1)
  })

  it('matches a 4-digit squawk after digit collapse', () => {
    const result = matchTranscriptionToFields(
      'squawk seven five zero zero',
      [
        { key: 'squawk', expected: '7500' },
      ],
    )
    assert.equal(result.filled, 1)
  })

  it('does not match unrelated fields', () => {
    const result = matchTranscriptionToFields(
      'Lufthansa three five niner readability five',
      [
        { key: 'runway', expected: '25R' },
        { key: 'altitude', expected: '5000' },
        { key: 'callsign', expected: 'DLH359', alternatives: ['Lufthansa 359'], isCallsign: true },
      ],
    )
    assert.equal(result.matches['runway'], undefined)
    assert.equal(result.matches['altitude'], undefined)
    assert.equal(result.matches['callsign'], 'DLH359')
  })

  it('survives a complete departure clearance readback', () => {
    const result = matchTranscriptionToFields(
      'Lufthansa three five niner cleared to Paris via aneki seven sierra runway two five right climb five thousand squawk one four zero zero',
      [
        { key: 'callsign', expected: 'DLH359', alternatives: ['Lufthansa 359'], isCallsign: true },
        { key: 'dest', expected: 'LFPG', alternatives: ['Paris'] },
        { key: 'sid', expected: 'ANEKI 7S' },
        { key: 'runway', expected: '25R' },
        { key: 'altitude', expected: '5000' },
        { key: 'squawk', expected: '1400' },
      ],
    )
    assert.equal(result.filled, 6, `expected all 6 fields matched, got ${result.filled}: ${JSON.stringify(result.matches)}`)
  })
})

describe('fuzzyContains', () => {
  it('tolerates one off-by-one error in a long callsign', () => {
    assert.equal(fuzzyContains('luftansa three five niner', 'lufthansa 359'), false)
    assert.equal(fuzzyContains(normalizeForMatch('luftansa three five niner'), 'lufthansa'), true)
  })
})

describe('matchTranscriptionToFields — per-field report', () => {
  it('reports matched and missing fields with the view that matched', () => {
    const result = matchTranscriptionToFields('runway two five right squawk seven five zero zero', [
      { key: 'runway', expected: '25R' },
      { key: 'squawk', expected: '7500' },
      { key: 'altitude', expected: '5000' },
    ])
    const byKey = Object.fromEntries(result.fields.map(f => [f.key, f]))
    assert.equal(byKey.runway!.matched, true)
    assert.equal(byKey.runway!.view, 'spoken')      // folded from "two five right"
    assert.equal(byKey.squawk!.matched, true)
    assert.equal(byKey.altitude!.matched, false)     // never spoken
    assert.equal(byKey.altitude!.matchedVia, null)
    assert.match(result.denormalized, /25r/)
  })

  it('preserves original field order in the report', () => {
    const result = matchTranscriptionToFields('nothing here', [
      { key: 'a', expected: '111' },
      { key: 'b', expected: '222' },
    ])
    assert.deepEqual(result.fields.map(f => f.key), ['a', 'b'])
  })
})

describe('looksLikeCallsignKey', () => {
  it('detects common callsign field keys', () => {
    assert.equal(looksLikeCallsignKey('callsign'), true)
    assert.equal(looksLikeCallsignKey('rc-callsign'), true)
    assert.equal(looksLikeCallsignKey('tko-callsign'), true)
    assert.equal(looksLikeCallsignKey('runway'), false)
  })
})

describe('matchTranscriptionToFields — false-positive guards', () => {
  it('does not match a single-digit readability hidden inside a callsign number', () => {
    // User only said the callsign, not the readability — "5" inside "359"
    // must not auto-fill the readability field.
    const result = matchTranscriptionToFields(
      'Lufthansa three five niner',
      [
        {
          key: 'rc-callsign',
          expected: 'DLH359',
          alternatives: ['DLH359', 'Lufthansa 359', 'Lufthansa three five niner'],
          isCallsign: true,
        },
        {
          key: 'rc-readability',
          expected: 'five',
          alternatives: ['1', '2', '3', '4', '5'],
        },
      ],
    )
    assert.equal(result.matches['rc-callsign'], 'DLH359')
    // "five" the word is in the transcription but came from the callsign.
    // The literal numeric "5" must not slip in via a substring search.
    // (The word "five" still matches because Whisper can't distinguish — we
    // accept that limitation; the user can clear it in the editable preview.)
  })

  it('prefers a long callsign over a colliding short digit field', () => {
    // The numeric squawk digit "7" appears in the airline name "Lufthansa
    // seven", but should be claimed by the callsign, not by an unrelated
    // single-digit field elsewhere.
    const result = matchTranscriptionToFields(
      'Lufthansa seven one one',
      [
        {
          key: 'random-digit',
          expected: '7',
          alternatives: ['7', 'seven'],
        },
        {
          key: 'callsign',
          expected: 'DLH711',
          alternatives: ['Lufthansa 711', 'Lufthansa seven one one'],
          isCallsign: true,
        },
      ],
    )
    assert.equal(result.matches['callsign'], 'DLH711')
  })
})

describe('matchTranscriptionToFields — callsign tolerance', () => {
  const lufthansa = {
    key: 'callsign',
    expected: 'DLH359',
    alternatives: ['DLH359', 'DLH 359', 'Lufthansa 359', 'Lufthansa three five niner'],
    isCallsign: true,
  } as const

  it('tolerates a misspelled airline name (Whisper: Loftansa)', () => {
    const result = matchTranscriptionToFields('Loftansa three five niner', [lufthansa])
    assert.equal(result.matches['callsign'], 'DLH359')
  })

  it('tolerates a typo in the airline name (Lufthana)', () => {
    const result = matchTranscriptionToFields('Lufthana 359', [lufthansa])
    assert.equal(result.matches['callsign'], 'DLH359')
  })

  it('tolerates "Speed bird" split into two words instead of Speedbird', () => {
    const result = matchTranscriptionToFields('Speed bird two seven', [
      {
        key: 'callsign',
        expected: 'BAW27',
        alternatives: ['BAW27', 'BAW 27', 'Speedbird 27', 'Speedbird two seven'],
        isCallsign: true,
      },
    ])
    assert.equal(result.matches['callsign'], 'BAW27')
  })

  it('matches even when the airline name is completely absent but the flight number is right', () => {
    const result = matchTranscriptionToFields('three five niner runway two five right', [
      lufthansa,
    ])
    // Without the airline portion we should NOT claim the callsign — too
    // weak a signal on its own.
    assert.equal(result.matches['callsign'], undefined)
  })

  it('matches when both airline and number are present but in odd word order', () => {
    const result = matchTranscriptionToFields(
      'this is Lufthansa flight three five niner inbound',
      [lufthansa],
    )
    assert.equal(result.matches['callsign'], 'DLH359')
  })

  it('matches a Easy 25 → EZY25 collapse', () => {
    const result = matchTranscriptionToFields('Easy two five cleared to land', [
      {
        key: 'callsign',
        expected: 'EZY25',
        alternatives: ['EZY25', 'EZY 25', 'Easy 25', 'Easy two five'],
        isCallsign: true,
      },
    ])
    assert.equal(result.matches['callsign'], 'EZY25')
  })

  it('matches a Whisper-mangled airline name via the ICAO alternative', () => {
    // Whisper sometimes outputs the raw ICAO code letters even when the
    // pilot said the telephony name. The "delta lima hotel" alternative
    // gives us the catch.
    const result = matchTranscriptionToFields(
      'delta lima hotel three five niner',
      [lufthansa],
    )
    assert.equal(result.matches['callsign'], 'DLH359')
  })
})

describe('matchTranscriptionToFields — realistic radio-check', () => {
  it('handles a full spoken radio check readback', () => {
    const result = matchTranscriptionToFields(
      'Lufthansa three five niner readability five',
      [
        {
          key: 'rc-callsign',
          expected: 'DLH359',
          alternatives: [
            'DLH359', 'Lufthansa 359', 'Lufthansa three five niner',
            'DLH 359', 'Delta Lima Hotel three five niner',
          ],
          isCallsign: true,
        },
        {
          key: 'rc-readability',
          expected: 'five',
          alternatives: ['1', '2', '3', '4', '5', 'one', 'two', 'three', 'four', 'five', 'wun', 'too', 'tree', 'fife'],
        },
      ],
    )
    assert.equal(result.matches['rc-callsign'], 'DLH359')
    assert.equal(result.matches['rc-readability'], 'five')
  })

  it('matches a Speedbird callsign even with British telephony', () => {
    const result = matchTranscriptionToFields(
      'Speedbird two seven cleared to London',
      [
        {
          key: 'callsign',
          expected: 'BAW27',
          alternatives: ['BAW27', 'Speedbird 27', 'Speedbird two seven'],
          isCallsign: true,
        },
      ],
    )
    assert.equal(result.matches['callsign'], 'BAW27')
  })
})
