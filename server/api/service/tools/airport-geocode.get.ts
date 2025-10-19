import { defineEventHandler, getQuery } from 'h3'

import {
  fetchAirportFeatures,
  resolveFeature,
  toGeocodePayload,
  type GeocodeQuery
} from './airportGeocode'

function parseCoordinate(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function hasCoordinatePair(query: GeocodeQuery) {
  return typeof query.lat === 'number' && typeof query.lon === 'number'
}

function normalizeQuery(query: GeocodeQuery) {
  return {
    name: query.name?.trim() || null,
    lat: hasCoordinatePair(query) ? (query.lat as number) : null,
    lon: hasCoordinatePair(query) ? (query.lon as number) : null
  }
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)

  const airport = typeof q.airport === 'string' ? q.airport.trim().toUpperCase() : ''

  const originQuery: GeocodeQuery = {
    name: typeof q.origin_name === 'string' ? q.origin_name : undefined,
    lat: parseCoordinate(q.origin_lat),
    lon: parseCoordinate(q.origin_lng ?? q.origin_lon)
  }

  const destQuery: GeocodeQuery = {
    name: typeof q.dest_name === 'string' ? q.dest_name : undefined,
    lat: parseCoordinate(q.dest_lat),
    lon: parseCoordinate(q.dest_lng ?? q.dest_lon)
  }

  const normalizedOrigin = normalizeQuery(originQuery)
  const normalizedDest = normalizeQuery(destQuery)

  const hasOriginQuery = Boolean(normalizedOrigin.name) || hasCoordinatePair(originQuery)
  const hasDestQuery = Boolean(normalizedDest.name) || hasCoordinatePair(destQuery)

  if (!airport) {
    return { error: 'missing_airport' }
  }

  if (!hasOriginQuery && !hasDestQuery) {
    return { error: 'missing_query', airport }
  }

  let features
  try {
    features = await fetchAirportFeatures(airport)
  } catch (error) {
    return { error: 'overpass_error', airport, details: (error as Error).message }
  }

  if (!features.length) {
    return {
      error: 'no_features',
      airport,
      origin: hasOriginQuery ? { query: normalizedOrigin, result: null } : undefined,
      dest: hasDestQuery ? { query: normalizedDest, result: null } : undefined
    }
  }

  const resolve = (query: GeocodeQuery) => {
    const match = resolveFeature(features, query)
    if (!match) return null
    return toGeocodePayload(match)
  }

  const response: Record<string, unknown> = {
    airport,
    feature_count: features.length
  }

  if (hasOriginQuery) {
    response.origin = {
      query: normalizedOrigin,
      result: resolve(originQuery)
    }
  }

  if (hasDestQuery) {
    response.dest = {
      query: normalizedDest,
      result: resolve(destQuery)
    }
  }

  return response
})
