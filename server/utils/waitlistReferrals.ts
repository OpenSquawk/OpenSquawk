import { randomBytes } from 'node:crypto'

export const WAITLIST_REFERRAL_TOKEN_PATTERN = /^[A-F0-9]{8}$/

export function generateWaitlistReferralToken() {
  return randomBytes(4).toString('hex').toUpperCase()
}

export function normalizeWaitlistReferralToken(value?: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const token = value.trim().toUpperCase()
  if (!WAITLIST_REFERRAL_TOKEN_PATTERN.test(token)) {
    return null
  }

  return token
}
