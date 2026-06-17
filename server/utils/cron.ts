import type { H3Event } from 'h3'
import { createError, getHeader, getQuery } from 'h3'

let warnedMissingSecret = false

/**
 * Guards cron endpoints. The secret is read from CRON_SECRET (or the legacy
 * KPI_CRON_SECRET) and must be supplied via the `x-cron-secret` header
 * (preferred) or, for schedulers that can only call a URL, the `?secret=`
 * query param. Prefer the header — query strings tend to end up in access logs.
 *
 * Fail closed: these endpoints send real emails and mint invite codes, so if no
 * secret is configured the endpoint refuses to run (503) rather than being
 * publicly callable.
 */
export function requireCronSecret(event: H3Event) {
  const secret = (process.env.CRON_SECRET || '').trim()

  if (!secret) {
    if (!warnedMissingSecret) {
      console.error(
        '[cron] CRON_SECRET is not set — cron endpoints are disabled (returning 503). ' +
        'Set CRON_SECRET and pass it via the x-cron-secret header.',
      )
      warnedMissingSecret = true
    }
    throw createError({ statusCode: 503, statusMessage: 'Cron endpoint is not configured.' })
  }

  const query = getQuery(event)
  const provided =
    (getHeader(event, 'x-cron-secret') || '') ||
    (typeof query.secret === 'string' ? query.secret : '')

  if (provided !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid cron secret.' })
  }
}
