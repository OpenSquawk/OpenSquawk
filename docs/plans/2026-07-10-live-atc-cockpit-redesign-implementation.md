# Live ATC Cockpit Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Break up the 6573-line `app/pages/live-atc.vue` into composables + components
and re-skin the cockpit ("monitor") screen around a first-class Radio Panel, a PTT-docked
expected-comm strip, a prominent bug-report action, and fully-gated debug tooling —
without changing any backend contract or engine behavior.

**Architecture:** Pure extraction + re-skin, not a rewrite. Business logic that is
already correct moves verbatim into composables (`app/composables/`); genuinely pure
helper functions move into `shared/utils/` and get real unit tests; new visual layout
(Radio Panel, leaner HUD, docked expected-comm) is new code. `live-atc.vue` ends up as
a thin orchestrator over step/cockpit components.

**Tech Stack:** Nuxt 4 / Vue 3 `<script setup>`, Vuetify components, Tailwind utility
classes, `tsx --test` for unit tests (no component/DOM test harness exists in this repo
— see "Testing approach" below).

**Design reference:** [docs/plans/2026-07-10-live-atc-cockpit-redesign-design.md](2026-07-10-live-atc-cockpit-redesign-design.md)

---

## Testing approach (read before starting)

This repo's test suite (`yarn test` → `tsx --test tests/**/*.test.ts server/**/*.test.ts
shared/**/*.test.ts`) has no Vue component mounting / DOM harness (no `@vue/test-utils`,
no jsdom). Setting one up is out of scope for this redesign.

So the plan uses two verification modes, and each task says which one applies:

- **Unit-testable (real TDD, red→green):** only for pure functions with no Vue/Nuxt/DOM
  dependency, extracted to `shared/utils/`. These get a real failing test first.
- **Extraction/component tasks (typecheck + browser verification):** moving/writing Vue
  code. Verified with `yarn nuxt typecheck` (or `npx vue-tsc --noEmit` if that script
  doesn't exist — check `package.json` first) and a manual pass in the browser preview
  per CLAUDE.md's frontend-change rule. Writing a fake assertion just to have a "test"
  step here would be test theater — don't do it.

Commit after every task regardless of which mode it used.

---

## Milestone 0 — Pure logic extraction (real TDD)

These three helpers are currently inline in `live-atc.vue` with zero test coverage.
Pulling them out first de-risks the composable extraction in Milestone 2, since the
composables can then just import tested helpers instead of carrying the logic inline.

### Task 1: Extract `normalizeManualFreq` to `shared/utils/frequency.ts`

**Files:**
- Create: `shared/utils/frequency.ts`
- Test: `tests/shared/frequency.test.ts`
- Modify: `app/pages/live-atc.vue:4943-4951` (remove local def, import instead)

**Step 1: Write the failing test**

Current implementation, for reference (`app/pages/live-atc.vue:4943-4951`):
```ts
function normalizeManualFreq(input: string): string | null {
  const trimmed = input.trim().replace(',', '.')
  if (!/^\d{2,3}(\.\d{1,3})?$/.test(trimmed)) return null
  const num = Number(trimmed)
  if (!Number.isFinite(num) || num < 108 || num >= 137) return null
  return num.toFixed(3)
}
```

```ts
// tests/shared/frequency.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeManualFreq } from '../../shared/utils/frequency.ts'

test('normalizeManualFreq pads a bare integer to three decimals', () => {
  assert.equal(normalizeManualFreq('121'), '121.000')
})

test('normalizeManualFreq accepts a comma decimal separator', () => {
  assert.equal(normalizeManualFreq('121,3'), '121.300')
})

test('normalizeManualFreq rejects values outside the VHF airband', () => {
  assert.equal(normalizeManualFreq('99.000'), null)
  assert.equal(normalizeManualFreq('140.000'), null)
})

test('normalizeManualFreq rejects garbage input', () => {
  assert.equal(normalizeManualFreq('abc'), null)
  assert.equal(normalizeManualFreq(''), null)
})
```

**Step 2: Run test to verify it fails**

Run: `yarn test 2>&1 | grep -A3 frequency`
Expected: FAIL — `shared/utils/frequency.ts` does not exist yet.

**Step 3: Create `shared/utils/frequency.ts`**

```ts
export function normalizeManualFreq(input: string): string | null {
  const trimmed = input.trim().replace(',', '.')
  if (!/^\d{2,3}(\.\d{1,3})?$/.test(trimmed)) return null
  const num = Number(trimmed)
  if (!Number.isFinite(num) || num < 108 || num >= 137) return null
  return num.toFixed(3)
}
```

**Step 4: Run test to verify it passes**

Run: `yarn test 2>&1 | grep -A3 frequency`
Expected: PASS, all 4 assertions.

**Step 5: Wire the import in `live-atc.vue` and delete the inline copy**

In `app/pages/live-atc.vue`, add to the import block (near line 1518):
```ts
import { normalizeManualFreq } from '../../shared/utils/frequency'
```
Delete the local `function normalizeManualFreq(...)` block at `4943-4951`. Every
existing call site (`applyManualFrequency`, the `:disabled` bindings on the two
`freq-manual-btn` template buttons) keeps working unchanged since the name is
identical.

**Step 6: Typecheck + commit**

Run: `yarn nuxt typecheck` (check `package.json` scripts if this exact command
doesn't exist — fall back to `npx vue-tsc --noEmit`)
Expected: no new errors.

```bash
git add shared/utils/frequency.ts tests/shared/frequency.test.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract normalizeManualFreq to shared/utils, add tests"
```

### Task 2: Extract bridge-telemetry normalization to `shared/utils/bridgeTelemetry.ts`

**Files:**
- Create: `shared/utils/bridgeTelemetry.ts`
- Test: `tests/shared/bridgeTelemetry.test.ts`
- Modify: `app/pages/live-atc.vue:5313-5349` (remove local defs, import instead)

**Step 1: Write the failing test**

Source functions to move verbatim (`app/pages/live-atc.vue:5313-5349`):
`normalizeSimFreq`, `normalizeBridgeTelemetry`, `telemetrySignature`. Import the
`NormalizedTelemetry` type from `app/composables/useRadioBackend.ts` (already exported
there).

```ts
// tests/shared/bridgeTelemetry.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeSimFreq,
  normalizeBridgeTelemetry,
  telemetrySignature,
} from '../../shared/utils/bridgeTelemetry.ts'

