import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolveSpeachesVoice, SPEACHES_VOICE_MAP } from '~~/server/utils/voiceRegistry'

const fallback = { model: 'speaches-ai/piper-de_DE-thorsten-medium', voice: 'de_DE-thorsten-medium' }

describe('resolveSpeachesVoice', () => {
  it('maps every pool voice to a matching piper model/voice pair', () => {
    for (const [logical, mapped] of Object.entries(SPEACHES_VOICE_MAP)) {
      const result = resolveSpeachesVoice(logical, fallback)
      assert.equal(result.voice, mapped.voice)
      assert.equal(result.model, `speaches-ai/piper-${mapped.voice}`)
    }
  })

  it('maps the default controller voice to an English speaker', () => {
    const result = resolveSpeachesVoice('alloy', fallback)
    assert.match(result.voice, /^en_/)
  })

  it('is case-insensitive and trims', () => {
    const result = resolveSpeachesVoice('  Alloy ', fallback)
    assert.equal(result.voice, SPEACHES_VOICE_MAP.alloy!.voice)
  })

  it('falls back to the configured pair for unknown ids', () => {
    assert.deepEqual(resolveSpeachesVoice('somepipervoice', fallback), fallback)
    assert.deepEqual(resolveSpeachesVoice('', fallback), fallback)
  })

  it('keeps controller and pilot voices audibly disjoint', () => {
    const controller = ['alloy', 'echo', 'onyx', 'sage'].map(v => resolveSpeachesVoice(v, fallback).voice)
    const pilots = ['verse', 'ash', 'ballad', 'coral', 'fable', 'nova', 'shimmer']
      .map(v => resolveSpeachesVoice(v, fallback).voice)
    for (const voice of controller) {
      assert.equal(pilots.includes(voice), false, `${voice} used for both controller and pilot`)
    }
  })
})
