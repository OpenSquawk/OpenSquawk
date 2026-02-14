# Live ATC v2 — "Phase Machine" Design

## Problem

The current Live ATC system (~2,600 LOC across `communicationsEngine.ts` + `openai.ts`) is a black box that's too complex to debug. It mixes state machine logic, telemetry evaluation, template rendering, flow management, and LLM integration into a single composable. The generic decision-tree interpreter adds indirection without adding clarity.

## Approach

Replace the entire Live ATC system (engine, editor, decision trees, MongoDB models, UI) with a **phase-based state machine** where each flight phase is an explicit TypeScript module. No generic interpreter — code is the documentation.

## What Gets Removed

| File | LOC | Reason |
|------|-----|--------|
| `shared/utils/communicationsEngine.ts` | 1,429 | Replaced by `shared/atc/engine.ts` (~200 LOC) |
| `server/utils/openai.ts` | 1,137 | Replaced by `server/api/atc/route.post.ts` |
| `server/services/decisionFlowService.ts` | 265 | No more MongoDB trees |
| `server/services/decisionImportService.ts` | 22 | No more imports |
| `server/models/DecisionFlow.ts` | ~100 | No more MongoDB trees |
| `server/models/DecisionNode.ts` | ~150 | No more MongoDB trees |
| `app/pages/pm.vue` | ~1,500 | Replaced by `app/pages/liveatc.vue` |
| `app/components/editor/DecisionNodeCanvas.vue` | ~800 | No more editor |
| `server/api/editor/**` | ~500 | No more editor API |
| `server/api/llm/decide.post.ts` | 36 | Replaced by route.post.ts |
| `server/api/decision-flows/**` | ~100 | No more runtime fetch |
| `shared/types/decision.ts` | ~200 | Replaced by `shared/atc/types.ts` |
| `shared/utils/openaiDecision.ts` | ~50 | Merged into route.post.ts |

## What Stays

| File | Reason |
|------|--------|
| `server/api/atc/say.post.ts` | TTS works fine (3 providers) |
| `server/api/atc/ptt.post.ts` | STT part stays, decision routing removed |
| `server/api/bridge/data.post.ts` | Telemetry inlet stays |
| `server/api/service/tools/taxiroute.get.ts` | OSM taxi routing stays 1:1 |
| `server/api/service/tools/airportGeocode.ts` | Airport geocoding stays |
| `shared/utils/radioSpeech.ts` | ICAO phonetics stays |
| `shared/utils/radioEffects.ts` + `pizzicatoLite.ts` | Audio FX stay |
| `server/models/TransmissionLog.ts` | Logging stays |
| FlightLab composables | Separate system, unaffected |
| Classroom system | Separate system, unaffected |

## New File Structure

```
shared/atc/
  types.ts                  # All types (Phase, Interaction, Transmission, etc.)
  phases/
    index.ts                # Phase registry + ordering
    clearance.ts            # Clearance Delivery
    ground.ts               # Ground (Pushback + Taxi)
    tower.ts                # Tower (Lineup + Takeoff)
    departure.ts            # Departure
    enroute.ts              # Enroute/Center
    approach.ts             # Approach
    landing.ts              # Tower (Landing)
    taxiIn.ts               # Ground (Taxi to Gate)
    emergency.ts            # Mayday/Pan-Pan (activatable from any phase)
  engine.ts                 # Orchestrator composable (~200 LOC)
  templateRenderer.ts       # {variable} template engine
  telemetryWatcher.ts       # Telemetry evaluation + interrupt logic

server/api/atc/
  route.post.ts             # New LLM router (replaces decide.post.ts)

app/pages/
  liveatc.vue               # New Live ATC page (replaces pm.vue)
app/components/atc/
  TransmissionCard.vue      # Single transmission with expandable debug
  PhaseIndicator.vue        # Phase progress dots
  FrequencyPanel.vue        # Frequency controls
  PttButton.vue             # Push-to-talk button
```

## Core Types

