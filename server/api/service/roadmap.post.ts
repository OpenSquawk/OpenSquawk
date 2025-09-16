import { createHash } from 'node:crypto'
import { createError, getRequestHeader, getRequestIP, readBody, H3Event } from 'h3'
import { RoadmapVote } from '../../models/RoadmapVote'
import { ROADMAP_ITEMS, ROADMAP_ITEM_KEYS } from '../../data/roadmapItems'

interface RoadmapVotePayload {
  key?: string
  importance?: number
}

const MAX_VOTES_PER_SUBMISSION = ROADMAP_ITEMS.length

function buildClientHash(event: H3Event) {
  const ip = getRequestIP(event) || getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = getRequestHeader(event, 'user-agent') || 'unknown'
  return createHash('sha256').update(`${ip}|${userAgent}`).digest('hex')
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ votes?: RoadmapVotePayload[] }>(event)

  if (!body?.votes || !Array.isArray(body.votes) || body.votes.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Keine Stimmen übermittelt' })
  }

  if (body.votes.length > MAX_VOTES_PER_SUBMISSION) {
    throw createError({ statusCode: 400, statusMessage: 'Zu viele Stimmen in einer Anfrage' })
  }

  const normalized = new Map<string, number>()

  for (const vote of body.votes) {
    if (!vote || typeof vote !== 'object') {
      continue
    }
    const key = String(vote.key ?? '').trim()
    if (!ROADMAP_ITEM_KEYS.has(key)) {
      throw createError({ statusCode: 400, statusMessage: `Unbekannter Roadmap-Eintrag: ${key || '?'}` })
    }
    const importance = Math.round(Number(vote.importance ?? 0))
    if (!Number.isFinite(importance) || importance < 1 || importance > 5) {
      throw createError({ statusCode: 400, statusMessage: 'Bewertung muss zwischen 1 und 5 liegen' })
    }
    normalized.set(key, importance)
  }

  if (normalized.size === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Keine gültigen Stimmen gefunden' })
  }

  const clientHash = buildClientHash(event)
  const submittedAt = new Date()

  const docs = Array.from(normalized.entries()).map(([key, importance]) => ({
    itemKey: key,
    importance,
    submittedAt,
    clientHash,
  }))

  await RoadmapVote.insertMany(docs)

  return {
    success: true,
    saved: docs.length,
  }
})
