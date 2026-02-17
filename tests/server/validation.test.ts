import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { isValidEmail, validatePasswordStrength } from '~~/server/utils/validation'

describe('validation utils', () => {
  it('accepts valid email addresses and trims whitespace', () => {
    assert.equal(isValidEmail('  pilot@example.com  '), true)
    assert.equal(isValidEmail('First.Last+tag@opsquawk.dev'), true)
  })

  it('rejects malformed email addresses', () => {
    assert.equal(isValidEmail('pilot.example.com'), false)
    assert.equal(isValidEmail('pilot@localhost'), false)
  })

  it('accepts strong passwords', () => {
    const result = validatePasswordStrength('Abflug1234!')
    assert.equal(result.valid, true)
    assert.equal(result.message, undefined)
  })

  it('rejects passwords without special character', () => {
    const result = validatePasswordStrength('Abflug12345')
    assert.equal(result.valid, false)
    assert.match(result.message ?? '', /special character/i)
  })

  it('rejects passwords with spaces', () => {
    const result = validatePasswordStrength('Abflug 1234!')
    assert.equal(result.valid, false)
    assert.match(result.message ?? '', /cannot contain spaces/i)
  })
})
