import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Minimal HS256 JWT helpers.
 *
 * Extracted from server/utils/auth.ts so that the app's own session
 * (server/utils/session.ts) can mint and verify tokens without dragging in the
 * website-only parts of auth.ts (scrypt passwords, invite codes, password
 * reset). Both files ship with the app repo; auth.ts's website half does not.
 */

export function base64url(buffer: Buffer) {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function fromBase64url(input: string) {
  let sanitized = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = sanitized.length % 4
  if (pad === 2) sanitized += '=='
  else if (pad === 3) sanitized += '='
  else if (pad !== 0) sanitized += '==='
  return Buffer.from(sanitized, 'base64')
}

export function createJwtToken(payload: Record<string, any>, secret: string, ttlSeconds: number) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + ttlSeconds }
  const encodedHeader = base64url(Buffer.from(JSON.stringify(header)))
  const encodedPayload = base64url(Buffer.from(JSON.stringify(body)))
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = createHmac('sha256', secret).update(data).digest()
  return `${data}.${base64url(signature)}`
}

export function verifyJwtToken(token: string, secret: string) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Malformed token')
  const [encodedHeader, encodedPayload, signature] = parts
  const data = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = createHmac('sha256', secret).update(data).digest()
  const receivedSignature = fromBase64url(signature)
  if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(receivedSignature, expectedSignature)) {
    throw new Error('Invalid signature')
  }
  const header = JSON.parse(fromBase64url(encodedHeader).toString('utf8'))
  if (header.alg !== 'HS256') throw new Error('Unsupported algorithm')
  const payload = JSON.parse(fromBase64url(encodedPayload).toString('utf8'))
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired')
  }
  return payload as Record<string, any>
}
