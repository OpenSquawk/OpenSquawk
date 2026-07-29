# Classroom: use the Local Speech Bridge when available

## Problem

`classroom.vue` always calls the cloud `/api/atc/say` endpoint for instructor
TTS. `live-atc.vue` already prefers a locally running Speech Bridge
(`app/composables/useLocalSpeechBridge.ts`, which probes `127.0.0.1:8765-8770`
for `GET /health` and falls back to the cloud path on failure/timeout) via
`useRadioSpeech.ts`. Classroom should get the same local-first behavior.

## Scope

- Classroom only performs TTS (`/api/atc/say`); it has no PTT/mic input, so
  `/api/atc/ptt` is out of scope.
- No UI indicator for bridge status — matches live-atc's silent fallback.

## Change

In `app/pages/classroom.vue`:

1. Import `postWithLocalFallback, useLocalSpeechBridge` from
   `~/composables/useLocalSpeechBridge` and call `useLocalSpeechBridge()` once
   during setup (same as `useRadioSpeech.ts:86`).
2. In `requestSayAudio()` (`classroom.vue:4323`), replace the direct
   `api.post('/api/atc/say', payload)` call with
   `postWithLocalFallback(localUrl('/api/atc/say'), payload, () => api.post('/api/atc/say', payload))`,
   matching `useRadioSpeech.ts:274-278`.

No payload/response shape changes are needed — classroom's payload is already
compatible with what the local bridge and cloud endpoint both expect, and
`sayCache`/`pendingSayRequests` caching is unaffected since it is keyed by
content, not transport.
