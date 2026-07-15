import { createError, readBody } from 'h3'
import { BridgeToken } from '../../models/BridgeToken'
import { getBridgeTokenFromHeader } from '../../utils/bridge'
import { logBridgeEvent } from '../../utils/bridgeLog'
import { simControlQueue } from '../../utils/simControlQueue'

interface CommandResultBody {
  id?: string
  status?: 'ok' | 'failed'
  reason?: string
}

/**
 * The bridge reports the outcome of a previously delivered frequency-sim-
 * control command (design doc §4).
 *
 * POST /api/bridge/command-result
 * x-bridge-token: <bridge-token>
 * body: { id: string, status: 'ok' | 'failed', reason?: string }
 */
export default defineEventHandler(async (event) => {
  const token = getBridgeTokenFromHeader(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'x-bridge-token header fehlt oder ist ungültig.' })
  }

  const exists = await BridgeToken.exists({ token })
  if (!exists) {
    throw createError({ statusCode: 404, statusMessage: 'Bridge-Token ist nicht verknüpft.' })
  }

  const body = await readBody<CommandResultBody>(event)
  const id = typeof body?.id === 'string' ? body.id : ''
  const status = body?.status
  if (!id || (status !== 'ok' && status !== 'failed')) {
    throw createError({ statusCode: 400, statusMessage: "id und status ('ok'|'failed') sind erforderlich." })
  }

  const resolved = simControlQueue.resolve(token, id, status, body?.reason)

  console.info(
    `\x1b[32m[bridge:command-result]\x1b[0m token=\x1b[96m${token.slice(0, 6)}...\x1b[0m id=\x1b[96m${id.slice(0, 8)}\x1b[0m status=\x1b[93m${status}\x1b[0m resolved=\x1b[93m${resolved}\x1b[0m`,
  )

  logBridgeEvent(token, {
    endpoint: '/api/bridge/command-result',
    method: 'POST',
    statusCode: 200,
    color: status === 'ok' ? '#22c55e' : '#ef4444',
    summary: `${id.slice(0, 8)} → ${status}${body?.reason ? `: ${body.reason}` : ''}`,
    data: { id, status, reason: body?.reason ?? null, resolved },
  })

  return { ok: resolved }
})
