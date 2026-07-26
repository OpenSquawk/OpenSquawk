import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSyntheticAtisText,
  deriveInfoLetter,
  extractRunwayFromAtisText,
  parseAtisLetter,
  parseMetar,
  resolveAtisReport,
  selectRunwayInUse,
  type RunwayEnd,
} from '../../shared/utils/atisReport.ts'

// --- Fixtures: recorded from the live sources on 2026-07-26 -------------------

// OpenAIP `airports?search=EDDF` -> items[0].runways
const EDDF_RUNWAYS: RunwayEnd[] = [
  { designator: '18',  trueHeading: 176, mainRunway: false, takeOffOnly: true,  landingOnly: false, lengthM: 3999 },
  { designator: '07R', trueHeading: 66,  mainRunway: false, takeOffOnly: false, landingOnly: false, lengthM: 4000 },
  { designator: '25L', trueHeading: 246, mainRunway: false, takeOffOnly: false, landingOnly: false, lengthM: 4000 },
  { designator: '07L', trueHeading: 66,  mainRunway: false, takeOffOnly: false, landingOnly: true,  lengthM: 2800 },
  { designator: '25R', trueHeading: 246, mainRunway: false, takeOffOnly: false, landingOnly: true,  lengthM: 2800 },
  { designator: '07C', trueHeading: 66,  mainRunway: true,  takeOffOnly: false, landingOnly: false, lengthM: 4000 },
  { designator: '25C', trueHeading: 246, mainRunway: true,  takeOffOnly: false, landingOnly: false, lengthM: 4000 },
]

const EDDC_RUNWAYS: RunwayEnd[] = [
  { designator: '04', trueHeading: 38,  mainRunway: true, takeOffOnly: false, landingOnly: false, lengthM: 2850 },
  { designator: '22', trueHeading: 218, mainRunway: true, takeOffOnly: false, landingOnly: false, lengthM: 2850 },
]

const EDDF_METAR = 'EDDF 261650Z AUTO 24016KT CAVOK 26/13 Q1006 BECMG 24011KT'
const EDDC_METAR = 'EDDC 261650Z AUTO 22006KT CAVOK 27/11 Q1003 BECMG 33008KT'
const EDDM_METAR = 'EDDM 261650Z AUTO 26014KT 230V290 CAVOK 26/13 Q1008 NOSIG'

// VATSIM datafeed, `atis[]` entry for EDDC_ATIS
const EDDC_VATSIM_TEXT = [
  'DRESDEN INFORMATION Q MET REPORT TIME 1650 EXPECT ILS APPROACH',
  'RUNWAY IN USE 22 TRANSITION LEVEL 70 DEPARTURE FREQUENCY',
  'UNICOM ON FREQUENCY 122.800 WIND 220 DEGREES 6 KNOTS',
  'CLOUDS AND VISIBILITY OK TEMPERATURE 27 DEW POINT 11 QNH',
  '1003 TREND BECOMING WIND 330 DEGREES 8 KNOTS INFORMATION Q',
  'OUT',
].join(' ')

// --- METAR parsing -----------------------------------------------------------

test('parseMetar reads observation time, wind and QNH', () => {
  const obs = parseMetar(EDDF_METAR)
  assert.ok(obs)
  assert.equal(obs.station, 'EDDF')
  assert.deepEqual(obs.observedAt, { day: 26, hour: 16, minute: 50 })
  assert.equal(obs.windDeg, 240)
  assert.equal(obs.windKt, 16)
  assert.equal(obs.windVariable, false)
  assert.equal(obs.qnhHpa, 1006)
})

test('parseMetar drops the station and timestamp from the spoken body', () => {
  const obs = parseMetar(EDDF_METAR)
  assert.ok(obs)
  assert.ok(!obs.body.includes('EDDF'), `body still carries the station: ${obs.body}`)
  assert.ok(!obs.body.includes('261650Z'), `body still carries the timestamp: ${obs.body}`)
  assert.ok(obs.body.startsWith('AUTO 24016KT'), obs.body)
})

test('parseMetar handles variable wind', () => {
  const obs = parseMetar('EDDN 261650Z VRB03KT CAVOK 24/12 Q1010')
  assert.ok(obs)
  assert.equal(obs.windVariable, true)
  assert.equal(obs.windDeg, null)
  assert.equal(obs.windKt, 3)
})

test('parseMetar handles calm wind and gusts', () => {
  const calm = parseMetar('EDDN 261650Z 00000KT CAVOK 24/12 Q1010')
  assert.equal(calm?.windKt, 0)

  const gusty = parseMetar('EDDH 261650Z 28015G28KT 9999 FEW035 18/12 Q1004')
  assert.equal(gusty?.windDeg, 280)
  assert.equal(gusty?.windKt, 15)
  assert.equal(gusty?.gustKt, 28)
})

