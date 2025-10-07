import { createError, getHeader, H3Event, setCookie, deleteCookie } from 'h3'
import { useRuntimeConfig } from '#imports'
import { createHmac, randomBytes, timingSafeEqual, scrypt as _scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import type { UserDocument } from '../models/User'
import { User } from '../models/User'

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

function base64url(buffer: Buffer) {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function fromBase64url(input: string) {
  let sanitized = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = sanitized.length % 4
  if (pad === 2) sanitized += '=='
  else if (pad === 3) sanitized += '='
  else if (pad !== 0) sanitized += '===' 
  return Buffer.from(sanitized, 'base64')
}

function createJwtToken(payload: Record<string, any>, secret: string, ttlSeconds: number) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + ttlSeconds }
  const encodedHeader = base64url(Buffer.from(JSON.stringify(header)))
  const encodedPayload = base64url(Buffer.from(JSON.stringify(body)))
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = createHmac('sha256', secret).update(data).digest()
  return `${data}.${base64url(signature)}`
}

function verifyJwtToken(token: string, secret: string) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Malformed token')
  const [encodedHeader, encodedPayload, signature] = parts
  const data = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = createHmac('sha256', secret).update(data).digest()
  const receivedSignature = fromBase64url(signature)
  if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(receivedSignature, expectedSignature)) {
    throw new Error('Invalid signature')
  }
  const header = JSON.parse(fromBase64url(encodedHeader).toString('utf8'))
  if (header.alg !== 'HS256') throw new Error('Unsupported algorithm')
  const payload = JSON.parse(fromBase64url(encodedPayload).toString('utf8'))
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired')
  }
  return payload as Record<string, any>
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

export async function resolveUserFromToken(event: H3Event) {
  const token = parseAuthorizationHeader(event)
  if (!token) return null
  try {
    const { accessSecret } = getSecrets()
    const payload = verifyJwtToken(token, accessSecret)
    if (!payload?.sub) return null
    const user = await User.findById(payload.sub)
    if (!user) return null
    if (typeof payload.version === 'number' && payload.version !== user.tokenVersion) {
      return null
    }
    return user
  } catch {
    return null
  }
}

export async function requireUserSession(event: H3Event) {
  if (event.context?.user) {
    return event.context.user as UserDocument
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
  const user = await resolveUserFromToken(event)
  if (user) {
    event.context.user = user
  }
  return user
}

export function hasAdminRole(user: UserDocument | null | undefined) {
  return user ? user.role === 'admin' : false
}

export async function requireAdmin(event: H3Event) {
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

