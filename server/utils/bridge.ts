import { getHeader, type H3Event } from 'h3'

export function normalizeBridgeToken(input: unknown) {
  if (typeof input !== 'string') {
    return null
  }
  const token = input.trim()
  if (!token) {
    return null
  }
  if (token.length < 6 || token.length > 256) {
    return null
  }
  return token
}

export function getBridgeTokenFromHeader(event: H3Event) {
  return normalizeBridgeToken(getHeader(event, 'x-bridge-token'))
}
