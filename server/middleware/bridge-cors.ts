import { defineEventHandler, getRequestHeader, setResponseStatus } from 'h3'

const DEFAULT_ALLOWED_HEADERS = 'Content-Type, Authorization, x-bridge-token'
const DEFAULT_ALLOWED_METHODS = 'GET, POST, OPTIONS'
const DEFAULT_MAX_AGE_SECONDS = '86400'

function parseAllowedOrigins(input: string | undefined) {
  if (!input) {
    return []
  }
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const configuredAllowedOrigins = parseAllowedOrigins(process.env.BRIDGE_CORS_ORIGINS)

export default defineEventHandler((event) => {
  const pathname = event.node.req.url?.split('?')[0] ?? ''
  if (!pathname.startsWith('/api/bridge/')) {
    return
  }

  const origin = getRequestHeader(event, 'origin')
  const isOriginAllowed =
    origin && (configuredAllowedOrigins.length === 0 || configuredAllowedOrigins.includes(origin))

  if (isOriginAllowed && origin) {
    event.node.res.setHeader('Access-Control-Allow-Origin', origin)
    event.node.res.setHeader('Vary', 'Origin')
  } else if (configuredAllowedOrigins.length === 0) {
    event.node.res.setHeader('Access-Control-Allow-Origin', '*')
  }

  event.node.res.setHeader('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS)
  event.node.res.setHeader(
    'Access-Control-Allow-Headers',
    getRequestHeader(event, 'access-control-request-headers') || DEFAULT_ALLOWED_HEADERS,
  )
  event.node.res.setHeader('Access-Control-Max-Age', DEFAULT_MAX_AGE_SECONDS)

  if (event.node.req.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
