import { createError, readBody } from 'h3'
import { issueAuthTokens, verifyPassword } from '../../../utils/auth'
import { User } from '../../../models/User'

interface LoginBody {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Bitte E-Mail und Passwort angeben' })
  }

  const user = await User.findOne({ email })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Ungültige Zugangsdaten' })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Ungültige Zugangsdaten' })
  }

  user.lastLoginAt = new Date()
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
    },
  }
})

