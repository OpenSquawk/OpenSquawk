const digitMap: Record<string, string> = {
    '0': 'zero',
    '1': 'wun',
    '2': 'too',
    '3': 'tree',
    '4': 'fower',
    '5': 'fife',
    '6': 'six',
    '7': 'seven',
    '8': 'ait',
    '9': 'niner',
}

export type RadioSpeechFormat = 'plain' | 'digits' | 'frequency' | 'altitude' | 'squawk'

export interface RadioVariable {
    value: string | number
    format?: RadioSpeechFormat
}

function speakDigits(value: string, separator = '-'): string {
    return value
        .split('')
        .filter((char) => /[0-9]/.test(char))
        .map((char) => digitMap[char] ?? char)
        .join(separator)
}

function normalizeDecimal(decimal: string): string {
    const trimmed = decimal.replace(/0+$/, '')
    if (!trimmed.length) {
        return ''
    }
    return trimmed
        .split('')
        .map((char) => digitMap[char] ?? char)
        .join('-')
}

export function formatFrequencyForSpeech(value: string | number): string {
    const raw = String(value).trim()
    const sanitized = raw.replace(/[^0-9.]/g, '')
    if (!sanitized) {
        return raw
    }
    const [integer, decimal] = sanitized.split('.')
    const integerSpeech = speakDigits(integer ?? '')
    const decimalSpeech = decimal ? normalizeDecimal(decimal) : ''
    if (decimalSpeech) {
        return `${integerSpeech} decimal ${decimalSpeech}`
    }
    return integerSpeech
}

function formatAltitude(value: string | number): string {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) {
        return String(value)
    }
    if (numeric >= 18000) {
        const flightLevel = Math.round(numeric / 100)
        const spoken = speakDigits(flightLevel.toString())
        return `flight level ${spoken}`
    }
    const thousands = Math.floor(numeric / 1000)
    const hundreds = Math.floor((numeric % 1000) / 100)
    const parts: string[] = []
    if (thousands) {
        parts.push(`${digitMap[String(thousands)] ?? thousands.toString()} thousand`)
    }
    if (hundreds) {
        parts.push(`${digitMap[String(hundreds)] ?? hundreds.toString()} hundred`)
    }
    return parts.join(' ')
}

export function toRadioSpeech(value: string | number, format: RadioSpeechFormat = 'plain'): string {
    switch (format) {
        case 'digits':
            return speakDigits(String(value))
        case 'frequency':
            return formatFrequencyForSpeech(value)
        case 'altitude':
            return formatAltitude(value)
        case 'squawk':
            return speakDigits(String(value), '-')
        case 'plain':
        default:
            return String(value)
    }
}

export function applyRadioTemplate(
    template: string,
    variables: Record<string, RadioVariable | string | number>,
): string {
    return template.replace(/\{\{(.*?)\}\}/g, (_, key: string) => {
        const trimmedKey = key.trim()
        const rawValue = variables[trimmedKey]
        if (rawValue === undefined) {
            return ''
        }
        if (typeof rawValue === 'object' && rawValue !== null && 'value' in rawValue) {
            const variable = rawValue as RadioVariable
            return toRadioSpeech(variable.value, variable.format)
        }
        return String(rawValue)
    })
}

