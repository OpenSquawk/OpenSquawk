import { createError, defineEventHandler, getQuery } from 'h3'
import type { FilterQuery } from 'mongoose'
import { requireAdmin } from '../../utils/auth'
import { InvitationCode, type InvitationCodeDocument } from '../../models/InvitationCode'

const CHANNELS = new Set(['user', 'manual', 'bootstrap', 'admin'])

type InvitationListItem = {
  id: string
  code: string
  channel: string
  label?: string
  createdAt: string
  expiresAt?: string
  usedAt?: string
  createdBy?: { id: string; email: string; name?: string; role: string }
  usedBy?: { id: string; email: string; name?: string; role: string }
}

function mapInvitation(doc: any): InvitationListItem {
  return {
    id: String(doc._id),
    code: doc.code,
    channel: doc.channel,
    label: doc.label || undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : undefined,
    usedAt: doc.usedAt ? new Date(doc.usedAt).toISOString() : undefined,
    createdBy: doc.createdBy
      ? {
          id: String(doc.createdBy._id),
          email: doc.createdBy.email,
          name: doc.createdBy.name || undefined,
          role: doc.createdBy.role,
        }
      : undefined,
    usedBy: doc.usedBy
      ? {
          id: String(doc.usedBy._id),
          email: doc.usedBy.email,
          name: doc.usedBy.name || undefined,
          role: doc.usedBy.role,
        }
      : undefined,
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const channel = typeof query.channel === 'string' ? query.channel.trim() : ''
  const status = typeof query.status === 'string' ? query.status.trim().toLowerCase() : ''

  const page = Number.parseInt(String(query.page ?? '1'), 10) || 1
  const pageSizeRaw = Number.parseInt(String(query.pageSize ?? query.limit ?? '25'), 10)
  const pageSize = Math.min(Math.max(pageSizeRaw || 25, 1), 100)
  const skip = (page - 1) * pageSize

  const filter: FilterQuery<InvitationCodeDocument> = {}
  const andConditions: FilterQuery<InvitationCodeDocument>[] = []
  const now = new Date()

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    andConditions.push({ $or: [{ code: regex }, { label: regex }] })
  }

  if (channel) {
    if (!CHANNELS.has(channel)) {
      throw createError({ statusCode: 400, statusMessage: 'Unknown channel' })
    }
    filter.channel = channel
  }

  if (status) {
    if (status === 'active') {
      filter.usedBy = { $exists: false }
      andConditions.push({ $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }] })
    } else if (status === 'used') {
      filter.usedBy = { $exists: true }
    } else if (status === 'expired') {
      filter.usedBy = { $exists: false }
      filter.expiresAt = { $lt: now }
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
    }
  }

  if (andConditions.length) {
    filter.$and = andConditions
  }

  const [total, items] = await Promise.all([
    InvitationCode.countDocuments(filter),
    InvitationCode.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('createdBy', 'email name role')
      .populate('usedBy', 'email name role'),
  ])

  return {
    items: items.map(mapInvitation),
    pagination: {
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize) || 1,
    },
  }
})
