import { useAuthStore } from '~/stores/auth'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ApiRequestOptions<T = any> {
  method?: HttpMethod
  body?: T
  query?: Record<string, any>
  headers?: HeadersInit
  auth?: boolean
}

export function useApi() {
  const auth = useAuthStore()

  const execute = async <T>(path: string, options: ApiRequestOptions = {}) => {
    const { method = 'GET', body, query, headers = {}, auth: requiresAuth = true } = options

    const computedHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    }

    if (requiresAuth && auth.accessToken) {
      computedHeaders.Authorization = `Bearer ${auth.accessToken}`
    }

    const requestOptions: any = {
      method,
      headers: computedHeaders,
      query,
      body,
    }

    if (body && !(body instanceof FormData)) {
      computedHeaders['Content-Type'] = 'application/json'
      requestOptions.body = body
    }

    try {
      return await $fetch<T>(path, requestOptions)
    } catch (error: any) {
      const status = error?.status || error?.response?.status
      if (status === 401 && requiresAuth) {
        const refreshed = await auth.tryRefresh()
        if (refreshed) {
          if (auth.accessToken) {
            computedHeaders.Authorization = `Bearer ${auth.accessToken}`
          }
          return await $fetch<T>(path, requestOptions)
        }
        await auth.logout()
      }
      throw error
    }
  }

  return {
    request: execute,
    get: <T>(path: string, options: ApiRequestOptions = {}) => execute<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: any, options: ApiRequestOptions = {}) =>
      execute<T>(path, { ...options, method: 'POST', body }),
    put: <T>(path: string, body?: any, options: ApiRequestOptions = {}) =>
      execute<T>(path, { ...options, method: 'PUT', body }),
    del: <T>(path: string, options: ApiRequestOptions = {}) => execute<T>(path, { ...options, method: 'DELETE' }),
  }
}

