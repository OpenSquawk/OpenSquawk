import { createError } from 'h3'
import { requireUserSession } from '../../utils/auth'
import { getBridgeTokenFromHeader } from '../../utils/bridge'
import { BridgeToken } from '../../models/BridgeToken'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const token = getBridgeTokenFromHeader(event)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'x-bridge-token header fehlt oder ist ungültig.' })
  }

  console.info(
    `\x1b[31m[bridge:disconnect]\x1b[0m token=\x1b[96m${token.slice(0, 6)}...\x1b[0m user=\x1b[92m${String(user._id)}\x1b[0m`,
  )

  const existing = await BridgeToken.findOne({ token }).select('user token')
  if (!existing || !existing.user) {
    return {
      success: true,
      token,
      connected: false,
    }
  }

  if (String(existing.user) !== String(user._id)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Dieses Bridge-Token ist mit einem anderen Account verknüpft.',
    })
  }

  await BridgeToken.updateOne(
    { token, user: user._id },
    {
      $unset: {
        user: 1,
        connectedAt: 1,
        lastStatusAt: 1,
      },
      $set: {
        simConnected: false,
        flightActive: false,
      },
    },
  )

  return {
    success: true,
    token,
    connected: false,
  }
})
