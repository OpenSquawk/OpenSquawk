import { createError } from 'h3'
import { getDevBypassUser, issueAuthTokens } from '../../utils/auth'

/**
 * Local-dev-only auto-login: issues real session tokens for a fixed,
 * entirely in-memory test user — no database involved — so an agent (or a
 * developer) can reach any require-auth-gated page on localhost without an
 * invitation code, even when the dev database itself is unreachable.
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

  const user = getDevBypassUser()
  const tokens = await issueAuthTokens(event, user)

  return {
    success: true,
    accessToken: tokens.accessToken,
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
  }
})
