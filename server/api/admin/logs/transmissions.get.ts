import { createError, defineEventHandler, getQuery } from 'h3'
import type { FilterQuery } from 'mongoose'
import { requireAdmin } from '../../../utils/auth'
import { TransmissionLog, type TransmissionLogDocument } from '../../../models/TransmissionLog'

const CHANNELS = new Set(['ptt', 'say', 'text'])
const DIRECTIONS = new Set(['incoming', 'outgoing'])
const ROLES = new Set(['pilot', 'atc'])

type TransmissionListItem = {
  id: string
  role: string
  channel: string
  direction: string
  text: string
  normalized?: string
  createdAt: string
  metadata?: Record<string, any>
  user?: { id: string; email: string; name?: string; role: string }
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mapTransmission(doc: any): TransmissionListItem {
  return {
    id: String(doc._id),
    role: doc.role,
    channel: doc.channel,
    direction: doc.direction,
    text: doc.text,
    normalized: doc.normalized || undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    metadata: doc.metadata || undefined,
    user: doc.user
      ? {
          id: String(doc.user._id),
          email: doc.user.email,
          name: doc.user.name || undefined,
          role: doc.user.role,
        }
      : undefined,
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const channel = typeof query.channel === 'string' ? query.channel.trim() : ''
  const direction = typeof query.direction === 'string' ? query.direction.trim() : ''
  const role = typeof query.role === 'string' ? query.role.trim() : ''
  const sinceRaw = typeof query.since === 'string' ? query.since.trim() : ''

  const page = Number.parseInt(String(query.page ?? '1'), 10) || 1
  const pageSizeRaw = Number.parseInt(String(query.pageSize ?? query.limit ?? '20'), 10)
  const pageSize = Math.min(Math.max(pageSizeRaw || 20, 1), 100)
  const skip = (page - 1) * pageSize

  const filter: FilterQuery<TransmissionLogDocument> = {}
  const andConditions: FilterQuery<TransmissionLogDocument>[] = []

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i')
    andConditions.push({ $or: [{ text: regex }, { normalized: regex }] })
  }

  if (channel) {
    if (!CHANNELS.has(channel)) {
      throw createError({ statusCode: 400, statusMessage: 'Unbekannter Kanal' })
    }
    filter.channel = channel as TransmissionLogDocument['channel']
  }

  if (direction) {
    if (!DIRECTIONS.has(direction)) {
      throw createError({ statusCode: 400, statusMessage: 'Ungültige Richtung' })
    }
    filter.direction = direction as TransmissionLogDocument['direction']
  }

  if (role) {
    if (!ROLES.has(role)) {
      throw createError({ statusCode: 400, statusMessage: 'Unbekannte Rolle' })
    }
    filter.role = role
  }

  if (sinceRaw) {
    const since = new Date(sinceRaw)
    if (Number.isNaN(since.valueOf())) {
      throw createError({ statusCode: 400, statusMessage: 'Ungültiger Zeitraum' })
    }
    filter.createdAt = { ...(filter.createdAt as any), $gte: since }
  }

  if (andConditions.length) {
    filter.$and = andConditions
  }

  const [total, items] = await Promise.all([
    TransmissionLog.countDocuments(filter),
    TransmissionLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('user', 'email name role')
      .lean(),
  ])

  return {
    items: items.map(mapTransmission),
    pagination: {
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize) || 1,
    },
  }
})
