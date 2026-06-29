import type { H3Event } from 'h3'
import { createError, getHeader } from 'h3'

let warnedMissingSecret = false

/**
 * Guards internal server-to-server endpoints (e.g. the Python decision backend
 * calling back into Nuxt). The secret is read from SERVICE_SECRET and must be
 * supplied via the `x-service-secret` header.
 *
 * Fail closed: if no secret is configured the endpoint refuses to run (503)
 * rather than being publicly callable.
 */
export function requireServiceSecret(event: H3Event) {
  const secret = (process.env.SERVICE_SECRET || '').trim()

  if (!secret) {
    if (!warnedMissingSecret) {
      console.error(
        '[service] SERVICE_SECRET is not set — internal endpoints are disabled (503). ' +
        'Set SERVICE_SECRET and pass it via the x-service-secret header.',
      )
      warnedMissingSecret = true
    }
    throw createError({ statusCode: 503, statusMessage: 'Service endpoint is not configured.' })
  }

  const provided = (getHeader(event, 'x-service-secret') || '').trim()
  if (provided !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid service secret.' })
  }
}
