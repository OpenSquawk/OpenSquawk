export const ICAO_DIGITS: Record<string, string> = {
    '0': 'zero',
    '1': 'wun',
    '2': 'too',
    '3': 'tree',
    '4': 'four',
    '5': 'fife',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'niner',
};

export const ICAO_LETTERS: Record<string, string> = {
    A: 'Alfa',
    B: 'Bravo',
    C: 'Charlie',
    D: 'Delta',
    E: 'Echo',
    F: 'Foxtrot',
    G: 'Golf',
    H: 'Hotel',
    I: 'India',
    J: 'Juliett',
    K: 'Kilo',
    L: 'Lima',
    M: 'Mike',
    N: 'November',
    O: 'Oscar',
    P: 'Papa',
    Q: 'Quebec',
    R: 'Romeo',
    S: 'Sierra',
    T: 'Tango',
    U: 'Uniform',
    V: 'Victor',
    W: 'Whiskey',
    X: 'X-ray',
    Y: 'Yankee',
    Z: 'Zulu',
};

export type AirlineTelephonyMap = Record<string, string>;

export const DEFAULT_AIRLINE_TELEPHONY: AirlineTelephonyMap = {
    DLH: "Lufthansa",
    EWG: "Eurowings",
    THY: "Turkish",
    JBU: "JetBlue",
    NAX: "Norwegian",
    SWR: "Swiss",
    BAW: "Speedbird",
    AFR: "Air France",
    KLM: "KLM",
    AAL: "American",
    UAL: "United",
    DAL: "Delta",
    RYR: "Ryanair",
    EZY: "Easy",
};

const METAR_WEATHER: Record<string, string> = {
    '+TSRA': 'thunderstorm with heavy rain', 'TSRA': 'thunderstorm with rain',
    '+SHRA': 'heavy rain showers', '-SHRA': 'light rain showers', 'SHRA': 'rain showers',
    '+RA': 'heavy rain', '-RA': 'light rain', 'RA': 'rain',
    '+SN': 'heavy snow', '-SN': 'light snow', 'SN': 'snow',
    '+DZ': 'heavy drizzle', '-DZ': 'light drizzle', 'DZ': 'drizzle',
    'FG': 'fog', 'BR': 'mist', 'HZ': 'haze',
    'TS': 'thunderstorm', 'SH': 'showers', 'FZ': 'freezing',
    'GR': 'hail', 'GS': 'small hail',
};

// METAR weather code components (intensity / descriptor / precipitation / obscuration / other)
// used by the inline weather-token parser. Source: WMO Code Form FM 15-XV / ICAO Annex 3.
const WX_INTENSITY: Record<string, string> = {
    '-': 'light', '+': 'heavy', 'VC': 'in the vicinity',
};
const WX_DESCRIPTOR: Record<string, string> = {
    MI: 'shallow', BC: 'patches', DR: 'low drifting', BL: 'blowing',
    SH: 'shower', TS: 'thunderstorm', FZ: 'freezing', PR: 'partial',
};
const WX_PHENOMENON: Record<string, string> = {
    // Precipitation
    DZ: 'drizzle', RA: 'rain', SN: 'snow', SG: 'snow grains',
    IC: 'ice crystals', PL: 'ice pellets', GR: 'hail', GS: 'small hail',
    UP: 'unknown precipitation',
    // Obscuration
    BR: 'mist', FG: 'fog', FU: 'smoke', VA: 'volcanic ash',
    DU: 'widespread dust', SA: 'sand', HZ: 'haze',
    // Other
    PO: 'dust devils', SQ: 'squall', FC: 'funnel cloud',
    SS: 'sandstorm', DS: 'duststorm',
};

const METAR_CLOUD: Record<string, string> = {
    'FEW': 'few', 'SCT': 'scattered', 'BKN': 'broken', 'OVC': 'overcast',
};

