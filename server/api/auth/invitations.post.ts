import { createError } from 'h3'
import { randomBytes } from 'node:crypto'
import { requireUserSession } from '../../utils/auth'
import { InvitationCode } from '../../models/InvitationCode'

function generateCode() {
  return randomBytes(4).toString('hex').toUpperCase()
}

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)

  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime()
  const twoWeeksMs = 1000 * 60 * 60 * 24 * 14

  if (accountAgeMs < twoWeeksMs) {
    throw createError({ statusCode: 403, statusMessage: 'Invitation codes become available after 14 days' })
  }

  if (user.invitationCodesIssued >= 2) {
    throw createError({ statusCode: 403, statusMessage: 'Limit of two invitation codes reached' })
  }

  const activeCodes = await InvitationCode.countDocuments({ createdBy: user._id, usedBy: { $exists: false } })
  if (activeCodes >= 2) {
    throw createError({ statusCode: 403, statusMessage: 'Please use your existing invitation codes first' })
  }

  const code = generateCode()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)

  await InvitationCode.create({
    code,
    createdBy: user._id,
    createdAt: now,
    expiresAt,
  })

  user.invitationCodesIssued += 1
  await user.save()

  return {
    success: true,
    code,
    expiresAt,
  }
})

