export type BlankWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type FrequencyType = 'ATIS' | 'DEL' | 'GND' | 'TWR' | 'DEP' | 'APP' | 'CTR'

export type Frequency = {
  type: FrequencyType
  label: string
  value: string
}

export type AirportData = {
  icao: string
  name: string
  city: string
  runways: string[]
  stands: string[]
  sids: string[]
  stars?: string[]
  transitions: string[]
  arrivalTransitions?: string[]
  approaches: string[]
  missedApproaches?: string[]
  taxi: string[]
  taxiIn?: string[]
  speedRestrictions?: number[]
  emergencyHeadings?: string[]
  freqs: {
    atis: string
    delivery: string
    ground: string
    tower: string
    departure: string
    approach: string
    center: string
  }
  transLevel: string
}

export type AirlineData = {
  code: string
  call: string
}

export type Scenario = {
  callsign: string
  airlineCode: string
  airlineCall: string
  radioCall: string
  phoneticCode: string
  phoneticCodeWords: string
  callsignNato: string
  flightNumber: string
  flightNumberWords: string
  airport: AirportData
  destination: AirportData
  runway: string
  runwayWords: string
  stand: string
  taxiRoute: string
  sid: string
  transition: string
  approach: string
  arrivalRunway: string
  arrivalRunwayWords: string
  arrivalTaxiRoute: string
  arrivalStand: string
  arrivalStar: string
  arrivalTransition: string
  arrivalQnh: number
  arrivalQnhWords: string
  arrivalWind: string
  arrivalWindWords: string
  altitudes: {
    initial: number
    climb: number
    initialWords: string
    climbWords: string
  }
  squawk: string
  squawkWords: string
  qnh: number
  qnhWords: string
  atisCode: string
  atisCodeWord: string
  atisText: string
  atisSummary: {
    runway: string
    wind: string
    visibility: string
    temperature: string
    dewpoint: string
    qnh: string
  }
  wind: string
  windWords: string
  visibility: string
  visibilityWords: string
  temperature: number
  temperatureWords: string
  dewpoint: number
  dewpointWords: string
  approachAltitude: number
  approachAltitudeWords: string
  pushDelayMinutes: number
  pushDelayWords: string
  speedRestriction: number
  speedRestrictionWords: string
  vectorHeading: string
  vectorHeadingWords: string
  emergencyHeading: string
  emergencyHeadingWords: string
  missedApproach: string
  metar: string
  metarSegments: {
    wind: string
    visibility: string
    temp: string
    qnh: string
  }
  readability: number
  readabilityWord: string
  readabilityPhrase: string
  frequencies: Frequency[]
  frequencyWords: Record<FrequencyType, string>
  handoff: {
    type: FrequencyType
    facility: string
    short: string
    frequency: string
    frequencyWords: string
  }
  atisFreq: string
  deliveryFreq: string
  groundFreq: string
  towerFreq: string
  departureFreq: string
  approachFreq: string
  centerFreq: string
  transLevel: string
  remarks: string
  emergencyProblem: string
  emergencyIntent: string
}

export type LessonField = {
  key: string
  label: string
  expected: (scenario: Scenario) => string
  alternatives?: (scenario: Scenario) => string[]
  threshold?: number
  placeholder?: string
  width?: BlankWidth
  inputmode?: 'text' | 'numeric'
}

export type ReadbackSegment =
  | { type: 'text'; text: string | ((scenario: Scenario) => string) }
  | { type: 'field'; key: string; width?: BlankWidth }

export type Lesson = {
  id: string
  title: string
  desc: string
  keywords: string[]
  hints: string[]
  fields: LessonField[]
  readback: ReadbackSegment[]
  defaultFrequency?: string
  phrase: (scenario: Scenario) => string
  info: (scenario: Scenario) => string[]
  generate: () => Scenario
}

export type ModuleMeta = {
  flightPlan?: boolean
  briefingArt?: string
}

export type ModuleDef = {
  id: string
  title: string
  subtitle: string
  art: string
  lessons: Lesson[]
  meta?: ModuleMeta
}

export type TrackDef = {
  id: string
  title: string
  subtitle: string
  modules: ModuleDef[]
}
