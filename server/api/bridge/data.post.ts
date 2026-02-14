import { defineEventHandler, readBody, getHeader } from 'h3'
import { resolveUserFromToken } from '../../utils/auth'
import { normalizeBridgeToken } from '../../utils/bridge'
import { BridgeToken } from '../../models/BridgeToken'
import { flightlabTelemetryStore } from '../../utils/flightlabTelemetry'
import type { UserDocument } from '../../models/User'

/**
 * Receives MSFS SimConnect telemetry data from the OpenSquawk Bridge app.
 *
 * Supports THREE authentication methods (tried in order):
 *   1. Authorization: Bearer <jwt>          — direct user JWT
 *   2. X-Bridge-Token: <bridge-token>       — bridge token (mapped to user in DB)
 *   3. body.token                           — bridge token in payload
 *
 * The bridge sends data in its own format (snake_case) which we normalize
 * to FlightLabTelemetryState format (SIMCONNECT_STYLE) before broadcasting.
 *
 * ──────────────────────────────────────────
 * EXAMPLE REQUEST (current Bridge format):
 * ──────────────────────────────────────────
 *
 * POST /api/bridge/data
 * X-Bridge-Token: <bridge-token>
 * Content-Type: application/json
 *
 * {
 *   "token": "<bridge-token>",
 *   "status": "active",
 *   "ts": 1702345678,
 *   "latitude": 50.033,
 *   "longitude": 8.570,
 *   "altitude_ft_true": 364,
 *   "altitude_ft_indicated": 350,
 *   "ias_kt": 145.2,
 *   "tas_kt": 155.0,
 *   "groundspeed_kt": 142.8,
 *   "on_ground": true,
 *   "eng_on": true,
 *   "n1_pct": 87.3,
 *   "transponder_code": 4731,
 *   "vertical_speed_fpm": 0,
 *   "pitch_deg": 0.5,
 *   "n1_pct_2": 86.9,
 *   "gear_handle": true,
 *   "flaps_index": 2,
 *   "parking_brake": false,
 *   "autopilot_master": false
 * }
 *
 * The fields vertical_speed_fpm, pitch_deg, n1_pct_2, gear_handle,
 * flaps_index, parking_brake, autopilot_master are NEW and need to be
 * added to the Bridge. See BRIDGE-FLIGHTLAB-UPGRADE.md for instructions.
 *
 * ──────────────────────────────────────────
 * ALSO ACCEPTS direct FlightLab format:
 * ──────────────────────────────────────────
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
 *           401 Unauthorized (missing/invalid auth)
 * ──────────────────────────────────────────
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // --- Resolve user ID from multiple auth methods ---
  let userId: string | null = null

  // Method 1: JWT Bearer token
  const user = await resolveUserFromToken(event)
  if (user?._id) {
    userId = user._id.toString()
  }

  // Method 2: X-Bridge-Token header
  if (!userId) {
    const headerToken = normalizeBridgeToken(getHeader(event, 'x-bridge-token'))
    if (headerToken) {
      userId = await resolveUserIdFromBridgeToken(headerToken)
    }
  }

  // Method 3: token field in body
  if (!userId && body?.token) {
    const bodyToken = normalizeBridgeToken(body.token)
    if (bodyToken) {
      userId = await resolveUserIdFromBridgeToken(bodyToken)
    }
  }

  // Method 4: query param fallback (for testing)
  if (!userId) {
    const url = new URL(event.node.req.url ?? '', 'http://localhost')
    userId = url.searchParams.get('userId')
  }

  if (!userId) {
    event.node.res.statusCode = 401
    return { error: 'Auth required — send Bearer token, X-Bridge-Token header, or token in body' }
  }

  // --- Normalize telemetry to FlightLab format ---
  const telemetry = normalizeTelemetry(body)

  // Store + broadcast to WebSocket subscribers
  flightlabTelemetryStore.update(userId, telemetry)

  // Update bridge token status if we have one
  const bridgeToken = normalizeBridgeToken(getHeader(event, 'x-bridge-token') ?? body?.token)
  if (bridgeToken) {
    BridgeToken.updateOne(
      { token: bridgeToken },
      { $set: { lastStatusAt: new Date(), flightActive: body?.status === 'active' } },
    ).catch(() => {}) // fire-and-forget
  }

  event.node.res.statusCode = 204
})

// --- Helpers ---

async function resolveUserIdFromBridgeToken(token: string): Promise<string | null> {
  const doc = await BridgeToken.findOne({ token }).populate('user')
  if (!doc?.user) return null
  const bridgeUser = doc.user as UserDocument
  return bridgeUser._id?.toString() ?? null
}

/**
 * Normalize incoming telemetry to FlightLabTelemetryState format.
 * Accepts both the Bridge's snake_case format and direct SimConnect-style keys.
 */
function normalizeTelemetry(body: any) {
  // If body already has SimConnect-style keys, pass through
  if (body?.AIRSPEED_INDICATED !== undefined) {
    return {
      AIRSPEED_INDICATED: num(body.AIRSPEED_INDICATED),
      GROUND_VELOCITY: num(body.GROUND_VELOCITY),
      VERTICAL_SPEED: num(body.VERTICAL_SPEED),
      PLANE_ALTITUDE: num(body.PLANE_ALTITUDE),
      PLANE_PITCH_DEGREES: num(body.PLANE_PITCH_DEGREES),
      TURB_ENG_N1_1: num(body.TURB_ENG_N1_1),
      TURB_ENG_N1_2: num(body.TURB_ENG_N1_2),
      SIM_ON_GROUND: bool(body.SIM_ON_GROUND),
      GEAR_HANDLE_POSITION: bool(body.GEAR_HANDLE_POSITION),
      FLAPS_HANDLE_INDEX: num(body.FLAPS_HANDLE_INDEX),
      BRAKE_PARKING_POSITION: bool(body.BRAKE_PARKING_POSITION),
      AUTOPILOT_MASTER: bool(body.AUTOPILOT_MASTER),
    }
  }

  // Bridge format → FlightLab format
  return {
    AIRSPEED_INDICATED: num(body.ias_kt),
    GROUND_VELOCITY: num(body.groundspeed_kt),
    VERTICAL_SPEED: num(body.vertical_speed_fpm ?? 0),
    PLANE_ALTITUDE: num(body.altitude_ft_true ?? body.altitude_ft_indicated),
    PLANE_PITCH_DEGREES: num(body.pitch_deg ?? 0),
    TURB_ENG_N1_1: num(body.n1_pct),
    TURB_ENG_N1_2: num(body.n1_pct_2 ?? body.n1_pct), // fallback to engine 1 if engine 2 missing
    SIM_ON_GROUND: bool(body.on_ground),
    GEAR_HANDLE_POSITION: bool(body.gear_handle ?? true), // default: gear down
    FLAPS_HANDLE_INDEX: num(body.flaps_index ?? 0),
    BRAKE_PARKING_POSITION: bool(body.parking_brake ?? false),
    AUTOPILOT_MASTER: bool(body.autopilot_master ?? false),
  }
}

function num(v: any): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function bool(v: any): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v === 'true' || v === '1'
  return false
}
