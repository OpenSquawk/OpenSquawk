import { requireUserSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    invitationCodesIssued: user.invitationCodesIssued,
  }
})

