# Codex work order — /live-atc repeat/loop bugs + WebSim rendering & bridge robustness

Two independent work packages. Do them in order (WP1 first), commit separately per fix.
All findings below were verified against the running app on 2026-07-16 unless marked "suspected".

## Repo context (read first)

- Nuxt 4 app. Dev server: `yarn dev` (NOT bun). Tests: `yarn test` (tsx --test).
- `/live-atc` needs the Python backend running on `http://127.0.0.1:8000`
  (separate repo `OpenSquawk-LiveATC-api`). The Python backend owns the
  authoritative session state; the local engine
  (`shared/utils/communicationsEngine.ts`) only mirrors it for cursor/TTS.
  **Never make the local engine advance states on its own — that's WP1 Fix 1.**
- Browser testing of auth-gated pages: open `/dev-login?redirect=<path>`.
- WebSim page: `/flightlab/websim`. It feeds the same `/api/bridge/*` endpoints a
  real MSFS bridge would; `/live-atc?token=<localStorage osq_websim_bridge_token>`
  consumes them.
- **Already fixed, do not redo:** `.env` `MONGODB_URI` was pointing at stale Atlas
  shard hostnames (`opensquawk-shard-00-*` no longer resolve in DNS); it now uses
  the `mongodb+srv://` URI. That was the reason every `/api/bridge/*` endpoint
  returned 500 and WebSim showed "Bridge verbindet…" forever. With the fix the
  bridge connects (verified end-to-end: WebSim → `/api/bridge/data` → `/live-atc`
  shows "Bridge" badge).

---

# WP1 — /live-atc: ATC repeats confirmations 2–3×, loops, sometimes appears hung

Five independent causes. Fix all five; each has its own acceptance check.

## Fix 1 — kill the local engine's autonomous auto-advance (root cause of loops/desync)

**Problem.** The local engine still contains the pre-backend autonomous walker:

- `shared/utils/communicationsEngine.ts` → `evaluateSimpleAutoFlow()` (~line 1164):
  if the current state has exactly ONE eligible transition it schedules
  `setTimeout(() => moveTo(target), 1000–2000ms)` and recurses. Pilot states with
  only `ok_next` qualify — the engine then "answers itself" without any pilot
  input, appends ATC lines to the communication log, and walks the local cursor
  away from the backend's state (frequency checks then use the wrong state →
  wrong-frequency rejections → session feels stuck).
- This walker is kicked from three places even in backend-driven mode:
  1. `setActiveFlow()` (~line 452): `queueMicrotask(() => evaluateAutoTransitions())`
     — runs on **every backend flow chain** (`applyBackendDecision` calls
     `setActiveFlow(response.active_flow)`).
  2. `moveTo()` (~line 1298): same microtask at the end.
  3. `collectAtcStatesUntilPilotTurn()` (~line 1072) uses `moveTo()` for the
     initial state walk in `startMonitoring()` — every hop schedules the walker.

**Change.**
1. In `collectAtcStatesUntilPilotTurn()`, replace the `moveTo(nextId)` call with
   `moveToSilent(nextId)` (same side effects — actions, handoffs, log — but no
   auto-transition scheduling).
2. Gate the walker off by default: add a module-level flag in the engine, e.g.
   `let autonomousAutoAdvance = false` plus an exported setter, and make
   `evaluateAutoTransitions()` and `evaluateSimpleAutoFlow()` return immediately
   unless it is true. Do NOT delete the functions (the flow editor/debug tooling
   may reuse them later); just neutralize them for `/live-atc`, which never opts in.
3. Grep for other `moveTo(` callers before changing semantics:
   `DebugPanel`/`useDebugSimulation` use `forceMove` (= `moveTo`) — that stays,
   but with the flag off a debug move no longer cascades, which is the desired
   behavior.

**Acceptance.** Start any scenario, send NOTHING for 3+ minutes: the
communication log must not grow and the current state must not change (except
via backend timeout — see Fix 3). Previously `pendingSimpleAutoTransition`
timers would fire within 1–2 s of session start.

## Fix 2 — dedupe the ATC reply (log + TTS) in `applyBackendDecision`

**Problem A (duplicate log lines).**
`app/composables/useLiveAtcSession.ts` → `applyBackendDecision()` (~line 152):
each `moveToSilent(stateId)` logs that state's `say_tpl` via the engine's
`speak()` (`communicationsEngine.ts` ~line 1335), and afterwards
`applyBackendDecision` ALSO calls `appendLogEntry('atc', sayText, …)` with the
backend-rendered say. When the say-carrying ATC state is among
`auto_advanced_states` (typical for tower/departure chains), the identical ATC
line appears 2× in the log — 3× when the state is walked and also the
`next_state_id`.

