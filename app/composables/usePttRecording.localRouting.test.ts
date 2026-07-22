import { describe, it, expect, vi } from 'vitest'
import { postWithLocalFallback } from './useLocalSpeechBridge'

describe('postWithLocalFallback', () => {
  it('uses local when it returns 2xx', async () => {
    const local = vi.fn(async () => ({ ok: true, json: async () => ({ success: true, transcription: 'roger' }) }))
    vi.stubGlobal('fetch', local as any)
    const cloud = vi.fn()
    const response = await postWithLocalFallback('http://127.0.0.1:8765/api/atc/ptt', { a: 1 }, cloud as any)
    expect(response.transcription).toBe('roger')
    expect(cloud).not.toHaveBeenCalled()
  })

  it('falls back to cloud when local throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('refused') }) as any)
    const cloud = vi.fn(async () => ({ success: true, transcription: 'cloud' }))
    const response = await postWithLocalFallback('http://127.0.0.1:8765/api/atc/ptt', { a: 1 }, cloud as any)
    expect(response.transcription).toBe('cloud')
    expect(cloud).toHaveBeenCalledOnce()
  })

  it('falls back to cloud when localUrl is null', async () => {
    const cloud = vi.fn(async () => ({ success: true, transcription: 'cloud' }))
    const response = await postWithLocalFallback(null, { a: 1 }, cloud as any)
    expect(response.transcription).toBe('cloud')
  })
})
