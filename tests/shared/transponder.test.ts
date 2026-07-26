import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RESERVED_SQUAWKS, generateSquawk, isValidSquawk } from '../../shared/utils/transponder.ts'

// Enough draws that a decimal generator (which would emit 8/9 roughly a quarter
// of the time per digit) could not pass by chance.
const DRAWS = 5000

test('generateSquawk only ever emits octal digits', () => {
  for (let i = 0; i < DRAWS; i++) {
    const code = generateSquawk()
    assert.match(code, /^[0-7]{4}$/, `non-octal squawk generated: ${code}`)
  }
})

test('generateSquawk never emits a reserved code', () => {
  for (let i = 0; i < DRAWS; i++) {
    const code = generateSquawk()
    assert.ok(!RESERVED_SQUAWKS.has(code), `reserved squawk generated: ${code}`)
  }
})

test('generateSquawk covers the code space rather than returning a constant', () => {
  const seen = new Set<string>()
  for (let i = 0; i < DRAWS; i++) seen.add(generateSquawk())
  assert.ok(seen.size > 1000, `expected a spread of codes, got ${seen.size} distinct`)
})

test('isValidSquawk rejects the digits a transponder cannot display', () => {
  assert.equal(isValidSquawk('2891'), false)
  assert.equal(isValidSquawk('4592'), false)
  assert.equal(isValidSquawk('1234'), true)
})

test('isValidSquawk rejects reserved codes', () => {
  assert.equal(isValidSquawk('7500'), false)
  assert.equal(isValidSquawk('7600'), false)
  assert.equal(isValidSquawk('7700'), false)
  assert.equal(isValidSquawk('7000'), false)
  assert.equal(isValidSquawk('2000'), false)
  assert.equal(isValidSquawk('0000'), false)
})

test('isValidSquawk rejects malformed input', () => {
  assert.equal(isValidSquawk(''), false)
  assert.equal(isValidSquawk('123'), false)
  assert.equal(isValidSquawk('12345'), false)
  assert.equal(isValidSquawk('12A4'), false)
})
