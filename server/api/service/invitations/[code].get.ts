import { createError } from 'h3'
import { InvitationCode } from '../../../models/InvitationCode'

export default defineEventHandler(async (event) => {
  const { code } = event.context.params || {}
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Code fehlt' })
  }

  const normalized = String(code).trim().toUpperCase()
  const invitation = await InvitationCode.findOne({ code: normalized })

  if (!invitation) {
    return { valid: false }
  }
  if (invitation.usedBy) {
    return { valid: false, reason: 'used' }
  }
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    return { valid: false, reason: 'expired' }
  }

  return {
    valid: true,
    code: invitation.code,
    createdAt: invitation.createdAt,
    expiresAt: invitation.expiresAt,
  }
})

