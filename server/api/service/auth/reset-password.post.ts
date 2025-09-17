import { createError, readBody } from 'h3'
import { createHash } from 'node:crypto'
import { PasswordResetToken } from '../../../models/PasswordResetToken'
import { User } from '../../../models/User'
import { hashPassword } from '../../../utils/auth'

interface ResetPasswordBody {
  token?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ResetPasswordBody>(event)
  const token = body.token?.trim()
  const password = body.password?.trim()

  if (!token || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Token und neues Passwort erforderlich' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Das Passwort muss mindestens 8 Zeichen enthalten' })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const resetToken = await PasswordResetToken.findOne({ tokenHash })

  if (!resetToken || (resetToken.expiresAt && resetToken.expiresAt < new Date()) || resetToken.usedAt) {
    throw createError({ statusCode: 400, statusMessage: 'Dieser Link ist ungültig oder abgelaufen' })
  }

  const user = await User.findById(resetToken.user)
  if (!user) {
    await resetToken.deleteOne().catch(() => undefined)
    throw createError({ statusCode: 400, statusMessage: 'Dieser Link ist ungültig oder abgelaufen' })
  }

  user.passwordHash = await hashPassword(password)
  user.tokenVersion += 1
  await user.save()

  resetToken.usedAt = new Date()
  await resetToken.save()
  await PasswordResetToken.deleteMany({ user: user._id, _id: { $ne: resetToken._id } })

  return { success: true }
})
