# Live ATC v2 "Phase Machine" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the entire old Live ATC system (engine, editor, decision trees) and replace it with a phase-based state machine that's debuggable, transparent, and covers a full IFR flight.

**Architecture:** Each flight phase is a TypeScript module declaring its interactions. A slim engine orchestrator (~200 LOC) manages state transitions. An LLM router on the server picks from predefined candidates. Every transmission carries full debug info, expandable in the UI.

**Tech Stack:** Nuxt 4 (Vue 3 SFC), H3 server, TypeScript, OpenAI API (gpt-4o-mini for routing), Vuetify, TailwindCSS

**Design Doc:** `docs/plans/2026-02-14-liveatc-v2-design.md`

---

## Phase 1: Remove Old System (Breaking Point)

### Task 1: Remove old Live ATC files

**Files to delete:**
- `shared/utils/communicationsEngine.ts` (1,428 lines)
- `shared/utils/openaiDecision.ts` (10 lines)
- `server/utils/openai.ts` (1,136 lines) — NOTE: `server/utils/normalize.ts` STAYS (OpenAI client setup)
- `server/utils/openai.test.ts` (138 lines)
- `server/api/llm/decide.post.ts` (35 lines)
- `server/services/decisionFlowService.ts` (264 lines)
- `server/services/decisionImportService.ts` (21 lines)
- `server/models/DecisionFlow.ts` (~107 lines)
- `server/models/DecisionNode.ts` (~213 lines)
- `server/api/decision-flows/runtime.get.ts` (6 lines)
- `server/api/decision-flows/[slug]/runtime.get.ts` (12 lines)
- `server/api/editor/flows.get.ts`
- `server/api/editor/flows.post.ts`
- `server/api/editor/flows/[slug]/index.get.ts`
- `server/api/editor/flows/[slug]/index.put.ts`
- `server/api/editor/flows/[slug]/nodes.post.ts`
- `server/api/editor/flows/[slug]/nodes/[stateId]/index.delete.ts`
- `server/api/editor/flows/[slug]/nodes/[stateId]/index.put.ts`
- `server/api/editor/flows/[slug]/nodes/[stateId]/layout.patch.ts`
- `server/api/editor/flows/[slug]/nodes/[stateId]/rename.patch.ts`
- `server/api/editor/flows/import.post.ts`
- `app/pages/pm.vue` (~2,689 lines)
- `app/pages/editor/index.vue`
- `app/components/editor/DecisionNodeCanvas.vue`
- `shared/types/decision.ts` (~277 lines)
- `shared/types/llm.ts` (~124 lines)

**Files to modify:**
- `server/api/atc/ptt.post.ts` — Remove import of `routeDecision` from openai.ts. Will be rewritten in Task 10.

**Step 1:** Delete all files listed above.

```bash
rm shared/utils/communicationsEngine.ts
rm shared/utils/openaiDecision.ts
rm server/utils/openai.ts
rm server/utils/openai.test.ts
rm server/api/llm/decide.post.ts
rm server/services/decisionFlowService.ts
rm server/services/decisionImportService.ts
rm server/models/DecisionFlow.ts
rm server/models/DecisionNode.ts
rm -rf server/api/decision-flows/
rm -rf server/api/editor/
rm app/pages/pm.vue
rm -rf app/pages/editor/
rm -rf app/components/editor/
rm shared/types/decision.ts
rm shared/types/llm.ts
```

**Step 2:** Stub out `server/api/atc/ptt.post.ts` temporarily — remove the `routeDecision` import and the decision-routing logic. Keep only the STT (Whisper) transcription part. Make it return just `{ success: true, transcription }` for now.

**Step 3:** Verify the app still builds.

```bash
bun run dev
```

Expected: App starts without errors. `/pm` and `/editor` routes are gone. Classroom, FlightLab, landing page still work.

**Step 4:** Commit.

```bash
git add -A
git commit -m "chore: remove old Live ATC system (engine, editor, decision trees)

BREAKING: Removes communicationsEngine, decision tree MongoDB models,
editor UI, LLM decision router, and pm.vue page. Prepares for v2
Phase Machine reimplementation."
```

---

## Phase 2: Core Types & Phase Modules

