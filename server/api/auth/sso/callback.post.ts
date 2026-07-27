import { createError, defineEventHandler, readBody } from 'h3'
import { getAuthIssuer, getAuthMode, mirrorAppUser } from '../../../utils/authMode'
import { createAppAccessToken, issueAppSession } from '../../../utils/session'

interface ExchangeResponse {
  subject: string
  email: string
  name?: string
  role?: 'user' | 'admin' | 'dev'
}

/**
 * Consumer half of the SSO handoff (see Phase 0.2 of the split plan).
 *
 * The browser only ever carries a one-time code. It is redeemed here,
 * server-to-server against the issuer and authenticated with SERVICE_SECRET, so
 * the code is worthless to anyone who intercepts the redirect: it is single-use,
 * short-lived, and cannot be exchanged without the shared secret.
 *
 * What comes back is an identity, not a session. The app mirrors it locally and
 * mints its *own* session — from here on the issuer is irrelevant.
 */
export default defineEventHandler(async (event) => {
  if (getAuthMode() !== 'sso') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const issuer = getAuthIssuer()
  if (!issuer) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AUTH_MODE=sso requires NUXT_PUBLIC_AUTH_ISSUER to be set.',
    })
  }

  const serviceSecret = (process.env.SERVICE_SECRET || '').trim()
  if (!serviceSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AUTH_MODE=sso requires SERVICE_SECRET to be set.',
    })
  }

  const body = await readBody(event)
  const code = String(body?.code || '').trim()
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Missing code' })
  }

  let identity: ExchangeResponse
  try {
    identity = await $fetch<ExchangeResponse>(`${issuer}/api/service/auth/sso/exchange`, {
      method: 'POST',
      headers: { 'x-service-secret': serviceSecret },
      body: { code },
    })
  } catch {
    // Deliberately opaque: expired, already-used and forged codes are
    // indistinguishable to the caller.
    throw createError({ statusCode: 401, statusMessage: 'SSO code could not be redeemed.' })
  }

  if (!identity?.subject || !identity?.email) {
    throw createError({ statusCode: 502, statusMessage: 'Issuer returned an incomplete identity.' })
  }

  const appUser = await mirrorAppUser({
    subject: identity.subject,
    email: identity.email,
    name: identity.name,
    role: identity.role || 'user',
  }, { force: true })

  if (!appUser) {
    throw createError({ statusCode: 500, statusMessage: 'Could not persist the identity.' })
  }

  issueAppSession(event, appUser)

  return {
    accessToken: createAppAccessToken(appUser),
    user: {
      id: String(appUser._id),
      email: appUser.email,
      name: appUser.name,
      role: appUser.role,
      createdAt: appUser.createdAt,
    },
  }
})
