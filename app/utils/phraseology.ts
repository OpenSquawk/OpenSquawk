const ICAO_DIGIT_MAP: Record<string, string> = {
  '0': 'zero',
  '1': 'wun',
  '2': 'two',
  '3': 'tree',
  '4': 'fower',
  '5': 'fife',
  '6': 'six',
  '7': 'seven',
  '8': 'ait',
  '9': 'niner',
}

const NATO_MAP: Record<string, string> = {
  A: 'alpha',
  B: 'bravo',
  C: 'charlie',
  D: 'delta',
  E: 'echo',
  F: 'foxtrot',
  G: 'golf',
  H: 'hotel',
  I: 'india',
  J: 'juliet',
  K: 'kilo',
  L: 'lima',
  M: 'mike',
  N: 'november',
  O: 'oscar',
  P: 'papa',
  Q: 'quebec',
  R: 'romeo',
  S: 'sierra',
  T: 'tango',
  U: 'uniform',
  V: 'victor',
  W: 'whiskey',
  X: 'x-ray',
  Y: 'yankee',
  Z: 'zulu',
}

function cleanValue(value: string | number): string {
  if (value === undefined || value === null) {
    return ''
  }
  return String(value).trim()
}

function spellDigits(input: string, joiner = '-'): string {
  return input
    .replace(/[^0-9]/g, '')
    .split('')
    .map((digit) => ICAO_DIGIT_MAP[digit] ?? digit)
    .join(joiner)
}

function spellAlphaNumeric(value: string, joiner = '-'): string {
  const cleaned = value.replace(/\s+/g, '').toUpperCase()
  const parts: string[] = []

  for (const char of cleaned) {
    if (ICAO_DIGIT_MAP[char]) {
      parts.push(ICAO_DIGIT_MAP[char])
    } else if (NATO_MAP[char]) {
      parts.push(NATO_MAP[char])
    } else if (char === '/') {
      parts.push('slash')
    } else if (char === '-') {
      parts.push('dash')
    } else {
      parts.push(char.toLowerCase())
    }
  }

  return parts.join(joiner)
}

export function formatFrequency(value: string | number, joiner = '-'): string {
  const normalized = cleanValue(value).replace(',', '.').replace(/[^0-9.]/g, '')
  if (!normalized) return ''
  const [integerPart, decimalPart = ''] = normalized.split('.')
  const integerSpelled = integerPart
    .split('')
    .map((digit) => ICAO_DIGIT_MAP[digit] ?? digit)
    .join(joiner)
  const decimalTrimmed = decimalPart.replace(/0+$/, '')
  if (!decimalTrimmed) {
    return integerSpelled
  }
  const decimalSpelled = decimalTrimmed
    .split('')
    .map((digit) => ICAO_DIGIT_MAP[digit] ?? digit)
    .join(joiner)
  return `${integerSpelled}${joiner}decimal${joiner}${decimalSpelled}`
}

export function formatSquawk(value: string | number, joiner = '-'): string {
  const normalized = cleanValue(value)
  if (!normalized) return ''
  return spellDigits(normalized, joiner)
}

export function formatCallsign(value: string | number, joiner = '-'): string {
  const normalized = cleanValue(value)
  if (!normalized) return ''
  return spellAlphaNumeric(normalized, joiner)
}

export function formatRunway(value: string | number, joiner = '-'): string {
  const normalized = cleanValue(value)
  if (!normalized) return ''
  const match = normalized.match(/^(\d{1,2})([A-Z])?$/i)
  if (!match) {
    return spellAlphaNumeric(normalized, joiner)
  }
  const [, digits, suffix] = match
  const digitSpelled = spellDigits(digits, joiner)
  if (!suffix) {
    return digitSpelled
  }
  const suffixSpelled = NATO_MAP[suffix.toUpperCase()] ?? suffix.toLowerCase()
  return `${digitSpelled}${joiner}${suffixSpelled}`
}

export function formatHeading(value: string | number, joiner = '-'): string {
  const normalized = cleanValue(value)
  if (!normalized) return ''
  const padded = normalized.padStart(3, '0')
  return spellDigits(padded, joiner)
}

export function formatAltitude(value: string | number, joiner = '-'): string {
  const normalized = cleanValue(value)
  if (!normalized) return ''
  if (/^FL?\s?\d+/i.test(normalized)) {
    const digits = normalized.replace(/[^0-9]/g, '')
    const spelled = spellDigits(digits.padStart(3, '0'), joiner)
    return `flight${joiner}level${joiner}${spelled}`
  }
  const num = Number(normalized)
  if (Number.isFinite(num) && num >= 1000 && num % 1000 === 0) {
    const thousands = num / 1000
    const spelled = spellDigits(String(thousands), joiner)
    return `${spelled}${joiner}thousand`
  }
  if (Number.isFinite(num) && num % 100 === 0) {
    const hundreds = num / 100
    const spelled = spellDigits(String(hundreds), joiner)
    return `${spelled}${joiner}hundred`
  }
  return spellDigits(normalized, joiner)
}

export function formatSpeed(value: string | number, joiner = '-'): string {
  const normalized = cleanValue(value)
  if (!normalized) return ''
  return spellDigits(normalized, joiner)
}

export function formatPlain(value: string | number): string {
  return cleanValue(value)
}

export type AtcFormatterKey =
  | 'frequency'
  | 'squawk'
  | 'callsign'
  | 'runway'
  | 'heading'
  | 'altitude'
  | 'speed'
  | 'plain'

const FORMATTERS: Record<AtcFormatterKey, (value: string | number) => string> = {
  frequency: formatFrequency,
  squawk: formatSquawk,
  callsign: formatCallsign,
  runway: formatRunway,
  heading: formatHeading,
  altitude: formatAltitude,
  speed: formatSpeed,
  plain: formatPlain,
}

export interface RenderAtcOptions {
  joiner?: string
  defaultFormatter?: AtcFormatterKey
}

export function renderAtcPhrase(
  template: string,
  context: Record<string, string | number | undefined | null> = {},
  options: RenderAtcOptions = {},
): string {
  const joiner = options.joiner ?? '-'
  const defaultFormatter = options.defaultFormatter ?? 'plain'

  return template.replace(/{{\s*([^}|\s]+)\s*(?:\|\s*([^}\s]+)\s*)?}}/g, (_, key: string, fmt?: AtcFormatterKey) => {
    const value = context[key]
    if (value === undefined || value === null || value === '') {
      return ''
    }
    const formatter = (fmt && FORMATTERS[fmt]) || FORMATTERS[defaultFormatter]
    return formatter(value).replace(/-/g, joiner)
  })
}

export function normalizeAtcText(
  text: string,
  context: Record<string, string | number | undefined | null> = {},
): string {
  return renderAtcPhrase(text, context)
}