### Task 2: Create shared types

**Files:**
- Create: `shared/atc/types.ts`

**Step 1:** Create the core type definitions.

```typescript
// shared/atc/types.ts

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
  when?: string
  pilotIntent: string
  pilotExample?: string
  atcResponse: string
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

export interface FlightPlan {
  callsign: string
  aircraft?: string
  dep: string
  arr: string
  route?: string
  altitude?: string
  squawk?: string
  // VATSIM fields
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
```

**Step 2:** Commit.

```bash
git add shared/atc/types.ts
git commit -m "feat(atc-v2): add core type definitions"
```

---

### Task 3: Create phase modules — Clearance & Ground

**Files:**
- Create: `shared/atc/phases/clearance.ts`
- Create: `shared/atc/phases/ground.ts`
- Create: `shared/atc/phases/index.ts`

**Step 1:** Create clearance phase.

```typescript
// shared/atc/phases/clearance.ts
import type { Phase } from '../types'

export const clearancePhase: Phase = {
  id: 'clearance',
  name: 'Clearance Delivery',
  frequency: '121.900',
  unit: 'DEL',
  nextPhase: 'ground',
  interactions: [
    {
      id: 'request_clearance',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot requests IFR clearance to destination',
      pilotExample: '{callsign}, request IFR clearance to {dest}, information {atis_code}',
      atcResponse: '{callsign}, cleared to {dest} via {sid} departure, runway {runway}, climb initially {initial_alt} feet, expect flight level {flight_level}, squawk {squawk}',
      readback: {
        required: ['dest', 'sid', 'runway', 'squawk', 'initial_alt'],
        atcConfirm: 'Readback correct. Contact ground on {ground_freq}.',
        atcCorrect: 'Negative, I say again: cleared to {dest} via {sid}, runway {runway}, climb initially {initial_alt} feet, squawk {squawk}.',
      },
      updates: { clearance_received: 'true' },
      handoff: { toPhase: 'ground', say: 'Contact ground on {ground_freq}.' },
    },
    {
      id: 'request_information',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot requests ATIS information or QNH',
      pilotExample: '{callsign}, request ATIS information',
      atcResponse: 'Information {atis_code} is current, QNH {qnh}.',
    },
  ],
}
```

**Step 2:** Create ground phase (pushback, taxi out, hold short).

```typescript
// shared/atc/phases/ground.ts
import type { Phase } from '../types'

export const groundPhase: Phase = {
  id: 'ground',
  name: 'Ground Control',
  frequency: '121.700',
  unit: 'GND',
  nextPhase: 'tower',
  interactions: [
    {
      id: 'request_pushback',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot requests pushback clearance',
      pilotExample: '{callsign}, stand {stand}, request pushback',
      atcResponse: '{callsign}, pushback approved, face west.',
      updates: { pushback_approved: 'true' },
    },
    {
      id: 'request_taxi',
      type: 'pilot_initiates',
      when: 'vars.pushback_approved',
      pilotIntent: 'Pilot requests taxi clearance to runway',
      pilotExample: '{callsign}, request taxi to runway {runway}',
      atcResponse: '{callsign}, taxi to holding point runway {runway} via {taxi_route}.',
      readback: {
        required: ['runway', 'taxi_route'],
        atcConfirm: 'Readback correct.',
        atcCorrect: 'Negative, I say again: taxi to holding point runway {runway} via {taxi_route}.',
      },
      updates: { taxi_clearance_received: 'true' },
    },
    {
      id: 'report_holding_short',
      type: 'pilot_initiates',
      when: 'vars.taxi_clearance_received',
      pilotIntent: 'Pilot reports holding short of runway',
      pilotExample: '{callsign}, holding short runway {runway}',
      atcResponse: '{callsign}, contact tower on {tower_freq}.',
      handoff: { toPhase: 'tower' },
    },
    {
      id: 'request_cross_runway',
      type: 'pilot_initiates',
      pilotIntent: 'Pilot requests to cross a runway during taxi',
      pilotExample: '{callsign}, request cross runway {runway}',
      atcResponse: '{callsign}, cross runway {runway}, report vacated.',
    },
  ],
}
```

**Step 3:** Create phase registry.

