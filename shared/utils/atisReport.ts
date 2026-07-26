/**
 * ATIS resolution.
 *
 * A session needs an information letter and a runway in use *every* time, but
 * the only live source — the VATSIM datafeed — only has an ATIS when a
 * controller happens to be online for that airport. These helpers turn whatever
 * is available (VATSIM ATIS, a METAR, or nothing at all) into one `AtisReport`,
 * so the spoken broadcast and the flow variables can never disagree.
 *
 * Everything here is pure: the caller does the fetching. See
 * `server/api/airports/[icao]/atis.get.ts` for the wiring.
 */

/** One runway end, as published by OpenAIP under `airport.runways[]`. */
export interface RunwayEnd {
    designator: string
    trueHeading: number | null
    mainRunway?: boolean
    takeOffOnly?: boolean
    landingOnly?: boolean
    lengthM?: number | null
}

export interface MetarObservation {
    raw: string
    station: string | null
    observedAt: { day: number; hour: number; minute: number } | null
    /** Mean wind direction in degrees true, or null when variable. */
    windDeg: number | null
    windKt: number | null
    gustKt: number | null
    windVariable: boolean
    qnhHpa: number | null
    /** The report minus station and timestamp, for `normalizeAtisForSpeech`. */
    body: string
}

export interface AtisStation {
    frequency: string
    callsign?: string
    variant: 'arrival' | 'departure' | null
    letter: string | null
    text: string
    lastUpdated?: string
}

export interface AtisReport {
    icao: string
    /** Where the broadcast came from — `metar`/`fallback` mean it is synthesised. */
    source: 'vatsim' | 'metar' | 'fallback'
    /** Always set, so a flow never renders an empty information letter. */
    letter: string
    letterDep: string
    letterArr: string
    runwayDep: string | null
    runwayArr: string | null
    runwaySource: 'atis' | 'wind' | 'main' | null
    /** Observed QNH, so the flow quotes the same pressure the ATIS just read. */
    qnhHpa: number | null
    /** Observed surface wind as "260/14", or null without an observation. */
    surfaceWind: string | null
    observedAt: string | null
    stations: AtisStation[]
}

export interface ResolveAtisInput {
    icao: string
    airportName?: string
    vatsimStations?: Array<{
        frequency?: string
        callsign?: string
        atisCode?: string
        text?: string
        lastUpdated?: string
    }>
    metar?: string | null
    runways?: RunwayEnd[]
    /** Published ATIS frequency, used when a synthesised broadcast needs one. */
    atisFrequency?: string
    /** Injectable clock, for the no-METAR fallback and for tests. */
    now?: Date
}

const FREQUENCY_UNKNOWN = '---'

/** Below this the wind gives no meaningful runway preference. */
const CALM_WIND_KT = 5

/** Headwind components within this margin count as equal. */
const HEADWIND_TIE_KT = 0.5

const NATO_TO_LETTER: Record<string, string> = {
    ALPHA: 'A', ALFA: 'A', BRAVO: 'B', CHARLIE: 'C', DELTA: 'D', ECHO: 'E',
    FOXTROT: 'F', GOLF: 'G', HOTEL: 'H', INDIA: 'I', JULIETT: 'J', JULIET: 'J',
    KILO: 'K', LIMA: 'L', MIKE: 'M', NOVEMBER: 'N', OSCAR: 'O', PAPA: 'P',
    QUEBEC: 'Q', ROMEO: 'R', SIERRA: 'S', TANGO: 'T', UNIFORM: 'U',
    VICTOR: 'V', WHISKEY: 'W', WHISKY: 'W', XRAY: 'X', ZULU: 'Z', YANKEE: 'Y',
}

// --- METAR -------------------------------------------------------------------

