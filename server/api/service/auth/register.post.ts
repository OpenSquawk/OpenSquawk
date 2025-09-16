import { createError, readBody } from 'h3'
import { hashPassword, issueAuthTokens } from '../../../utils/auth'
import { User } from '../../../models/User'
import { InvitationCode } from '../../../models/InvitationCode'
import { WaitlistEntry } from '../../../models/WaitlistEntry'

interface RegisterBody {
  email?: string
  password?: string
  name?: string
  invitationCode?: string
  acceptTerms?: boolean
  acceptPrivacy?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()
  const name = body.name?.trim()
  const code = body.invitationCode?.trim().toUpperCase()

  if (!email || !password || !code) {
    throw createError({ statusCode: 400, statusMessage: 'Bitte E-Mail, Passwort und Einladungscode angeben' })
  }

  if (!body.acceptPrivacy || !body.acceptTerms) {
    throw createError({ statusCode: 400, statusMessage: 'Bitte AGB und Datenschutz bestätigen' })
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw createError({ statusCode: 409, statusMessage: 'Für diese E-Mail existiert bereits ein Konto' })
  }

  const invitation = await InvitationCode.findOne({ code })
  if (!invitation) {
    throw createError({ statusCode: 404, statusMessage: 'Einladungscode nicht gefunden' })
  }
  if (invitation.usedBy) {
    throw createError({ statusCode: 400, statusMessage: 'Einladungscode wurde bereits verwendet' })
  }
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    throw createError({ statusCode: 400, statusMessage: 'Einladungscode ist abgelaufen' })
  }

  const passwordHash = await hashPassword(password)
  const now = new Date()

  const user = await User.create({
    email,
    passwordHash,
    name,
    acceptedPrivacyAt: now,
    acceptedTermsAt: now,
  })

  invitation.usedBy = user._id
  invitation.usedAt = now
  await invitation.save()

  await WaitlistEntry.findOneAndUpdate({ email }, { activatedAt: now }).catch(() => undefined)

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

