/**
 * German aircraft registrations (D-…).
 *
 * The letter after "D-" is not decorative: LuftVZO Anlage 1 assigns it by
 * weight and type class, so a registration has to match the aircraft. D-E is
 * reserved for single-engine pistons up to 2 t — an A320 wearing one is as
 * wrong as an airliner with a glider's callsign.
 *
 *   D-A…  above 20 t (airliners)
 *   D-I…  multi-engine piston, 2–5.7 t
 *   D-E…  single-engine piston, up to 2 t
 *   D-H…  helicopters
 */

export type RegistrationPrefix = 'A' | 'I' | 'E' | 'H'

/** ICAO type designators that are not light singles, by registration class. */
const TYPES_BY_PREFIX: Record<Exclude<RegistrationPrefix, 'E'>, ReadonlySet<string>> = {
    A: new Set([
        // Narrowbody / widebody / regional jets — all comfortably above 20 t.
        'A318', 'A319', 'A320', 'A321', 'A20N', 'A21N',
        'A332', 'A333', 'A339', 'A342', 'A343', 'A345', 'A346',
        'A359', 'A35K', 'A388',
        'B733', 'B734', 'B735', 'B736', 'B737', 'B738', 'B739',
        'B37M', 'B38M', 'B39M',
        'B752', 'B753', 'B762', 'B763', 'B764',
        'B772', 'B773', 'B77L', 'B77W', 'B788', 'B789', 'B78X',
        'B742', 'B744', 'B748',
        'E170', 'E175', 'E190', 'E195', 'E290', 'E295',
        'CRJ2', 'CRJ7', 'CRJ9', 'CRJX',
        'AT72', 'AT76', 'DH8D', 'BCS1', 'BCS3', 'SU95',
    ]),
    I: new Set([
        // Multi-engine pistons in the 2–5.7 t band.
        'BE58', 'BE55', 'BE76', 'BE60', 'BE95',
        'PA34', 'PA31', 'PA44', 'PA23',
        'C310', 'C320', 'C337', 'C340', 'C402', 'C404', 'C414', 'C421',
        'DA62', 'P68', 'AC11', 'AC50',
    ]),
    H: new Set([
        'R22', 'R44', 'R66', 'EC20', 'EC30', 'EC35', 'EC45', 'EC55',
        'H125', 'H130', 'H135', 'H145', 'AS50', 'AS55', 'AS65',
        'B06', 'B06T', 'B407', 'B429', 'S76', 'A109', 'A139', 'MD90',
    ]),
}

/**
 * Pools of pronounceable registrations per class. Real German registrations
 * read as words on the radio, which matters because these are spoken by TTS
 * and transcribed back from the pilot.
 */
const REGISTRATION_POOLS: Record<RegistrationPrefix, readonly string[]> = {
    A: ['D-AIZA', 'D-AIBL', 'D-ABYT', 'D-AIMA', 'D-AINK', 'D-ABKM', 'D-AIDF', 'D-ACNL'],
    I: ['D-IBSL', 'D-IAAB', 'D-IHAG', 'D-IFOX', 'D-IKMR', 'D-IWAL'],
    E: ['D-EMIL', 'D-EKLM', 'D-ENNY', 'D-ELLA', 'D-EOMT', 'D-ELPC', 'D-EMTO', 'D-EBRA'],
    H: ['D-HAFH', 'D-HBKD', 'D-HELI', 'D-HMUC', 'D-HAXE', 'D-HRTG'],
}

/**
 * Registration class letter for an ICAO type designator.
 *
 * Unknown types fall back to the light-single class: these registrations are
 * assigned in VFR scenarios, which are overwhelmingly light aircraft.
 */
export function germanRegistrationPrefix(aircraftType: string): RegistrationPrefix {
    // Flight plans carry things like "A320/M" or "C172 " — keep the designator.
    const type = (aircraftType || '').trim().toUpperCase().split(/[/\s-]/)[0] || ''
    if (!type) return 'E'

    for (const prefix of ['A', 'I', 'H'] as const) {
        if (TYPES_BY_PREFIX[prefix].has(type)) return prefix
    }
    return 'E'
}

export interface GermanRegistration {
    /** Full registration, e.g. "D-EMIL". */
    registration: string
    /** Abbreviated form German ATC uses after first contact, e.g. "D-IL". */
    short: string
}

/** A registration whose class matches the aircraft type. */
export function generateGermanRegistration(aircraftType: string): GermanRegistration {
    const pool = REGISTRATION_POOLS[germanRegistrationPrefix(aircraftType)]
    const registration = pool[Math.floor(Math.random() * pool.length)]!
    // ATC abbreviates to the first character and the last two: D-EMIL → D-IL.
    return { registration, short: `D-${registration.slice(-2)}` }
}
