import { createError, defineEventHandler } from 'h3'
import { AppUser } from '../../models/AppUser'
import { getAuthMode, getLocalAppUser } from '../../utils/authMode'
import { createAppAccessToken, issueAppSession, readAppSession } from '../../utils/session'

/**
 * Hands the client a fresh bearer token for whatever session it already has.
 *
 * The client calls exactly this one endpoint in every mode; deciding what a
 * "session" means is the server's job:
 *   open → the single local identity, no credentials involved
 *   sso  → the app's own session cookie, minted at the SSO exchange
 */
export default defineEventHandler(async (event) => {
  if (getAuthMode() === 'open') {
    const localUser = await getLocalAppUser()
    issueAppSession(event, localUser)
    return { accessToken: createAppAccessToken(localUser) }
  }

  const session = readAppSession(event)
  if (session) {
    const appUser = await AppUser.findById(session.sub)
    if (appUser) {
      // Slide the cookie forward so an active user is never logged out mid-use.
      issueAppSession(event, appUser)
      return { accessToken: createAppAccessToken(appUser) }
    }
  }

  throw createError({ statusCode: 401, statusMessage: 'No app session present' })
})
