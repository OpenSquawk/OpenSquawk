import { describe, it, expect, vi, beforeEach } from 'vitest'
import { probeLocalSpeech } from './useLocalSpeechBridge'

describe('probeLocalSpeech', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns the base url of the first ready port', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('8765')) return { ok: true, json: async () => ({ ok: true, ready: false }) } as any
      if (url.includes('8766')) return { ok: true, json: async () => ({ ok: true, ready: true }) } as any
      throw new Error('refused')
    }))
    const base = await probeLocalSpeech([8765, 8766, 8767])
    expect(base).toBe('http://127.0.0.1:8766')
  })

  it('returns null when nothing is ready', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('refused') }))
    const base = await probeLocalSpeech([8765, 8766])
    expect(base).toBeNull()
  })
})
