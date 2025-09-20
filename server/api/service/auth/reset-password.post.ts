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
    throw createError({ statusCode: 400, statusMessage: 'Token and new password required' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters long' })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const resetToken = await PasswordResetToken.findOne({ tokenHash })

  if (!resetToken || (resetToken.expiresAt && resetToken.expiresAt < new Date()) || resetToken.usedAt) {
    throw createError({ statusCode: 400, statusMessage: 'This link is invalid or has expired' })
  }

  const user = await User.findById(resetToken.user)
  if (!user) {
    await resetToken.deleteOne().catch(() => undefined)
    throw createError({ statusCode: 400, statusMessage: 'This link is invalid or has expired' })
  }

  user.passwordHash = await hashPassword(password)
  user.tokenVersion += 1
  await user.save()

  resetToken.usedAt = new Date()
  await resetToken.save()
  await PasswordResetToken.deleteMany({ user: user._id, _id: { $ne: resetToken._id } })

  return { success: true }
})