test('normalizeSimFreq formats a valid COM value to 3 decimals', () => {
  assert.equal(normalizeSimFreq(119.9), '119.900')
})

test('normalizeSimFreq rejects out-of-band values', () => {
  assert.equal(normalizeSimFreq(50), null)
  assert.equal(normalizeSimFreq('not-a-number'), null)
})

test('normalizeBridgeTelemetry maps SimConnect field names', () => {
  const result = normalizeBridgeTelemetry({
    PLANE_ALTITUDE: 3500, AIRSPEED_INDICATED: 140, GROUND_VELOCITY: 138,
    VERTICAL_SPEED: 800, PLANE_HEADING_DEGREES_TRUE: 270, SIM_ON_GROUND: false,
  })
  assert.deepEqual(result, {
    altitude_ft: 3500, ias_kts: 140, gs_kts: 138,
    vs_fpm: 800, heading_deg: 270, on_ground: false,
  })
})

test('normalizeBridgeTelemetry returns null for non-object input', () => {
  assert.equal(normalizeBridgeTelemetry(null), null)
})

test('telemetrySignature is stable under sub-threshold jitter', () => {
  const a = telemetrySignature({ altitude_ft: 3500, ias_kts: 140, on_ground: false })
  const b = telemetrySignature({ altitude_ft: 3540, ias_kts: 141, on_ground: false })
  assert.equal(a, b)
})

test('telemetrySignature changes on a meaningful altitude change', () => {
  const a = telemetrySignature({ altitude_ft: 3500, on_ground: false })
  const b = telemetrySignature({ altitude_ft: 4200, on_ground: false })
  assert.notEqual(a, b)
})
```

**Step 2: Run test to verify it fails**

Run: `yarn test 2>&1 | grep -A3 bridgeTelemetry`
Expected: FAIL — module not found.

**Step 3: Create `shared/utils/bridgeTelemetry.ts`**

Move `normalizeSimFreq`, `normalizeBridgeTelemetry`, `telemetrySignature` verbatim from
`live-atc.vue:5313-5349` into the new file, importing `NormalizedTelemetry` from
`../../app/composables/useRadioBackend` (adjust the relative path from
`shared/utils/`).

**Step 4: Run test to verify it passes**

Run: `yarn test 2>&1 | grep -A3 bridgeTelemetry`
Expected: PASS, all 6 assertions.

**Step 5: Wire the import, delete the inline copies**

Add the import in `live-atc.vue`, delete lines `5313-5349`. Callers
(`forwardTelemetryToBackend`, `pollBridgeTelemetry`) are untouched since names match.

**Step 6: Typecheck + commit**

```bash
git add shared/utils/bridgeTelemetry.ts tests/shared/bridgeTelemetry.test.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract bridge-telemetry normalization to shared/utils, add tests"
```

### Task 3: Extract WAV encoding to `shared/utils/wavEncoder.ts`

**Files:**
- Create: `shared/utils/wavEncoder.ts`
- Test: `tests/shared/wavEncoder.test.ts`
- Modify: `app/pages/live-atc.vue:4038-4066` (remove local def, import instead)

**Step 1: Write the failing test**

Move `encodeWav(pcm: Float32Array, sampleRate: number): Blob` verbatim from
`live-atc.vue:4038-4066`.

```ts
// tests/shared/wavEncoder.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encodeWav } from '../../shared/utils/wavEncoder.ts'

test('encodeWav produces a valid RIFF/WAVE header', async () => {
  const pcm = new Float32Array([0, 0.5, -0.5, 1, -1])
  const blob = encodeWav(pcm, 16000)
  const buf = new Uint8Array(await blob.arrayBuffer())
  const ascii = (start: number, len: number) =>
    String.fromCharCode(...buf.slice(start, start + len))
  assert.equal(ascii(0, 4), 'RIFF')
  assert.equal(ascii(8, 4), 'WAVE')
  assert.equal(ascii(12, 4), 'fmt ')
  // sample rate is little-endian at byte offset 24
  const view = new DataView(buf.buffer)
  assert.equal(view.getUint32(24, true), 16000)
})

test('encodeWav clamps out-of-range samples instead of wrapping', async () => {
  const pcm = new Float32Array([2, -2])
  const blob = encodeWav(pcm, 16000)
  const buf = new Uint8Array(await blob.arrayBuffer())
  const view = new DataView(buf.buffer)
  // 16-bit PCM data starts at byte 44 in a standard WAV header
  assert.equal(view.getInt16(44, true), 32767)
  assert.equal(view.getInt16(46, true), -32768)
})
```

**Step 2: Run test to verify it fails**

Run: `yarn test 2>&1 | grep -A3 wavEncoder`
Expected: FAIL — module not found.

**Step 3: Create `shared/utils/wavEncoder.ts`**, moving `encodeWav` verbatim.

**Step 4: Run test to verify it passes**

Run: `yarn test 2>&1 | grep -A3 wavEncoder`
Expected: PASS.

**Step 5: Wire the import in `live-atc.vue`, delete the inline copy at `4038-4066`.**

**Step 6: Typecheck + commit**

```bash
git add shared/utils/wavEncoder.ts tests/shared/wavEncoder.test.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract encodeWav to shared/utils, add tests"
```

---

## Milestone 1 — Shared visual foundation

### Task 4: `RadarBackdrop.vue`

**Files:**
- Create: `app/components/RadarBackdrop.vue`
- Reference: `app/pages/start.vue:169-219` (`.start-bg__*` classes + template usage at
  the top of `start.vue`'s root `<div>`)

**Step 1: Create the component**

Extract the radar-ring / glow / grid-overlay treatment from `start.vue` into a
reusable, parameterized component:

```vue
<script setup lang="ts">
withDefaults(defineProps<{
  glowPrimary?: string
  glowSecondary?: string
}>(), {
  glowPrimary: 'rgba(103, 232, 249, 0.35)',
  glowSecondary: 'rgba(251, 191, 36, 0.25)',
})
</script>

