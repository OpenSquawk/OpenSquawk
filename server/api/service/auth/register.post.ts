import { createError, readBody } from 'h3'
import { hashPassword, issueAuthTokens } from '../../../utils/auth'
import { User } from '../../../models/User'
import { InvitationCode } from '../../../models/InvitationCode'
import { WaitlistEntry } from '../../../models/WaitlistEntry'
import { isValidEmail, validatePasswordStrength } from '../../../utils/validation'

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
  const emailInput = body.email?.trim() || ''
  const password = body.password?.trim() || ''
  const name = body.name?.trim()
  const code = body.invitationCode?.trim().toUpperCase()
  const email = emailInput.toLowerCase()

  if (!emailInput || !password || !code) {
    throw createError({ statusCode: 400, statusMessage: 'Please provide email, password and invitation code' })
  }

  if (!body.acceptPrivacy || !body.acceptTerms) {
    throw createError({ statusCode: 400, statusMessage: 'Please accept the terms and privacy policy' })
  }

  if (!isValidEmail(emailInput)) {
    throw createError({ statusCode: 400, statusMessage: 'Please provide a valid email address' })
  }

  const passwordValidation = validatePasswordStrength(password)
  if (!passwordValidation.valid) {
    throw createError({ statusCode: 400, statusMessage: passwordValidation.message || 'Password is too weak' })
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw createError({ statusCode: 409, statusMessage: 'An account already exists for this email address' })
  }

  const invitation = await InvitationCode.findOne({ code })
  if (!invitation) {
    throw createError({ statusCode: 404, statusMessage: 'Invitation code not found' })
  }
  if (invitation.usedBy) {
    throw createError({ statusCode: 400, statusMessage: 'Invitation code has already been used' })
  }
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    throw createError({ statusCode: 400, statusMessage: 'Invitation code has expired' })
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

