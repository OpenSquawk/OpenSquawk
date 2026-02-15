import { createError, defineEventHandler, readBody } from 'h3'
import { BridgeToken } from '../../models/BridgeToken'
import { getBridgeTokenFromHeader } from '../../utils/bridge'
import { flightlabTelemetryStore } from '../../utils/flightlabTelemetry'

/**
 * Receives MSFS SimConnect telemetry data from an external bridge application.
 *
 * The bridge should POST telemetry data with an x-bridge-token header so we
 * can route the data to the correct FlightLab WebSocket session.
 *
 * ──────────────────────────────────────────
 * EXAMPLE REQUEST (from SimBridge app):
 * ──────────────────────────────────────────
 *
 * POST /api/bridge/data
 * x-bridge-token: <bridge-token>
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
  const bridgeToken = getBridgeTokenFromHeader(event)
  if (!bridgeToken) {
    throw createError({ statusCode: 401, statusMessage: 'x-bridge-token header fehlt oder ist ungültig.' })
  }

  const bridgeDocument = await BridgeToken.findOne({ token: bridgeToken }).select('user')
  const userId = bridgeDocument?.user?.toString() ?? null
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Bridge-Token ist nicht mit einem Nutzer verknüpft.' })
  }

  const body = await readBody(event)
  const telemetryKeys = body && typeof body === 'object' ? Object.keys(body as Record<string, unknown>) : []
  console.info(
    `\x1b[35m[bridge:data]\x1b[0m token=\x1b[96m${bridgeToken.slice(0, 6)}...\x1b[0m user=\x1b[92m${userId}\x1b[0m telemetryKeys=\x1b[92m${telemetryKeys.length}\x1b[0m payload=`,
    body,
  )

  // Store telemetry and broadcast to WebSocket subscribers
  flightlabTelemetryStore.update(userId, body)

  event.node.res.statusCode = 204
})
