import { clearRefreshTokenCookie, requireUserSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  user.tokenVersion += 1
  await user.save()
  clearRefreshTokenCookie(event)
  return { success: true }
})

