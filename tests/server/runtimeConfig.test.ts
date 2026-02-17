import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { getServerRuntimeConfig, resetServerRuntimeConfigCache } from '~~/server/utils/runtimeConfig'

describe('runtimeConfig', () => {
  it('parses env-driven runtime values and applies defaults', () => {
    process.env.OPENAI_API_KEY = '  key-123  '
    process.env.OPENAI_PROJECT = '  proj-1  '
    process.env.OPENAI_BASE_URL = '  https://api.openai.local/v1  '
    process.env.OPENAI_LLM_MODEL = '  gpt-5-mini  '
    process.env.OPENAI_TTS_MODEL = '  tts-2  '
    process.env.OPENAI_VOICE_ID = '  nova  '
    process.env.OPENAIP_API_KEY = '  oaip-1  '
    process.env.USE_PIPER = 'yes'
    process.env.PIPER_PORT = '7002'
    process.env.USE_SPEACHES = 'off'
    process.env.SPEACHES_BASE_URL = '  http://localhost:7777  '
    process.env.SPEECH_MODEL_ID = '  custom/model  '

    resetServerRuntimeConfigCache()
    const config = getServerRuntimeConfig()

    assert.equal(config.openaiKey, 'key-123')
    assert.equal(config.openaiProject, 'proj-1')
    assert.equal(config.openaiBaseUrl, 'https://api.openai.local/v1')
    assert.equal(config.llmModel, 'gpt-5-mini')
    assert.equal(config.ttsModel, 'tts-2')
    assert.equal(config.voiceId, 'nova')
    assert.equal(config.openaipApiKey, 'oaip-1')
    assert.equal(config.usePiper, true)
    assert.equal(config.piperPort, 7002)
    assert.equal(config.useSpeaches, false)
    assert.equal(config.speachesBaseUrl, 'http://localhost:7777')
    assert.equal(config.speechModelId, 'custom/model')
  })

  it('caches values until reset is called', () => {
    process.env.OPENAI_LLM_MODEL = 'gpt-cached-a'
    resetServerRuntimeConfigCache()
    const first = getServerRuntimeConfig()

    process.env.OPENAI_LLM_MODEL = 'gpt-cached-b'
    const second = getServerRuntimeConfig()
    assert.equal(first.llmModel, 'gpt-cached-a')
    assert.equal(second.llmModel, 'gpt-cached-a')

    resetServerRuntimeConfigCache()
    const third = getServerRuntimeConfig()
    assert.equal(third.llmModel, 'gpt-cached-b')
  })

  it('falls back for invalid booleans and number values', () => {
    process.env.USE_PIPER = 'not-a-bool'
    process.env.USE_SPEACHES = ''
    process.env.PIPER_PORT = 'invalid-port'

    resetServerRuntimeConfigCache()
    const config = getServerRuntimeConfig()

    assert.equal(config.usePiper, false)
    assert.equal(config.useSpeaches, false)
    assert.equal(config.piperPort, 5001)
  })
})
