import { createError, readBody } from 'h3'
import { InvitationCode } from '../../../models/InvitationCode'
import { generateInvitationCode } from '../../../utils/invitations'

const CREATION_DEADLINE = new Date(process.env.BOOTSTRAP_INVITE_DEADLINE ?? '2025-10-01T00:00:00Z')

export default defineEventHandler(async (event) => {
  const now = new Date()
  if (Number.isNaN(CREATION_DEADLINE.getTime())) {
    throw createError({ statusCode: 500, statusMessage: 'Invalid bootstrap deadline configuration' })
  }

  if (now > CREATION_DEADLINE) {
    throw createError({ statusCode: 403, statusMessage: 'Bootstrap window has expired' })
  }

  const body = await readBody<{ label?: string }>(event).catch(() => ({ label: undefined }))
  const code = generateInvitationCode()
  const expiresAt = CREATION_DEADLINE

  await InvitationCode.create({
    code,
    createdAt: now,
    expiresAt,
    channel: 'bootstrap',
    label: body?.label?.trim() || undefined,
  })

  return {
    success: true,
    code,
    expiresAt: expiresAt.toISOString(),
    label: body?.label ?? null,
  }
})
