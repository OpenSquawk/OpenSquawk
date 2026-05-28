import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getServerRuntimeConfig } from '../../../utils/runtimeConfig'

interface FrequencyEntry {
  type: string
  label: string
  frequency: string
  source: 'vatsim' | 'openaip'
  callsign?: string
  atisCode?: string
  atisText?: string
  lastUpdated?: string
}

interface FrequencyResponse {
  icao: string
  airportName?: string
  sources: {
    vatsim: boolean
    openaip: boolean
  }
  frequencies: FrequencyEntry[]
}

const TYPE_LABELS: Record<string, string> = {
  ATIS: 'ATIS',
  DEL: 'Clearance Delivery',
  CLD: 'Clearance Delivery',
  GND: 'Ground',
  TWR: 'Tower',
  DEP: 'Departure',
  APP: 'Approach',
  CTR: 'Center',
  ACC: 'Center',
  FSS: 'Flight Service',
  UNK: 'Unknown'
}

const TYPE_ORDER = ['ATIS', 'DEL', 'CLD', 'GND', 'TWR', 'DEP', 'APP', 'CTR', 'ACC', 'FSS']

const ATIS_FREQUENCY_PLACEHOLDER = '---'

function toTypeLabel(rawType: string | undefined, fallback?: string): { type: string; label: string } {
  const type = (rawType || 'UNK').toUpperCase()
  const label = TYPE_LABELS[type] || fallback || type
  return { type, label }
}

function normalizeFrequency(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(3)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const numeric = Number.parseFloat(trimmed)
    if (!Number.isNaN(numeric)) {
      return numeric.toFixed(3)
    }
    return trimmed
  }
  return null
}

function parseAtisText(value: unknown): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean).join(' ')
  }
  if (typeof value === 'string') {
    return value.trim()
  }
  return undefined
}

function extractCallsignType(callsign: string, icao: string): string {
  const normalized = callsign.toUpperCase()
  const prefix = `${icao.toUpperCase()}_`
  if (!normalized.startsWith(prefix)) {
    return 'UNK'
  }
  const suffix = normalized.slice(prefix.length)
  if (!suffix) return 'UNK'
  const segments = suffix.split('_')
  const last = segments[segments.length - 1]
  return last || 'UNK'
}

function addFrequencyEntry(
  map: Map<string, FrequencyEntry>,
  entry: FrequencyEntry
) {
  const primaryKey = entry.callsign?.toUpperCase() || `${entry.type}|${entry.frequency}`
  const fallbackKey = `${entry.type}|${entry.frequency}`

  if (map.has(primaryKey)) {
    const existing = map.get(primaryKey)!
    map.set(primaryKey, { ...existing, ...entry })
    return
  }

  if (entry.callsign && map.has(fallbackKey)) {
    const existing = map.get(fallbackKey)!
    map.delete(fallbackKey)
    map.set(primaryKey, { ...existing, ...entry })
    return
  }

  if (!entry.callsign && map.has(fallbackKey)) {
    const existing = map.get(fallbackKey)!
    if (existing.source === 'openaip' && entry.source === 'vatsim') {
      map.set(fallbackKey, { ...existing, ...entry })
      return
    }
  }

  map.set(primaryKey, entry)
}

