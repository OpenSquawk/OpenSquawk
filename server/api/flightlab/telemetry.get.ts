import { requireUserSession } from '../../utils/auth'
import { flightlabTelemetryStore } from '../../utils/flightlabTelemetry'

/**
 * Returns the latest bridge telemetry for the authenticated user.
 * Used by FlightLab in solo mode (no WebSocket session) to poll telemetry.
 *
 * GET /api/flightlab/telemetry
 * Authorization: Bearer <access-token>
 */
export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const userId = String(user._id)
  const telemetry = flightlabTelemetryStore.get(userId)

  return {
    telemetry,
    timestamp: telemetry?.timestamp ?? null,
  }
})
