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
  normalizedAliases: Set<string>
}

type QueryType = 'runway' | 'gate' | 'stand' | 'taxiway' | 'holding'

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

  const normalizedAliases = new Set<string>()
  for (const alias of aliases) {
    const variants = normalizeWithPrefixes(alias)
    for (const variant of variants) normalizedAliases.add(variant)
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

function inferTypeFromQuery(query: string) {
  let sanitized = query
  let inferred: QueryType | undefined

  const patterns: Array<{ hint: QueryType; detect: RegExp; remove: RegExp }> = [
    { hint: 'runway', detect: /\b(runway|rwy)\b/i, remove: /\b(runway|rwy)\b/gi },
    { hint: 'gate', detect: /\b(gate)\b/i, remove: /\b(gate)\b/gi },
    {
      hint: 'stand',
      detect: /\b(stand|parking|standposition)\b/i,
      remove: /\b(stand|parking|standposition)\b/gi
    },
    { hint: 'taxiway', detect: /\b(taxiway|taxi)\b/i, remove: /\b(taxiway|taxi)\b/gi },
    {
      hint: 'holding',
      detect: /\b(holding|holdshort|holdingpoint)\b/i,
      remove: /\b(holding|holdshort|holdingpoint)\b/gi
    }
  ]

  for (const { hint, detect, remove } of patterns) {
    if (detect.test(sanitized)) {
      inferred = inferred ?? hint
      sanitized = sanitized.replace(remove, ' ')
    }
  }

  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  return {
    sanitizedQuery: sanitized || query.trim(),
    inferredType: inferred
  }
}

function findMatch(
  features: Feature[],
  query: string,
  typeHint?: QueryType
): { feature: Feature; matchedAlias: string } | null {
  if (!query) return null

  const queryVariants = normalizeWithPrefixes(query)
  if (queryVariants.size === 0) return null

  const typeFilters = typeHint
    ? {
        runway: ['runway'],
        gate: ['gate'],
        stand: ['stand'],
        taxiway: ['taxiway'],
        holding: ['holding_position']
      }[typeHint]
    : undefined

  const candidates = typeFilters
    ? features.filter((feature) => typeFilters.includes(feature.type))
    : features

  const fallbackCandidates = candidates.length > 0 ? candidates : features

  for (const feature of fallbackCandidates) {
    for (const variant of queryVariants) {
      if (feature.normalizedAliases.has(variant)) {
        return { feature, matchedAlias: variant }
      }
    }
  }

  // attempt loose matching (variant contains alias or vice versa)
  for (const feature of fallbackCandidates) {
    for (const variant of queryVariants) {
      for (const alias of feature.normalizedAliases) {
        if (variant.includes(alias) || alias.includes(variant)) {
          return { feature, matchedAlias: alias }
        }
      }
    }
  }

  return null
}

function mapTypeHint(value: string | undefined): QueryType | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  if (['runway', 'rwy'].includes(normalized)) return 'runway'
  if (['gate'].includes(normalized)) return 'gate'
  if (['stand', 'parking', 'standposition'].includes(normalized)) return 'stand'
  if (['taxiway', 'taxi'].includes(normalized)) return 'taxiway'
  if (['holding', 'holdshort', 'holdingpoint'].includes(normalized)) return 'holding'
  return undefined
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)

  const airport = typeof q.airport === 'string' ? q.airport.trim().toUpperCase() : ''
  const originName = typeof q.origin_name === 'string' ? q.origin_name.trim() : ''
  const destName = typeof q.dest_name === 'string' ? q.dest_name.trim() : ''
  const originType = mapTypeHint(typeof q.origin_type === 'string' ? q.origin_type : undefined)
  const destType = mapTypeHint(typeof q.dest_type === 'string' ? q.dest_type : undefined)

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

  const find = (query: string, typeHint?: QueryType) => {
    const { sanitizedQuery, inferredType } = inferTypeFromQuery(query)
    const effectiveType = typeHint ?? inferredType
    const match = findMatch(features, sanitizedQuery, effectiveType)
    if (!match) {
      return {
        query,
        type_hint: effectiveType ?? null,
        result: null
      }
    }

    const { feature, matchedAlias } = match
    return {
      query,
      type_hint: effectiveType ?? null,
      result: {
        type: feature.type,
        lat: feature.lat,
        lon: feature.lon,
        matched_alias: matchedAlias,
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

  if (originName) response.origin = find(originName, originType)
  if (destName) response.dest = find(destName, destType)

  return response
})
