import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CONTROLLER_VOICES,
  PILOT_VOICES,
  RESERVED_VOICES,
  controllerPersonaFor,
  controllerVoiceFor,
  fnv1a,
  pilotVoiceFor,
  transmissionSpeed,
  voiceFromPool,
} from '~~/shared/utils/voicePool'

describe('voicePool — partitions', () => {
  it('keeps the controller and pilot partitions disjoint', () => {
    const overlap = CONTROLLER_VOICES.filter(v => PILOT_VOICES.includes(v))
    assert.deepEqual(overlap, [], 'a simulated pilot must never sound like the controller')
  })

  it('never hands a reserved voice to a simulated pilot', () => {
    for (const reserved of RESERVED_VOICES) {
      assert.equal(PILOT_VOICES.includes(reserved), false, `${reserved} is reserved`)
    }
  })
})

describe('voicePool — assignment', () => {
  it('is deterministic: the same callsign always gets the same voice', () => {
    const first = pilotVoiceFor('DLH472')
    for (let i = 0; i < 20; i++) {
      assert.equal(pilotVoiceFor('DLH472'), first)
    }
  })

  it('ignores callsign casing', () => {
    assert.equal(pilotVoiceFor('dlh472'), pilotVoiceFor('DLH472'))
  })

  it('only ever returns voices from the pilot pool', () => {
    for (let n = 100; n < 400; n++) {
      assert.ok(PILOT_VOICES.includes(pilotVoiceFor(`BAW${n}`)))
    }
  })

  it('spreads a realistic callsign set over most of the pool', () => {
    const callsigns = ['DLH472', 'BAW118', 'EZY93A', 'RYR4021', 'KLM61', 'AFR1234', 'THY7', 'SWR88']
    const used = new Set(callsigns.map(cs => pilotVoiceFor(cs)))
    assert.ok(used.size >= 4, `expected varied voices, got ${[...used].join(', ')}`)
  })

  it('skips a reserved voice instead of failing', () => {
    // Reserve everything but one entry — every key must land on the survivor.
    const survivor = PILOT_VOICES[2]!
    const reserved = PILOT_VOICES.filter(v => v !== survivor)
    for (const cs of ['DLH1', 'BAW2', 'EZY3', 'RYR4']) {
      assert.equal(voiceFromPool(cs, PILOT_VOICES, reserved), survivor)
    }
  })

  it('falls back to the raw pool if everything is reserved', () => {
    const voice = voiceFromPool('DLH472', PILOT_VOICES, PILOT_VOICES)
    assert.ok(PILOT_VOICES.includes(voice))
  })

  it('throws on an empty pool rather than returning undefined', () => {
    assert.throws(() => voiceFromPool('DLH472', []), /empty voice pool/)
  })

  it('assigns controller voices from the controller partition (multi-voice)', () => {
    for (const position of ['EDDF_TWR', 'EDDF_GND', 'EDDF_APP', 'EDDF_DEL']) {
      assert.ok(CONTROLLER_VOICES.includes(controllerVoiceFor(position)))
    }
  })
})

describe('voicePool — controller personas', () => {
  it('is deterministic for the same position key', () => {
    const first = controllerPersonaFor('sess1:EDDF:TWR:118.775')
    for (let i = 0; i < 10; i++) {
      assert.deepEqual(controllerPersonaFor('sess1:EDDF:TWR:118.775'), first)
    }
  })

  it('uses a controller-partition voice and a base speed in [1.1, 1.3]', () => {
    for (const key of ['s:EDDF:TWR', 's:EDDF:GND', 's:EDDM:APP', 's:EDDB:DEL', 'x:EDDF:TWR']) {
      const persona = controllerPersonaFor(key)
      assert.ok(CONTROLLER_VOICES.includes(persona.voice), `${key} → ${persona.voice}`)
      assert.ok(persona.baseSpeed >= 1.1 && persona.baseSpeed <= 1.3, `${key} → ${persona.baseSpeed}`)
    }
  })

  it('gives different sessions a different shift of controllers', () => {
    const keys = ['EDDF:DEL', 'EDDF:GND', 'EDDF:TWR', 'EDDF:APP']
    const shiftA = keys.map(k => controllerPersonaFor(`sessionA:${k}`))
    const shiftB = keys.map(k => controllerPersonaFor(`sessionB:${k}`))
    assert.notDeepEqual(shiftA, shiftB)
  })

  it('jitters the transmission speed within ±0.05 of base', () => {
    for (let i = 0; i < 50; i++) {
      const speed = transmissionSpeed(1.2)
      assert.ok(speed >= 1.15 - 1e-9 && speed <= 1.25 + 1e-9, `jittered to ${speed}`)
    }
  })

  it('transmission speeds actually vary', () => {
    const speeds = new Set(Array.from({ length: 30 }, () => transmissionSpeed(1.2)))
    assert.ok(speeds.size > 1, 'expected jitter, got a constant')
  })
})

describe('voicePool — fnv1a', () => {
  it('matches the reference vectors', () => {
    assert.equal(fnv1a(''), 0x811c9dc5)
    assert.equal(fnv1a('a'), 0xe40c292c)
    assert.equal(fnv1a('foobar'), 0xbf9cf968)
  })

  it('stays inside the unsigned 32-bit range', () => {
    for (const s of ['DLH472', 'a very long callsign string that is not one', 'ß∆']) {
      const h = fnv1a(s)
      assert.ok(Number.isInteger(h) && h >= 0 && h <= 0xffffffff, `${s} → ${h}`)
    }
  })
})