```typescript
// shared/atc/phases/index.ts
import type { Phase } from '../types'
import { clearancePhase } from './clearance'
import { groundPhase } from './ground'

// Will be extended with tower, departure, enroute, approach, landing, taxiIn, emergency
const phases: Phase[] = [
  clearancePhase,
  groundPhase,
]

const phaseMap = new Map(phases.map(p => [p.id, p]))

export function getPhase(id: string): Phase | undefined {
  return phaseMap.get(id)
}

export function getPhaseOrder(): string[] {
  return phases.map(p => p.id)
}

export function getAllPhases(): Phase[] {
  return [...phases]
}

export { clearancePhase, groundPhase }
```

**Step 4:** Commit.

```bash
git add shared/atc/phases/
git commit -m "feat(atc-v2): add clearance and ground phase modules"
```

---

### Task 4: Create remaining phase modules

**Files:**
- Create: `shared/atc/phases/tower.ts`
- Create: `shared/atc/phases/departure.ts`
- Create: `shared/atc/phases/enroute.ts`
- Create: `shared/atc/phases/approach.ts`
- Create: `shared/atc/phases/landing.ts`
- Create: `shared/atc/phases/taxiIn.ts`
- Create: `shared/atc/phases/emergency.ts`
- Modify: `shared/atc/phases/index.ts` — register all phases

**Step 1:** Create tower phase (lineup, takeoff, cancel).

Tower includes `autoAdvance` — when `altitude_ft >= 1000`, advance to departure phase.

**Step 2:** Create departure phase (initial contact, climb, turn, direct-to).

Departure includes `autoAdvance` — when above transition altitude, advance to enroute.

**Step 3:** Create enroute phase (center contact, maintain level, level change request).

**Step 4:** Create approach phase (descend, cleared approach, alternate approach, go-around, speed).

**Step 5:** Create landing phase (established, cleared to land, go-around instruction).

Landing includes `autoAdvance` — when `on_ground === true`, advance to taxiIn.

**Step 6:** Create taxiIn phase (contact ground arrival, taxi to gate, report at gate = session end).

**Step 7:** Create emergency phase. This phase has a special `returnToPrevious: true` flag. It can be activated from any phase and includes: declare mayday, declare panpan, cancel emergency, emergency landing vectors, souls on board query.

**Step 8:** Update `shared/atc/phases/index.ts` to register all 9 phases.

**Step 9:** Commit.

```bash
git add shared/atc/phases/
git commit -m "feat(atc-v2): add all flight phase modules (tower through emergency)"
```

---

### Task 5: Create template renderer

**Files:**
- Create: `shared/atc/templateRenderer.ts`

**Step 1:** Implement template rendering. Replaces the old `renderTpl` from communicationsEngine.

```typescript
// shared/atc/templateRenderer.ts

/**
 * Renders a template string like "{callsign}, cleared to {dest} via {sid}"
 * by replacing {key} placeholders with values from the vars object.
 */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] ?? match
  })
}
```

This is intentionally simple. The old engine had ~100 lines of template logic — we don't need that complexity.

**Step 2:** Commit.

```bash
git add shared/atc/templateRenderer.ts
git commit -m "feat(atc-v2): add template renderer"
```

---

### Task 6: Create telemetry watcher

**Files:**
- Create: `shared/atc/telemetryWatcher.ts`

**Step 1:** Implement telemetry evaluation.

```typescript
// shared/atc/telemetryWatcher.ts
import type { Phase, TelemetryCondition, TelemetryState } from './types'

export interface TelemetryEvent {
  type: 'phase_advance' | 'atc_interrupt'
  toPhase?: string
  interactionId?: string
  trigger: {
    parameter: string
    condition: string
    value: number | boolean
  }
}

export function evaluateCondition(
  telemetry: TelemetryState,
  condition: TelemetryCondition
): boolean {
  const actual = telemetry[condition.parameter]
  if (actual === undefined) return false

  const val = condition.value
  switch (condition.operator) {
    case '>':  return (actual as number) > val
    case '>=': return (actual as number) >= val
    case '<':  return (actual as number) < val
    case '<=': return (actual as number) <= val
    case '==': return actual === val
    case '!=': return actual !== val
    default:   return false
  }
}

export function evaluateTelemetry(
  telemetry: TelemetryState,
  currentPhase: Phase
): TelemetryEvent | null {
  // Check autoAdvance for current phase
  if (currentPhase.autoAdvance && currentPhase.nextPhase) {
    if (evaluateCondition(telemetry, currentPhase.autoAdvance)) {
      return {
        type: 'phase_advance',
        toPhase: currentPhase.nextPhase,
        trigger: {
          parameter: currentPhase.autoAdvance.parameter,
          condition: `${currentPhase.autoAdvance.parameter} ${currentPhase.autoAdvance.operator} ${currentPhase.autoAdvance.value}`,
          value: telemetry[currentPhase.autoAdvance.parameter] as number,
        },
      }
    }
  }

  return null
}
```

