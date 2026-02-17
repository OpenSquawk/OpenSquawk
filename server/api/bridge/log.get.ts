import { createError, getQuery } from 'h3'
import { getBridgeTokenFromHeader } from '../../utils/bridge'
import { getBridgeLog } from '../../utils/bridgeLog'

export default defineEventHandler((event) => {
  const token = getBridgeTokenFromHeader(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'x-bridge-token header fehlt oder ist ungültig.' })
  }

  const query = getQuery(event)
  const since = Number(query.since) || 0

  return getBridgeLog(token, since)
})
