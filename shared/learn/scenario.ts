import type { AirlineData, AirportData, Frequency, FrequencyType, Scenario } from './types'

const natoMap: Record<string, string> = {
  A: 'Alpha',
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
  Z: 'Zulu'
}

const atcNumberWords: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'tree',
  '4': 'four',
  '5': 'fife',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'niner'
}

const runwaySuffixWords: Record<string, string> = {
  L: 'left',
  R: 'right',
  C: 'center'
}

const readabilityScale = [
  { level: 1, word: 'one', description: 'Unreadable' },
  { level: 2, word: 'two', description: 'Barely readable' },
  { level: 3, word: 'three', description: 'Readable with difficulty' },
  { level: 4, word: 'four', description: 'Readable' },
  { level: 5, word: 'five', description: 'Perfectly readable' }
]

const emergencyProblems = [
  'engine failure on climb',
  'smoke in the cabin',
  'hydraulic failure',
  'medical emergency on board',
  'pressurization loss'
]

const pushDelayOptions = [3, 5, 7, 10]
const defaultSpeedRestrictions = [180, 200, 210, 220]
const approachAltitudeOptions = [3000, 4000, 5000, 6000]

export type ScenarioOverrides = {
  departureIcao?: string
  destinationIcao?: string
  airlineCode?: string
  flightNumber?: string
  callsign?: string
  radioTelephony?: string
  radioCall?: string
  runway?: string
  stand?: string
  taxiRoute?: string
  sid?: string
  transition?: string
  arrivalRunway?: string
  arrivalStand?: string
  arrivalTaxiRoute?: string
  arrivalStar?: string
  arrivalTransition?: string
  approach?: string
}

const airlines: AirlineData[] = [
  { code: 'DLH', call: 'Lufthansa' },
  { code: 'BAW', call: 'Speedbird' },
  { code: 'AFR', call: 'Air France' },
  { code: 'KLM', call: 'KLM' },
  { code: 'SWR', call: 'Swiss' },
  { code: 'EZY', call: 'Easyjet' }
]

const airportsData: AirportData[] = [
  {
    icao: 'EDDF',
    name: 'Frankfurt/Main',
    city: 'Frankfurt',
    runways: ['25C', '25R', '07C', '07R', '18'],
    stands: ['V155', 'A12', 'B24', 'G5', 'H43', 'L21'],
    sids: ['ANEKI 7S', 'TOBAK 5Q', 'OBOKA 6N'],
    stars: ['ANEKI 2A', 'TOBAK 3G', 'UNOKO 1S'],
    transitions: ['ANEKI', 'TOBAK', 'OBOKA'],
    arrivalTransitions: ['ANEKI', 'TOBAK', 'UNOKO'],
    approaches: ['ILS Z 25C', 'ILS Y 07C'],
    missedApproaches: [
      'Climb straight ahead to 3000 feet, then as published.',
      'As published.'
    ],
    taxi: ['N3 U4', 'V A', 'N7 K', 'S V12'],
    taxiIn: ['S N7', 'V12 S1', 'A K5', 'N3 U4'],
    speedRestrictions: [200, 210],
    emergencyHeadings: ['180', '220', '270'],
    freqs: {
      atis: '126.350',
      delivery: '121.900',
      ground: '121.800',
      tower: '118.700',
      departure: '125.350',
      approach: '120.800',
      center: '134.200'
    },
    transLevel: 'FL070'
  },
  {
    icao: 'EDDM',
    name: 'Munich',
    city: 'Munich',
    runways: ['26R', '26L', '08R', '08L'],
    stands: ['211', '214', '302', 'N16', 'H45'],
    sids: ['OBAXA 3S', 'MERSI 6S', 'TULSI 5M'],
    stars: ['OBAXA 4A', 'MERSI 3S', 'TULSI 2M'],
    transitions: ['OBAXA', 'MERSI', 'TULSI'],
    arrivalTransitions: ['OBAXA', 'MERSI', 'TULSI'],
    approaches: ['ILS Z 26R', 'ILS Y 08R'],
    missedApproaches: [
      'Climb to 4000 feet, then as published.',
      'As published.'
    ],
    taxi: ['L4 N3', 'P3 W2', 'S1 D2'],
    taxiIn: ['P3 W2', 'S1 D2', 'L4 N3'],
    speedRestrictions: [190, 210],
    emergencyHeadings: ['200', '240', '280'],
    freqs: {
      atis: '122.130',
      delivery: '121.775',
      ground: '121.800',
      tower: '118.700',
      departure: '129.050',
      approach: '120.800',
      center: '133.700'
    },
    transLevel: 'FL070'
  },
  {
    icao: 'EHAM',
    name: 'Amsterdam Schiphol',
    city: 'Amsterdam',
    runways: ['24', '36L', '18C', '09'],
    stands: ['D14', 'E22', 'F8', 'H4'],
    sids: ['SUGOL 2S', 'ANDIK 2S', 'ARNEM 2V'],
    stars: ['SUGOL 2A', 'ANDIK 2S', 'ARNEM 2V'],
    transitions: ['SUGOL', 'ANDIK', 'ARNEM'],
    arrivalTransitions: ['SUGOL', 'ANDIK', 'ARNEM'],
    approaches: ['ILS Z 24', 'ILS Y 18C'],
    missedApproaches: [
      'Climb straight ahead to 2000 feet, then left turn ANDIK.',
      'As published.'
    ],
    taxi: ['A5 B2', 'K1 V3', 'W4 S8'],
    taxiIn: ['A5 B2', 'K1 V3', 'W4 S8'],
    speedRestrictions: [180, 200],
    emergencyHeadings: ['180', '210', '250'],
    freqs: {
      atis: '136.050',
      delivery: '121.800',
      ground: '121.900',
      tower: '119.220',
      departure: '123.875',
      approach: '121.200',
      center: '135.050'
    },
    transLevel: 'FL060'
  }
]

