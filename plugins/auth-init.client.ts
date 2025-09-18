import { defineNuxtPlugin } from '#app'
import { useAuthStore, AUTH_TOKEN_STORAGE_KEY } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') {
    return
  }

  const auth = useAuthStore()
  const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

  if (storedToken && auth.accessToken !== storedToken) {
    auth.setAccessToken(storedToken)
  }
})
