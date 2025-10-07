import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { WaitlistEntry } from '../../../../models/WaitlistEntry'
import { InvitationCode } from '../../../../models/InvitationCode'
import { sendMail } from '../../../../utils/notifications'
import { generateInvitationCode, renderInvitationEmail, renderInvitationText } from '../../../../utils/invitations'

interface SendInviteBody {
  resend?: boolean
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing waitlist entry ID' })
  }

  await readBody<SendInviteBody>(event).catch(() => ({}) as SendInviteBody)

  const entry = await WaitlistEntry.findById(id).exec()
  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Waitlist entry not found' })
  }

  const email = entry.email?.trim()
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Waitlist entry has no email address' })
  }

  let invitation = entry.invitationCode
    ? await InvitationCode.findById(entry.invitationCode)
    : null

  if (invitation?.usedAt) {
    throw createError({ statusCode: 400, statusMessage: 'Invitation already used — user is registered' })
  }

  const now = new Date()

  if (!invitation) {
    const code = generateInvitationCode()
    invitation = await InvitationCode.create({
      code,
      createdAt: now,
      channel: 'admin',
      label: `Waitlist: ${email}`,
      createdBy: admin._id,
    })

    entry.invitationCode = invitation._id
  }

  entry.invitationSentAt = now
  await entry.save()

  const html = await renderInvitationEmail(invitation.code, email)
  const text = renderInvitationText(invitation.code, email)

  await sendMail({
    to: email,
    subject: 'Your OpenSquawk invite code',
    text,
    html,
  })

  return {
    success: true,
    invitation: {
      id: String(invitation._id),
      code: invitation.code,
      channel: invitation.channel,
      label: invitation.label || undefined,
      createdAt: invitation.createdAt?.toISOString() ?? now.toISOString(),
      expiresAt: invitation.expiresAt ? invitation.expiresAt.toISOString() : undefined,
      sentAt: entry.invitationSentAt?.toISOString() ?? now.toISOString(),
      usedAt: invitation.usedAt ? invitation.usedAt.toISOString() : undefined,
    },
  }
})
