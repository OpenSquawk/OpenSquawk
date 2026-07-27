import { defineEventHandler, getQuery } from 'h3'

import { forwardToRadioBackend } from '../../../utils/radioBackend'

/**
 * Compute a taxi route between two points or named aerodrome features.
 *
 * The routing itself lives in the Python backend, which owns the Overpass
 * client and its cache, the airport dataset, and the runway-threshold logic.
 * This route used to be a second implementation of all of it and drifted:
 * it asked Overpass for `out center tags`, so a runway resolved to the centre
 * of the strip instead of a threshold — the runway-endpoint bug the backend
 * fixed with `origin_runway_point` / `dest_runway_point` (start|end|center,
 * default start), which forwarding now exposes here too.
 */
export default defineEventHandler(async (event) =>
  forwardToRadioBackend('/api/service/tools/taxiroute', getQuery(event))
)
