import { createError, defineEventHandler, readBody } from 'h3'
import { randomBytes } from 'node:crypto'
import { requireAdmin } from '../../utils/auth'
import { InvitationCode } from '../../models/InvitationCode'

interface CreateInvitationBody {
  label?: string
  expiresInDays?: number
}

function generateCode() {
  return randomBytes(4).toString('hex').toUpperCase()
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody<CreateInvitationBody>(event).catch(() => ({} as CreateInvitationBody))

  const label = body.label?.trim() || undefined
  const expiresInDays = typeof body.expiresInDays === 'number' ? Math.max(1, Math.min(body.expiresInDays, 120)) : 30

  const now = new Date()
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)

  const code = generateCode()

  const existing = await InvitationCode.findOne({ code })
  if (existing) {
    throw createError({ statusCode: 500, statusMessage: 'Generierung fehlgeschlagen, bitte erneut versuchen.' })
  }

  const invitation = await InvitationCode.create({
    code,
    channel: 'admin',
    label,
    createdAt: now,
    createdBy: admin._id,
    expiresAt,
  })

  return {
    success: true,
    invitation: {
      id: String(invitation._id),
      code: invitation.code,
      channel: invitation.channel,
      label: invitation.label || undefined,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt ? invitation.expiresAt.toISOString() : undefined,
    },
  }
})
