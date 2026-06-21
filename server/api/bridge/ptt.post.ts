import { createError, readBody } from 'h3'
import { BridgeToken } from '../../models/BridgeToken'
import { getBridgeTokenFromHeader } from '../../utils/bridge'
import { logBridgeEvent } from '../../utils/bridgeLog'
import { pttBus, type PttState } from '../../utils/pttBus'

interface PttBody {
  state?: PttState
}

export default defineEventHandler(async (event) => {
  const token = getBridgeTokenFromHeader(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'x-bridge-token header fehlt oder ist ungültig.' })
  }

  const body = await readBody<PttBody>(event)
  const state = body?.state
  if (state !== 'down' && state !== 'up') {
    throw createError({ statusCode: 400, statusMessage: "state muss 'down' oder 'up' sein." })
  }

  // Only relay for a linked token; an unknown/unlinked token is a no-op so the
  // bus is never driven by an unauthenticated caller.
  const exists = await BridgeToken.exists({ token })
  if (!exists) {
    throw createError({ statusCode: 404, statusMessage: 'Bridge-Token ist nicht verknüpft.' })
  }

  console.info(
    `\x1b[33m[bridge:ptt]\x1b[0m token=\x1b[96m${token.slice(0, 6)}...\x1b[0m state=\x1b[92m${state}\x1b[0m`,
  )

  pttBus.publish(token, state)

  logBridgeEvent(token, {
    endpoint: '/api/bridge/ptt',
    method: 'POST',
    statusCode: 200,
    color: '#eab308',
    summary: `ptt=${state}`,
    data: { state },
  })

  return { ok: true, state }
})