<template>
  <div class="radar-backdrop" aria-hidden="true">
    <div class="radar-backdrop__glow radar-backdrop__glow--a" :style="{ background: `radial-gradient(circle, ${glowPrimary}, transparent 70%)` }" />
    <div class="radar-backdrop__glow radar-backdrop__glow--b" :style="{ background: `radial-gradient(circle, ${glowSecondary}, transparent 70%)` }" />
    <div class="radar-backdrop__grid" />
    <svg class="radar-backdrop__radar" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="200" r="60" stroke="currentColor" stroke-width="1" />
      <circle cx="200" cy="200" r="120" stroke="currentColor" stroke-width="1" />
      <circle cx="200" cy="200" r="180" stroke="currentColor" stroke-width="1" />
      <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" stroke-width="1" />
      <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" stroke-width="1" />
    </svg>
  </div>
</template>

<style scoped>
.radar-backdrop { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.radar-backdrop__glow { position: absolute; border-radius: 9999px; filter: blur(90px); opacity: 0.35; width: 32rem; height: 32rem; }
.radar-backdrop__glow--a { top: -10%; left: -8%; }
.radar-backdrop__glow--b { bottom: -15%; right: -10%; width: 30rem; height: 30rem; }
.radar-backdrop__grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%);
}
.radar-backdrop__radar {
  position: absolute; top: 50%; left: 50%; width: 44rem; height: 44rem;
  transform: translate(-50%, -50%); color: rgba(103,232,249,.08);
  animation: radar-backdrop-spin 60s linear infinite;
}
@keyframes radar-backdrop-spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
</style>
```

**Step 2: Verify in isolation**

There's no component test harness (see "Testing approach"). Verify by temporarily
dropping `<RadarBackdrop />` into `start.vue` in place of its inline `.start-bg__*`
`<div>`s, confirming the preview looks identical, then decide in Task 13 whether
`start.vue` itself gets migrated too (optional — not required for this redesign, only
`live-atc.vue`'s setup screens must use it).

**Step 3: Commit**

```bash
git add app/components/RadarBackdrop.vue
git commit -m "feat(live-atc): add shared RadarBackdrop component for navy/radar visual language"
```

---

## Milestone 2 — Composables (business logic extraction)

Each task in this milestone follows the same shape: move a cohesive block of state +
functions out of `live-atc.vue` into `app/composables/`, verbatim, then wire the page
to call the composable instead. **Verification mode: typecheck + browser**, per
"Testing approach" — these all touch `ref`/Nuxt runtime/DOM APIs that this repo's test
harness can't mount.

### Task 5: `useFrequencyPresets.ts`

**Files:**
- Create: `app/composables/useFrequencyPresets.ts`
- Modify: `app/pages/live-atc.vue`

**Move verbatim** (source line ranges from the current file):
- State: `frequencies` (2664-2668), `airportFrequencies` (2669), `airportName` (2670),
  `airportFrequencyLoading` (2671), `frequencySources` (2672), `activeAirportIcao`
  (2680), `manualFreqActive`/`manualFreqStandby` (4937-4938), `swapAnimation` (2366).
- Computed: `atisEntries` (2859), `atisFrequencyEntry` (2862), `frequencySourceLabels`
  (2900), `tunedAtisEntry` (2912), `displayAirportFrequencies` (2940),
  `frequencyPresets` (4885), `presetOptions` (4911), `airportFreqMap` (1727),
  `airportFreqListMap` (1753).
- Functions: `extractAtisRunway` (2871), `normalizedFrequencyValue` (2907),
  `frequencyDisplayKey` (2925), `sourceLabel` (2931), `applyManualFrequency` (4951,
  now calls the extracted `normalizeManualFreq` from Task 1), `presetKey` (4891),
  `presetLabel` (4893), `findPreset` (4924), `onPresetSelectActive` (4927),
  `onPresetSelectStandby` (4931), `swapFrequencies` (4860), `fetchAirportFrequencies`
  (4471), `applyFrequencyVariablesFromList` (4443), `setActiveFrequencyFromList`
  (4508), `setStandbyFrequencyFromList` (4523), `toFrequencyVariableUpdate` (4400),
  `updateEngineFrequencyFromEntry` (4413), `syncLocalFrequenciesWithEngine` (4422),
  `expectedFrequencyForState` (1738), `acceptedFrequenciesForState` (1764),
  `FREQ_NAME_TO_VAR`, `FREQUENCY_PLACEHOLDER`, `frequencyTypeMap`, `FREQ_ROLE_ORDER`,
  `FREQ_ROLE_LABEL` constants.

**Signature** — the composable takes the pieces it needs from the engine/session
(`engine`, callbacks it currently closes over) as arguments, and returns everything
listed above:

```ts
export function useFrequencyPresets(engine: ReturnType<typeof useCommunicationsEngine>) {
  // ...moved state/computed/functions...
  return {
    frequencies, airportFrequencies, airportName, airportFrequencyLoading,
    frequencySources, activeAirportIcao, manualFreqActive, manualFreqStandby,
    swapAnimation, atisEntries, atisFrequencyEntry, frequencySourceLabels,
    tunedAtisEntry, displayAirportFrequencies, frequencyPresets, presetOptions,
    applyManualFrequency, onPresetSelectActive, onPresetSelectStandby,
    swapFrequencies, fetchAirportFrequencies, applyFrequencyVariablesFromList,
    setActiveFrequencyFromList, setStandbyFrequencyFromList,
    expectedFrequencyForState, acceptedFrequenciesForState,
  }
}
```

**Step 1:** Create the file, move the code, adjust internal references (anything the
moved code reads from `engine`, `vars`, `flags` must come through the `engine` param).

**Step 2:** In `live-atc.vue`, replace the moved declarations with:
```ts
const {
  frequencies, airportFrequencies, /* ...rest of the returned names... */
} = useFrequencyPresets(engine)
```

**Step 3:** Typecheck (`yarn nuxt typecheck`), fix any now-dangling references.

**Step 4:** Manual browser verification — start the dev server, run the demo flight,
confirm: frequency chips still show correct values, swap button works, manual
frequency entry works, ATIS still resolves.

**Step 5: Commit**

```bash
git add app/composables/useFrequencyPresets.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract frequency/preset management to useFrequencyPresets"
```

### Task 6: `useAtisPlayback.ts`

**Files:** Create `app/composables/useAtisPlayback.ts`; modify `app/pages/live-atc.vue`.

**Move verbatim:** `atisPlaybackLoading`/`atisLoopKey` (2673-2674), `atisEpochByMap`
(2684), `ATIS_REFRESH_MINUTES`/`ATIS_RETRY_NO_DATA_MS` (2690-2691),
`cancelAirportDataRefresh`/`msUntilNextAtisSlot`/`scheduleAirportDataRefresh`
(2693-2737), `buildAtisAnnouncement` (4562), `buildAtisLoopKey` (4592), `resolveAtisEpoch`
(4602), `ensureAtisAudioLoop`/`stopAtisLoop` (4617-4638), `atisAudioRequestCache`
(4639), `requestAtisAudio` (4642), `prefetchAtisAudio` (4675), `startAtisLoop` (4683),
`playAtisBroadcast` (4771), `atisVariantLabel` (4551), `fetchMetarText` (4534), and
the two `watch()` blocks that drive the ATIS loop lifecycle (`live-atc.vue:5228-5261`).
Depends on `useFrequencyPresets` (Task 5) for `tunedAtisEntry`/`airportFrequencies` —
take them as parameters.

**Steps:** same shape as Task 5 (create → move → wire dependency params → replace call
sites in `live-atc.vue` → typecheck → manual verify ATIS still plays on tuning to an
ATIS frequency and loops on schedule → commit).

```bash
git add app/composables/useAtisPlayback.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract ATIS playback/loop scheduling to useAtisPlayback"
```

### Task 7: `usePttRecording.ts`

**Files:** Create `app/composables/usePttRecording.ts`; modify `app/pages/live-atc.vue`.

**Move verbatim:** `mediaRecorder`/`audioChunks` (2837-2838), `micPermission` (2364),
`isRecording` (2362), `PTT_MAX_DURATION_MS` (2365), `prerecEnabled`/`prerecSeconds`
(2632-2633), `requestMicAccess` (3998), `snapshotPrerecPCM` (4027, now calls the
extracted `encodeWav` from Task 3), `stopPrerecCapture` (4067), `startPrerecCapture`
(4087), `restartPrerecCapture` (4155), `clearPttTimer`/`startPttTimer` (4161-4178),
`startRecording` (4179), `stopRecording` (4247), `arrayBufferToBase64` (4296),
`buildSttExpected` (4310), `processTransmission` (4324), the pre-recording lifecycle
`watch()` blocks (`5264-5285`), and `playPTTBeep` (4993).

**Steps:** same shape as Task 5. Depends on `handlePilotTransmission` (stays in
`useLiveAtcSession`, Task 12) as a callback parameter, since `processTransmission`
calls it after STT completes.

```bash
git add app/composables/usePttRecording.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract PTT/mic recording and pre-rec buffer to usePttRecording"
```

### Task 8: `useRadioSpeech.ts`

**Files:** Create `app/composables/useRadioSpeech.ts`; modify `app/pages/live-atc.vue`.

**Move verbatim:** `_pendingSpeechAborts` (3135), `stopCurrentSpeech` (3141),
`enqueueSpeech` (3160), `prepareSpeech` (3173), `ensureAudioContext` (3217),
`ensurePizzicato` (3237), `playAudioWithEffects` (3246), `fetchSpeechAudio` (3331),
`speakPrepared` (3367), `speakWithRadioEffects` (3387), `speakPlainText` (3404),
`scheduleControllerSpeech` (3438), `speakPilotReadback` (3449), `toRadioSpeech` (1690),
`radioEffectsEnabled`/`readbackEnabled`/`speechSpeed` (2369-2371, 2368),
`radioQuality`/`speechSpeedLabel` (2843, 2852), `answerRadioCheck` (4809),
`performRadioCheck` (4840), `RADIO_CHECK_RE`/`SAY_AGAIN_RE`/`FAREWELL_RE`/
`READABILITY_PHRASE` (4778-4799), `tunedStationEntry` (4799), `readabilityOptions`
(4973), `onReadabilitySelect` (4980), `signalStrength` (2367).

**Steps:** same shape as Task 5.

```bash
git add app/composables/useRadioSpeech.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract TTS/radio-effects scheduling to useRadioSpeech"
```

### Task 9: `useBugReport.ts`

**Files:** Create `app/composables/useBugReport.ts`; modify `app/pages/live-atc.vue`.

**Move verbatim:** `showBugReportDialog` through `bugReportImgRef` (2375-2385),
`setupAnnotationCanvas` (2389), `_drawArrow` (2397), `_redrawAnnotations` (2417),
`_canvasCoords` (2431), `onCanvasMouseDown/Move/Up/Leave` (2437-2464), `undoLastArrow`
(2465), `openBugReport` (2470), `submitBugReport` (2504), `restoreBugReportState`
(2560).

**Steps:** same shape as Task 5. This composable is UI-adjacent (canvas annotation) —
still gets its own file since it's ~200 lines of self-contained logic the
`BugReportDialog.vue` component (Task 21) will consume.

```bash
git add app/composables/useBugReport.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract bug-report capture/annotation to useBugReport"
```

### Task 10: `useSimBridgeSync.ts`

**Files:** Create `app/composables/useSimBridgeSync.ts`; modify `app/pages/live-atc.vue`.

**Move verbatim:** `bridgeToken` (5293), `bridgeConnected`/`bridgeSimActiveFreq`
(5298-5299), `bridgePosition` (5302), `BRIDGE_TELEMETRY_STALE_MS`/
`BRIDGE_POLL_INTERVAL_MS` (5304-5305), `forwardTelemetryToBackend` (5351),
`pollBridgeTelemetry` (5375), `startBridgeSync`/`stopBridgeSync` (5434-5446),
`bridgePttConnected` (5456), `handleRemotePtt` (5458), `schedulePttReconnect` (5471),
`connectPttSocket` (5479), `disconnectPttSocket` (5516), and the corresponding
`onMounted`/`watch(bridgeToken, ...)`/`onUnmounted` wiring (5529-5548, split: the
bridge-sync parts move here, `stopAtisLoop`/`stopPrerecCapture`/`clearSilenceTimer`
stay with their respective composables' own `onUnmounted`, or get aggregated in
`useLiveAtcSession`). Uses `normalizeSimFreq`/`normalizeBridgeTelemetry`/
`telemetrySignature` from Task 2's `shared/utils/bridgeTelemetry.ts`.

**Signature:** takes `backendSessionId`, `frequencies` (from `useFrequencyPresets`),
`radioBackend`, `startRecording`/`stopRecording` (from `usePttRecording`),
`applyBackendDecision` (from `useLiveAtcSession`), `stopCurrentSpeech` (from
`useRadioSpeech`) as parameters; returns `bridgeConnected`, `bridgeSimActiveFreq`,
`bridgePosition`, `bridgePttConnected`, `startBridgeSync`, `stopBridgeSync`,
`connectPttSocket`, `disconnectPttSocket`.

**Steps:** same shape as Task 5. Manual verification here specifically needs the
SimBridge connected (or accept this is typecheck-only if no bridge is available in the
dev environment — note that limitation rather than skipping verification silently).

```bash
git add app/composables/useSimBridgeSync.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract SimBridge telemetry sync and remote PTT to useSimBridgeSync"
```

### Task 11: `useDebugSimulation.ts`

**Files:** Create `app/composables/useDebugSimulation.ts`; modify `app/pages/live-atc.vue`.

**Move verbatim:** `simulationRunning`/`simulationTrace`/`simulationError`
(2659-2661), `simulationPilotSteps` (3028), `simulationDecisions` (3047),
`recordedAtcStates` (3121), `simulationStepCount` (3122), `wait` (3124),
`completedPilotSteps` (2854), `debugState` (3179), `debugNextStates` (3192),
`formatTracePayload` (5015), `recordCurrentAtcMessage` (5025), `pickNextStateId`
(5045), `advanceAutomaticStates` (5063), `runFullSimulation` (5083), plus all of the
decision-trace normalization block: `activeFlowInfo` (1832), `decisionTrace` (1844),
`timelineSteps`/`timelineUsedFallback` (1845-1846), `traceAutoSelection`/
`traceFallback` (1847-1848), `VALID_TRACE_STAGES` (1851), `cloneForTrace` (1862),
`isPlainObject` (1874), `ensureTraceCalls` (1878), `normalizeTraceFallback` (1902),
`normalizeTraceAutoSelection` (1918), `normalizeTimelineCandidate` (1936),
`normalizeTimelineElimination` (1971), `normalizeTimelineStep` (1992),
`normalizeCandidateTimeline` (2025), `normalizeDecisionTraceResult` (2047),
`describeElimination` (2088), `debugMode` (2372).

This is the composable that makes the "debug tools fully gated" requirement real:
**`DebugPanel.vue` (Task 21) is the only place this composable gets instantiated**, and
it only mounts when `debugMode` is true (see Task 24). Nothing in
`CockpitShell.vue`/`live-atc.vue` should import from this file directly.

**Steps:** same shape as Task 5, plus one extra check: grep the rest of `live-atc.vue`
after extraction to confirm no non-debug code references anything moved here (this
verifies the gating actually holds).

```bash
grep -n "decisionTrace\|simulationTrace\|debugState\|runFullSimulation" app/pages/live-atc.vue
```
Expected: no matches outside comments/the new composable import site.

```bash
git add app/composables/useDebugSimulation.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract debug/simulation-trace tooling to useDebugSimulation, gate behind debugMode"
```

### Task 12: `useLiveAtcSession.ts`

**Files:** Create `app/composables/useLiveAtcSession.ts`; modify `app/pages/live-atc.vue`.

This is the core session controller — the bridge to the Python backend via
`useRadioBackend`. Do this one last in the milestone since it's the piece other
composables call back into (`applyBackendDecision`, `handlePilotTransmission`).

**Move verbatim:** `backendSessionId` (1679), `lastControllerSay` (1681),
`backendExpectedPhrase` (1683), `lastReadbackReport`/`lastReadbackTranscript`
(1685-1686), `displayControllerSay`/`displayExpectedPhrase` (1700-1711),
`lastTransmission`/`lastTransmissionFaulty`/`lastTransmissionFaultNote` (1775-1779),
`showTransmissionIssueDialog`/`transmissionIssueNote` (1778-1779),
`setLastTransmission`/`clearLastTransmission`/`markLastTransmissionFault`/
`resetLastTransmissionFault` (1781-1801), `startTransmissionIssueFlow`/
`confirmTransmissionIssue`/`removeTransmissionIssue`/`cancelTransmissionIssue`
(1802-1826), `clearLog` (1827), `sessionLabel` (1849), `clearSilenceTimer`/
`armSilenceTimer` (3469-3510), `applyBackendDecision` (3511), `handlePilotTransmission`
(3587), `loadFlightPlans` (3750), `sessionStarting`/`sessionStartingMessage`
(3778-3779), `startMonitoring` (3781), `startDemoFlight` (3961), `launchScenario`
(3974), `flyAgain` (3980), `backToSetup` (3988), `sendPilotText` (4377),
`normalizeExpectedText` (3212), `redirectToLogin` (2738), `vatsimId`/`flightPlans`/
`selectedPlan` (2819-2821), `currentScreen` (2358), `activeScenario`/
`completedScenario`/`oppositeScenario` (2344-2358), `pilotInput` (2361), `loading`/
`error` (2359-2360).

**Steps:** same shape as Task 5, but this composable takes `engine`, `radioBackend`,
and the return values of Tasks 5–10 as parameters (frequency sync callbacks, speech
scheduling, PTT control) since it orchestrates all of them. After wiring, `live-atc.vue`
should have almost no `const`/`function` declarations left outside composable calls —
confirm with:

```bash
grep -c "^const \|^function \|^async function " app/pages/live-atc.vue
```
Expected: single digits (just local UI state like `activeTab`, `experienceMenu`,
sheet-open booleans that genuinely belong to the page/CockpitShell).

```bash
git add app/composables/useLiveAtcSession.ts app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract session controller (backend transmit/decision handling) to useLiveAtcSession"
```

---

## Milestone 3 — Setup-step components (re-skin, no logic change)

For each: create the component, move the corresponding `<section v-else-if="currentScreen === '...'">`
template block into it (props in, events out — e.g. `@select-plan`, `@launch`), apply
`<RadarBackdrop />` + the navy/glow card treatment from the design doc in place of the
current `bg-white/5` Vuetify cards, wire it into `live-atc.vue`, manually verify each
screen in the browser, commit.

### Task 13: `FlightSourceStep.vue`

**Files:** Create `app/components/live-atc/FlightSourceStep.vue`.
**Source:** `app/pages/live-atc.vue:16-71` (VATSIM CID entry + demo mode).
**Props:** `vatsimId` (v-model), `loading`, `error`. **Emits:** `load-flight-plans`,
`start-demo`.

```bash
git add app/components/live-atc/FlightSourceStep.vue app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract flight-source step to FlightSourceStep.vue, apply navy/radar skin"
```

### Task 14: `FlightSelectStep.vue`

**Files:** Create `app/components/live-atc/FlightSelectStep.vue`.
**Source:** `app/pages/live-atc.vue:74-125`.
**Props:** `flightPlans`, `loading`, `vatsimId`. **Emits:** `select-plan`, `back`.

```bash
git add app/components/live-atc/FlightSelectStep.vue app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract flight-select step to FlightSelectStep.vue, apply navy/radar skin"
```

### Task 15: `ScenarioPickerStep.vue`

**Files:** Create `app/components/live-atc/ScenarioPickerStep.vue`.
**Source:** `app/pages/live-atc.vue:128-233`. Keep the `chainGroups`/`drillScenarios`
"phase flow" structure exactly as-is — only re-skin cards/backgrounds.
**Props:** `chainGroups`, `drillScenarios`, `selectedPlan`, `error`, `flightPlansCount`.
**Emits:** `launch`, `back`, `dismiss-error`.

```bash
git add app/components/live-atc/ScenarioPickerStep.vue app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract scenario picker to ScenarioPickerStep.vue, apply navy/radar skin"
```

### Task 16: `SessionCompleteStep.vue`

**Files:** Create `app/components/live-atc/SessionCompleteStep.vue`.
**Source:** `app/pages/live-atc.vue:236-269`.
**Props:** `completedScenario`, `selectedPlan`, `oppositeScenario`. **Emits:**
`fly-again`, `try-opposite`, `back-to-scenarios`.

```bash
git add app/components/live-atc/SessionCompleteStep.vue app/pages/live-atc.vue
git commit -m "refactor(live-atc): extract completion screen to SessionCompleteStep.vue, apply navy/radar skin"
```

---

## Milestone 4 — Cockpit components (new layout)

These implement the redesign itself, per the mockup approved in the design doc. Unlike
Milestone 3, several of these are genuinely new layout (not a straight move), so full
markup is given where it's new.

### Task 17: `RadioPanel.vue` (the centerpiece of the redesign)

**Files:** Create `app/components/live-atc/cockpit/RadioPanel.vue`.

Replaces the header's `HoldSelect`-based freq chips (current
`live-atc.vue:384-505`) with a main-content module: ACT/STBY windows, swap button,
channel-preset row, readability indicator — per the mockup reviewed with the user
(see design doc, "Radio Panel" section).

```vue
<script setup lang="ts">
import type { HoldSelectOption } from '~/components/HoldSelect.vue'

