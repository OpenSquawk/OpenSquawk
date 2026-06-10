import type { H3Event } from 'h3'
import { createError, getHeader, getQuery } from 'h3'

let warnedMissingSecret = false

/**
 * Guards cron endpoints. Accepts the secret via `?secret=` query param
 * (matches the existing KPI_CRON_SECRET convention, easy to use in a
 * Coolify scheduled-task URL) or via the `x-cron-secret` header.
 *
 * When neither CRON_SECRET nor KPI_CRON_SECRET is configured the request
 * is allowed with a loud warning so existing deployments keep working
 * until the env var is set.
 */
export function requireCronSecret(event: H3Event) {
  const secret = (process.env.CRON_SECRET || process.env.KPI_CRON_SECRET || '').trim()

  if (!secret) {
    if (!warnedMissingSecret) {
      console.warn(
        '[cron] CRON_SECRET is not set — cron endpoints are publicly callable. ' +
        'Set CRON_SECRET and append ?secret=<value> to your scheduled-task URLs.',
      )
      warnedMissingSecret = true
    }
    return
  }

  const query = getQuery(event)
  const provided =
    (typeof query.secret === 'string' ? query.secret : '') ||
    (getHeader(event, 'x-cron-secret') || '')

  if (provided !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid cron secret.' })
  }
}
