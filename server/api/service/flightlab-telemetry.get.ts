import { createError, defineEventHandler, getQuery } from 'h3'
import { requireServiceSecret } from '../../utils/serviceAuth'
import { flightlabTelemetryStore } from '../../utils/flightlabTelemetry'

/**
 * APP-SIDE. Latest bridge telemetry for one identity, for the website process.
 *
 * The bridge posts to /api/bridge/data, which lands in this process's
 * in-memory store. FlightLab lives on the website and is therefore a different
 * process since the repo split — it reads the store through this endpoint
 * instead of importing it.
 *
 * Pull, not push: the website asks only while somebody is actually watching a
 * FlightLab screen, so a running bridge costs nothing when nobody is.
 *
 * `subject` is the SSO subject, which is also the key the store uses:
 * BridgeToken.user references AppUser._id, and AppUser._id *is* the subject
 * (see server/models/AppUser.ts).
 *
 * GET /api/service/flightlab-telemetry?subject=<id>
 * x-service-secret: <SERVICE_SECRET>
 */
export default defineEventHandler((event) => {
  requireServiceSecret(event)

  const subject = String(getQuery(event).subject || '').trim()
  if (!subject) {
    throw createError({ statusCode: 400, statusMessage: 'Missing subject' })
  }

  const telemetry = flightlabTelemetryStore.get(subject)

  return {
    telemetry,
    timestamp: telemetry?.timestamp ?? null,
  }
})
