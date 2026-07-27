import { deleteCookie, getCookie, setCookie, type H3Event } from 'h3'
import { createJwtToken, verifyJwtToken } from './jwt'
import type { AppUserDocument } from '../models/AppUser'

/**
 * The app's *own* session — deliberately independent of the issuer.
 *
 * Once an identity has arrived (via the SSO exchange, or trivially in
 * AUTH_MODE=open), the app mints a session signed with its own secret and
 * stored in a host-only cookie on its own origin. No cross-domain cookie, no
 * CORS, no shared secret with the website beyond the one-time exchange. After
 * this point the app can serve every request without the issuer being reachable
 * at all — which is the whole point: a self-hosted instance must not depend on
 * opensquawk.de.
 */

const APP_SESSION_COOKIE = 'os_app_session'
const APP_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const APP_ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24

// Marks a bearer token as minted by the app rather than by the website's
// login. Both are HS256 and — in the monorepo, where APP_JWT_SECRET is usually
// unset — signed with the same secret, so the payload is what tells them apart:
// an app token resolves against AppUser, a website token against User.
const APP_TOKEN_TYPE = 'app'

export interface AppSessionPayload {
  sub: string
  sso: string
  email: string
  role: string
}

function getAppSessionSecret() {
  // APP_JWT_SECRET lets the app run on a secret of its own; JWT_SECRET is the
  // fallback so the monorepo keeps working with a single configured secret.
  const secret = (process.env.APP_JWT_SECRET || process.env.JWT_SECRET || '').trim()
  if (!secret) {
    throw new Error('App session secret missing – bitte APP_JWT_SECRET (oder JWT_SECRET) in .env setzen')
  }
  return secret
}

function sessionClaims(user: AppUserDocument) {
  return {
    sub: String(user._id),
    sso: user.ssoSubject,
    email: user.email,
    role: user.role,
    typ: APP_TOKEN_TYPE,
  }
}

/**
 * Short-lived bearer token for the browser. The durable session lives in the
 * httpOnly cookie; this is what the client puts in the Authorization header,
 * exactly as the website's access token does today, so no call site has to
 * change shape.
 */
export function createAppAccessToken(user: AppUserDocument) {
  return createJwtToken(sessionClaims(user), getAppSessionSecret(), APP_ACCESS_TOKEN_TTL_SECONDS)
}

/**
 * Returns the payload if `token` is an app-minted bearer token, else null —
 * including for a well-formed website token, which must fall through to the
 * website resolution path.
 */
export function verifyAppAccessToken(token: string): AppSessionPayload | null {
  try {
    const payload = verifyJwtToken(token, getAppSessionSecret())
    if (payload?.typ !== APP_TOKEN_TYPE || !payload?.sub) return null
    return {
      sub: String(payload.sub),
      sso: String(payload.sso || payload.sub),
      email: String(payload.email || ''),
      role: String(payload.role || 'user'),
    }
  } catch {
    return null
  }
}

export function issueAppSession(event: H3Event, user: AppUserDocument) {
  const token = createJwtToken(sessionClaims(user), getAppSessionSecret(), APP_SESSION_TTL_SECONDS)

  setCookie(event, APP_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: APP_SESSION_TTL_SECONDS,
    // Host-only on purpose: no `domain`, so the cookie never leaks to the
    // issuer's origin and self-hosted instances behave identically.
    secure: process.env.NODE_ENV === 'production',
  })

  return token
}

export function readAppSession(event: H3Event): AppSessionPayload | null {
  const token = getCookie(event, APP_SESSION_COOKIE)
  if (!token) return null
  return verifyAppAccessToken(token)
}

export function clearAppSession(event: H3Event) {
  deleteCookie(event, APP_SESSION_COOKIE, { path: '/' })
}