const atisLetters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'.split('')

function choice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFlightNumber(): string {
  const length = Math.random() < 0.5 ? 3 : 4
  let value = ''
  for (let i = 0; i < length; i++) {
    value += String(randInt(0, 9))
  }
  if (value.startsWith('0')) value = '1' + value.slice(1)
  return value
}

function generateSquawk(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += String(randInt(0, 7))
  }
  return code
}

function digitsToWords(value: string): string {
  return value
    .split('')
    .map(char => atcNumberWords[char] ?? char)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function lettersToNato(value: string): string {
  return value
    .toUpperCase()
    .split('')
    .map(char => {
      if (natoMap[char]) return natoMap[char]
      if (atcNumberWords[char]) return atcNumberWords[char]
      return char
    })
    .join(' ')
}

function sanitizeFlightNumber(value?: string): string | null {
  if (!value) return null
  const digits = value.toString().replace(/[^0-9]/g, '')
  if (!digits) return null
  return digits.slice(0, 4)
}

function sanitizeCallsign(value?: string): string | null {
  if (!value) return null
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return cleaned ? cleaned.slice(0, 8) : null
}

function sanitizeTelephony(value?: string): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, 40) : null
}

function sanitizeFreeText(value?: string, max = 80): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

function matchOption(value: string | undefined, options: string[] | undefined): string | undefined {
  if (!value || !options?.length) return undefined
  const normalized = value.trim().toUpperCase()
  return options.find(option => option.toUpperCase() === normalized)
}

function runwayToWords(runway: string): string {
  const digits = runway.replace(/[^0-9]/g, '').padStart(2, '0')
  const suffix = runway.replace(/[0-9]/g, '')
  const base = digits
    .split('')
    .map(char => atcNumberWords[char] ?? char)
    .join(' ')
  const suffixWord = suffix ? runwaySuffixWords[suffix] ?? suffix.toLowerCase() : ''
  return suffixWord ? `${base} ${suffixWord}` : base
}

