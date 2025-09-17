import { createError, readBody } from 'h3'
import { createHash } from 'node:crypto'
import { User } from '../../../../models/User'
import { hashPassword, issueAuthTokens } from '../../../../utils/auth'

interface ConfirmBody {
  token?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ConfirmBody>(event)
  const token = body.token?.trim()
  const password = body.password?.trim()

  if (!token || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Token und neues Passwort sind erforderlich.' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Passwort muss mindestens 8 Zeichen lang sein.' })
  }

  const hashed = createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpiresAt: { $gt: new Date() },
  })

  if (!user) {
    throw createError({ statusCode: 400, statusMessage: 'Dieser Link ist ungültig oder abgelaufen.' })
  }

  user.passwordHash = await hashPassword(password)
  user.passwordResetToken = undefined
  user.passwordResetExpiresAt = undefined
  user.tokenVersion += 1
  await user.save()

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
      balanceCents: user.balanceCents,
    },
  }
})
