import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()

  // AUTH_MODE=open: a self-hosted instance has no login, so there is nothing to
  // guard. The server resolves every request to the single local identity.
  if (config.public.authMode === 'open') {
    return
  }

  const auth = useAuthStore()

  if (!auth.accessToken) {
    await auth.tryRefresh().catch(() => false)
  }

  if (!auth.initialized || !auth.user) {
    await auth.fetchUser().catch(() => null)
  }

  if (auth.user) return

  const target = to.fullPath || '/'
  const issuer = String(config.public.authIssuer || '').replace(/\/+$/, '')

  // No issuer configured means website and app still share an origin — the
  // local /login page is the login page.
  if (!issuer) {
    return navigateTo(`/login?redirect=${encodeURIComponent(target)}`)
  }

  // The issuer needs an absolute URL to come back to, and it will only accept
  // one whose origin is on its allowlist.
  const redirect = new URL(target, window.location.origin).toString()
  return navigateTo(`${issuer}/login?redirect=${encodeURIComponent(redirect)}`, {
    external: true,
  })
})
