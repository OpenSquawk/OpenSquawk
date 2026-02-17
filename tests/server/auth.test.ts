import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  createAccessToken,
  createRefreshToken,
  hasAdminRole,
  hashPassword,
  requireUserSession,
  resolveUserFromToken,
  verifyPassword,
} from '~~/server/utils/auth'
import { User } from '~~/server/models/User'

function decodeJwtPayload(token: string) {
  const parts = token.split('.')
  assert.equal(parts.length, 3)
  let payload = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
  const padding = payload.length % 4
  if (padding) payload = payload.padEnd(payload.length + (4 - padding), '=')
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as Record<string, any>
}

describe('auth utils', () => {
  it('hashes and verifies passwords', async () => {
    const raw = 'OpenSquawk123!'
    const hash = await hashPassword(raw)

    assert.match(hash, /^[a-f0-9]+\.[a-f0-9]+$/i)
    assert.equal(await verifyPassword(raw, hash), true)
    assert.equal(await verifyPassword('wrong-password', hash), false)
  })

  it('creates access and refresh tokens with expected claims and ttl', () => {
    process.env.JWT_SECRET = 'test-access-secret'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'

    const user = {
      _id: '507f1f77bcf86cd799439011',
      email: 'pilot@example.com',
      tokenVersion: 7,
      role: 'user',
    } as any

    const access = createAccessToken(user)
    const refresh = createRefreshToken(user)

    const accessPayload = decodeJwtPayload(access)
    const refreshPayload = decodeJwtPayload(refresh)

    assert.equal(accessPayload.sub, user._id)
    assert.equal(accessPayload.email, user.email)
    assert.equal(accessPayload.version, 7)
    assert.equal(accessPayload.exp - accessPayload.iat, 60 * 60 * 24)

    assert.equal(refreshPayload.sub, user._id)
    assert.equal(refreshPayload.type, 'refresh')
    assert.equal(refreshPayload.version, 7)
    assert.equal(refreshPayload.exp - refreshPayload.iat, 60 * 60 * 24 * 7)
  })

  it('detects admin and dev roles correctly', () => {
    assert.equal(hasAdminRole({ role: 'admin' } as any), true)
    assert.equal(hasAdminRole({ role: 'dev' } as any), true)
    assert.equal(hasAdminRole({ role: 'user' } as any), false)
    assert.equal(hasAdminRole(null), false)
  })

  it('resolves user from valid bearer access token', async () => {
    process.env.JWT_SECRET = 'session-access-secret'
    const dbUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'pilot@example.com',
      tokenVersion: 4,
      role: 'user',
    } as any
    const token = createAccessToken(dbUser)
    const originalFindById = (User as any).findById
    ;(User as any).findById = async (id: string) => (id === dbUser._id ? dbUser : null)

    try {
      const event = {
        node: {
          req: {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        },
        context: {},
      } as any

      const resolved = await resolveUserFromToken(event)
      assert.equal(resolved, dbUser)
    } finally {
      ;(User as any).findById = originalFindById
    }
  })

  it('returns null for token version mismatch and requireUserSession throws 401', async () => {
    process.env.JWT_SECRET = 'session-access-secret'
    const tokenUser = {
      _id: '507f1f77bcf86cd799439012',
      email: 'pilot2@example.com',
      tokenVersion: 1,
      role: 'user',
    } as any
    const dbUser = { ...tokenUser, tokenVersion: 2 }
    const token = createAccessToken(tokenUser)
    const originalFindById = (User as any).findById
    ;(User as any).findById = async () => dbUser

    try {
      const event = {
        node: {
          req: {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        },
        context: {},
      } as any

      const resolved = await resolveUserFromToken(event)
      assert.equal(resolved, null)

      await assert.rejects(
        () => requireUserSession(event),
        (error: any) => error?.statusCode === 401
      )
    } finally {
      ;(User as any).findById = originalFindById
    }
  })
})
