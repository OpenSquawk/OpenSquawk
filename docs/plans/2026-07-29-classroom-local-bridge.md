# Classroom Local Speech Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make classroom mode's instructor TTS use a locally running Speech Bridge when one is reachable, falling back to the existing cloud `/api/atc/say` path otherwise — same behavior live-atc already has.

**Architecture:** Reuse the existing `app/composables/useLocalSpeechBridge.ts` composable unchanged. Wire its `useLocalSpeechBridge()` probe and `postWithLocalFallback()` helper into classroom's single TTS call site (`requestSayAudio` in `app/pages/classroom.vue`), mirroring exactly how `app/composables/useRadioSpeech.ts` already does it for live-atc.

**Tech Stack:** Vue 3 `<script setup>` SFC, Vitest.

---

### Task 1: Wire the local bridge into classroom's TTS request

**Files:**
- Modify: `app/pages/classroom.vue` (imports near line 1489, `api` setup near line 2852, `requestSayAudio` at line 4323-4354)
- Test (already exists, unaffected — confirms the wiring re-uses the same tested primitive): `app/composables/useRadioSpeech.localRouting.test.ts`

**Step 1: Add the import**

In `app/pages/classroom.vue`, after the existing `useBugReport` import (line 1489):

```ts
import { postWithLocalFallback, useLocalSpeechBridge } from '~/composables/useLocalSpeechBridge'
```

**Step 2: Initialize the bridge probe alongside `api`**

Near line 2852, change:

```ts
const api = useApi()
```

to:

```ts
const api = useApi()
const { localUrl } = useLocalSpeechBridge()
```

**Step 3: Route the TTS request through the local bridge with cloud fallback**

In `requestSayAudio` (`app/pages/classroom.vue:4323-4343`), replace:

```ts
  const request = (async () => {
    const response: any = await api.post('/api/atc/say', payload)
    const audioData = response?.audio
```

with:

```ts
  const request = (async () => {
    const response: any = await postWithLocalFallback(
      localUrl('/api/atc/say'),
      payload,
      () => api.post('/api/atc/say', payload),
    )
    const audioData = response?.audio
```

Leave the rest of `requestSayAudio` (lines ~4331-4343) untouched — `sayCache`/`pendingSayRequests` caching is keyed by `cacheKey` (voice/level/rate/text), not by transport, so it needs no changes.

**Step 4: Typecheck**

Run: `yarn typecheck`
Expected: no new errors.

**Step 5: Run the test suite**

Run: `yarn test`
Expected: all existing tests pass, including `app/composables/useRadioSpeech.localRouting.test.ts` and `tests/shared/classroomCurriculum.test.ts` (neither touches classroom.vue directly, but both must stay green — they cover the shared primitives this task reuses).

**Step 6: Manual verification (no local bridge running)**

Run: `yarn dev`
Open classroom mode in the browser, trigger any instructor TTS playback (e.g. replay a prompt). Expect it to play normally via the cloud path — `localUrl('/api/atc/say')` returns `null` when no bridge is found on ports 8765-8770, so `postWithLocalFallback` calls the cloud function directly, identical to current behavior.

**Step 7: Manual verification (local bridge present) — optional but recommended**

Start a minimal stub server on port 8765 that responds `{ ok: true, ready: true }` on `GET /health` and returns a valid `{ audio: { base64, mime } }` shape on `POST /api/atc/say`, then reload classroom and trigger TTS again — confirm the network tab shows the request going to `127.0.0.1:8765` instead of the app's own origin. Skip this step if no bridge stub is readily available; the fallback logic itself is already covered by `useRadioSpeech.localRouting.test.ts`.

**Step 8: Commit**

```bash
git add app/pages/classroom.vue
git commit -m "feat(classroom): use local speech bridge for instructor TTS when available"
```