**Change A.** Add an options parameter to `moveToSilent(stateId, opts?: { suppressSay?: boolean })`
that skips the internal `speak()` call, and pass `suppressSay: true` from
`applyBackendDecision` (both the auto_advanced loop and the final
`moveToSilent(response.next_state_id)`). `applyBackendDecision`'s own
`appendLogEntry` remains the single writer of the ATC line.
⚠️ Verify with a full `tower-v1` / chained run that no ATC text disappears from
the log: if the backend auto-advances through MULTIPLE say-carrying ATC states
but returns only one `controller_say_rendered`, keep the engine-side logging
instead and dedupe the other way round (skip the `appendLogEntry` when the last
log entry is 'atc' with identical `normalized` text less than 3 s old).

**Problem B (duplicate TTS).** `applyBackendDecision` is reachable from four
sources — transmit reply, telemetry tick (`useSimBridgeSync.forwardTelemetryToBackend`),
silence timeout, bug-report restore. Two sources can deliver the same
controller say back-to-back (e.g. timeout fires while a transmit is in flight;
telemetry tick re-fires). Each call runs `scheduleControllerSpeech(sayText)` →
the user hears the same confirmation 2–3×.

**Change B.** In `applyBackendDecision`, keep a `lastAppliedSay = { text, stateId, atMs }`
(module scope inside the composable). Before speaking:
skip `scheduleControllerSpeech` + `appendLogEntry` when
`sayText === lastAppliedSay.text && response.next_state_id === lastAppliedSay.stateId
&& Date.now() - lastAppliedSay.atMs < 15_000`. Update `lastAppliedSay` whenever a
say is actually spoken. (The deliberate re-speak paths — "say again", radio
check — do not go through `applyBackendDecision`, so they are unaffected.)

**Acceptance.** Text-mode run of IFR Departure full chain: every ATC line
appears exactly once in the log; artificially double-calling
`applyBackendDecision` with the same response object (add a temporary test or
unit test) speaks only once. Add a `tsx --test` unit for the dedupe predicate.

## Fix 3 — cap the silence-timeout re-fire loop

**Problem.** `armSilenceTimer()` (`useLiveAtcSession.ts` ~line 117) is re-armed
at the end of EVERY `applyBackendDecision` (~line 225). If the backend's
`/timeout` response re-prompts and returns `next_state_id === <same state>`
(the state still has `auto_advance_on_silence`), the timer re-arms and fires
again, forever: same ATC prompt every `auto_advance_timeout_ms` — the reported
"confirms things over and over".

**Change.** Track consecutive timeout firings per state:
`let silenceFireCount = { stateId: string | null, count: number }`. In the timer's
`fire()` increment when firing for the same `stateId`; in `armSilenceTimer()`
refuse to arm when `count >= 2` for the current state. Reset the counter in
`handlePilotTransmission()` (any pilot input) and whenever
`applyBackendDecision` lands on a different `next_state_id`.

**Acceptance.** On a state with `auto_advance_on_silence` that the backend
answers with the same state, the prompt is spoken at most twice, then silence
until the pilot transmits.

## Fix 4 — don't race telemetry decisions against an in-flight transmission

**Problem.** `app/composables/useSimBridgeSync.ts` → `forwardTelemetryToBackend()`
posts telemetry on every 3 s poll whose signature changed, even while a pilot
transmission is awaiting its reply. The transmit path has a generation guard
against older *transmissions*, but a telemetry-fired decision interleaving with
a transmit reply applies two decisions in quick succession (double says,
conflicting cursor moves). Also, slow backend + 3 s poll can pile up several
concurrent telemetry POSTs.

**Change.** In `useSimBridgeSync`:
1. Extend `SimBridgeSyncDeps` with `transmitInFlight: Ref<boolean>` (the page
   already has it from `useLiveAtcSession`; note the construction order — the
   bridge sync is built BEFORE the session composable, so pass a lazy getter
   closure `() => session.transmitInFlight.value` the same way
   `applyBackendDecision` is already passed as a thin closure from
   `app/pages/live-atc.vue` ~line 473).
2. Skip `forwardTelemetryToBackend` while `transmitInFlight` is true (don't
   update `lastSentTelemetrySig` in that case, so the tick isn't lost — the next
   poll retries).
3. Add a `telemetryPostInFlight` boolean; skip a new POST while one is pending.

**Acceptance.** With WebSim feeding telemetry and rapid text transmissions, no
interleaved double-says; network tab shows never more than one concurrent
`/telemetry` POST.

## Fix 5 — the speech/transmit pipeline must not hang ("hängt sich auf")

**Problem.** Two unbounded awaits:
1. `app/composables/useRadioSpeech.ts` → `fetchSpeechAudio()` posts
   `/api/atc/say` with no timeout. `useSpeechInterrupt.enqueueSpeech` chains all
   playback on one promise queue — a single hung TTS request silently blocks
   every subsequent ATC reply. To the user the session "hangs" (frequency dead).
