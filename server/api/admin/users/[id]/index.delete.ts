import { createError, defineEventHandler } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { User } from '../../../../models/User'
import { LearnProfile } from '../../../../models/LearnProfile'
import { BridgeToken } from '../../../../models/BridgeToken'
import { PasswordResetToken } from '../../../../models/PasswordResetToken'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const params = event.context.params as { id?: string }
  const userId = params?.id

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user ID' })
  }

  if (String(admin._id) === userId) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot delete your own account.' })
  }

  const user = await User.findById(userId)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  if (user.role !== 'user') {
    throw createError({ statusCode: 400, statusMessage: 'Only regular user accounts can be deleted.' })
  }

  await Promise.all([
    LearnProfile.deleteOne({ user: user._id }).catch(() => null),
    BridgeToken.deleteMany({ user: user._id }).catch(() => null),
    PasswordResetToken.deleteMany({ user: user._id }).catch(() => null),
  ])

  await user.deleteOne()

  return { success: true }
})
