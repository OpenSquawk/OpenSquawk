// shared/data/websim/types.ts

export interface WebSimWaypoint {
  id: string
  lat: number
  lon: number
  /** Altitude constraint the autopilot adopts as its ALT target once this waypoint becomes active. */
  altitude_ft: number
}

export interface WebSimRunway {
  id: string // e.g. "25C"
  thresholdLat: number
  thresholdLon: number
  /** Inbound course flown by a landing aircraft, degrees true. */
  course_deg: number
  elevation_ft: number
}

export interface WebSimGate {
  lat: number
  lon: number
  heading_deg: number
}

export interface WebSimAirport {
  icao: string
  name: string
  arpLat: number
  arpLon: number
  elevation_ft: number
  runways: WebSimRunway[]
  gate: WebSimGate
  /** Ordered waypoints for NAV mode; last entry should be near the final approach fix. Empty if unused. */
  star: WebSimWaypoint[]
}

export type WebSimEngineState = 'OFF' | 'STARTING' | 'RUNNING'
export type WebSimApMode = 'OFF' | 'SELECTED' | 'NAV' | 'APPR_ARMED' | 'APPR_CAPTURED' | 'AUTOLAND'

export interface WebSimInitialState {
  lat: number
  lon: number
  heading_deg: number
  altitude_ft: number
  ias_kts: number
  on_ground: boolean
  engineState: WebSimEngineState
  gearDown: boolean
  flapsIndex: number
  parkingBrake: boolean
  apMode: WebSimApMode
  /** Index into the airport's `star` array the NAV sequencer should start on. */
  activeWaypointIndex: number
  target_ias: number
  target_hdg: number
  target_alt: number
  com_active: number
  com_standby: number
  transponder_code: number
}

export interface WebSimSpawnPreset {
  id: string
  label: string
  description: string
  icao: string
  /** Runway id (within the airport's `runways`) this preset is flying/parked at. */
  runwayId: string
  initialState: WebSimInitialState
}