2. `app/composables/useRadioBackend.ts` → `transmit()`/`sendTelemetry()`/
   `timeout()` have no timeout. A hung Python-backend call leaves
   `transmitInFlightCount` elevated forever (its `finally` never runs), which
   also keeps the AI-traffic gate shut.

**Change.**
1. In `fetchSpeechAudio`, race the existing AbortController with
   `setTimeout(() => abort.abort(), 20_000)` (clear the watchdog in `finally`).
   On abort, return null (the queue task already tolerates a null response).
2. In `useRadioBackend`, pass `signal: AbortSignal.timeout(30_000)` to
   `$fetch` for `transmit`, `sendTelemetry`, `timeout` (keep `createSession`
   generous: 60 s — taxi-route computation is slow). In
   `handlePilotTransmission`'s catch, surface a timeout distinctly:
   `setLastTransmission(\`${prefix}: ${transcript} (backend timeout)\`)`.

**Acceptance.** Simulate a hung `/api/atc/say` (e.g. temporarily add a dev-only
delay) → after 20 s the queue moves on and later replies still play. Kill the
Python backend mid-transmit → UI shows the timeout note within 30 s and further
transmissions are possible after backend restart (existing 404 handling resets
the session).

---

# WP2 — WebSim: rendering + bridge robustness

The bridge protocol itself works now (see "Already fixed" above). Remaining
issues, all verified in the browser at 1280×720 on `/flightlab/websim`
(preset "EDDF – 10 NM Final"):

## Fix 1 — telemetry + physics must survive background-tab throttling (this is the "not connected to the bridge" symptom that remains)

**Problem (observed).** The intended use is WebSim in one tab, `/live-atc` in a
second tab — so the WebSim tab is almost always backgrounded. Two throttling
victims:
1. `shared/composables/flightlab/useWebSimFlightModel.ts` drives physics with
   `requestAnimationFrame` (lines ~58–80) — rAF stops completely in background
   tabs, so the aircraft freezes.
2. `app/composables/useWebSimBridgeClient.ts` posts telemetry with
   `setInterval(postTelemetry, 2000)` — Chrome throttles background-tab timers
   (down to 1/min after ~5 min). The server's staleness window is 12 s
   (`useSimBridgeSync.BRIDGE_TELEMETRY_STALE_MS`), so `/live-atc` drops the
   "Bridge" badge after a few minutes (observed live: badge fell back to
   "Connect simulator" while the WebSim tab was backgrounded).

**Change.** Move BOTH tick sources to a Web Worker, which is not visibility-throttled:
- Create a tiny worker (inline `Blob` worker or `app/workers/websimTick.ts`)
  that `setInterval`-posts `{ type: 'tick' }` every 100 ms and
  `{ type: 'telemetry' }` every 2000 ms.
- `useWebSimFlightModel`: keep the physics on the main thread; replace the rAF
  loop with worker-tick-driven stepping using real elapsed time
  (`performance.now()` delta, clamp dt to ≤ 0.25 s to survive stalls). Keep an
  rAF loop ONLY as an optional smoother when the document is visible if you
  want, but the worker tick must be the authority.
- `useWebSimBridgeClient`: trigger `postTelemetry`/`postStatus` from the worker
  messages instead of `setInterval`. Terminate the worker in `stopBridgeClient()`.

**Acceptance.** Start WebSim, open `/live-atc?token=…` in another tab, keep the
WebSim tab backgrounded ≥ 6 min: the Bridge badge stays on and telemetry keeps
changing (aircraft keeps moving — check the ND trail after re-focusing).

## Fix 2 — bridge status UI must surface errors instead of "verbindet…" forever

**Problem.** `useWebSimBridgeClient` swallows every fetch error; the header
badge (`app/pages/flightlab/websim.vue` ~line 67) knows only
connected/not-connected, so any server error reads as eternal "Bridge verbindet…".

**Change.** In `useWebSimBridgeClient` track
`lastError = ref<string | null>(null)` and `failureStreak = ref(0)`:
set them in the catch of `postTelemetry` (HTTP status if available), clear on
success. Export them; in the header show three states:
- connecting (no success yet, no failures): "Bridge verbindet…"
- error (`failureStreak >= 2`): red dot, "Bridge Fehler (HTTP xxx)" with
  `:title` tooltip
- connected: green as today.

**Acceptance.** Stop MongoDB (or point `MONGODB_URI` at a bogus host) → badge
turns red with a status code within ~6 s instead of staying "verbindet…".

## Fix 3 — PFD is clipped (right side cut off)

