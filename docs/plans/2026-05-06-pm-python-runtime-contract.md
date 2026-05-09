# PM Python Runtime Contract and Reimplementation Plan

**Date**: 2026-05-06
**Scope**: Rebuild the backend/runtime for the PM radio training endpoint in Python while keeping the current frontend usable.
**Audience**: Developers who do not know the current repository.

## Goal

Rebuild the PM radio training backend as a Python runtime for interactive ATC communication training.

The existing frontend remains in place during the first implementation phase. The Python backend must therefore expose a compatibility API that preserves the current frontend contract. Internally, the new implementation should be cleanly structured around domain concepts, not around the current file layout.

The system trains aviation radio communication. A user speaks or types a pilot transmission. The backend evaluates it against the current scenario state, selects the next allowed state, updates runtime variables and flags, may switch between decision flows, and returns controller speech plus trace/debug information.

## Non-Goals

- Do not port the existing TypeScript files line by line.
- Do not let the LLM own the state machine.
- Do not require frontend refactoring for the first backend replacement.
- Do not duplicate phrase normalization, readback checks, or transition logic across individual flows.

## Required Compatibility API

The Python backend must initially provide these endpoints, even if internally they map to cleaner services.

### `GET /api/decision-flows/runtime`

Returns all available runtime flows.

Required shape:

```json
{
  "schema_version": "string",
  "main_flow": "string",
  "flows": {
    "flow-slug": {
      "slug": "flow-slug",
      "schema_version": "string",
      "name": "string",
      "description": "string",
      "start_state": "string",
      "end_states": ["string"],
      "variables": {},
      "flags": {},
      "policies": {},
      "hooks": {},
      "roles": ["pilot", "atc", "system"],
      "phases": ["string"],
      "states": {
        "STATE_ID": {
          "role": "pilot",
          "phase": "clearance",
          "name": "string",
          "summary": "string",
          "say_tpl": "string",
          "utterance_tpl": "string",
          "readback_required": ["callsign", "runway"],
          "next": [{ "to": "STATE_ID", "label": "string", "guard": "string" }],
          "ok_next": [{ "to": "STATE_ID" }],
          "bad_next": [{ "to": "STATE_ID" }],
          "timer_next": [{ "to": "STATE_ID", "after_s": 10 }],
          "auto_transitions": [],
          "triggers": [],
          "conditions": [],
          "actions": [],
          "handoff": { "to": "tower", "freq": "118.700" },
          "frequency": "118.700",
          "frequencyName": "Tower"
        }
      },
      "entry_mode": "main"
    }
  }
}
```

### `POST /api/llm/decide`

Accepts the current frontend-built decision context and returns the next decision.

Input compatibility shape:

```json
{
  "state_id": "CURRENT_STATE",
  "state": {},
  "candidates": [
    { "id": "NEXT_STATE", "flow": "flow-slug", "state": {} }
  ],
  "variables": {},
  "flags": {},
  "pilot_utterance": "Lufthansa 359 ready for taxi",
  "flow_slug": "flow-slug"
}
```

Output compatibility shape:

```json
{
  "decision": {
    "next_state": "NEXT_STATE",
    "updates": {},
    "flags": {},
    "controller_say_tpl": "Lufthansa 359, taxi to holding point runway 25R via N3 U4",
    "radio_check": false,
    "activate_flow": null,
    "resume_previous": false,
    "off_schema": false
  },
  "trace": {
    "calls": [],
    "fallback": { "used": false },
    "candidateTimeline": { "steps": [] },
    "autoSelection": null
  },
  "active_nodes": [],
  "pilot_intent": "taxi_request"
}
```

The backend must never return a `next_state` that was not allowed by the runtime model unless it marks the result as an explicit fallback/error. Invalid LLM output must be rejected and normalized before reaching the frontend.

### `POST /api/atc/say`

Generates speech audio for a text phrase.

Input:

```json
{
  "text": "Lufthansa tree fife niner, contact tower wun wun eight decimal seven",
  "voice": "string"
}
```

Output:

```json
{
  "audio": "base64-encoded-audio",
  "mimeType": "audio/mpeg"
}
```

