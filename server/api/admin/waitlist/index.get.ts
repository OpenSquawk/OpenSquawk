import { defineEventHandler, getQuery } from 'h3'
import type { FilterQuery } from 'mongoose'
import { requireAdmin } from '../../../utils/auth'
import { WaitlistEntry, type WaitlistEntryDocument } from '../../../models/WaitlistEntry'
import type { InvitationCodeDocument } from '../../../models/InvitationCode'

type WaitlistListItem = {
  id: string
  email: string
  name?: string
  notes?: string
  source?: string
  joinedAt: string
  activatedAt?: string
  wantsProductUpdates: boolean
  updatesOptedInAt?: string
  invitationSentAt?: string
  invitation?: {
    id: string
    code: string
    channel: string
    label?: string
    createdAt: string
    expiresAt?: string
    usedAt?: string
    sentAt?: string
  }
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeDate(value?: Date | string | null) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return undefined
  return date.toISOString()
}

function mapWaitlistEntry(doc: any): WaitlistListItem {
  const invitationDoc = doc.invitationCode as InvitationCodeDocument | undefined
  const sentAt = normalizeDate(doc.invitationSentAt)

  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name || undefined,
    notes: doc.notes || undefined,
    source: doc.source || undefined,
    joinedAt: normalizeDate(doc.joinedAt) || new Date().toISOString(),
    activatedAt: normalizeDate(doc.activatedAt),
    wantsProductUpdates: Boolean(doc.wantsProductUpdates),
    updatesOptedInAt: normalizeDate(doc.updatesOptedInAt),
    invitationSentAt: sentAt,
    invitation:
      invitationDoc && invitationDoc.code
        ? {
            id: String(invitationDoc._id),
            code: invitationDoc.code,
            channel: invitationDoc.channel,
            label: invitationDoc.label || undefined,
            createdAt: normalizeDate(invitationDoc.createdAt) || new Date().toISOString(),
            expiresAt: normalizeDate(invitationDoc.expiresAt),
            usedAt: normalizeDate(invitationDoc.usedAt),
            sentAt,
          }
        : undefined,
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const updatesFilterRaw = typeof query.updates === 'string' ? query.updates.trim() : 'all'
  const statusFilterRaw = typeof query.status === 'string' ? query.status.trim() : 'all'

  const updatesFilter = ['updates', 'waitlist'].includes(updatesFilterRaw) ? updatesFilterRaw : 'all'
  const statusFilter = ['activated', 'pending'].includes(statusFilterRaw) ? statusFilterRaw : 'all'

  const page = Number.parseInt(String(query.page ?? '1'), 10) || 1
  const pageSizeRaw = Number.parseInt(String(query.pageSize ?? query.limit ?? '20'), 10)
  const pageSize = Math.min(Math.max(pageSizeRaw || 20, 1), 100)
  const skip = (page - 1) * pageSize

  const filter: FilterQuery<WaitlistEntryDocument> = {}
  const andConditions: FilterQuery<WaitlistEntryDocument>[] = []

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i')
    andConditions.push({ $or: [{ email: regex }, { name: regex }, { notes: regex }] })
  }

  if (updatesFilter === 'updates') {
    andConditions.push({ wantsProductUpdates: true } as FilterQuery<WaitlistEntryDocument>)
  } else if (updatesFilter === 'waitlist') {
    andConditions.push({
      $or: [
        { wantsProductUpdates: { $exists: false } },
        { wantsProductUpdates: { $ne: true } },
      ],
    } as FilterQuery<WaitlistEntryDocument>)
  }

  if (statusFilter === 'activated') {
    andConditions.push({ activatedAt: { $exists: true, $ne: null } } as FilterQuery<WaitlistEntryDocument>)
  } else if (statusFilter === 'pending') {
    andConditions.push({
      $or: [
        { activatedAt: null },
        { activatedAt: { $exists: false } },
      ],
    } as FilterQuery<WaitlistEntryDocument>)
  }

  if (andConditions.length) {
    filter.$and = andConditions
  }

  const [total, items, overallTotal, updatesCount, activatedCount] = await Promise.all([
    WaitlistEntry.countDocuments(filter),
    WaitlistEntry.find(filter)
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('invitationCode')
      .lean(),
    WaitlistEntry.countDocuments(),
    WaitlistEntry.countDocuments({ wantsProductUpdates: true }),
    WaitlistEntry.countDocuments({ activatedAt: { $exists: true, $ne: null } }),
  ])

  const pendingCount = Math.max(0, overallTotal - activatedCount)

  return {
    items: items.map(mapWaitlistEntry),
    pagination: {
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize) || 1,
    },
    stats: {
      total: overallTotal,
      updates: updatesCount,
      activated: activatedCount,
      pending: pendingCount,
    },
  }
})