**Problem (observed at 1280×720).** `FlightlabPfdContainer`
(`app/components/flightlab/pfd/PfdContainer.vue`) renders a fixed 631×550 px
canvas scaled by a `scale` prop; `websim.vue` hard-codes `:scale="0.85"`
(≈ 536 px wide) inside the middle grid column (`1.3fr` of a 3-column grid ≈
490 px at 1280 px viewport) with `overflow-hidden` — the vertical-speed tape and
the altitude readout box are visibly cut off / overlap the panel edge.

**Change.** In `websim.vue`, measure the PFD cell (`useElementSize` from
VueUse if available, else a small ResizeObserver composable) and compute
`pfdScale = Math.min(width / 631, height / 550)` clamped to `[0.5, 1.15]`; pass
that instead of the fixed 0.85. Remove nothing in `PfdContainer` itself.

**Acceptance.** At 1280×720 and at a ~1512×950 window, the speed tape, attitude
ball, altitude tape incl. readout box, VS tape and heading strip are all fully
inside the black panel with no clipping.

## Fix 4 — cockpit layout polish (bottom row)

**Problem (observed).** The bottom strip's three cells are visually
inconsistent: `WebsimSidestickPad` floats unboxed (tiny label + 12rem pad on
bare page background), while FCU and RADIO/SYSTEME have real panels with
different heights; the whole page uses `h-screen overflow-hidden`, so on short
windows the bottom row can get cut.

**Change.**
1. Give all three bottom components the same panel shell as FCU/Radio —
   `rounded-2xl border border-white/5 bg-[#0b1328] p-3` (or extract a
   `WebsimPanel.vue` wrapper with a `label` prop rendering the
   `text-[10px] uppercase tracking-widest text-white/40` header) — and use it
   for SIDESTICK, FCU and RADIO/SYSTEME so the row reads as one unit.
2. Make the row equal-height: parent `grid grid-cols-3 gap-2 items-stretch`,
   panels `h-full flex flex-col`; center the stick pad within its panel.
3. Main grid: change `grid-template-rows: 1fr auto` to
   `grid-template-rows: minmax(0, 1fr) auto` and give the three top cells
   `min-h-0` so the top row shrinks instead of pushing the bottom row out.

**Acceptance.** Screenshot at 1280×720: three aligned equal-height panels, no
element outside a panel, nothing cut off at the bottom.

## Fix 5 — ExteriorView is too crude ("hässlich")

**Problem (observed).** `app/components/websim/ExteriorView.vue` shows a hard
blue/green split; the horizon never reacts to altitude (camera fixed at y=0,
ground at y=-1.7), the runway only appears < 3 NM (`websim.vue` ~line 38:
`distanceToRunwayNm.value < 3`) and sits at a fixed z=-1500 rather than at the
real threshold direction/distance.

**Change (keep it abstract per the design doc — no scenery):**
1. Altitude: each frame set `camera.position.y = Math.max(2, (model altitude_ft
   − field elevation) × 0.3048)` (pass an `altitudeFt` + `fieldElevationFt` prop
   from `websim.vue`); ground plane stays at y=0. Climbing then visibly raises
   the viewpoint; final approach shows the ground coming up.
2. Runway: raise the visibility gate to `< 12` NM in `websim.vue`, and position
   the mesh from the actual geometry: pass `distanceToRunwayNm` as a prop and set
   `runwayMesh.position.z = -distanceNm * 1852` (with `far` plane raised
   accordingly), `position.x` from `runwayOffsetDeg` as today but with the real
   distance. Add simple white centerline stripes (a few thin plane meshes) and a
   threshold bar so the aiming point is readable on final.
3. Sky/ground depth: add `scene.fog = new THREE.Fog('#5b9bd5', 2000, 18000)` and
   a subtle two-tone sky (large BackSide sphere with a vertical gradient texture
   generated on a canvas — no external assets).
4. Verify rotation correctness: with both pitch and bank non-zero the horizon
   must stay visually consistent — set an explicit `camera.rotation.order`
   (e.g. `'ZXY'`) and check 20° bank + 10° pitch against the PFD attitude ball.

**Acceptance.** EDDF 10 NM Final preset: runway strip with centerline visible
ahead from spawn, grows on approach, horizon sits below center consistent with
~3000 ft; EDDS 30 NM STAR preset at altitude shows ground far below and haze.

## Regression checks after WP2

1. `yarn dev`, `/dev-login?redirect=/flightlab/websim`, pick each of the 4 spawn
   presets once — no console errors.
2. `/live-atc?token=<osq_websim_bridge_token from localStorage>` in a second
   tab: Bridge badge on and staying on with WebSim backgrounded (Fix 1).
3. From /live-atc, text-transmit "DLH39A, change my altitude to 8000" style
   sim-control command (bridge connected) → WebSim FCU ALT target updates and
   the command result is announced once (WP1 Fix 2 dedupe must not swallow it —
   sim-control results flow through `handleSimControlResult`, not
   `applyBackendDecision`, so they are unaffected).
4. `yarn test` green.
