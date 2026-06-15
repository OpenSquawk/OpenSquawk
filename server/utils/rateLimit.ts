import type { H3Event } from 'h3'
import { createError } from 'h3'

interface WindowEntry {
  windowStart: number
  count: number
}

// In-memory fixed-window limiter. Per process — good enough for a single
// Coolify instance; swap for a shared store if the app ever scales out.
const windows = new Map<string, WindowEntry>()

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of windows) {
    if (now - entry.windowStart > windowMs * 2) {
      windows.delete(key)
    }
  }
}

export function getClientIp(event: H3Event): string {
  const forwarded = event.node.req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]!.trim()
  }
  return event.node.req.socket?.remoteAddress || 'unknown'
}

/**
 * Throws 429 when `key` exceeds `limit` requests per `windowMs`.
 * Use a user id as key where available, client IP otherwise.
 */
export function enforceRateLimit(
  event: H3Event,
  bucket: string,
  key: string,
  limit: number,
  windowMs = 60_000,
) {
  const now = Date.now()
  cleanup(now, windowMs)

  const mapKey = `${bucket}:${key}`
  const entry = windows.get(mapKey)

  if (!entry || now - entry.windowStart >= windowMs) {
    windows.set(mapKey, { windowStart: now, count: 1 })
    return
  }

  entry.count += 1
  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000)
    event.node.res.setHeader('Retry-After', String(Math.max(retryAfter, 1)))
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests — slow down and try again shortly.',
    })
  }
}
