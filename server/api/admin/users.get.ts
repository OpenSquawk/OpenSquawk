import { createError, defineEventHandler, getQuery } from 'h3'
import type { FilterQuery } from 'mongoose'
import { requireAdmin } from '../../utils/auth'
import { User, type UserDocument } from '../../models/User'

type UserListItem = {
  id: string
  email: string
  name?: string
  role: string
  createdAt: string
  lastLoginAt?: string
  invitationCodesIssued: number
}

function mapUser(doc: any): UserListItem {
  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name || undefined,
    role: doc.role,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt).toISOString() : undefined,
    invitationCodesIssued: doc.invitationCodesIssued || 0,
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)

  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const role = typeof query.role === 'string' ? query.role.trim() : ''
  const page = Number.parseInt(String(query.page ?? '1'), 10) || 1
  const pageSizeRaw = Number.parseInt(String(query.pageSize ?? query.limit ?? '20'), 10)
  const pageSize = Math.min(Math.max(pageSizeRaw || 20, 1), 100)
  const skip = (page - 1) * pageSize

  const filter: FilterQuery<UserDocument> = {}

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ email: regex }, { name: regex }]
  }

  if (role) {
    if (!['user', 'admin', 'dev'].includes(role)) {
      throw createError({ statusCode: 400, statusMessage: 'Ungültige Rolle' })
    }
    filter.role = role
  }

  const [total, items] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
  ])

  const [userCount, adminCount, devCount] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'dev' }),
  ])

  return {
    items: items.map(mapUser),
    pagination: {
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize) || 1,
    },
    roles: {
      user: userCount,
      admin: adminCount,
      dev: devCount,
    },
  }
})
