import { createError, readBody } from 'h3'
import { BridgeToken } from '../../models/BridgeToken'
import { normalizeBridgeToken } from '../../utils/bridge'
import type { UserDocument } from '../../models/User'

interface StatusBody {
  token?: string
  simConnected?: boolean
  flightActive?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<StatusBody>(event)
  const token = normalizeBridgeToken(body.token)

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token muss übergeben werden.' })
  }

  const updatePayload: Record<string, unknown> = {
    lastStatusAt: new Date(),
  }

  if (typeof body.simConnected === 'boolean') {
    updatePayload.simConnected = body.simConnected
  }

  if (typeof body.flightActive === 'boolean') {
    updatePayload.flightActive = body.flightActive
  }

  const document = await BridgeToken.findOneAndUpdate(
    { token },
    {
      $set: updatePayload,
      $setOnInsert: { token },
    },
    { new: true, upsert: true, runValidators: true },
  ).populate('user', 'name email')

  if (!document) {
    throw createError({ statusCode: 500, statusMessage: 'Status konnte nicht aktualisiert werden.' })
  }

  const user = document.user as UserDocument | undefined

  return {
    token: document.token,
    connected: Boolean(user),
    user: user
      ? {
          id: String(user._id),
          email: user.email,
          name: user.name,
        }
      : null,
    simConnected: document.simConnected,
    flightActive: document.flightActive,
    connectedAt: document.connectedAt ? document.connectedAt.toISOString() : null,
    lastStatusAt: document.lastStatusAt ? document.lastStatusAt.toISOString() : null,
  }
})

