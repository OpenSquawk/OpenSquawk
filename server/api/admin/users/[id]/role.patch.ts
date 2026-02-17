import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { User } from '../../../../models/User'

type UpdateRoleBody = {
  role?: string
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const params = event.context.params as { id?: string }
  const userId = params?.id

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user ID' })
  }

  const body = await readBody<UpdateRoleBody>(event).catch(() => ({}) as UpdateRoleBody)
  const role = body.role?.trim()

  if (!role || !['user', 'admin', 'dev'].includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
  }

  const target = await User.findById(userId)
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const previousRole = target.role
  target.role = role as any

  if (role !== previousRole) {
    target.tokenVersion += 1
  }

  await target.save()

  return {
    success: true,
    user: {
      id: String(target._id),
      email: target.email,
      name: target.name || undefined,
      role: target.role,
      createdAt: target.createdAt ? target.createdAt.toISOString() : new Date().toISOString(),
      lastLoginAt: target.lastLoginAt ? target.lastLoginAt.toISOString() : undefined,
      invitationCodesIssued: target.invitationCodesIssued || 0,
      updatedBy: String(admin._id),
    },
  }
})
