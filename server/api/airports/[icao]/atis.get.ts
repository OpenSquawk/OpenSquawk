import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getServerRuntimeConfig } from '../../../utils/runtimeConfig'
import {
  fetchMetar,
  fetchOpenAipAirport,
  fetchVatsimData,
  openAipAtisFrequency,
  parseOpenAipRunways,
  vatsimAtisStations,
} from '../../../utils/airportSources'
import { resolveAtisReport, type AtisReport } from '../../../../shared/utils/atisReport'

/**
 * The airport's current ATIS, from VATSIM when a station is broadcasting and
 * synthesised from the METAR when not.
 *
 * The response always carries an information letter, so the caller never has to
 * invent one — see `shared/utils/atisReport.ts` for the source cascade.
 */
export default defineEventHandler(async (event): Promise<AtisReport> => {
  const icaoParam = getRouterParam(event, 'icao')
  if (!icaoParam) {
    throw createError({ statusCode: 400, statusMessage: 'icao required' })
  }
  const icao = icaoParam.toUpperCase()

  const { openaipApiKey } = getServerRuntimeConfig()
  const [vatsimData, airport, metar] = await Promise.all([
    fetchVatsimData(),
    fetchOpenAipAirport(icao, openaipApiKey),
    fetchMetar(icao),
  ])

  const airportName = typeof airport?.name === 'string' ? airport.name.trim() : undefined
  const municipality = typeof airport?.municipality === 'string' ? airport.municipality.trim() : undefined

  return resolveAtisReport({
    icao,
    airportName: airportName || municipality || undefined,
    vatsimStations: vatsimAtisStations(vatsimData, icao),
    metar,
    runways: parseOpenAipRunways(airport),
    atisFrequency: openAipAtisFrequency(airport),
  })
})
