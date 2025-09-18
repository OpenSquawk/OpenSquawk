import { defineStore } from 'pinia'

interface Credentials {
  email: string
  password: string
}

interface RegisterPayload extends Credentials {
  name?: string
  invitationCode: string
  acceptTerms: boolean
  acceptPrivacy: boolean
}

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
  return localStorage.getItem('os_access_token') || ''
}

function persistToken(token: string) {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem('os_access_token', token)
  } else {
    localStorage.removeItem('os_access_token')
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: loadToken(),
    user: null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken),
  },
  actions: {
    setAccessToken(token: string) {
      this.accessToken = token
      persistToken(token)
    },
    setUser(user: AuthUser | null) {
      this.user = user
    },
    async login(payload: Credentials) {
      const response = await $fetch<{ accessToken: string; user: AuthUser }>('/api/service/auth/login', {
        method: 'POST',
        body: payload,
      })
      this.setAccessToken(response.accessToken)
      this.setUser(response.user)
      return response.user
    },
    async register(payload: RegisterPayload) {
      const response = await $fetch<{ accessToken: string; user: AuthUser }>('/api/service/auth/register', {
        method: 'POST',
        body: payload,
      })
      this.setAccessToken(response.accessToken)
      this.setUser(response.user)
      return response.user
    },
    async tryRefresh() {
      try {
        const response = await $fetch<{ accessToken: string }>('/api/service/auth/refresh', {
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
      if (!this.accessToken) {
        this.setUser(null)
        this.initialized = true
        return null
      }
      try {
        const user = await $fetch<AuthUser>('/api/auth/me', {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        })
        this.setUser(user)
        this.initialized = true
        return user
      } catch (err) {
        console.warn('Failed to load user session', err)
        this.setAccessToken('')
        this.setUser(null)
        this.initialized = true
        return null
      }
    },
    async logout() {
      try {
        if (this.accessToken) {
          await $fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.accessToken}` },
          })
        }
      } catch (err) {
        console.warn('Logout failed', err)
      } finally {
        this.setAccessToken('')
        this.setUser(null)
      }
    },
  },
})

