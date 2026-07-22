import { describe, it, expect, vi } from 'vitest'
import { postWithLocalFallback } from './useLocalSpeechBridge'

describe('TTS local routing', () => {
  it('uses local audio response when available', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, audio: { base64: 'AAA', mime: 'audio/wav', size: 3, ext: 'wav' } }),
    })) as any)
    const cloud = vi.fn()
    const response = await postWithLocalFallback(
      'http://127.0.0.1:8765/api/atc/say',
      { text: 'x', preNormalized: true },
      cloud as any,
    )
    expect(response.audio.base64).toBe('AAA')
    expect(cloud).not.toHaveBeenCalled()
  })
})
