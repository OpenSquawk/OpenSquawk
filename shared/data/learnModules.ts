import { createBaseScenario, createScenarioSeries, formatTemp } from '~~/shared/learn/scenario'
import type { ModuleDef, Scenario } from '~~/shared/learn/types'

function gradientArt(colors: string[]): string {
  const stops = colors
    .map((color, idx) => `<stop offset="${Math.round((idx / Math.max(colors.length - 1, 1)) * 100)}%" stop-color="${color}"/>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect fill="url(#g)" width="400" height="240"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const fundamentalsLessons = [
  {
    id: 'icao-alphabet',
    title: 'ICAO Alphabet & Numbers',
    desc: 'Spell letters and digits clearly',
    keywords: ['Alphabet', 'Numbers', 'Basics'],
    hints: [
      'Spell each letter with its ICAO name (e.g. Delta, Lima, Hotel).',
      'Use ATC numbers: tree, fower, fife, niner.'
    ],
    fields: [
      {
        key: 'letters',
        label: 'Letters',
        expected: scenario => scenario.callsignNato,
        placeholder: 'Delta Lima Hotel',
        width: 'xl',
        threshold: 0.9
      },
      {
        key: 'digits',
        label: 'Numbers',
        expected: scenario => scenario.flightNumberWords,
        placeholder: 'one two three',
        width: 'lg',
        threshold: 0.88
      }
    ],
    readback: [
      { type: 'text', text: 'Call sign: ' },
      { type: 'field', key: 'letters', width: 'lg' },
      { type: 'text', text: ' · ' },
      { type: 'field', key: 'digits', width: 'md' }
    ],
    defaultFrequency: 'DEL',
    phrase: scenario => `${scenario.callsignNato} ${scenario.flightNumberWords}`,
    info: scenario => [
      `Callsign: ${scenario.callsign}`,
      `Radio call: ${scenario.radioCall}`,
      `ICAO spelling: ${scenario.callsignNato}`,
      `Flight number spoken: ${scenario.flightNumberWords}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'radio-call',
    title: 'Radio Call Sign',
    desc: 'Say the spoken and ICAO call sign',
    keywords: ['Basics', 'Callsign'],
    hints: [
      'Use the airline telephony plus digits for the spoken version.',
      'ICAO format keeps the three-letter code with the numbers.'
    ],
    fields: [
      {
        key: 'radio-call-spoken',
        label: 'Spoken Call Sign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          `${scenario.airlineCall} ${scenario.flightNumberWords}`
        ],
        width: 'lg'
      },
      {
        key: 'radio-call-icao',
        label: 'ICAO Identifier',
        expected: scenario => scenario.callsign,
        alternatives: scenario => [
          scenario.callsign,
          `${scenario.airlineCode}${scenario.flightNumber}`
        ],
        width: 'md'
      }
    ],
    readback: [
      { type: 'text', text: 'Call sign ' },
      { type: 'field', key: 'radio-call-spoken', width: 'lg' },
      { type: 'text', text: ' · ICAO ' },
      { type: 'field', key: 'radio-call-icao', width: 'md' }
    ],
    defaultFrequency: 'DEL',
    phrase: scenario => `${scenario.radioCall}`,
    info: scenario => [
      `Spoken call sign: ${scenario.radioCall}`,
      `ICAO identifier: ${scenario.callsign}`
    ],
    generate: createBaseScenario
  },
  {
    id: 'atis',
    title: 'Understand the ATIS',
    desc: 'Extract the identifier and key data from the ATIS',
    keywords: ['ATIS', 'Weather'],
    hints: [
      'Remember the ATIS identifier as a single letter.',
      'Order: runway – wind – visibility – temperature – dew point – QNH.'
    ],
    fields: [
      {
        key: 'atis-code',
        label: 'ATIS',
        expected: scenario => scenario.atisCode,
        alternatives: scenario => [
          scenario.atisCode,
          scenario.atisCode.toLowerCase(),
          `Information ${scenario.atisCode}`
        ],
        placeholder: 'Letter',
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
        expected: scenario => scenario.atisSummary.visibility,
        alternatives: scenario => [scenario.visibility, scenario.visibilityWords],
        width: 'sm'
      },
      {
        key: 'atis-temp',
        label: 'Temperature',
        expected: scenario => scenario.atisSummary.temperature,
        alternatives: scenario => [scenario.temperatureWords],
        width: 'sm'
      },
      {
        key: 'atis-dew',
        label: 'Dew point',
        expected: scenario => scenario.atisSummary.dewpoint,
        alternatives: scenario => [scenario.dewpointWords],
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
      'Note the identifier, runway, wind, visibility, temperature, dew point, and QNH.',
      'Visibility: four digits or 9999 for ≥10 km; QNH as a four-digit value.'
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
        placeholder: '9999',
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
    desc: 'Report readability',
    keywords: ['Ground', 'Comms'],
    hints: [
      'Reply with "Readability" followed by the number.',
      'Always finish the check with your call sign.'
    ],
    fields: [
      {
        key: 'rc-callsign',
        label: 'Callsign',
        expected: scenario => scenario.radioCall,
        alternatives: scenario => [
          scenario.radioCall,
          `${scenario.airlineCall} ${scenario.flightNumber}`,
          scenario.callsign
        ],
        placeholder: 'Lufthansa one two three',
        width: 'lg'
      },
      {
        key: 'rc-readability',
        label: 'Readability',
        expected: scenario => scenario.readabilityWord,
        alternatives: scenario => [scenario.readability.toString(), scenario.readabilityWord],
        placeholder: 'five',
        width: 'sm'
      }
    ],
    readback: [
      { type: 'text', text: 'This is ' },
      { type: 'field', key: 'rc-callsign', width: 'lg' },
      { type: 'text', text: ', readability ' },
      { type: 'field', key: 'rc-readability', width: 'sm' }
    ],
    defaultFrequency: 'GND',
    phrase: scenario => `${scenario.airport.name} Ground, ${scenario.radioCall}, radio check on ${scenario.groundFreq}.`,
    info: scenario => [
      `Frequency: ${scenario.groundFreq} (${scenario.frequencyWords.GND})`,
      `Expected response: Readability ${scenario.readability} (${scenario.readabilityWord})`
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
          `${scenario.pushDelayMinutes} minutes`
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
    phrase: scenario => `Emergency scenario: ${scenario.emergencyProblem}. Declare MAYDAY with intentions ${scenario.emergencyIntent}.`,
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
    phrase: scenario => `Urgent situation: ${scenario.emergencyProblem}. Declare PAN to obtain priority.`,
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
    title: 'Readbacks · Mandatory Acknowledgements',
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
    art: '/img/learn/modules/img12.jpeg',
    lessons: fullFlightLessons
  }
]

export default learnModules