test('parseMetar reads an inHg altimeter as hPa', () => {
  const obs = parseMetar('KJFK 261651Z 24016KT 10SM FEW040 26/13 A2992')
  assert.ok(obs)
  assert.equal(obs.qnhHpa, 1013)
})

test('parseMetar rejects junk', () => {
  assert.equal(parseMetar(''), null)
  assert.equal(parseMetar('no metar available'), null)
})

// --- Information letter ------------------------------------------------------

test('deriveInfoLetter is stable for the same observation', () => {
  const a = deriveInfoLetter({ day: 26, hour: 16, minute: 50 })
  const b = deriveInfoLetter({ day: 26, hour: 16, minute: 50 })
  assert.equal(a, b)
  assert.match(a, /^[A-Z]$/)
})

test('deriveInfoLetter advances once per METAR cycle', () => {
  const at1620 = deriveInfoLetter({ day: 26, hour: 16, minute: 20 })
  const at1650 = deriveInfoLetter({ day: 26, hour: 16, minute: 50 })
  const at1720 = deriveInfoLetter({ day: 26, hour: 17, minute: 20 })
  assert.notEqual(at1620, at1650)
  assert.notEqual(at1650, at1720)
})

test('deriveInfoLetter does not jump within one METAR cycle', () => {
  // Every minute of the 16:30-16:59 half hour maps to the same letter, so a
  // background refetch never makes the broadcast letter change spuriously.
  const expected = deriveInfoLetter({ day: 26, hour: 16, minute: 30 })
  for (let minute = 30; minute < 60; minute++) {
    assert.equal(deriveInfoLetter({ day: 26, hour: 16, minute }), expected)
  }
})

test('deriveInfoLetter rolls continuously across midnight', () => {
  const before = deriveInfoLetter({ day: 26, hour: 23, minute: 50 })
  const after = deriveInfoLetter({ day: 27, hour: 0, minute: 20 })
  assert.notEqual(before, after)
})

test('parseAtisLetter reads the letter out of VATSIM ATIS text', () => {
  assert.equal(parseAtisLetter(EDDC_VATSIM_TEXT), 'Q')
  assert.equal(parseAtisLetter('EDDM INFORMATION T, RUNWAY 26R'), 'T')
  assert.equal(parseAtisLetter('MUNICH INFO D'), 'D')
})

test('parseAtisLetter accepts a phonetic letter word', () => {
  assert.equal(parseAtisLetter('FRANKFURT INFORMATION CHARLIE, RUNWAY 25C'), 'C')
  assert.equal(parseAtisLetter('HAMBURG INFORMATION XRAY'), 'X')
})

test('parseAtisLetter returns null when the text carries no letter', () => {
  assert.equal(parseAtisLetter('RUNWAY 25C IN USE, QNH 1013'), null)
  assert.equal(parseAtisLetter(''), null)
})

// --- Runway in use -----------------------------------------------------------

test('selectRunwayInUse agrees with the real controller at EDDC', () => {
  // Live VATSIM ATIS for EDDC that day: "RUNWAY IN USE 22", wind 220/06.
  const obs = parseMetar(EDDC_METAR)!
  const picked = selectRunwayInUse(EDDC_RUNWAYS, obs, 'dep')
  assert.equal(picked?.designator, '22')
  assert.equal(picked?.source, 'wind')
})

test('selectRunwayInUse picks the westerly runways at EDDF in a westerly wind', () => {
  const obs = parseMetar(EDDF_METAR)! // 240/16
  assert.equal(selectRunwayInUse(EDDF_RUNWAYS, obs, 'dep')?.designator, '25C')
  assert.equal(selectRunwayInUse(EDDF_RUNWAYS, obs, 'arr')?.designator, '25C')
})

test('selectRunwayInUse picks into the wind when it reverses', () => {
  const easterly = parseMetar('EDDF 261650Z 07012KT CAVOK 26/13 Q1006')!
  assert.equal(selectRunwayInUse(EDDF_RUNWAYS, easterly, 'dep')?.designator, '07C')
})

test('selectRunwayInUse honours takeOffOnly and landingOnly', () => {
  // EDDF 18 is departure-only, so it must never be offered as an arrival runway.
  const southerly = parseMetar('EDDF 261650Z 18025KT CAVOK 26/13 Q1006')!
  assert.equal(selectRunwayInUse(EDDF_RUNWAYS, southerly, 'dep')?.designator, '18')
  assert.notEqual(selectRunwayInUse(EDDF_RUNWAYS, southerly, 'arr')?.designator, '18')
})

