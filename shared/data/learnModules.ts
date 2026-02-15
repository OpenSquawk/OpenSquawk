import { createBaseScenario, createScenarioSeries, digitsToWords, formatTemp, lettersToNato, minutesToWords } from '~~/shared/learn/scenario'
import { atcPerspectiveModules } from '~~/shared/data/learnDecisionModules'
import type { ModuleDef, Scenario, TrackDef } from '~~/shared/learn/types'

function gradientArt(colors: string[]): string {
  const stops = colors
    .map((color, idx) => `<stop offset="${Math.round((idx / Math.max(colors.length - 1, 1)) * 100)}%" stop-color="${color}"/>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect fill="url(#g)" width="400" height="240"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sample<T>(values: readonly T[]): T {
  return values[randInt(0, values.length - 1)]
}

const identifierCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomIdentifier(length: number): string {
  let value = ''
  for (let i = 0; i < length; i++) {
    value += identifierCharacters[randInt(0, identifierCharacters.length - 1)]
  }
  return value
}

function toPhoneticBlocks(value: string): string {
  return value
    .toUpperCase()
    .split('')
    .map(char => {
      if (/[A-Z]/.test(char)) {
        return lettersToNato(char)
      }
      if (/[0-9]/.test(char)) {
        return digitsToWords(char)
      }
      return char
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function createExtendedIdentifierScenario(length = 10): Scenario {
  const scenario = createBaseScenario()
  const identifier = randomIdentifier(length)
  scenario.phoneticCode = identifier
  scenario.phoneticCodeWords = toPhoneticBlocks(identifier)
  return scenario
}

const taxiPrefixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'Y', 'Z']
const taxiNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '15', '16']

function randomTaxiWaypoint(): string {
  const prefix = sample(taxiPrefixes)
  const number = sample(taxiNumbers)
  return `${prefix}${number}`
}

function createComplexTaxiScenario(): Scenario {
  const scenario = createBaseScenario()
  const segments: string[] = []
  const total = randInt(5, 8)
  while (segments.length < total) {
    const next = randomTaxiWaypoint()
    if (segments[segments.length - 1] === next) continue
    segments.push(next)
  }
  scenario.taxiRoute = segments.join(' ')
  return scenario
}

const fundamentalsLessons = [
  {
    id: 'icao-alphabet',
    title: 'Decode ICAO Letters & Numbers',
    desc: 'Turn phonetic blocks into identifiers',
    keywords: ['Alphabet', 'Numbers', 'Basics'],
    hints: [
      'Convert the NATO letters and ATC numbers back into characters.',
      'Write the identifier exactly as you would enter it into the FMS.'
    ],
    fields: [
      {
        key: 'icao-code',
        label: 'Identifier',
        expected: scenario => scenario.phoneticCode,
        alternatives: scenario => {
          const spelled = scenario.phoneticCodeWords
          const upper = scenario.phoneticCode.toUpperCase()
          const lower = upper.toLowerCase()
          const spacedUpper = upper.split('').join(' ')
          const spacedLower = lower.split('').join(' ')
          return Array.from(
            new Set([
              upper,
              lower,
              spelled,
              spelled.toLowerCase(),
              spacedUpper,
              spacedLower
            ])
          )
        },
        placeholder: 'Enter identifier',
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Identifier ' },
      { type: 'field', key: 'icao-code', width: 'lg' }
    ],
    defaultFrequency: 'DEL',
    phrase: scenario => scenario.phoneticCodeWords,
    info: scenario => [
      `Heard: ${scenario.phoneticCodeWords}`,
      `Identifier: ${scenario.phoneticCode}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'icao-marathon',
    title: 'ICAO Marathon Drill',
    desc: 'Copy extended identifiers with up to ten characters',
    keywords: ['Alphabet', 'Numbers', 'Advanced'],
    hints: [
      'Scan for natural breaks every two to three characters to keep long identifiers manageable.',
      'Say the full sequence back without pauses, including letters and digits exactly as transmitted.'
    ],
    fields: [
      {
        key: 'icao-long-code',
        label: 'Identifier',
        expected: scenario => scenario.phoneticCode,
        alternatives: scenario => {
          const value = scenario.phoneticCode
          const upper = value.toUpperCase()
          const lower = upper.toLowerCase()
          const spacedUpper = upper.split('').join(' ')
          const spacedLower = lower.split('').join(' ')
          const spelled = scenario.phoneticCodeWords
          return Array.from(
            new Set([upper, lower, spacedUpper, spacedLower, spelled, spelled.toLowerCase()])
          )
        },
        placeholder: 'Enter long identifier',
        width: 'xl'
      }
    ],
    readback: [
      { type: 'text', text: 'Identifier ' },
      { type: 'field', key: 'icao-long-code', width: 'xl' }
    ],
    defaultFrequency: 'DEL',
    phrase: scenario => scenario.phoneticCodeWords,
    info: scenario => [
      `Heard: ${scenario.phoneticCodeWords}`,
      `Identifier: ${scenario.phoneticCode}`
    ],
    generate: () => createExtendedIdentifierScenario(10)
  },
  {
    id: 'radio-call',
    title: 'Radio Call Sign',
    desc: 'Say the spoken or ICAO call sign confidently',
    keywords: ['Basics', 'Callsign'],
    hints: [
      'Use the airline telephony plus digits when talking to ATC.',
      'Readbacks can use either the spoken or ICAO format.'
    ],
    fields: [
      {
        key: 'radio-call',
        label: 'Call sign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => {
          const variants = new Set<string>()
          const add = (value?: string) => {
            if (!value) return
            variants.add(value)
            variants.add(value.toLowerCase())
          }
          add(scenario.radioCall)
          add(`${scenario.airlineCall} ${scenario.flightNumber}`)
          add(`${scenario.airlineCall} ${scenario.flightNumberWords}`)
          add(scenario.callsign)
          add(`${scenario.airlineCode} ${scenario.flightNumber}`)
          add(`${scenario.callsignNato} ${scenario.flightNumberWords}`)
          return Array.from(variants)
        },
        width: 'xl'
      }
    ],
    readback: [
      { type: 'text', text: 'Call sign ' },
      { type: 'field', key: 'radio-call', width: 'xl' }
    ],
    defaultFrequency: 'DEL',
    phrase: scenario => `${scenario.radioCall}`,
    info: scenario => [
      `Spoken: ${scenario.radioCall}`,
      `ICAO: ${scenario.callsign}`,
      `Phonetic: ${scenario.callsignNato} ${scenario.flightNumberWords}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'atis',
    title: 'Understand the ATIS',
    desc: 'Extract the identifier and key data from the ATIS',
    keywords: ['ATIS', 'Weather'],
    hints: [
      'Remember the ATIS identifier as its NATO word (e.g. Information Yankee).',
      'Order: runway – wind – visibility – temperature – dew point – QNH; copy the numbers as digits.'
    ],
    fields: [
      {
        key: 'atis-code',
        label: 'ATIS',
        expected: scenario => scenario.atisCode,
        alternatives: scenario => [
          scenario.atisCode,
          scenario.atisCode.toLowerCase(),
          scenario.atisCodeWord,
          scenario.atisCodeWord.toLowerCase(),
          `Information ${scenario.atisCode}`,
          `information ${scenario.atisCode.toLowerCase()}`,
          `Information ${scenario.atisCodeWord}`,
          `information ${scenario.atisCodeWord.toLowerCase()}`
        ],
        placeholder: 'Enter ATIS letter',
        width: 'xs',
        threshold: 0.9
      },
      {
        key: 'atis-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'atis-wind',
        label: 'Wind',
        expected: scenario => scenario.wind,
        alternatives: scenario => [
          scenario.wind,
          `${scenario.wind}KT`,
          scenario.windWords
        ],
        width: 'md'
      },
      {
        key: 'atis-visibility',
        label: 'Visibility',
        expected: scenario => scenario.visibility,
        alternatives: scenario => {
          const values = new Set<string>()
          const add = (value?: string) => {
            if (!value) return
            values.add(value)
            values.add(value.toLowerCase())
          }
          add(scenario.visibility)
          add(scenario.atisSummary.visibility)
          add(scenario.visibilityWords)
          const numeric = Number(scenario.visibility)
          if (!Number.isNaN(numeric)) {
            if (numeric >= 1000) {
              const precise = (numeric / 1000).toFixed(1).replace(/\.0$/, '')
              add(precise)
              add(`${precise}km`)
              add(`${precise} km`)
            }
            if (numeric >= 1000) {
              const rounded = Math.round(numeric / 1000)
              add(rounded.toString())
              add(`${rounded}km`)
              add(`${rounded} km`)
            }
          }
          if (scenario.visibility === '9999') {
            add('10')
            add('10km')
            add('10 km')
          }
          return Array.from(values)
        },
        width: 'sm'
      },
      {
        key: 'atis-temp',
        label: 'Temperature',
        expected: scenario => scenario.temperature.toString(),
        alternatives: scenario => {
          const value = scenario.temperature
          const base = value.toString()
          const plus = value > 0 ? `+${base}` : base
          const c = `${base}°C`
          const cSpaced = `${base} °C`
          const shortC = value > 0 ? `${plus}C` : `${base}C`
          const options = new Set<string>([
            base,
            plus,
            c,
            cSpaced,
            shortC,
            scenario.temperatureWords,
            formatTemp(value)
          ])
          options.add(`${plus}°C`)
          options.add(`${plus} °C`)
          options.add(scenario.temperatureWords.toLowerCase())
          return Array.from(options)
        },
        width: 'sm'
      },
      {
        key: 'atis-dew',
        label: 'Dew point',
        expected: scenario => scenario.dewpoint.toString(),
        alternatives: scenario => {
          const value = scenario.dewpoint
          const base = value.toString()
          const plus = value > 0 ? `+${base}` : base
          const c = `${base}°C`
          const cSpaced = `${base} °C`
          const shortC = value > 0 ? `${plus}C` : `${base}C`
          const options = new Set<string>([
            base,
            plus,
            c,
            cSpaced,
            shortC,
            scenario.dewpointWords,
            formatTemp(value)
          ])
          options.add(`${plus}°C`)
          options.add(`${plus} °C`)
          options.add(scenario.dewpointWords.toLowerCase())
          return Array.from(options)
        },
        width: 'sm'
      },
      {
        key: 'atis-qnh',
        label: 'QNH',
        expected: scenario => scenario.qnh.toString(),
        alternatives: scenario => [`QNH ${scenario.qnh}`, scenario.qnhWords],
        width: 'sm'
      }
    ],
    readback: [
      { type: 'text', text: 'Information ' },
      { type: 'field', key: 'atis-code', width: 'xs' },
      { type: 'text', text: ', runway ' },
      { type: 'field', key: 'atis-runway', width: 'sm' },
      { type: 'text', text: ', wind ' },
      { type: 'field', key: 'atis-wind', width: 'md' },
      { type: 'text', text: ', visibility ' },
      { type: 'field', key: 'atis-visibility', width: 'sm' },
      { type: 'text', text: ', temperature ' },
      { type: 'field', key: 'atis-temp', width: 'sm' },
      { type: 'text', text: ', dew point ' },
      { type: 'field', key: 'atis-dew', width: 'sm' },
      { type: 'text', text: ', QNH ' },
      { type: 'field', key: 'atis-qnh', width: 'sm' }
    ],
    defaultFrequency: 'ATIS',
    phrase: scenario => scenario.atisText,
    info: () => [
      'Note the identifier (NATO word), runway, wind, visibility, temperature, dew point, and QNH.',
      'Temperatures and dew point can be recorded as plain numbers; visibility may be metres or kilometres.'
    ],
    generate: createBaseScenario
  },
  {
    id: 'metar',
    title: 'Decode the METAR',
    desc: 'Extract the raw METAR values',
    keywords: ['METAR', 'Weather'],
    hints: [
      'Read the METAR in blocks: wind – visibility – clouds – temperature – QNH.',
      'The temperature block looks like 18/10; negative values start with M.'
    ],
    fields: [
      {
        key: 'metar-wind',
        label: 'Wind',
        expected: scenario => scenario.metarSegments.wind,
        alternatives: scenario => [
          scenario.metarSegments.wind,
          `${scenario.wind.replace('/', '')}KT`,
          scenario.wind
        ],
        width: 'md'
      },
      {
        key: 'metar-vis',
        label: 'Visibility',
        expected: scenario => scenario.metarSegments.visibility,
        alternatives: scenario => [scenario.visibility],
        placeholder: 'Enter visibility value',
        width: 'sm',
        inputmode: 'numeric'
      },
      {
        key: 'metar-temp',
        label: 'Temp/Dew',
        expected: scenario => scenario.metarSegments.temp,
        alternatives: scenario => [
          `${formatTemp(scenario.temperature)}/${formatTemp(scenario.dewpoint)}`
        ],
        width: 'md'
      },
      {
        key: 'metar-qnh',
        label: 'QNH',
        expected: scenario => scenario.metarSegments.qnh,
        alternatives: scenario => [`Q${scenario.qnh}`, scenario.qnh.toString()],
        width: 'sm'
      }
    ],
    readback: [
      { type: 'text', text: 'Wind ' },
      { type: 'field', key: 'metar-wind', width: 'md' },
      { type: 'text', text: ', visibility ' },
      { type: 'field', key: 'metar-vis', width: 'sm' },
      { type: 'text', text: ', temperature ' },
      { type: 'field', key: 'metar-temp', width: 'md' },
      { type: 'text', text: ', QNH ' },
      { type: 'field', key: 'metar-qnh', width: 'sm' }
    ],
    defaultFrequency: 'ATIS',
    phrase: scenario => scenario.metar,
    info: scenario => [
      `METAR: ${scenario.metar}`,
      `Interpretation: Wind ${scenario.metarSegments.wind}, visibility ${scenario.visibilityWords}, temperature ${scenario.temperature}°C, QNH ${scenario.qnh}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'radio-check',
    title: 'Radio Check',
    desc: 'Acknowledge a requested radio check',
    keywords: ['Ground', 'Comms'],
    hints: [
      'Reply with "Readability" plus the number you hear.',
      'Finish with your call sign; no need to repeat the frequency.'
    ],
    fields: [
      {
        key: 'rc-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => {
          const variants = new Set<string>()
          const add = (value?: string) => {
            if (!value) return
            variants.add(value)
            variants.add(value.toLowerCase())
          }
          add(scenario.radioCall)
          add(`${scenario.airlineCall} ${scenario.flightNumber}`)
          add(`${scenario.airlineCall} ${scenario.flightNumberWords}`)
          add(scenario.callsign)
          add(`${scenario.airlineCode} ${scenario.flightNumber}`)
          add(`${scenario.callsignNato} ${scenario.flightNumberWords}`)
          return Array.from(variants)
        },
        placeholder: 'Enter call sign',
        width: 'lg'
      },
      {
        key: 'rc-readability',
        label: 'Readability',
        expected: scenario => scenario.readabilityWord,
        alternatives: scenario => [
          scenario.readability.toString(),
          scenario.readabilityWord,
          scenario.readabilityWord.toLowerCase()
        ],
        placeholder: 'Enter readability (1-5)',
        width: 'sm'
      }
    ],
    readback: [
      { type: 'text', text: 'Readability ' },
      { type: 'field', key: 'rc-readability', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'rc-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, ${scenario.airport.name} Ground, say radio check on ${scenario.groundFreq}.`,
    info: scenario => [
      `Request: ${scenario.airport.name} Ground on ${scenario.groundFreq} (${scenario.frequencyWords.GND})`,
      `Respond: Readability ${scenario.readability} (${scenario.readabilityWord}) with your call sign`
    ],
    generate: createBaseScenario
  },
  {
    id: 'frequency-change',
    title: 'Frequency Change Readback',
    desc: 'Confirm a handoff instruction',
    keywords: ['Comms', 'Frequency'],
    hints: [
      'Repeat the station and frequency before your call sign.',
      'State the frequency as digits or with "decimal".'
    ],
    fields: [
      {
        key: 'freq-contact-frequency',
        label: 'Frequency',
        expected: scenario => scenario.handoff.frequency,
        threshold: 0.99,
        alternatives: scenario => {
          const freq = scenario.handoff.frequency
          const trimmed = freq.replace(/\.?0+$/, '')
          const comma = freq.replace('.', ',')
          const trimmedComma = trimmed.replace('.', ',')
          const spaced = freq.replace('.', ' ')
          const trimmedSpaced = trimmed.replace('.', ' ')
          const words = scenario.handoff.frequencyWords
          const pointWords = words.replace('decimal', 'point')
          const compact = freq.replace('.', '')
          const trimmedCompact = trimmed.replace('.', '')
          const values = new Set<string>([
            freq,
            trimmed,
            comma,
            trimmedComma,
            spaced,
            trimmedSpaced,
            words,
            words.toLowerCase(),
            pointWords,
            pointWords.toLowerCase(),
            compact,
            trimmedCompact
          ])
          return Array.from(values)
        },
        placeholder: 'Enter contact frequency',
        width: 'md'
      }
    ],
    readback: [
      { type: 'text', text: scenario => `Contact ${scenario.handoff.facility} on ` },
      { type: 'field', key: 'freq-contact-frequency', width: 'md' },
      { type: 'text', text: scenario => `, ${scenario.radioCall}` }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.radioCall}, contact ${scenario.handoff.facility} on ${scenario.handoff.frequencyWords}.`,
    info: scenario => [
      `Station: ${scenario.handoff.facility}`,
      `Frequency: ${scenario.handoff.frequency} (${scenario.handoff.frequencyWords})`
    ],
    generate: createBaseScenario
  }
]

const readbackLessons = [
  {
    id: 'clearance-readback',
    title: 'Clearance Readback',
    desc: 'Read back the clearance in full',
    keywords: ['Delivery', 'Readback'],
    hints: [
      'Remember the order: destination – SID – runway – altitude – squawk.',
      'Speak altitude and squawk digits clearly.'
    ],
    fields: [
      {
        key: 'clr-dest',
        label: 'Destination',
        expected: scenario => scenario.destination.city,
        alternatives: scenario => [scenario.destination.icao, scenario.destination.name],
        width: 'md'
      },
      {
        key: 'clr-sid',
        label: 'SID',
        expected: scenario => scenario.sid,
        width: 'lg'
      },
      {
        key: 'clr-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'clr-alt',
        label: 'Initial Altitude',
        expected: scenario => scenario.altitudes.initialWords,
        alternatives: scenario => [scenario.altitudes.initial.toString(), `${scenario.altitudes.initial} feet`],
        width: 'md'
      },
      {
        key: 'clr-squawk',
        label: 'Squawk',
        expected: scenario => scenario.squawkWords,
        alternatives: scenario => [scenario.squawk, scenario.squawk.split('').join(' ')],
        width: 'md'
      }
    ],
    readback: [
      { type: 'text', text: scenario => `${scenario.radioCall} cleared ` },
      { type: 'field', key: 'clr-dest', width: 'md' },
      { type: 'text', text: ' via ' },
      { type: 'field', key: 'clr-sid', width: 'lg' },
      { type: 'text', text: ', runway ' },
      { type: 'field', key: 'clr-runway', width: 'sm' },
      { type: 'text', text: ', climb ' },
      { type: 'field', key: 'clr-alt', width: 'md' },
      { type: 'text', text: ', squawk ' },
      { type: 'field', key: 'clr-squawk', width: 'md' }
    ],
    defaultFrequency: 'DEL',
    phrase: scenario => `${scenario.radioCall}, cleared to ${scenario.destination.city} via ${scenario.sid}, runway ${scenario.runway}, climb ${scenario.altitudes.initial} feet, squawk ${scenario.squawk}.`,
    info: scenario => [
      `SID: ${scenario.sid} (${scenario.transition})`,
      `Initial Altitude: ${scenario.altitudes.initial} ft (${scenario.altitudes.initialWords})`,
      `Squawk: ${scenario.squawk}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'clearance-amendment',
    title: 'Amended Clearance',
    desc: 'Confirm the updated SID, transition and runway',
    keywords: ['Delivery', 'Amendment'],
    hints: [
      'Start with "Amended clearance" followed by SID and transition.',
      'Include the runway and end with your call sign.'
    ],
    fields: [
      {
        key: 'clr-amend-sid',
        label: 'SID',
        expected: scenario => scenario.sid,
        width: 'lg'
      },
      {
        key: 'clr-amend-transition',
        label: 'Transition',
        expected: scenario => scenario.transition,
        width: 'md'
      },
      {
        key: 'clr-amend-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'clr-amend-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Amended clearance: ' },
      { type: 'field', key: 'clr-amend-sid', width: 'lg' },
      { type: 'text', text: ' ' },
      { type: 'field', key: 'clr-amend-transition', width: 'md' },
      { type: 'text', text: ' departure, runway ' },
      { type: 'field', key: 'clr-amend-runway', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'clr-amend-callsign', width: 'lg' }
    ],
    defaultFrequency: 'DEL',
    phrase: scenario => `${scenario.radioCall}, amended clearance: ${scenario.sid} ${scenario.transition} departure, runway ${scenario.runway}.`,
    info: scenario => [
      `SID: ${scenario.sid}`,
      `Transition: ${scenario.transition}`,
      `Runway: ${scenario.runway}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'pushback',
    title: 'Pushback Clearance',
    desc: 'Acknowledge the pushback approval',
    keywords: ['Ground', 'Pushback'],
    hints: [
      'Repeat the direction you must face and the QNH.',
      'Keep the call sign at the end.'
    ],
    fields: [
      {
        key: 'push-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'push-qnh',
        label: 'QNH',
        expected: scenario => scenario.qnh.toString(),
        alternatives: scenario => [`QNH ${scenario.qnh}`, scenario.qnhWords],
        width: 'sm'
      },
      {
        key: 'push-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Push and start approved, facing runway ' },
      { type: 'field', key: 'push-runway', width: 'sm' },
      { type: 'text', text: ', QNH ' },
      { type: 'field', key: 'push-qnh', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'push-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, push and start approved, facing runway ${scenario.runway}. QNH ${scenario.qnh}.`,
    info: scenario => [
      `Stand: ${scenario.stand}`,
      `Ground frequency: ${scenario.groundFreq} (${scenario.frequencyWords.GND})`
    ],
    generate: createBaseScenario
  },
  {
    id: 'pushback-delay',
    title: 'Pushback Delay Acknowledgement',
    desc: 'Confirm delayed push and the expected taxi route',
    keywords: ['Ground', 'Pushback', 'Exception'],
    hints: [
      'Read back the delay before the taxi route.',
      'Close with the call sign.'
    ],
    fields: [
      {
        key: 'push-delay',
        label: 'Delay',
        expected: scenario => scenario.pushDelayWords,
        alternatives: scenario => [
          scenario.pushDelayWords,
          `${scenario.pushDelayMinutes} minutes`,
          scenario.pushDelayMinutes.toString()
        ],
        width: 'md'
      },
      {
        key: 'push-route',
        label: 'Taxi Route',
        expected: scenario => scenario.taxiRoute,
        alternatives: scenario => [scenario.taxiRoute, `via ${scenario.taxiRoute}`],
        width: 'lg'
      },
      {
        key: 'push-delay-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Push and start approved in ' },
      { type: 'field', key: 'push-delay', width: 'md' },
      { type: 'text', text: ' minutes, expect taxi via ' },
      { type: 'field', key: 'push-route', width: 'lg' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'push-delay-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, push and start approved in ${scenario.pushDelayMinutes} minutes, expect taxi via ${scenario.taxiRoute}.`,
    info: scenario => [
      `Delay: ${scenario.pushDelayMinutes} minutes (${scenario.pushDelayWords})`,
      `Taxi route: ${scenario.taxiRoute}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'taxi',
    title: 'Taxi Readback',
    desc: 'Read back the taxi clearance with hold short',
    keywords: ['Ground', 'Taxi'],
    hints: [
      'Repeat the route exactly as received, including the hold short.',
      'Finish with the call sign.'
    ],
    fields: [
      {
        key: 'taxi-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'taxi-route',
        label: 'Route',
        expected: scenario => scenario.taxiRoute,
        alternatives: scenario => [scenario.taxiRoute, `via ${scenario.taxiRoute}`],
        width: 'lg'
      },
      {
        key: 'taxi-hold',
        label: 'Hold Short',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'taxi-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Taxi to runway ' },
      { type: 'field', key: 'taxi-runway', width: 'sm' },
      { type: 'text', text: ' via ' },
      { type: 'field', key: 'taxi-route', width: 'lg' },
      { type: 'text', text: ', holding short runway ' },
      { type: 'field', key: 'taxi-hold', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'taxi-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, taxi to runway ${scenario.runway} via ${scenario.taxiRoute}, hold short runway ${scenario.runway}.`,
    info: scenario => [
      `Taxi route: ${scenario.taxiRoute}`,
      `Hold short: ${scenario.runway}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'taxi-complex',
    title: 'Complex Taxi Route',
    desc: 'Handle long taxi instructions with multiple waypoints',
    keywords: ['Ground', 'Taxi', 'Advanced'],
    hints: [
      'Copy the entire route, including every waypoint in the order delivered.',
      'Group waypoints into small chunks so you can read the route back smoothly.'
    ],
    fields: [
      {
        key: 'taxi-complex-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'taxi-complex-route',
        label: 'Route',
        expected: scenario => scenario.taxiRoute,
        alternatives: scenario => [scenario.taxiRoute, `via ${scenario.taxiRoute}`],
        width: 'xl'
      },
      {
        key: 'taxi-complex-hold',
        label: 'Hold Short',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'taxi-complex-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Taxi to runway ' },
      { type: 'field', key: 'taxi-complex-runway', width: 'sm' },
      { type: 'text', text: ' via ' },
      { type: 'field', key: 'taxi-complex-route', width: 'xl' },
      { type: 'text', text: ', holding short runway ' },
      { type: 'field', key: 'taxi-complex-hold', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'taxi-complex-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, taxi to runway ${scenario.runway} via ${scenario.taxiRoute}, hold short runway ${scenario.runway}.`,
    info: scenario => [
      `Taxi route: ${scenario.taxiRoute}`,
      `Hold short: ${scenario.runway}`
    ],
    generate: createComplexTaxiScenario
  },
  {
    id: 'lineup',
    title: 'Line-up Clearance',
    desc: 'Acknowledge line up and wait',
    keywords: ['Tower', 'Line Up'],
    hints: [
      'Repeat the runway, then say "line up and wait".',
      'Place the call sign at the end.'
    ],
    fields: [
      {
        key: 'lineup-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'lineup-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Runway ' },
      { type: 'field', key: 'lineup-runway', width: 'sm' },
      { type: 'text', text: ', line up and wait, ' },
      { type: 'field', key: 'lineup-callsign', width: 'lg' }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.radioCall}, line up and wait runway ${scenario.runway}.`,
    info: scenario => [
      `Tower: ${scenario.towerFreq} (${scenario.frequencyWords.TWR})`,
      `Line-up runway: ${scenario.runway}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'takeoff',
    title: 'Takeoff Clearance',
    desc: 'Acknowledge the takeoff clearance',
    keywords: ['Tower', 'Departure'],
    hints: [
      'Order: runway – cleared for takeoff – call sign.',
      'Wind information can be omitted if it was not given.'
    ],
    fields: [
      {
        key: 'tko-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'tko-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Runway ' },
      { type: 'field', key: 'tko-runway', width: 'sm' },
      { type: 'text', text: ', cleared for takeoff, ' },
      { type: 'field', key: 'tko-callsign', width: 'lg' }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.radioCall}, wind ${scenario.windWords}, runway ${scenario.runway}, cleared for takeoff.`,
    info: scenario => [
      `Wind: ${scenario.wind} (${scenario.windWords})`,
      `Runway: ${scenario.runway}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'climb-instruction',
    title: 'Climb & Direct',
    desc: 'Read back the climb instruction in full',
    keywords: ['Departure', 'Climb'],
    hints: [
      'Start with "Climb", then the altitude and any direct clearance.',
      'Repeat the call sign at the end.'
    ],
    fields: [
      {
        key: 'climb-alt',
        label: 'Altitude',
        expected: scenario => scenario.altitudes.climbWords,
        alternatives: scenario => [
          scenario.altitudes.climbWords,
          scenario.altitudes.climb.toString(),
          `${scenario.altitudes.climb} feet`
        ],
        width: 'md'
      },
      {
        key: 'climb-direct',
        label: 'Direct',
        expected: scenario => scenario.transition,
        width: 'md'
      },
      {
        key: 'climb-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Climb ' },
      { type: 'field', key: 'climb-alt', width: 'md' },
      { type: 'text', text: ', direct ' },
      { type: 'field', key: 'climb-direct', width: 'md' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'climb-callsign', width: 'lg' }
    ],
    defaultFrequency: 'DEP',
    phrase: scenario => `${scenario.radioCall}, climb ${scenario.altitudes.climb} feet, proceed direct ${scenario.transition}.`,
    info: scenario => [
      `Climb: ${scenario.altitudes.climb} ft (${scenario.altitudes.climbWords})`,
      `Direct to: ${scenario.transition}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'climb-alt-route',
    title: 'Climb & Reroute',
    desc: 'Confirm a new altitude and routing',
    keywords: ['Center', 'Climb'],
    hints: [
      'Mention the altitude first, then the direct routing.',
      'End the readback with your call sign.'
    ],
    fields: [
      {
        key: 'climb-alt-route-alt',
        label: 'Altitude',
        expected: scenario => scenario.altitudes.climbWords,
        alternatives: scenario => [
          scenario.altitudes.climbWords,
          scenario.altitudes.climb.toString(),
          `${scenario.altitudes.climb} feet`
        ],
        width: 'md'
      },
      {
        key: 'climb-alt-route-direct',
        label: 'Direct',
        expected: scenario => scenario.transition,
        width: 'md'
      },
      {
        key: 'climb-alt-route-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Climb ' },
      { type: 'field', key: 'climb-alt-route-alt', width: 'md' },
      { type: 'text', text: ', proceed direct ' },
      { type: 'field', key: 'climb-alt-route-direct', width: 'md' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'climb-alt-route-callsign', width: 'lg' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, climb to ${scenario.altitudes.climb} feet, proceed direct ${scenario.transition}.`,
    info: scenario => [
      `Requested altitude: ${scenario.altitudes.climb} ft`,
      `New routing: direct ${scenario.transition}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'departure-handoff',
    title: 'Departure Handoff',
    desc: 'Switch to departure',
    keywords: ['Departure', 'Handoff'],
    hints: [
      'Repeat the frequency exactly, either as digits or spoken form.',
      'Append the call sign at the end.'
    ],
    fields: [
      {
        key: 'dep-freq',
        label: 'Frequency',
        expected: scenario => scenario.departureFreq,
        alternatives: scenario => [
          scenario.departureFreq,
          scenario.departureFreq.replace('.', ''),
          scenario.frequencyWords.DEP
        ],
        width: 'md'
      },
      {
        key: 'dep-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Contact departure ' },
      { type: 'field', key: 'dep-freq', width: 'md' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'dep-callsign', width: 'lg' }
    ],
    defaultFrequency: 'DEP',
    phrase: scenario => `${scenario.radioCall}, contact departure ${scenario.departureFreq}.`,
    info: scenario => [
      `Departure: ${scenario.departureFreq} (${scenario.frequencyWords.DEP})`,
      `Tower handoff after departure.`
    ],
    generate: createBaseScenario
  },
  {
    id: 'center-handoff',
    title: 'Center Handoff',
    desc: 'Confirm the handoff to center',
    keywords: ['Enroute', 'Handoff'],
    hints: [
      'Repeat the frequency and include your call sign.',
      'You can say the digits or the spoken version.'
    ],
    fields: [
      {
        key: 'center-freq',
        label: 'Frequency',
        expected: scenario => scenario.centerFreq,
        alternatives: scenario => [
          scenario.centerFreq,
          scenario.centerFreq.replace('.', ''),
          scenario.frequencyWords.CTR
        ],
        width: 'md'
      },
      {
        key: 'center-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Contact center ' },
      { type: 'field', key: 'center-freq', width: 'md' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'center-callsign', width: 'lg' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, contact Center ${scenario.centerFreq}.`,
    info: scenario => [
      `Center: ${scenario.centerFreq} (${scenario.frequencyWords.CTR})`,
      `Expect to report level or route as required.`
    ],
    generate: createBaseScenario
  },
  {
    id: 'descent-clearance',
    title: 'Descent Clearance',
    desc: 'Read back the STAR, transition and QNH',
    keywords: ['Approach', 'Descent', 'Readback'],
    hints: [
      'State the STAR and transition in order.',
      'Include the QNH and end with your call sign.'
    ],
    fields: [
      {
        key: 'descent-star',
        label: 'STAR',
        expected: scenario => scenario.arrivalStar,
        width: 'lg'
      },
      {
        key: 'descent-transition',
        label: 'Transition',
        expected: scenario => scenario.arrivalTransition,
        width: 'md'
      },
      {
        key: 'descent-qnh',
        label: 'QNH',
        expected: scenario => scenario.arrivalQnh.toString(),
        alternatives: scenario => [
          scenario.arrivalQnh.toString(),
          `QNH ${scenario.arrivalQnh}`,
          scenario.arrivalQnhWords
        ],
        width: 'sm'
      },
      {
        key: 'descent-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Descend via ' },
      { type: 'field', key: 'descent-star', width: 'lg' },
      { type: 'text', text: ' ' },
      { type: 'field', key: 'descent-transition', width: 'md' },
      { type: 'text', text: ', QNH ' },
      { type: 'field', key: 'descent-qnh', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'descent-callsign', width: 'lg' }
    ],
    defaultFrequency: 'APP',
    phrase: scenario => `${scenario.radioCall}, descend via ${scenario.arrivalStar} ${scenario.arrivalTransition}, QNH ${scenario.arrivalQnh}.`,
    info: scenario => [
      `STAR: ${scenario.arrivalStar}`,
      `Transition: ${scenario.arrivalTransition}`,
      `Arrival QNH: ${scenario.arrivalQnh} (${scenario.arrivalQnhWords})`
    ],
    generate: createBaseScenario
  },
  {
    id: 'approach-vector',
    title: 'Approach Vector',
    desc: 'Read back heading, altitude and speed',
    keywords: ['Approach', 'Vector'],
    hints: [
      'Heading, then altitude, then speed restriction.',
      'Use ATC number words for the speed and altitude.'
    ],
    fields: [
      {
        key: 'vector-heading',
        label: 'Heading',
        expected: scenario => scenario.vectorHeading,
        alternatives: scenario => [
          scenario.vectorHeading,
          scenario.vectorHeadingWords
        ],
        width: 'md'
      },
      {
        key: 'vector-alt',
        label: 'Altitude',
        expected: scenario => scenario.altitudes.initialWords,
        alternatives: scenario => [
          scenario.altitudes.initialWords,
          scenario.altitudes.initial.toString(),
          `${scenario.altitudes.initial} feet`
        ],
        width: 'md'
      },
      {
        key: 'vector-speed',
        label: 'Speed',
        expected: scenario => scenario.speedRestrictionWords,
        alternatives: scenario => [
          scenario.speedRestrictionWords,
          `${scenario.speedRestriction} knots`,
          scenario.speedRestriction.toString()
        ],
        width: 'md'
      },
      {
        key: 'vector-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Heading ' },
      { type: 'field', key: 'vector-heading', width: 'md' },
      { type: 'text', text: ', descend to ' },
      { type: 'field', key: 'vector-alt', width: 'md' },
      { type: 'text', text: ', reduce speed ' },
      { type: 'field', key: 'vector-speed', width: 'md' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'vector-callsign', width: 'lg' }
    ],
    defaultFrequency: 'APP',
    phrase: scenario => `${scenario.radioCall}, turn left heading ${scenario.vectorHeading}, descend to ${scenario.altitudes.initial} feet, reduce speed ${scenario.speedRestriction}.`,
    info: scenario => [
      `Heading: ${scenario.vectorHeading} (${scenario.vectorHeadingWords})`,
      `Altitude: ${scenario.altitudes.initial} ft`,
      `Speed restriction: ${scenario.speedRestriction} (${scenario.speedRestrictionWords})`
    ],
    generate: createBaseScenario
  },
  {
    id: 'approach-clearance',
    title: 'Approach Clearance',
    desc: 'Confirm the approach type and runway',
    keywords: ['Approach', 'Readback'],
    hints: [
      'Say "Cleared" followed by the approach.',
      'Repeat the runway and finish with your call sign.'
    ],
    fields: [
      {
        key: 'app-type',
        label: 'Approach',
        expected: scenario => scenario.approach,
        width: 'lg'
      },
      {
        key: 'app-runway',
        label: 'Runway',
        expected: scenario => scenario.arrivalRunway,
        alternatives: scenario => [
          scenario.arrivalRunway.replace(/^0/, ''),
          scenario.arrivalRunwayWords
        ],
        width: 'sm'
      },
      {
        key: 'app-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Cleared ' },
      { type: 'field', key: 'app-type', width: 'lg' },
      { type: 'text', text: ' approach runway ' },
      { type: 'field', key: 'app-runway', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'app-callsign', width: 'lg' }
    ],
    defaultFrequency: 'APP',
    phrase: scenario => `${scenario.radioCall}, cleared ${scenario.approach} approach runway ${scenario.arrivalRunway}, report established.`,
    info: scenario => [
      `Approach: ${scenario.approach}`,
      `Runway: ${scenario.arrivalRunway} (${scenario.arrivalRunwayWords})`
    ],
    generate: createBaseScenario
  },
  {
    id: 'approach-contact',
    title: 'Approach Contact',
    desc: 'Switch from center to approach',
    keywords: ['Approach', 'Handoff'],
    hints: [
      'Repeat the frequency and add your call sign.',
      'You can pronounce the frequency as numbers or using "decimal".'
    ],
    fields: [
      {
        key: 'app-contact-freq',
        label: 'Frequency',
        expected: scenario => scenario.approachFreq,
        alternatives: scenario => [
          scenario.approachFreq,
          scenario.approachFreq.replace('.', ''),
          scenario.frequencyWords.APP
        ],
        width: 'md'
      },
      {
        key: 'app-contact-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Contact approach ' },
      { type: 'field', key: 'app-contact-freq', width: 'md' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'app-contact-callsign', width: 'lg' }
    ],
    defaultFrequency: 'APP',
    phrase: scenario => `${scenario.radioCall}, contact Approach ${scenario.approachFreq}.`,
    info: scenario => [
      `Approach: ${scenario.approachFreq} (${scenario.frequencyWords.APP})`
    ],
    generate: createBaseScenario
  },
  {
    id: 'tower-contact',
    title: 'Tower Handoff',
    desc: 'Confirm the switch to tower when number one',
    keywords: ['Tower', 'Handoff'],
    hints: [
      'Repeat the frequency and mention "when number one".',
      'End with the call sign.'
    ],
    fields: [
      {
        key: 'tower-contact-freq',
        label: 'Frequency',
        expected: scenario => scenario.towerFreq,
        alternatives: scenario => [
          scenario.towerFreq,
          scenario.towerFreq.replace('.', ''),
          scenario.frequencyWords.TWR
        ],
        width: 'md'
      },
      {
        key: 'tower-contact-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Contact tower ' },
      { type: 'field', key: 'tower-contact-freq', width: 'md' },
      { type: 'text', text: ' when number one, ' },
      { type: 'field', key: 'tower-contact-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, contact Tower ${scenario.towerFreq} when number one.`,
    info: scenario => [
      `Tower frequency: ${scenario.towerFreq} (${scenario.frequencyWords.TWR})`
    ],
    generate: createBaseScenario
  },
  {
    id: 'landing-clearance',
    title: 'Landing Clearance',
    desc: 'Read back the landing clearance',
    keywords: ['Tower', 'Landing', 'Readback'],
    hints: [
      'Lead with the runway, then "cleared to land".',
      'Keep the call sign at the end.'
    ],
    fields: [
      {
        key: 'landing-runway',
        label: 'Runway',
        expected: scenario => scenario.arrivalRunway,
        alternatives: scenario => [
          scenario.arrivalRunway.replace(/^0/, ''),
          scenario.arrivalRunwayWords
        ],
        width: 'sm'
      },
      {
        key: 'landing-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Runway ' },
      { type: 'field', key: 'landing-runway', width: 'sm' },
      { type: 'text', text: ', cleared to land, ' },
      { type: 'field', key: 'landing-callsign', width: 'lg' }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.radioCall}, wind ${scenario.arrivalWindWords}, runway ${scenario.arrivalRunway} cleared to land.`,
    info: scenario => [
      `Wind: ${scenario.arrivalWind} (${scenario.arrivalWindWords})`,
      `Runway: ${scenario.arrivalRunway}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'vacate',
    title: 'Vacate Instruction',
    desc: 'Confirm runway exit and ground frequency',
    keywords: ['Tower', 'Arrival'],
    hints: [
      'Repeat the taxi route for vacating the runway.',
      'Include the ground frequency before your call sign.'
    ],
    fields: [
      {
        key: 'vacate-route',
        label: 'Taxi Route',
        expected: scenario => scenario.arrivalTaxiRoute,
        alternatives: scenario => [
          scenario.arrivalTaxiRoute,
          `via ${scenario.arrivalTaxiRoute}`
        ],
        width: 'lg'
      },
      {
        key: 'vacate-freq',
        label: 'Ground Frequency',
        expected: scenario => scenario.groundFreq,
        alternatives: scenario => [
          scenario.groundFreq,
          scenario.groundFreq.replace('.', ''),
          scenario.frequencyWords.GND
        ],
        width: 'md'
      },
      {
        key: 'vacate-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Vacate via ' },
      { type: 'field', key: 'vacate-route', width: 'lg' },
      { type: 'text', text: ', contact ground ' },
      { type: 'field', key: 'vacate-freq', width: 'md' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'vacate-callsign', width: 'lg' }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.radioCall}, vacate via ${scenario.arrivalTaxiRoute}, contact Ground ${scenario.groundFreq}.`,
    info: scenario => [
      `Taxi route: ${scenario.arrivalTaxiRoute}`,
      `Ground: ${scenario.groundFreq} (${scenario.frequencyWords.GND})`
    ],
    generate: createBaseScenario
  },
  {
    id: 'taxi-in-readback',
    title: 'Taxi-In Readback',
    desc: 'Acknowledge taxi instructions to the stand',
    keywords: ['Ground', 'Taxi', 'Arrival'],
    hints: [
      'Repeat the stand and the full route.',
      'End with your call sign.'
    ],
    fields: [
      {
        key: 'taxi-in-stand',
        label: 'Stand',
        expected: scenario => scenario.arrivalStand,
        width: 'sm'
      },
      {
        key: 'taxi-in-route',
        label: 'Route',
        expected: scenario => scenario.arrivalTaxiRoute,
        alternatives: scenario => [
          scenario.arrivalTaxiRoute,
          `via ${scenario.arrivalTaxiRoute}`
        ],
        width: 'lg'
      },
      {
        key: 'taxi-in-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Taxi to stand ' },
      { type: 'field', key: 'taxi-in-stand', width: 'sm' },
      { type: 'text', text: ' via ' },
      { type: 'field', key: 'taxi-in-route', width: 'lg' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'taxi-in-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, taxi to stand ${scenario.arrivalStand} via ${scenario.arrivalTaxiRoute}.`,
    info: scenario => [
      `Stand: ${scenario.arrivalStand}`,
      `Taxi route: ${scenario.arrivalTaxiRoute}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'mayday-vector',
    title: 'MAYDAY Vector Readback',
    desc: 'Confirm emergency heading, altitude and QNH',
    keywords: ['Emergency', 'Mayday'],
    hints: [
      'Acknowledge the heading, altitude, direct routing and QNH.',
      'Keep the call sign at the end even in emergencies.'
    ],
    fields: [
      {
        key: 'mayday-heading',
        label: 'Heading',
        expected: scenario => scenario.emergencyHeading,
        alternatives: scenario => [
          scenario.emergencyHeading,
          scenario.emergencyHeadingWords
        ],
        width: 'md'
      },
      {
        key: 'mayday-alt',
        label: 'Altitude',
        expected: scenario => scenario.altitudes.initialWords,
        alternatives: scenario => [
          scenario.altitudes.initialWords,
          scenario.altitudes.initial.toString(),
          `${scenario.altitudes.initial} feet`
        ],
        width: 'md'
      },
      {
        key: 'mayday-dest',
        label: 'Direct',
        expected: scenario => scenario.destination.city,
        alternatives: scenario => [
          scenario.destination.city,
          scenario.destination.icao,
          scenario.destination.name
        ],
        width: 'md'
      },
      {
        key: 'mayday-qnh',
        label: 'QNH',
        expected: scenario => scenario.qnh.toString(),
        alternatives: scenario => [`QNH ${scenario.qnh}`, scenario.qnhWords],
        width: 'sm'
      },
      {
        key: 'mayday-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Heading ' },
      { type: 'field', key: 'mayday-heading', width: 'md' },
      { type: 'text', text: ', climb ' },
      { type: 'field', key: 'mayday-alt', width: 'md' },
      { type: 'text', text: ', direct ' },
      { type: 'field', key: 'mayday-dest', width: 'md' },
      { type: 'text', text: ' when able, QNH ' },
      { type: 'field', key: 'mayday-qnh', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'mayday-callsign', width: 'lg' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, roger MAYDAY, fly heading ${scenario.emergencyHeading}, climb ${scenario.altitudes.initial} feet, direct ${scenario.destination.city} when able, QNH ${scenario.qnh}.`,
    info: scenario => [
      `Emergency heading: ${scenario.emergencyHeading} (${scenario.emergencyHeadingWords})`,
      `Initial altitude: ${scenario.altitudes.initial} ft`,
      `QNH: ${scenario.qnh}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'go-around-instruction',
    title: 'Go-Around Instruction',
    desc: 'Read back the published missed approach instructions',
    keywords: ['Missed Approach', 'Readback'],
    hints: [
      'Acknowledge the missed approach, altitude and frequency.',
      'State the call sign last even when workload is high.'
    ],
    fields: [
      {
        key: 'goaround-missed',
        label: 'Missed Approach',
        expected: scenario => scenario.missedApproach,
        alternatives: scenario => [
          scenario.missedApproach,
          'published missed approach'
        ],
        width: 'lg'
      },
      {
        key: 'goaround-alt',
        label: 'Altitude',
        expected: scenario => scenario.altitudes.initialWords,
        alternatives: scenario => [
          scenario.altitudes.initialWords,
          scenario.altitudes.initial.toString(),
          `${scenario.altitudes.initial} feet`
        ],
        width: 'md'
      },
      {
        key: 'goaround-freq',
        label: 'Approach Frequency',
        expected: scenario => scenario.approachFreq,
        alternatives: scenario => [
          scenario.approachFreq,
          scenario.approachFreq.replace('.', ''),
          scenario.frequencyWords.APP
        ],
        width: 'md'
      },
      {
        key: 'goaround-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Going around, ' },
      { type: 'field', key: 'goaround-missed', width: 'lg' },
      { type: 'text', text: ', climb ' },
      { type: 'field', key: 'goaround-alt', width: 'md' },
      { type: 'text', text: ', contact approach ' },
      { type: 'field', key: 'goaround-freq', width: 'md' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'goaround-callsign', width: 'lg' }
    ],
    defaultFrequency: 'APP',
    phrase: scenario => `${scenario.radioCall}, roger go-around, fly published missed approach, climb ${scenario.altitudes.initial} feet, contact Approach ${scenario.approachFreq}.`,
    info: scenario => [
      `Missed approach: ${scenario.missedApproach}`,
      `Altitude: ${scenario.altitudes.initial} ft`,
      `Approach frequency: ${scenario.approachFreq} (${scenario.frequencyWords.APP})`
    ],
    generate: createBaseScenario
  }
]

const decisionTreeLessons = [
  {
    id: 'clearance-contact',
    title: 'Delivery: Initial contact',
    desc: 'Contact clearance delivery',
    keywords: ['Delivery', 'Clearance'],
    hints: [
      'Order: unit, call sign, ATIS, destination, stand, request.',
      'Say the ATIS as a single letter.'
    ],
    fields: [
      {
        key: 'cd-atis',
        label: 'ATIS',
        expected: scenario => scenario.atisCode,
        alternatives: scenario => [
          scenario.atisCode,
          scenario.atisCode.toLowerCase(),
          `Information ${scenario.atisCode}`
        ],
        width: 'xs',
        threshold: 0.9
      },
      {
        key: 'cd-dest',
        label: 'Destination',
        expected: scenario => scenario.destination.city,
        alternatives: scenario => [scenario.destination.icao, scenario.destination.name],
        width: 'md'
      },
      {
        key: 'cd-stand',
        label: 'Stand/Gate',
        expected: scenario => scenario.stand,
        width: 'sm'
      }
    ],
    readback: [
      {
        type: 'text',
        text: scenario => `${scenario.airport.city} Delivery, ${scenario.radioCall}, information `
      },
      { type: 'field', key: 'cd-atis', width: 'xs' },
      { type: 'text', text: ', IFR to ' },
      { type: 'field', key: 'cd-dest', width: 'md' },
      { type: 'text', text: ', stand ' },
      { type: 'field', key: 'cd-stand', width: 'sm' },
      { type: 'text', text: ', request clearance.' }
    ],
    defaultFrequency: 'DEL',
    phrase: scenario => `${scenario.airport.city} Delivery, ${scenario.radioCall}, information ${scenario.atisCode}, IFR to ${scenario.destination.city}, stand ${scenario.stand}, request clearance.`,
    info: scenario => [
      `ATIS: ${scenario.atisCode}`,
      `Destination: ${scenario.destination.city} (${scenario.destination.icao})`,
      `Stand/Gate: ${scenario.stand}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'pushback-ready',
    title: 'Ready for Pushback',
    desc: 'Call ground when ready for push and start',
    keywords: ['Ground', 'Pushback'],
    hints: [
      'Address the ground unit, include your stand, then say "ready for push and start".',
      'Finish with the call sign.'
    ],
    fields: [
      {
        key: 'pushready-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      },
      {
        key: 'pushready-stand',
        label: 'Stand',
        expected: scenario => scenario.stand,
        width: 'sm'
      }
    ],
    readback: [
      { type: 'text', text: scenario => `${scenario.airport.city} Ground, ` },
      { type: 'field', key: 'pushready-callsign', width: 'lg' },
      { type: 'text', text: ', stand ' },
      { type: 'field', key: 'pushready-stand', width: 'sm' },
      { type: 'text', text: ', ready for push and start.' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.airport.city} Ground, ${scenario.radioCall}, stand ${scenario.stand}, ready for push and start.`,
    info: scenario => [
      `Stand: ${scenario.stand}`,
      `Next expected clearance: pushback approval`
    ],
    generate: createBaseScenario
  },
  {
    id: 'taxi-request',
    title: 'Taxi Request',
    desc: 'Request taxi from ground when ready',
    keywords: ['Ground', 'Taxi'],
    hints: [
      'Address the unit before your call sign and stand.',
      'Finish with "request taxi".'
    ],
    fields: [
      {
        key: 'taxi-req-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      },
      {
        key: 'taxi-req-stand',
        label: 'Stand',
        expected: scenario => scenario.stand,
        width: 'sm'
      }
    ],
    readback: [
      { type: 'text', text: scenario => `${scenario.airport.city} Ground, ` },
      { type: 'field', key: 'taxi-req-callsign', width: 'lg' },
      { type: 'text', text: ', stand ' },
      { type: 'field', key: 'taxi-req-stand', width: 'sm' },
      { type: 'text', text: ', request taxi.' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.airport.city} Ground, ${scenario.radioCall}, stand ${scenario.stand}, request taxi.`,
    info: scenario => [
      `Stand: ${scenario.stand}`,
      `Likely taxi route: ${scenario.taxiRoute}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'lineup-request',
    title: 'Ready for Departure',
    desc: 'Advise tower you are ready for departure',
    keywords: ['Tower', 'Departure'],
    hints: [
      'Include the runway and keep the message short.',
      'Finish with your call sign.'
    ],
    fields: [
      {
        key: 'lineup-req-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'lineup-req-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: scenario => `${scenario.airport.city} Tower, ` },
      { type: 'field', key: 'lineup-req-callsign', width: 'lg' },
      { type: 'text', text: ', ready for departure runway ' },
      { type: 'field', key: 'lineup-req-runway', width: 'sm' }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.airport.city} Tower, ${scenario.radioCall}, ready for departure runway ${scenario.runway}.`,
    info: scenario => [
      `Runway in use: ${scenario.runway}`,
      `Expect line-up or takeoff clearance`
    ],
    generate: createBaseScenario
  },
  {
    id: 'departure-checkin',
    title: 'Departure Check-in',
    desc: 'Initial call to departure',
    keywords: ['Departure', 'Check-in'],
    hints: [
      'Address the unit first, then state the call sign.',
      'Repeat the altitude and SID exactly as received.'
    ],
    fields: [
      {
        key: 'depcheck-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      },
      {
        key: 'depcheck-alt',
        label: 'Altitude',
        expected: scenario => scenario.altitudes.initialWords,
        alternatives: scenario => [
          scenario.altitudes.initialWords,
          scenario.altitudes.initial.toString(),
          `${scenario.altitudes.initial} feet`
        ],
        width: 'md'
      },
      {
        key: 'depcheck-sid',
        label: 'SID',
        expected: scenario => scenario.sid,
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: scenario => `${scenario.airport.city} Departure, ` },
      { type: 'field', key: 'depcheck-callsign', width: 'lg' },
      { type: 'text', text: ', passing ' },
      { type: 'field', key: 'depcheck-alt', width: 'md' },
      { type: 'text', text: ', on SID ' },
      { type: 'field', key: 'depcheck-sid', width: 'lg' }
    ],
    defaultFrequency: 'DEP',
    phrase: scenario => `${scenario.airport.city} Departure, ${scenario.radioCall}, passing ${scenario.altitudes.initialWords}, on SID ${scenario.sid}.`,
    info: scenario => [
      `Initial altitude: ${scenario.altitudes.initial} ft (${scenario.altitudes.initialWords})`,
      `SID: ${scenario.sid}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'unable-direct',
    title: 'Unable Direct',
    desc: 'Decline a direct routing and keep the SID',
    keywords: ['Departure', 'Exception'],
    hints: [
      'Say "Unable direct" followed by the waypoint.',
      'Finish with the call sign.'
    ],
    fields: [
      {
        key: 'unable-transition',
        label: 'Waypoint',
        expected: scenario => scenario.transition,
        width: 'md'
      },
      {
        key: 'unable-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'field', key: 'unable-callsign', width: 'lg' },
      { type: 'text', text: ' unable direct ' },
      { type: 'field', key: 'unable-transition', width: 'md' }
    ],
    defaultFrequency: 'DEP',
    phrase: scenario => `${scenario.radioCall}, unable direct ${scenario.transition}.`,
    info: scenario => [
      `Requested direct: ${scenario.transition}`,
      `Climb continues on SID`
    ],
    generate: createBaseScenario
  },
  {
    id: 'alt-accept',
    title: 'Accept Alternate Instruction',
    desc: 'Acknowledge ATC’s alternative plan',
    keywords: ['Interrupt', 'Compliance'],
    hints: [
      'Simply respond with your call sign followed by "wilco".',
      'Keep it concise to show you comply.'
    ],
    fields: [
      {
        key: 'alt-accept-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'field', key: 'alt-accept-callsign', width: 'lg' },
      { type: 'text', text: ' wilco.' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, alternative instruction acknowledged with "wilco".`,
    info: () => [
      'Use "wilco" to indicate you will comply with the new instruction.'
    ],
    generate: createBaseScenario
  },
  {
    id: 'alt-reject',
    title: 'Reject Alternate Instruction',
    desc: 'Request a different solution when unable',
    keywords: ['Interrupt', 'Request'],
    hints: [
      'State "negative" then what you request instead.',
      'Keep the intent short, e.g. "request vectors" or destination.'
    ],
    fields: [
      {
        key: 'alt-reject-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      },
      {
        key: 'alt-reject-intent',
        label: 'Requested Intent',
        expected: scenario => scenario.emergencyIntent,
        width: 'lg'
      }
    ],
    readback: [
      { type: 'field', key: 'alt-reject-callsign', width: 'lg' },
      { type: 'text', text: ' negative, request ' },
      { type: 'field', key: 'alt-reject-intent', width: 'lg' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, negative, request ${scenario.emergencyIntent}.`,
    info: scenario => [
      `Requested intent: ${scenario.emergencyIntent}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'continue-approach',
    title: 'Continue Approach',
    desc: 'Acknowledge a late landing clearance instruction',
    keywords: ['Tower', 'Exception'],
    hints: [
      'Keep the response short: continuing approach plus call sign.'
    ],
    fields: [
      {
        key: 'continue-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Continuing approach, ' },
      { type: 'field', key: 'continue-callsign', width: 'lg' }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.radioCall}, continue approach, expect late landing clearance.`,
    info: scenario => [`Runway in use: ${scenario.arrivalRunway}`],
    generate: createBaseScenario
  },
  {
    id: 'approach-established',
    title: 'Approach Established',
    desc: 'Report established on the localizer',
    keywords: ['Approach', 'Report'],
    hints: [
      'State the runway after saying you are established.',
      'Finish with the call sign.'
    ],
    fields: [
      {
        key: 'app-est-runway',
        label: 'Runway',
        expected: scenario => scenario.arrivalRunway,
        alternatives: scenario => [
          scenario.arrivalRunway.replace(/^0/, ''),
          scenario.arrivalRunwayWords
        ],
        width: 'sm'
      },
      {
        key: 'app-est-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'field', key: 'app-est-callsign', width: 'lg' },
      { type: 'text', text: ' established localizer ' },
      { type: 'field', key: 'app-est-runway', width: 'sm' }
    ],
    defaultFrequency: 'APP',
    phrase: scenario => `${scenario.radioCall}, established localizer runway ${scenario.arrivalRunway}.`,
    info: scenario => [
      `Runway: ${scenario.arrivalRunway} (${scenario.arrivalRunwayWords})`
    ],
    generate: createBaseScenario
  },
  {
    id: 'taxi-in-request',
    title: 'Taxi-In Request',
    desc: 'Ask ground for taxi to stand after vacating',
    keywords: ['Ground', 'Taxi-In'],
    hints: [
      'Announce runway vacated, then request taxi to your stand.',
      'Include the stand number if known.'
    ],
    fields: [
      {
        key: 'taxiin-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      },
      {
        key: 'taxiin-stand',
        label: 'Stand',
        expected: scenario => scenario.arrivalStand,
        width: 'sm'
      }
    ],
    readback: [
      { type: 'field', key: 'taxiin-callsign', width: 'lg' },
      { type: 'text', text: ' runway vacated, request taxi to stand ' },
      { type: 'field', key: 'taxiin-stand', width: 'sm' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, runway vacated, request taxi to stand ${scenario.arrivalStand}.`,
    info: scenario => [
      `Arrival stand: ${scenario.arrivalStand}`,
      `Expect taxi route: ${scenario.arrivalTaxiRoute}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'mayday',
    title: 'MAYDAY Call',
    desc: 'Declare an emergency and state intentions',
    keywords: ['Emergency', 'MAYDAY'],
    hints: [
      'Say "MAYDAY" three times, then the call sign.',
      'State the problem and your intentions clearly.'
    ],
    fields: [
      {
        key: 'mayday-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      },
      {
        key: 'mayday-problem',
        label: 'Problem',
        expected: scenario => scenario.emergencyProblem,
        width: 'lg'
      },
      {
        key: 'mayday-intent',
        label: 'Intentions',
        expected: scenario => scenario.emergencyIntent,
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'MAYDAY MAYDAY MAYDAY, ' },
      { type: 'field', key: 'mayday-callsign', width: 'lg' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'mayday-problem', width: 'lg' },
      { type: 'text', text: ', intentions ' },
      { type: 'field', key: 'mayday-intent', width: 'lg' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, Emergency scenario: ${scenario.emergencyProblem}. Declare MAYDAY with intentions ${scenario.emergencyIntent}.`,
    info: scenario => [
      `Problem: ${scenario.emergencyProblem}`,
      `Intentions: ${scenario.emergencyIntent}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'pan-pan',
    title: 'PAN PAN Call',
    desc: 'Request priority for an urgent situation',
    keywords: ['Emergency', 'PAN'],
    hints: [
      'Say "PAN PAN PAN" three times, then the call sign.',
      'Describe the problem and end with "request priority".'
    ],
    fields: [
      {
        key: 'pan-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      },
      {
        key: 'pan-problem',
        label: 'Problem',
        expected: scenario => scenario.emergencyProblem,
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'PAN PAN PAN, ' },
      { type: 'field', key: 'pan-callsign', width: 'lg' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'pan-problem', width: 'lg' },
      { type: 'text', text: ', request priority.' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, Urgent situation: ${scenario.emergencyProblem}. Declare PAN to obtain priority.`,
    info: scenario => [
      `Problem: ${scenario.emergencyProblem}`,
      'Ensure ATC knows you require priority handling.'
    ],
    generate: createBaseScenario
  },
  {
    id: 'go-around',
    title: 'Go-Around Call',
    desc: 'Declare a go-around with the missed approach',
    keywords: ['Tower', 'Missed Approach', 'Exception'],
    hints: [
      'State your call sign, then "going around".',
      'Include the missed approach instructions.'
    ],
    fields: [
      {
        key: 'goaround-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      },
      {
        key: 'goaround-missed',
        label: 'Missed Approach',
        expected: scenario => scenario.missedApproach,
        width: 'lg'
      }
    ],
    readback: [
      { type: 'field', key: 'goaround-callsign', width: 'lg' },
      { type: 'text', text: ' going around, ' },
      { type: 'field', key: 'goaround-missed', width: 'lg' }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.radioCall}, going around, ${scenario.missedApproach}.`,
    info: scenario => [
      `Missed approach: ${scenario.missedApproach}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'tcas-ra',
    title: 'TCAS RA Call',
    desc: 'Report a TCAS resolution advisory',
    keywords: ['Emergency', 'TCAS'],
    hints: [
      'Say your call sign followed by "TCAS RA, deviating".'
    ],
    fields: [
      {
        key: 'tcas-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'field', key: 'tcas-callsign', width: 'lg' },
      { type: 'text', text: ' TCAS RA, deviating.' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall} experiences a TCAS RA. Report it immediately.`,
    info: () => [
      'Inform ATC that you are following the RA.',
      'Expect to report when clear of conflict.'
    ],
    generate: createBaseScenario
  },
  {
    id: 'tcas-resume',
    title: 'TCAS Clear of Conflict',
    desc: 'Report returning to your clearance after an RA',
    keywords: ['Emergency', 'TCAS'],
    hints: [
      'State your call sign followed by "clear of conflict, returning to clearance".'
    ],
    fields: [
      {
        key: 'tcas-resume-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'field', key: 'tcas-resume-callsign', width: 'lg' },
      { type: 'text', text: ' clear of conflict, returning to clearance.' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, report clear of conflict and returning to clearance.`,
    info: () => [
      'Advise ATC once the RA is resolved so normal control can resume.'
    ],
    generate: createBaseScenario
  },
  {
    id: 'standby',
    title: 'Standby Call',
    desc: 'Pause the exchange when busy',
    keywords: ['Interrupt'],
    hints: [
      'Say your call sign followed by "standby" to pause the conversation briefly.'
    ],
    fields: [
      {
        key: 'standby-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'field', key: 'standby-callsign', width: 'lg' },
      { type: 'text', text: ' standby.' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, standby.`,
    info: () => [
      'Use sparingly when workload requires a short pause before responding.'
    ],
    generate: createBaseScenario
  }
]

const fullFlightScenario = createScenarioSeries()

export function seedFullFlightScenario(scenario: Scenario | null) {
  if (scenario) {
    fullFlightScenario.setScenario(scenario)
  } else {
    fullFlightScenario.setScenario(null)
  }
}

export function peekFullFlightScenario(): Scenario | null {
  return fullFlightScenario.peek()
}

const makeFullFlightGenerator = (reset = false) => () => {
  if (reset) {
    fullFlightScenario.reset()
  }
  return fullFlightScenario()
}

const fullFlightLessons = [
  {
    id: 'full-clearance-contact',
    title: 'Delivery Contact',
    desc: 'Start the flight with clearance delivery',
    keywords: ['Delivery', 'Flow'],
    hints: [
      'Use the full opening: unit, call sign, ATIS, destination, stand, request.'
    ],
    fields: [
      {
        key: 'full-cd-atis',
        label: 'ATIS',
        expected: scenario => scenario.atisCode,
        alternatives: scenario => [
          scenario.atisCode,
          scenario.atisCode.toLowerCase(),
          `Information ${scenario.atisCode}`
        ],
        width: 'xs',
        threshold: 0.9
      },
      {
        key: 'full-cd-dest',
        label: 'Destination',
        expected: scenario => scenario.destination.city,
        alternatives: scenario => [scenario.destination.icao, scenario.destination.name],
        width: 'md'
      },
      {
        key: 'full-cd-stand',
        label: 'Stand',
        expected: scenario => scenario.stand,
        width: 'sm'
      }
    ],
    readback: [
      {
        type: 'text',
        text: scenario => `${scenario.airport.city} Delivery, ${scenario.radioCall}, information `
      },
      { type: 'field', key: 'full-cd-atis', width: 'xs' },
      { type: 'text', text: ', IFR to ' },
      { type: 'field', key: 'full-cd-dest', width: 'md' },
      { type: 'text', text: ', stand ' },
      { type: 'field', key: 'full-cd-stand', width: 'sm' },
      { type: 'text', text: ', request clearance.' }
    ],
    defaultFrequency: 'DEL',
    phrase: scenario => `${scenario.airport.city} Delivery, ${scenario.radioCall}, information ${scenario.atisCode}, IFR to ${scenario.destination.city}, stand ${scenario.stand}, request clearance.`,
    info: scenario => [
      `ATIS: ${scenario.atisCode}`,
      `Destination: ${scenario.destination.city} (${scenario.destination.icao})`,
      `Stand: ${scenario.stand}`
    ],
    generate: makeFullFlightGenerator(true)
  },
  {
    id: 'full-clearance-readback',
    title: 'Clearance Readback',
    desc: 'Confirm the IFR clearance in full',
    keywords: ['Delivery', 'Readback', 'Flow'],
    hints: [
      'Order: destination – SID – runway – altitude – squawk.'
    ],
    fields: [
      {
        key: 'full-clr-dest',
        label: 'Destination',
        expected: scenario => scenario.destination.city,
        alternatives: scenario => [scenario.destination.icao, scenario.destination.name],
        width: 'md'
      },
      {
        key: 'full-clr-sid',
        label: 'SID',
        expected: scenario => scenario.sid,
        width: 'lg'
      },
      {
        key: 'full-clr-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'full-clr-alt',
        label: 'Initial Altitude',
        expected: scenario => scenario.altitudes.initialWords,
        alternatives: scenario => [
          scenario.altitudes.initial.toString(),
          `${scenario.altitudes.initial} feet`
        ],
        width: 'md'
      },
      {
        key: 'full-clr-squawk',
        label: 'Squawk',
        expected: scenario => scenario.squawkWords,
        alternatives: scenario => [scenario.squawk, scenario.squawk.split('').join(' ')],
        width: 'md'
      }
    ],
    readback: [
      { type: 'text', text: scenario => `${scenario.radioCall} cleared ` },
      { type: 'field', key: 'full-clr-dest', width: 'md' },
      { type: 'text', text: ' via ' },
      { type: 'field', key: 'full-clr-sid', width: 'lg' },
      { type: 'text', text: ', runway ' },
      { type: 'field', key: 'full-clr-runway', width: 'sm' },
      { type: 'text', text: ', climb ' },
      { type: 'field', key: 'full-clr-alt', width: 'md' },
      { type: 'text', text: ', squawk ' },
      { type: 'field', key: 'full-clr-squawk', width: 'md' }
    ],
    defaultFrequency: 'DEL',
    phrase: scenario => `${scenario.radioCall}, cleared to ${scenario.destination.city} via ${scenario.sid}, runway ${scenario.runway}, climb ${scenario.altitudes.initial} feet, squawk ${scenario.squawk}.`,
    info: scenario => [
      `SID: ${scenario.sid} (${scenario.transition})`,
      `Initial altitude: ${scenario.altitudes.initial} ft`,
      `Squawk: ${scenario.squawk} (${scenario.squawkWords})`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-pushback',
    title: 'Push & Start',
    desc: 'Acknowledge the pushback clearance',
    keywords: ['Ground', 'Pushback', 'Flow'],
    hints: [
      'Repeat the runway direction and QNH, call sign at the end.'
    ],
    fields: [
      {
        key: 'full-push-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'full-push-qnh',
        label: 'QNH',
        expected: scenario => scenario.qnh.toString(),
        alternatives: scenario => [`QNH ${scenario.qnh}`, scenario.qnhWords],
        width: 'sm'
      },
      {
        key: 'full-push-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Push and start approved, facing runway ' },
      { type: 'field', key: 'full-push-runway', width: 'sm' },
      { type: 'text', text: ', QNH ' },
      { type: 'field', key: 'full-push-qnh', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'full-push-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, push and start approved, facing runway ${scenario.runway}. QNH ${scenario.qnh}.`,
    info: scenario => [
      `Stand: ${scenario.stand}`,
      `Ground frequency: ${scenario.groundFreq} (${scenario.frequencyWords.GND})`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-taxi',
    title: 'Taxi Clearance',
    desc: 'Read back the taxi clearance on the same scenario',
    keywords: ['Ground', 'Taxi', 'Flow'],
    hints: [
      'Repeat the runway and full taxi route, including the hold short.'
    ],
    fields: [
      {
        key: 'full-taxi-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'full-taxi-route',
        label: 'Route',
        expected: scenario => scenario.taxiRoute,
        alternatives: scenario => [scenario.taxiRoute, `via ${scenario.taxiRoute}`],
        width: 'lg'
      },
      {
        key: 'full-taxi-hold',
        label: 'Hold Short',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'full-taxi-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Taxi to runway ' },
      { type: 'field', key: 'full-taxi-runway', width: 'sm' },
      { type: 'text', text: ' via ' },
      { type: 'field', key: 'full-taxi-route', width: 'lg' },
      { type: 'text', text: ', holding short runway ' },
      { type: 'field', key: 'full-taxi-hold', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'full-taxi-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, taxi to runway ${scenario.runway} via ${scenario.taxiRoute}, hold short runway ${scenario.runway}.`,
    info: scenario => [
      `Taxi route: ${scenario.taxiRoute}`,
      `Hold short: runway ${scenario.runway}`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-tower-contact',
    title: 'Tower Handoff',
    desc: 'Confirm the switch to tower when number one',
    keywords: ['Tower', 'Handoff', 'Flow'],
    hints: [
      'Read back the frequency, mention "when number one" and end with the call sign.'
    ],
    fields: [
      {
        key: 'full-tower-freq',
        label: 'Frequency',
        expected: scenario => scenario.towerFreq,
        alternatives: scenario => [
          scenario.towerFreq,
          scenario.towerFreq.replace('.', ''),
          scenario.frequencyWords.TWR
        ],
        width: 'md'
      },
      {
        key: 'full-tower-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Contact tower ' },
      { type: 'field', key: 'full-tower-freq', width: 'md' },
      { type: 'text', text: ' when number one, ' },
      { type: 'field', key: 'full-tower-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, contact Tower ${scenario.towerFreq} when number one.`,
    info: scenario => [
      `Tower frequency: ${scenario.towerFreq} (${scenario.frequencyWords.TWR})`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-lineup',
    title: 'Line Up and Wait',
    desc: 'Acknowledge the line-up clearance',
    keywords: ['Tower', 'Line Up', 'Flow'],
    hints: [
      'Repeat the runway and add "line up and wait".'
    ],
    fields: [
      {
        key: 'full-lineup-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'full-lineup-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Runway ' },
      { type: 'field', key: 'full-lineup-runway', width: 'sm' },
      { type: 'text', text: ', line up and wait, ' },
      { type: 'field', key: 'full-lineup-callsign', width: 'lg' }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.radioCall}, line up and wait runway ${scenario.runway}.`,
    info: scenario => [
      `Tower: ${scenario.towerFreq} (${scenario.frequencyWords.TWR})`,
      `Line-up: runway ${scenario.runway}`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-takeoff',
    title: 'Takeoff Clearance',
    desc: 'Acknowledge the takeoff clearance',
    keywords: ['Tower', 'Departure', 'Flow'],
    hints: [
      'Order: runway – cleared for takeoff – call sign.'
    ],
    fields: [
      {
        key: 'full-tko-runway',
        label: 'Runway',
        expected: scenario => scenario.runway,
        alternatives: scenario => [scenario.runway.replace(/^0/, ''), scenario.runwayWords],
        width: 'sm'
      },
      {
        key: 'full-tko-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Runway ' },
      { type: 'field', key: 'full-tko-runway', width: 'sm' },
      { type: 'text', text: ', cleared for takeoff, ' },
      { type: 'field', key: 'full-tko-callsign', width: 'lg' }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.radioCall}, wind ${scenario.windWords}, runway ${scenario.runway}, cleared for takeoff.`,
    info: scenario => [
      `Wind: ${scenario.wind} (${scenario.windWords})`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-departure-handoff',
    title: 'Handoff to Departure',
    desc: 'Switch to departure after takeoff',
    keywords: ['Departure', 'Handoff', 'Flow'],
    hints: [
      'Read back the frequency exactly and include your call sign.'
    ],
    fields: [
      {
        key: 'full-dep-freq',
        label: 'Frequency',
        expected: scenario => scenario.departureFreq,
        alternatives: scenario => [
          scenario.departureFreq,
          scenario.departureFreq.replace('.', ''),
          scenario.frequencyWords.DEP
        ],
        width: 'md'
      },
      {
        key: 'full-dep-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Contact departure ' },
      { type: 'field', key: 'full-dep-freq', width: 'md' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'full-dep-callsign', width: 'lg' }
    ],
    defaultFrequency: 'DEP',
    phrase: scenario => `${scenario.radioCall}, contact departure ${scenario.departureFreq}.`,
    info: scenario => [
      `Departure frequency: ${scenario.departureFreq} (${scenario.frequencyWords.DEP})`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-departure-checkin',
    title: 'Departure Check-in',
    desc: 'Call departure with altitude and SID',
    keywords: ['Departure', 'Flow'],
    hints: [
      'Address departure first, then your call sign, altitude and SID.'
    ],
    fields: [
      {
        key: 'full-depcheck-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      },
      {
        key: 'full-depcheck-alt',
        label: 'Altitude',
        expected: scenario => scenario.altitudes.initialWords,
        alternatives: scenario => [
          scenario.altitudes.initialWords,
          scenario.altitudes.initial.toString(),
          `${scenario.altitudes.initial} feet`
        ],
        width: 'md'
      },
      {
        key: 'full-depcheck-sid',
        label: 'SID',
        expected: scenario => scenario.sid,
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: scenario => `${scenario.airport.city} Departure, ` },
      { type: 'field', key: 'full-depcheck-callsign', width: 'lg' },
      { type: 'text', text: ', passing ' },
      { type: 'field', key: 'full-depcheck-alt', width: 'md' },
      { type: 'text', text: ', on SID ' },
      { type: 'field', key: 'full-depcheck-sid', width: 'lg' }
    ],
    defaultFrequency: 'DEP',
    phrase: scenario => `${scenario.airport.city} Departure, ${scenario.radioCall}, passing ${scenario.altitudes.initialWords}, on SID ${scenario.sid}.`,
    info: scenario => [
      `Initial altitude: ${scenario.altitudes.initial} ft`,
      `SID: ${scenario.sid}`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-climb',
    title: 'Climb & Direct',
    desc: 'Confirm the climb and direct instruction',
    keywords: ['Departure', 'Climb', 'Flow'],
    hints: [
      'Start with "Climb", then the altitude and any direct clearance.'
    ],
    fields: [
      {
        key: 'full-climb-alt',
        label: 'Altitude',
        expected: scenario => scenario.altitudes.climbWords,
        alternatives: scenario => [
          scenario.altitudes.climbWords,
          scenario.altitudes.climb.toString(),
          `${scenario.altitudes.climb} feet`
        ],
        width: 'md'
      },
      {
        key: 'full-climb-direct',
        label: 'Direct',
        expected: scenario => scenario.transition,
        width: 'md'
      },
      {
        key: 'full-climb-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Climb ' },
      { type: 'field', key: 'full-climb-alt', width: 'md' },
      { type: 'text', text: ', direct ' },
      { type: 'field', key: 'full-climb-direct', width: 'md' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'full-climb-callsign', width: 'lg' }
    ],
    defaultFrequency: 'DEP',
    phrase: scenario => `${scenario.radioCall}, climb ${scenario.altitudes.climb} feet, proceed direct ${scenario.transition}.`,
    info: scenario => [
      `Climb altitude: ${scenario.altitudes.climb} ft (${scenario.altitudes.climbWords})`,
      `Waypoint: ${scenario.transition}`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-descent',
    title: 'Descent Clearance',
    desc: 'Read back STAR, transition and QNH',
    keywords: ['Approach', 'Descent', 'Flow'],
    hints: [
      'Mention the STAR, transition and QNH before the call sign.'
    ],
    fields: [
      {
        key: 'full-descent-star',
        label: 'STAR',
        expected: scenario => scenario.arrivalStar,
        width: 'lg'
      },
      {
        key: 'full-descent-transition',
        label: 'Transition',
        expected: scenario => scenario.arrivalTransition,
        width: 'md'
      },
      {
        key: 'full-descent-qnh',
        label: 'QNH',
        expected: scenario => scenario.arrivalQnh.toString(),
        alternatives: scenario => [
          scenario.arrivalQnh.toString(),
          `QNH ${scenario.arrivalQnh}`,
          scenario.arrivalQnhWords
        ],
        width: 'sm'
      },
      {
        key: 'full-descent-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Descend via ' },
      { type: 'field', key: 'full-descent-star', width: 'lg' },
      { type: 'text', text: ' ' },
      { type: 'field', key: 'full-descent-transition', width: 'md' },
      { type: 'text', text: ', QNH ' },
      { type: 'field', key: 'full-descent-qnh', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'full-descent-callsign', width: 'lg' }
    ],
    defaultFrequency: 'APP',
    phrase: scenario => `${scenario.radioCall}, descend via ${scenario.arrivalStar} ${scenario.arrivalTransition}, QNH ${scenario.arrivalQnh}.`,
    info: scenario => [
      `STAR: ${scenario.arrivalStar}`,
      `Transition: ${scenario.arrivalTransition}`,
      `Arrival QNH: ${scenario.arrivalQnh}`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-approach',
    title: 'Approach Clearance',
    desc: 'Confirm approach type and runway',
    keywords: ['Approach', 'Readback', 'Flow'],
    hints: [
      'Say "Cleared" followed by the approach and runway.'
    ],
    fields: [
      {
        key: 'full-app-type',
        label: 'Approach',
        expected: scenario => scenario.approach,
        width: 'lg'
      },
      {
        key: 'full-app-runway',
        label: 'Runway',
        expected: scenario => scenario.arrivalRunway,
        alternatives: scenario => [scenario.arrivalRunway.replace(/^0/, ''), scenario.arrivalRunwayWords],
        width: 'sm'
      },
      {
        key: 'full-app-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Cleared ' },
      { type: 'field', key: 'full-app-type', width: 'lg' },
      { type: 'text', text: ' approach runway ' },
      { type: 'field', key: 'full-app-runway', width: 'sm' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'full-app-callsign', width: 'lg' }
    ],
    defaultFrequency: 'APP',
    phrase: scenario => `${scenario.radioCall}, cleared ${scenario.approach} approach runway ${scenario.arrivalRunway}, report established.`,
    info: scenario => [
      `Approach: ${scenario.approach}`,
      `Runway: ${scenario.arrivalRunway} (${scenario.arrivalRunwayWords})`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-landing',
    title: 'Landing Clearance',
    desc: 'Confirm the landing clearance',
    keywords: ['Tower', 'Landing', 'Flow'],
    hints: [
      'Lead with the runway, then "cleared to land".'
    ],
    fields: [
      {
        key: 'full-landing-runway',
        label: 'Runway',
        expected: scenario => scenario.arrivalRunway,
        alternatives: scenario => [scenario.arrivalRunway.replace(/^0/, ''), scenario.arrivalRunwayWords],
        width: 'sm'
      },
      {
        key: 'full-landing-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Runway ' },
      { type: 'field', key: 'full-landing-runway', width: 'sm' },
      { type: 'text', text: ', cleared to land, ' },
      { type: 'field', key: 'full-landing-callsign', width: 'lg' }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario => `${scenario.radioCall}, wind ${scenario.arrivalWindWords}, runway ${scenario.arrivalRunway} cleared to land.`,
    info: scenario => [
      `Wind: ${scenario.arrivalWind} (${scenario.arrivalWindWords})`
    ],
    generate: makeFullFlightGenerator()
  },
  {
    id: 'full-taxi-in',
    title: 'Taxi-In Clearance',
    desc: 'Read back taxi instructions to the stand',
    keywords: ['Ground', 'Taxi', 'Arrival'],
    hints: [
      'Repeat the stand and full route, end with the call sign.'
    ],
    fields: [
      {
        key: 'full-taxiin-stand',
        label: 'Stand',
        expected: scenario => scenario.arrivalStand,
        width: 'sm'
      },
      {
        key: 'full-taxiin-route',
        label: 'Route',
        expected: scenario => scenario.arrivalTaxiRoute,
        alternatives: scenario => [scenario.arrivalTaxiRoute, `via ${scenario.arrivalTaxiRoute}`],
        width: 'lg'
      },
      {
        key: 'full-taxiin-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        width: 'lg'
      }
    ],
    readback: [
      { type: 'text', text: 'Taxi to stand ' },
      { type: 'field', key: 'full-taxiin-stand', width: 'sm' },
      { type: 'text', text: ' via ' },
      { type: 'field', key: 'full-taxiin-route', width: 'lg' },
      { type: 'text', text: ', ' },
      { type: 'field', key: 'full-taxiin-callsign', width: 'lg' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.radioCall}, taxi to stand ${scenario.arrivalStand} via ${scenario.arrivalTaxiRoute}.`,
    info: scenario => [
      `Stand: ${scenario.arrivalStand}`,
      `Taxi route: ${scenario.arrivalTaxiRoute}`
    ],
    generate: makeFullFlightGenerator()
  }
]

/* ────────────────────────────────────────────────────────────
 *  ABNORMAL COMMS
 * ──────────────────────────────────────────────────────────── */

const abnormalCommsLessons = [
  {
    id: 'conditional-crossing',
    title: 'Conditional Runway Crossing',
    desc: 'Read back a conditional clearance with the condition included',
    keywords: ['Conditional', 'Runway', 'Crossing', 'Safety'],
    hints: [
      'Conditional clearances MUST be read back with the condition. ROGER/WILCO is NOT enough.',
      'The word "behind" must appear at the END of your readback as confirmation.',
      'Never cross until the traffic has passed — you must visually identify the traffic first.'
    ],
    fields: [
      {
        key: 'traffic',
        label: 'Traffic',
        expected: () => 'departing 737',
        alternatives: () => ['departing 737', 'departing Boeing 737', 'the departing 737'],
        threshold: 0.7,
        placeholder: 'e.g. departing 737',
        width: 'md' as const
      },
      {
        key: 'runway',
        label: 'Runway',
        expected: (scenario: Scenario) => scenario.runway,
        alternatives: (scenario: Scenario) => [scenario.runway, scenario.runwayWords],
        placeholder: 'e.g. 09',
        width: 'sm' as const
      },
      {
        key: 'intersection',
        label: 'Taxiway',
        expected: (scenario: Scenario) => scenario.taxiRoute.split(' ')[0],
        placeholder: 'e.g. E3',
        width: 'sm' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Behind ' },
      { type: 'field' as const, key: 'traffic', width: 'md' as const },
      { type: 'text' as const, text: ', cross runway ' },
      { type: 'field' as const, key: 'runway', width: 'sm' as const },
      { type: 'text' as const, text: ' at ' },
      { type: 'field' as const, key: 'intersection', width: 'sm' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, behind, ${scenario.radioCall}` },
    ],
    defaultFrequency: 'GND',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, behind the departing 737, cross runway ${scenario.runwayWords} at ${scenario.taxiRoute.split(' ')[0]}, behind.`,
    info: (scenario: Scenario) => [
      `Runway: ${scenario.runway}`,
      `Taxiway: ${scenario.taxiRoute.split(' ')[0]}`,
      'ICAO: Conditional clearances MUST include the condition in readback.',
    ],
    generate: createBaseScenario
  },
  {
    id: 'complex-holding',
    title: 'Complex Holding Pattern',
    desc: 'Read back a full holding clearance with 6 elements',
    keywords: ['Holding', 'Pattern', 'Enroute'],
    hints: [
      'Holding clearances are the most information-dense single ATC transmission.',
      '6 elements: direction from fix, fix name, inbound course, turn direction, leg time, EFC time.',
      'If you miss any element, request "say again" — never guess at a holding clearance.'
    ],
    fields: [
      {
        key: 'direction',
        label: 'Direction',
        expected: () => 'east',
        alternatives: () => ['east', 'west', 'north', 'south'],
        threshold: 0.8,
        placeholder: 'e.g. east',
        width: 'sm' as const
      },
      {
        key: 'fix',
        label: 'Fix',
        expected: (scenario: Scenario) => scenario.holdingFix,
        placeholder: 'e.g. BARDI',
        width: 'md' as const
      },
      {
        key: 'inbound',
        label: 'Inbound course',
        expected: (scenario: Scenario) => scenario.holdingInbound,
        placeholder: 'e.g. 270',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'turn',
        label: 'Turn direction',
        expected: (scenario: Scenario) => scenario.holdingTurn,
        alternatives: (scenario: Scenario) => [scenario.holdingTurn],
        placeholder: 'right or left',
        width: 'sm' as const
      },
      {
        key: 'leg-time',
        label: 'Leg time (min)',
        expected: (scenario: Scenario) => scenario.holdingLegTime,
        placeholder: 'e.g. 1',
        width: 'xs' as const
      },
      {
        key: 'efc',
        label: 'EFC time',
        expected: (scenario: Scenario) => scenario.holdingEfc,
        placeholder: 'e.g. 1745',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Hold ' },
      { type: 'field' as const, key: 'direction', width: 'sm' as const },
      { type: 'text' as const, text: ' of ' },
      { type: 'field' as const, key: 'fix', width: 'md' as const },
      { type: 'text' as const, text: ', inbound ' },
      { type: 'field' as const, key: 'inbound', width: 'sm' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'turn', width: 'sm' as const },
      { type: 'text' as const, text: ' turns, ' },
      { type: 'field' as const, key: 'leg-time', width: 'xs' as const },
      { type: 'text' as const, text: ' minute legs, expect further clearance ' },
      { type: 'field' as const, key: 'efc', width: 'sm' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall}` },
    ],
    defaultFrequency: 'CTR',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, hold east of ${scenario.holdingFix}, inbound course ${scenario.holdingInbound}, ${scenario.holdingTurn} turns, ${scenario.holdingLegTime} minute legs, expect further clearance ${scenario.holdingEfc}.`,
    info: (scenario: Scenario) => [
      `Fix: ${scenario.holdingFix}, Direction: east`,
      `Inbound: ${scenario.holdingInbound}, Turns: ${scenario.holdingTurn}`,
      `Legs: ${scenario.holdingLegTime} min, EFC: ${scenario.holdingEfc}Z`,
    ],
    generate: createBaseScenario
  },
  {
    id: 'amended-departure',
    title: 'Amended Departure Clearance',
    desc: 'Read back an amended clearance with 6 changed elements',
    keywords: ['Amended', 'Clearance', 'Departure'],
    hints: [
      'Amended clearances replace parts of your original clearance — read back ALL elements.',
      'Key items: destination, SID, altitude restriction, expected altitude, departure frequency, squawk.',
      'If unsure about any element, request "say again" before reading back.'
    ],
    fields: [
      {
        key: 'destination',
        label: 'Destination',
        expected: (scenario: Scenario) => scenario.destination.name,
        alternatives: (scenario: Scenario) => [
          scenario.destination.name,
          scenario.destination.icao,
          scenario.destination.city,
        ],
        threshold: 0.7,
        placeholder: 'e.g. Amsterdam Schiphol',
        width: 'lg' as const
      },
      {
        key: 'sid',
        label: 'SID',
        expected: (scenario: Scenario) => scenario.sid,
        placeholder: 'e.g. TOBAK 5Q',
        width: 'md' as const
      },
      {
        key: 'altitude',
        label: 'Maintain altitude',
        expected: (scenario: Scenario) => scenario.altitudes.initial.toString(),
        alternatives: (scenario: Scenario) => [
          scenario.altitudes.initial.toString(),
          scenario.altitudes.initialWords,
        ],
        placeholder: 'e.g. 5000',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'expect-alt',
        label: 'Expect altitude',
        expected: (scenario: Scenario) => scenario.altitudes.climb.toString(),
        alternatives: (scenario: Scenario) => [
          scenario.altitudes.climb.toString(),
          scenario.altitudes.climbWords,
        ],
        placeholder: 'e.g. 7000',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'dep-freq',
        label: 'Departure freq',
        expected: (scenario: Scenario) => scenario.departureFreq,
        placeholder: 'e.g. 125.350',
        width: 'md' as const
      },
      {
        key: 'squawk',
        label: 'Squawk',
        expected: (scenario: Scenario) => scenario.squawk,
        placeholder: 'e.g. 4521',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Cleared to ' },
      { type: 'field' as const, key: 'destination', width: 'lg' as const },
      { type: 'text' as const, text: ' via ' },
      { type: 'field' as const, key: 'sid', width: 'md' as const },
      { type: 'text' as const, text: ' departure, climb via SID except maintain ' },
      { type: 'field' as const, key: 'altitude', width: 'sm' as const },
      { type: 'text' as const, text: ', expect ' },
      { type: 'field' as const, key: 'expect-alt', width: 'sm' as const },
      { type: 'text' as const, text: ' ten minutes after departure, departure ' },
      { type: 'field' as const, key: 'dep-freq', width: 'md' as const },
      { type: 'text' as const, text: ', squawk ' },
      { type: 'field' as const, key: 'squawk', width: 'sm' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall}` },
    ],
    defaultFrequency: 'DEL',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, amended clearance: cleared to ${scenario.destination.name} via ${scenario.sid} departure, climb via SID except maintain ${scenario.altitudes.initialWords}, expect ${scenario.altitudes.climbWords} ten minutes after departure, departure frequency ${scenario.departureFreq}, squawk ${scenario.squawkWords}.`,
    info: (scenario: Scenario) => [
      `Destination: ${scenario.destination.name}`,
      `SID: ${scenario.sid}, Maintain: ${scenario.altitudes.initial}, Expect: ${scenario.altitudes.climb}`,
      `Departure: ${scenario.departureFreq}, Squawk: ${scenario.squawk}`,
    ],
    generate: createBaseScenario
  },
  {
    id: 'speed-then-altitude',
    title: 'Speed Then Altitude',
    desc: 'Execute sequential instructions in the correct order',
    keywords: ['Speed', 'Descent', 'Sequential'],
    hints: [
      'The word "then" means SEQUENTIAL — do the first instruction FIRST.',
      'Here: reduce speed first, THEN begin descent. Not simultaneously.',
      'Common mistake on VATSIM: starting descent immediately while still fast.'
    ],
    fields: [
      {
        key: 'speed',
        label: 'Speed',
        expected: (scenario: Scenario) => scenario.speedRestriction.toString(),
        alternatives: (scenario: Scenario) => [
          scenario.speedRestriction.toString(),
          scenario.speedRestrictionWords,
        ],
        placeholder: 'e.g. 210',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'level',
        label: 'Flight level / Altitude',
        expected: (scenario: Scenario) => scenario.approachAltitude.toString(),
        alternatives: (scenario: Scenario) => [
          scenario.approachAltitude.toString(),
          scenario.approachAltitudeWords,
        ],
        placeholder: 'e.g. 5000',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Reduce speed ' },
      { type: 'field' as const, key: 'speed', width: 'sm' as const },
      { type: 'text' as const, text: ', then descend ' },
      { type: 'field' as const, key: 'level', width: 'sm' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall}` },
    ],
    defaultFrequency: 'APP',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, reduce speed ${scenario.speedRestrictionWords}, then descend and maintain ${scenario.approachAltitudeWords}.`,
    info: (scenario: Scenario) => [
      `Speed: ${scenario.speedRestriction} knots FIRST`,
      `Then descend to: ${scenario.approachAltitude} ft`,
      '"Then" = sequential. Speed reduction must be completed before descent.',
    ],
    generate: createBaseScenario
  },
  {
    id: 'immediate-traffic',
    title: 'Immediate Traffic Avoidance',
    desc: 'Respond to an urgent traffic avoidance instruction',
    keywords: ['Traffic', 'Immediate', 'Avoidance', 'Urgent'],
    hints: [
      '"IMMEDIATELY" means execute the turn WHILE reading back — don\'t wait.',
      'The traffic information (clock position, distance, direction) is advisory only.',
      'The mandatory part is the turn direction and heading — get that right.'
    ],
    fields: [
      {
        key: 'turn',
        label: 'Turn direction',
        expected: () => 'left',
        alternatives: () => ['left', 'Left'],
        placeholder: 'left or right',
        width: 'sm' as const
      },
      {
        key: 'heading',
        label: 'Heading',
        expected: (scenario: Scenario) => scenario.vectorHeading,
        alternatives: (scenario: Scenario) => [
          scenario.vectorHeading,
          scenario.vectorHeadingWords,
        ],
        placeholder: 'e.g. 270',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Turn ' },
      { type: 'field' as const, key: 'turn', width: 'sm' as const },
      { type: 'text' as const, text: ' immediately heading ' },
      { type: 'field' as const, key: 'heading', width: 'sm' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall}` },
    ],
    defaultFrequency: 'APP',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, turn left IMMEDIATELY heading ${scenario.vectorHeadingWords}, traffic 12 o'clock, 3 miles, opposite direction, same level.`,
    info: (scenario: Scenario) => [
      `Turn: LEFT, Heading: ${scenario.vectorHeading}`,
      'IMMEDIATELY = execute while reading back, do not delay.',
      'Traffic info is situational awareness only — the heading is the instruction.',
    ],
    generate: createBaseScenario
  },
  {
    id: 'multiple-crossing-restrictions',
    title: 'Multiple STAR Crossing Restrictions',
    desc: 'Read back different restriction types at different fixes',
    keywords: ['STAR', 'Crossing', 'Restrictions', 'Descent'],
    hints: [
      'Pay attention to the restriction TYPE: "at or above" vs "at" vs "at or below".',
      'Different fixes can have different restriction types — read back each correctly.',
      'Common error: saying "at" when ATC said "at or above" — changes the constraint entirely.'
    ],
    fields: [
      {
        key: 'fix1',
        label: 'Fix 1',
        expected: (scenario: Scenario) => scenario.crossingFix1,
        placeholder: 'e.g. LIPSO',
        width: 'md' as const
      },
      {
        key: 'restriction1',
        label: 'Restriction type',
        expected: (scenario: Scenario) => scenario.crossingRestriction1,
        alternatives: (scenario: Scenario) => [scenario.crossingRestriction1],
        threshold: 0.8,
        placeholder: 'at or above / at / at or below',
        width: 'lg' as const
      },
      {
        key: 'alt1',
        label: 'Altitude 1',
        expected: (scenario: Scenario) => scenario.crossingAlt1,
        alternatives: (scenario: Scenario) => [scenario.crossingAlt1, scenario.crossingAlt1Words],
        placeholder: 'e.g. 10000',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'fix2',
        label: 'Fix 2',
        expected: (scenario: Scenario) => scenario.crossingFix2,
        placeholder: 'e.g. VAMPS',
        width: 'md' as const
      },
      {
        key: 'alt2',
        label: 'Altitude 2',
        expected: (scenario: Scenario) => scenario.crossingAlt2,
        alternatives: (scenario: Scenario) => [scenario.crossingAlt2, scenario.crossingAlt2Words],
        placeholder: 'e.g. 6000',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Descend via STAR, cross ' },
      { type: 'field' as const, key: 'fix1', width: 'md' as const },
      { type: 'text' as const, text: ' ' },
      { type: 'field' as const, key: 'restriction1', width: 'lg' as const },
      { type: 'text' as const, text: ' ' },
      { type: 'field' as const, key: 'alt1', width: 'sm' as const },
      { type: 'text' as const, text: ', cross ' },
      { type: 'field' as const, key: 'fix2', width: 'md' as const },
      { type: 'text' as const, text: ' at ' },
      { type: 'field' as const, key: 'alt2', width: 'sm' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall}` },
    ],
    defaultFrequency: 'CTR',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, descend via the STAR, cross ${scenario.crossingFix1} ${scenario.crossingRestriction1} ${scenario.crossingAlt1Words}, cross ${scenario.crossingFix2} at ${scenario.crossingAlt2Words}.`,
    info: (scenario: Scenario) => [
      `Fix 1: ${scenario.crossingFix1} — ${scenario.crossingRestriction1} ${scenario.crossingAlt1}`,
      `Fix 2: ${scenario.crossingFix2} — at ${scenario.crossingAlt2}`,
      'Different restriction types: "at or above" ≠ "at" ≠ "at or below"',
    ],
    generate: createBaseScenario
  },
  {
    id: 'tcas-ra-override',
    title: 'TCAS RA Override',
    desc: 'Reject an ATC instruction due to TCAS Resolution Advisory',
    keywords: ['TCAS', 'RA', 'Conflict', 'Override'],
    hints: [
      'When TCAS RA conflicts with ATC, you MUST follow TCAS. Reject ATC with "Unable, TCAS RA".',
      'After the RA resolves: report "Clear of conflict, returning to [altitude]".',
      'This is mandatory — ATC understands and will re-sequence. Never follow ATC over TCAS.'
    ],
    fields: [
      {
        key: 'rejection',
        label: 'Reject ATC instruction',
        expected: () => 'Unable, TCAS RA',
        alternatives: () => [
          'Unable, TCAS RA',
          'Unable TCAS RA',
          'unable, TCAS RA',
          'Unable, TCAS resolution advisory',
        ],
        threshold: 0.7,
        placeholder: 'e.g. Unable, TCAS RA',
        width: 'lg' as const
      },
      {
        key: 'resolution',
        label: 'After RA clears',
        expected: (scenario: Scenario) => `Clear of conflict, returning to ${scenario.altitudes.climb}`,
        alternatives: (scenario: Scenario) => [
          `Clear of conflict, returning to ${scenario.altitudes.climb}`,
          `Clear of conflict, returning to flight level ${Math.round(scenario.altitudes.climb / 100)}`,
          `Clear of conflict returning to ${scenario.altitudes.climb}`,
          `Clear of conflict, returning ${scenario.altitudes.climb}`,
        ],
        threshold: 0.6,
        placeholder: 'e.g. Clear of conflict, returning to FL350',
        width: 'xl' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'rejection', width: 'lg' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall} · ` },
      { type: 'field' as const, key: 'resolution', width: 'xl' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall}` },
    ],
    defaultFrequency: 'CTR',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, descend and maintain ${scenario.altitudes.initialWords}. [TCAS says: CLIMB, CLIMB]`,
    info: (scenario: Scenario) => [
      'ATC says descend but TCAS says CLIMB — TCAS wins, always.',
      `Your assigned level: ${scenario.altitudes.climb}`,
      'Part 1: "Unable, TCAS RA" · Part 2 (after clear): "Clear of conflict, returning to [level]"',
    ],
    generate: createBaseScenario
  },
  {
    id: 'late-runway-change',
    title: 'Late Runway Change on Approach',
    desc: 'Read back a runway change with new vectors during approach',
    keywords: ['Runway Change', 'Approach', 'Vectors'],
    hints: [
      'Late runway changes require immediate mental reconfiguration.',
      'Read back ALL elements: cancelled runway, new heading, new runway, new altitude.',
      'Verify your approach is aligned with the new runway before continuing.'
    ],
    fields: [
      {
        key: 'old-runway',
        label: 'Cancelled runway',
        expected: (scenario: Scenario) => scenario.arrivalRunway,
        alternatives: (scenario: Scenario) => [scenario.arrivalRunway, scenario.arrivalRunwayWords],
        placeholder: 'e.g. 27R',
        width: 'sm' as const
      },
      {
        key: 'heading',
        label: 'New heading',
        expected: (scenario: Scenario) => scenario.vectorHeading,
        alternatives: (scenario: Scenario) => [scenario.vectorHeading, scenario.vectorHeadingWords],
        placeholder: 'e.g. 360',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'new-runway',
        label: 'New runway',
        expected: (scenario: Scenario) => scenario.runway,
        alternatives: (scenario: Scenario) => [scenario.runway, scenario.runwayWords],
        placeholder: 'e.g. 09L',
        width: 'sm' as const
      },
      {
        key: 'altitude',
        label: 'Descend to',
        expected: (scenario: Scenario) => scenario.approachAltitude.toString(),
        alternatives: (scenario: Scenario) => [
          scenario.approachAltitude.toString(),
          scenario.approachAltitudeWords,
        ],
        placeholder: 'e.g. 3000',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Cancel approach runway ' },
      { type: 'field' as const, key: 'old-runway', width: 'sm' as const },
      { type: 'text' as const, text: ', right heading ' },
      { type: 'field' as const, key: 'heading', width: 'sm' as const },
      { type: 'text' as const, text: ', vectors runway ' },
      { type: 'field' as const, key: 'new-runway', width: 'sm' as const },
      { type: 'text' as const, text: ', descend ' },
      { type: 'field' as const, key: 'altitude', width: 'sm' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall}` },
    ],
    defaultFrequency: 'APP',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, cancel approach runway ${scenario.arrivalRunwayWords}, turn right heading ${scenario.vectorHeadingWords}, vectors runway ${scenario.runwayWords}, descend ${scenario.approachAltitudeWords}.`,
    info: (scenario: Scenario) => [
      `Cancelled: Runway ${scenario.arrivalRunway}`,
      `New: Heading ${scenario.vectorHeading}, Runway ${scenario.runway}, Descend ${scenario.approachAltitude}`,
      'Late changes are stressful — take a breath, read back carefully.',
    ],
    generate: createBaseScenario
  }
]

/* ────────────────────────────────────────────────────────────
 *  VATSIM ESSENTIALS
 * ──────────────────────────────────────────────────────────── */

const vatsimEssentialsLessons = [
  {
    id: 'unicom-blind-call',
    title: 'Unicom Blind Call',
    desc: 'Announce your intentions when no ATC is online',
    keywords: ['VATSIM', 'Unicom', '122.800'],
    hints: [
      'When no controller is online, announce on the advisory frequency (122.800 or local CTAF).',
      'Format: "[Callsign], [Airport] Traffic, [position], [intention]".',
      'Keep it brief — other pilots just need to know where you are and what you plan to do.'
    ],
    fields: [
      {
        key: 'icao',
        label: 'Airport ICAO',
        expected: (scenario: Scenario) => scenario.airport.icao,
        placeholder: 'ICAO code',
        width: 'sm' as const
      },
      {
        key: 'position',
        label: 'Position',
        expected: (scenario: Scenario) => scenario.positionDescription,
        alternatives: (scenario: Scenario) => [
          scenario.positionDescription,
          scenario.positionDescription.toLowerCase(),
        ],
        threshold: 0.7,
        placeholder: 'e.g. 10 miles south',
        width: 'lg' as const
      },
      {
        key: 'intention',
        label: 'Intention',
        expected: () => 'inbound for landing',
        alternatives: () => [
          'inbound for landing',
          'inbound',
          'inbound runway',
          'inbound for ILS approach',
          'inbound for approach',
        ],
        threshold: 0.6,
        placeholder: 'e.g. inbound for landing',
        width: 'lg' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: (scenario: Scenario) => `${scenario.radioCall}, ` },
      { type: 'field' as const, key: 'icao', width: 'sm' as const },
      { type: 'text' as const, text: ' Traffic, ' },
      { type: 'field' as const, key: 'position', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'intention', width: 'lg' as const },
    ],
    defaultFrequency: undefined,
    phrase: (scenario: Scenario) =>
      `No ATC online at ${scenario.airport.name}. You are ${scenario.positionDescription}, planning to land. Make a blind call on the advisory frequency.`,
    info: (scenario: Scenario) => [
      `Airport: ${scenario.airport.icao} — ${scenario.airport.name}`,
      `Position: ${scenario.positionDescription}`,
      'Advisory frequency: 122.800 (or local CTAF)'
    ],
    generate: createBaseScenario
  },
  {
    id: 'radio-check-readability',
    title: 'Radio Check & Readability',
    desc: 'Initiate a radio check and read back the controller readability response',
    keywords: ['Radio Check', 'Readability', 'Basics'],
    hints: [
      'You initiate a radio check, controller responds with your readability.',
      'Readability scale: 1 = unreadable, 2 = barely, 3 = with difficulty, 4 = readable, 5 = perfectly readable.',
      'Your readback confirms you received their assessment.'
    ],
    fields: [
      {
        key: 'station',
        label: 'Station',
        expected: (scenario: Scenario) => `${scenario.airport.city} Delivery`,
        alternatives: (scenario: Scenario) => [
          `${scenario.airport.city} Delivery`,
          `${scenario.airport.name} Delivery`,
          `${scenario.airport.city} delivery`,
        ],
        threshold: 0.75,
        placeholder: 'e.g. Frankfurt Delivery',
        width: 'lg' as const
      },
      {
        key: 'frequency',
        label: 'Frequency',
        expected: (scenario: Scenario) => scenario.deliveryFreq,
        alternatives: (scenario: Scenario) => [
          scenario.deliveryFreq,
          scenario.deliveryFreq.replace('.', ','),
        ],
        placeholder: 'e.g. 121.900',
        width: 'md' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'station', width: 'lg' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall}, radio check ` },
      { type: 'field' as const, key: 'frequency', width: 'md' as const },
    ],
    defaultFrequency: 'DEL',
    phrase: (scenario: Scenario) =>
      `You want to check your radio on ${scenario.airport.city} Delivery, frequency ${scenario.deliveryFreq}. Initiate the radio check call.`,
    info: (scenario: Scenario) => [
      `Station: ${scenario.airport.city} Delivery`,
      `Frequency: ${scenario.deliveryFreq}`,
      'Format: "[Station], [Callsign], radio check [frequency]"',
    ],
    generate: createBaseScenario
  },
  {
    id: 'say-again-targeted',
    title: 'Say Again (Targeted)',
    desc: 'Request the specific missing part of a garbled clearance',
    keywords: ['Say Again', 'Comms', 'Recovery'],
    hints: [
      'Never just say "say again" — always specify WHAT you missed.',
      'Standard form: "Say again all before [last word you heard clearly]".',
      'Here the clearance limit and routing are garbled. You heard the SID and squawk clearly.'
    ],
    fields: [
      {
        key: 'say-again-target',
        label: 'Say again target',
        expected: (scenario: Scenario) => `all before ${scenario.sid}`,
        alternatives: (scenario: Scenario) => [
          `all before ${scenario.sid}`,
          `all before ${scenario.sid} departure`,
          'clearance limit and routing',
          'clearance limit',
          'destination and routing',
          'all before departure',
        ],
        threshold: 0.55,
        placeholder: 'e.g. all before [word]',
        width: 'xl' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: (scenario: Scenario) => `${scenario.radioCall}, say again ` },
      { type: 'field' as const, key: 'say-again-target', width: 'xl' as const },
    ],
    defaultFrequency: 'DEL',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, cleared to... [garbled] ...${scenario.sid} departure, squawk ${scenario.squawkWords}.`,
    info: (scenario: Scenario) => [
      'The clearance limit (destination) and routing were garbled.',
      `You heard clearly: "${scenario.sid} departure, squawk ${scenario.squawk}"`,
      `Best response: "Say again all before ${scenario.sid}"`,
    ],
    generate: createBaseScenario
  },
  {
    id: 'monitor-vs-contact',
    title: 'Monitor vs Contact',
    desc: 'Know when to call in and when to just listen',
    keywords: ['Frequency', 'Monitor', 'Contact', 'VATSIM'],
    hints: [
      '"Contact [station]" = switch frequency AND make an initial call.',
      '"Monitor [station]" = switch frequency and LISTEN ONLY — do NOT transmit.',
      'This is the most common VATSIM beginner mistake.'
    ],
    fields: [
      {
        key: 'action',
        label: 'What did ATC say?',
        expected: () => 'contact',
        alternatives: () => ['contact', 'Contact'],
        placeholder: 'contact or monitor',
        width: 'md' as const
      },
      {
        key: 'facility',
        label: 'Facility',
        expected: (scenario: Scenario) => `${scenario.airport.city} Tower`,
        alternatives: (scenario: Scenario) => [
          `${scenario.airport.city} Tower`,
          `${scenario.airport.city} tower`,
          `${scenario.airport.name} Tower`,
        ],
        threshold: 0.75,
        placeholder: 'e.g. Frankfurt Tower',
        width: 'lg' as const
      },
      {
        key: 'freq',
        label: 'Frequency',
        expected: (scenario: Scenario) => scenario.towerFreq,
        placeholder: 'e.g. 118.700',
        width: 'md' as const
      },
      {
        key: 'should-call',
        label: 'Do you transmit?',
        expected: () => 'yes',
        alternatives: () => ['yes', 'Yes', 'YES'],
        placeholder: 'yes or no',
        width: 'sm' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'action', width: 'md' as const },
      { type: 'text' as const, text: ' ' },
      { type: 'field' as const, key: 'facility', width: 'lg' as const },
      { type: 'text' as const, text: ' ' },
      { type: 'field' as const, key: 'freq', width: 'md' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall} · Transmit on new freq? ` },
      { type: 'field' as const, key: 'should-call', width: 'sm' as const },
    ],
    defaultFrequency: 'GND',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, contact ${scenario.airport.city} Tower ${scenario.towerFreq}.`,
    info: () => [
      '"Contact" = switch AND call in. "Monitor" = switch and LISTEN ONLY.',
      'ATC said "contact" → you MUST make an initial call after switching.',
      'If ATC had said "monitor" → just switch and listen, do NOT transmit.',
    ],
    generate: createBaseScenario
  },
  {
    id: 'two-step-freq-change',
    title: 'Two-Step Frequency Change',
    desc: 'Read back a combined instruction then make the initial call',
    keywords: ['Frequency', 'Handoff', 'Climb'],
    hints: [
      'When ATC gives an instruction + frequency change, read back BOTH before switching.',
      'After switching: make your initial call with callsign, altitude, and ATIS.',
      'Format: "[Station], [Callsign], climbing/at [altitude], information [ATIS]".'
    ],
    fields: [
      {
        key: 'climb-alt',
        label: 'Climb altitude',
        expected: (scenario: Scenario) => `flight level ${scenario.altitudes.climbWords.replace(/ thousand/g, '').replace(/\s+/g, ' ')}`,
        alternatives: (scenario: Scenario) => {
          const raw = scenario.altitudes.climb.toString()
          const fl = `FL${Math.round(scenario.altitudes.climb / 100)}`
          return [
            `flight level ${scenario.altitudes.climbWords}`,
            `FL ${Math.round(scenario.altitudes.climb / 100)}`,
            fl,
            raw,
            scenario.altitudes.climbWords,
          ]
        },
        threshold: 0.6,
        placeholder: 'e.g. flight level 350',
        width: 'lg' as const
      },
      {
        key: 'handoff-facility',
        label: 'Facility',
        expected: (scenario: Scenario) => scenario.handoff.facility,
        alternatives: (scenario: Scenario) => [
          scenario.handoff.facility,
          scenario.handoff.facility.toLowerCase(),
        ],
        threshold: 0.7,
        placeholder: 'e.g. London Control',
        width: 'lg' as const
      },
      {
        key: 'handoff-freq',
        label: 'Frequency',
        expected: (scenario: Scenario) => scenario.handoff.frequency,
        placeholder: 'e.g. 128.050',
        width: 'md' as const
      },
      {
        key: 'atis-code',
        label: 'ATIS code',
        expected: (scenario: Scenario) => scenario.atisCode,
        alternatives: (scenario: Scenario) => [
          scenario.atisCode,
          scenario.atisCodeWord,
          scenario.atisCode.toLowerCase(),
          scenario.atisCodeWord.toLowerCase(),
        ],
        placeholder: 'e.g. D or Delta',
        width: 'sm' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Climb ' },
      { type: 'field' as const, key: 'climb-alt', width: 'lg' as const },
      { type: 'text' as const, text: ', contact ' },
      { type: 'field' as const, key: 'handoff-facility', width: 'lg' as const },
      { type: 'text' as const, text: ' ' },
      { type: 'field' as const, key: 'handoff-freq', width: 'md' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall} · Initial: ... information ` },
      { type: 'field' as const, key: 'atis-code', width: 'sm' as const },
    ],
    defaultFrequency: 'DEP',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, climb ${scenario.altitudes.climbWords}, contact ${scenario.handoff.facility} ${scenario.handoff.frequency}.`,
    info: (scenario: Scenario) => [
      `Instruction: Climb ${scenario.altitudes.climb} ft`,
      `Handoff: ${scenario.handoff.facility} on ${scenario.handoff.frequency}`,
      `ATIS: Information ${scenario.atisCode}`,
    ],
    generate: createBaseScenario
  },
  {
    id: 'atis-update-taxi',
    title: 'ATIS Update During Taxi',
    desc: 'Acknowledge a new ATIS with changed QNH and runway',
    keywords: ['ATIS', 'QNH', 'Taxi', 'Runway Change'],
    hints: [
      'When ATC announces a new ATIS during taxi, read back the safety-critical items: ATIS letter, QNH, and new runway.',
      'Always set the new QNH immediately — it affects your altimeter.',
      'The runway change may require re-briefing your departure procedure.'
    ],
    fields: [
      {
        key: 'atis-letter',
        label: 'ATIS letter',
        expected: (scenario: Scenario) => scenario.atisCode,
        alternatives: (scenario: Scenario) => [
          scenario.atisCode,
          scenario.atisCodeWord,
          scenario.atisCode.toLowerCase(),
          scenario.atisCodeWord.toLowerCase(),
        ],
        placeholder: 'e.g. D or Delta',
        width: 'sm' as const
      },
      {
        key: 'qnh',
        label: 'QNH',
        expected: (scenario: Scenario) => scenario.qnh.toString(),
        alternatives: (scenario: Scenario) => [
          scenario.qnh.toString(),
          scenario.qnhWords,
        ],
        placeholder: 'e.g. 1013',
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'new-runway',
        label: 'New runway',
        expected: (scenario: Scenario) => scenario.runway,
        alternatives: (scenario: Scenario) => [
          scenario.runway,
          scenario.runwayWords,
        ],
        placeholder: 'e.g. 25C',
        width: 'sm' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Information ' },
      { type: 'field' as const, key: 'atis-letter', width: 'sm' as const },
      { type: 'text' as const, text: ', QNH ' },
      { type: 'field' as const, key: 'qnh', width: 'sm' as const },
      { type: 'text' as const, text: ', runway ' },
      { type: 'field' as const, key: 'new-runway', width: 'sm' as const },
      { type: 'text' as const, text: (scenario: Scenario) => `, ${scenario.radioCall}` },
    ],
    defaultFrequency: 'GND',
    phrase: (scenario: Scenario) =>
      `${scenario.radioCall}, information is now ${scenario.atisCodeWord}, QNH ${scenario.qnhWords}, wind changed ${scenario.windWords}, runway changed to ${scenario.runwayWords}.`,
    info: (scenario: Scenario) => [
      `New ATIS: ${scenario.atisCode} (${scenario.atisCodeWord})`,
      `QNH: ${scenario.qnh}`,
      `New runway: ${scenario.runway}`,
    ],
    generate: createBaseScenario
  }
]

function emergencyCallsignAlternatives(scenario: Scenario): string[] {
  return [
    scenario.radioCall,
    `${scenario.airlineCall} ${scenario.flightNumber}`,
    scenario.callsign
  ]
}

function emergencyStation(scenario: Scenario): string {
  return `${scenario.airport.city} Center`
}

function emergencyAssistance(): string {
  return 'priority vectors and immediate approach'
}

function emergencyCancelReason(scenario: Scenario): string {
  return `${scenario.emergencyProblem} resolved`
}

function squawkPhraseology(scenario: Scenario): string {
  if (scenario.squawk === '7600') return 'radio failure, squawking seven six zero zero'
  if (scenario.squawk === '7500') return 'unlawful interference, squawk seven five zero zero set'
  return 'general emergency, squawking seven seven zero zero'
}

function createSquawkCodeScenario(): Scenario {
  const scenario = createBaseScenario()
  const code = sample(['7700', '7600', '7500'])
  scenario.squawk = code
  scenario.squawkWords = digitsToWords(code)
  if (code === '7700') {
    scenario.emergencyProblem = 'engine fire'
    scenario.emergencyIntent = `immediate landing at ${scenario.airport.city}`
  } else if (code === '7600') {
    scenario.emergencyProblem = 'radio failure'
    scenario.emergencyIntent = 'continue with lost comms procedure'
  } else {
    scenario.emergencyProblem = 'unlawful interference'
    scenario.emergencyIntent = 'request discreet handling'
  }
  return scenario
}

const emergencyBasicsLessons = [
  {
    id: 'mayday-declaration',
    title: 'MAYDAY Declaration',
    desc: 'Build a complete MAYDAY call with position, fuel and souls on board',
    keywords: ['Emergency', 'MAYDAY', 'Distress'],
    hints: [
      'Say MAYDAY three times first, then station and callsign.',
      'Include nature, intentions, position, heading, fuel in minutes and souls on board.'
    ],
    fields: [
      {
        key: 'mayday-station',
        label: 'Station',
        expected: scenario => emergencyStation(scenario),
        alternatives: scenario => [`${scenario.airport.city} center`, `${scenario.airport.name} center`],
        width: 'lg' as const
      },
      {
        key: 'mayday-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'mayday-nature',
        label: 'Nature',
        expected: scenario => scenario.emergencyProblem,
        width: 'xl' as const
      },
      {
        key: 'mayday-intentions',
        label: 'Intentions',
        expected: scenario => scenario.emergencyIntent,
        width: 'xl' as const
      },
      {
        key: 'mayday-position',
        label: 'Position',
        expected: scenario => scenario.positionDescription,
        alternatives: scenario => [scenario.positionDescription.toLowerCase()],
        threshold: 0.7,
        width: 'xl' as const
      },
      {
        key: 'mayday-heading',
        label: 'Heading',
        expected: scenario => scenario.emergencyHeading,
        alternatives: scenario => [scenario.emergencyHeadingWords],
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'mayday-fuel',
        label: 'Fuel (minutes)',
        expected: scenario => scenario.fuelMinutes.toString(),
        alternatives: scenario => [scenario.fuelMinutesWords, `${scenario.fuelMinutes} minutes`],
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'mayday-souls',
        label: 'Souls on board',
        expected: scenario => scenario.soulsOnBoard.toString(),
        alternatives: scenario => [scenario.soulsOnBoardWords],
        width: 'sm' as const,
        inputmode: 'numeric' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'MAYDAY MAYDAY MAYDAY, ' },
      { type: 'field' as const, key: 'mayday-station', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'mayday-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'mayday-nature', width: 'xl' as const },
      { type: 'text' as const, text: ', intentions ' },
      { type: 'field' as const, key: 'mayday-intentions', width: 'xl' as const },
      { type: 'text' as const, text: ', position ' },
      { type: 'field' as const, key: 'mayday-position', width: 'xl' as const },
      { type: 'text' as const, text: ', heading ' },
      { type: 'field' as const, key: 'mayday-heading', width: 'sm' as const },
      { type: 'text' as const, text: ', fuel ' },
      { type: 'field' as const, key: 'mayday-fuel', width: 'sm' as const },
      { type: 'text' as const, text: ' minutes, ' },
      { type: 'field' as const, key: 'mayday-souls', width: 'sm' as const },
      { type: 'text' as const, text: ' souls on board' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario =>
      `You have ${scenario.emergencyProblem}. Declare full MAYDAY with heading ${scenario.emergencyHeading}, fuel ${scenario.fuelMinutes} minutes, and ${scenario.soulsOnBoard} souls on board.`,
    info: scenario => [
      'MAYDAY is spoken three times for distress.',
      `Position: ${scenario.positionDescription}`,
      'Fuel must be given as time remaining, not kilograms or pounds.'
    ],
    generate: createBaseScenario
  },
  {
    id: 'pan-pan-declaration',
    title: 'PAN PAN Declaration',
    desc: 'Build a complete PAN PAN urgency message',
    keywords: ['Emergency', 'PAN PAN', 'Urgency'],
    hints: [
      'PAN PAN is spoken three times (six words total: PAN PAN PAN PAN PAN PAN).',
      'Include requested assistance and fuel time.'
    ],
    fields: [
      {
        key: 'pan-addressee',
        label: 'Addressee',
        expected: scenario => emergencyStation(scenario),
        alternatives: () => ['all stations'],
        width: 'lg' as const
      },
      {
        key: 'pan-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'pan-position',
        label: 'Position',
        expected: scenario => scenario.positionDescription,
        alternatives: scenario => [scenario.positionDescription.toLowerCase()],
        threshold: 0.7,
        width: 'xl' as const
      },
      {
        key: 'pan-nature',
        label: 'Nature',
        expected: scenario => scenario.emergencyProblem,
        width: 'xl' as const
      },
      {
        key: 'pan-assistance',
        label: 'Assistance',
        expected: () => emergencyAssistance(),
        alternatives: () => ['priority vectors', 'priority handling', 'immediate approach'],
        threshold: 0.6,
        width: 'xl' as const
      },
      {
        key: 'pan-fuel',
        label: 'Fuel (minutes)',
        expected: scenario => scenario.fuelMinutes.toString(),
        alternatives: scenario => [scenario.fuelMinutesWords, `${scenario.fuelMinutes} minutes`],
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'pan-souls',
        label: 'POB',
        expected: scenario => scenario.soulsOnBoard.toString(),
        alternatives: scenario => [scenario.soulsOnBoardWords],
        width: 'sm' as const,
        inputmode: 'numeric' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'PAN PAN PAN PAN PAN PAN, ' },
      { type: 'field' as const, key: 'pan-addressee', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'pan-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', position ' },
      { type: 'field' as const, key: 'pan-position', width: 'xl' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'pan-nature', width: 'xl' as const },
      { type: 'text' as const, text: ', request ' },
      { type: 'field' as const, key: 'pan-assistance', width: 'xl' as const },
      { type: 'text' as const, text: ', fuel ' },
      { type: 'field' as const, key: 'pan-fuel', width: 'sm' as const },
      { type: 'text' as const, text: ' minutes, ' },
      { type: 'field' as const, key: 'pan-souls', width: 'sm' as const },
      { type: 'text' as const, text: ' souls on board' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario =>
      `Passenger issue on board and no immediate danger. Build a full PAN PAN call with fuel ${scenario.fuelMinutes} minutes and ${scenario.soulsOnBoard} souls on board.`,
    info: () => [
      'PAN PAN is urgency, not distress.',
      'Souls on board includes passengers and crew.'
    ],
    generate: createBaseScenario
  },
  {
    id: 'mayday-vs-panpan-fuel',
    title: 'MAYDAY FUEL vs PAN PAN FUEL',
    desc: 'Choose the correct fuel urgency call and build the message',
    keywords: ['Fuel', 'MAYDAY FUEL', 'PAN PAN FUEL'],
    hints: [
      'Below final reserve: MAYDAY FUEL.',
      'Above reserve but critical trend: PAN PAN FUEL / MINIMUM FUEL.'
    ],
    fields: [
      {
        key: 'fuel-call-type',
        label: 'Call type',
        expected: scenario => (scenario.fuelMinutes <= 30 ? 'MAYDAY FUEL' : 'PAN PAN FUEL'),
        alternatives: scenario => (scenario.fuelMinutes <= 30 ? ['MAYDAY', 'mayday fuel'] : ['PAN PAN', 'minimum fuel']),
        width: 'md' as const
      },
      {
        key: 'fuel-state',
        label: 'Fuel state',
        expected: scenario => `${scenario.fuelMinutes} minutes`,
        alternatives: scenario => [scenario.fuelMinutes.toString(), scenario.fuelMinutesWords],
        width: 'md' as const
      },
      {
        key: 'fuel-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'fuel-request',
        label: 'Request',
        expected: () => emergencyAssistance(),
        alternatives: () => ['priority handling', 'shortest approach', 'direct vectors'],
        threshold: 0.6,
        width: 'xl' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'fuel-call-type', width: 'md' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'fuel-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', fuel ' },
      { type: 'field' as const, key: 'fuel-state', width: 'md' as const },
      { type: 'text' as const, text: ', request ' },
      { type: 'field' as const, key: 'fuel-request', width: 'xl' as const }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario =>
      `Planned final reserve is 30 minutes. Current fuel remaining is ${scenario.fuelMinutes} minutes. Choose the correct fuel urgency call.`,
    info: scenario => [
      'MINIMUM/PAN PAN fuel is advisory when still above reserve.',
      `Current fuel: ${scenario.fuelMinutes} minutes (reserve threshold: 30).`
    ],
    generate: createBaseScenario
  },
  {
    id: 'emergency-descent',
    title: 'Emergency Descent',
    desc: 'Announce emergency descent and squawk assignment',
    keywords: ['Emergency Descent', '7700'],
    hints: [
      'State leaving level and intention to descend immediately.',
      'Squawk 7700 for general emergency.'
    ],
    fields: [
      {
        key: 'descent-station',
        label: 'Station',
        expected: scenario => emergencyStation(scenario),
        width: 'lg' as const
      },
      {
        key: 'descent-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'descent-level',
        label: 'Leaving level',
        expected: scenario => scenario.altitudes.climb.toString(),
        alternatives: scenario => [scenario.altitudes.climbWords, `FL${Math.round(scenario.altitudes.climb / 100)}`],
        width: 'md' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'descent-squawk',
        label: 'Squawk',
        expected: () => '7700',
        alternatives: () => ['seven seven zero zero', '7700'],
        width: 'sm' as const,
        inputmode: 'numeric' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'MAYDAY MAYDAY MAYDAY, ' },
      { type: 'field' as const, key: 'descent-station', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'descent-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', emergency descent, leaving ' },
      { type: 'field' as const, key: 'descent-level', width: 'md' as const },
      { type: 'text' as const, text: ', squawking ' },
      { type: 'field' as const, key: 'descent-squawk', width: 'sm' as const }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario =>
      `${scenario.radioCall}, cabin depressurization, emergency descent from ${scenario.altitudes.climb}.`,
    info: () => [
      'General emergency code is 7700.',
      'Execute the descent while transmitting.'
    ],
    generate: createBaseScenario
  },
  {
    id: 'emergency-query-response',
    title: 'ATC Emergency Query Response',
    desc: 'Respond with fuel in minutes and souls on board',
    keywords: ['Fuel', 'Souls on Board', 'Emergency'],
    hints: [
      'Fuel must be reported in minutes, not weight.',
      'Souls on board includes crew and passengers.'
    ],
    fields: [
      {
        key: 'query-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'query-fuel',
        label: 'Fuel (minutes)',
        expected: scenario => scenario.fuelMinutes.toString(),
        alternatives: scenario => [scenario.fuelMinutesWords, `${scenario.fuelMinutes} minutes`],
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'query-souls',
        label: 'Souls',
        expected: scenario => scenario.soulsOnBoard.toString(),
        alternatives: scenario => [scenario.soulsOnBoardWords],
        width: 'sm' as const,
        inputmode: 'numeric' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'query-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', fuel ' },
      { type: 'field' as const, key: 'query-fuel', width: 'sm' as const },
      { type: 'text' as const, text: ' minutes, ' },
      { type: 'field' as const, key: 'query-souls', width: 'sm' as const },
      { type: 'text' as const, text: ' souls on board' }
    ],
    defaultFrequency: 'CTR',
    phrase: () => 'State fuel remaining and souls on board.',
    info: () => [
      'ATC expects fuel in minutes remaining.',
      'Do not report fuel in kilograms or pounds for this question.'
    ],
    generate: createBaseScenario
  },
  {
    id: 'cancel-emergency',
    title: 'Cancel Emergency',
    desc: 'Cancel MAYDAY/PAN PAN when the situation is resolved',
    keywords: ['Cancel', 'MAYDAY', 'PAN PAN'],
    hints: [
      'State cancel MAYDAY or cancel PAN PAN explicitly.',
      'Briefly provide reason and intentions.'
    ],
    fields: [
      {
        key: 'cancel-station',
        label: 'Station',
        expected: scenario => emergencyStation(scenario),
        width: 'lg' as const
      },
      {
        key: 'cancel-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'cancel-calltype',
        label: 'Cancel type',
        expected: () => 'MAYDAY',
        alternatives: () => ['PAN PAN', 'mayday', 'pan pan'],
        width: 'md' as const
      },
      {
        key: 'cancel-reason',
        label: 'Reason',
        expected: scenario => emergencyCancelReason(scenario),
        alternatives: scenario => ['problem resolved', `${scenario.emergencyProblem} resolved`],
        threshold: 0.6,
        width: 'xl' as const
      },
      {
        key: 'cancel-intentions',
        label: 'Intentions',
        expected: scenario => scenario.emergencyIntent,
        width: 'xl' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'cancel-station', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'cancel-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', cancel ' },
      { type: 'field' as const, key: 'cancel-calltype', width: 'md' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'cancel-reason', width: 'xl' as const },
      { type: 'text' as const, text: ', request ' },
      { type: 'field' as const, key: 'cancel-intentions', width: 'xl' as const }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario =>
      `Situation stabilised. Cancel the emergency and state next intent: ${scenario.emergencyIntent}.`,
    info: () => [
      'Only cancel when emergency is actually resolved and controllable.',
      'Use short, unambiguous phraseology.'
    ],
    generate: createBaseScenario
  },
  {
    id: 'emergency-squawk-codes',
    title: 'Emergency Squawk Codes',
    desc: 'Choose and report the correct emergency transponder code',
    keywords: ['7700', '7600', '7500', 'Squawk'],
    hints: [
      '7700 = general emergency, 7600 = radio failure, 7500 = unlawful interference.',
      '7500 is never cancelled by routine radio phraseology.'
    ],
    fields: [
      {
        key: 'squawk-code',
        label: 'Squawk',
        expected: scenario => scenario.squawk,
        alternatives: scenario => [scenario.squawkWords, scenario.squawk.split('').join(' ')],
        width: 'sm' as const,
        inputmode: 'numeric' as const
      },
      {
        key: 'squawk-phrase',
        label: 'Phraseology',
        expected: scenario => squawkPhraseology(scenario),
        alternatives: () => [
          'general emergency, squawking seven seven zero zero',
          'radio failure, squawking seven six zero zero',
          'unlawful interference, squawk seven five zero zero set'
        ],
        threshold: 0.65,
        width: 'xl' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Squawking ' },
      { type: 'field' as const, key: 'squawk-code', width: 'sm' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'squawk-phrase', width: 'xl' as const }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario =>
      `Scenario: ${scenario.emergencyProblem}. Choose the correct squawk and phraseology.`,
    info: scenario => [
      `Current scenario cue: ${scenario.emergencyProblem}`,
      '7500 should not be casually discussed if unlawful interference is suspected.'
    ],
    generate: createSquawkCodeScenario
  }
]

const medicalEmergencySeries = createScenarioSeries(() => {
  const scenario = createBaseScenario()
  scenario.emergencyProblem = 'medical emergency on board'
  scenario.emergencyIntent = `priority landing at ${scenario.destination.city}`
  return scenario
})

const engineFailureSeries = createScenarioSeries(() => {
  const scenario = createBaseScenario()
  scenario.emergencyProblem = 'engine failure'
  scenario.emergencyIntent = `vectors for immediate return to ${scenario.airport.city}`
  return scenario
})

const fuelEmergencySeries = createScenarioSeries(() => {
  const scenario = createBaseScenario()
  scenario.emergencyProblem = 'fuel critical state'
  scenario.fuelMinutes = randInt(20, 35)
  scenario.fuelMinutesWords = minutesToWords(scenario.fuelMinutes)
  scenario.emergencyIntent = `priority direct approach to runway ${scenario.arrivalRunway}`
  return scenario
})

const diversionSeries = createScenarioSeries(() => {
  const scenario = createBaseScenario()
  scenario.emergencyProblem = 'technical issue requiring diversion'
  scenario.emergencyIntent = `divert to ${scenario.destination.city}`
  return scenario
})

const makeMedicalEmergencyGenerator = (reset = false) => () => {
  if (reset) medicalEmergencySeries.reset()
  return medicalEmergencySeries()
}

const makeEngineFailureGenerator = (reset = false) => () => {
  if (reset) engineFailureSeries.reset()
  return engineFailureSeries()
}

const makeFuelEmergencyGenerator = (reset = false) => () => {
  if (reset) fuelEmergencySeries.reset()
  return fuelEmergencySeries()
}

const makeDiversionGenerator = (reset = false) => () => {
  if (reset) diversionSeries.reset()
  return diversionSeries()
}

const emergencyScenarioLessons = [
  {
    id: 'medical-cruise-checkin',
    title: 'Medical Emergency · Cruise Check-in',
    desc: 'Normal check-in before the urgency call',
    keywords: ['Medical', 'Scenario', 'Check-in'],
    hints: [
      'Start with callsign, level and position.',
      'This step sets context before the PAN PAN call.'
    ],
    fields: [
      {
        key: 'med-check-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'med-check-level',
        label: 'Level',
        expected: scenario => scenario.altitudes.climb.toString(),
        alternatives: scenario => [scenario.altitudes.climbWords, `FL${Math.round(scenario.altitudes.climb / 100)}`],
        width: 'md' as const
      },
      {
        key: 'med-check-position',
        label: 'Position',
        expected: scenario => scenario.positionDescription,
        alternatives: scenario => [scenario.positionDescription.toLowerCase()],
        threshold: 0.7,
        width: 'xl' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'med-check-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', level ' },
      { type: 'field' as const, key: 'med-check-level', width: 'md' as const },
      { type: 'text' as const, text: ', position ' },
      { type: 'field' as const, key: 'med-check-position', width: 'xl' as const }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, report level ${scenario.altitudes.climb} and position.`,
    info: () => ['Build a clean baseline report before escalating urgency.'],
    generate: makeMedicalEmergencyGenerator(true)
  },
  {
    id: 'medical-panpan-declaration',
    title: 'Medical Emergency · PAN PAN',
    desc: 'Declare urgency and request priority handling',
    keywords: ['Medical', 'PAN PAN', 'Scenario'],
    hints: [
      'Use PAN PAN six-word opener.',
      'Include assistance request, fuel time and souls on board.'
    ],
    fields: [
      {
        key: 'med-pan-station',
        label: 'Station',
        expected: scenario => emergencyStation(scenario),
        width: 'lg' as const
      },
      {
        key: 'med-pan-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'med-pan-assist',
        label: 'Assistance',
        expected: () => emergencyAssistance(),
        alternatives: () => ['priority handling', 'immediate vectors'],
        width: 'xl' as const
      },
      {
        key: 'med-pan-fuel',
        label: 'Fuel',
        expected: scenario => scenario.fuelMinutes.toString(),
        alternatives: scenario => [scenario.fuelMinutesWords],
        width: 'sm' as const
      },
      {
        key: 'med-pan-souls',
        label: 'Souls',
        expected: scenario => scenario.soulsOnBoard.toString(),
        alternatives: scenario => [scenario.soulsOnBoardWords],
        width: 'sm' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'PAN PAN PAN PAN PAN PAN, ' },
      { type: 'field' as const, key: 'med-pan-station', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'med-pan-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', request ' },
      { type: 'field' as const, key: 'med-pan-assist', width: 'xl' as const },
      { type: 'text' as const, text: ', fuel ' },
      { type: 'field' as const, key: 'med-pan-fuel', width: 'sm' as const },
      { type: 'text' as const, text: ' minutes, ' },
      { type: 'field' as const, key: 'med-pan-souls', width: 'sm' as const },
      { type: 'text' as const, text: ' souls on board' }
    ],
    defaultFrequency: 'CTR',
    phrase: () => 'Passenger requires urgent medical support. Declare PAN PAN and request priority.',
    info: () => ['Urgency is communicated with PAN PAN unless immediate distress exists.'],
    generate: makeMedicalEmergencyGenerator()
  },
  {
    id: 'medical-priority-vectors',
    title: 'Medical Emergency · Priority Vectors',
    desc: 'Read back priority heading and altitude',
    keywords: ['Medical', 'Vectors', 'Priority'],
    hints: [
      'Read back heading and altitude exactly.',
      'Expect a direct transition to approach.'
    ],
    fields: [
      {
        key: 'med-vector-heading',
        label: 'Heading',
        expected: scenario => scenario.vectorHeading,
        alternatives: scenario => [scenario.vectorHeadingWords],
        width: 'sm' as const
      },
      {
        key: 'med-vector-alt',
        label: 'Altitude',
        expected: scenario => scenario.approachAltitude.toString(),
        alternatives: scenario => [scenario.approachAltitudeWords],
        width: 'md' as const
      },
      {
        key: 'med-vector-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Heading ' },
      { type: 'field' as const, key: 'med-vector-heading', width: 'sm' as const },
      { type: 'text' as const, text: ', descend ' },
      { type: 'field' as const, key: 'med-vector-alt', width: 'md' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'med-vector-callsign', width: 'lg' as const }
    ],
    defaultFrequency: 'APP',
    phrase: scenario =>
      `${scenario.radioCall}, priority approved, turn heading ${scenario.vectorHeadingWords}, descend ${scenario.approachAltitudeWords}.`,
    info: () => ['Keep readback concise during emergency vectoring.'],
    generate: makeMedicalEmergencyGenerator()
  },
  {
    id: 'medical-landing-ambulance',
    title: 'Medical Emergency · Landing + Ambulance',
    desc: 'Read back landing clearance and request ambulance on stand',
    keywords: ['Medical', 'Landing', 'Ambulance'],
    hints: [
      'Read back runway and landing clearance first.',
      'Add the ambulance confirmation request at the end.'
    ],
    fields: [
      {
        key: 'med-landing-runway',
        label: 'Runway',
        expected: scenario => scenario.arrivalRunway,
        alternatives: scenario => [scenario.arrivalRunwayWords],
        width: 'sm' as const
      },
      {
        key: 'med-landing-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'med-landing-request',
        label: 'Additional request',
        expected: () => 'confirm ambulance standing by',
        alternatives: () => ['ambulance standing by', 'request ambulance on stand'],
        threshold: 0.6,
        width: 'xl' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Runway ' },
      { type: 'field' as const, key: 'med-landing-runway', width: 'sm' as const },
      { type: 'text' as const, text: ', cleared to land, ' },
      { type: 'field' as const, key: 'med-landing-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'med-landing-request', width: 'xl' as const }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario =>
      `${scenario.radioCall}, runway ${scenario.arrivalRunwayWords} cleared to land. Ambulance will meet you after vacating.`,
    info: scenario => [`Stand planned: ${scenario.arrivalStand}`],
    generate: makeMedicalEmergencyGenerator()
  },
  {
    id: 'engine-mayday-declaration',
    title: 'Engine Failure · MAYDAY',
    desc: 'Declare MAYDAY for engine failure and intentions',
    keywords: ['Engine Failure', 'MAYDAY', 'Scenario'],
    hints: [
      'Distress calls use MAYDAY three times.',
      'State nature and immediate intention.'
    ],
    fields: [
      {
        key: 'eng-mayday-station',
        label: 'Station',
        expected: scenario => emergencyStation(scenario),
        width: 'lg' as const
      },
      {
        key: 'eng-mayday-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'eng-mayday-nature',
        label: 'Nature',
        expected: scenario => scenario.emergencyProblem,
        width: 'xl' as const
      },
      {
        key: 'eng-mayday-intentions',
        label: 'Intentions',
        expected: scenario => scenario.emergencyIntent,
        width: 'xl' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'MAYDAY MAYDAY MAYDAY, ' },
      { type: 'field' as const, key: 'eng-mayday-station', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'eng-mayday-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'eng-mayday-nature', width: 'xl' as const },
      { type: 'text' as const, text: ', intentions ' },
      { type: 'field' as const, key: 'eng-mayday-intentions', width: 'xl' as const }
    ],
    defaultFrequency: 'CTR',
    phrase: () => 'Engine failure after climb. Make the MAYDAY declaration.',
    info: () => ['Keep the initial MAYDAY concise and unambiguous.'],
    generate: makeEngineFailureGenerator(true)
  },
  {
    id: 'engine-emergency-descent',
    title: 'Engine Failure · Emergency Descent',
    desc: 'Coordinate emergency descent with level and heading',
    keywords: ['Engine Failure', 'Descent'],
    hints: [
      'Report leaving level and assigned heading.',
      'Include squawk 7700 if not already assigned.'
    ],
    fields: [
      {
        key: 'eng-descent-level',
        label: 'Leaving level',
        expected: scenario => scenario.altitudes.climb.toString(),
        alternatives: scenario => [scenario.altitudes.climbWords],
        width: 'md' as const
      },
      {
        key: 'eng-descent-heading',
        label: 'Heading',
        expected: scenario => scenario.emergencyHeading,
        alternatives: scenario => [scenario.emergencyHeadingWords],
        width: 'sm' as const
      },
      {
        key: 'eng-descent-squawk',
        label: 'Squawk',
        expected: () => '7700',
        alternatives: () => ['seven seven zero zero'],
        width: 'sm' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Emergency descent leaving ' },
      { type: 'field' as const, key: 'eng-descent-level', width: 'md' as const },
      { type: 'text' as const, text: ', heading ' },
      { type: 'field' as const, key: 'eng-descent-heading', width: 'sm' as const },
      { type: 'text' as const, text: ', squawking ' },
      { type: 'field' as const, key: 'eng-descent-squawk', width: 'sm' as const }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario =>
      `${scenario.radioCall}, descend immediately, fly heading ${scenario.emergencyHeadingWords}, squawk 7700.`,
    info: () => ['Execute first, then complete readback.'],
    generate: makeEngineFailureGenerator()
  },
  {
    id: 'engine-atc-vectors',
    title: 'Engine Failure · ATC Vectors',
    desc: 'Read back vectors and altitude toward immediate approach',
    keywords: ['Engine Failure', 'Vectors'],
    hints: [
      'Heading and altitude are safety critical.',
      'Keep callsign at the end.'
    ],
    fields: [
      {
        key: 'eng-vector-heading',
        label: 'Heading',
        expected: scenario => scenario.vectorHeading,
        alternatives: scenario => [scenario.vectorHeadingWords],
        width: 'sm' as const
      },
      {
        key: 'eng-vector-alt',
        label: 'Altitude',
        expected: scenario => scenario.approachAltitude.toString(),
        alternatives: scenario => [scenario.approachAltitudeWords],
        width: 'md' as const
      },
      {
        key: 'eng-vector-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Heading ' },
      { type: 'field' as const, key: 'eng-vector-heading', width: 'sm' as const },
      { type: 'text' as const, text: ', descend ' },
      { type: 'field' as const, key: 'eng-vector-alt', width: 'md' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'eng-vector-callsign', width: 'lg' as const }
    ],
    defaultFrequency: 'APP',
    phrase: scenario =>
      `${scenario.radioCall}, turn left heading ${scenario.vectorHeadingWords}, descend ${scenario.approachAltitudeWords}, vectors ILS.`,
    info: () => ['Readback should be short and exact.'],
    generate: makeEngineFailureGenerator()
  },
  {
    id: 'engine-ils-landing',
    title: 'Engine Failure · ILS and Landing',
    desc: 'Confirm ILS approach and landing clearance',
    keywords: ['Engine Failure', 'ILS', 'Landing'],
    hints: [
      'Confirm approach type and runway.',
      'Landing clearance readback should include runway and callsign.'
    ],
    fields: [
      {
        key: 'eng-ils-approach',
        label: 'Approach',
        expected: scenario => scenario.approach,
        width: 'lg' as const
      },
      {
        key: 'eng-ils-runway',
        label: 'Runway',
        expected: scenario => scenario.arrivalRunway,
        alternatives: scenario => [scenario.arrivalRunwayWords],
        width: 'sm' as const
      },
      {
        key: 'eng-ils-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Cleared ' },
      { type: 'field' as const, key: 'eng-ils-approach', width: 'lg' as const },
      { type: 'text' as const, text: ' runway ' },
      { type: 'field' as const, key: 'eng-ils-runway', width: 'sm' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'eng-ils-callsign', width: 'lg' as const }
    ],
    defaultFrequency: 'APP',
    phrase: scenario =>
      `${scenario.radioCall}, cleared ${scenario.approach} approach runway ${scenario.arrivalRunwayWords}, then cleared to land.`,
    info: () => ['Continue precise phraseology even under high workload.'],
    generate: makeEngineFailureGenerator()
  },
  {
    id: 'fuel-panpan-initial',
    title: 'Fuel Emergency · PAN PAN FUEL',
    desc: 'Declare initial fuel urgency above final reserve',
    keywords: ['Fuel', 'PAN PAN FUEL', 'Scenario'],
    hints: [
      'Initial advisory is PAN PAN FUEL when still above reserve.',
      'State current fuel in minutes.'
    ],
    fields: [
      {
        key: 'fuel-pan-call',
        label: 'Call type',
        expected: () => 'PAN PAN FUEL',
        alternatives: () => ['PAN PAN', 'minimum fuel'],
        width: 'md' as const
      },
      {
        key: 'fuel-pan-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'fuel-pan-minutes',
        label: 'Fuel minutes',
        expected: scenario => scenario.fuelMinutes.toString(),
        alternatives: scenario => [scenario.fuelMinutesWords],
        width: 'sm' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'fuel-pan-call', width: 'md' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'fuel-pan-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', fuel ' },
      { type: 'field' as const, key: 'fuel-pan-minutes', width: 'sm' as const },
      { type: 'text' as const, text: ' minutes, request priority vectors' }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario =>
      `Fuel trend is worsening with ${scenario.fuelMinutes} minutes remaining. Start with PAN PAN FUEL advisory.`,
    info: () => ['Use MAYDAY FUEL only once reserve is below planned final reserve.'],
    generate: makeFuelEmergencyGenerator(true)
  },
  {
    id: 'fuel-priority-readback',
    title: 'Fuel Emergency · Priority Readback',
    desc: 'Read back priority vectors and approach planning',
    keywords: ['Fuel', 'Priority', 'Vectors'],
    hints: [
      'Acknowledge heading and descent clearly.',
      'Prepare for the upgrade call if fuel worsens.'
    ],
    fields: [
      {
        key: 'fuel-priority-heading',
        label: 'Heading',
        expected: scenario => scenario.vectorHeading,
        alternatives: scenario => [scenario.vectorHeadingWords],
        width: 'sm' as const
      },
      {
        key: 'fuel-priority-alt',
        label: 'Altitude',
        expected: scenario => scenario.approachAltitude.toString(),
        alternatives: scenario => [scenario.approachAltitudeWords],
        width: 'md' as const
      },
      {
        key: 'fuel-priority-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Heading ' },
      { type: 'field' as const, key: 'fuel-priority-heading', width: 'sm' as const },
      { type: 'text' as const, text: ', descend ' },
      { type: 'field' as const, key: 'fuel-priority-alt', width: 'md' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'fuel-priority-callsign', width: 'lg' as const }
    ],
    defaultFrequency: 'APP',
    phrase: scenario =>
      `${scenario.radioCall}, priority accepted, fly heading ${scenario.vectorHeadingWords}, descend ${scenario.approachAltitudeWords}.`,
    info: () => ['Keep workload low with short readbacks.'],
    generate: makeFuelEmergencyGenerator()
  },
  {
    id: 'fuel-upgrade-mayday',
    title: 'Fuel Emergency · Upgrade to MAYDAY FUEL',
    desc: 'Escalate from PAN PAN FUEL to MAYDAY FUEL',
    keywords: ['Fuel', 'MAYDAY FUEL', 'Escalation'],
    hints: [
      'When fuel goes below reserve, upgrade immediately to MAYDAY FUEL.',
      'State minimum information fast and clearly.'
    ],
    fields: [
      {
        key: 'fuel-upgrade-call',
        label: 'Call type',
        expected: () => 'MAYDAY FUEL',
        alternatives: () => ['MAYDAY', 'mayday fuel'],
        width: 'md' as const
      },
      {
        key: 'fuel-upgrade-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'fuel-upgrade-request',
        label: 'Request',
        expected: () => 'immediate approach and landing priority',
        alternatives: () => ['immediate approach', 'landing priority', 'priority landing'],
        threshold: 0.6,
        width: 'xl' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'fuel-upgrade-call', width: 'md' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'fuel-upgrade-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', request ' },
      { type: 'field' as const, key: 'fuel-upgrade-request', width: 'xl' as const }
    ],
    defaultFrequency: 'APP',
    phrase: () => 'Fuel now below planned final reserve. Upgrade call to MAYDAY FUEL.',
    info: () => ['Do not delay the escalation when reserve is compromised.'],
    generate: makeFuelEmergencyGenerator()
  },
  {
    id: 'fuel-direct-approach-landing',
    title: 'Fuel Emergency · Direct and Landing',
    desc: 'Read back direct vectors and immediate landing clearance',
    keywords: ['Fuel', 'Direct', 'Landing'],
    hints: [
      'Confirm direct fix/runway and final clearance.',
      'Keep readback crisp to reduce frequency load.'
    ],
    fields: [
      {
        key: 'fuel-direct-heading',
        label: 'Heading',
        expected: scenario => scenario.vectorHeading,
        alternatives: scenario => [scenario.vectorHeadingWords],
        width: 'sm' as const
      },
      {
        key: 'fuel-direct-runway',
        label: 'Runway',
        expected: scenario => scenario.arrivalRunway,
        alternatives: scenario => [scenario.arrivalRunwayWords],
        width: 'sm' as const
      },
      {
        key: 'fuel-direct-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Heading ' },
      { type: 'field' as const, key: 'fuel-direct-heading', width: 'sm' as const },
      { type: 'text' as const, text: ', cleared straight-in runway ' },
      { type: 'field' as const, key: 'fuel-direct-runway', width: 'sm' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'fuel-direct-callsign', width: 'lg' as const }
    ],
    defaultFrequency: 'TWR',
    phrase: scenario =>
      `${scenario.radioCall}, turn heading ${scenario.vectorHeadingWords}, direct final runway ${scenario.arrivalRunwayWords}, cleared to land.`,
    info: () => ['Emergency fuel arrivals require fastest safe path to runway.'],
    generate: makeFuelEmergencyGenerator()
  },
  {
    id: 'diversion-problem-report',
    title: 'Diversion · Problem Report',
    desc: 'Report the issue that requires diversion',
    keywords: ['Diversion', 'Report', 'Scenario'],
    hints: [
      'State callsign and problem in one concise line.',
      'Prepare to request alternate routing next.'
    ],
    fields: [
      {
        key: 'div-report-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'div-report-problem',
        label: 'Problem',
        expected: scenario => scenario.emergencyProblem,
        width: 'xl' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'div-report-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'div-report-problem', width: 'xl' as const }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, report your issue for ATC coordination.`,
    info: () => ['Keep the first report short to open diversion coordination quickly.'],
    generate: makeDiversionGenerator(true)
  },
  {
    id: 'diversion-request',
    title: 'Diversion · Request Alternate',
    desc: 'Request diversion to the alternate airport',
    keywords: ['Diversion', 'Request', 'Alternate'],
    hints: [
      'Use explicit request diversion phraseology.',
      'Name the alternate airport/city clearly.'
    ],
    fields: [
      {
        key: 'div-request-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      },
      {
        key: 'div-request-alt',
        label: 'Alternate',
        expected: scenario => scenario.destination.city,
        alternatives: scenario => [scenario.destination.icao, scenario.destination.name],
        width: 'md' as const
      }
    ],
    readback: [
      { type: 'field' as const, key: 'div-request-callsign', width: 'lg' as const },
      { type: 'text' as const, text: ', request diversion to ' },
      { type: 'field' as const, key: 'div-request-alt', width: 'md' as const }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario => `${scenario.radioCall}, request diversion to ${scenario.destination.city}.`,
    info: scenario => [`Alternate planned: ${scenario.destination.city} (${scenario.destination.icao})`],
    generate: makeDiversionGenerator()
  },
  {
    id: 'diversion-new-clearance',
    title: 'Diversion · New Clearance',
    desc: 'Read back new routing and altitude for alternate',
    keywords: ['Diversion', 'Clearance', 'Readback'],
    hints: [
      'Treat diversion clearance like a full amendment.',
      'Read destination, route and altitude.'
    ],
    fields: [
      {
        key: 'div-clear-destination',
        label: 'Destination',
        expected: scenario => scenario.destination.city,
        alternatives: scenario => [scenario.destination.icao],
        width: 'md' as const
      },
      {
        key: 'div-clear-transition',
        label: 'Direct fix',
        expected: scenario => scenario.transition,
        width: 'md' as const
      },
      {
        key: 'div-clear-altitude',
        label: 'Altitude',
        expected: scenario => scenario.altitudes.initial.toString(),
        alternatives: scenario => [scenario.altitudes.initialWords],
        width: 'md' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Cleared to ' },
      { type: 'field' as const, key: 'div-clear-destination', width: 'md' as const },
      { type: 'text' as const, text: ', direct ' },
      { type: 'field' as const, key: 'div-clear-transition', width: 'md' as const },
      { type: 'text' as const, text: ', maintain ' },
      { type: 'field' as const, key: 'div-clear-altitude', width: 'md' as const }
    ],
    defaultFrequency: 'CTR',
    phrase: scenario =>
      `${scenario.radioCall}, amended clearance: proceed direct ${scenario.transition}, maintain ${scenario.altitudes.initial}, cleared ${scenario.destination.city}.`,
    info: () => ['Diversion clearance replaces previous routing.'],
    generate: makeDiversionGenerator()
  },
  {
    id: 'diversion-approach-landing',
    title: 'Diversion · Approach and Landing',
    desc: 'Complete diversion with approach and landing readback',
    keywords: ['Diversion', 'Approach', 'Landing'],
    hints: [
      'Confirm approach type and runway at alternate.',
      'End with full callsign.'
    ],
    fields: [
      {
        key: 'div-approach-type',
        label: 'Approach',
        expected: scenario => scenario.approach,
        width: 'lg' as const
      },
      {
        key: 'div-approach-runway',
        label: 'Runway',
        expected: scenario => scenario.arrivalRunway,
        alternatives: scenario => [scenario.arrivalRunwayWords],
        width: 'sm' as const
      },
      {
        key: 'div-approach-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: emergencyCallsignAlternatives,
        width: 'lg' as const
      }
    ],
    readback: [
      { type: 'text' as const, text: 'Cleared ' },
      { type: 'field' as const, key: 'div-approach-type', width: 'lg' as const },
      { type: 'text' as const, text: ' runway ' },
      { type: 'field' as const, key: 'div-approach-runway', width: 'sm' as const },
      { type: 'text' as const, text: ', ' },
      { type: 'field' as const, key: 'div-approach-callsign', width: 'lg' as const }
    ],
    defaultFrequency: 'APP',
    phrase: scenario =>
      `${scenario.radioCall}, cleared ${scenario.approach} approach runway ${scenario.arrivalRunwayWords}, then contact tower for landing.`,
    info: scenario => [`Alternate destination: ${scenario.destination.name}`],
    generate: makeDiversionGenerator()
  }
]

export const learnModules: ModuleDef[] = [
  {
    id: 'normalize',
    title: 'Fundamentals · Basics',
    subtitle: 'Alphabet, Call Signs, ATIS & METAR',
    art: '/img/learn/modules/img14.jpeg',
    lessons: fundamentalsLessons
  },
  {
    id: 'arc',
    title: 'Readbacks · Essential Calls',
    subtitle: 'Clearances, taxi, approach & landing',
    art: '/img/learn/modules/img11.jpeg',
    lessons: readbackLessons
  },
  {
    id: 'decision-tree',
    title: 'ATC · Advanced Calls',
    subtitle: 'Requests, contingencies & interrupts',
    art: '/img/learn/modules/img10.jpeg',
    lessons: decisionTreeLessons
  },
  {
    id: 'full-flight',
    title: 'Full Flight · Gate to Gate',
    subtitle: 'One linked scenario from clearance to taxi-in',
    art: '/img/learn/modules/img6.jpeg',
    lessons: fullFlightLessons,
    meta: {
      flightPlan: true,
      briefingArt: '/img/learn/missions/full-flight/briefing-hero.png'
    }
  }
]

export const learnTracks: TrackDef[] = [
  {
    id: 'core',
    title: 'Core Flight Missions',
    subtitle: 'From basics to full flight',
    modules: learnModules,
  },
  {
    id: 'abnormal',
    title: 'Abnormal & Emergency Missions',
    subtitle: 'Non-standard situations, emergencies & VATSIM procedures',
    modules: [
      {
        id: 'vatsim-essentials',
        title: 'VATSIM · Essentials',
        subtitle: 'Unicom, radio checks, frequency management',
        art: gradientArt(['#1a237e', '#283593', '#3949ab']),
        lessons: vatsimEssentialsLessons,
      },
      {
        id: 'abnormal-comms',
        title: 'Abnormal · Communications',
        subtitle: 'Holding, re-clearances, TCAS & conditional clearances',
        art: gradientArt(['#b71c1c', '#c62828', '#d32f2f']),
        lessons: abnormalCommsLessons,
      },
      {
        id: 'emergency-basics',
        title: 'Emergency · Basics',
        subtitle: 'MAYDAY, PAN PAN, squawk codes and fuel emergencies',
        art: gradientArt(['#e65100', '#ef6c00', '#f57c00']),
        lessons: emergencyBasicsLessons,
      },
      {
        id: 'emergency-scenarios',
        title: 'Emergency · Scenario Flights',
        subtitle: 'Multi-step emergency scenarios from onset to landing',
        art: gradientArt(['#ff6f00', '#ff8f00', '#ffa000']),
        lessons: emergencyScenarioLessons,
      },
    ],
  },
  {
    id: 'atc-perspective',
    title: 'ATC Perspective Missions',
    subtitle: 'Understand, decide and control like ATC',
    modules: atcPerspectiveModules,
  }
]

export default learnModules
