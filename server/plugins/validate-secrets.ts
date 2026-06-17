// Startup validation for security-critical secrets. Runs once when the Nitro
// server boots. In production it fails fast (throws, refusing to start) rather
// than running with forgeable JWTs; in development it only warns so local setup
// stays frictionless.

const PLACEHOLDER_MARKERS = ['changeme', 'change_me']

function looksLikePlaceholder(value: string): boolean {
  const v = value.toLowerCase()
  return PLACEHOLDER_MARKERS.some((marker) => v.includes(marker))
}

export default defineNitroPlugin(() => {
  const isProd = process.env.NODE_ENV === 'production'
  const jwtSecret = (process.env.JWT_SECRET || '').trim()
  const refreshSecret = (process.env.JWT_REFRESH_SECRET || '').trim()

  const problems: string[] = []

  if (!jwtSecret) {
    problems.push('JWT_SECRET is not set')
  } else if (looksLikePlaceholder(jwtSecret)) {
    problems.push('JWT_SECRET still uses a placeholder/example value')
  } else if (jwtSecret.length < 32) {
    problems.push('JWT_SECRET is shorter than 32 characters')
  }

  // Only flag the refresh secret when it is set explicitly; it falls back to
  // JWT_SECRET when unset (see nuxt.config runtimeConfig).
  if (refreshSecret && looksLikePlaceholder(refreshSecret)) {
    problems.push('JWT_REFRESH_SECRET still uses a placeholder/example value')
  } else if (refreshSecret && refreshSecret.length < 32) {
    problems.push('JWT_REFRESH_SECRET is shorter than 32 characters')
  }

  if (problems.length === 0) return

  const detail = problems.map((p) => `  - ${p}`).join('\n')
  const message = `[startup] Insecure auth configuration:\n${detail}`

  if (isProd) {
    throw new Error(
      `${message}\nRefusing to start. Generate strong secrets, e.g. \`openssl rand -hex 32\`.`,
    )
  }

  console.warn(`${message}\n(allowed in development — set strong secrets before deploying)`)
})