/** Parse the fields an ATIS needs out of a raw METAR. Null when it isn't one. */
export function parseMetar(raw: string): MetarObservation | null {
    const text = (raw || '').replace(/\s+/g, ' ').trim().toUpperCase()
    if (!text) return null

    // The timestamp is what makes it a METAR; without it there is nothing to
    // anchor an observation time (and therefore an information letter) on.
    const timeMatch = text.match(/\b(\d{2})(\d{2})(\d{2})Z\b/)
    if (!timeMatch) return null

    const stationMatch = text.match(/^([A-Z]{4})\b/)

    const windMatch = text.match(/\b(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT\b/)
    const windVariable = windMatch?.[1] === 'VRB'
    const windDeg = windMatch && !windVariable ? Number.parseInt(windMatch[1]!, 10) : null
    const windKt = windMatch ? Number.parseInt(windMatch[2]!, 10) : null
    const gustKt = windMatch?.[3] ? Number.parseInt(windMatch[3], 10) : null

    let qnhHpa: number | null = null
    const qnhMatch = text.match(/\bQ(\d{4})\b/)
    const altimeterMatch = text.match(/\bA(\d{4})\b/)
    if (qnhMatch) {
        qnhHpa = Number.parseInt(qnhMatch[1]!, 10)
    } else if (altimeterMatch) {
        // inHg, hundredths: 2992 -> 29.92 inHg -> 1013 hPa
        qnhHpa = Math.round((Number.parseInt(altimeterMatch[1]!, 10) / 100) * 33.8639)
    }

    // Everything after the timestamp is weather; the caller re-labels the rest.
    const body = text.slice(text.indexOf(timeMatch[0]) + timeMatch[0].length).trim()

    return {
        raw: text,
        station: stationMatch?.[1] ?? null,
        observedAt: {
            day: Number.parseInt(timeMatch[1]!, 10),
            hour: Number.parseInt(timeMatch[2]!, 10),
            minute: Number.parseInt(timeMatch[3]!, 10),
        },
        windDeg,
        windKt,
        gustKt,
        windVariable: Boolean(windVariable),
        qnhHpa,
        body,
    }
}

// --- Information letter ------------------------------------------------------

/**
 * Information letter for an observation time.
 *
 * Real ATIS letters advance one per issue. Deriving the letter from the
 * observation instead of drawing it randomly gives two properties the session
 * depends on: a background refetch of the same METAR never changes the letter,
 * and a new METAR cycle always does.
 */
export function deriveInfoLetter(at: { day: number; hour: number; minute: number } | Date): string {
    const parts = at instanceof Date
        ? { day: at.getUTCDate(), hour: at.getUTCHours(), minute: at.getUTCMinutes() }
        : at
    const halfHours = parts.day * 48 + parts.hour * 2 + (parts.minute >= 30 ? 1 : 0)
    return String.fromCharCode(65 + (halfHours % 26))
}

/** The information letter stated in an ATIS text, as a letter or a NATO word. */
export function parseAtisLetter(text: string): string | null {
    const match = (text || '').match(/\b(?:INFORMATION|INFO|ATIS)\s+([A-Z]+)\b/i)
    if (!match) return null
    const token = match[1]!.toUpperCase()
    if (token.length === 1) return token
    return NATO_TO_LETTER[token] ?? null
}

// --- Runway in use -----------------------------------------------------------

// "RWY 25C", "RUNWAY IN USE 22", "RUNWAYS 07L". The optional IN USE matters:
// German VATSIM ATIS writes "RUNWAY IN USE 22", which a bare RUNWAY-then-digits
// pattern misses entirely.
const RWY_PATTERN = String.raw`(?:RWY|RUNWAY)S?(?:\s+IN\s+USE)?\s*([0-3]?\d\s*[LRC]?)\b`

/**
 * Runway in use as stated in ATIS text. Prefers a phrase matching the requested
 * kind, then any runway mention. Null when the text names no runway.
 */
export function extractRunwayFromAtisText(texts: string[], kind: 'dep' | 'arr'): string | null {
    const kindPatterns = kind === 'dep'
        ? [new RegExp(String.raw`DEP(?:ARTURE)?S?[^.]{0,40}?${RWY_PATTERN}`, 'i')]
        : [
            new RegExp(String.raw`(?:ARR(?:IVAL)?S?|LANDING)[^.]{0,40}?${RWY_PATTERN}`, 'i'),
            new RegExp(String.raw`EXPECT[^.]{0,60}?APPROACH[^.]{0,20}?${RWY_PATTERN}`, 'i'),
        ]
    const genericPattern = new RegExp(RWY_PATTERN, 'i')

    const candidates = texts.map(text => (text || '').trim()).filter(Boolean)

    for (const patterns of [kindPatterns, [genericPattern]]) {
        for (const text of candidates) {
            for (const pattern of patterns) {
                const match = pattern.exec(text)
                if (match?.[1]) return normalizeDesignator(match[1])
            }
        }
    }
    return null
}

/** "7L" -> "07L", so designators match OSM runway refs and OpenAIP alike. */
function normalizeDesignator(raw: string): string {
    const designator = raw.replace(/\s+/g, '').toUpperCase()
    return /^\d[LRC]?$/.test(designator) ? `0${designator}` : designator
}

export interface RunwaySelection {
    designator: string
    source: 'wind' | 'main'
}

/**
 * Pick the runway in use from published runway ends.
 *
 * Scores each end by headwind component. METAR wind is referenced to true
 * north and OpenAIP `trueHeading` is true, so the two compare directly with no
 * magnetic correction. In calm or variable wind there is no preference, so the
 * airport's main runway wins instead.
 */
export function selectRunwayInUse(
    runways: RunwayEnd[],
    wind: Pick<MetarObservation, 'windDeg' | 'windKt' | 'windVariable'>,
    kind: 'dep' | 'arr',
): RunwaySelection | null {
    const usable = (runways || []).filter(runway =>
        runway.designator && typeof runway.trueHeading === 'number')
    if (!usable.length) return null

    // A runway restricted to the other direction of traffic is not a candidate
    // (EDDF 18 is departure-only), but never filter down to nothing.
    const allowed = usable.filter(runway => kind === 'dep' ? !runway.landingOnly : !runway.takeOffOnly)
    const candidates = allowed.length ? allowed : usable

    const windUsable = wind.windDeg !== null
        && wind.windKt !== null
        && wind.windKt >= CALM_WIND_KT
        && !wind.windVariable

    if (!windUsable) {
        return { designator: normalizeDesignator(pickPreferred(candidates).designator), source: 'main' }
    }

    const headwind = (runway: RunwayEnd) =>
        Math.cos(((runway.trueHeading! - wind.windDeg!) * Math.PI) / 180) * wind.windKt!

    const best = Math.max(...candidates.map(headwind))
    const tied = candidates.filter(runway => best - headwind(runway) <= HEADWIND_TIE_KT)

    return { designator: normalizeDesignator(pickPreferred(tied).designator), source: 'wind' }
}

/** Main runway first, then the longest — the tiebreak for parallel runways. */
function pickPreferred(runways: RunwayEnd[]): RunwayEnd {
    return [...runways].sort((a, b) => {
        if (Boolean(a.mainRunway) !== Boolean(b.mainRunway)) return a.mainRunway ? -1 : 1
        return (b.lengthM ?? 0) - (a.lengthM ?? 0)
    })[0]!
}

// --- Synthesised broadcast ---------------------------------------------------

export interface SyntheticAtisInput {
    airportName?: string
    letter: string
    observation?: MetarObservation | null
    runwayDep?: string | null
    runwayArr?: string | null
}

/**
 * Build an ATIS broadcast from a METAR, shaped like a real one.
 *
 * The METAR weather groups are deliberately left coded: `normalizeAtisForSpeech`
 * in `radioSpeech.ts` already expands `24016KT`, `26/13` and `Q1006` into spoken
 * form, so re-implementing that here would only add a second thing to maintain.
 */
export function buildSyntheticAtisText(input: SyntheticAtisInput): string {
    const { airportName, letter, observation, runwayDep, runwayArr } = input
    const parts: string[] = []

    if (airportName) parts.push(airportName)
    parts.push(`INFORMATION ${letter}`)

    if (observation?.observedAt) {
        const { hour, minute } = observation.observedAt
        parts.push(`MET REPORT TIME ${pad2(hour)}${pad2(minute)}`)
    }

    if (runwayDep && runwayArr && runwayDep === runwayArr) {
        parts.push(`RUNWAY ${runwayDep} IN USE`)
    } else {
        if (runwayArr) parts.push(`EXPECT APPROACH RUNWAY ${runwayArr}`)
        if (runwayDep) parts.push(`DEPARTURE RUNWAY ${runwayDep}`)
    }

    if (observation?.body) parts.push(observation.body)

    parts.push(`INFORMATION ${letter} OUT`)

    return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function pad2(value: number): string {
    return String(value).padStart(2, '0')
}

// --- Resolver ----------------------------------------------------------------

/** Arrival/departure variant from the VATSIM callsign (EDDF_A_ATIS / EDDF_D_ATIS). */
function stationVariant(callsign: string | undefined): 'arrival' | 'departure' | null {
    const normalized = (callsign || '').toUpperCase()
    if (normalized.includes('_A_')) return 'arrival'
    if (normalized.includes('_D_')) return 'departure'
    return null
}

/**
 * Resolve one ATIS report from whatever the live sources returned.
 *
 * VATSIM wins when a station is broadcasting text. Otherwise the report is
 * synthesised from the METAR, and if there is no METAR either it still carries
 * a letter and a runway so the session stays consistent.
 */
export function resolveAtisReport(input: ResolveAtisInput): AtisReport {
    const icao = (input.icao || '').toUpperCase()
    const now = input.now ?? new Date()
    const runways = input.runways ?? []
    const observation = input.metar ? parseMetar(input.metar) : null

    const liveStations: AtisStation[] = (input.vatsimStations ?? [])
        .filter(station => (station.text || '').trim())
        .map(station => {
            const text = station.text!.trim()
            return {
                frequency: station.frequency || input.atisFrequency || FREQUENCY_UNKNOWN,
                callsign: station.callsign,
                variant: stationVariant(station.callsign),
                letter: (station.atisCode || '').trim().toUpperCase() || parseAtisLetter(text),
                text,
                lastUpdated: station.lastUpdated,
            }
        })

    const observedAt = observation ? observedAtIso(observation, now) : null

    if (liveStations.length) {
        const letterFor = (kind: 'dep' | 'arr'): string | null => {
            const wanted = kind === 'dep' ? 'departure' : 'arrival'
            return liveStations.find(s => s.variant === wanted)?.letter
                ?? liveStations.find(s => s.letter)?.letter
                ?? null
        }
        const letter = letterFor('dep') ?? deriveInfoLetter(observation?.observedAt ?? now)

        const runway = (kind: 'dep' | 'arr') => {
            const wanted = kind === 'dep' ? 'departure' : 'arrival'
            const matching = liveStations.filter(s => s.variant === wanted)
            const texts = (matching.length ? matching : liveStations).map(s => s.text)
            return extractRunwayFromAtisText(texts, kind)
        }

        const fromText = { dep: runway('dep'), arr: runway('arr') }
        const wind = observation ?? { windDeg: null, windKt: null, windVariable: false }
        const byWind = {
            dep: fromText.dep ? null : selectRunwayInUse(runways, wind, 'dep'),
            arr: fromText.arr ? null : selectRunwayInUse(runways, wind, 'arr'),
        }

        return {
            icao,
            source: 'vatsim',
            letter,
            letterDep: letterFor('dep') ?? letter,
            letterArr: letterFor('arr') ?? letter,
            runwayDep: fromText.dep ?? byWind.dep?.designator ?? null,
            runwayArr: fromText.arr ?? byWind.arr?.designator ?? null,
            runwaySource: fromText.dep || fromText.arr
                ? 'atis'
                : byWind.dep?.source ?? byWind.arr?.source ?? null,
            qnhHpa: observation?.qnhHpa ?? null,
            surfaceWind: formatSurfaceWind(observation),
            observedAt,
            stations: liveStations,
        }
    }

    // No live broadcast — synthesise one so the pilot still gets a letter and a
    // runway. Keep the real ATIS frequency and callsign if VATSIM listed a
    // station that simply had no text attached.
    const silentStation = (input.vatsimStations ?? [])[0]
    const wind = observation ?? { windDeg: null, windKt: null, windVariable: false }
    const dep = selectRunwayInUse(runways, wind, 'dep')
    const arr = selectRunwayInUse(runways, wind, 'arr')
    const letter = deriveInfoLetter(observation?.observedAt ?? now)

    const text = buildSyntheticAtisText({
        airportName: input.airportName,
        letter,
        observation,
        runwayDep: dep?.designator ?? null,
        runwayArr: arr?.designator ?? null,
    })

    return {
        icao,
        source: observation ? 'metar' : 'fallback',
        letter,
        letterDep: letter,
        letterArr: letter,
        runwayDep: dep?.designator ?? null,
        runwayArr: arr?.designator ?? null,
        runwaySource: dep?.source ?? arr?.source ?? null,
        qnhHpa: observation?.qnhHpa ?? null,
        surfaceWind: formatSurfaceWind(observation),
        observedAt,
        stations: [{
            frequency: silentStation?.frequency || input.atisFrequency || FREQUENCY_UNKNOWN,
            callsign: silentStation?.callsign,
            variant: stationVariant(silentStation?.callsign),
            letter,
            text,
        }],
    }
}

/** Surface wind in the "260/14" form the flows use, or null when unobserved. */
function formatSurfaceWind(observation: MetarObservation | null): string | null {
    if (!observation || observation.windKt === null) return null
    const direction = observation.windVariable
        ? 'VRB'
        : observation.windDeg === null ? null : pad3(observation.windDeg)
    if (direction === null) return null
    return `${direction}/${pad2(observation.windKt)}`
}

function pad3(value: number): string {
    return String(value).padStart(3, '0')
}

/**
 * Absolute time for a METAR day-of-month stamp, resolved against `now`.
 * A report near a month boundary belongs to the previous month.
 */
function observedAtIso(observation: MetarObservation, now: Date): string | null {
    const at = observation.observedAt
    if (!at) return null
    const candidate = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), at.day, at.hour, at.minute, 0, 0))
    if (candidate.getTime() - now.getTime() > 12 * 60 * 60 * 1000) {
        candidate.setUTCMonth(candidate.getUTCMonth() - 1)
    }
    return candidate.toISOString()
}