```typescript
interface Phase {
  id: string                          // e.g. 'clearance'
  name: string                        // e.g. 'Clearance Delivery'
  frequency: string                   // e.g. '121.900' (default, overridable)
  unit: string                        // e.g. 'DEL'
  interactions: Interaction[]
  autoAdvance?: TelemetryCondition    // When to auto-advance to next phase
  nextPhase: string | null
}

interface Interaction {
  id: string                          // e.g. 'request_clearance'
  type: 'pilot_initiates' | 'atc_initiates' | 'readback_check'
  when?: string                       // Condition, e.g. "!vars.clearance_received"
  pilotIntent: string                 // For LLM: "Pilot requests IFR clearance"
  pilotExample?: string               // Template: "{callsign}, request IFR clearance to {dest}"
  atcResponse: string                 // Template: "{callsign}, cleared to {dest} via {sid}..."
  readback?: {
    required: string[]                // ['dest', 'sid', 'runway', 'squawk', 'initial_alt']
    atcConfirm: string
    atcCorrect: string
  }
  updates?: Record<string, any>
  handoff?: { toPhase: string, say?: string }
  alternatives?: AlternativeResponse[]
}

interface AlternativeResponse {
  intent: string
  atcResponse: string
  updates?: Record<string, any>
}

interface TelemetryCondition {
  parameter: string
  operator: '>' | '>=' | '<' | '<=' | '==' | '!='
  value: number
  holdMs?: number
}
```

## Engine State

```typescript
interface EngineState {
  currentPhase: string
  currentInteraction: string | null
  waitingFor: 'pilot' | 'readback' | 'none'
  vars: FlightVars                    // callsign, dest, sid, runway, squawk, etc.
  flags: {
    inAir: boolean
    emergencyActive: boolean
    previousPhase: string | null
  }
  telemetry: TelemetryState
  sessionId: string
  transmissions: Transmission[]
}
```

## Engine Composable API

```typescript
function useAtcEngine() {
  const state: Readonly<Ref<EngineState>>
  const currentPhase: ComputedRef<Phase>
  const transmissions: ComputedRef<Transmission[]>
  const activeFrequency: ComputedRef<string>
  const expectedPilotAction: ComputedRef<string | null>
  const phaseProgress: ComputedRef<{ current: string, phases: string[], index: number }>

  function initFlight(plan: FlightPlan): void
  function handlePilotInput(text: string, source: 'ptt' | 'text'): Promise<void>
  function updateTelemetry(data: TelemetryState): void
  function declareEmergency(type: 'mayday' | 'panpan'): void
  function reset(): void
  function setFrequency(freq: string): void
}
```

## Transmission Debug (Expandable per Transmission)

Every transmission carries full debug info:

```typescript
interface TransmissionDebug {
  sttRaw?: string                     // What STT heard
  llmRequest?: {
    currentPhase: string
    currentInteraction: string | null
    pilotSaid: string
    candidates: { id: string, intent: string }[]
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
    handoff?: { from: string, to: string }
    phaseChanged?: { from: string, to: string }
  }
  telemetryTrigger?: {
    parameter: string
    condition: string
    value: number
  }
}
```

## LLM Router — Token-Efficient

### Strategy
1. Minimal system prompt (~150 tokens, cached)
2. User prompt with phase + pilot text + candidates (~100-200 tokens)
3. Readback checks done heuristically first (no LLM call)
4. Auto-select if only 1 candidate remains
5. ~300-400 tokens per pilot transmission (vs ~800-1200 currently)

### API

```
POST /api/atc/route

Request:
  pilotSaid: string
  phase: string
  interaction: string | null
  waitingFor: 'pilot' | 'readback' | 'none'
  candidates: { id: string, intent: string }[]
  vars: Record<string, any>
  recentTransmissions: string[]

Response:
  chosen: string                      // Interaction ID or 'off_schema'
  reason: string
  pilotIntent: string
  confidence: 'high' | 'medium' | 'low'
  tokensUsed: number
  durationMs: number
  model: string
  readbackResult?: { complete: boolean, missing?: string[] }
```

## Flight Phases — Full IFR Coverage

### 1. Clearance Delivery
- `request_clearance` — IFR clearance + readback check + handoff to ground
- `request_startup` — Engine startup approval
- `request_information` — ATIS/QNH query

### 2. Ground (Pushback & Taxi)
- `request_pushback` — Pushback approval with facing direction
- `report_ready_taxi` — Taxi clearance with route (OSM taxiroute API) + readback
- `hold_short` — ATC hold short instruction
- `report_holding_short` — Pilot reports + handoff to tower
- `request_cross_runway` — Runway crossing clearance

### 3. Tower (Takeoff)
- `report_ready_departure` — Ready for departure
- `lineup_and_wait` — Line up and wait
- `cleared_takeoff` — Takeoff clearance + readback
- `cancel_takeoff` — ATC cancels takeoff (interrupt)
- Auto-advance: `altitude_ft >= 1000` → handoff to departure

