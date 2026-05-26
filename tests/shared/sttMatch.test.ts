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

describe('looksLikeCallsignKey', () => {
  it('detects common callsign field keys', () => {
    assert.equal(looksLikeCallsignKey('callsign'), true)
    assert.equal(looksLikeCallsignKey('rc-callsign'), true)
    assert.equal(looksLikeCallsignKey('tko-callsign'), true)
    assert.equal(looksLikeCallsignKey('runway'), false)
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
