import { createError } from 'h3'
import { BridgeToken } from '../../models/BridgeToken'
import { getBridgeTokenFromHeader } from '../../utils/bridge'
import type { UserDocument } from '../../models/User'

export default defineEventHandler(async (event) => {
  const token = getBridgeTokenFromHeader(event)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'x-bridge-token header fehlt oder ist ungültig.' })
  }

  console.info(`\x1b[36m[bridge:me]\x1b[0m token=\x1b[96m${token.slice(0, 6)}...\x1b[0m request received`)

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
