# OpenSquawk - Project Guide

## Architecture
- **Nuxt 4** (Vue 3 SFC) frontend in `/app`
- **H3 server** handlers in `/server`
- **Shared types/utils** in `/shared`
- MongoDB models in `/server/models`

## Key Files
- `/shared/utils/communicationsEngine.ts` — Core state machine composable (used by `/pm` live ATC)
- `/server/utils/openai.ts` — LLM decision router (`routeDecision()`)
- `/server/services/decisionFlowService.ts` — Builds runtime decision trees from MongoDB
- `/app/pages/pm.vue` — Live ATC page (speech-to-text, PTT, text input)
- `/app/pages/classroom.vue` — Classroom learning mode (separate system, does NOT use communicationsEngine)

## Live ATC Flow (/pm)
1. User inputs (PTT or text) → `handlePilotTransmission()`
2. `processPilotTransmission()` logs the pilot message
3. `buildLLMContext()` builds candidates from `nextCandidates`
4. POST `/api/llm/decide` → `routeDecision()` selects next state
5. `applyLLMDecision()` moves to next state, updates vars/flags
6. `collectAtcStatesUntilPilotTurn()` advances through ATC/system states
7. Each ATC `say_tpl` is spoken via TTS (`scheduleControllerSpeech`)

## Decision Tree States
States have `role: 'pilot' | 'atc' | 'system'`. ATC states have `say_tpl` (what controller says). Pilot states have `utterance_tpl` (expected pilot response). Transitions: `next`, `ok_next`, `bad_next`, `timer_next`.

## Commands
- `bun run dev` — dev server
- Decision trees are stored in MongoDB and fetched via `/api/decision-flows/runtime`