defineProps<{
  active: string
  standby: string
  activeStation?: string
  standbyStation?: string
  presetOptions: HoldSelectOption[]
  channels: Array<{ role: string; freq: string; active: boolean }>
  signalStrength: number
  manualFreqActive: string
  manualFreqStandby: string
}>()

const emit = defineEmits<{
  (e: 'swap'): void
  (e: 'select-active', option: HoldSelectOption): void
  (e: 'select-standby', option: HoldSelectOption): void
  (e: 'select-channel', role: string): void
  (e: 'update:manualFreqActive', value: string): void
  (e: 'update:manualFreqStandby', value: string): void
}>()
</script>

<template>
  <div class="radio-panel">
    <div class="radio-panel__signal" aria-label="Readability">
      <span v-for="i in 5" :key="i" class="radio-panel__bar" :class="{ 'is-active': i <= signalStrength }" />
    </div>
    <div class="radio-panel__row">
      <HoldSelect
          :options="presetOptions"
          title="Select standby frequency"
          menu-class="freq-hold-menu"
          @select="emit('select-standby', $event)"
      >
        <template #default="{ open }">
          <button type="button" class="radio-panel__window radio-panel__window--sby" :class="{ 'is-open': open }">
            <span class="radio-panel__tag">Standby</span>
            <span class="radio-panel__num">{{ standby || '---.---' }}</span>
            <span v-if="standbyStation" class="radio-panel__station">{{ standbyStation }}</span>
          </button>
        </template>
      </HoldSelect>

      <button type="button" class="radio-panel__swap" aria-label="Swap active and standby" @click="emit('swap')">
        <v-icon size="18">mdi-swap-vertical</v-icon>
      </button>

      <HoldSelect
          :options="presetOptions"
          title="Select active frequency"
          menu-class="freq-hold-menu"
          @select="emit('select-active', $event)"
      >
        <template #default="{ open }">
          <button type="button" class="radio-panel__window radio-panel__window--act" :class="{ 'is-open': open }">
            <span class="radio-panel__tag">Active</span>
            <span class="radio-panel__num">{{ active || '---.---' }}</span>
            <span v-if="activeStation" class="radio-panel__station">{{ activeStation }}</span>
          </button>
        </template>
      </HoldSelect>
    </div>

    <div class="radio-panel__channels">
      <button
          v-for="ch in channels"
          :key="ch.role"
          type="button"
          class="radio-panel__chan"
          :class="{ 'is-on': ch.active }"
          @click="emit('select-channel', ch.role)"
      >
        <b>{{ ch.role }}</b>{{ ch.freq }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.radio-panel {
  position: relative;
  border-radius: 16px;
  padding: 14px 16px 12px;
  border: 0.5px solid rgba(255,255,255,.16);
  background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.03));
}
.radio-panel__signal { position: absolute; top: 14px; right: 14px; display: flex; gap: 2px; align-items: flex-end; }
.radio-panel__bar { width: 3px; background: rgba(255,255,255,.16); border-radius: 1px; }
.radio-panel__bar:nth-child(1) { height: 5px; } .radio-panel__bar:nth-child(2) { height: 8px; }
.radio-panel__bar:nth-child(3) { height: 11px; } .radio-panel__bar:nth-child(4) { height: 14px; }
.radio-panel__bar:nth-child(5) { height: 17px; }
.radio-panel__bar.is-active { background: #22d3ee; }
.radio-panel__row { display: flex; align-items: center; gap: 12px; }
.radio-panel__window { flex: 1; text-align: left; border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px; }
.radio-panel__window--sby { background: rgba(255,255,255,.03); border: 0.5px solid rgba(255,255,255,.1); }
.radio-panel__window--act { background: rgba(34,211,238,.09); border: 0.5px solid rgba(34,211,238,.35); }
.radio-panel__tag { font-size: 9.5px; letter-spacing: .16em; text-transform: uppercase; color: rgba(245,247,255,.5); }
.radio-panel__window--act .radio-panel__tag { color: #22d3ee; }
.radio-panel__num { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 22px; font-weight: 500; font-variant-numeric: tabular-nums; }
.radio-panel__window--act .radio-panel__num { color: #22d3ee; text-shadow: 0 0 18px rgba(34,211,238,.5); }
.radio-panel__station { font-size: 10.5px; color: rgba(245,247,255,.5); }
.radio-panel__swap { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.08); border: 0.5px solid rgba(255,255,255,.16); color: #22d3ee; flex: 0 0 auto; }
.radio-panel__channels { display: flex; gap: 6px; margin-top: 11px; overflow-x: auto; }
.radio-panel__chan { flex: 0 0 auto; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10.5px; color: rgba(245,247,255,.72); background: rgba(255,255,255,.04); border: 0.5px solid rgba(255,255,255,.1); border-radius: 8px; padding: 5px 9px; white-space: nowrap; }
.radio-panel__chan b { color: rgba(245,247,255,.3); font-family: -apple-system, "Segoe UI", system-ui, sans-serif; font-weight: 500; margin-right: 5px; letter-spacing: .06em; }
.radio-panel__chan.is-on { background: rgba(34,211,238,.16); border-color: rgba(34,211,238,.4); color: #22d3ee; }
</style>
```

The `channels` prop is derived in `CockpitShell.vue` (Task 24) from
`useFrequencyPresets`'s `displayAirportFrequencies`/`frequencies.active` — map each
entry to `{ role, freq, active: freq === frequencies.active }`.

**Manual verification:** tune standby via the hold-select, swap, tap a channel chip,
confirm `frequencies.value.active`/`.standby` update exactly as they did with the old
header chips (same underlying handlers from `useFrequencyPresets`).

```bash
git add app/components/live-atc/cockpit/RadioPanel.vue
git commit -m "feat(live-atc): add RadioPanel — frequency control moved from header into main content"
```

### Task 18: `ExpectedCommStrip.vue`

**Files:** Create `app/components/live-atc/cockpit/ExpectedCommStrip.vue`.
**Source:** `app/pages/live-atc.vue:574-614`, condensed per design doc (docked to PTT,
two-row compact strip instead of a full card).
**Props:** `controllerSay`, `expectedPhrase`, `showPronunciation` (v-model).

```bash
git add app/components/live-atc/cockpit/ExpectedCommStrip.vue
git commit -m "feat(live-atc): add ExpectedCommStrip, docked directly above the PTT pad"
```

### Task 19: `PttPad.vue`

**Files:** Create `app/components/live-atc/cockpit/PttPad.vue`.
**Source:** `app/pages/live-atc.vue:641-696`, visually reworked to the circular glowing
button from the mockup; interaction handlers (`startRecording`/`stopRecording` on
touch/mouse) unchanged.
**Props:** `isRecording`, `micPermission`, `bridgePttConnected`, `activeFrequency`.
**Emits:** `start`, `stop`, `request-mic`.

```bash
git add app/components/live-atc/cockpit/PttPad.vue
git commit -m "feat(live-atc): add PttPad with new circular glow treatment"
```

### Task 20: `TextInputPanel.vue`, `LastTransmissionCard.vue`, `CommLogRail.vue`

Three small components, one task since each is a near-direct move:

- `TextInputPanel.vue` ← `live-atc.vue:699-733`. Props: `pilotInput` (v-model),
  `activeFrequency`, `backendExpectedPhrase`. Emits: `send`.
- `LastTransmissionCard.vue` ← `live-atc.vue:735-827`, condensed to transcript text +
  one icon-only fault-flag button per design doc (multi-button row collapses to a
  single icon that opens the existing issue dialog). Props: `text`, `faulty`,
  `faultNote`. Emits: `flag-issue`, `clear`.
- `CommLogRail.vue` ← `live-atc.vue:838-865`, thin wrapper composing the existing
  `CommLog.vue` plus the readback-check block. Props: `log`, `readbackReport`,
  `readbackTranscript`, `dense`. Emits: `clear`.

```bash
git add app/components/live-atc/cockpit/TextInputPanel.vue app/components/live-atc/cockpit/LastTransmissionCard.vue app/components/live-atc/cockpit/CommLogRail.vue
git commit -m "feat(live-atc): add TextInputPanel, LastTransmissionCard, CommLogRail cockpit components"
```

### Task 21: `FlightInfoSheet.vue`, `SettingsSheet.vue`, `BugReportDialog.vue`, `DebugPanel.vue`

Four dialog/drawer components, one task:

- `FlightInfoSheet.vue` ← `live-atc.vue:1109-1190`. Props: `flightContext`, `flags`,
  `vars`, `logLength`. Emits: `back-to-setup`. `v-model` for open/close.
- `SettingsSheet.vue` ← `live-atc.vue:1193-1320`. Same props/v-models as today
  (`pmThemePreference`, `speechSpeed`, `radioEffectsEnabled`, `readbackEnabled`,
  `learningMode`, `debugMode`, `prerecEnabled`, `prerecSeconds`) — this is the single
  place `debugMode` is toggled, per the design doc's "one gate" requirement.
- `BugReportDialog.vue` ← `live-atc.vue:1323-` (rest of the bug-report dialog markup),
  consuming `useBugReport()` (Task 9) internally rather than taking 15 individual
  props.
- `DebugPanel.vue` ← `live-atc.vue:897-1108` (debug drawer body + FAB). Consumes
  `useDebugSimulation()` (Task 11) internally. **This component must only be
  instantiated by its parent when `debugMode` is true** — verified in Task 24 by
  checking the parent template uses `<DebugPanel v-if="debugMode" />`, not
  `v-if="debugMode"` on internal content while the component itself always mounts.

```bash
git add app/components/live-atc/cockpit/FlightInfoSheet.vue app/components/live-atc/cockpit/SettingsSheet.vue app/components/live-atc/cockpit/BugReportDialog.vue app/components/live-atc/cockpit/DebugPanel.vue
git commit -m "feat(live-atc): extract FlightInfoSheet, SettingsSheet, BugReportDialog, DebugPanel"
```

### Task 22: `CockpitShell.vue`

**Files:** Create `app/components/live-atc/cockpit/CockpitShell.vue`.

The leaner HUD header (logo/mode-switch/flight-context on the left, prominent amber
**Report issue** button + Settings + Help + Logout on the right — frequency chips
removed, per design doc) plus the body layout (`RadioPanel` → `ExpectedCommStrip` →
`PttPad`/`TextInputPanel` → `LastTransmissionCard` in the main column, `CommLogRail`
in the rail, bottom nav for mobile). Composes every component from Tasks 17-21.

```vue
<script setup lang="ts">
// props/emits bridge everything CockpitShell's children need from the
// composables instantiated in live-atc.vue — see Task 25 for the wiring.
</script>

<template>
  <section class="pm-shell learn-theme">
    <header class="hud" role="banner">
      <!-- left: logo, mode-switch, flight-context — unchanged from current header -->
      <!-- right: -->
      <div class="hud-right">
        <button type="button" class="hud-report-btn" title="Report issue" @click="$emit('open-bug-report')">
          <v-icon size="16">mdi-bug-outline</v-icon>
          <span>Report issue</span>
        </button>
        <button type="button" class="icon-btn" title="Settings" @click="$emit('open-settings')">
          <v-icon size="18">mdi-cog</v-icon>
        </button>
        <button type="button" class="icon-btn" title="Help" @click="$emit('open-help')">
          <v-icon size="18">mdi-help-circle-outline</v-icon>
        </button>
        <div class="hud-divider" aria-hidden="true" />
        <NuxtLink class="icon-btn" to="/logout" title="Logout">
          <v-icon size="18">mdi-logout</v-icon>
        </NuxtLink>
      </div>
    </header>
    <!-- body: RadioPanel, ExpectedCommStrip, PttPad/TextInputPanel, LastTransmissionCard, CommLogRail, bottom nav -->
    <!-- DebugPanel only rendered here, gated: <DebugPanel v-if="debugMode" ... /> -->
  </section>
</template>

<style scoped>
.hud-report-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 500; color: #2b1c02;
  background: linear-gradient(180deg, #fcd34d, #fbbf24);
  border-radius: 10px; padding: 6px 12px; border: 0.5px solid rgba(0,0,0,.05);
}
</style>
```

**Manual verification (critical — this is the biggest single visual change):** run the
demo flight end to end in the browser preview at desktop width and at the mobile
preset, confirming: HUD no longer shows frequency chips, Radio Panel shows/updates
correct values, PTT still records and transmits, expected-comm renders directly above
PTT when `learningMode` is on, "Report issue" is visibly the most prominent header
button, Settings sheet still has all existing controls plus the debug toggle, and with
`debugMode` off, no debug FAB/drawer exists anywhere in the DOM
(`document.querySelector('.debug-fab')` returns `null` in the browser console).

```bash
git add app/components/live-atc/cockpit/CockpitShell.vue
git commit -m "feat(live-atc): add CockpitShell — new leaner HUD, radio panel in main content, gated debug panel"
```

---

## Milestone 5 — Orchestrator

### Task 23: Thin `live-atc.vue` down

**Files:** Modify `app/pages/live-atc.vue` (heavily), no new files.

Replace the four setup `<section>` blocks with the Milestone 3 components, replace the
entire `<section v-else class="pm-shell learn-theme">` block with `<CockpitShell>`,
instantiate every composable from Milestones 0/2, and pass their returned state/
functions down as props/listeners. Remove every `<script setup>` declaration that was
moved to a composable or component in the preceding tasks — the page should be left
with: composable instantiation calls, `currentScreen` and the few other page-level
refs identified in Task 12's grep check, and template wiring.

**Verification:**
1. `yarn nuxt typecheck` — zero errors.
2. `yarn test` — full suite still green (Milestone 0's new tests plus everything
   pre-existing).
3. Full manual browser pass, both viewport sizes: VATSIM CID entry → flight-plan
   select → scenario picker → cockpit (voice + text transmission, frequency swap,
   ATIS playback, bug report submission, settings sheet incl. debug toggle) →
   completion screen → fly again.

```bash
git add app/pages/live-atc.vue
git commit -m "refactor(live-atc): thin page down to orchestrator over composables/step-components/CockpitShell"
```

---

## Milestone 6 — Final verification

### Task 24: Full regression pass

Not a code task — a checklist to run and confirm before calling this done, per
CLAUDE.md's "test the golden path and edge cases, monitor for regressions" rule and
the repo's `verify` skill:

1. `yarn test` — full suite green.
2. `yarn nuxt typecheck` — zero errors.
3. Browser: demo flight, full "Fly full" chain scenario, at least one standalone drill.
4. Browser: manual frequency entry, ATIS loop start/stop on tune-away, radio-check
   auto-answer, "say again" phrase handling.
5. Browser: bug-report screenshot capture + arrow annotation + submit.
6. Browser: toggle debug mode off → confirm no debug affordance anywhere; toggle it
   back on → confirm simulation trace still runs.
7. Browser: mobile viewport (375px) — bottom nav, stacked Radio Panel, PTT pad
   reachable thumb-zone.
8. Browser: light/dark toggle on the setup screens (should still work, per design doc
   the cockpit itself stays single-theme).

No commit for this task — if anything fails, fix it as a follow-up commit and re-run
the checklist.