test('selectRunwayInUse falls back to the main runway in calm wind', () => {
  const calm = parseMetar('EDDC 261650Z 00000KT CAVOK 24/12 Q1013')!
  const picked = selectRunwayInUse(EDDC_RUNWAYS, calm, 'dep')
  assert.equal(picked?.source, 'main')
  assert.ok(picked && ['04', '22'].includes(picked.designator))
})

test('selectRunwayInUse falls back to the main runway in variable wind', () => {
  const vrb = parseMetar('EDDC 261650Z VRB04KT CAVOK 24/12 Q1013')!
  assert.equal(selectRunwayInUse(EDDC_RUNWAYS, vrb, 'dep')?.source, 'main')
})

test('selectRunwayInUse returns null without runway data', () => {
  const obs = parseMetar(EDDF_METAR)!
  assert.equal(selectRunwayInUse([], obs, 'dep'), null)
})

test('extractRunwayFromAtisText reads the runway out of VATSIM text', () => {
  assert.equal(extractRunwayFromAtisText([EDDC_VATSIM_TEXT], 'arr'), '22')
  assert.equal(extractRunwayFromAtisText(['DEP RWY 25C, ARR RWY 25L'], 'dep'), '25C')
  assert.equal(extractRunwayFromAtisText(['DEP RWY 25C, ARR RWY 25L'], 'arr'), '25L')
})

test('extractRunwayFromAtisText pads a single-digit designator', () => {
  assert.equal(extractRunwayFromAtisText(['RUNWAY IN USE 7'], 'dep'), '07')
})

test('extractRunwayFromAtisText returns null when no runway is mentioned', () => {
  assert.equal(extractRunwayFromAtisText(['QNH 1013 TEMPERATURE 12'], 'dep'), null)
  assert.equal(extractRunwayFromAtisText([], 'dep'), null)
})

// --- Synthetic text ----------------------------------------------------------

test('buildSyntheticAtisText names the airport, the letter and the runway', () => {
  const text = buildSyntheticAtisText({
    airportName: 'Frankfurt Main',
    letter: 'H',
    observation: parseMetar(EDDF_METAR)!,
    runwayDep: '25C',
    runwayArr: '25C',
  })
  assert.ok(text.startsWith('Frankfurt Main INFORMATION H'), text)
  assert.ok(text.includes('RUNWAY 25C IN USE'), text)
  assert.ok(text.includes('MET REPORT TIME 1650'), text)
  // Closes with the letter, the way a real ATIS does.
  assert.ok(/INFORMATION H OUT$/.test(text), text)
})

test('buildSyntheticAtisText names both runways when they differ', () => {
  const text = buildSyntheticAtisText({
    airportName: 'Frankfurt Main',
    letter: 'H',
    observation: parseMetar(EDDF_METAR)!,
    runwayDep: '25C',
    runwayArr: '25L',
  })
  assert.ok(text.includes('DEPARTURE RUNWAY 25C'), text)
  assert.ok(text.includes('APPROACH RUNWAY 25L'), text)
})

test('buildSyntheticAtisText keeps the METAR groups the speech normalizer expands', () => {
  const text = buildSyntheticAtisText({
    airportName: 'Frankfurt Main',
    letter: 'H',
    observation: parseMetar(EDDF_METAR)!,
    runwayDep: '25C',
    runwayArr: '25C',
  })
  assert.ok(text.includes('24016KT'), text)
  assert.ok(text.includes('Q1006'), text)
  assert.ok(text.includes('26/13'), text)
})

// --- Resolver cascade --------------------------------------------------------

test('resolveAtisReport prefers a VATSIM station and keeps its letter', () => {
  const report = resolveAtisReport({
    icao: 'EDDC',
    airportName: 'Dresden',
    vatsimStations: [
      { frequency: '118.880', callsign: 'EDDC_ATIS', atisCode: 'Q', text: EDDC_VATSIM_TEXT, lastUpdated: '2026-07-26T17:18:29Z' },
    ],
    metar: EDDC_METAR,
    runways: EDDC_RUNWAYS,
  })
  assert.equal(report.source, 'vatsim')
  assert.equal(report.letter, 'Q')
  assert.equal(report.runwayArr, '22')
  assert.equal(report.runwaySource, 'atis')
  assert.equal(report.stations.length, 1)
  assert.equal(report.stations[0]!.text, EDDC_VATSIM_TEXT)
})

