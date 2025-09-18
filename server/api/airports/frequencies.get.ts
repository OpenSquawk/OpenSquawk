import { defineEventHandler, getQuery, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { fallbackAirportFrequencies } from '../../data/airportFrequencies'
import type { AirportFrequency } from '~/shared/types/airport'

const TYPE_PRIORITY: Record<string, number> = {
  ATIS: 0,
  DEL: 1,
  GND: 2,
  TWR: 3,
  DEP: 4,
  APP: 5,
  CTR: 6
}

const normalizeType = (raw: string | undefined | null): string => {
  if (!raw) return 'RADIO'
  const upper = raw.toUpperCase()
  if (upper.includes('ATIS')) return 'ATIS'
  if (upper.includes('CLEARANCE') || upper.includes('DEL')) return 'DEL'
  if (upper.includes('GROUND') || upper.includes('APRON')) return 'GND'
  if (upper.includes('TOWER') || upper.includes('TWR')) return 'TWR'
  if (upper.includes('DEPART')) return 'DEP'
  if (upper.includes('APPROACH') || upper.includes('ARRIVAL')) return 'APP'
  if (upper.includes('CENTER') || upper.includes('CONTROL') || upper.includes('RADAR') || upper.includes('CENTRE') || upper.includes('ACC')) {
    return 'CTR'
  }
  return upper
}

const parseFrequencyNumber = (value: any): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').match(/\d{3}(?:\.\d{1,3})?/)
    if (normalized) {
      const num = Number.parseFloat(normalized[0])
      if (Number.isFinite(num)) return num
    }
  }

  if (value && typeof value === 'object') {
    const candidates = [
      value.mhz,
      value.Mhz,
      value.MHz,
      value.frequency,
      value.frequencyMHz,
      value.frequency_mhz,
      value.freq,
      value.value,
      value.val
    ]

    for (const candidate of candidates) {
      const parsed = parseFrequencyNumber(candidate)
      if (parsed) return parsed
    }
  }

  return null
}

const formatFrequency = (value: any): string | null => {
  const parsed = parseFrequencyNumber(value)
  if (!parsed) return null
  return parsed.toFixed(3)
}

const extractFrequencies = (payload: any, icao: string): AirportFrequency[] => {
  if (!payload) return []

  const list = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
      ? payload.data
      : []

  if (!list.length) return []

  const upperIcao = icao.toUpperCase()
  const airport = list.find((item: any) => {
    const candidate = (item?.icao ?? item?.ident ?? item?.code ?? item?.name)?.toString()?.toUpperCase?.()
    return candidate === upperIcao
  }) || list[0]

  if (!airport) return []

  const radios = Array.isArray(airport.radios)
    ? airport.radios
    : Array.isArray(airport.radio)
      ? airport.radio
      : Array.isArray(airport.communication)
        ? airport.communication
        : []

  if (!radios.length) return []

  const results: AirportFrequency[] = []
  const seen = new Set<string>()

  for (const radio of radios) {
    const frequency = formatFrequency(radio?.frequency ?? radio?.value ?? radio)
      ?? formatFrequency(radio?.radioFrequency)
      ?? formatFrequency(radio?.frequencyMHz)
      ?? formatFrequency(radio?.frequency_mhz)
      ?? formatFrequency(radio)

    if (!frequency) continue

    const rawType = radio?.type || radio?.category?.name || radio?.service || radio?.usage || radio?.name
    const type = normalizeType(rawType)
    const key = `${type}-${frequency}`
    if (seen.has(key)) continue
    seen.add(key)

    const name = radio?.name || radio?.description || radio?.category?.name || radio?.service
    const description = radio?.usage || radio?.remarks || radio?.remark || undefined

    results.push({
      type,
      frequency,
      name: typeof name === 'string' ? name : undefined,
      description: typeof description === 'string' ? description : undefined
    })
  }

  return results
    .sort((a, b) => {
      const byType = (TYPE_PRIORITY[a.type] ?? 99) - (TYPE_PRIORITY[b.type] ?? 99)
      if (byType !== 0) return byType
      return a.frequency.localeCompare(b.frequency)
    })
}

export default defineEventHandler(async (event) => {
  const { icao } = getQuery(event)
  if (!icao) {
    throw createError({ statusCode: 400, statusMessage: 'icao required' })
  }

  const code = String(icao).trim().toUpperCase()
  if (!code || code.length !== 4) {
    throw createError({ statusCode: 400, statusMessage: 'icao must be a 4 letter code' })
  }

  const runtimeConfig = useRuntimeConfig(event)
  const openAipKey = runtimeConfig.openAipKey || process.env.OPENAIP_API_KEY
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (openAipKey) {
    headers['x-openaip-api-key'] = openAipKey
  }

  let frequencies: AirportFrequency[] = []
  let source: 'openaip' | 'fallback' | 'none' = 'none'

  const endpoints = [
    `https://api.openaip.net/api/airports?icao=${code}`,
    `https://api.core.openaip.net/api/airports?search=${code}`
  ]

  for (const url of endpoints) {
    try {
      const response = await $fetch(url, {
        headers,
        method: 'GET'
      })
      frequencies = extractFrequencies(response, code)
      if (frequencies.length) {
        source = 'openaip'
        break
      }
    } catch (err) {
      console.error(`Failed to fetch airport frequencies from ${url}:`, err)
    }
  }

  if (!frequencies.length) {
    const fallback = fallbackAirportFrequencies[code]
    if (fallback?.length) {
      frequencies = fallback
      source = 'fallback'
    }
  }

  return {
    success: frequencies.length > 0,
    icao: code,
    source,
    frequencies
  }
})