### `POST /api/atc/ptt`

Accepts recorded audio from push-to-talk and returns a transcription. It may optionally include a decision result, but transcription alone is sufficient for compatibility.

Output:

```json
{
  "transcription": "Lufthansa 359 ready for taxi"
}
```

### Supporting Data Endpoints

The frontend may also need:

- `GET /api/vatsim/flightplans`
- `GET /api/vatsim/metar`
- `GET /api/airports/{icao}/frequencies`

These can be implemented as separate provider-backed services. They should not be coupled to the decision engine.

## Core Domain Model

Use Pydantic models as the canonical source of truth. Avoid passing untyped dictionaries through the core runtime.

### Flow

A `DecisionFlow` is a named scenario or scenario segment, such as clearance, taxi, tower, departure, approach, radio check, or abnormal event.

Fields:

- `slug`
- `name`
- `description`
- `schema_version`
- `start_state`
- `end_states`
- `variables`
- `flags`
- `policies`
- `states`
- `entry_mode`: `main`, `linear`, or `parallel`

### State

A `DecisionState` is one step in a radio interaction.

Roles:

- `pilot`: system waits for pilot input
- `atc`: controller speaks
- `system`: internal transition, action, guard, timer, or flow operation

Important fields:

- `id`
- `role`
- `phase`
- `summary`
- `say_template`
- `utterance_template`
- `readback_required`
- `transitions`
- `triggers`
- `conditions`
- `actions`
- `handoff`
- `frequency`

### Transition

Transitions must use one shared model.

Types:

- `next`: ordinary route
- `ok`: correct pilot/readback route
- `bad`: incorrect or incomplete route
- `timer`: time-based route
- `auto`: guard/trigger route
- `interrupt`: suspend current flow and enter another flow
- `return`: exit current flow and resume previous flow

### Runtime Session

A `RuntimeSession` holds mutable user state:

- `session_id`
- `main_flow`
- `active_flow`
- `current_state`
- `variables`
- `flags`
- `flow_stack`
- `parallel_flows`
- `message_history`
- `decision_history`
- `timers`

The first compatibility implementation may still accept stateless frontend context. Internally, the runtime should be designed around sessions so the frontend can later become thinner.

## Runtime Architecture

Recommended Python modules:

```text
app/api/
  decision_routes.py
  speech_routes.py
  data_routes.py

app/domain/
  models.py
  session.py
  flow_registry.py
  decision_engine.py
  flow_orchestrator.py
  candidate_builder.py
  guards.py
  readback.py
  templates.py
  radio_normalizer.py
  trace.py

app/services/
  radio_training_service.py
  speech_service.py
  transcription_service.py
  flight_data_service.py
  llm_router.py

app/infrastructure/
  repositories.py
  llm_provider.py
  tts_provider.py
  stt_provider.py
  vatsim_client.py
  airport_data_client.py
```

API routes should only validate, adapt, call services, and return responses. They should not contain state machine logic.

## Decision Algorithm

For each pilot transmission:

1. Load or build the current `RuntimeSession`.
2. Resolve current flow and current state.
3. Build candidate states from allowed transitions, active parallel flows, and valid interrupt flows.
4. Evaluate guards and conditions deterministically.
5. Evaluate regex or structured triggers deterministically.
6. If the current state requires a readback, run the centralized `ReadbackEvaluator`.
7. If one candidate remains, select it without an LLM call.
8. If multiple candidates remain, call the LLM router with only those candidates.
9. Validate the LLM response against the allowed candidate set.
10. Apply variable and flag updates through a controlled update mechanism.
11. Run flow activation, interruption, return, or resume behavior through `FlowOrchestrator`.
12. Advance through ATC and system states until the next pilot state.
13. Return the selected decision, controller templates, updated session state, and trace.

The compatibility response may only include the fields the current frontend expects, but the internal service should already compute the richer result.

## LLM Rules

The LLM is a router, not the source of truth.

Allowed:

- classify pilot intent
- choose among explicit candidate states
- help evaluate ambiguous readbacks
- extract structured values when deterministic parsing is uncertain

