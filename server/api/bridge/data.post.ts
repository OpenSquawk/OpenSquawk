import { createError, defineEventHandler, readBody } from 'h3'
import { BridgeToken } from '../../models/BridgeToken'
import { getBridgeTokenFromHeader } from '../../utils/bridge'
import { flightlabTelemetryStore } from '../../utils/flightlabTelemetry'
import type { FlightLabTelemetryState } from '../../../shared/data/flightlab/types'

/**
 * Receives telemetry data from an external bridge application.
 *
 * The bridge sends raw SimConnect-style fields which are mapped to the
 * FlightLabTelemetryState format before storage.
 *
 * POST /api/bridge/data
 * x-bridge-token: <bridge-token>
 */

/** Map raw bridge field names to FlightLabTelemetryState keys */
function mapBridgeTelemetry(raw: Record<string, any>): FlightLabTelemetryState {
  return {
    AIRSPEED_INDICATED: raw.ias_kt ?? raw.AIRSPEED_INDICATED ?? 0,
    GROUND_VELOCITY: raw.groundspeed_kt ?? raw.GROUND_VELOCITY ?? 0,
    VERTICAL_SPEED: raw.vertical_speed_fpm ?? raw.VERTICAL_SPEED ?? 0,
    PLANE_ALTITUDE: raw.altitude_ft_indicated ?? raw.altitude_ft_true ?? raw.PLANE_ALTITUDE ?? 0,
    PLANE_PITCH_DEGREES: raw.pitch_deg ?? raw.PLANE_PITCH_DEGREES ?? 0,
    TURB_ENG_N1_1: raw.n1_pct ?? raw.TURB_ENG_N1_1 ?? 0,
    TURB_ENG_N1_2: raw.n1_pct_2 ?? raw.TURB_ENG_N1_2 ?? 0,
    SIM_ON_GROUND: !!(raw.on_ground ?? raw.SIM_ON_GROUND ?? false),
    GEAR_HANDLE_POSITION: !!(raw.gear_handle ?? raw.GEAR_HANDLE_POSITION ?? false),
    FLAPS_HANDLE_INDEX: raw.flaps_index ?? raw.FLAPS_HANDLE_INDEX ?? 0,
    BRAKE_PARKING_POSITION: !!(raw.parking_brake ?? raw.BRAKE_PARKING_POSITION ?? false),
    AUTOPILOT_MASTER: !!(raw.autopilot_master ?? raw.AUTOPILOT_MASTER ?? false),
  }
}

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
    `\x1b[35m[bridge:data]\x1b[0m token=\x1b[96m${bridgeToken.slice(0, 6)}...\x1b[0m user=\x1b[92m${userId}\x1b[0m telemetryKeys=\x1b[92m${telemetryKeys.length}\x1b[0m`,
  )

  // Map raw bridge fields to FlightLab format and store
  const mapped = mapBridgeTelemetry(body)
  flightlabTelemetryStore.update(userId, mapped)

  event.node.res.statusCode = 204
})
