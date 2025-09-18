import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    await auth.fetchUser().catch(() => null)
  }

  if (!auth.user) {
    const redirect = encodeURIComponent(to.fullPath || '/admin')
    return navigateTo(`/login?redirect=${redirect}`)
  }

  if (!['admin', 'dev'].includes(auth.user.role)) {
    return navigateTo('/')
  }
})
