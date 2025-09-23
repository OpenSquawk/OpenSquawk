import { createError, getQuery } from 'h3'
import { BridgeToken } from '../../models/BridgeToken'
import { normalizeBridgeToken } from '../../utils/bridge'
import type { UserDocument } from '../../models/User'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = normalizeBridgeToken(query.token as string | undefined)

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token muss übergeben werden.' })
  }

  const document = await BridgeToken.findOne({ token }).populate('user', 'name email')

  if (!document || !document.user) {
    return {
      token,
      connected: false,
      user: null,
      simConnected: false,
      flightActive: false,
      connectedAt: document?.connectedAt ? document.connectedAt.toISOString() : null,
      lastStatusAt: document?.lastStatusAt ? document.lastStatusAt.toISOString() : null,
    }
  }

  const bridgeUser = document.user as UserDocument

  return {
    token: document.token,
    connected: true,
    user: {
      id: String(bridgeUser._id),
      email: bridgeUser.email,
      name: bridgeUser.name,
    },
    simConnected: document.simConnected,
    flightActive: document.flightActive,
    connectedAt: document.connectedAt?.toISOString() ?? document.updatedAt.toISOString(),
    lastStatusAt: document.lastStatusAt ? document.lastStatusAt.toISOString() : null,
  }
})

