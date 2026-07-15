import { createError, readBody } from 'h3'
import { BridgeToken } from '../../models/BridgeToken'
import { getBridgeTokenFromHeader } from '../../utils/bridge'
import { logBridgeEvent } from '../../utils/bridgeLog'
import { simControlQueue } from '../../utils/simControlQueue'
import { isValidSimControlCommand, type SimControlCommand } from '../../../shared/utils/simControl'

interface CommandBody {
  command?: SimControlCommand
}

/**
 * Queues a frequency-sim-control command (design doc §4) for the bridge
 * behind this token to pick up on its next telemetry POST.
 *
 * POST /api/bridge/command
 * x-bridge-token: <bridge-token>
 * body: { command: SimControlCommand }
 */
export default defineEventHandler(async (event) => {
  const token = getBridgeTokenFromHeader(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'x-bridge-token header fehlt oder ist ungültig.' })
  }

  // Only relay for a linked token — an unauthenticated caller can't queue commands.
  const exists = await BridgeToken.exists({ token })
  if (!exists) {
    throw createError({ statusCode: 404, statusMessage: 'Bridge-Token ist nicht verknüpft.' })
  }

  const body = await readBody<CommandBody>(event)
  const command = body?.command
  if (!isValidSimControlCommand(command)) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültiges Kommando.' })
  }

  const pending = simControlQueue.enqueue(token, command)

  console.info(
    `\x1b[32m[bridge:command]\x1b[0m token=\x1b[96m${token.slice(0, 6)}...\x1b[0m id=\x1b[96m${pending.id.slice(0, 8)}\x1b[0m type=\x1b[93m${command.type}\x1b[0m`,
  )

  logBridgeEvent(token, {
    endpoint: '/api/bridge/command',
    method: 'POST',
    statusCode: 200,
    color: '#22c55e',
    summary: `queued ${command.type}`,
    data: { id: pending.id, command },
  })

  return { ok: true, id: pending.id, issued_at: pending.issued_at }
})
