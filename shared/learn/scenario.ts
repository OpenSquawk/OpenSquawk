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

const phoneticCodeCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')

function randomPhoneticCode(length = 5): string {
  let value = ''
  for (let i = 0; i < length; i++) {
    value += choice(phoneticCodeCharacters)
  }
  return value
}

function codeToPhonetic(value: string): string {
  return value
    .toUpperCase()
    .split('')
    .map(char => {
      if (natoMap[char]) return natoMap[char]
      if (atcNumberWords[char]) return atcNumberWords[char]
      return char
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function generateSquawk(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += String(randInt(0, 7))
  }
  return code
}

export function digitsToWords(value: string): string {
  return value
    .split('')
    .map(char => atcNumberWords[char] ?? char)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function lettersToNato(value: string): string {
  return value
    .toUpperCase()
    .split('')
    .map(char => natoMap[char] ?? char)
    .join(' ')
}

export function runwayToWords(runway: string): string {
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

export function minutesToWords(minutes: number): string {
  const value = Math.max(1, Math.round(minutes))
  const unit = value === 1 ? 'minute' : 'minutes'
  return `${digitsToWords(value.toString())} ${unit}`
}

export function speedToWords(speed: number): string {
  return `${digitsToWords(Math.round(speed).toString())} knots`
}

export function altitudeToWords(value: number): string {
  const thousands = Math.floor(value / 1000)
  const remainder = value % 1000
  let words = thousands ? `${digitsToWords(thousands.toString())} thousand` : ''
  if (remainder) {
    words = `${words} ${digitsToWords(remainder.toString())}`.trim()
  }
  return words.trim()
}

export function createBaseScenario(): Scenario {
  const airport = choice(airportsData)
  const possibleDestinations = airportsData.filter(a => a.icao !== airport.icao)
  const destination = choice(possibleDestinations)
  const airline = choice(airlines)
  const flightNumber = randomFlightNumber()
  const callsign = `${airline.code}${flightNumber}`
  const phoneticCode = randomPhoneticCode()
  const phoneticCodeWords = codeToPhonetic(phoneticCode)
  const runway = choice(airport.runways)
  const stand = choice(airport.stands)
  const taxiRoute = choice(airport.taxi)
  const sid = choice(airport.sids)
  const transition = choice(airport.transitions)
  const arrivalRunway = choice(destination.runways)
  const arrivalStand = choice(destination.stands)
  const arrivalTaxiRoute = choice(destination.taxiIn ?? destination.taxi)
  const arrivalStar = choice(destination.stars ?? destination.sids)
  const arrivalTransition = choice(destination.arrivalTransitions ?? destination.transitions)
  const approach = choice(destination.approaches)
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
  const atisCodeWord = lettersToNato(atisCode)
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

  // Emergency / abnormal extensions
  const soulsOnBoard = randInt(87, 224)
  const soulsOnBoardWords = digitsToWords(soulsOnBoard.toString())
  const fuelMinutes = randInt(25, 180)
  const fuelMinutesWords = minutesToWords(fuelMinutes)
  const positionDistance = randInt(10, 60)
  const positionDirection = choice(['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'])
  const positionFix = choice([...airport.transitions, ...(destination.arrivalTransitions ?? destination.transitions)])
  const positionDescription = `${positionDistance} miles ${positionDirection} of ${positionFix}`

  const holdingFixOptions = [...airport.transitions, ...(destination.arrivalTransitions ?? destination.transitions)]
  const holdingFix = choice(holdingFixOptions)
  const holdingInbound = (randInt(0, 35) * 10).toString().padStart(3, '0')
  const holdingTurn = choice(['right', 'left'] as const)
  const holdingLegTime = choice(['1', '1.5', '2'])
  const holdingEfcNow = new Date()
  const holdingEfcMinutes = randInt(10, 45)
  const efcTime = new Date(holdingEfcNow.getTime() + holdingEfcMinutes * 60000)
  const holdingEfc = `${efcTime.getUTCHours().toString().padStart(2, '0')}${efcTime.getUTCMinutes().toString().padStart(2, '0')}`

  const crossingFixOptions = [...(destination.arrivalTransitions ?? destination.transitions)]
  const crossingFix1 = crossingFixOptions[0] ?? 'LIPSO'
  const crossingFix2 = crossingFixOptions.length > 1 ? crossingFixOptions[1] : 'VAMPS'
  const crossingAlt1Raw = choice([8000, 9000, 10000, 11000])
  const crossingAlt2Raw = choice([5000, 6000, 7000])
  const crossingAlt1 = crossingAlt1Raw.toString()
  const crossingAlt2 = crossingAlt2Raw.toString()
  const crossingRestriction1 = choice(['at or above', 'at', 'at or below'] as const)

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

  const contactFrequencies = frequencies.filter(freq => freq.type !== 'ATIS')
  const handoffTarget = choice(contactFrequencies)
  const handoffCity = handoffTarget.type === 'CTR' ? destination.city : airport.city
  const handoffFacility = `${handoffCity} ${handoffTarget.label}`.trim()
  const handoffFrequencyWords = frequencyWords[handoffTarget.type]

  const readability = choice(readabilityScale)

  const atisText = `${airport.name} information ${atisCodeWord}, time ${timestamp.slice(2, 4)}${timestamp.slice(4, 6)}, runway ${
    runwayToWords(runway)
  } in use, wind ${windToWords(windDirection, windSpeed)}, visibility ${visibilityToWords(visibility)}, temperature ${
    temperatureToWords(temperature)
  }, dew point ${temperatureToWords(dewpoint)}, QNH ${qnh}, transition level ${airport.transLevel.replace('FL', '')}.`

  return {
    callsign,
    airlineCode: airline.code,
    airlineCall: airline.call,
    radioCall: `${airline.call} ${digitsToWords(flightNumber)}`,
    phoneticCode,
    phoneticCodeWords,
    callsignNato: lettersToNato(airline.code),
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
    atisCodeWord,
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
    handoff: {
      type: handoffTarget.type,
      facility: handoffFacility,
      short: handoffTarget.label,
      frequency: handoffTarget.value,
      frequencyWords: handoffFrequencyWords
    },
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
    emergencyIntent,
    soulsOnBoard,
    soulsOnBoardWords,
    fuelMinutes,
    fuelMinutesWords,
    positionDescription,
    holdingFix,
    holdingInbound,
    holdingTurn,
    holdingLegTime,
    holdingEfc,
    crossingFix1,
    crossingAlt1,
    crossingAlt1Words: altitudeToWords(crossingAlt1Raw),
    crossingRestriction1,
    crossingFix2,
    crossingAlt2,
    crossingAlt2Words: altitudeToWords(crossingAlt2Raw),
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
  setScenario: (scenario: Scenario | null) => void
  peek: () => Scenario | null
}

export function createScenarioSeries(source?: () => Scenario): ScenarioGenerator {
  let cached: Scenario | null = null
  let override: Scenario | null = null
  const resolveSource = () => {
    if (override) {
      return cloneScenario(override)
    }
    return source ? source() : createBaseScenario()
  }
  const generator = (() => {
    if (!cached) {
      cached = resolveSource()
    }
    return cloneScenario(cached)
  }) as ScenarioGenerator
  generator.reset = () => {
    cached = override ? cloneScenario(override) : null
  }
  generator.setScenario = (scenario: Scenario | null) => {
    override = scenario ? cloneScenario(scenario) : null
    cached = override ? cloneScenario(override) : null
  }
  generator.peek = () => {
    if (cached) return cloneScenario(cached)
    if (override) return cloneScenario(override)
    return null
  }
  return generator
}