**Step 2:** Commit.

```bash
git add shared/atc/telemetryWatcher.ts
git commit -m "feat(atc-v2): add telemetry watcher with condition evaluation"
```

---

## Phase 3: Engine Composable

### Task 7: Create the engine orchestrator

**Files:**
- Create: `shared/atc/engine.ts`

This is the core composable. It manages state, coordinates between phases, LLM, telemetry, and TTS. Target: ~200-250 LOC (vs 1,429 in old engine).

**Step 1:** Implement `useAtcEngine()` composable.

Key functions:
- `initFlight(plan)` — Sets up vars from flight plan, sets phase to 'clearance'
- `handlePilotInput(text, source)` — Main flow: log pilot transmission → get candidates from current phase → POST /api/atc/route → apply result → render ATC template → log ATC transmission → check for handoff/phase change
- `updateTelemetry(data)` — Store telemetry, run `evaluateTelemetry()`, apply auto-advance if triggered
- `declareEmergency(type)` — Save current phase, switch to emergency phase
- `reset()` — Clear all state

Internal helpers:
- `getCandidates()` — Get applicable interactions from current phase (filter by `when` conditions)
- `logTransmission(speaker, message, debug)` — Add to transmissions array
- `advancePhase(toPhase, trigger?)` — Switch phase, update frequency, log system message
- `handleHandoff(handoff)` — Execute handoff (advance phase + ATC says handoff message)
- `checkReadback(text, required)` — Heuristic readback check (does text contain the required values?)

**Step 2:** Commit.

```bash
git add shared/atc/engine.ts
git commit -m "feat(atc-v2): add engine orchestrator composable"
```

---

## Phase 4: Server-Side LLM Router

### Task 8: Create the new route endpoint

**Files:**
- Create: `server/api/atc/route.post.ts`

**Step 1:** Implement the LLM router endpoint.

- Accepts `RouteRequest` (from types.ts)
- If only 1 candidate → auto-select, no LLM call
- If `waitingFor === 'readback'` → heuristic check first, LLM only if uncertain
- Otherwise → minimal LLM prompt with candidates
- Returns `RouteResponse` with full debug info (tokens, duration, model)

System prompt (~150 tokens, will be cached by OpenAI):
```
You are an ATC communication router. Given the pilot's radio transmission and a list of possible intents for the current flight phase, choose the best matching intent.

Respond ONLY with valid JSON:
{"chosen":"interaction_id","reason":"brief reason","pilotIntent":"what pilot meant","confidence":"high|medium|low"}

If nothing matches well, use chosen: "off_schema".
```

User prompt template (~100-200 tokens):
```
Phase: {phase_name}
Pilot said: "{pilot_text}"

Possible intents:
{numbered_list_of_candidates}

Flight context: callsign={callsign}, runway={runway}, dest={dest}
Recent: {last_2_transmissions}
```

**Step 2:** Commit.

```bash
git add server/api/atc/route.post.ts
git commit -m "feat(atc-v2): add LLM route endpoint with token-efficient prompting"
```

---

### Task 9: Update PTT endpoint

**Files:**
- Modify: `server/api/atc/ptt.post.ts`

**Step 1:** Rewrite PTT to only do STT (Whisper transcription). Remove all decision routing logic. The client will call `/api/atc/route` separately after receiving the transcription.

New flow:
1. Receive base64 audio
2. Convert to WAV if needed (keep existing ffmpeg logic)
3. Whisper transcription
4. Log to TransmissionLog
5. Return `{ success: true, transcription: string }`

