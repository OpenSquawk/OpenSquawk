import { defineEventHandler, createError } from 'h3'
import { requireAdmin } from '../../../../utils/auth'
import { TransmissionLog } from '../../../../models/TransmissionLog'

function toISO(value: any): string | null {
  if (!value) {
    return null
  }
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? null : date.toISOString()
}

function mapEntry(doc: any) {
  return {
    id: String(doc._id),
    role: doc.role,
    channel: doc.channel,
    direction: doc.direction,
    text: doc.text,
    normalized: doc.normalized || undefined,
    createdAt: toISO(doc.createdAt) || new Date().toISOString(),
    metadata: doc.metadata || undefined,
    sessionId: doc.sessionId || undefined,
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

function extractCallsign(entries: any[]): string | undefined {
  for (const entry of [...entries].reverse()) {
    const callsign =
      entry.metadata?.context?.variables?.callsign ||
      entry.metadata?.context?.variables?.CALLSIGN ||
      entry.metadata?.variables?.callsign
    if (callsign) {
      return callsign
    }
  }
  return undefined
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sessionId = event.context.params?.sessionId

  if (!sessionId || typeof sessionId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Session ID is required' })
  }

  const items = await TransmissionLog.find({ sessionId })
    .sort({ createdAt: 1 })
    .populate('user', 'email name role')
    .lean()
    .exec()

  if (!items.length) {
    return {
      sessionId,
      startedAt: null,
      updatedAt: null,
      entryCount: 0,
      callsign: undefined,
      entries: [],
    }
  }

  const startedAt = toISO(items[0]?.createdAt)
  const updatedAt = toISO(items[items.length - 1]?.createdAt)
  const callsign = extractCallsign(items)

  return {
    sessionId,
    startedAt,
    updatedAt,
    entryCount: items.length,
    callsign,
    entries: items.map(mapEntry),
  }
})
