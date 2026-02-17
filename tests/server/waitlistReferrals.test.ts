import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  generateWaitlistReferralToken,
  normalizeWaitlistReferralToken,
} from '~~/server/utils/waitlistReferrals'

describe('waitlist referral utilities', () => {
  it('generates uppercase 8-char hex referral tokens', () => {
    const token = generateWaitlistReferralToken()
    assert.match(token, /^[A-F0-9]{8}$/)
  })

  it('normalizes valid referral tokens', () => {
    assert.equal(normalizeWaitlistReferralToken('ab12cd34'), 'AB12CD34')
    assert.equal(normalizeWaitlistReferralToken('  ff00aa11  '), 'FF00AA11')
  })

  it('rejects invalid referral tokens', () => {
    assert.equal(normalizeWaitlistReferralToken(''), null)
    assert.equal(normalizeWaitlistReferralToken('abc123'), null)
    assert.equal(normalizeWaitlistReferralToken('AB12-CD34'), null)
    assert.equal(normalizeWaitlistReferralToken('GZ12CD34'), null)
    assert.equal(normalizeWaitlistReferralToken(undefined), null)
    assert.equal(normalizeWaitlistReferralToken(1234), null)
  })
})
