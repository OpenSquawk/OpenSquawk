import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ATIS_SPEACHES_VOICE,
  resolveSpeachesVoice,
  SPEACHES_VOICE_MAP,
} from '~~/server/utils/voiceRegistry'

const fallback = { model: 'speaches-ai/piper-de_DE-thorsten-medium', voice: 'de_DE-thorsten-medium' }

describe('resolveSpeachesVoice', () => {
  it('maps every pool voice to a fast English Piper speaker', () => {
    for (const [logical, mapped] of Object.entries(SPEACHES_VOICE_MAP)) {
      const result = resolveSpeachesVoice(logical, fallback)
      assert.deepEqual(result, mapped)
      // Piper only — Kokoro generation was slow enough to delay ATC replies.
      assert.equal(result.model, `speaches-ai/piper-${result.voice}`)
      assert.match(result.voice, /^en_/)
    }
  })

  it('keeps the default controller voice on the standard US speaker', () => {
    assert.equal(resolveSpeachesVoice('alloy', fallback).voice, 'en_US-ryan-medium')
  })

  it('is case-insensitive and trims', () => {
    const result = resolveSpeachesVoice('  Alloy ', fallback)
    assert.deepEqual(result, SPEACHES_VOICE_MAP.alloy)
  })

  it('falls back to the configured pair for unknown ids', () => {
    assert.deepEqual(resolveSpeachesVoice('somepipervoice', fallback), fallback)
    assert.deepEqual(resolveSpeachesVoice('', fallback), fallback)
  })

  it('gives the ATIS broadcast its own dedicated speaker', () => {
    const atis = resolveSpeachesVoice('verse', fallback, 'atis')
    assert.deepEqual(atis, ATIS_SPEACHES_VOICE)
    const allPoolVoices = Object.values(SPEACHES_VOICE_MAP).map(v => v.voice)
    assert.equal(allPoolVoices.includes(atis.voice), false, 'ATIS voice must not be in any pool')
  })

  it('keeps controller and pilot voices audibly disjoint', () => {
    const controller = ['alloy', 'echo', 'onyx', 'sage'].map(v => resolveSpeachesVoice(v, fallback).voice)
    const pilots = ['verse', 'ash', 'ballad', 'coral', 'fable', 'nova', 'shimmer']
      .map(v => resolveSpeachesVoice(v, fallback).voice)
    for (const voice of controller) {
      assert.equal(pilots.includes(voice), false, `${voice} used for both controller and pilot`)
    }
  })

  it('assigns no speaker twice across the whole registry', () => {
    const voices = [...Object.values(SPEACHES_VOICE_MAP).map(v => v.voice), ATIS_SPEACHES_VOICE.voice]
    assert.equal(new Set(voices).size, voices.length, `duplicate speaker in ${voices.join(', ')}`)
  })
})