### 4. Departure
- `contact_departure` — Initial contact after handoff
- `climb_instruction` — Climb to FL
- `turn_instruction` — Turn heading
- `direct_to` — Proceed direct waypoint
- Auto-advance: `altitude_ft >= transition_altitude` → handoff to enroute

### 5. Enroute/Center
- `contact_center` — Initial contact
- `maintain_level` — Maintain FL
- `request_level_change` — Pilot requests different FL
- `position_report` — Position report (non-radar)
- Auto-advance: approaching destination → handoff to approach

### 6. Approach
- `contact_approach` — Initial contact, expect approach type
- `descend_instruction` — Descend to altitude
- `cleared_approach` — Cleared ILS/VOR/RNAV/Visual approach
- `request_alternate_approach` — Pilot requests different approach
- `go_around` — Go-around initiation
- `speed_instruction` — Speed reduction
- Auto-advance: established on approach → handoff to tower

### 7. Tower (Landing)
- `report_established` — Established on approach
- `cleared_land` — Cleared to land + wind info
- `go_around_instruction` — ATC go-around (interrupt)
- Auto-advance: `on_ground === true` → handoff to ground

### 8. Ground (Taxi In)
- `contact_ground_arrival` — Initial contact after landing
- `taxi_to_gate` — Taxi route to stand (OSM taxiroute API)
- `report_at_gate` — Session end

### 9. Emergency (activatable from any phase)
- `declare_mayday` / `declare_panpan`
- `cancel_emergency`
- `emergency_landing` — ATC vectors
- `souls_on_board` — ATC query
- Returns to previous phase after resolution

### Proactive ATC Interrupts (any phase)
- Altitude deviation warning
- Speed restriction
- Traffic advisory
- Weather advisory
- Frequency change instruction

## UI Layout (Mobile-First, max-w-420px)

```
┌─────────────────────────────┐
│  DLH39A  EDDF → EDDM       │  Flight header (compact)
│  ● GROUND  121.700          │  Current phase + freq
├─────────────────────────────┤
│  ○ CLR ● GND ○ TWR ○ ...   │  Phase progress dots
├─────────────────────────────┤
│  🗼 ATC: "DLH39A, pushback │  Latest ATC transmission
│  approved, face west"       │
│              ▼ Details      │  Expandable debug
│  👤 YOU: "Pushback approved,│  Expected pilot response
│  facing west, DLH39A"      │
├─────────────────────────────┤
│  [===== PTT BUTTON =====]  │  Large, central
│  Hold to transmit · 121.700│
├─────────────────────────────┤
│  Manual text input ________ │  Fallback + suggested phrases
├─────────────────────────────┤
│  Communication Log          │  All transmissions
│  Each with ▼ Details expand │  Full debug per entry
├─────────────────────────────┤
│  Frequencies | Settings     │  Collapsible bottom
└─────────────────────────────┘
```

### Expanded Debug per Transmission

```
▼ Details
  STT heard: "lufthansa tree niner alpha request pushback"
  Phase: Ground · Interaction: request_pushback

  LLM Decision:
   ✓ request_pushback — "Pilot requests pushback" (93%)
   ✗ report_ready_taxi — "Pilot ready for taxi"
   Reason: "Pilot explicitly requested pushback"
   Tokens: 287 · 340ms · gpt-4o-mini

  Template: "{callsign}, pushback approved, face {direction}"
  Vars: direction=west, stand=V14

  ⚡ Source: pilot PTT
```

### Telemetry-Triggered Transmission

```
🗼 ATC  14:45  ⚡TELEMETRY
"DLH39A, contact departure on 125.350"
▼ Details
  ⚡ Triggered by: altitude_ft >= 1000 (actual: 1,247 ft)
  Phase auto-advance: tower → departure
  Handoff frequency: 125.350
```

## Design Decisions

1. **No callsign matching** — STT always garbles callsigns, so we ignore them entirely. The LLM knows which callsign is active from context.

2. **Phase modules in TypeScript** — Not MongoDB. Versionable, testable, type-safe. A read-only visualizer can be added later.

3. **LLM as router only** — Chooses from predefined options. No free-form generation except for off-schema handling.

4. **Readback checks are heuristic-first** — Only falls back to LLM if the heuristic is uncertain.

5. **Emergency phase with return** — Can be activated from any phase, returns to previous phase after resolution.

6. **OSM taxi routing reused** — The existing `taxiroute.get.ts` API is called when generating taxi instructions.

7. **Full transparency** — Every transmission carries its complete debug trace, expandable in the UI.
