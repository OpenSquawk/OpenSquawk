import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CLASSROOM_DEFAULT_VOICE,
  CLASSROOM_RANDOM_VOICE,
  CLASSROOM_VOICE_OPTIONS,
  CONTROLLER_VOICES,
  PILOT_VOICES,
  RESERVED_VOICES,
  classroomVoiceFor,
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

  it('does not hand every position of a session the same voice (FNV low-bit bias)', () => {
    // Real /live-atc key shapes: shared session prefix, position+frequency
    // suffix. Raw fnv1a % poolSize collapses here — every position got the
    // same voice in 100% of sessions.
    let allSame = 0
    const sessions = 200
    for (let i = 0; i < sessions; i++) {
      const s = `sess${i}-${(i * 2654435761 % 1e9).toString(36)}`
      const voices = [
        `${s}:FRANKFURT MAIN:DEL:122.035`,
        `${s}:FRANKFURT MAIN:GND:121.805`,
        `${s}:FRANKFURT MAIN:TWR:118.780`,
      ].map(k => controllerPersonaFor(k).voice)
      if (voices[0] === voices[1] && voices[1] === voices[2]) allSame++
    }
    // Uniform hashing would give ~6.3% — allow slack, but the 100% failure
    // mode must never come back.
    assert.ok(allSame / sessions < 0.2, `${allSame}/${sessions} sessions had one voice for all positions`)
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

describe('voicePool — classroom voices', () => {
  it('defaults to the standard US speaker', () => {
    assert.equal(CLASSROOM_DEFAULT_VOICE, 'alloy')
    const option = CLASSROOM_VOICE_OPTIONS.find(o => o.id === CLASSROOM_DEFAULT_VOICE)
    assert.ok(option, 'default voice must be selectable')
    assert.equal(option!.accent, 'US')
  })

  it('offers unique selectable ids and the random sentinel is not one of them', () => {
    const ids = CLASSROOM_VOICE_OPTIONS.map(o => o.id)
    assert.equal(new Set(ids).size, ids.length)
    assert.equal(ids.includes(CLASSROOM_RANDOM_VOICE), false)
  })

  it('assigns a stable random voice per module from the selectable set', () => {
    const ids = CLASSROOM_VOICE_OPTIONS.map(o => o.id)
    const seen = new Set<string>()
    for (const module of ['fundamentals', 'readbacks', 'atc-advanced', 'full-flight', 'metar']) {
      const voice = classroomVoiceFor(`classroom:${module}`)
      assert.equal(classroomVoiceFor(`classroom:${module}`), voice, 'must be deterministic')
      assert.ok(ids.includes(voice), `${voice} must be selectable`)
      seen.add(voice)
    }
    assert.ok(seen.size > 1, 'different modules should not all share one voice')
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
