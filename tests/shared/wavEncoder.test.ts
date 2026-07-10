import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encodeWav } from '../../shared/utils/wavEncoder.ts'

test('encodeWav produces a valid RIFF/WAVE header', async () => {
  const pcm = new Float32Array([0, 0.5, -0.5, 1, -1])
  const blob = encodeWav(pcm, 16000)
  const buf = new Uint8Array(await blob.arrayBuffer())
  const ascii = (start: number, len: number) =>
    String.fromCharCode(...buf.slice(start, start + len))
  assert.equal(ascii(0, 4), 'RIFF')
  assert.equal(ascii(8, 4), 'WAVE')
  assert.equal(ascii(12, 4), 'fmt ')
  // sample rate is little-endian at byte offset 24
  const view = new DataView(buf.buffer)
  assert.equal(view.getUint32(24, true), 16000)
})

test('encodeWav clamps out-of-range samples instead of wrapping', async () => {
  const pcm = new Float32Array([2, -2])
  const blob = encodeWav(pcm, 16000)
  const buf = new Uint8Array(await blob.arrayBuffer())
  const view = new DataView(buf.buffer)
  // 16-bit PCM data starts at byte 44 in a standard WAV header
  assert.equal(view.getInt16(44, true), 32767)
  assert.equal(view.getInt16(46, true), -32768)
})

test('encodeWav sets the correct data chunk size', async () => {
  const pcm = new Float32Array(10)
  const blob = encodeWav(pcm, 8000)
  const buf = new Uint8Array(await blob.arrayBuffer())
  assert.equal(buf.length, 44 + 20)
  const view = new DataView(buf.buffer)
  assert.equal(view.getUint32(40, true), 20)
})
