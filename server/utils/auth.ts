import { createError, getHeader, type H3Event } from 'h3'
import { AppUser, type AppUserDocument } from '../models/AppUser'
import { getAuthMode, getLocalAppUser } from './authMode'
import { readAppSession, verifyAppAccessToken } from './session'

function parseAuthorizationHeader(event: H3Event) {
  const header = getHeader(event, 'authorization')
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (!token || scheme?.toLowerCase() !== 'bearer') return null
  return token
}

// Local-dev-only identity used by server/api/dev/login.post.ts. The fixed
// ObjectId remains bridge-compatible and stable across development sessions.
export const DEV_BYPASS_USER_ID = '000000000000000000000001'
const DEV_BYPASS_EMAIL = 'dev-claude@localhost.test'

export function getDevBypassUser() {
  return {
    _id: DEV_BYPASS_USER_ID,
    ssoSubject: DEV_BYPASS_USER_ID,
    email: DEV_BYPASS_EMAIL,
    name: 'Dev Test User',
    role: 'user' as const,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }
}

async function resolveAppUser(sub: string): Promise<AppUserDocument | null> {
  return await AppUser.findById(sub)
}

export async function resolveUserFromToken(event: H3Event): Promise<AppUserDocument | null> {
  const session = readAppSession(event)
  if (session) {
    const appUser = await resolveAppUser(session.sub)
    if (appUser) return appUser
  }

  const token = parseAuthorizationHeader(event)
  if (!token) return null

  const appToken = verifyAppAccessToken(token)
  if (appToken) {
    return await resolveAppUser(appToken.sub)
  }

  return null
}

export async function requireUserSession(event: H3Event): Promise<AppUserDocument> {
  if (event.context?.user) {
    return event.context.user as AppUserDocument
  }

  if (getAuthMode() === 'open') {
    const localUser = await getLocalAppUser()
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

export async function getUserFromEvent(event: H3Event): Promise<AppUserDocument | null> {
  if (event.context?.user) return event.context.user as AppUserDocument
  if (getAuthMode() === 'open') {
    const localUser = await getLocalAppUser()
    event.context.user = localUser
    return localUser
  }
  const user = await resolveUserFromToken(event)
  if (user) {
    event.context.user = user
  }
  return user
}
