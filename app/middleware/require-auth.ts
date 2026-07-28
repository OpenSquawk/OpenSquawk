import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'
import { buildIssuerLoginUrl } from '~~/shared/utils/ssoHandoff'

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

  return navigateTo(buildIssuerLoginUrl(issuer, window.location.origin, target), {
    external: true,
  })
})
