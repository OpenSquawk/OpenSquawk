import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

import {
  createAccessToken,
  createRefreshToken,
  DEV_BYPASS_USER_ID,
  getDevBypassUser,
  hasAdminRole,
  hashPassword,
  requireUserSession,
  resolveUserFromToken,
  rotateRefreshToken,
  verifyPassword,
} from '~~/server/utils/auth'
import { User } from '~~/server/models/User'

const REFRESH_COOKIE_NAME = 'os_refresh_token'

// Minimal H3-ish event with a writable response so setCookie/deleteCookie work.
function makeEvent(opts: { cookie?: string } = {}) {
  const headers: Record<string, any> = {}
  return {
    node: {
      req: { headers: opts.cookie ? { cookie: opts.cookie } : {} },
      res: {
        setHeader: (k: string, v: any) => { headers[k.toLowerCase()] = v },
        getHeader: (k: string) => headers[k.toLowerCase()],
        removeHeader: (k: string) => { delete headers[k.toLowerCase()] },
        getHeaderNames: () => Object.keys(headers),
        headersSent: false,
      },
    },
    context: {},
  } as any
}

function b64url(buf: Buffer) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

// Hand-rolls a JWT so tests can forge headers/claims the public helpers won't produce.
function signJwt(header: Record<string, any>, payload: Record<string, any>, secret: string) {
  const data = `${b64url(Buffer.from(JSON.stringify(header)))}.${b64url(Buffer.from(JSON.stringify(payload)))}`
  const sig = createHmac('sha256', secret).update(data).digest()
  return `${data}.${b64url(sig)}`
}

function bearerEvent(token: string) {
  return { node: { req: { headers: { authorization: `Bearer ${token}` } } }, context: {} } as any
}

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

  it('uses a bridge-compatible ObjectId for the local dev bypass user', () => {
    assert.match(DEV_BYPASS_USER_ID, /^[a-f\d]{24}$/i)
    assert.equal(String(getDevBypassUser()._id), DEV_BYPASS_USER_ID)
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

describe('refresh token rotation', () => {
  it('rotates a valid refresh token into a fresh access token', async () => {
    process.env.JWT_SECRET = 'rotate-access-secret'
    process.env.JWT_REFRESH_SECRET = 'rotate-refresh-secret'

    const user = { _id: '507f1f77bcf86cd799439011', email: 'p@example.com', tokenVersion: 3, role: 'user' } as any
    const refresh = createRefreshToken(user)
    const event = makeEvent({ cookie: `${REFRESH_COOKIE_NAME}=${refresh}` })

    const originalFindById = (User as any).findById
    ;(User as any).findById = async (id: string) => (id === user._id ? user : null)
    try {
      const { accessToken } = await rotateRefreshToken(event)
      assert.equal(typeof accessToken, 'string')
      // a new refresh cookie was issued
      assert.match(String(event.node.res.getHeader('set-cookie')), new RegExp(REFRESH_COOKIE_NAME))
    } finally {
      ;(User as any).findById = originalFindById
    }
  })

  it('rejects when no refresh cookie is present', async () => {
    process.env.JWT_SECRET = 'rotate-access-secret'
    const event = makeEvent()
    await assert.rejects(() => rotateRefreshToken(event), (e: any) => e?.statusCode === 401)
  })

  it('rejects an access token presented as a refresh token (wrong type)', async () => {
    process.env.JWT_SECRET = 'rotate-access-secret'
    process.env.JWT_REFRESH_SECRET = 'rotate-refresh-secret'

    const user = { _id: '507f1f77bcf86cd799439011', email: 'p@example.com', tokenVersion: 1, role: 'user' } as any
    // access tokens have no type:'refresh' claim and are signed with the access secret
    const access = createAccessToken(user)
    const event = makeEvent({ cookie: `${REFRESH_COOKIE_NAME}=${access}` })

    await assert.rejects(() => rotateRefreshToken(event), (e: any) => e?.statusCode === 401)
  })

  it('rejects a refresh token whose version no longer matches the user', async () => {
    process.env.JWT_SECRET = 'rotate-access-secret'
    process.env.JWT_REFRESH_SECRET = 'rotate-refresh-secret'

    const tokenUser = { _id: '507f1f77bcf86cd799439011', email: 'p@example.com', tokenVersion: 1, role: 'user' } as any
    const refresh = createRefreshToken(tokenUser)
    const event = makeEvent({ cookie: `${REFRESH_COOKIE_NAME}=${refresh}` })

    const originalFindById = (User as any).findById
    ;(User as any).findById = async () => ({ ...tokenUser, tokenVersion: 2 })
    try {
      await assert.rejects(() => rotateRefreshToken(event), (e: any) => e?.statusCode === 401)
    } finally {
      ;(User as any).findById = originalFindById
    }
  })
})

describe('JWT verification hardening', () => {
  it('rejects a non-HS256 algorithm even with a valid HMAC signature (alg confusion)', async () => {
    process.env.JWT_SECRET = 'harden-secret'
    // signature is a valid HMAC over the data, but the header claims alg:none
    const token = signJwt(
      { alg: 'none', typ: 'JWT' },
      { sub: '507f1f77bcf86cd799439011', version: 0, iat: 0, exp: 9999999999 },
      'harden-secret',
    )
    assert.equal(await resolveUserFromToken(bearerEvent(token)), null)
  })

  it('rejects a tampered payload (signature mismatch)', async () => {
    process.env.JWT_SECRET = 'harden-secret'
    const user = { _id: '507f1f77bcf86cd799439011', email: 'p@example.com', tokenVersion: 0, role: 'user' } as any
    const valid = createAccessToken(user)
    const parts = valid.split('.')
    // flip a character in the payload segment
    parts[1] = parts[1]!.slice(0, -1) + (parts[1]!.endsWith('A') ? 'B' : 'A')
    assert.equal(await resolveUserFromToken(bearerEvent(parts.join('.'))), null)
  })

  it('rejects an expired token', async () => {
    process.env.JWT_SECRET = 'harden-secret'
    const token = signJwt(
      { alg: 'HS256', typ: 'JWT' },
      { sub: '507f1f77bcf86cd799439011', version: 0, iat: 0, exp: 1 },
      'harden-secret',
    )
    assert.equal(await resolveUserFromToken(bearerEvent(token)), null)
  })

  it('rejects a malformed token', async () => {
    process.env.JWT_SECRET = 'harden-secret'
    assert.equal(await resolveUserFromToken(bearerEvent('not-a-jwt')), null)
  })
})
