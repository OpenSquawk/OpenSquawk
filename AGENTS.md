# OpenSquawk - Project Guide

## Architecture
- **Nuxt 4** (Vue 3 SFC) frontend in `/app`
- **H3 server** handlers in `/server`
- **Shared types/utils** in `/shared`
- MongoDB models in `/server/models`
- **Python backend** (`OpenSquawk-LiveATC-api`) — owns PM session state and routing decisions; runs on `http://127.0.0.1:8000`

## Key Files
- `/shared/utils/communicationsEngine.ts` — Core state machine composable (used by `/pm` live ATC). Drives local cursor and TTS; Python backend owns the authoritative state.
- `/app/composables/useRadioBackend.ts` — Typed wrapper around the Python backend REST API (`createSession`, `transmit`, `deleteSession`, `fetchFlows`)
- `/server/utils/openai.ts` — `getOpenAIClient()` only (TTS via `/api/atc/say`, STT via `/api/atc/ptt`). The old `routeDecision()` LLM router has been removed; routing lives in the Python backend.
- `/server/services/decisionFlowService.ts` — Builds/edits MongoDB-backed decision trees for the flow editor (`/server/api/editor/flows*`). There is no Nuxt `/api/decision-flows/runtime` route — `/pm` fetches the runtime flow directly from the Python backend.
- `/app/pages/pm.vue` — Live ATC page (speech-to-text, PTT, text input)
- `/app/pages/classroom.vue` — Classroom learning mode (separate system, does NOT use communicationsEngine)

## Live ATC Flow (/pm) — current

1. `startMonitoring()` → `fetchRuntimeTree('icao_atc_decision_tree', radioBackendUrl)` loads the YAML flow from Python backend into the local engine (for cursor tracking / TTS)
2. `startMonitoring()` → `radioBackend.createSession('icao_atc_decision_tree')` creates an authoritative server-side session; stores `backendSessionId`
3. User inputs (PTT or text) → `handlePilotTransmission()`
4. `radioBackend.transmit(backendSessionId, transcript)` → Python backend runs regex routing, readback evaluation, and side effects; returns `next_state_id`, `controller_say_template`, `auto_advanced_states`, `flags`
5. `moveToSilent(stateId)` called for each auto-advanced state then the final state — advances local cursor without triggering further auto-transitions
6. `scheduleControllerSpeech(controller_say_template)` speaks the ATC reply via TTS
7. PTT path: STT still goes to Nuxt (`POST /api/atc/ptt`); transcription result then calls step 4

## Decision Tree States
States have `role: 'pilot' | 'atc' | 'system'`. The engine supports two template field naming conventions:
- Old schema: `say_tpl`, `utterance_tpl` (MongoDB/legacy)
- New schema: `say_template`, `expected_pilot_template` (Python backend YAML)

Both are handled transparently by `stateSayTpl()` and `stateUtteranceTpl()` helpers in `communicationsEngine.ts`.

Template variables use `{{variable}}` (new) or `{variable}` (old) — both are rendered by `renderTpl()`.

Transitions: `next`, `ok_next`, `bad_next`, `timer_next`, `auto_transitions`.

## Environment Variables
- `NUXT_PUBLIC_RADIO_BACKEND_URL` — URL of the Python backend (default `http://127.0.0.1:8000`)

## Commands
- `bun run dev` — dev server (Nuxt)
- Python backend: see `OpenSquawk-LiveATC-api/README.md`