**Step 2:** Commit.

```bash
git add server/api/atc/ptt.post.ts
git commit -m "refactor(atc-v2): simplify PTT endpoint to STT-only"
```

---

## Phase 5: Frontend UI

### Task 10: Create TransmissionCard component

**Files:**
- Create: `app/components/atc/TransmissionCard.vue`

**Step 1:** Build the transmission card with expandable debug details.

Props: `{ transmission: Transmission }`

Shows:
- Speaker icon (pilot=blue, atc=green, system=grey) + timestamp
- Message text (mono font)
- Phase badge + frequency badge
- Telemetry trigger badge (⚡) if applicable
- Expandable "Details" section with full debug info:
  - STT raw text
  - LLM request (candidates sent)
  - LLM response (chosen, reason, confidence, tokens, duration)
  - Engine action (template, vars updated, handoff)
  - Telemetry trigger details

Uses Vuetify `v-expansion-panels` for the expandable section. Dark theme with the existing project style (`bg-white/5`, `border-white/10`, etc.)

**Step 2:** Commit.

```bash
git add app/components/atc/TransmissionCard.vue
git commit -m "feat(atc-v2): add TransmissionCard component with debug details"
```

---

### Task 11: Create PhaseIndicator component

**Files:**
- Create: `app/components/atc/PhaseIndicator.vue`

**Step 1:** Horizontal dot-bar showing all phases. Current phase highlighted (cyan). Completed phases filled. Future phases dimmed.

Props: `{ phases: string[], currentPhase: string }`

**Step 2:** Commit.

```bash
git add app/components/atc/PhaseIndicator.vue
git commit -m "feat(atc-v2): add PhaseIndicator component"
```

---

### Task 12: Create PttButton component

**Files:**
- Create: `app/components/atc/PttButton.vue`

**Step 1:** Extract the PTT button from the old pm.vue. Large touch-friendly area, hold-to-record, shows active frequency and recording state. Emits `@recording-complete` with base64 audio.

Handles:
- `mousedown`/`touchstart` → start MediaRecorder
- `mouseup`/`touchend` → stop, encode to base64, emit
- Recording animation (pulse, red ring)
- Mic permission request

**Step 2:** Commit.

```bash
git add app/components/atc/PttButton.vue
git commit -m "feat(atc-v2): add PttButton component"
```

---

### Task 13: Create FrequencyPanel component

**Files:**
- Create: `app/components/atc/FrequencyPanel.vue`

**Step 1:** Active/Standby frequency display with swap button. Collapsible frequency directory (VATSIM + OpenAIP lookup, same as old pm.vue).

Props: `{ active: string, standby: string, dep: string }`
Emits: `@update:active`, `@update:standby`, `@swap`

Reuse the VATSIM/OpenAIP frequency lookup logic from old pm.vue (the `fetchAirportFrequencies` function).

**Step 2:** Commit.

```bash
git add app/components/atc/FrequencyPanel.vue
git commit -m "feat(atc-v2): add FrequencyPanel component"
```

---

### Task 14: Create liveatc.vue page

**Files:**
- Create: `app/pages/liveatc.vue`

**Step 1:** Build the main Live ATC page using all components.

Screens:
1. **Flight Setup** — VATSIM CID input, demo button, flight plan selection (reuse logic from old pm.vue)
2. **Live Session** — Layout as described in design:
   - Flight header (callsign, route, phase, frequency)
   - PhaseIndicator
   - Latest ATC transmission + expected pilot response
   - PttButton
   - Manual text input with suggested phrases
   - Communication log (all TransmissionCards, scrollable)
   - FrequencyPanel (collapsible)
   - Settings (signal strength, speech speed, radio effects)

Wire up:
- `useAtcEngine()` composable for all state
- PTT → POST `/api/atc/ptt` (STT) → `engine.handlePilotInput(transcription, 'ptt')`
- Text input → `engine.handlePilotInput(text, 'text')`
- TTS: after each ATC transmission, POST `/api/atc/say` and play audio (reuse existing audio playback logic with radio effects)
- Telemetry: if SimBridge connected, poll or receive via existing WebSocket → `engine.updateTelemetry()`
- Settings persisted to localStorage

