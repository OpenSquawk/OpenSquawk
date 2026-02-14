# OpenSquawk - Project Guide

## Architecture
- **Nuxt 4** (Vue 3 SFC) frontend in `/app`
- **H3 server** handlers in `/server`
- **Shared types/utils** in `/shared`
- MongoDB models in `/server/models`

## Key Files
- `/shared/atc/engine.ts` — Core ATC engine composable `useAtcEngine()` (phase-based state machine)
- `/shared/atc/types.ts` — All ATC type definitions (Phase, Interaction, EngineState, Transmission, etc.)
- `/shared/atc/phases/` — Flight phase modules (clearance, ground, tower, departure, enroute, approach, landing, taxiIn, emergency)
- `/shared/atc/templateRenderer.ts` — `{var}` placeholder renderer for ATC templates
- `/shared/atc/telemetryWatcher.ts` — Telemetry condition evaluator for auto-advance
- `/server/api/atc/route.post.ts` — LLM router endpoint (token-efficient, picks from predefined candidates)
- `/server/api/atc/ptt.post.ts` — STT-only endpoint (Whisper transcription)
- `/server/api/atc/say.post.ts` — TTS endpoint (3 providers: OpenAI, Speaches, Piper)
- `/app/pages/liveatc.vue` — Live ATC page (v2)
- `/app/pages/classroom.vue` — Classroom learning mode (separate system)

## Live ATC Flow (/liveatc)
1. `initFlight(plan)` → sets up vars, phase='clearance'
2. User inputs (PTT or text) → `handlePilotInput(text)`
3. Engine builds candidates from current phase interactions
4. POST `/api/atc/route` → LLM picks best matching interaction
5. Engine renders ATC template, applies updates, checks readback
6. TTS plays ATC response via POST `/api/atc/say`
7. Telemetry auto-advances phases when conditions met

## Design System
- Dark glassmorphism: `--bg: #0b1020`, `--accent: #22d3ee` (cyan)
- `.glass`, `.panel`, `.hud` CSS classes
- Vuetify 3 + mdi icons + scoped CSS

## Commands
- `bun run dev` — dev server
- `npx nuxi typecheck` — type check (note: pre-existing errors in radioSpeech.ts)

## IMPORTANT: Agent Work Rules
- **NEVER dispatch parallel subagents for large tasks** — they hit prompt limits and waste all work
- Always work sequentially, one task at a time, commit after each
- For small independent tasks (< 50 LOC each), parallel is OK
