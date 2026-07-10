# OpenSquawk - Project Guide

## Architecture
- **Nuxt 4** (Vue 3 SFC) frontend in `/app`
- **H3 server** handlers in `/server`
- **Shared types/utils** in `/shared`
- MongoDB models in `/server/models`
- **Python backend** — a separate repo, `OpenSquawk-LiveATC-api`, owns the authoritative
  Live ATC (`/live-atc`, formerly `/pm` — legacy path now redirects) session state and routing decisions. It runs as its own service
  (default `http://127.0.0.1:8000`). This Nuxt app owns STT, TTS, client audio, auth,
  the flow editor, and account/admin features.

> The LLM decision routing that used to live in this repo (`routeDecision()`,
> `/api/llm/decide`, a Nuxt `/api/decision-flows/runtime` route) has been removed.
> Decision routing now happens in the Python backend. Don't reintroduce it here.

## Key Files
- `/app/composables/useRadioBackend.ts` — Typed client for the Python backend REST API
  (`createSession`, `transmit`, `deleteSession`, `fetchFlows`). This is how `/live-atc` talks
  to the decision engine.
- `/shared/utils/communicationsEngine.ts` — Local state-machine composable used by `/live-atc`.
  It mirrors the flow for cursor tracking and TTS scheduling; the **Python backend owns the
  authoritative state**. `fetchRuntimeTree()` loads the flow definition from the backend's
  `/api/decision-flows/runtime`.
- `/server/services/decisionFlowService.ts` — Builds/edits MongoDB-backed decision trees.
  Used **only by the flow editor** (`/server/api/editor/flows*`), not by `/live-atc`.
- `/server/utils/openai.ts` — `getOpenAIClient()` only. Used for TTS (`/api/atc/say`) and
  STT (`/api/atc/ptt`). It is **not** a decision router anymore.
- `/app/pages/live-atc.vue` — Live ATC page (speech-to-text, PTT, text input).
- `/app/pages/classroom.vue` — Classroom learning mode (separate system, does NOT use
  communicationsEngine).

## Live ATC Flow (/live-atc)
1. `startMonitoring()` → `fetchRuntimeTree('icao_atc_decision_tree', radioBackendUrl)`
   loads the flow definition from the Python backend into the local engine (cursor / TTS).
2. `startMonitoring()` → `radioBackend.createSession(...)` creates the authoritative
   server-side session and stores `backendSessionId`.
3. User input (PTT or text) → `handlePilotTransmission()`.
   PTT audio is transcribed first via Nuxt `POST /api/atc/ptt` (Whisper).
4. `radioBackend.transmit(backendSessionId, transcript)` → the Python backend runs regex
   routing, readback evaluation, side effects, and flow chaining; it returns
   `next_state_id`, `controller_say_template`, `auto_advanced_states`, `flags`,
   and `session_complete`.
5. `moveToSilent(stateId)` is called for each auto-advanced state and the final state —
   advances the local cursor without re-triggering auto-transitions.
6. `scheduleControllerSpeech(...)` speaks the ATC reply via TTS (`/api/atc/say`).

## Decision Tree States
States have `role: 'pilot' | 'atc' | 'system'`. The local engine handles two template
schemas transparently (via `stateSayTpl()` / `stateUtteranceTpl()`):
- Legacy (MongoDB editor): `say_tpl`, `utterance_tpl`, vars as `{var}`
- Python backend YAML: `say_template`, `expected_pilot_template`, vars as `{{var}}`

Both `{{var}}` and `{var}` are rendered by `renderTpl()`. Transition fields seen across
schemas: `next`, `ok_next`, `bad_next`, `timer_next`, `auto_transitions`.

## Environment Variables
- `NUXT_PUBLIC_RADIO_BACKEND_URL` — URL of the Python backend (default `http://127.0.0.1:8000`)

## Commands
- `yarn dev` — dev server (Nuxt)
- `yarn test` — runs the `tsx --test` suite (`tests/`, `server/`, `shared/`)
- Python backend: see `OpenSquawk-LiveATC-api/README.md`
