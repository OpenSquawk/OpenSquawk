import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeManualFreq } from '../../shared/utils/frequency.ts'

test('normalizeManualFreq pads a bare integer to three decimals', () => {
  assert.equal(normalizeManualFreq('121'), '121.000')
})

test('normalizeManualFreq accepts a comma decimal separator', () => {
  assert.equal(normalizeManualFreq('121,3'), '121.300')
})

test('normalizeManualFreq rejects values outside the VHF airband', () => {
  assert.equal(normalizeManualFreq('99.000'), null)
  assert.equal(normalizeManualFreq('110.000'), null)
  assert.equal(normalizeManualFreq('140.000'), null)
})

test('normalizeManualFreq accepts the lower airband boundary', () => {
  assert.equal(normalizeManualFreq('118'), '118.000')
})

test('normalizeManualFreq rejects garbage input', () => {
  assert.equal(normalizeManualFreq('abc'), null)
  assert.equal(normalizeManualFreq(''), null)
})