Forbidden:

- invent states
- skip guards
- modify variables outside an allowed schema
- generate controller phraseology that conflicts with the selected state
- decide flow activation outside declared flow rules

Every LLM decision must be validated. Invalid output becomes a traceable fallback, not an unchecked runtime decision.

## Readback and Phrase Normalization

Centralize all aviation phrase handling.

Components:

- `TemplateRenderer`: fills templates with variables.
- `RadioPhraseNormalizer`: converts rendered text to speech-friendly aviation phraseology.
- `ReadbackEvaluator`: checks pilot response against required values.
- `CallsignNormalizer`: handles airline codes, tail numbers, and spoken variants.
- `FrequencyNormalizer`: handles `121.800`, `121.8`, and spoken variants.
- `RunwayNormalizer`: handles `25R`, `runway two five right`, etc.
- `NumberNormalizer`: handles ICAO digit pronunciation.

Do not implement these per-flow or per-state.

## Flow Switching

The runtime must support moving between flows.

Flow activation modes:

- `main`: replace the current main flow.
- `linear`: enter a flow and return when it ends.
- `parallel`: run another flow beside the current one.
- `interrupt`: suspend the active flow and handle a higher-priority flow.
- `return`: finish current flow and resume the previous stacked flow.

Examples:

- Taxi flow interrupted by radio check.
- Ground flow activates tower handoff.
- Tower flow activates departure flow after takeoff.
- Abnormal event flow temporarily interrupts approach.

All flow switching must go through `FlowOrchestrator`. Individual states may declare flow operations, but they must not implement them directly.

## Code Patterns and Principles

Use these patterns:

- Pydantic DTOs at API boundaries.
- Pydantic domain models inside the runtime.
- Repository pattern for persistence.
- Provider interfaces for LLM, TTS, STT, VATSIM, airport data.
- Strategy pattern for trigger and condition evaluators.
- Pure functions for rendering, normalization, parsing, and guard evaluation.
- Trace-first decision design.
- Adapter pattern for current frontend compatibility.

Principles:

- Deterministic logic before LLM logic.
- One canonical model for flows and states.
- One central evaluator for readbacks.
- One central renderer and normalizer for phraseology.
- One orchestrator for flow switching.
- The frontend displays and records; the backend owns scenario truth.
- Every state transition must be explainable in a trace.

## Known Risks

### Frontend-owned state progression

The current frontend applies decisions locally and advances through ATC/system states itself. This is acceptable for compatibility, but the target architecture should move this responsibility into the backend session runtime.

Risk: frontend and backend can disagree about the current state.

Mitigation: return enough compatibility data now, but design the Python service to produce full runtime results internally.

### Duplicate normalization

If transcription, routing, readback checking, and TTS each normalize differently, errors will be hard to debug.

Mitigation: one shared phrase normalization package in the Python runtime.

### LLM overreach

An LLM can select invalid states or produce plausible but unsafe phraseology.

Mitigation: candidate-constrained routing, response validation, and fallbacks.

### Flow collisions

Parallel or interrupted flows may write the same variable or flag.

Mitigation: session-scoped update policy, namespaced flow-local variables where useful, and explicit allowed update schemas.

### Infinite auto transitions

System/ATC auto-advance can loop forever.

Mitigation: max-hop limits, visited-state detection, and traceable loop errors.

### Timer duplication

Timer transitions can fire more than once if stored only in frontend state.

Mitigation: backend session timers with ids and consumed status.

## Implementation Plan

### Phase 1: Contracts and Static Runtime

- Define Pydantic models for flows, states, transitions, sessions, decisions, and traces.
- Implement `GET /api/decision-flows/runtime` using static fixture data.
- Implement `POST /api/llm/decide` without LLM, using deterministic candidate selection.
- Return the current frontend-compatible response shape.
- Add unit tests for model validation and simple state transitions.

### Phase 2: Deterministic Decision Engine

- Implement `CandidateBuilder`.
- Implement guards, conditions, triggers, and fallback logic.
- Implement centralized readback evaluation.
- Implement template rendering and radio normalization.
- Add tests for taxi, clearance, tower handoff, bad readback, and radio check.

