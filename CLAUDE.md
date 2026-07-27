# OpenSquawk App — Project Guide

## Scope

This repository is the self-hostable OpenSquawk application. It contains the
browser UI and its H3 API. It does not own the authoritative Live ATC decision
state; that belongs to the separate `OpenSquawk-LiveATC-api` service.

## Architecture

- Nuxt 4 and Vue 3 frontend in `/app`
- H3 API handlers in `/server`
- Shared types, data, and state-machine utilities in `/shared`
- MongoDB models in `/server/models`
- Python decision backend at `NUXT_PUBLIC_RADIO_BACKEND_URL`

`AUTH_MODE=open` is the default. It creates one stable local `AppUser` identity
and requires no login. `AUTH_MODE=sso` is optional and exchanges a one-time code
with the configured `NUXT_PUBLIC_AUTH_ISSUER`; the app then owns its session.

## Key Files

- `/app/pages/index.vue` — mode selector and application entry point
- `/app/pages/live-atc.vue` — Live ATC UI
- `/app/pages/classroom.vue` — classroom learning mode
- `/app/composables/useRadioBackend.ts` — typed Python-backend client
- `/shared/utils/communicationsEngine.ts` — local cursor, variables, logs, and
  TTS scheduling for Live ATC
- `/server/utils/auth.ts` — app-user resolution and request authentication
- `/server/utils/authMode.ts` — open/SSO identity selection and local user
- `/server/utils/session.ts` — app-owned cookie and bearer tokens
- `/server/utils/telemetry.ts` — opt-in telemetry mirror; disabled when
  `TELEMETRY_URL` is empty
- `/server/utils/openai.ts` — OpenAI-compatible client for speech services

## Live ATC Flow

1. The frontend loads a runtime flow from `OpenSquawk-LiveATC-api`.
2. It creates an authoritative radio session in the Python backend.
3. PTT audio is transcribed through `POST /api/atc/ptt`; text input skips STT.
4. The transmission is sent to the Python session.
5. The returned state, auto-advanced states, variables, and flags update the
   local communications engine.
6. The controller response is spoken through `POST /api/atc/say`.

The Python backend owns routing and authoritative session state. Do not add a
second routing implementation to the Nuxt application.

## Decision State Compatibility

The local engine accepts both supported template conventions:

- `say_tpl` and `utterance_tpl`
- `say_template` and `expected_pilot_template`

It renders both `{variable}` and `{{variable}}`. Supported transition fields
include `next`, `ok_next`, `bad_next`, `timer_next`, and `auto_transitions`.

## Local Commands

```bash
yarn install
yarn dev
yarn test
yarn typecheck
```

Start `OpenSquawk-LiveATC-api` separately with:

```bash
poetry run uvicorn main:app --reload
```
