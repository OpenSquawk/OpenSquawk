// Phase definition
export interface Phase {
  id: string
  name: string
  frequency: string
  unit: string
  interactions: Interaction[]
  autoAdvance?: TelemetryCondition
  nextPhase: string | null
}

export interface Interaction {
  id: string
  type: 'pilot_initiates' | 'atc_initiates' | 'readback_check'
  when?: string                       // Condition expression
  pilotIntent: string                 // For LLM prompt
  pilotExample?: string               // Template with {vars}
  atcResponse: string                 // Template with {vars}
  readback?: ReadbackSpec
  updates?: Record<string, any>
  handoff?: { toPhase: string; say?: string }
  alternatives?: AlternativeResponse[]
}

export interface ReadbackSpec {
  required: string[]
  atcConfirm: string
  atcCorrect: string
}

export interface AlternativeResponse {
  intent: string
  atcResponse: string
  updates?: Record<string, any>
}

export interface TelemetryCondition {
  parameter: string
  operator: '>' | '>=' | '<' | '<=' | '==' | '!='
  value: number
  holdMs?: number
}

// Flight variables
export interface FlightVars {
  callsign: string
  aircraft: string
  dep: string
  dest: string
  stand: string
  runway: string
  sid: string
  squawk: string
  atis_code: string
  initial_alt: string
  flight_level: string
  qnh: string
  taxi_route: string
  ground_freq: string
  tower_freq: string
  departure_freq: string
  approach_freq: string
  center_freq: string
  atis_freq: string
  wind: string
  arrival_runway: string
  arrival_stand: string
  arrival_taxi_route: string
  star: string
  approach_type: string
  [key: string]: string
}

// Telemetry from SimBridge
export interface TelemetryState {
  altitude_ft: number
  speed_kts: number
  groundspeed_kts: number
  vertical_speed_fpm: number
  heading_deg: number
  latitude_deg: number
  longitude_deg: number
  on_ground: boolean
  [key: string]: number | boolean
}

// Engine state
export interface EngineState {
  currentPhase: string
  currentInteraction: string | null
  waitingFor: 'pilot' | 'readback' | 'none'
  vars: FlightVars
  flags: {
    inAir: boolean
    emergencyActive: boolean
    previousPhase: string | null
  }
  telemetry: TelemetryState
  sessionId: string
  transmissions: Transmission[]
}

// Transmission with debug info
export interface Transmission {
  id: string
  timestamp: Date
  speaker: 'pilot' | 'atc' | 'system'
  message: string
  normalized?: string
  phase: string
  frequency: string
  debug: TransmissionDebug
}

export interface TransmissionDebug {
  sttRaw?: string
  llmRequest?: {
    currentPhase: string
    currentInteraction: string | null
    pilotSaid: string
    candidates: { id: string; intent: string }[]
    contextSent: Record<string, any>
  }
  llmResponse?: {
    chosenInteraction: string
    confidence: 'high' | 'medium' | 'low'
    reason: string
    tokensUsed: number
    durationMs: number
    model: string
  }
  engineAction?: {
    templateUsed: string
    variablesUpdated: Record<string, any>
    handoff?: { from: string; to: string }
    phaseChanged?: { from: string; to: string }
  }
  telemetryTrigger?: {
    parameter: string
    condition: string
    value: number
  }
  readbackResult?: {
    complete: boolean
    missing?: string[]
  }
}

// Flight plan input
export interface FlightPlan {
  callsign: string
  aircraft?: string
  dep: string
  arr: string
  route?: string
  altitude?: string
  squawk?: string
  id?: number
  assignedsquawk?: string
}

// LLM Router types
export interface RouteRequest {
  pilotSaid: string
  phase: string
  interaction: string | null
  waitingFor: 'pilot' | 'readback' | 'none'
  candidates: RouteCandidate[]
  vars: Record<string, any>
  recentTransmissions: string[]
}

export interface RouteCandidate {
  id: string
  intent: string
  example?: string
}

export interface RouteResponse {
  chosen: string
  reason: string
  pilotIntent: string
  confidence: 'high' | 'medium' | 'low'
  tokensUsed: number
  durationMs: number
  model: string
  readbackResult?: {
    complete: boolean
    missing?: string[]
  }
}