### Phase 3: Flow Orchestration

- Add `RuntimeSession`.
- Add `FlowOrchestrator`.
- Support `main`, `linear`, `parallel`, `interrupt`, and `return`.
- Add loop protection and flow-stack tests.
- Keep compatibility mode for stateless frontend calls.

### Phase 4: LLM Router

- Add provider abstraction for LLM calls.
- Call LLM only when deterministic routing is ambiguous.
- Validate selected state against candidates.
- Store request, response, and fallback reason in trace.
- Add tests with mocked LLM output, including invalid output.

### Phase 5: Speech and External Data

- Add TTS provider behind `SpeechService`.
- Add STT provider behind `TranscriptionService`.
- Add VATSIM and airport frequency providers behind `FlightDataService`.
- Keep these services independent from the decision engine.

### Phase 6: Persistence and Migration

- Choose persistence for flows and sessions.
- Implement repositories.
- Import or author initial production flows.
- Add versioning for flow schemas.
- Add admin/editor compatibility only if needed.

## Later Frontend Refactor: Remove or Change

This section is intentionally explicit. These items are not required for the first Python backend, but should be removed or changed once the backend owns sessions and full progression.

### Remove frontend decision ownership

Current behavior to remove later:

- frontend builds the full LLM decision context
- frontend applies `next_state`
- frontend mutates variables and flags
- frontend advances through ATC/system states until the next pilot turn
- frontend infers active candidates

Target behavior:

- frontend sends `session_id`, `pilot_utterance`, audio metadata, and optional UI context
- backend returns updated session state, visible state summary, messages to speak, trace, and available actions

Future endpoint:

```http
POST /api/radio/session/{session_id}/transmissions
```

Future response:

```json
{
  "session": {
    "id": "string",
    "active_flow": "tower",
    "current_state": "TOWER_LINEUP",
    "variables": {},
    "flags": {}
  },
  "messages": [
    {
      "role": "atc",
      "template": "Lufthansa 359, line up runway 25R",
      "rendered": "Lufthansa 359, line up runway 25R",
      "normalized": "Lufthansa tree fife niner, line up runway too fife right"
    }
  ],
  "trace": {},
  "expected_pilot": []
}
```

### Replace compatibility field names

Fields like `say_tpl`, `utterance_tpl`, `next_state`, and `controller_say_tpl` exist for compatibility. Later frontend code can move to clearer names:

- `say_tpl` -> `sayTemplate` or `template`
- `utterance_tpl` -> `expectedPilotTemplate`
- `controller_say_tpl` -> `controllerMessage.template`
- `next_state` -> `transition.targetState`

Do not change these during the compatibility phase.

### Remove frontend ATC speech scheduling assumptions

The frontend currently receives one decision and then schedules speech from locally collected ATC states.

Target behavior:

- backend returns an ordered `messages` array
- frontend only plays messages in order
- frontend does not need to know how ATC/system auto-advance works

### Remove frontend flow-stack logic

Any later UI state for active flows should be display-only. Flow activation, return, interrupt, and parallel execution should be backend session state.

### Simplify frontend debug panels

The frontend may still show trace data, but it should not reconstruct trace logic. The backend should return trace steps that are ready for display:

- candidates considered
- candidates eliminated
- guard failures
- readback result
- LLM call, if any
- fallback, if any

### Replace stateless decision calls

The current compatibility call sends the whole state context each time. Later, the frontend should call session-based endpoints:

- create session
- get session
- submit transmission
- reset session
- select scenario/flow

This reduces frontend complexity and prevents backend/frontend state drift.

## Acceptance Criteria

- Current `/pm` frontend can run against the Python backend without functional changes.
- A developer can define a new flow without writing routing code.
- Deterministic routes work without LLM calls.
- Ambiguous routes use LLM only within allowed candidates.
- Readback checks are centralized and tested.
- Flow switching is handled by one orchestrator.
- Every decision returns a useful trace.
- Later frontend refactor work is isolated to removing the compatibility adapter and replacing frontend-owned runtime behavior with session API calls.
