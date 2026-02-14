import { defineEventHandler, readBody, getHeader } from 'h3'
import { resolveUserFromToken } from '../../utils/auth'
import { flightlabTelemetryStore } from '../../utils/flightlabTelemetry'

/**
 * Receives MSFS SimConnect telemetry data from an external bridge application.
 *
 * The bridge should POST telemetry data with an Authorization header so we
 * can route the data to the correct FlightLab WebSocket session.
 *
 * ──────────────────────────────────────────
 * EXAMPLE REQUEST (from SimBridge app):
 * ──────────────────────────────────────────
 *
 * POST /api/bridge/data
 * Authorization: Bearer <user-jwt-token>
 * Content-Type: application/json
 *
 * {
 *   "AIRSPEED_INDICATED": 145.2,
 *   "GROUND_VELOCITY": 142.8,
 *   "VERTICAL_SPEED": 0,
 *   "PLANE_ALTITUDE": 364,
 *   "PLANE_PITCH_DEGREES": 0.5,
 *   "TURB_ENG_N1_1": 87.3,
 *   "TURB_ENG_N1_2": 86.9,
 *   "SIM_ON_GROUND": true,
 *   "GEAR_HANDLE_POSITION": true,
 *   "FLAPS_HANDLE_INDEX": 2,
 *   "BRAKE_PARKING_POSITION": false,
 *   "AUTOPILOT_MASTER": false
 * }
 *
 * ──────────────────────────────────────────
 * RESPONSE: 204 No Content (success)
 *           401 Unauthorized (missing/invalid token)
 * ──────────────────────────────────────────
 */
export default defineEventHandler(async (event) => {
  // Resolve user from Bearer token (optional — also works with ?userId query param)
  const user = await resolveUserFromToken(event)
  const userId = user?._id?.toString()
    ?? new URL(event.node.req.url ?? '', 'http://localhost').searchParams.get('userId')

  if (!userId) {
    event.node.res.statusCode = 401
    return { error: 'Authorization required — send Bearer token or ?userId query param' }
  }

  const body = await readBody(event)

  // Store telemetry and broadcast to WebSocket subscribers
  flightlabTelemetryStore.update(userId, body)

  event.node.res.statusCode = 204
})