// Uppercase ATC/English tokens of 5-6 chars that must NOT be spelled phonetically
// when `expandWaypoints` is active. Waypoints (SUGOL, UNOKO, ANEKI, ...) are not in this set.
const WAYPOINT_SKIP: Set<string> = new Set([
    'MAYDAY', 'PANPAN', 'CLEAR', 'CHECK', 'RIGHT', 'LIGHT', 'EIGHT', 'THREE',
    'SEVEN', 'NINER', 'AFTER', 'BEFORE', 'CROSS', 'SHORT', 'ABEAM',
    'BELOW', 'ABOVE', 'TOWER', 'GROUND', 'APRON', 'RAMP',
    'NORTH', 'SOUTH', 'WINDS', 'GUSTS', 'HEAVY',
    'WHEN', 'WITH', 'YOUR', 'THEN', 'THIS', 'THAT', 'WILL', 'OVER',
    'TAXI', 'STAND', 'PUSH', 'START', 'INTO', 'FROM', 'ONTO', 'GATE',
    'FINAL', 'TURN', 'CLIMB', 'DESCEND', 'MAINTAIN', 'CONTACT',
    'SQUAWK', 'IDENT', 'ROGER', 'WILCO', 'AFFIRM', 'NEGATIVE', 'STANDBY',
    'INBOUND', 'OUTBOUND', 'APPROACH', 'DEPARTURE', 'ARRIVAL', 'CLEARED',
    'EXPECT', 'REPORT', 'REQUEST', 'CONFIRM', 'PROCEED', 'CONTINUE',
    'DIRECT', 'VECTOR', 'HEADING', 'COURSE', 'INTERCEPT', 'ESTABLISHED',
    'RUNWAY', 'ACTIVE', 'CLOSED', 'LOOSE', 'BEHIND',
    'LANDING', 'TAKEOFF', 'HOLDING',
    'INDIA', 'ALPHA', 'BRAVO', 'DELTA', 'JULIET', 'OSCAR',
    'ROMEO', 'SIERRA', 'TANGO', 'VICTOR', 'YANKEE',
    'FOXTROT', 'WHISKEY',
]);

