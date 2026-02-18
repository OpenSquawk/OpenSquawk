// shared/data/flightlab/types.ts

export interface FlightLabSound {
  id: string
  action: 'play' | 'stop' | 'crossfade'
  volume?: number
  loop?: boolean
}

export interface FlightLabButton {
  id: string
  label: string
  icon?: string
  next: string
  type?: 'primary' | 'comfort' | 'info'
  instructorAlert?: string
}

// --- MSFS SimConnect Telemetry ---

/** MSFS2020 SimConnect variable state — keys match SimConnect naming */
export interface FlightLabTelemetryState {
  AIRSPEED_INDICATED: number        // knots (IAS)
  AIRSPEED_TRUE: number             // knots (TAS)
  GROUND_VELOCITY: number           // knots
  VERTICAL_SPEED: number            // feet per minute
  PLANE_ALTITUDE: number            // feet MSL
  PLANE_PITCH_DEGREES: number       // degrees
  TURB_ENG_N1_1: number             // percent (0-100), engine 1
  TURB_ENG_N1_2: number             // percent (0-100), engine 2
  ENG_COMBUSTION: boolean           // true = at least one engine running
  SIM_ON_GROUND: boolean
  GEAR_HANDLE_POSITION: boolean     // true = down, false = up
  FLAPS_HANDLE_INDEX: number        // 0-4 for A320
  BRAKE_PARKING_POSITION: boolean   // true = set, false = released
  SEAT_BELT_SIGNS?: boolean         // true = on, false = off (if provided by bridge)
  AUTOPILOT_MASTER: boolean
  TRANSPONDER_CODE: number          // squawk code (0-7777 octal)
  ADF_ACTIVE_FREQUENCY: number      // Hz
  ADF_STANDBY_FREQUENCY: number     // Hz
  timestamp?: number
}

export type SimConditionOperator = '>' | '<' | '>=' | '<=' | '==' | '!='

export interface SimCondition {
  variable: keyof FlightLabTelemetryState
  operator: SimConditionOperator
  value: number | boolean
}

export interface SimConditionGroup {
  conditions: SimCondition[]
  logic: 'AND' | 'OR'
}

// --- Phase ---

export interface FlightLabPhase {
  id: string
  atcMessage: string
  explanation?: string
  buttons: FlightLabButton[]
  sounds?: FlightLabSound[]
  instructorNote?: string
  autoAdvanceAfterTTS?: boolean
  /** SimConnect conditions for auto-advance (when sim data available) */
  simConditions?: SimConditionGroup
  /** How long to wait (ms) before showing help if conditions not met. Default 20000 */
  simConditionTimeoutMs?: number
  /** Help message spoken via TTS when timeout reached */
  simConditionHelpMessage?: string
  /** Phase to advance to when conditions are met */
  simConditionNextPhase?: string
}

// --- Scenario ---

export interface FlightLabScenario {
  id: string
  title: string
  description: string
  icon: string
  aircraft: string
  airport: string
  runway: string
  callsign: string
  phases: FlightLabPhase[]
}

// --- Session / WebSocket ---

export type FlightLabRole = 'instructor' | 'participant'

export interface FlightLabSessionState {
  sessionCode: string
  scenarioId: string
  currentPhaseId: string
  isPaused: boolean
  startedAt: number
  participantConnected: boolean
  history: Array<{
    phaseId: string
    buttonId: string
    timestamp: number
  }>
}

export type FlightLabWSEvent =
  | { type: 'state-change'; state: FlightLabSessionState }
  | { type: 'instructor-message'; text: string; withRadioEffect: boolean }
  | { type: 'instructor-command'; command: 'pause' | 'resume' | 'restart' | 'skip' | 'back'; targetPhaseId?: string }
  | { type: 'participant-action'; buttonId: string; phaseId: string }
  | { type: 'session-joined'; role: FlightLabRole }
  | { type: 'error'; message: string }
