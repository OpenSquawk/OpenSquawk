import { defineEventHandler } from 'h3'
import { clearRefreshTokenCookie, getUserFromEvent } from '../../utils/auth'
import { getAuthMode } from '../../utils/authMode'
import { clearAppSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  // Always drop the app's own session, whatever else happens below.
  clearAppSession(event)

  // AUTH_MODE=open has no session to end — the local identity is the instance.
  if (getAuthMode() === 'open') {
    return { success: true }
  }

  const user = await getUserFromEvent(event)

  // PHASE 1 (app repo): drop this branch. Bumping tokenVersion invalidates the
  // website's outstanding access tokens; an app session is ended by clearing
  // the cookie above. `tokenVersion` only exists on website User documents.
  if (user && typeof (user as any).tokenVersion === 'number') {
    ;(user as any).tokenVersion += 1
    await user.save().catch(() => null)
  }

  clearRefreshTokenCookie(event)
  return { success: true }
})