export interface NormalizeRadioOptions {
    airlineMap?: AirlineTelephonyMap;
    expandCallsigns?: boolean;
    expandAirports?: boolean;
    sidSuffixIcao?: boolean;
    expandWaypoints?: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<NormalizeRadioOptions, 'airlineMap'>> = {
    expandAirports: false,
    expandCallsigns: false,
    sidSuffixIcao: true,
    expandWaypoints: true,
};

export function spellIcaoDigits(value: string, separator = ' '): string {
    const trimmed = `${value}`.replace(/\s+/g, '');
    if (!trimmed) return '';
    return trimmed
        .split('')
        .map((ch) => ICAO_DIGITS[ch] ?? ch)
        .join(separator)
        .trim();
}

export function spellIcaoLetters(value: string, separator = ' '): string {
    const trimmed = `${value}`.replace(/\s+/g, '');
    if (!trimmed) return '';
    return trimmed
        .toUpperCase()
        .split('')
        .map((ch) => ICAO_LETTERS[ch] ?? ch)
        .join(separator)
        .trim();
}

export function toIcaoPhonetic(value: string, separator = ' '): string {
    const trimmed = `${value}`.replace(/\s+/g, '');
    if (!trimmed) return '';
    return trimmed
        .toUpperCase()
        .split('')
        .map((ch) => ICAO_LETTERS[ch] ?? ICAO_DIGITS[ch] ?? ch)
        .join(separator)
        .trim();
}

function runwaySpeak(raw: string): string {
    const match = raw.match(/^(\d{2})([LCR])?$/i);
    if (!match) return raw;
    const digits = spellIcaoDigits(match[1]);
    const side = match[2]?.toUpperCase();
    const suffix = side === 'L' ? 'left' : side === 'R' ? 'right' : side === 'C' ? 'center' : '';
    return `runway ${digits}${suffix ? ` ${suffix}` : ''}`;
}

function headingSpeak(raw: string): string {
    const heading = raw.padStart(3, '0');
    return `heading ${spellIcaoDigits(heading)}`;
}

function squawkSpeak(raw: string): string {
    return `squawk ${spellIcaoDigits(raw)}`;
}

function freqSpeak(raw: string): string {
    const [left, right] = raw.split('.') as [string, string?];
    const leftSpoken = spellIcaoDigits(left);
    if (!right) return leftSpoken;
    const rightSpoken = spellIcaoDigits(right);
    return `${leftSpoken} decimal ${rightSpoken}`;
}

const VIA_TAXI_ROUTE_PATTERN = /\b((?:expect\s+taxi\s+)?via\s+)([A-Z0-9\s/\-]+?)(?=(?:,|\s+(?:hold short|cross|then|contact|monitor|with|for|to|left|right)\b|\.)|$)/gi;

const TAXI_ROUTE_LABEL_PATTERN = /\b(taxi(?:-?in)?\s+route[:\s]+)([A-Z0-9\s/\-]+?)(?=(?:,|\s+(?:hold short|cross|then|contact|monitor|with|for|to|left|right)\b|\.)|$)/gi;

const STAND_ROUTE_PATTERN = /\b(taxi\s+to\s+stand\s+[A-Z0-9]+\s+via\s+)([A-Z0-9\s/\-]+?)(?=(?:,|\s+(?:hold short|cross|then|contact|monitor|with|for|to|left|right)\b|\.)|$)/gi;

const TAXI_SEGMENT_SINGLE = /^[A-Z]{1,2}$/;
const TAXI_SEGMENT_WITH_DIGITS = /^[A-Z]{1,3}\d{1,3}$/;

const TAXI_ROUTE_SEPARATOR = /[-/]/g;

function shouldConvertTaxiSegment(value: string): boolean {
    if (!value) return false;
    const upper = value.toUpperCase();
    if (!/[A-Z]/.test(upper)) return false;
    if (TAXI_SEGMENT_SINGLE.test(upper)) return true;
    if (TAXI_SEGMENT_WITH_DIGITS.test(upper)) return true;
    return false;
}

function speakTaxiSegment(segment: string): string {
    const trimmed = segment.trim();
    if (!trimmed) return '';
    const cleaned = trimmed.replace(/[^A-Za-z0-9\-/]/g, '');
    if (!cleaned) return trimmed;
    const expanded = cleaned.replace(TAXI_ROUTE_SEPARATOR, (match) => (match === '-' ? ' dash ' : ' slash '));
    const tokens = expanded.split(/\s+/).filter(Boolean);
    const spoken = tokens.map((token) => {
        if (token === 'dash' || token === 'slash') return token;
        const upper = token.toUpperCase();
        if (!shouldConvertTaxiSegment(upper)) {
            return token;
        }
        return toIcaoPhonetic(upper);
    });
    return spoken.join(' ');
}

function speakTaxiRoute(route: string): string {
    const tokens = route.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return route.trim();
    const spokenTokens = tokens.map(token => speakTaxiSegment(token) || token);
    return spokenTokens.join(', ');
}

function applyTaxiRoutePhonetics(text: string): string {
    const replacer = (_match: string, prefix: string, rawRoute: string) => {
        const route = rawRoute.trim();
        if (!route) return `${prefix}${rawRoute}`;
        const spoken = speakTaxiRoute(route);
        if (!spoken) return `${prefix}${rawRoute}`;
        const needsSpace = /\s$/.test(prefix) ? '' : ' ';
        return `${prefix}${needsSpace}${spoken}`.replace(/\s+/g, ' ');
    };

    let out = text.replace(VIA_TAXI_ROUTE_PATTERN, replacer);
    out = out.replace(TAXI_ROUTE_LABEL_PATTERN, replacer);
    out = out.replace(STAND_ROUTE_PATTERN, replacer);
    return out;
}

const HUNDRED_WORDS: Record<number, string> = {
    100: 'wun hundred',
    200: 'too hundred',
    300: 'tree hundred',
    400: 'four hundred',
    500: 'five hundred',
    600: 'six hundred',
    700: 'seven hundred',
    800: 'eight hundred',
    900: 'nine hundred',
};

function altitudeSpeak(value: number): string {
    if (!Number.isFinite(value)) return `${value} feet`;
    const thousands = Math.floor(value / 1000);
    const hundreds = Math.round((value % 1000) / 100) * 100;

    const parts: string[] = [];
    if (thousands) {
        parts.push(`${spellIcaoDigits(String(thousands))} thousand`);
    }
    if (hundreds) {
        parts.push(HUNDRED_WORDS[hundreds] ?? spellIcaoDigits(String(hundreds)));
    }

    const spoken = parts.join(' ').trim();
    return spoken ? `${spoken} feet` : 'feet';
}

function flightLevelSpeak(raw: string): string {
    const digits = raw.replace(/^0+/, '') || '0';
    return `flight level ${spellIcaoDigits(digits)}`;
}

function qnhSpeak(raw: string): string {
    return `QNH ${spellIcaoDigits(raw)}`;
}

function callsignSpeak(raw: string, map: AirlineTelephonyMap): string {
    const upper = raw.toUpperCase();
    const match = upper.match(/^([A-Z]{2,3})(\d{1,4})([A-Z])?$/);
    if (!match) return raw;
    const [, prefix, digitsPart, suffixLetter] = match;
    const telephony = map[prefix] ?? spellIcaoLetters(prefix);
    const digitsSpoken = spellIcaoDigits(digitsPart);
    const suffix = suffixLetter ? ` ${spellIcaoLetters(suffixLetter)}` : '';
    return `${telephony} ${digitsSpoken}${suffix}`.trim();
}

function icaoAirportSpeak(raw: string): string {
    return /^[A-Z]{4}$/.test(raw) ? spellIcaoLetters(raw) : raw;
}

function sidSuffixSpeak(prefix: string, digit: string, letter: string): string {
    return `${toIcaoPhonetic(prefix)} ${spellIcaoDigits(digit)} ${spellIcaoLetters(letter)}`;
}

function approachSpeak(type: string, runway: string, suffix: string): string {
    const rw = runwaySpeak(runway);
    const phonetic = ICAO_LETTERS[suffix.toUpperCase()] ?? suffix;
    return `${type} ${rw} ${phonetic}`;
}

export function normalizeMetarPhrase(metar: string): string {
    const parts: string[] = [];

    // Wind: 28015KT or 28015G25KT or VRB05KT
    const windMatch = metar.match(/\b(VRB|\d{3})(\d{2,3})(G(\d{2,3}))?KT\b/);
    if (windMatch) {
        const dir = windMatch[1] === 'VRB' ? 'variable' : `${spellIcaoDigits(windMatch[1]!)} degrees`;
        const speed = spellIcaoDigits(windMatch[2]!);
        let windPart = `wind ${dir}, ${speed} knots`;
        if (windMatch[4]) {
            windPart += `, gusting ${spellIcaoDigits(windMatch[4])} knots`;
        }
        parts.push(windPart);
    }

    // Visibility: 9999, 0800, CAVOK
    if (metar.includes('CAVOK')) {
        parts.push('CAVOK');
    } else {
        const visMatch = metar.match(/(?<!\d)\b(\d{4})\b(?!Z|KT)/);
        if (visMatch) {
            const vis = parseInt(visMatch[1]!);
            if (vis >= 9999) {
                parts.push(`visibility, ${spellIcaoDigits('1')} ${spellIcaoDigits('0')} kilometers or more`);
            } else {
                parts.push(`visibility, ${spellIcaoDigits(vis.toString())} meters`);
            }
        }
    }

    // Weather phenomena (match longest codes first)
    const wxPatterns = Object.keys(METAR_WEATHER).sort((a, b) => b.length - a.length);
    for (const wx of wxPatterns) {
        if (new RegExp(`\\b${wx.replace('+', '\\+')}\\b`).test(metar) || metar.includes(` ${wx} `)) {
            const spoken = METAR_WEATHER[wx];
            if (spoken) parts.push(spoken);
            break;
        }
    }

    // Clouds: BKN025, SCT040, FEW010, OVC008
    const cloudRegex = /\b(FEW|SCT|BKN|OVC)(\d{3})\b/g;
    let cloudMatch;
    while ((cloudMatch = cloudRegex.exec(metar)) !== null) {
        const cover = METAR_CLOUD[cloudMatch[1]!] ?? cloudMatch[1];
        const alt = parseInt(cloudMatch[2]!) * 100;
        parts.push(`${cover}, ${altitudeSpeak(alt)}`);
    }

    // Temperature: 15/08 or M02/M05
    const tempMatch = metar.match(/\b(M?\d{2})\/(M?\d{2})\b/);
    if (tempMatch) {
        const speakTemp = (raw: string) => {
            if (raw.startsWith('M')) {
                return `minus ${spellIcaoDigits(raw.slice(1))}`;
            }
            return spellIcaoDigits(raw);
        };
        parts.push(`temperature ${speakTemp(tempMatch[1]!)}, dew point ${speakTemp(tempMatch[2]!)}`);
    }

    // QNH: Q1013
    const qnhMatch = metar.match(/\bQ(\d{4})\b/);
    if (qnhMatch) {
        parts.push(qnhSpeak(qnhMatch[1]!));
    }

    if (!parts.length) return metar;
    return parts.join(', ');
}

/**
 * Cloud-layer height words (no trailing "feet"): 30 → "tree thousand", 5 → "five hundred",
 * 35 → "tree thousand five hundred". Input is the 3-digit METAR-cloud code interpreted
 * as hundreds-of-feet.
 */
function cloudHeightWords(heightCodeHundreds: number): string {
    const feet = heightCodeHundreds * 100;
    const thousands = Math.floor(feet / 1000);
    const hundreds = Math.round((feet % 1000) / 100) * 100;
    const parts: string[] = [];
    if (thousands) parts.push(`${spellIcaoDigits(String(thousands))} thousand`);
    if (hundreds) parts.push(HUNDRED_WORDS[hundreds] ?? spellIcaoDigits(String(hundreds)));
    return parts.join(' ').trim() || spellIcaoDigits(String(feet));
}

function spellWeatherCode(code: string): string | null {
    let remaining = code;
    let intensity = '';
    // Strip intensity prefix
    const intensityMatch = remaining.match(/^(VC|\+|-)(.+)$/);
    if (intensityMatch) {
        intensity = WX_INTENSITY[intensityMatch[1]!] ?? '';
        remaining = intensityMatch[2]!;
    }
    // Walk through the remaining string in 2-char chunks
    const parts: string[] = [];
    let i = 0;
    while (i < remaining.length) {
        const chunk = remaining.slice(i, i + 2);
        const descr = WX_DESCRIPTOR[chunk];
        const phen = WX_PHENOMENON[chunk];
        if (!descr && !phen) {
            return null; // unrecognized — bail
        }
        parts.push(descr ?? phen!);
        i += 2;
    }
    if (i !== remaining.length || parts.length === 0) return null;
    return [intensity, ...parts].filter(Boolean).join(' ');
}

interface NormalizeAtisOptions {
    /** Current airport ICAO — its 4-letter code in the text is substituted with airportName. */
    airportIcao?: string;
    /** Display name for the current airport (e.g. "Frankfurt am Main"). */
    airportName?: string;
}

/**
 * Normalize ATIS text (expanded VATSIM form OR compressed METAR form) into ICAO
 * radiotelephony spoken form. Handles:
 *   - ICAO airport-code substitution (with caller-provided name)
 *   - METAR inline tokens (date/time, wind, RVR, weather, clouds, pressure, trends)
 *   - Expanded ATIS rules (info letter, wind/temp/time digit-by-digit, NOSIG, ...)
 *   - General radio phrases via normalizeRadioPhrase (QNH/RWY/FL/freq)
 *   - Acronym lowercasing (ATIS/METAR/SPECI) so TTS reads them as words
 */
export function normalizeAtisForSpeech(text: string, opts: NormalizeAtisOptions = {}): string {
    if (!text) return text;
    let out = text.replace(/\s+/g, ' ').trim();

    // 1. Airport-code substitution. Done before METAR expansion so a station code
    //    like "EDDF" before a "281050Z" date stamp is replaced with "Frankfurt".
    if (opts.airportIcao && opts.airportName) {
        const icaoRe = new RegExp(`\\b${opts.airportIcao.toUpperCase()}\\b`, 'g');
        out = out.replace(icaoRe, opts.airportName);
    }

    // 2. METAR-coded inline tokens.

    // Date/Time: DDHHMMZ (e.g. "281050Z" → "on the too eight at wun zero five zero zulu")
    out = out.replace(/\b(\d{2})(\d{2})(\d{2})Z\b/g, (_m, d: string, h: string, mi: string) =>
        `on the ${spellIcaoDigits(d)} at ${spellIcaoDigits(h)} ${spellIcaoDigits(mi)} zulu`);

    // Modifier
    out = out.replace(/\bAUTO\b/g, 'automatic observation');
    out = out.replace(/\bCOR\b/g, 'correction');

    // Wind variability "320V070" → "variable between three two zero and zero seven zero degrees"
    // (must run BEFORE wind regex so it doesn't get confused by the surrounding digits)
    out = out.replace(/\b(\d{3})V(\d{3})\b/g, (_m, a: string, b: string) =>
        `variable between ${spellIcaoDigits(a)} and ${spellIcaoDigits(b)} degrees`);

    // Calm wind: 00000KT
    out = out.replace(/\b00000KT\b/g, 'wind calm');

    // Wind: VRB05KT / 28015KT / 28015G25KT
    out = out.replace(/\b(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT\b/g,
        (_m, dir: string, spd: string, gust?: string) => {
            const dirSpeech = dir === 'VRB' ? 'variable' : `${spellIcaoDigits(dir)} degrees`;
            const spdSpeech = `${spellIcaoDigits(spd)} knots`;
            const gustSpeech = gust ? `, gusting ${spellIcaoDigits(gust)} knots` : '';
            return `wind ${dirSpeech} at ${spdSpeech}${gustSpeech}`;
        });

    // Runway Visual Range: R25/1500N, R25L/P2000, R25/M0050U
    out = out.replace(/\bR(\d{2}[LCR]?)\/([MP]?)(\d{4})([UDN]?)\b/g,
        (_m, rwy: string, mp: string, dist: string, trend: string) => {
            const rwSpoken = runwaySpeak(rwy);
            const prefix = mp === 'M' ? 'less than ' : mp === 'P' ? 'more than ' : '';
            const trendWord = trend === 'U' ? ', increasing' : trend === 'D' ? ', decreasing' : '';
            return `${rwSpoken} visibility ${prefix}${spellIcaoDigits(dist)} meters${trendWord}`;
        });

    // Wind shear: WS R25L
    out = out.replace(/\bWS\s+R(\d{2}[LCR]?)\b/g, (_m, rwy: string) => `wind shear ${runwaySpeak(rwy)}`);

    // Visibility 9999 (≥10 km)
    out = out.replace(/\b9999\b/g, 'visibility wun zero kilometers or more');

    // METAR temp/dewpoint with slash: "24/02" or "M02/M05" or "02/M01"
    out = out.replace(/\b(M?\d{2})\/(M?\d{2})\b/g, (_m, t: string, d: string) => {
        const speakTemp = (raw: string) => raw.startsWith('M')
            ? `minus ${spellIcaoDigits(raw.slice(1))}`
            : spellIcaoDigits(raw);
        return `temperature ${speakTemp(t)}, dewpoint ${speakTemp(d)}`;
    });

    // QNH: Q1025 (hPa)
    out = out.replace(/\bQ(\d{4})\b/g, (_m, q: string) => `QNH ${spellIcaoDigits(q)}`);
    // Altimeter: A2992 (inches Hg, US-style)
    out = out.replace(/\bA(\d{4})\b/g, (_m, a: string) => `altimeter ${spellIcaoDigits(a)}`);

    // Cloud cover special codes
    out = out.replace(/\bNSC\b/g, 'no significant cloud');
    out = out.replace(/\bSKC\b/g, 'sky clear');
    out = out.replace(/\bCLR\b/g, 'sky clear');
    out = out.replace(/\bNCD\b/g, 'no cloud detected');
    // Vertical visibility VV003 → "vertical visibility three hundred feet"
    out = out.replace(/\bVV(\d{3})\b/g, (_m, h: string) => {
        const ft = parseInt(h, 10) * 100;
        const thousands = Math.floor(ft / 1000);
        const hundreds = Math.round((ft % 1000) / 100) * 100;
        const parts: string[] = [];
        if (thousands) parts.push(`${spellIcaoDigits(String(thousands))} thousand`);
        if (hundreds) parts.push(HUNDRED_WORDS[hundreds] ?? spellIcaoDigits(String(hundreds)));
        return `vertical visibility ${parts.join(' ').trim()} feet`;
    });

    // Recent weather: REtype (e.g. RERA → "recent rain")
    out = out.replace(/\bRE([A-Z]{2,8})\b/g, (m, code: string) => {
        const spoken = spellWeatherCode(code);
        return spoken ? `recent ${spoken}` : m;
    });

    // Weather phenomena (intensity + descriptor + 1-2 codes). Match conservative:
    // optional intensity prefix, then 2-8 uppercase letters.
    out = out.replace(/(?:^|\s)([+\-]|VC)?([A-Z]{2,8})(?=\s|$)/g, (match, intensity: string | undefined, code: string) => {
        // Skip if it's a known non-weather token. We're greedy; let unknown codes pass.
        const full = `${intensity ?? ''}${code}`;
        const spoken = spellWeatherCode(full);
        if (!spoken) return match;
        // Don't accidentally swallow words like "DEW", "POINT", "WIND" — must look like a weather code (2-char chunks)
        if (code.length % 2 !== 0) return match;
        return match.replace(full, spoken);
    });

    // Trend forecasts
    out = out.replace(/\bNOSIG\b/g, 'no significant change');
    out = out.replace(/\bBECMG\b/g, 'becoming');
    out = out.replace(/\bTEMPO\b/g, 'temporary');
    // Trend time: FM1230 / TL1500 / AT1100
    out = out.replace(/\b(FM|TL|AT)(\d{2})(\d{2})\b/g, (_m, prefix: string, h: string, mi: string) => {
        const word = prefix === 'FM' ? 'from' : prefix === 'TL' ? 'until' : 'at';
        return `${word} ${spellIcaoDigits(h)} ${spellIcaoDigits(mi)} zulu`;
    });

    // Strip RMK section (remarks — operator notes, not for pilots)
    out = out.replace(/\bRMK\b.*$/g, '').trim();

    // 3. Run the general radio normalizer so RUNWAY/QNH/FL/HDG/freq (digits still
    //    intact in expanded ATIS text) get spoken correctly. Order matters:
    //    this runs BEFORE our bare-runway rule so the explicit RUNWAY prefix is
    //    consumed before bare designators get rewritten.
    out = normalizeRadioPhrase(out, {
        expandAirports: false,
        expandCallsigns: false,
        expandWaypoints: false,
    });

    // 4. Expanded-ATIS rules. INFORMATION letter → phonetic alphabet
    out = out.replace(/\binformation\s+([A-Z])\b/gi, (_match, l: string) => {
        const phonetic = ICAO_LETTERS[l.toUpperCase()] ?? l;
        return `Information ${phonetic}`;
    });

    // Time HHMM (TIME 0620, AT 0620Z)
    out = out.replace(/\b(time|at)\s+(\d{4})z?\b/gi, (_m, prefix: string, t: string) =>
        `${prefix.toLowerCase()} ${spellIcaoDigits(t)}`);

    // Wind direction (3 digits, optionally followed by DEGREES)
    out = out.replace(/\bwind\s+(\d{3})(?=\s+(?:degrees?\b|\d))/gi, (_m, d: string) =>
        `wind ${spellIcaoDigits(d)}`);

    // Wind variability ranges: "BETWEEN 340 AND 060 DEGREES"
    out = out.replace(/\bbetween\s+(\d{3})\s+and\s+(\d{3})\s+degrees\b/gi,
        (_m, a: string, b: string) =>
            `between ${spellIcaoDigits(a)} and ${spellIcaoDigits(b)} degrees`);

    // Wind/gust speed in knots (digit-by-digit per ICAO)
    out = out.replace(/\b(\d{1,3})\s*(knots?|kt)\b/gi, (_m, n: string) =>
        `${spellIcaoDigits(n)} knots`);

    // Negative temperature: "TEMPERATURE -5" or "TEMPERATURE MINUS 5"
    out = out.replace(/\btemperature\s+(?:-|minus\s+)(\d{1,3})\b/gi, (_m, n: string) =>
        `temperature minus ${spellIcaoDigits(n)}`);
    out = out.replace(/\bdew\s*point\s+(?:-|minus\s+)(\d{1,3})\b/gi, (_m, n: string) =>
        `dew point minus ${spellIcaoDigits(n)}`);

    // Positive temperature / dewpoint
    out = out.replace(/\btemperature\s+(\d{1,3})\b/gi, (_m, n: string) =>
        `temperature ${spellIcaoDigits(n)}`);
    out = out.replace(/\bdew\s*point\s+(\d{1,3})\b/gi, (_m, n: string) =>
        `dew point ${spellIcaoDigits(n)}`);

    // Transition level: "TRL 60", "TL 60", "TRANSITION LEVEL 60"
    out = out.replace(/\b(?:TRL|TL|TRANSITION\s+LEVEL)\s+(\d{2,3})\b/gi,
        (_m, fl: string) => `transition level ${spellIcaoDigits(fl)}`);

    // NOSIG expansion
    out = out.replace(/\bNOSIG\b/g, 'no significant change');

    // METAR-style cloud layers: BKN030, FEW005 CB, SCT025, OVC100 TCU
    out = out.replace(/\b(FEW|SCT|BKN|OVC|NSC)(\d{3})(?:\s*(CB|TCU))?\b/gi,
        (_m, cover: string, height: string, type?: string) => {
            const coverWord = METAR_CLOUD[cover.toUpperCase()] ?? cover.toLowerCase();
            const heightWords = cloudHeightWords(parseInt(height, 10));
            const typeSuffix = type
                ? ` ${type.toUpperCase() === 'CB' ? 'cumulonimbus' : 'towering cumulus'}`
                : '';
            return `${coverWord} ${heightWords}${typeSuffix}`;
        });

    // Visibility in kilometers / meters
    out = out.replace(/\b(?:VIS|VISIBILITY)\s+(\d+)\s*(KM|M)\b/gi,
        (_m, val: string, unit: string) => {
            const u = unit.toUpperCase();
            if (u === 'KM') {
                return `visibility ${spellIcaoDigits(val)} kilometers`;
            }
            // Meters: 5000 → "five thousand", 1500 → "one thousand five hundred"
            const v = parseInt(val, 10);
            if (Number.isFinite(v) && v >= 1000 && v % 100 === 0) {
                const thousands = Math.floor(v / 1000);
                const hundreds = Math.round((v % 1000) / 100) * 100;
                const parts: string[] = [];
                if (thousands) parts.push(`${spellIcaoDigits(String(thousands))} thousand`);
                if (hundreds) parts.push(HUNDRED_WORDS[hundreds] ?? spellIcaoDigits(String(hundreds)));
                return `visibility ${parts.join(' ')} meters`;
            }
            return `visibility ${spellIcaoDigits(val)} meters`;
        });

    // Bare runway designators (without "RUNWAY" prefix), e.g. "AND 08R", "USE 08L".
    // Excludes patterns preceded by "flight level" or "FL " (already normalized).
    out = out.replace(/(?<!flight\s+level\s+|FL\s*)\b(\d{2})([LCR])\b/gi,
        (_m, digits: string, side: string) => {
            const sideWord = side.toUpperCase() === 'L' ? 'left'
                : side.toUpperCase() === 'R' ? 'right' : 'center';
            return `${spellIcaoDigits(digits)} ${sideWord}`;
        });

    // 6. Acronyms TTS spells letter-by-letter unless given as a word. Lowercase the
    //    ones pilots SAY as a word (ATIS, METAR, SPECI). Leave others uppercase —
    //    pilots actually spell ILS/VOR/QNH/DME letter-by-letter in radiotelephony.
    out = out.replace(/\bATIS\b/g, 'atis');
    out = out.replace(/\bMETAR\b/g, 'metar');
    out = out.replace(/\bSPECI\b/g, 'speci');

    return out.replace(/\s+/g, ' ').trim();
}

export function normalizeRadioPhrase(text: string, options: NormalizeRadioOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let out = text;

    out = out.replace(/\b(\d{3})\.(\d{1,3})\b/g, (_, a: string, b: string) => freqSpeak(`${a}.${b}`));
    out = out.replace(/\b(?:HDG|heading)\s*(\d{2,3})\b/gi, (_, hdg: string) => headingSpeak(hdg));
    out = out.replace(/\b(?:RWY|runway)\s*(\d{2}[LCR]?)\b/gi, (_, rw: string) => runwaySpeak(rw));
    out = out.replace(/\b(?:squawk|code)\s*(\d{4})\b/gi, (_, code: string) => squawkSpeak(code));
    out = out.replace(/\bFL\s*(\d{2,3})\b/gi, (_, fl: string) => flightLevelSpeak(fl));
    out = out.replace(/\b(\d{3,5})\s*(?:ft|feet)\b/gi, (_, ft: string) => altitudeSpeak(Number(ft)));
    out = out.replace(/\bQNH\s*(\d{3,4})\b/gi, (_, qnh: string) => qnhSpeak(qnh));

    if (opts.sidSuffixIcao) {
        out = out.replace(/\b([A-Z]{4,6})\s*(\d)\s*([A-Z])\b/g, (_match, prefix: string, digit: string, letter: string) => {
            return sidSuffixSpeak(prefix, digit, letter);
        });
    }

    // ILS/VOR variant letter before runway: "ILS Z 25C" → "ILS Zulu runway two five center"
    out = out.replace(
        /\b(ILS|VOR|RNAV|LOC|RNP)\s+([A-Z])\s+(\d{2}[LCR]?)\b/gi,
        (_match, type: string, variant: string, runway: string) =>
            `${type.toUpperCase()} ${ICAO_LETTERS[variant.toUpperCase()] ?? variant} ${runwaySpeak(runway)}`
    );
    // ILS/VOR suffix after runway: "ILS 25C Z" → legacy format
    out = out.replace(
        /\b(ILS|VOR|RNAV|LOC|RNP)\s+(\d{2}[LCR]?)\s+([A-Z])\b/gi,
        (_match, type: string, runway: string, suffix: string) => approachSpeak(type.toUpperCase(), runway, suffix)
    );

    if (opts.expandWaypoints) {
        // Expand standalone 5-6-char uppercase waypoint names (not already expanded by sidSuffixIcao)
        // Skip common ATC English words that may appear uppercase.
        out = out.replace(/\b([A-Z]{5,6})\b/g, (match, wp: string) => {
            if (WAYPOINT_SKIP.has(wp)) return match;
            return toIcaoPhonetic(wp);
        });
    }

    if (opts.expandAirports) {
        out = out.replace(/\b([A-Z]{4})\b/g, (_match, code: string) => icaoAirportSpeak(code));
    }

    if (opts.expandCallsigns) {
        const airlineMap = opts.airlineMap ?? {};
        out = out.replace(/\b([A-Z]{2,3}\d{1,4}[A-Z]?)\b/g, (match: string) => callsignSpeak(match, airlineMap));
    }

    out = applyTaxiRoutePhonetics(out);

    return out.replace(/\s+/g, ' ').trim();
}
