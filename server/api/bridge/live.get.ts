import { createError } from 'h3'
import { BridgeToken } from '../../models/BridgeToken'
import { getBridgeTokenFromHeader } from '../../utils/bridge'
import { flightlabTelemetryStore } from '../../utils/flightlabTelemetry'
import { simControlQueue } from '../../utils/simControlQueue'

export default defineEventHandler(async (event) => {
  const token = getBridgeTokenFromHeader(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'x-bridge-token header fehlt oder ist ungültig.' })
  }

  const bridgeDocument = await BridgeToken.findOne({ token }).select('user')
  const userId = bridgeDocument?.user?.toString() ?? null

  if (!userId) {
    return {
      connected: false,
      lastTelemetryAt: null,
      telemetry: null,
      commandResults: [],
    }
  }

  const telemetry = flightlabTelemetryStore.get(userId)
  const timestamp = telemetry && typeof telemetry.timestamp === 'number'
    ? new Date(telemetry.timestamp).toISOString()
    : null

  return {
    connected: true,
    lastTelemetryAt: timestamp,
    telemetry,
    // frequency-sim-control (design §4): terminal command results the client
    // hasn't seen yet, so it can speak a confirmation/failure over TTS.
    commandResults: simControlQueue.drainResultsForClient(token),
  }
})
