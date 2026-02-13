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

export interface FlightLabPhase {
  id: string
  atcMessage: string
  explanation?: string
  buttons: FlightLabButton[]
  sounds?: FlightLabSound[]
  instructorNote?: string
  autoAdvanceAfterTTS?: boolean
}

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