export default defineEventHandler(async (event): Promise<FrequencyResponse> => {
  const icaoParam = getRouterParam(event, 'icao')
  if (!icaoParam) {
    throw createError({ statusCode: 400, statusMessage: 'icao required' })
  }

  const icao = icaoParam.toUpperCase()
  const frequencyMap = new Map<string, FrequencyEntry>()
  let airportName: string | undefined
  let vatsimSuccess = false
  let openaipSuccess = false

  try {
    const vatsimData: any = await $fetch('https://data.vatsim.net/v3/vatsim-data.json')
    const prefix = `${icao}_`

    const atisEntries = Array.isArray(vatsimData?.atis) ? vatsimData.atis : []
    for (const atis of atisEntries) {
      const callsign = String(atis?.callsign || '')
      if (!callsign.toUpperCase().startsWith(prefix)) continue
      const normalizedFrequency = normalizeFrequency(atis?.frequency)
      const frequency = normalizedFrequency || ATIS_FREQUENCY_PLACEHOLDER
      const { type, label } = toTypeLabel('ATIS', atis?.name)
      addFrequencyEntry(frequencyMap, {
        type,
        label,
        frequency,
        source: 'vatsim',
        callsign,
        atisCode: atis?.atis_code || atis?.code,
        atisText: parseAtisText(atis?.text_atis || atis?.atis_text),
        lastUpdated: atis?.last_updated || atis?.logon_time
      })
    }

    const controllerEntries = Array.isArray(vatsimData?.controllers) ? vatsimData.controllers : []
    for (const controller of controllerEntries) {
      const callsign = String(controller?.callsign || '')
      if (!callsign.toUpperCase().startsWith(prefix)) continue
      const frequency = normalizeFrequency(controller?.frequency)
      if (!frequency) continue
      const typeCode = extractCallsignType(callsign, icao)
      const { type, label } = toTypeLabel(typeCode, controller?.name)
      addFrequencyEntry(frequencyMap, {
        type,
        label,
        frequency,
        source: 'vatsim',
        callsign,
        atisText: parseAtisText(controller?.text_atis),
        lastUpdated: controller?.last_updated || controller?.logon_time
      })
    }

    vatsimSuccess = true
  } catch (err) {
    console.warn('[OpenSquawk] Failed to fetch VATSIM frequencies:', err)
  }

  // OpenAIP v2 numeric frequency type → our internal type code.
  // Derived from real API responses (EDDF: 5=Delivery, 9=Ground, 14=Tower, 15=ATIS).
  const OPENAIP_TYPE_MAP: Record<number, string> = {
    4:  'GND',  // Ground (some older entries)
    5:  'DEL',  // Clearance Delivery
    6:  'APP',  // Approach
    7:  'DEP',  // Departure
    8:  'CTR',  // Centre / ACC
    9:  'GND',  // Ground
    14: 'TWR',  // Tower
    15: 'ATIS', // ATIS
  }

  const { openaipApiKey } = getServerRuntimeConfig()
  if (openaipApiKey) {
    try {
      // Must use `search` (not `icao`) — the `icao` param does a full-text search
      // across all fields and returns the entire 46k-airport dataset unpaged.
      // `search=<ICAO>` returns exactly the matching airport.
      const openaipData: any = await $fetch('https://api.core.openaip.net/api/airports', {
        query: { search: icao },
        headers: {
          Accept: 'application/json',
          'x-openaip-api-key': openaipApiKey
        }
      })

      const items = Array.isArray(openaipData?.items) ? openaipData.items : []
      for (const airport of items) {
        // Real field is `icaoCode`, not `icao`
        if ((airport?.icaoCode || '').toUpperCase() !== icao) continue
        // Airport-level metadata: `name` (e.g. "Frankfurt am Main"), `municipality` (city only)
        if (!airportName) {
          const name = typeof airport?.name === 'string' ? airport.name.trim() : ''
          const muni = typeof airport?.municipality === 'string' ? airport.municipality.trim() : ''
          airportName = name || muni || undefined
        }
        // Frequencies live under `airport.frequencies[]`; each item has:
        //   value  (MHz string, e.g. "122.035")
        //   type   (numeric code, e.g. 5 for Delivery)
        //   name   (human label, e.g. "FRANKFURT DELIVERY")
        const freqItems: any[] = Array.isArray(airport?.frequencies) ? airport.frequencies : []

        for (const freqItem of freqItems) {
          // Real field is `value`, not `frequency` / `frequencyMHz`
          const frequency = normalizeFrequency(freqItem?.value ?? freqItem?.frequency)
          if (!frequency) continue

          const numericType: number | undefined = typeof freqItem?.type === 'number' ? freqItem.type : undefined
          const typeCode = numericType !== undefined ? (OPENAIP_TYPE_MAP[numericType] ?? 'UNK') : 'UNK'
          const { type, label } = toTypeLabel(typeCode, freqItem?.name || freqItem?.description)
          addFrequencyEntry(frequencyMap, {
            type,
            label,
            frequency,
            source: 'openaip'
          })
        }
      }

      openaipSuccess = true
    } catch (err) {
      console.warn('[OpenSquawk] Failed to fetch OpenAIP airport data:', err)
    }
  }

  const frequencies = Array.from(frequencyMap.values()).sort((a, b) => {
    const orderA = TYPE_ORDER.indexOf(a.type)
    const orderB = TYPE_ORDER.indexOf(b.type)
    if (orderA !== orderB) {
      const aScore = orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA
      const bScore = orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB
      return aScore - bScore
    }
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type)
    }
    if (a.frequency !== b.frequency) {
      return a.frequency.localeCompare(b.frequency)
    }
    return (a.callsign || '').localeCompare(b.callsign || '')
  })

  return {
    icao,
    airportName,
    sources: {
      vatsim: vatsimSuccess,
      openaip: openaipSuccess
    },
    frequencies
  }
})
