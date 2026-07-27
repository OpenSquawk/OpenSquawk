import { createError } from 'h3'
import { getDevBypassUser } from '../../utils/auth'
import { mirrorAppUser } from '../../utils/authMode'
import { createAppAccessToken, issueAppSession } from '../../utils/session'

/**
 * Local-dev-only auto-login: persists a fixed app identity and issues an app
 * session so an agent or developer can exercise AUTH_MODE=sso locally.
 *
 * Hard-disabled outside development. This must never be reachable from a
 * deployed environment — the NODE_ENV check below is the entire security
 * boundary and must not be relaxed or made configurable. Excluded from the
 * global requireUserSession gate in server/middleware/auth.global.ts (same
 * as /api/service/*, /api/bridge/*, /api/copilot/*) since it must be
 * reachable while logged out.
 */
export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const identity = getDevBypassUser()
  const user = await mirrorAppUser({
    subject: identity.ssoSubject,
    email: identity.email,
    name: identity.name,
    role: identity.role,
  }, { force: true })

  if (!user) {
    throw createError({ statusCode: 500, statusMessage: 'Could not persist dev identity' })
  }

  issueAppSession(event, user)

  return {
    success: true,
    accessToken: createAppAccessToken(user),
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  }
})
