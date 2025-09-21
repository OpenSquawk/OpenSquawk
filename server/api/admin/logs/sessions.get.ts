import { defineEventHandler, getQuery } from 'h3'
import { requireAdmin } from '../../../utils/auth'
import { TransmissionLog } from '../../../models/TransmissionLog'

interface SessionSummaryEntry {
  sessionId: string
  startedAt: string | null
  updatedAt: string | null
  entryCount: number
  callsign?: string
  lastMessage?: {
    text: string
    role: string
    channel: string
    createdAt: string
  }
}

function toISO(value: any): string | null {
  if (!value) {
    return null
  }
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? null : date.toISOString()
}

function extractCallsign(entry: any): string | undefined {
  const fromMetadata = (payload: any) =>
    payload?.metadata?.context?.variables?.callsign ||
    payload?.metadata?.context?.variables?.CALLSIGN ||
    payload?.metadata?.context?.variables?.Callsign

  return (
    fromMetadata(entry.lastEntry) ||
    fromMetadata(entry.firstEntry) ||
    entry.lastEntry?.metadata?.variables?.callsign ||
    entry.firstEntry?.metadata?.variables?.callsign ||
    undefined
  )
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const page = Math.max(parseInt(String(query.page ?? '1'), 10) || 1, 1)
  const pageSizeRaw = parseInt(String(query.pageSize ?? query.limit ?? '20'), 10)
  const pageSize = Math.min(Math.max(pageSizeRaw || 20, 1), 100)
  const skip = (page - 1) * pageSize

  const matchStage = { sessionId: { $exists: true, $nin: [null, ''] } }

  const [sessionDocs, totalCountAgg] = await Promise.all([
    TransmissionLog.aggregate([
      { $match: matchStage },
      { $sort: { sessionId: 1, createdAt: 1 } },
      {
        $group: {
          _id: '$sessionId',
          firstEntry: { $first: '$$ROOT' },
          lastEntry: { $last: '$$ROOT' },
          count: { $sum: 1 },
        },
      },
      { $sort: { 'lastEntry.createdAt': -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ]).exec(),
    TransmissionLog.aggregate([
      { $match: matchStage },
      { $group: { _id: '$sessionId' } },
      { $count: 'count' },
    ]).exec(),
  ])

  const total = totalCountAgg?.[0]?.count || 0

  const items: SessionSummaryEntry[] = sessionDocs.map((entry: any) => {
    const first = entry.firstEntry || {}
    const last = entry.lastEntry || {}
    return {
      sessionId: entry._id,
      startedAt: toISO(first.createdAt),
      updatedAt: toISO(last.createdAt),
      entryCount: entry.count || 0,
      callsign: extractCallsign(entry),
      lastMessage: last.text
        ? {
            text: last.text,
            role: last.role,
            channel: last.channel,
            createdAt: toISO(last.createdAt) || new Date().toISOString(),
          }
        : undefined,
    }
  })

  return {
    items,
    pagination: {
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize) || 1,
    },
  }
})
