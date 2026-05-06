import { createError, defineEventHandler, getQuery } from 'h3'

// Lädt aktuellen SimBrief OFP. Public API: kein Token nötig, Username oder PilotID reicht.
// Doku: https://www.simbrief.com/api/xml.fetcher.php
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const username = (Array.isArray(query.username) ? query.username[0] : query.username)?.toString().trim()
    const userid = (Array.isArray(query.userid) ? query.userid[0] : query.userid)?.toString().trim()
    if (!username && !userid) {
        throw createError({statusCode: 400, statusMessage: 'username or userid required'})
    }

    const params = new URLSearchParams({json: '1'})
    if (username) params.set('username', username)
    if (userid) params.set('userid', userid)

    const url = `https://www.simbrief.com/api/xml.fetcher.php?${params.toString()}`
    const fetcher = (globalThis as any).$fetch as (target: string, options?: Record<string, unknown>) => Promise<any>
    let ofp: any
    try {
        ofp = await fetcher(url, {method: 'GET', ignoreResponseError: true})
    } catch (e: any) {
        throw createError({statusCode: 502, statusMessage: `SimBrief API unreachable: ${e?.message || e}`})
    }

    if (!ofp || typeof ofp !== 'object') {
        throw createError({statusCode: 502, statusMessage: 'SimBrief returned invalid response'})
    }
    const status = ofp.fetch?.status
    if (status !== 'Success') {
        // Beispiele: "Error: Unknown UserID", "Error: No data found"
        throw createError({statusCode: 404, statusMessage: status || 'No SimBrief OFP found'})
    }

    return {
        callsign: ofp.atc?.callsign,
        flightNumber: ofp.general?.flight_number,
        aircraftReg: ofp.aircraft?.reg,
        aircraftIcao: ofp.aircraft?.icao_code,
        departure: ofp.origin?.icao_code,
        destination: ofp.destination?.icao_code,
        altn: ofp.alternate?.icao_code,
        route: ofp.general?.route,
        crzFL: ofp.general?.initial_altitude ? `FL${Math.round(Number(ofp.general.initial_altitude) / 100)}` : undefined,
        costIndex: ofp.general?.costindex,
        zfw: ofp.weights?.est_zfw ? (Number(ofp.weights.est_zfw) / 1000).toFixed(1) : undefined,
        blockFuel: ofp.fuel?.plan_ramp ? (Number(ofp.fuel.plan_ramp) / 1000).toFixed(1) : undefined,
        tripFuel: ofp.fuel?.enroute_burn ? (Number(ofp.fuel.enroute_burn) / 1000).toFixed(1) : undefined,
        sid: ofp.api_params?.sid_ident || ofp.general?.sid_ident,
        rwy: ofp.origin?.plan_rwy,
        transAlt: ofp.origin?.trans_alt,
        transLevel: ofp.destination?.trans_level,
        atc: {
            initial_alt: ofp.atc?.initial_alt,
            route: ofp.atc?.route,
        },
        raw: ofp,
    }
})
