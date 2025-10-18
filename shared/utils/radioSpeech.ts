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

export interface NormalizeRadioOptions {
    airlineMap?: AirlineTelephonyMap;
    expandCallsigns?: boolean;
    expandAirports?: boolean;
    sidSuffixIcao?: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<NormalizeRadioOptions, 'airlineMap'>> = {
    expandAirports: false,
    expandCallsigns: false,
    sidSuffixIcao: true,
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
    const parts = route.trim().split(/(\s+)/);
    if (!parts.length) return route.trim();
    const spokenParts = parts.map((part) => {
        if (!part.trim()) return part;
        const spoken = speakTaxiSegment(part);
        return spoken || part;
    });
    return spokenParts.join('').replace(/\s+/g, ' ').trim();
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
    return `${prefix} ${spellIcaoDigits(digit)} ${spellIcaoLetters(letter)}`;
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
        out = out.replace(/\b([A-Z]{4,6})(\s?)(\d)([A-Z])\b/g, (_match, prefix: string, _gap: string, digit: string, letter: string) => {
            return sidSuffixSpeak(prefix, digit, letter);
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
