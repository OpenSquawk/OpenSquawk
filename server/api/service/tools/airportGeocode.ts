import https from 'node:https'

export type FeatureType =
  | 'runway'
  | 'gate'
  | 'parking_position'
  | 'taxiway'
  | 'holding_position'
  | 'stand'
  | 'unknown'

export type OsmElement =
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
      geometry?: Array<{ lat: number; lon: number; id?: number }>
      tags?: Record<string, string>
    })

export type AirportFeature = {
  osmType: 'node' | 'way'
  osmId: number
  type: FeatureType
  lat: number
  lon: number
  tags: Record<string, string>
  aliases: string[]
  primaryAlias: string
  normalizedAliases: Map<string, string>
  runwayEndpoints?: {
    start: { lat: number; lon: number; nodeId?: number }
    end: { lat: number; lon: number; nodeId?: number }
  }
}

export type GeocodeQuery = {
  name?: string | null
  lat?: number | null
  lon?: number | null
}

export type GeocodeMatch = {
  feature: AirportFeature
  matchedAlias: string | null
  distanceMeters?: number
  source: 'name' | 'coordinate'
}

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'
const EARTH_RADIUS = 6371000

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function haversineDistance(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
) {
  const dLat = toRadians(b.lat - a.lat)
  const dLon = toRadians(b.lon - a.lon)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)

  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h))
}

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
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function normalizeWithPrefixes(value: string) {
  const variants = new Set<string>()
  const trimmed = value.trim().toUpperCase()
  if (!trimmed) return variants

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
  let primaryAlias: string | null = null

  const addAlias = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (!aliases.has(trimmed)) {
      aliases.add(trimmed)
      if (!primaryAlias) primaryAlias = trimmed
    }
  }

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

  const addCandidate = (candidate: string) => {
    if (!candidate) return
    if (featureType === 'runway') {
      const parts = candidate.split(/[\/;,]/)
      if (parts.length > 1) {
        for (const part of parts) addAlias(part)
      }
    }
    addAlias(candidate)
  }

  for (const candidate of candidates) {
    addCandidate(candidate)
  }

  if (featureType === 'parking_position') {
    const refStand = tags['ref:stand']
    if (refStand) addAlias(refStand)
  }

  const aliasList = Array.from(aliases)

  return {
    aliases: aliasList,
    primaryAlias: primaryAlias ?? aliasList[0] ?? null
  }
}

function createFeature(element: OsmElement): AirportFeature | null {
  const tags = element.tags ?? {}
  const featureType = deriveFeatureType(tags)
  const lat = element.type === 'node' ? element.lat : element.center?.lat
  const lon = element.type === 'node' ? element.lon : element.center?.lon

  if (lat === undefined || lon === undefined) return null

  const { aliases, primaryAlias } = buildAliases(tags, featureType)
  if (aliases.length === 0 || !primaryAlias) return null

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

  const feature: AirportFeature = {
    osmType: element.type,
    osmId: element.id,
    type: featureType === 'parking_position' ? 'stand' : featureType,
    lat,
    lon,
    tags,
    aliases,
    primaryAlias,
    normalizedAliases
  }

  if (feature.type === 'runway' && element.type === 'way' && element.geometry && element.geometry.length > 1) {
    const startPoint = element.geometry[0]
    const endPoint = element.geometry[element.geometry.length - 1]
    feature.runwayEndpoints = {
      start: { lat: startPoint.lat, lon: startPoint.lon, nodeId: startPoint.id },
      end: { lat: endPoint.lat, lon: endPoint.lon, nodeId: endPoint.id }
    }
  }

  return feature
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

export function buildMapUrl(feature: AirportFeature) {
  const zoom = feature.type === 'runway' ? 17 : 19
  const lat = feature.lat.toFixed(6)
  const lon = feature.lon.toFixed(6)
  return `https://www.openstreetmap.org/${feature.osmType}/${feature.osmId}?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`
}

export async function fetchAirportFeatures(airport: string) {
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
out tags center geom;
  `

  const osm = await fetchOverpass(overpassQuery)

  const features: AirportFeature[] = []
  if (Array.isArray(osm?.elements)) {
    for (const element of osm.elements as OsmElement[]) {
      if (element.type !== 'node' && element.type !== 'way') continue
      const feature = createFeature(element)
      if (feature) features.push(feature)
    }
  }

  return features
}

export function matchFeatureByName(features: AirportFeature[], query: string) {
  if (!query) return null

  const { trimmed, sanitizedQuery, runwayBias } = analyzeQuery(query)
  const baseQuery = sanitizedQuery || trimmed
  if (!baseQuery) return null

  const queryVariants = normalizeWithPrefixes(baseQuery)
  if (queryVariants.size === 0) return null

  const variantList = Array.from(queryVariants)
  let best:
    | {
        feature: AirportFeature
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

export function matchFeatureByCoordinate(
  features: AirportFeature[],
  lat: number,
  lon: number
) {
  let best:
    | {
        feature: AirportFeature
        distanceMeters: number
      }
    | null = null

  for (const feature of features) {
    const distanceMeters = haversineDistance({ lat, lon }, { lat: feature.lat, lon: feature.lon })
    if (!best || distanceMeters < best.distanceMeters) {
      best = { feature, distanceMeters }
    }
  }

  if (!best) return null

  return best
}

export function resolveFeature(features: AirportFeature[], query: GeocodeQuery): GeocodeMatch | null {
  const name = query.name?.trim()
  const lat = typeof query.lat === 'number' ? query.lat : null
  const lon = typeof query.lon === 'number' ? query.lon : null

  if (name) {
    const match = matchFeatureByName(features, name)
    if (match) {
      return {
        feature: match.feature,
        matchedAlias: match.matchedAlias,
        source: 'name'
      }
    }
  }

  if (lat !== null && lon !== null) {
    const match = matchFeatureByCoordinate(features, lat, lon)
    if (match) {
      return {
        feature: match.feature,
        matchedAlias: match.feature.primaryAlias,
        distanceMeters: match.distanceMeters,
        source: 'coordinate'
      }
    }
  }

  return null
}

export function toGeocodePayload(match: GeocodeMatch) {
  const feature = match.feature
  const resolvedName = match.matchedAlias ?? feature.primaryAlias

  return {
    type: feature.type,
    name: resolvedName,
    lat: feature.lat,
    lon: feature.lon,
    matched_alias: match.matchedAlias,
    primary_alias: feature.primaryAlias,
    map_url: buildMapUrl(feature),
    osm: {
      type: feature.osmType,
      id: feature.osmId,
      tags: feature.tags
    },
    source: match.source,
    distance_m: match.distanceMeters ?? null,
    runway_endpoints: feature.runwayEndpoints
  }
}
