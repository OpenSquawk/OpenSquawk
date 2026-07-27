import { defineStore } from 'pinia'

export const AUTH_TOKEN_STORAGE_KEY = 'os_access_token'

type UserRole = 'user' | 'admin' | 'dev'

interface AuthUser {
  id: string
  email: string
  name?: string
  role: UserRole
  createdAt: string
}

interface AuthState {
  accessToken: string
  user: AuthUser | null
  initialized: boolean
}

function loadToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || ''
}

function persistToken(token: string) {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: loadToken(),
    user: null,
    initialized: false,
  }),
  getters: {
    // A session can exist without a bearer token in hand: in AUTH_MODE=open
    // there is never one, and in sso mode the durable session is an httpOnly
    // cookie that JS cannot see. Once the user is loaded, we are authenticated.
    isAuthenticated: (state) => Boolean(state.accessToken || state.user),
  },
  actions: {
    setAccessToken(token: string) {
      this.accessToken = token
      persistToken(token)
    },
    setUser(user: AuthUser | null) {
      this.user = user
    },
    async ssoCallback(code: string) {
      const response = await $fetch<{ accessToken: string; user: AuthUser }>('/api/auth/sso/callback', {
        method: 'POST',
        body: { code },
      })
      this.setAccessToken(response.accessToken)
      this.setUser(response.user)
      this.initialized = true
      return response.user
    },
    async tryRefresh() {
      try {
        // One endpoint for every mode: local identity or app session cookie.
        const response = await $fetch<{ accessToken: string }>('/api/auth/refresh', {
          method: 'POST',
        })
        this.setAccessToken(response.accessToken)
        return true
      } catch {
        this.setAccessToken('')
        return false
      }
    },
    async fetchUser() {
      try {
        // No bearer token is not the same as no session: the app's session
        // cookie and AUTH_MODE=open both authenticate without one, so ask the
        // server instead of deciding here.
        const user = await $fetch<AuthUser>('/api/auth/me', {
          headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : undefined,
        })
        this.setUser(user)
        this.initialized = true
        return user
      } catch (err) {
        // A 401 for a visitor who never had a session is the expected answer,
        // not a fault worth logging.
        if (this.accessToken) {
          console.warn('Failed to load user session', err)
        }
        this.setAccessToken('')
        this.setUser(null)
        this.initialized = true
        return null
      }
    },
    async logout() {
      try {
        // Called unconditionally: the session may be a cookie we cannot see.
        await $fetch('/api/auth/logout', {
          method: 'POST',
          headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : undefined,
        })
      } catch (err) {
        console.warn('Logout failed', err)
      } finally {
        this.setAccessToken('')
        this.setUser(null)
      }
    },
  },
})
