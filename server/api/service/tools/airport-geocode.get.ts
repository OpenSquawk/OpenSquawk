import { defineEventHandler, getQuery } from 'h3'

import { forwardToRadioBackend } from '../../../utils/radioBackend'

/**
 * Resolve named aerodrome features to coordinates, or coordinates to the
 * nearest named feature, for one airport.
 *
 * Forwarded to the Python backend, which owns the OSM feature dataset and the
 * alias matching. Beyond ending the duplication, this inherits two things the
 * Nuxt copy never had: the Overpass response cache, and the radius fallback
 * for aerodromes whose OSM relation has no generated area (EDDM), which the
 * copy answered with an empty feature list.
 */
export default defineEventHandler(async (event) =>
  forwardToRadioBackend('/api/service/tools/airport-geocode', getQuery(event))
)