function frequencyToSpeech(freq: string): string {
  const [intPart, decimalPart] = freq.split('.')
  const intWords = digitsToWords(intPart)
  if (!decimalPart) return intWords
  const trimmed = decimalPart.replace(/0+$/, '')
  const decWords = trimmed ? digitsToWords(trimmed) : 'zero'
  return `${intWords} decimal ${decWords}`
}

export function formatTemp(temp: number): string {
  const prefix = temp < 0 ? 'M' : ''
  return `${prefix}${Math.abs(temp).toString().padStart(2, '0')}`
}

function temperatureToWords(temp: number): string {
  const prefix = temp < 0 ? 'minus' : 'plus'
  return `${prefix} ${digitsToWords(Math.abs(temp).toString())}`
}

function qnhToWords(qnh: number): string {
  return digitsToWords(qnh.toString())
}

function windToWords(direction: number, speed: number): string {
  const dir = direction.toString().padStart(3, '0')
  const spd = speed.toString().padStart(2, '0')
  return `${dir
    .split('')
    .map(char => atcNumberWords[char] ?? char)
    .join(' ')} degrees at ${spd
    .split('')
    .map(char => atcNumberWords[char] ?? char)
    .join(' ')} knots`
}

function visibilityToWords(vis: string): string {
  if (vis === '9999') return 'ten kilometres or more'
  const numeric = Number(vis)
  if (!Number.isNaN(numeric)) {
    if (numeric >= 1000) {
      const km = Math.round(numeric / 1000)
      return `${digitsToWords(km.toString())} kilometres`
    }
    return `${digitsToWords(vis)} metres`
  }
  return vis
}

function minutesToWords(minutes: number): string {
  const value = Math.max(1, Math.round(minutes))
  const unit = value === 1 ? 'minute' : 'minutes'
  return `${digitsToWords(value.toString())} ${unit}`
}

function speedToWords(speed: number): string {
  return `${digitsToWords(Math.round(speed).toString())} knots`
}

function altitudeToWords(value: number): string {
  const thousands = Math.floor(value / 1000)
  const remainder = value % 1000
  let words = thousands ? `${digitsToWords(thousands.toString())} thousand` : ''
  if (remainder) {
    words = `${words} ${digitsToWords(remainder.toString())}`.trim()
  }
  return words.trim()
}

function findAirport(icao?: string): AirportData | undefined {
  if (!icao) return undefined
  const trimmed = icao.trim().toUpperCase()
  return airportsData.find(entry => entry.icao === trimmed)
}

function findAirline(code?: string): AirlineData | undefined {
  if (!code) return undefined
  const trimmed = code.trim().toUpperCase().slice(0, 3)
  return airlines.find(entry => entry.code === trimmed)
}

