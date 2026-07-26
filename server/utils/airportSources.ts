/**
 * Shared upstream fetches for airport data (VATSIM, OpenAIP, METAR).
 *
 * The VATSIM datafeed is a single multi-megabyte document covering the whole
 * network, so the frequency and ATIS endpoints must not each pull their own
 * copy per request. Everything here is cached in memory for a interval matched
 * to how fast the source actually changes.
 */

import type { RunwayEnd } from '../../shared/utils/atisReport'

const VATSIM_DATA_URL = 'https://data.vatsim.net/v3/vatsim-data.json'
const OPENAIP_AIRPORTS_URL = 'https://api.core.openaip.net/api/airports'
const METAR_URL = 'https://metar.vatsim.net/metar.php'

// The datafeed regenerates every ~15 s; airport reference data is effectively
// static; METARs publish twice an hour.
const VATSIM_TTL_MS = 20 * 1000
const OPENAIP_TTL_MS = 6 * 60 * 60 * 1000
const METAR_TTL_MS = 5 * 60 * 1000

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

/**
 * Run `load` at most once per TTL per key. A failed load is not cached, so a
 * transient upstream error does not blank the data for the whole interval.
 */
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T
  }
  const value = await load()
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
  return value
}

/** Drop every cached upstream response. Tests only. */
export function clearAirportSourceCache(): void {
  cache.clear()
}

export interface VatsimAtisStation {
  callsign: string
  frequency?: string
  atisCode?: string
  text?: string
  lastUpdated?: string
}

/** The whole VATSIM datafeed, or null when it could not be fetched. */
export async function fetchVatsimData(): Promise<any | null> {
  try {
    return await cached('vatsim', VATSIM_TTL_MS, () => $fetch<any>(VATSIM_DATA_URL))
  } catch (err) {
    console.warn('[OpenSquawk] Failed to fetch VATSIM datafeed:', err)
    return null
  }
}

/** The raw OpenAIP airport record, or null when unavailable. */
export async function fetchOpenAipAirport(icao: string, apiKey: string | undefined): Promise<any | null> {
  if (!apiKey) return null
  const normalized = icao.toUpperCase()
  try {
    return await cached(`openaip:${normalized}`, OPENAIP_TTL_MS, async () => {
      // Must use `search` (not `icao`) — the `icao` param does a full-text search
      // across all fields and returns the entire 46k-airport dataset unpaged.
      const data: any = await $fetch(OPENAIP_AIRPORTS_URL, {
        query: { search: normalized },
        headers: { Accept: 'application/json', 'x-openaip-api-key': apiKey },
      })
      const items = Array.isArray(data?.items) ? data.items : []
      // Real field is `icaoCode`, not `icao`.
      return items.find((item: any) => (item?.icaoCode || '').toUpperCase() === normalized) ?? null
    })
  } catch (err) {
    console.warn('[OpenSquawk] Failed to fetch OpenAIP airport data:', err)
    return null
  }
}

/** The current METAR for an airport, or null when unavailable. */
export async function fetchMetar(icao: string): Promise<string | null> {
  const normalized = icao.toUpperCase()
  try {
    return await cached(`metar:${normalized}`, METAR_TTL_MS, async () => {
      const text = await $fetch<string>(METAR_URL, {
        query: { id: normalized },
        responseType: 'text',
      })
      const trimmed = String(text || '').trim()
      // The service answers with an empty body for an unknown station.
      return trimmed && trimmed.toUpperCase().startsWith(normalized) ? trimmed : null
    })
  } catch (err) {
    console.warn('[OpenSquawk] Failed to fetch METAR:', err)
    return null
  }
}

/** ATIS stations the datafeed lists for one airport. */
export function vatsimAtisStations(data: any, icao: string): VatsimAtisStation[] {
  const prefix = `${icao.toUpperCase()}_`
  const entries = Array.isArray(data?.atis) ? data.atis : []
  return entries
    .filter((atis: any) => String(atis?.callsign || '').toUpperCase().startsWith(prefix))
    .map((atis: any) => ({
      callsign: String(atis.callsign),
      frequency: normalizeFrequency(atis?.frequency) ?? undefined,
      atisCode: atis?.atis_code || atis?.code || undefined,
      text: joinAtisText(atis?.text_atis ?? atis?.atis_text),
      lastUpdated: atis?.last_updated || atis?.logon_time || undefined,
    }))
}

/** Runway ends from an OpenAIP airport record, in the shape the resolver wants. */
export function parseOpenAipRunways(airport: any): RunwayEnd[] {
  const runways = Array.isArray(airport?.runways) ? airport.runways : []
  return runways
    .filter((runway: any) => typeof runway?.designator === 'string' && runway.designator.trim())
    .map((runway: any) => ({
      designator: String(runway.designator).trim().toUpperCase(),
      trueHeading: typeof runway?.trueHeading === 'number' ? runway.trueHeading : null,
      mainRunway: Boolean(runway?.mainRunway),
      takeOffOnly: Boolean(runway?.takeOffOnly),
      landingOnly: Boolean(runway?.landingOnly),
      lengthM: typeof runway?.dimension?.length?.value === 'number'
        ? runway.dimension.length.value
        : null,
    }))
}

/** Published ATIS frequency from an OpenAIP airport record (numeric type 15). */
export function openAipAtisFrequency(airport: any): string | undefined {
  const frequencies = Array.isArray(airport?.frequencies) ? airport.frequencies : []
  for (const item of frequencies) {
    if (item?.type !== 15) continue
    const value = normalizeFrequency(item?.value ?? item?.frequency)
    if (value) return value
  }
  return undefined
}

/** VATSIM sends `text_atis` as an array of broadcast lines. */
function joinAtisText(value: unknown): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) {
    const joined = value.map(line => String(line).trim()).filter(Boolean).join(' ')
    return joined || undefined
  }
  if (typeof value === 'string') return value.trim() || undefined
  return undefined
}

function normalizeFrequency(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(3)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const numeric = Number.parseFloat(trimmed)
    return Number.isNaN(numeric) ? trimmed : numeric.toFixed(3)
  }
  return null
}
