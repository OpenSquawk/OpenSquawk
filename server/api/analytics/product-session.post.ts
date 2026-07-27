import { createError, defineEventHandler, readBody } from 'h3'
import { getUserFromEvent } from '../../utils/auth'
import { ProductUsageSession } from '../../models/ProductUsageSession'
import { emit as emitTelemetry } from '../../utils/telemetry'

/**
 * How long the user spent in Classroom / Live ATC.
 *
 * Moved off the website's /api/service/analytics/* path: that one was reachable
 * unauthenticated from any browser, and post-split it lives in a different
 * repo. The app now writes to its own database and mirrors through the ordinary
 * telemetry channel — so a self-hosted instance keeps this data entirely to
 * itself.
 */

interface ProductSessionBody {
  product?: string
  path?: string
  durationSeconds?: number
  startedAt?: string
  endedAt?: string
}

function cleanPath(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 180) : undefined
}

function parseDate(value: unknown, fallback: Date) {
  if (typeof value !== 'string') {
    return fallback
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  const body = await readBody<ProductSessionBody>(event).catch(() => ({} as ProductSessionBody))
  const product = body.product === 'liveatc' ? 'liveatc' : body.product === 'classroom' ? 'classroom' : null

  if (!product) {
    throw createError({ statusCode: 400, statusMessage: 'Valid product is required.' })
  }

  const durationSeconds =
    typeof body.durationSeconds === 'number' && Number.isFinite(body.durationSeconds)
      ? Math.max(1, Math.min(60 * 60 * 6, Math.round(body.durationSeconds)))
      : 0

  if (durationSeconds < 5) {
    return { success: true, ignored: true }
  }

  const endedAt = parseDate(body.endedAt, new Date())
  const startedAt = parseDate(body.startedAt, new Date(endedAt.getTime() - durationSeconds * 1000))

  const record = {
    user: user?._id,
    product,
    path: cleanPath(body.path),
    durationSeconds,
    startedAt,
    endedAt,
  }

  await ProductUsageSession.create(record)

  emitTelemetry('product-usage-session', {
    ...record,
    user: user?._id ? String(user._id) : undefined,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
  })

  return { success: true }
})
