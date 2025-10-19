import { defineEventHandler, getQuery } from 'h3'
import https from 'node:https'

type FeatureType =
  | 'runway'
  | 'gate'
  | 'parking_position'
  | 'taxiway'
  | 'holding_position'
  | 'stand'
  | 'unknown'

type OsmElement =
  | ({
      type: 'node'
      id: number
      lat: number
      lon: number
      tags?: Record<string, string>
    })
  | ({
      type: 'way'
      id: number
      nodes: number[]
      center?: { lat: number; lon: number }
      tags?: Record<string, string>
    })

type Feature = {
  osmType: 'node' | 'way'
  osmId: number
  type: FeatureType
  lat: number
  lon: number
  tags: Record<string, string>
  aliases: string[]
  normalizedAliases: Map<string, string>
}

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'

function fetchOverpass(query: string) {
  return new Promise<any>((resolve, reject) => {
    const req = https.request(
      OVERPASS_ENDPOINT,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      },
      (res) => {
        let data = ''
        res.on('data', (d) => (data += d))
        res.on('end', () => {
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`))
          }
          try {
            resolve(JSON.parse(data))
          } catch (err) {
            reject(err)
          }
        })
      }
    )

    req.on('error', reject)
    req.write('data=' + encodeURIComponent(query))
    req.end()
  })
}

function normalize(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function normalizeWithPrefixes(value: string) {
  const variants = new Set<string>()
  const trimmed = value.trim().toUpperCase()
  if (trimmed.length === 0) return variants

  const base = normalize(trimmed)
  if (base) variants.add(base)

  const withoutRunway = trimmed.replace(/^(RUNWAY|RWY)\s+/, '')
  if (withoutRunway !== trimmed) {
    const normalized = normalize(withoutRunway)
    if (normalized) variants.add(normalized)
  }

  const withoutGate = trimmed.replace(/^(GATE|STAND)\s+/, '')
  if (withoutGate !== trimmed) {
    const normalized = normalize(withoutGate)
    if (normalized) variants.add(normalized)
  }

  const tokens = trimmed.split(/\s+/)
  if (tokens.length > 1) {
    const lastToken = normalize(tokens[tokens.length - 1])
    if (lastToken) variants.add(lastToken)
  }

  return variants
}

function deriveFeatureType(tags: Record<string, string>): FeatureType {
  const aeroway = tags.aeroway as FeatureType | undefined
  if (!aeroway) return 'unknown'

  if (aeroway === 'parking_position') return 'parking_position'
  if (aeroway === 'gate') return 'gate'
  if (aeroway === 'runway') return 'runway'
  if (aeroway === 'taxiway') return 'taxiway'
  if (aeroway === 'holding_position') return 'holding_position'

  return 'unknown'
}

function buildAliases(tags: Record<string, string>, featureType: FeatureType) {
  const aliases = new Set<string>()

  const candidates: string[] = []
  const ref = tags.ref
  const name = tags.name
  const designation = tags.designation
  const icao = tags['ref:icao']

  if (ref) candidates.push(ref)
  if (designation && designation !== ref) candidates.push(designation)
  if (name && name !== ref) candidates.push(name)
  if (icao && icao !== ref) candidates.push(icao)

  if (featureType === 'runway') {
    const runway = tags['ref:runway'] || tags['ref:icao:runway']
    if (runway) candidates.push(runway)
  }

  const addAlias = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    aliases.add(trimmed)
    if (featureType === 'runway') {
      const normalized = trimmed.replace(/^RWY\s*/i, '')
      if (normalized !== trimmed) aliases.add(normalized)
    }
  }

  for (const candidate of candidates) {
    if (!candidate) continue
    if (featureType === 'runway') {
      const parts = candidate.split(/[\/;,]/)
      if (parts.length > 1) {
        for (const part of parts) addAlias(part)
      }
    }
    addAlias(candidate)
  }

  if (featureType === 'parking_position') {
    // parking positions are effectively stands
    const refStand = tags['ref:stand']
    if (refStand) addAlias(refStand)
  }

  return Array.from(aliases)
}

function createFeature(element: OsmElement): Feature | null {
  const tags = element.tags ?? {}
  const featureType = deriveFeatureType(tags)
  const lat = element.type === 'node' ? element.lat : element.center?.lat
  const lon = element.type === 'node' ? element.lon : element.center?.lon

  if (lat === undefined || lon === undefined) return null

  const aliases = buildAliases(tags, featureType)
  if (aliases.length === 0) return null

  const normalizedAliases = new Map<string, string>()
  for (const alias of aliases) {
    const variants = normalizeWithPrefixes(alias)
    for (const variant of variants) {
      if (!normalizedAliases.has(variant)) {
        normalizedAliases.set(variant, alias)
      }
    }
  }

  if (normalizedAliases.size === 0) return null

  return {
    osmType: element.type,
    osmId: element.id,
    type: featureType === 'parking_position' ? 'stand' : featureType,
    lat,
    lon,
    tags,
    aliases,
    normalizedAliases
  }
}

function analyzeQuery(query: string) {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      trimmed,
      sanitizedQuery: '',
      runwayBias: false
    }
  }

  let sanitized = trimmed
  const patterns: RegExp[] = [
    /\b(runway|rwy)\b/gi,
    /\b(gate)\b/gi,
    /\b(stand|parking|standposition)\b/gi,
    /\b(taxiway|taxi)\b/gi,
    /\b(holding|holdshort|holdingpoint)\b/gi
  ]

  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, ' ')
  }

  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  const runwayBias =
    /^\s*\d/.test(trimmed) ||
    /\b(runway|rwy)\b/i.test(query) ||
    /\d{1,2}[LRC]?\b/i.test(trimmed) ||
    /\d{2}\s*\/\s*\d{2}/.test(trimmed)

  return {
    trimmed,
    sanitizedQuery: sanitized,
    runwayBias
  }
}

function buildMapUrl(feature: Feature) {
  const zoom = feature.type === 'runway' ? 17 : 19
  const lat = feature.lat.toFixed(6)
  const lon = feature.lon.toFixed(6)
  return `https://www.openstreetmap.org/${feature.osmType}/${feature.osmId}?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`
}

function findMatch(features: Feature[], query: string) {
  if (!query) return null

  const { trimmed, sanitizedQuery, runwayBias } = analyzeQuery(query)
  const baseQuery = sanitizedQuery || trimmed
  if (!baseQuery) return null

  const queryVariants = normalizeWithPrefixes(baseQuery)
  if (queryVariants.size === 0) return null

  const variantList = Array.from(queryVariants)
  let best:
    | {
        feature: Feature
        matchedAlias: string
        score: number
      }
    | null = null

  for (const feature of features) {
    for (const [aliasVariant, originalAlias] of feature.normalizedAliases) {
      for (const variant of variantList) {
        let score = 0
        if (aliasVariant === variant) {
          score = 100
        } else if (aliasVariant.includes(variant) || variant.includes(aliasVariant)) {
          score = 70
        } else {
          continue
        }

        if (runwayBias) {
          if (feature.type === 'runway') score += 20
          else score -= 10
        }

        if (feature.type === 'runway' && /^\d/.test(variant)) {
          score += 10
        }

        if (feature.type === 'gate' || feature.type === 'stand') {
          score += 2
        }

        if (!best || score > best.score) {
          best = {
            feature,
            matchedAlias: originalAlias,
            score
          }
        }
      }
    }
  }

  if (!best) return null

  return {
    feature: best.feature,
    matchedAlias: best.matchedAlias
  }
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)

  const airport = typeof q.airport === 'string' ? q.airport.trim().toUpperCase() : ''
  const originName = typeof q.origin_name === 'string' ? q.origin_name.trim() : ''
  const destName = typeof q.dest_name === 'string' ? q.dest_name.trim() : ''

  if (!airport) {
    return { error: 'missing_airport' }
  }

  if (!originName && !destName) {
    return { error: 'missing_query', airport }
  }

  const overpassQuery = `
[out:json][timeout:60];
(
  area["aeroway"="aerodrome"]["ref:icao"="${airport}"];
  area["aeroway"="aerodrome"]["icao"="${airport}"];
  area["aeroway"="aerodrome"]["ref"="${airport}"];
)->.airport;
(
  node(area.airport)["aeroway"="parking_position"];
  way(area.airport)["aeroway"="parking_position"];
  node(area.airport)["aeroway"="gate"];
  way(area.airport)["aeroway"="gate"];
  node(area.airport)["aeroway"="runway"];
  node(area.airport)["aeroway"="taxiway"];
  node(area.airport)["aeroway"="holding_position"];
  way(area.airport)["aeroway"="runway"];
  way(area.airport)["aeroway"="taxiway"];
  way(area.airport)["aeroway"="holding_position"];
);
out center tags;
  `

  let osm: any
  try {
    osm = await fetchOverpass(overpassQuery)
  } catch (error) {
    return { error: 'overpass_error', airport, details: (error as Error).message }
  }

  const features: Feature[] = []
  if (Array.isArray(osm?.elements)) {
    for (const element of osm.elements as OsmElement[]) {
      if (element.type !== 'node' && element.type !== 'way') continue
      const feature = createFeature(element)
      if (feature) features.push(feature)
    }
  }

  if (features.length === 0) {
    return { error: 'no_features', airport, origin: originName || null, dest: destName || null }
  }

  const find = (query: string) => {
    const match = findMatch(features, query)
    if (!match) {
      return {
        query,
        result: null
      }
    }

    const { feature, matchedAlias } = match
    return {
      query,
      result: {
        type: feature.type,
        lat: feature.lat,
        lon: feature.lon,
        matched_alias: matchedAlias,
        map_url: buildMapUrl(feature),
        osm: {
          type: feature.osmType,
          id: feature.osmId,
          tags: feature.tags
        }
      }
    }
  }

  const response: Record<string, unknown> = {
    airport,
    feature_count: features.length
  }

  if (originName) response.origin = find(originName)
  if (destName) response.dest = find(destName)

  return response
})
