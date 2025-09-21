import { defineEventHandler, getQuery, createError } from 'h3'

function pickQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value.find(entry => typeof entry === 'string' && entry.trim().length > 0)
  }
  return value && value.trim().length > 0 ? value : undefined
}

function toStringValue(value: any): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : null
  }
  return null
}

function toNumberValue(value: any): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

type SimbriefPlanSummary = {
  callsign: string | null
  airlineCode: string | null
  airlineCallsign: string | null
  flightNumber: string | null
  route: string | null
  departure: {
    icao: string | null
    name: string | null
    runway: string | null
    sid: string | null
    transition: string | null
  }
  destination: {
    icao: string | null
    name: string | null
    runway: string | null
    star: string | null
    transition: string | null
    approach: string | null
  }
  initialAltitude: number | null
  cruiseAltitude: number | null
  squawk: string | null
  generatedAt: string | null
  aircraft: string | null
  ofpUrl: string | null
}

function extractSimbriefSummary(data: any): SimbriefPlanSummary {
  const general = data?.general ?? {}
  const origin = data?.origin ?? {}
  const destination = data?.destination ?? {}
  const atc = data?.atc ?? {}
  const links = data?.links ?? data?.files ?? {}

  const airlineCode =
    toStringValue(general.icao_airline) || toStringValue(general.airline_icao) || toStringValue(general.airline_code)
  const callsign = toStringValue(general.callsign) || null
  const flightNumber = toStringValue(general.flight_number) || null

  let airlineCallsign = toStringValue(general.airline) || null
  if (!airlineCallsign && callsign) {
    airlineCallsign = callsign.replace(/\d+/g, '').trim() || null
  }

  const departureIcao =
    toStringValue(origin.icao_code) || toStringValue(general.origin) || toStringValue(general.departure) || null
  const departureName = toStringValue(origin.name) || toStringValue(general.origin_name) || null
  const departureRunway =
    toStringValue(origin.plan_rwy) || toStringValue(origin.plan_runway) || toStringValue(general.departure_runway) || null
  const departureSid =
    toStringValue(origin.sid_name) || toStringValue(origin.sid) || toStringValue(general.sid) || null
  const departureTransition =
    toStringValue(origin.sid_transition) || toStringValue(origin.transition) || toStringValue(general.transition) || null

  const destinationIcao =
    toStringValue(destination.icao_code) || toStringValue(general.destination) || toStringValue(general.arrival) || null
  const destinationName = toStringValue(destination.name) || toStringValue(general.destination_name) || null
  const destinationRunway =
    toStringValue(destination.plan_rwy) ||
    toStringValue(destination.plan_runway) ||
    toStringValue(general.arrival_runway) ||
    null
  const destinationStar =
    toStringValue(destination.star_name) || toStringValue(destination.star) || toStringValue(general.star) || null
  const destinationTransition =
    toStringValue(destination.star_transition) ||
    toStringValue(destination.transition) ||
    toStringValue(general.arrival_transition) ||
    null
  const destinationApproach =
    toStringValue(destination.approach_name) ||
    toStringValue(destination.approach) ||
    toStringValue(general.approach) ||
    null

  const initialAltitude =
    toNumberValue(atc.initial_altitude) ||
    toNumberValue(general.initial_altitude) ||
    toNumberValue(general.initial_climb) ||
    null
  const cruiseAltitude = toNumberValue(general.cruise_altitude) || toNumberValue(general.final_altitude) || null
  const squawk = toStringValue(atc.assigned_squawk) || toStringValue(general.squawk) || null
  const generatedAt =
    toStringValue(general.time_generated) ||
    toStringValue(data?.times?.generated_zulu) ||
    toStringValue(data?.times?.generated_local) ||
    null
  const aircraft =
    toStringValue(general.aircraft_icao) ||
    toStringValue(general.aircraft) ||
    toStringValue(data?.aircraft?.icao) ||
    null
  const ofpUrl =
    toStringValue(links.ofp_pdf) ||
    toStringValue(links.pdf_link) ||
    toStringValue(links.pdf) ||
    toStringValue(links.briefing) ||
    null

  return {
    callsign,
    airlineCode,
    airlineCallsign,
    flightNumber,
    route: toStringValue(general.route) || null,
    departure: {
      icao: departureIcao,
      name: departureName,
      runway: departureRunway,
      sid: departureSid,
      transition: departureTransition,
    },
    destination: {
      icao: destinationIcao,
      name: destinationName,
      runway: destinationRunway,
      star: destinationStar,
      transition: destinationTransition,
      approach: destinationApproach,
    },
    initialAltitude,
    cruiseAltitude,
    squawk,
    generatedAt,
    aircraft,
    ofpUrl,
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId =
    pickQueryValue(query.userid as string | string[] | undefined) ||
    pickQueryValue(query.userId as string | string[] | undefined) ||
    pickQueryValue(query.username as string | string[] | undefined)

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userid query parameter is required' })
  }

  const url = `https://www.simbrief.com/api/xml.fetcher.php?json=1&userid=${encodeURIComponent(userId)}`

  let data: any
  try {
    data = await $fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'OpenSquawk Trainer/1.0 (+https://opensquawk.app)',
      },
    })
  } catch (error: any) {
    const status = error?.response?.status || error?.statusCode || error?.status
    if (status === 404) {
      throw createError({ statusCode: 404, statusMessage: 'No SimBrief flight plan found for this user' })
    }
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch SimBrief flight plan' })
  }

  if (!data || typeof data !== 'object') {
    throw createError({ statusCode: 404, statusMessage: 'SimBrief response was empty' })
  }

  const summary = extractSimbriefSummary(data)

  return {
    plan: summary,
  }
})
