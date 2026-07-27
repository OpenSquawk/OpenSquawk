import { createError, getHeader, H3Event, setCookie, deleteCookie } from 'h3'
import { useRuntimeConfig } from '#imports'
import { randomBytes, timingSafeEqual, scrypt as _scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import type { UserDocument } from '../models/User'
import { User } from '../models/User'
import { AppUser } from '../models/AppUser'
import { createJwtToken, verifyJwtToken } from './jwt'
import { getAuthMode, getLocalAppUser, mirrorAppUser } from './authMode'
import { readAppSession, verifyAppAccessToken } from './session'

const scrypt = promisify(_scrypt) as (password: string | Buffer, salt: string | Buffer, keylen: number) => Promise<Buffer>

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7
const REFRESH_COOKIE_NAME = 'os_refresh_token'
const PASSWORD_SALT_BYTES = 16
const PASSWORD_KEYLEN = 64

function getSecrets() {
  const config = useRuntimeConfig()
  if (!config.jwtSecret) {
    throw new Error('JWT secret missing – bitte JWT_SECRET in .env setzen')
  }
  return {
    accessSecret: config.jwtSecret as string,
    refreshSecret: (config.jwtRefreshSecret as string) || (config.jwtSecret as string),
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(PASSWORD_SALT_BYTES)
  const derived = await scrypt(password, salt, PASSWORD_KEYLEN)
  return `${salt.toString('hex')}.${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split('.')
  if (!saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(hashHex, 'hex')
  const derived = await scrypt(password, salt, expected.length)
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}

export function createAccessToken(user: UserDocument) {
  const { accessSecret } = getSecrets()
  return createJwtToken(
    {
      sub: String(user._id),
      email: user.email,
      version: user.tokenVersion,
    },
    accessSecret,
    ACCESS_TOKEN_TTL_SECONDS,
  )
}

export function createRefreshToken(user: UserDocument) {
  const { refreshSecret } = getSecrets()
  return createJwtToken(
    {
      sub: String(user._id),
      type: 'refresh',
      version: user.tokenVersion,
    },
    refreshSecret,
    REFRESH_TOKEN_TTL_SECONDS,
  )
}

export function setRefreshTokenCookie(event: H3Event, token: string) {
  setCookie(event, REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  })
}

export function clearRefreshTokenCookie(event: H3Event) {
  deleteCookie(event, REFRESH_COOKIE_NAME, { path: '/' })
}

function parseAuthorizationHeader(event: H3Event) {
  const header = getHeader(event, 'authorization')
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (!token || scheme?.toLowerCase() !== 'bearer') return null
  return token
}

// Local-dev-only bypass session (server/api/dev/login.post.ts): a fixed,
// entirely in-memory "user" that never touches MongoDB, so require-auth
// pages are reachable for local testing even when the dev DB is unreachable.
// This fixed ObjectId never resolves to a real User document: resolveUserFromToken
// below matches it BEFORE ever calling User.findById. It must nevertheless be a
// valid ObjectId because BridgeToken.user is stored as an ObjectId when WebSim
// connects to the real bridge endpoints.
export const DEV_BYPASS_USER_ID = '000000000000000000000001'
const DEV_BYPASS_EMAIL = 'dev-claude@localhost.test'

export function getDevBypassUser(): UserDocument {
  return {
    _id: DEV_BYPASS_USER_ID,
    email: DEV_BYPASS_EMAIL,
    name: 'Dev Test User',
    role: 'user',
    tokenVersion: 0,
    createdAt: new Date(0),
    invitationCodesIssued: 0,
    acceptedTermsAt: new Date(0),
    acceptedPrivacyAt: new Date(0),
  } as unknown as UserDocument
}

/** Resolve an identity from the app's own mirror — no `User` lookup involved. */
async function resolveAppUser(sub: string) {
  const appUser = await AppUser.findById(sub)
  if (!appUser) return null
  return appUser as unknown as UserDocument
}

export async function resolveUserFromToken(event: H3Event) {
  // 1. The app's own session cookie — the only path that survives the split.
  const session = readAppSession(event)
  if (session) {
    const appUser = await resolveAppUser(session.sub)
    if (appUser) return appUser
  }

  const token = parseAuthorizationHeader(event)
  if (!token) return null

  // 2. An app-minted bearer token (same session, carried in the header).
  const appToken = verifyAppAccessToken(token)
  if (appToken) {
    return await resolveAppUser(appToken.sub)
  }

  // 3. PHASE 1 (app repo): everything below goes away together with the `User`
  // collection. While website and app share one deployment, a website access
  // token is still a valid way in — it is how every existing user is logged in
  // today. Each such request also refreshes the AppUser mirror (rate-limited
  // internally), so app-side data is already keyed correctly when the split
  // happens.
  try {
    const { accessSecret } = getSecrets()
    const payload = verifyJwtToken(token, accessSecret)
    if (!payload?.sub) return null
    if (payload.sub === DEV_BYPASS_USER_ID && process.env.NODE_ENV !== 'production') {
      const devUser = getDevBypassUser()
      await mirrorAppUser({
        subject: DEV_BYPASS_USER_ID,
        email: devUser.email,
        name: devUser.name,
        role: 'user',
      }).catch(() => null)
      return devUser
    }
    const user = await User.findById(payload.sub)
    if (!user) return null
    if (typeof payload.version === 'number' && payload.version !== user.tokenVersion) {
      return null
    }
    await mirrorAppUser({
      subject: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
    }).catch(() => null)
    return user
  } catch {
    return null
  }
}

export async function requireUserSession(event: H3Event) {
  if (event.context?.user) {
    return event.context.user as UserDocument
  }

  // AUTH_MODE=open: a self-hosted instance has no login. Every request is the
  // one local identity, resolved without ever touching the `User` collection.
  if (getAuthMode() === 'open') {
    const localUser = await getLocalAppUser() as unknown as UserDocument
    event.context.user = localUser
    return localUser
  }

  const user = await resolveUserFromToken(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  event.context.user = user
  return user
}

export async function getUserFromEvent(event: H3Event) {
  if (event.context?.user) return event.context.user as UserDocument
  if (getAuthMode() === 'open') {
    const localUser = await getLocalAppUser() as unknown as UserDocument
    event.context.user = localUser
    return localUser
  }
  const user = await resolveUserFromToken(event)
  if (user) {
    event.context.user = user
  }
  return user
}

export function hasAdminRole(user: UserDocument | null | undefined) {
  return user ? user.role === 'admin' || user.role === 'dev' : false
}

export async function requireAdmin(event: H3Event) {
  // PHASE 1 (app repo): delete this guard together with the admin surface.
  // The local AUTH_MODE=open identity is an admin *of its own instance*, which
  // is correct once /api/admin/** no longer lives here. For as long as it does,
  // an unauthenticated open-mode request must never reach it.
  if (getAuthMode() === 'open') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  const user = await requireUserSession(event)
  if (!hasAdminRole(user)) {
    throw createError({ statusCode: 403, statusMessage: 'Administratorrechte erforderlich' })
  }
  return user
}

export async function issueAuthTokens(event: H3Event, user: UserDocument) {
  const accessToken = createAccessToken(user)
  const refreshToken = createRefreshToken(user)
  setRefreshTokenCookie(event, refreshToken)
  return { accessToken }
}

export async function rotateRefreshToken(event: H3Event) {
  const cookieHeader = event.node.req.headers?.cookie || ''
  const match = cookieHeader.split(';').map((p) => p.trim()).find((p) => p.startsWith(`${REFRESH_COOKIE_NAME}=`))
  if (!match) {
    throw createError({ statusCode: 401, statusMessage: 'No refresh token present' })
  }
  const token = match.substring(REFRESH_COOKIE_NAME.length + 1)
  try {
    const { refreshSecret } = getSecrets()
    const payload = verifyJwtToken(token, refreshSecret)
    if (!payload?.sub || payload.type !== 'refresh') {
      throw new Error('Invalid token payload')
    }
    const user = await User.findById(payload.sub)
    if (!user) {
      throw new Error('User missing')
    }
    if (typeof payload.version === 'number' && payload.version !== user.tokenVersion) {
      throw new Error('Token version mismatch')
    }
    return issueAuthTokens(event, user)
  } catch (err) {
    clearRefreshTokenCookie(event)
    throw createError({ statusCode: 401, statusMessage: 'Refresh token invalid' })
  }
}
