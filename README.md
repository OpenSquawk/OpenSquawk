# Self-host OpenSquawk

OpenSquawk is a browser-based aviation radio training application. It provides
Live ATC scenarios with spoken controller responses, a classroom learning mode,
and optional simulator/cockpit bridge integration.

This repository contains the Nuxt application and its H3 API. Live ATC routing
and authoritative session state are provided by the separate
[`OpenSquawk-API`](https://github.com/OpenSquawk/OpenSquawk-API)
service.

## Requirements

- Node.js 22 and Yarn 4
- MongoDB
- Python 3.12 and Poetry for `OpenSquawk-API`
- An OpenAI-compatible service for cloud STT/TTS, or a configured local speech
  provider

The simulator/cockpit bridge is optional.

## Start locally

Start MongoDB, then prepare the Nuxt application:

```bash
corepack enable
cp .env.example .env
yarn install
```

Generate strong values for `JWT_SECRET`, `APP_JWT_SECRET`, and
`SERVICE_SECRET`. Keep `AUTH_MODE=open` for a self-hosted instance without a
login. Configure the speech provider variables required by your setup.

In a separate checkout of `OpenSquawk-API`, start the decision backend:

```bash
poetry install
poetry run uvicorn main:app --reload
```

It listens on `http://127.0.0.1:8000` by default. If it runs elsewhere, set
`NUXT_PUBLIC_RADIO_BACKEND_URL` accordingly.

Start the Nuxt application:

```bash
AUTH_MODE=open yarn dev
```

The application is then available at `http://localhost:3000`.

## Configuration

All documented variables and self-hosting defaults are in
[`.env.example`](./.env.example). MongoDB stores user state, learning progress,
bug reports, and transmission logs locally. Telemetry forwarding is disabled
when `TELEMETRY_URL` is empty.

## Services

- `OpenSquawk-API`: decision flows, routing, and Live ATC session state
- MongoDB: application identities, progress, reports, and logs
- OpenAI-compatible or local speech service: transcription and controller audio
- Optional bridge: simulator and cockpit integration

## License

OpenSquawk is licensed under the
[OpenSquawk Community Source License 1.0](./LICENSE).
