import { createError, readBody } from 'h3'
import { LandingAnalyticsEvent, type LandingAnalyticsEventType } from '../../../models/LandingAnalyticsEvent'

interface LandingAnalyticsBody {
  type?: LandingAnalyticsEventType
  product?: string
  sessionId?: string
  path?: string
  source?: string
  scrollDepth?: number
}

const allowedTypes = new Set<LandingAnalyticsEventType>(['view', 'scrolled', 'waitlist_submit'])

function cleanText(value: unknown, maxLength = 180) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : undefined
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LandingAnalyticsBody>(event).catch(() => ({} as LandingAnalyticsBody))
  const type = body.type && allowedTypes.has(body.type) ? body.type : null

  if (!type) {
    throw createError({ statusCode: 400, statusMessage: 'Valid analytics event type is required.' })
  }

  const scrollDepth =
    typeof body.scrollDepth === 'number' && Number.isFinite(body.scrollDepth)
      ? Math.max(0, Math.min(100, Math.round(body.scrollDepth)))
      : undefined

  await LandingAnalyticsEvent.create({
    type,
    product: body.product === 'liveatc' ? 'liveatc' : 'classroom',
    sessionId: cleanText(body.sessionId, 80),
    path: cleanText(body.path, 180),
    source: cleanText(body.source, 180),
    scrollDepth,
  })

  return { success: true }
})