**Step 2:** Commit.

```bash
git add app/pages/liveatc.vue
git commit -m "feat(atc-v2): add liveatc.vue page with full flight session UI"
```

---

## Phase 6: Integration & Polish

### Task 15: Wire up TTS playback

**Files:**
- Modify: `app/pages/liveatc.vue`

**Step 1:** After each ATC transmission from the engine, call POST `/api/atc/say` with the normalized text. Play the returned audio using WebAudio API with radio effects (reuse `radioEffects.ts` and `pizzicatoLite.ts`).

Add speech queue so multiple ATC messages play sequentially (e.g. after readback confirm + handoff message).

**Step 2:** Commit.

```bash
git add app/pages/liveatc.vue
git commit -m "feat(atc-v2): wire up TTS playback with radio effects"
```

---

### Task 16: Wire up SimBridge telemetry

**Files:**
- Modify: `app/pages/liveatc.vue`

**Step 1:** Connect to the existing FlightLab WebSocket or poll `/api/bridge/data` telemetry. On each update, call `engine.updateTelemetry()`. This enables auto-advance (e.g. after takeoff altitude reached → handoff to departure).

Display telemetry status indicator (connected/disconnected) in the flight header.

**Step 2:** Commit.

```bash
git add app/pages/liveatc.vue
git commit -m "feat(atc-v2): wire up SimBridge telemetry for auto-advance"
```

---

### Task 17: Wire up OSM taxi routing

**Files:**
- Modify: `shared/atc/engine.ts` or `app/pages/liveatc.vue`

**Step 1:** When entering ground phase and taxi clearance is requested, call GET `/api/service/tools/taxiroute` with the current airport, stand, and runway to get the taxi route. Store result in `vars.taxi_route`.

Same for taxiIn phase: call with runway exit point and arrival stand.

**Step 2:** Commit.

```bash
git add shared/atc/engine.ts app/pages/liveatc.vue
git commit -m "feat(atc-v2): integrate OSM taxi routing for ground phases"
```

---

### Task 18: Verify full flow & commit

**Step 1:** Start dev server, test full flow:
- Login / Demo mode
- Clearance → Ground → Tower → (simulate telemetry for auto-advance) → Departure → etc.
- Test PTT and text input
- Test readback checking
- Verify debug details expand correctly on each transmission
- Test emergency declaration
- Test frequency changes

**Step 2:** Fix any issues found during testing.

**Step 3:** Final commit.

```bash
git add -A
git commit -m "feat(atc-v2): complete Live ATC v2 Phase Machine implementation"
```

---

## Task Dependency Graph

```
Task 1 (Remove old) ─────────────────────────────────────┐
    │                                                      │
Task 2 (Types) ───┬── Task 3 (Clearance+Ground phases)   │
                  │        │                               │
                  │   Task 4 (All remaining phases)        │
                  │        │                               │
                  ├── Task 5 (Template renderer)           │
                  │        │                               │
                  ├── Task 6 (Telemetry watcher)           │
                  │        │                               │
                  │   Task 7 (Engine) ◄────────────────────┘
                  │        │
                  ├── Task 8 (LLM route endpoint)
                  │        │
                  ├── Task 9 (PTT endpoint)
                  │        │
                  │   ┌────┴─────────────────────┐
                  │   │                          │
                  ├── Task 10 (TransmissionCard)  Task 11 (PhaseIndicator)
                  │   │                          │
                  ├── Task 12 (PttButton)         Task 13 (FrequencyPanel)
                  │   │                          │
                  │   └────┬─────────────────────┘
                  │        │
                  │   Task 14 (liveatc.vue) ◄─── combines all components
                  │        │
                  │   ┌────┼────────────┐
                  │   │    │            │
                  │   Task 15 (TTS)  Task 16 (Telemetry)  Task 17 (OSM taxi)
                  │        │            │                    │
                  │        └────┬───────┘────────────────────┘
                  │             │
                  │        Task 18 (Verify & polish)
```

**Parallelizable:** Tasks 3-6 can run in parallel. Tasks 10-13 can run in parallel. Tasks 15-17 can run in parallel.
