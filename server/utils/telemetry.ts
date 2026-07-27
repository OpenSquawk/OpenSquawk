/**
 * Outbound telemetry mirror.
 *
 * The app always writes to its **own** database first — that is its data, and
 * this channel must never be a dependency of anything. Only if both
 * TELEMETRY_URL and SERVICE_SECRET are set is a copy additionally mirrored to
 * the hosted service's ingest endpoint.
 *
 * Self-host default: both unset → nothing ever leaves the instance. That is the
 * point, not a fallback.
 *
 * Design constraints, all of them deliberate:
 *  - fire-and-forget: emit() never awaits the network and never throws
 *  - bounded buffer: on overflow the oldest entries are dropped, so a dead sink
 *    can cost memory neither indefinitely nor unboundedly
 *  - no retries beyond the current batch: /api/atc/say must return 200 whether
 *    or not a log sink exists
 *
 * The wire contract below — {kind, payload} — is the interface between the two
 * repos. Neither side shares a Mongoose schema with the other; each owns its
 * own. That is what makes two independent databases possible.
 */

export type TelemetryKind =
  | 'transmission-log'
  | 'bug-report'
  | 'llm-routing-decision'
  | 'product-usage-session'

export interface TelemetryEnvelope {
  kind: TelemetryKind
  payload: Record<string, unknown>
  emittedAt: string
}

const MAX_BUFFERED = 500
const MAX_BATCH = 50
const FLUSH_DELAY_MS = 2_000
const REQUEST_TIMEOUT_MS = 5_000

const buffer: TelemetryEnvelope[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let flushing = false
let droppedSinceLastWarning = 0
let warnedMissingConfig = false

interface TelemetryConfig {
  url: string
  secret: string
}

function getTelemetryConfig(): TelemetryConfig | null {
  const url = (process.env.TELEMETRY_URL || '').trim()
  const secret = (process.env.SERVICE_SECRET || '').trim()
  if (!url || !secret) {
    if (url && !secret && !warnedMissingConfig) {
      console.warn('[telemetry] TELEMETRY_URL is set but SERVICE_SECRET is not — mirroring stays off.')
      warnedMissingConfig = true
    }
    return null
  }
  return { url, secret }
}

export function isTelemetryEnabled() {
  return getTelemetryConfig() !== null
}

/**
 * Queue one record for mirroring. Returns immediately; callers do not await and
 * do not handle errors, because a telemetry failure is not their problem.
 */
export function emit(kind: TelemetryKind, payload: Record<string, unknown>) {
  if (!isTelemetryEnabled()) return

  if (buffer.length >= MAX_BUFFERED) {
    // Drop the oldest: a stalled sink must not push out fresh data forever.
    buffer.shift()
    droppedSinceLastWarning += 1
  }

  buffer.push({ kind, payload, emittedAt: new Date().toISOString() })
  scheduleFlush()
}

function scheduleFlush() {
  if (flushTimer || flushing) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flush()
  }, FLUSH_DELAY_MS)
  // Never hold the process open for a telemetry batch.
  if (typeof flushTimer === 'object' && flushTimer && 'unref' in flushTimer) {
    ;(flushTimer as unknown as { unref: () => void }).unref()
  }
}

export async function flush() {
  const config = getTelemetryConfig()
  if (!config || flushing || !buffer.length) return

  flushing = true
  try {
    if (droppedSinceLastWarning > 0) {
      console.warn(`[telemetry] dropped ${droppedSinceLastWarning} record(s): buffer full`)
      droppedSinceLastWarning = 0
    }

    while (buffer.length) {
      const batch = buffer.splice(0, MAX_BATCH)
      try {
        await $fetch(config.url, {
          method: 'POST',
          headers: { 'x-service-secret': config.secret },
          body: { records: batch },
          timeout: REQUEST_TIMEOUT_MS,
        })
      } catch (error: any) {
        // The batch is gone. Re-queueing it would let an unreachable sink build
        // an unbounded backlog, which is exactly what this must not do.
        console.warn(`[telemetry] mirroring ${batch.length} record(s) failed:`, error?.message || error)
        break
      }
    }
  } finally {
    flushing = false
    if (buffer.length) scheduleFlush()
  }
}

/** Test seam — the buffer is module-local and otherwise unreachable. */
export function __resetTelemetryBufferForTests() {
  buffer.length = 0
  droppedSinceLastWarning = 0
  warnedMissingConfig = false
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
}

/** Test seam — inspect what is queued without flushing. */
export function __peekTelemetryBufferForTests(): readonly TelemetryEnvelope[] {
  return buffer
}
