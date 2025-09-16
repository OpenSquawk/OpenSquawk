import { requireUserSession } from '../../utils/auth'
import { InvitationCode } from '../../models/InvitationCode'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const codes = await InvitationCode.find({ createdBy: user._id }).sort({ createdAt: -1 }).lean()
  return codes.map((code) => ({
    code: code.code,
    createdAt: code.createdAt,
    expiresAt: code.expiresAt,
    usedAt: code.usedAt,
    usedBy: code.usedBy ? String(code.usedBy) : null,
  }))
})

