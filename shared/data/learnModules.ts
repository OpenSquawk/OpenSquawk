import { createBaseScenario, formatTemp } from '~~/shared/learn/scenario'
import type { ModuleDef } from '~~/shared/learn/types'

function gradientArt(colors: string[]): string {
  const stops = colors
    .map((color, idx) => `<stop offset="${Math.round((idx / Math.max(colors.length - 1, 1)) * 100)}%" stop-color="${color}"/>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect fill="url(#g)" width="400" height="240"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const learnModules: ModuleDef[] = [
  {
    id: 'normalize',
    title: 'Normalize · Fundamentals',
    subtitle: 'Alphabet, ATIS, METAR & Radio Check',
    art: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1600&auto=format&fit=crop',
    lessons: [
      {
        id: 'icao-alphabet',
        title: 'ICAO Alphabet & Numbers',
        desc: 'Spell letters and digits clearly',
        keywords: ['Alphabet', 'Numbers', 'Normalize'],
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
  },
  {
    id: 'arc',
    title: 'ARC Decision Tree',
    subtitle: 'From clearance call to departure',
    art: gradientArt(['#f97316', '#fb923c', '#0f172a']),
    lessons: [
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
          `Squawk: ${scenario.squawk} (${scenario.squawkWords})`
        ],
        generate: createBaseScenario
      },
      {
        id: 'pushback',
        title: 'Push & Start Readback',
        desc: 'Acknowledge the pushback clearance',
        keywords: ['Ground', 'Pushback'],
        hints: [
          'Repeat the runway direction and QNH, call sign at the end.',
          'QNH may be just the number or "QNH xxxx".'
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
          `Stand/Gate: ${scenario.stand}`,
          `Ground: ${scenario.groundFreq} (${scenario.frequencyWords.GND})`
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
          `Line-up: runway ${scenario.runway}`
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
          `Tower: ${scenario.towerFreq} (${scenario.frequencyWords.TWR})`,
          `Wind: ${scenario.wind} (${scenario.windWords})`
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
            label: 'Frequenz',
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
          `Initial Altitude: ${scenario.altitudes.initial} ft (${scenario.altitudes.initialWords})`,
          `SID: ${scenario.sid}`
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
        id: 'center-handoff',
        title: 'Center Handoff',
        desc: 'Acknowledge the handoff to center',
        keywords: ['Center', 'Handoff'],
        hints: [
          'Repeat the frequency exactly (with or without the decimal point).',
          'Place the call sign at the end.'
        ],
        fields: [
          {
            key: 'ctr-freq',
            label: 'Frequenz',
            expected: scenario => scenario.centerFreq,
            alternatives: scenario => [
              scenario.centerFreq,
              scenario.centerFreq.replace('.', ''),
              scenario.frequencyWords.CTR
            ],
            width: 'md'
          },
          {
            key: 'ctr-callsign',
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
          { type: 'field', key: 'ctr-freq', width: 'md' },
          { type: 'text', text: ', ' },
          { type: 'field', key: 'ctr-callsign', width: 'lg' }
        ],
        defaultFrequency: 'CTR',
        phrase: scenario => `${scenario.radioCall}, contact center ${scenario.centerFreq}.`,
        info: scenario => [
          `Center: ${scenario.centerFreq} (${scenario.frequencyWords.CTR})`,
          `Next unit: Center`
        ],
        generate: createBaseScenario
      }
    ]
  }
]

export default learnModules
