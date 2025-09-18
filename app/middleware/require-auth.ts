import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  if (!auth.accessToken) {
    await auth.tryRefresh().catch(() => false)
  }

  if (!auth.initialized) {
    await auth.fetchUser().catch(() => null)
  } else if (!auth.user) {
    await auth.fetchUser().catch(() => null)
  }

  if (!auth.user) {
    const redirect = encodeURIComponent(to.fullPath || '/')
    return navigateTo(`/login?redirect=${redirect}`)
  }
})
