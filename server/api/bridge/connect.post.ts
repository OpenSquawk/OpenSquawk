import { createError, readBody } from 'h3'
import { requireUserSession } from '../../utils/auth'
import { normalizeBridgeToken } from '../../utils/bridge'
import { BridgeToken } from '../../models/BridgeToken'

interface ConnectBody {
  token?: string
}

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const body = await readBody<ConnectBody>(event)
  const token = normalizeBridgeToken(body.token)

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültiger Token übergeben.' })
  }

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

  return {
    success: true,
    token: document.token,
    connectedAt: document.connectedAt?.toISOString() ?? now.toISOString(),
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
    },
  }
})