export function createBaseScenario(overrides: ScenarioOverrides = {}): Scenario {
  const airport = findAirport(overrides.departureIcao) ?? choice(airportsData)
  const destinationChoices = airportsData.filter(entry => entry.icao !== airport.icao)
  let destination = findAirport(overrides.destinationIcao)
  if (!destination || destination.icao === airport.icao) {
    destination = destinationChoices.length ? choice(destinationChoices) : airport
  }

  let airline = findAirline(overrides.airlineCode)
  let flightNumber = sanitizeFlightNumber(overrides.flightNumber) ?? ''
  let callsign = sanitizeCallsign(overrides.callsign) ?? ''

  if (!flightNumber && callsign) {
    const match = callsign.match(/([0-9]{1,4})$/)
    if (match) {
      flightNumber = match[1]
    }
  }

  if (!airline && callsign) {
    const prefix = callsign.replace(/[^A-Z]/g, '').slice(0, 3)
    airline = findAirline(prefix)
  }

  if (!flightNumber) {
    flightNumber = randomFlightNumber()
  }

  if (!callsign) {
    if (airline) {
      callsign = `${airline.code}${flightNumber}`
    } else if (overrides.airlineCode) {
      const fallbackCode = overrides.airlineCode.trim().toUpperCase().slice(0, 3)
      callsign = `${fallbackCode || 'FLT'}${flightNumber}`
      airline = findAirline(fallbackCode)
    } else {
      airline = choice(airlines)
      callsign = `${airline.code}${flightNumber}`
    }
  }

  if (!airline) {
    const derivedCode = callsign.slice(0, 3)
    airline = findAirline(derivedCode) ?? choice(airlines)
  }

  let telephony = sanitizeTelephony(overrides.radioTelephony) ?? airline.call
  const radioCall = sanitizeFreeText(overrides.radioCall, 80) ?? (flightNumber ? `${telephony} ${digitsToWords(flightNumber)}` : telephony)

  const runway = matchOption(overrides.runway, airport.runways) ?? choice(airport.runways)
  const standOverride = sanitizeFreeText(overrides.stand, 12)?.toUpperCase()
  const stand = matchOption(standOverride, airport.stands) ?? standOverride ?? choice(airport.stands)
  const taxiOverride = sanitizeFreeText(overrides.taxiRoute, 80)
  const taxiRoute = matchOption(taxiOverride, airport.taxi) ?? taxiOverride ?? choice(airport.taxi)
  const sid = matchOption(overrides.sid, airport.sids) ?? choice(airport.sids)
  const transition = matchOption(overrides.transition, airport.transitions) ?? choice(airport.transitions)

  const arrivalRunway = matchOption(overrides.arrivalRunway, destination.runways) ?? choice(destination.runways)
  const arrivalStandOverride = sanitizeFreeText(overrides.arrivalStand, 12)?.toUpperCase()
  const arrivalStand = matchOption(arrivalStandOverride, destination.stands) ?? arrivalStandOverride ?? choice(destination.stands)
  const arrivalTaxiOverride = sanitizeFreeText(overrides.arrivalTaxiRoute, 80)
  const arrivalTaxiOptions = destination.taxiIn && destination.taxiIn.length ? destination.taxiIn : destination.taxi
  const arrivalTaxiRoute = matchOption(arrivalTaxiOverride, arrivalTaxiOptions) ?? arrivalTaxiOverride ?? choice(arrivalTaxiOptions)
  const arrivalStarOptions = destination.stars && destination.stars.length ? destination.stars : destination.sids
  const arrivalStar = matchOption(overrides.arrivalStar, arrivalStarOptions) ?? choice(arrivalStarOptions)
  const arrivalTransitionOptions = destination.arrivalTransitions && destination.arrivalTransitions.length
    ? destination.arrivalTransitions
    : destination.transitions
  const arrivalTransition = matchOption(overrides.arrivalTransition, arrivalTransitionOptions) ?? choice(arrivalTransitionOptions)
  const approach = matchOption(overrides.approach, destination.approaches) ?? choice(destination.approaches)

  const overrideCode = overrides.airlineCode ? overrides.airlineCode.trim().toUpperCase().slice(0, 3) : ''
  const airlineCode = overrideCode || airline.code
  const altitude = choice([4000, 5000, 6000, 7000])
  const climbAltitude = altitude + 2000
  const squawk = generateSquawk()
  const qnh = randInt(984, 1032)
  const windDirection = randInt(0, 35) * 10
  const windSpeed = randInt(3, 18)
  const windDirectionStr = windDirection.toString().padStart(3, '0')
  const windSpeedStr = windSpeed.toString().padStart(2, '0')
  const visibility = choice(['9999', '9000', '8000', '6000'])
  const cloud = choice(['SKC', 'FEW020', 'SCT025', 'BKN030'])
  const temperature = randInt(-3, 28)
  const dewpoint = Math.max(temperature - randInt(2, 6), -10)
  const atisCode = choice(atisLetters)
  const remarks = choice(['NOSIG', 'BECMG 4000', 'TEMPO -SHRA'])
  const arrivalQnh = randInt(980, 1035)
  const arrivalWindDirection = randInt(0, 35) * 10
  const arrivalWindSpeed = randInt(3, 18)
  const approachAltitude = choice(approachAltitudeOptions)
  const speedRestriction = choice(destination.speedRestrictions ?? defaultSpeedRestrictions)
  const pushDelay = choice(pushDelayOptions)
  const vectorHeading = (randInt(0, 35) * 10).toString().padStart(3, '0')
  const emergencyHeadingRaw = destination.emergencyHeadings
    ? choice(destination.emergencyHeadings)
    : (randInt(0, 35) * 10).toString()
  const emergencyHeading = emergencyHeadingRaw.toString().padStart(3, '0')
  const missedApproach = choice(destination.missedApproaches ?? ['as published'])
  const emergencyIntentOptions = [
    `return to ${airport.city}`,
    `divert to ${destination.city}`,
    'land at nearest suitable aerodrome',
    'hold to troubleshoot'
  ]
  const emergencyProblem = choice(emergencyProblems)
  const emergencyIntent = choice(emergencyIntentOptions)
  const now = new Date()
  const minute = Math.floor(now.getUTCMinutes() / 5) * 5
  const timestamp = `${now.getUTCDate().toString().padStart(2, '0')}${now
    .getUTCHours()
    .toString()
    .padStart(2, '0')}${minute.toString().padStart(2, '0')}Z`
  const metarWindGroup = `${windDirectionStr}${windSpeedStr}KT`
  const tempGroup = `${formatTemp(temperature)}/${formatTemp(dewpoint)}`
  const metar = `${airport.icao} ${timestamp} ${metarWindGroup} ${visibility} ${cloud} ${tempGroup} Q${qnh
    .toString()
    .padStart(4, '0')} ${remarks}`
  const arrivalWind = `${arrivalWindDirection.toString().padStart(3, '0')}/${arrivalWindSpeed
    .toString()
    .padStart(2, '0')}`
  const arrivalRunwayWords = runwayToWords(arrivalRunway)
  const arrivalWindWords = windToWords(arrivalWindDirection, arrivalWindSpeed)
  const arrivalQnhWords = qnhToWords(arrivalQnh)
  const approachAltitudeWords = altitudeToWords(approachAltitude)
  const speedRestrictionWords = speedToWords(speedRestriction)
  const pushDelayWords = minutesToWords(pushDelay)
  const vectorHeadingWords = digitsToWords(vectorHeading)
  const emergencyHeadingWords = digitsToWords(emergencyHeading)

  const frequencies: Frequency[] = [
    { type: 'ATIS', label: 'ATIS', value: airport.freqs.atis },
    { type: 'DEL', label: 'Delivery', value: airport.freqs.delivery },
    { type: 'GND', label: 'Ground', value: airport.freqs.ground },
    { type: 'TWR', label: 'Tower', value: airport.freqs.tower },
    { type: 'DEP', label: 'Departure', value: airport.freqs.departure },
    { type: 'APP', label: 'Approach', value: airport.freqs.approach },
    { type: 'CTR', label: 'Center', value: airport.freqs.center }
  ]

  const frequencyWords = frequencies.reduce((acc, freq) => {
    acc[freq.type] = frequencyToSpeech(freq.value)
    return acc
  }, {} as Record<FrequencyType, string>)

  const readability = choice(readabilityScale)

  const atisText = `${airport.name} information ${atisCode}, time ${timestamp.slice(2, 4)}${timestamp.slice(4, 6)}, runway ${
    runwayToWords(runway)
  } in use, wind ${windToWords(windDirection, windSpeed)}, visibility ${visibilityToWords(visibility)}, temperature ${
    temperatureToWords(temperature)
  }, dew point ${temperatureToWords(dewpoint)}, QNH ${qnh}, transition level ${airport.transLevel.replace('FL', '')}.`

  return {
    callsign,
    airlineCode,
    airlineCall: telephony,
    radioCall,
    callsignNato: lettersToNato(callsign),
    flightNumber,
    flightNumberWords: digitsToWords(flightNumber),
    airport,
    destination,
    runway,
    runwayWords: runwayToWords(runway),
    stand,
    taxiRoute,
    sid,
    transition,
    approach,
    arrivalRunway,
    arrivalRunwayWords,
    arrivalTaxiRoute,
    arrivalStand,
    arrivalStar,
    arrivalTransition,
    arrivalQnh,
    arrivalQnhWords,
    arrivalWind,
    arrivalWindWords,
    altitudes: {
      initial: altitude,
      climb: climbAltitude,
      initialWords: altitudeToWords(altitude),
      climbWords: altitudeToWords(climbAltitude)
    },
    squawk,
    squawkWords: digitsToWords(squawk),
    qnh,
    qnhWords: qnhToWords(qnh),
    atisCode,
    atisText,
    atisSummary: {
      runway,
      wind: `${windDirectionStr}/${windSpeedStr}`,
      visibility,
      temperature: `${temperature}°C`,
      dewpoint: `${dewpoint}°C`,
      qnh: `QNH ${qnh}`
    },
    wind: `${windDirectionStr}/${windSpeedStr}`,
    windWords: windToWords(windDirection, windSpeed),
    visibility,
    visibilityWords: visibilityToWords(visibility),
    temperature,
    temperatureWords: temperatureToWords(temperature),
    dewpoint,
    dewpointWords: temperatureToWords(dewpoint),
    approachAltitude,
    approachAltitudeWords,
    pushDelayMinutes: pushDelay,
    pushDelayWords,
    speedRestriction,
    speedRestrictionWords,
    vectorHeading,
    vectorHeadingWords,
    emergencyHeading,
    emergencyHeadingWords,
    missedApproach,
    metar,
    metarSegments: {
      wind: metarWindGroup,
      visibility,
      temp: tempGroup,
      qnh: `Q${qnh.toString().padStart(4, '0')}`
    },
    readability: readability.level,
    readabilityWord: readability.word,
    readabilityPhrase: `Readability ${readability.word}`,
    frequencies,
    frequencyWords,
    atisFreq: airport.freqs.atis,
    deliveryFreq: airport.freqs.delivery,
    groundFreq: airport.freqs.ground,
    towerFreq: airport.freqs.tower,
    departureFreq: airport.freqs.departure,
    approachFreq: airport.freqs.approach,
    centerFreq: airport.freqs.center,
    transLevel: airport.transLevel,
    remarks,
    emergencyProblem,
    emergencyIntent
  }
}

