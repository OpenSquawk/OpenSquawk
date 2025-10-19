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
      geometry?: { lat: number; lon: number }[]
      tags?: Record<string, string>
    })

export type RunwayThresholds = {
  start: { lat: number; lon: number }
  end: { lat: number; lon: number }
}

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
  runwayThresholds: RunwayThresholds | null
}

export type GeocodeQuery = {
  name?: string | null
  lat?: number | null
  lon?: number | null
  runwayEnd?: 'start' | 'end' | 'center' | null
}

export type GeocodeMatch = {
  feature: AirportFeature
  matchedAlias: string | null
  distanceMeters?: number
  source: 'name' | 'coordinate'
  resolvedLocation: { lat: number; lon: number }
  runwayEnd: 'start' | 'end' | 'center' | null
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

  const finalType = featureType === 'parking_position' ? 'stand' : featureType

  let runwayThresholds: RunwayThresholds | null = null
  if (finalType === 'runway' && element.type === 'way') {
    const geometry = element.geometry ?? []
    if (geometry.length >= 2) {
      const start = geometry[0]
      const end = geometry[geometry.length - 1]
      if (start && end) {
        runwayThresholds = {
          start: { lat: start.lat, lon: start.lon },
          end: { lat: end.lat, lon: end.lon }
        }
      }
    }
  }

  return {
    osmType: element.type,
    osmId: element.id,
    type: finalType,
    lat,
    lon,
    tags,
    aliases,
    primaryAlias,
    normalizedAliases,
    runwayThresholds
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

export function buildMapUrl(feature: AirportFeature, location?: { lat: number; lon: number }) {
  const zoom = feature.type === 'runway' ? 17 : 19
  const anchorLat = location?.lat ?? feature.lat
  const anchorLon = location?.lon ?? feature.lon
  const lat = anchorLat.toFixed(6)
  const lon = anchorLon.toFixed(6)
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
out center tags geom;
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

type FeatureLocationCandidate = {
  lat: number
  lon: number
  runwayEnd: 'start' | 'end' | 'center' | null
}

function getFeatureLocationCandidates(feature: AirportFeature): FeatureLocationCandidate[] {
  const candidates: FeatureLocationCandidate[] = [
    { lat: feature.lat, lon: feature.lon, runwayEnd: feature.type === 'runway' ? 'center' : null }
  ]

  if (feature.type === 'runway' && feature.runwayThresholds) {
    candidates.push({ lat: feature.runwayThresholds.start.lat, lon: feature.runwayThresholds.start.lon, runwayEnd: 'start' })
    candidates.push({ lat: feature.runwayThresholds.end.lat, lon: feature.runwayThresholds.end.lon, runwayEnd: 'end' })
  }

  return candidates
}

function pickFeatureLocation(
  feature: AirportFeature,
  preferredRunwayEnd: 'start' | 'end' | 'center' | null | undefined
): FeatureLocationCandidate {
  if (feature.type === 'runway' && feature.runwayThresholds) {
    if (preferredRunwayEnd === 'end') {
      return {
        lat: feature.runwayThresholds.end.lat,
        lon: feature.runwayThresholds.end.lon,
        runwayEnd: 'end'
      }
    }

    if (preferredRunwayEnd === 'center') {
      return { lat: feature.lat, lon: feature.lon, runwayEnd: 'center' }
    }

    return {
      lat: feature.runwayThresholds.start.lat,
      lon: feature.runwayThresholds.start.lon,
      runwayEnd: 'start'
    }
  }

  return {
    lat: feature.lat,
    lon: feature.lon,
    runwayEnd: feature.type === 'runway' ? 'center' : null
  }
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
        location: FeatureLocationCandidate
      }
    | null = null

  for (const feature of features) {
    for (const location of getFeatureLocationCandidates(feature)) {
      const distanceMeters = haversineDistance({ lat, lon }, { lat: location.lat, lon: location.lon })
      if (!best || distanceMeters < best.distanceMeters) {
        best = { feature, distanceMeters, location }
      }
    }
  }

  if (!best) return null

  return best
}

export function resolveFeature(features: AirportFeature[], query: GeocodeQuery): GeocodeMatch | null {
  const name = query.name?.trim()
  const lat = typeof query.lat === 'number' ? query.lat : null
  const lon = typeof query.lon === 'number' ? query.lon : null
  const preferredRunwayEnd = query.runwayEnd ?? null

  if (name) {
    const match = matchFeatureByName(features, name)
    if (match) {
      const location = pickFeatureLocation(match.feature, preferredRunwayEnd)
      return {
        feature: match.feature,
        matchedAlias: match.matchedAlias,
        source: 'name',
        resolvedLocation: { lat: location.lat, lon: location.lon },
        runwayEnd: location.runwayEnd
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
        source: 'coordinate',
        resolvedLocation: { lat: match.location.lat, lon: match.location.lon },
        runwayEnd: match.location.runwayEnd
      }
    }
  }

  return null
}

export function toGeocodePayload(match: GeocodeMatch) {
  const feature = match.feature
  const resolvedName = match.matchedAlias ?? feature.primaryAlias
  const location = match.resolvedLocation

  return {
    type: feature.type,
    name: resolvedName,
    lat: location.lat,
    lon: location.lon,
    matched_alias: match.matchedAlias,
    primary_alias: feature.primaryAlias,
    runway_end: match.runwayEnd,
    center: { lat: feature.lat, lon: feature.lon },
    runway_thresholds: feature.runwayThresholds,
    map_url: buildMapUrl(feature, location),
    osm: {
      type: feature.osmType,
      id: feature.osmId,
      tags: feature.tags
    },
    source: match.source,
    distance_m: match.distanceMeters ?? null
  }
}
