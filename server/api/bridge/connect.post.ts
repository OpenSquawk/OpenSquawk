import { createError } from 'h3'
import { requireUserSession } from '../../utils/auth'
import { getBridgeTokenFromHeader } from '../../utils/bridge'
import { logBridgeEvent } from '../../utils/bridgeLog'
import { BridgeToken } from '../../models/BridgeToken'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const token = getBridgeTokenFromHeader(event)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'x-bridge-token header fehlt oder ist ungültig.' })
  }

  console.info(
    `\x1b[32m[bridge:connect]\x1b[0m token=\x1b[96m${token.slice(0, 6)}...\x1b[0m user=\x1b[92m${String(user._id)}\x1b[0m`,
  )

  const now = new Date()

  const document = await BridgeToken.findOneAndUpdate(
    { token },
    {
      $set: {
        user: user._id,
        connectedAt: now,
      },
      $setOnInsert: {
        token,
      },
    },
    { upsert: true, new: true, runValidators: true },
  ).populate('user', 'name email')

  if (!document) {
    throw createError({ statusCode: 500, statusMessage: 'Token konnte nicht gespeichert werden.' })
  }

  const result = {
    success: true,
    token: document.token,
    connectedAt: document.connectedAt?.toISOString() ?? now.toISOString(),
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
    },
  }

  logBridgeEvent(token, {
    endpoint: '/api/bridge/connect',
    method: 'POST',
    statusCode: 200,
    color: '#22c55e',
    summary: `Linked to ${user.name || user.email}`,
    data: result as unknown as Record<string, unknown>,
  })

  return result
})