test('resolveAtisReport recovers the letter from text when atis_code is missing', () => {
  // EDXW_ATIS was live that day with no atis_code field.
  const report = resolveAtisReport({
    icao: 'EDDC',
    vatsimStations: [{ frequency: '118.880', callsign: 'EDDC_ATIS', text: EDDC_VATSIM_TEXT }],
    metar: EDDC_METAR,
    runways: EDDC_RUNWAYS,
  })
  assert.equal(report.source, 'vatsim')
  assert.equal(report.letter, 'Q')
})

test('resolveAtisReport synthesises an ATIS when no VATSIM station is online', () => {
  // EDDF had no VATSIM ATIS on 2026-07-26 — the case the bug report came from.
  const report = resolveAtisReport({
    icao: 'EDDF',
    airportName: 'Frankfurt Main',
    vatsimStations: [],
    metar: EDDF_METAR,
    runways: EDDF_RUNWAYS,
  })
  assert.equal(report.source, 'metar')
  assert.match(report.letter, /^[A-Z]$/)
  assert.equal(report.runwayDep, '25C')
  assert.equal(report.runwaySource, 'wind')
  assert.equal(report.stations.length, 1)
  assert.ok(report.stations[0]!.text.includes('INFORMATION'), report.stations[0]!.text)
})

test('resolveAtisReport still yields a letter and runway with no METAR at all', () => {
  const report = resolveAtisReport({
    icao: 'EDDF',
    airportName: 'Frankfurt Main',
    vatsimStations: [],
    metar: null,
    runways: EDDF_RUNWAYS,
    now: new Date('2026-07-26T16:50:00Z'),
  })
  assert.equal(report.source, 'fallback')
  assert.match(report.letter, /^[A-Z]$/)
  assert.equal(report.runwaySource, 'main')
  assert.ok(report.runwayDep)
})

test('resolveAtisReport never returns an empty letter', () => {
  const report = resolveAtisReport({ icao: 'ZZZZ', vatsimStations: [], metar: null, runways: [] })
  assert.match(report.letter, /^[A-Z]$/)
  assert.equal(report.runwayDep, null)
})

test('resolveAtisReport keeps arrival and departure ATIS stations apart', () => {
  const report = resolveAtisReport({
    icao: 'EDDF',
    vatsimStations: [
      { frequency: '118.025', callsign: 'EDDF_A_ATIS', atisCode: 'C', text: 'FRANKFURT ARRIVAL INFORMATION C EXPECT ILS APPROACH RUNWAY 25L' },
      { frequency: '118.725', callsign: 'EDDF_D_ATIS', atisCode: 'D', text: 'FRANKFURT DEPARTURE INFORMATION D DEP RWY 18' },
    ],
    metar: EDDF_METAR,
    runways: EDDF_RUNWAYS,
  })
  assert.equal(report.stations.length, 2)
  assert.equal(report.letterArr, 'C')
  assert.equal(report.letterDep, 'D')
  assert.equal(report.runwayArr, '25L')
  assert.equal(report.runwayDep, '18')
})

test('resolveAtisReport ignores a VATSIM station that carries no text', () => {
  const report = resolveAtisReport({
    icao: 'EDDF',
    airportName: 'Frankfurt Main',
    vatsimStations: [{ frequency: '118.025', callsign: 'EDDF_ATIS' }],
    metar: EDDF_METAR,
    runways: EDDF_RUNWAYS,
  })
  assert.equal(report.source, 'metar')
  assert.ok(report.stations[0]!.text.length > 0)
  // The synthesised broadcast must be published on the real ATIS frequency.
  assert.equal(report.stations[0]!.frequency, '118.025')
})

test('resolveAtisReport falls back to wind when the ATIS text has no runway', () => {
  const report = resolveAtisReport({
    icao: 'EDDM',
    vatsimStations: [{ frequency: '123.125', callsign: 'EDDM_ATIS', atisCode: 'T', text: 'MUNICH INFORMATION T QNH 1008 TEMPERATURE 26' }],
    metar: EDDM_METAR,
    runways: [
      { designator: '08L', trueHeading: 81,  mainRunway: true,  lengthM: 4000 },
      { designator: '26R', trueHeading: 261, mainRunway: true,  lengthM: 4000 },
      { designator: '08R', trueHeading: 81,  mainRunway: false, lengthM: 4000 },
      { designator: '26L', trueHeading: 261, mainRunway: false, lengthM: 4000 },
    ],
  })
  assert.equal(report.letter, 'T')
  assert.equal(report.runwaySource, 'wind')
  assert.equal(report.runwayDep, '26R')
})
