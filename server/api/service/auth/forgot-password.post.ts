import { createError, getRequestURL, readBody } from 'h3'
import { randomBytes, createHash } from 'node:crypto'
import { User } from '../../../models/User'
import { PasswordResetToken } from '../../../models/PasswordResetToken'
import { sendMail } from '../../../utils/notifications'

interface ForgotPasswordBody {
  email?: string
}

const RESET_TOKEN_TTL_MINUTES = 60

export default defineEventHandler(async (event) => {
  const body = await readBody<ForgotPasswordBody>(event)
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Please provide an email address' })
  }

  const user = await User.findOne({ email })
  if (user) {
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)

    await PasswordResetToken.deleteMany({ user: user._id })
    await PasswordResetToken.create({ user: user._id, tokenHash, expiresAt })

    const url = getRequestURL(event)
    const resetLink = `${url.origin}/forgot-password?token=${encodeURIComponent(token)}`

    const salutation = user.name ? ` ${user.name}` : ''
    const lines = [
      `Hi${salutation},`,
      '',
      'You requested a link to reset your OpenSquawk password.',
      `Click the link below within ${RESET_TOKEN_TTL_MINUTES} minutes to choose a new password:`,
      resetLink,
      '',
      'If you did not make this request, you can safely ignore this email.',
      '',
      'Blue skies,',
      'Your OpenSquawk crew',
    ]

    await sendMail({
      to: user.email,
      subject: 'Reset your OpenSquawk password',
      text: lines.join('\n'),
    })
  }

  return { success: true }
})
