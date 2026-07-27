import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEV_BYPASS_USER_ID,
  getDevBypassUser,
  requireUserSession,
  resolveUserFromToken,
} from '~~/server/utils/auth'
import { AppUser } from '~~/server/models/AppUser'
import { createAppAccessToken } from '~~/server/utils/session'

function bearerEvent(token: string) {
  return { node: { req: { headers: { authorization: `Bearer ${token}` } } }, context: {} } as any
}

describe('auth utils', () => {
  it('uses a bridge-compatible ObjectId for the local dev bypass user', () => {
    assert.match(DEV_BYPASS_USER_ID, /^[a-f\d]{24}$/i)
    assert.equal(String(getDevBypassUser()._id), DEV_BYPASS_USER_ID)
  })

  it('resolves an app user from an app-minted bearer token', async () => {
    process.env.APP_JWT_SECRET = 'app-session-secret'
    const appUser = {
      _id: '507f1f77bcf86cd799439011',
      ssoSubject: 'pilot-subject',
      email: 'pilot@example.com',
      role: 'user',
    } as any
    const token = createAppAccessToken(appUser)
    const originalFindById = (AppUser as any).findById
    ;(AppUser as any).findById = async (id: string) => (id === appUser._id ? appUser : null)

    try {
      assert.equal(await resolveUserFromToken(bearerEvent(token)), appUser)
    } finally {
      ;(AppUser as any).findById = originalFindById
    }
  })

  it('rejects a missing session in sso mode', async () => {
    const originalAuthMode = process.env.AUTH_MODE
    process.env.AUTH_MODE = 'sso'
    const event = { node: { req: { headers: {} } }, context: {} } as any

    try {
      await assert.rejects(
        () => requireUserSession(event),
        (error: any) => error?.statusCode === 401,
      )
    } finally {
      if (originalAuthMode === undefined) {
        delete process.env.AUTH_MODE
      } else {
        process.env.AUTH_MODE = originalAuthMode
      }
    }
  })
})