function cloneScenario(scenario: Scenario): Scenario {
  if (typeof structuredClone === 'function') {
    return structuredClone(scenario)
  }
  return JSON.parse(JSON.stringify(scenario)) as Scenario
}

export type ScenarioGenerator = (() => Scenario) & {
  reset: () => void
  prime: (scenario: Scenario) => void
  clearPrime: () => void
}

export function createScenarioSeries(): ScenarioGenerator {
  let cached: Scenario | null = null
  let primed: Scenario | null = null

  const generator = (() => {
    if (primed) {
      return cloneScenario(primed)
    }
    if (!cached) {
      cached = createBaseScenario()
    }
    return cloneScenario(cached)
  }) as ScenarioGenerator

  generator.reset = () => {
    cached = null
  }

  generator.prime = (scenario: Scenario) => {
    primed = cloneScenario(scenario)
    cached = cloneScenario(scenario)
  }

  generator.clearPrime = () => {
    primed = null
    cached = null
  }

  return generator
}

export function listScenarioAirports(): Array<Pick<AirportData, 'icao' | 'name' | 'city'>> {
  return airportsData.map(airport => ({ icao: airport.icao, name: airport.name, city: airport.city }))
}

export function getScenarioAirport(icao: string): AirportData | null {
  const airport = findAirport(icao)
  return airport ? (JSON.parse(JSON.stringify(airport)) as AirportData) : null
}

export function listScenarioAirlines(): AirlineData[] {
  return airlines.map(airline => ({ ...airline }))
}

export function getScenarioAirline(code: string): AirlineData | null {
  const airline = findAirline(code)
  return airline ? { ...airline } : null
}
