import { useRuntimeConfig } from '#imports'

/**
 * Forwarding for the public `/api/service/tools/*` endpoints.
 *
 * The OSM airport geocoder and the taxi router live in the Python backend,
 * which owns the Overpass client and its cache, the airport dataset, and the
 * runway-threshold logic. Nuxt used to carry a second copy of all of it; the
 * copy drifted and started routing to runway centres. These helpers keep the
 * documented public paths while leaving exactly one implementation.
 */

/** Build the upstream URL, forwarding every supplied query parameter. */
export function backendToolUrl(
  baseUrl: string,
  path: string,
  query: Record<string, unknown>
): string {
  const params = new URLSearchParams()

  for (const [key, raw] of Object.entries(query)) {
    // h3 yields an array when a parameter is repeated; the backend takes one.
    const value = Array.isArray(raw) ? raw[0] : raw
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (!text) continue
    params.set(key, text)
  }

  const base = baseUrl.replace(/\/+$/, '')
  const search = params.toString()
  return search ? `${base}${path}?${search}` : `${base}${path}`
}

export function radioBackendBaseUrl(): string {
  const config = useRuntimeConfig() as any
  return config?.public?.radioBackendUrl || 'http://127.0.0.1:8000'
}

/**
 * Forward a tools request and hand back what the backend answered.
 *
 * The backend reports failures with real status codes and keeps the old error
 * code in the body (`{"error": "origin_not_found", …}`). Both are passed
 * through: rewriting a 404 back into the legacy HTTP 200 would hide a failed
 * lookup from every caller that checks the status.
 */
export async function forwardToRadioBackend(
  path: string,
  query: Record<string, unknown>
): Promise<Record<string, any>> {
  const url = backendToolUrl(radioBackendBaseUrl(), path, query)
  const fetcher = (globalThis as any).$fetch as (
    target: string,
    options?: Record<string, unknown>
  ) => Promise<Record<string, any>>

  return await fetcher(url, { method: 'GET' })
}
