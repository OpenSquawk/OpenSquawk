/**
 * Reference aircraft performance database for the simulated background traffic
 * (`ai-traffic`). Deliberately small and extendable — it only carries the fields
 * the instruction planner needs to stay plausible: wake category (separation
 * matrix), the speeds a controller may legally assign, and whether the callsign
 * gets a "heavy"/"super" suffix.
 *
 * Values are the common ATC-training approximations from the architecture design
 * (docs/plans/2026-07-14-ai-traffic-architecture-design.md § 2), not a certified
 * ICAO Doc 4444 citation.
 */

/** Wake turbulence category: Light, Medium, Heavy, Super. */
export type WakeCategory = 'L' | 'M' | 'H' | 'J'

/** Rough size class — drives the type mix per traffic tier. */
export type SimAircraftClass = 'ga' | 'regional' | 'narrowbody' | 'widebody'

export interface SimAircraftType {
  icao: string
  class: SimAircraftClass
  wake: WakeCategory
  cruiseKts: number
  climbFpm: number
  descentFpm: number
  /** Vref / final approach speed — the hard floor for any speed instruction. */
  approachKts: number
  /** Spoken callsign suffix, if the type carries one. */
  heavyCallsign: false | 'heavy' | 'super'
}

export const SIM_AIRCRAFT_TYPES: readonly SimAircraftType[] = [
  { icao: 'C172', class: 'ga',         wake: 'L', cruiseKts: 110, climbFpm: 700,  descentFpm: 500,  approachKts: 60,  heavyCallsign: false },
  { icao: 'PA28', class: 'ga',         wake: 'L', cruiseKts: 120, climbFpm: 750,  descentFpm: 500,  approachKts: 65,  heavyCallsign: false },
  { icao: 'DA40', class: 'ga',         wake: 'L', cruiseKts: 135, climbFpm: 800,  descentFpm: 600,  approachKts: 70,  heavyCallsign: false },
  { icao: 'E190', class: 'regional',   wake: 'M', cruiseKts: 450, climbFpm: 2200, descentFpm: 1800, approachKts: 135, heavyCallsign: false },
  { icao: 'CRJ9', class: 'regional',   wake: 'M', cruiseKts: 450, climbFpm: 2000, descentFpm: 1800, approachKts: 130, heavyCallsign: false },
  { icao: 'A319', class: 'narrowbody', wake: 'M', cruiseKts: 450, climbFpm: 2000, descentFpm: 1500, approachKts: 125, heavyCallsign: false },
  { icao: 'A320', class: 'narrowbody', wake: 'M', cruiseKts: 450, climbFpm: 2000, descentFpm: 1500, approachKts: 130, heavyCallsign: false },
  { icao: 'A321', class: 'narrowbody', wake: 'M', cruiseKts: 450, climbFpm: 1800, descentFpm: 1500, approachKts: 135, heavyCallsign: false },
  { icao: 'B738', class: 'narrowbody', wake: 'M', cruiseKts: 455, climbFpm: 2000, descentFpm: 1500, approachKts: 135, heavyCallsign: false },
  { icao: 'B39M', class: 'narrowbody', wake: 'M', cruiseKts: 455, climbFpm: 2000, descentFpm: 1500, approachKts: 135, heavyCallsign: false },
  { icao: 'A333', class: 'widebody',   wake: 'H', cruiseKts: 480, climbFpm: 1800, descentFpm: 1200, approachKts: 140, heavyCallsign: 'heavy' },
  { icao: 'A359', class: 'widebody',   wake: 'H', cruiseKts: 490, climbFpm: 1800, descentFpm: 1200, approachKts: 140, heavyCallsign: 'heavy' },
  { icao: 'B77W', class: 'widebody',   wake: 'H', cruiseKts: 490, climbFpm: 1500, descentFpm: 1200, approachKts: 145, heavyCallsign: 'heavy' },
  { icao: 'B788', class: 'widebody',   wake: 'H', cruiseKts: 485, climbFpm: 1800, descentFpm: 1200, approachKts: 140, heavyCallsign: 'heavy' },
  { icao: 'B744', class: 'widebody',   wake: 'H', cruiseKts: 490, climbFpm: 1200, descentFpm: 1200, approachKts: 150, heavyCallsign: 'heavy' },
  { icao: 'A388', class: 'widebody',   wake: 'J', cruiseKts: 490, climbFpm: 1200, descentFpm: 1000, approachKts: 145, heavyCallsign: 'super' },
]

export function simAircraftTypesByClass(cls: SimAircraftClass): SimAircraftType[] {
  return SIM_AIRCRAFT_TYPES.filter(t => t.class === cls)
}

export function findSimAircraftType(icao: string): SimAircraftType | undefined {
  return SIM_AIRCRAFT_TYPES.find(t => t.icao === icao.toUpperCase())
}
