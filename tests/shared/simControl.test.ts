import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { parseSimControl } from '~~/shared/utils/simControl'

function expectCommand(input: string) {
  const result = parseSimControl(input)
  assert.equal(result.matched, true, `expected a command for "${input}", got ${JSON.stringify(result)}`)
  return (result as Extract<ReturnType<typeof parseSimControl>, { matched: true }>).command
}

function expectNoMatch(input: string, reason?: string) {
  const result = parseSimControl(input)
  assert.equal(result.matched, false, `expected NO match for "${input}", got ${JSON.stringify(result)}`)
  if (reason) {
    assert.equal((result as Extract<ReturnType<typeof parseSimControl>, { matched: false }>).reason, reason)
  }
}

describe('parseSimControl — approach setup', () => {
  it('parses the canonical roadmap utterance (written form)', () => {
    const cmd = expectCommand('set me up for an approach from 5000 ft to EDDF 07R')
    assert.deepEqual(cmd, {
      type: 'setup_approach',
      airport_icao: 'EDDF',
      runway: '07R',
      altitude_ft: 5000,
    })
  })

  it('parses the same utterance in fully spoken Whisper form', () => {
    const cmd = expectCommand(
      'set me up for an approach from five thousand feet to echo delta delta foxtrot zero seven right',
    )
    assert.deepEqual(cmd, {
      type: 'setup_approach',
      airport_icao: 'EDDF',
      runway: '07R',
      altitude_ft: 5000,
    })
  })

  it('parses an approach without altitude ("runway 26 left" wording)', () => {
    const cmd = expectCommand('set me up for an approach to EDDM runway 26 left')
    assert.deepEqual(cmd, {
      type: 'setup_approach',
      airport_icao: 'EDDM',
      runway: '26L',
    })
  })

  it('parses a final with a distance ("5 mile final")', () => {
    const cmd = expectCommand('put me on a 5 mile final for EDDF 25R')
    assert.deepEqual(cmd, {
      type: 'setup_approach',
      airport_icao: 'EDDF',
      runway: '25R',
      final_distance_nm: 5,
    })
  })

  it('parses a flight-level altitude in an approach setup', () => {
    const cmd = expectCommand('set me up for an approach from flight level 100 to EDDL runway 23')
    assert.deepEqual(cmd, {
      type: 'setup_approach',
      airport_icao: 'EDDL',
      runway: '23',
      altitude_ft: 10000,
    })
  })

  it('rejects an approach altitude without a unit (ambiguous)', () => {
    expectNoMatch('set me up for an approach from 5000 to EDDF 07R', 'missing_unit')
  })

  it('rejects an invalid runway number (40)', () => {
    expectNoMatch('set me up for an approach to EDDF runway 40', 'invalid_runway')
  })

  it('rejects an approach without a runway', () => {
    expectNoMatch('set me up for an approach to EDDF', 'missing_runway')
  })

  it('rejects an approach without an airport', () => {
    expectNoMatch('set me up for an approach runway 25', 'missing_airport')
  })
})

describe('parseSimControl — single-parameter changes', () => {
  it('parses the roadmap altitude wording (bare number is OK — "altitude" names the unit context)', () => {
    const cmd = expectCommand('change my altitude to 8000')
    assert.deepEqual(cmd, { type: 'set_altitude', altitude_ft: 8000 })
  })

  it('parses an altitude given as flight level', () => {
    const cmd = expectCommand('set my altitude to flight level 100')
    assert.deepEqual(cmd, { type: 'set_altitude', altitude_ft: 10000 })
  })

  it('parses a heading change', () => {
    const cmd = expectCommand('change my heading to 270')
    assert.deepEqual(cmd, { type: 'set_heading', heading_deg: 270 })
  })

  it('parses a speed change with unit', () => {
    const cmd = expectCommand('set my speed to 210 knots')
    assert.deepEqual(cmd, { type: 'set_speed', ias_kts: 210 })
  })

  it('parses spoken digits ("change my heading to two seven zero")', () => {
    const cmd = expectCommand('change my heading to two seven zero')
    assert.deepEqual(cmd, { type: 'set_heading', heading_deg: 270 })
  })

  it('rejects a parameter change without a value', () => {
    expectNoMatch('change my altitude', 'missing_value')
  })

  it('rejects an out-of-range altitude', () => {
    expectNoMatch('change my altitude to 80000 feet', 'out_of_range')
  })

  it('rejects an out-of-range heading', () => {
    expectNoMatch('change my heading to 370', 'out_of_range')
  })
})

describe('parseSimControl — must NEVER match ATC dialogue', () => {
  it('does not match a plain ATC readback ("descend to 5000 feet")', () => {
    expectNoMatch('descend to 5000 feet', 'no_intent')
  })

  it('does not match a pilot request ("request descent to flight level 100")', () => {
    expectNoMatch('request descent to flight level 100', 'no_intent')
  })

  it('does not match a clearance readback with runway and callsign', () => {
    expectNoMatch('cleared to land runway 25R Lufthansa 359', 'no_intent')
  })

  it('does not match a squawk instruction ("set squawk 7000")', () => {
    expectNoMatch('set squawk 7000', 'no_intent')
  })

  it('does not match an unanchored altitude mention ("set me up at 8000")', () => {
    expectNoMatch('set me up at 8000')
  })
})
