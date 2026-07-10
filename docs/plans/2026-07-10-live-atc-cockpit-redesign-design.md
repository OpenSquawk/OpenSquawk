# Live ATC Cockpit Redesign — Design

## Goal

`/live-atc` (`app/pages/live-atc.vue`) is a 6573-line single-file component — the
former `/pm` page, moved and renamed in `f7411c3` ("atc header") without any real
design pass. It bundles flight-source selection, flight-plan picking, scenario/drill
picking, and the full in-flight "cockpit" UI (frequencies, PTT, transcript, ATIS,
readback checking, bug reporting, debug tooling) into one file with a generic
`bg-white/5` glassmorphism look that predates the navy/radar/glow visual language
already established on `/start.vue` and `classroom.vue`.

This redesign addresses three problems identified by the user:
1. **Visual overload** — the monitor screen stacks too many equally-weighted cards
   with no hierarchy.
2. **Fragmented interaction** — frequency control, settings, flight info, debug, and
   bug reporting are all separate dialogs/menus, which feels like too many steps for
   things used constantly.
3. **Code maintainability** — one 6573-line file mixing routing, business logic
   (audio recording/encoding, ATIS scheduling, canvas-based bug annotation, TTS
   scheduling), and UI for radically different screens.

Not a request to change the Python backend contract (`useRadioBackend.ts`), the local
state machine (`shared/utils/communicationsEngine.ts`), or decision-flow/scenario
definitions. Pure UI/structure of the Nuxt page.

## Explicitly out of scope

- `useRadioBackend.ts` request/response shapes.
- `communicationsEngine.ts` state-machine logic (cursor tracking, template
  rendering, transition handling).
- Scenario/drill/chain data (`SCENARIOS`, `CHAIN_DEFS`) and their picker logic — only
  the visual skin of the picker screen changes, not its structure.
- Routing: flight-source → flight-select → scenario → monitor → complete stays a
  single page (`/live-atc`) with internal screens, not split across routes. (The
  app-level `/login` and `/start` pages are unrelated — the in-page "login" screen is
  VATSIM CID / demo-flight entry, not app auth.)

## Visual language

Adopt the tokens already defined in `app/assets/css/global.css` and used on
`/start.vue` / `classroom.vue`, instead of ad hoc Tailwind opacity classes:

- Base: `--bg: #0b1020` / `--bg2: #0a0f1c`, cyan accent `--accent: #22d3ee`, blue
  `--accent2: #0ea5e9`.
- Radar-ring motif + soft cyan/amber radial glows + faint grid overlay, as already
  implemented in `.start-bg__*` classes in `start.vue` — reuse or extract to a shared
  partial/component (e.g. `components/RadarBackdrop.vue`) rather than duplicating the
  keyframes/gradients a third time.
- Amber (`#fbbf24`, matching the existing `--start-bg__glow--amber` hue) becomes the
  accent color for the bug-report affordance specifically — it's the one place a
  second accent color is intentional, everywhere else stays cyan/blue.
- `font-mono` (already used ad hoc for frequencies/squawk/callsign throughout the
  current file) becomes a deliberate convention: every instrument readout (ACT/STBY
  frequency, squawk, callsign, transcript text, log entries) renders in monospace;
  labels/chrome stay in the sans system font. This mirrors real avionics displays and
  is already the direction the current code leans, just inconsistently.
- The cockpit screen is a deliberate single dark "instrument panel" visual world —
  it does not need to invert for light mode the way the setup screens (which reuse
  `[data-theme="light"]` overrides) do. This matches current behavior: `pmTheme`
  light/dark/system already only meaningfully applies to the non-monitor screens
  today, since the monitor HUD's `.hud`/`.pm-*` classes are hand-tuned dark-first in
  `opensquawk-glass.css`.

A full mockup of the target cockpit layout was reviewed and approved with the user
(desktop + mobile) — see reference screenshot/artifact from the design conversation.
Key structural decisions from that mockup are recorded in "Cockpit screen" below.

## Setup screens (flight-source, flight-select, scenario picker, complete)

No structural change. Re-skin only:
- Replace `v-card class="bg-white/5 border border-white/10"` blocks with the
  navy/radar/glow treatment.
- Keep the existing "phase chain" scenario picker pattern (`chainGroups`, segment
  buttons + "Fly full") — it already models the domain well (a scenario chain is a
  real sequence of phases), just needs the new card/background treatment.
- Keep VATSIM CID entry + demo-flight mode as-is functionally.

## Cockpit screen ("monitor")

### HUD header (leaner)

Keeps: logo + mode-switch dropdown (Classroom/Live ATC), flight-context button +
status popover (unchanged behavior).

Removes from the header: the ACT/STBY frequency chips and swap button (→ moved into
the main content as the Radio Panel, see below).

Right-side cluster, in order:
1. **Report issue** — filled amber pill button with icon + label, not a ghost
   icon-only button. This is the most-reached-for secondary tool per the user, so it
   gets the same visual weight as a primary action.
2. **Settings** (gear) — opens the existing settings sheet; the sheet gains the
   single **Debug** toggle as the master switch for all developer tooling (see
   below).
3. **Help** (unchanged behavior).
4. Divider + **Logout** (unchanged).

### Radio Panel (new, first-class main-content module)

Replaces the header's `HoldSelect`-based freq chips with a dedicated card at the top
of the main column, styled like a physical radio stack:

- Two frequency windows side by side: **STANDBY** (dim) and **ACTIVE** (bright, glow
  text-shadow), each showing the tuned frequency in large `font-mono` digits and the
  resolved station name/role underneath.
- A circular **swap** button between the two windows (existing `swapFrequencies()`
  logic, unchanged).
- Below the windows, a horizontal scrollable **channel row**: one chip per published
  frequency role (ATIS/DEL/GND/TWR/APP/…) sourced from the existing
  `frequencyPresets`/`displayAirportFrequencies` computed values. Tapping a chip loads
  it into standby (existing `onPresetSelectStandby` behavior); the active role is
  visually highlighted (`.chan.on`).
- The existing readability signal-bar control moves into this panel (top-right
  corner) rather than living in the header center — it's part of "the radio," not a
  separate global control.
- `HoldSelect` remains the underlying interaction primitive for manual-frequency entry
  (long-press/hold on a window) — component is reused, not replaced.

This directly answers the "frequency handling is fiddly" complaint: the control
occupies real estate proportional to how often it's used, instead of living in a
compact header dropdown.

### Expected Communication (docked to PTT)

Currently a large standalone card competing for scroll position above the PTT pad.
Redesign: compact two-row strip (ATC line / pilot line, existing
`displayControllerSay` / `displayExpectedPhrase` values) rendered as part of the same
visual block as the PTT pad, directly above it — reinforcing that it's guidance for
the next transmission, not general reading material. Existing `learningMode` toggle
still controls whether this renders at all. The pronunciation/plain-text toggle
(`showRadioPronunciation`) stays.

### PTT pad

Unchanged interaction/behavior (hold to transmit, PTT_MAX_DURATION_MS, mic-permission
gating, bridge-hotkey indicator). Visually: circular glowing button instead of the
current large rectangular pad, freq readout underneath, to read clearly as *the*
primary control of the screen rather than one card among several.

### Last transmission

Stays, but condensed: the transcript text plus a single icon-only "flag as
faulty"/edit affordance instead of the current multi-button row (Mark as
faulty/Edit issue/Reset/Delete all as separate text buttons). Existing
`startTransmissionIssueFlow`/`confirmTransmissionIssue` dialog flow is unchanged —
just the entry point shrinks.

### Comm log

Desktop: unchanged pattern (log rail alongside main column, reusing `CommLog.vue` and
the readback-check block above it). Mobile: unchanged (Log tab in bottom nav, same
`CommLog.vue`).

### Debug tooling — single gate

Today `debugMode` already gates the debug FAB, but simulation-trace/LLM-decision-trace
state (`decisionTrace`, `timelineSteps`, etc.) is computed unconditionally and the FAB
exists in the DOM regardless. Change: the FAB, the drawer, and all decision-trace
normalization/computation only mount/run when `debugMode` is true — flipping the
Settings toggle off removes all of it, not just its trigger. `debugMode` moves fully
into the Settings sheet as the only place it's controlled (no separate debug entry
points).

### Bottom nav (mobile)

Unchanged (Funk/Log tabs), matches the existing `visibleTabs`/`TABS` pattern.

## Component/composable breakdown

No behavior change — pure extraction from the current single file, to make each piece
independently readable/testable.

**`live-atc.vue`** — thin orchestrator: owns `currentScreen`, `selectedPlan`,
`activeScenario`, `backendSessionId`, and wires the setup-step and cockpit components
together. Delegates everything else.

**Setup-step components** (`components/live-atc/`):
- `FlightSourceStep.vue` — VATSIM CID entry + demo mode.
- `FlightSelectStep.vue` — flight-plan list.
- `ScenarioPickerStep.vue` — chain groups + drills.
- `SessionCompleteStep.vue` — completion screen.

**Cockpit components** (`components/live-atc/cockpit/`):
- `CockpitShell.vue` — HUD header + body layout (main column + log rail + bottom nav
  slot).
- `RadioPanel.vue` — ACT/STBY windows, swap, channel row, readability control.
- `ExpectedCommStrip.vue` — ATC/pilot hint block.
- `PttPad.vue` — voice input pad (wraps recording start/stop calls).
- `TextInputPanel.vue` — text-mode transmission input.
- `LastTransmissionCard.vue` — transcript + fault-flag affordance.
- `CommLogRail.vue` — thin wrapper composing existing `CommLog.vue` + readback-check
  block.
- `FlightInfoSheet.vue`, `SettingsSheet.vue`, `BugReportDialog.vue`, `DebugPanel.vue`
  — extracted dialogs; `DebugPanel.vue` only renders when instantiated (i.e. only
  when `debugMode` is true, per parent `v-if`).

**Composables** (`app/composables/`):
- `useAtisPlayback.ts` — ATIS fetch/loop/audio-request logic (current
  `startAtisLoop`/`ensureAtisAudioLoop`/`requestAtisAudio`/etc.).
- `usePttRecording.ts` — mic access, MediaRecorder, pre-recording rolling buffer, WAV
  encoding (`startRecording`/`stopRecording`/`snapshotPrerecPCM`/`encodeWav`/etc.).
- `useFrequencyPresets.ts` — frequency fetch/apply/manual-entry/swap logic
  (`fetchAirportFrequencies`/`applyFrequencyVariablesFromList`/`swapFrequencies`/etc.).
- `useBugReport.ts` — screenshot capture, canvas arrow annotation, submit
  (`openBugReport`/`setupAnnotationCanvas`/`submitBugReport`/etc.).
- `useRadioSpeech.ts` — TTS scheduling, radio effects, Pizzicato integration
  (`speakPrepared`/`playAudioWithEffects`/`scheduleControllerSpeech`/etc.).
- `useLiveAtcSession.ts` — the actual session controller: wraps
  `communicationsEngine` + `useRadioBackend` calls (`startMonitoring`,
  `handlePilotTransmission`, `applyBackendDecision`) that currently live inline in the
  page. This is the piece most worth isolating — it's the bridge to the Python
  backend and deserves to be testable without mounting the whole page.

Each composable/component keeps its existing internal logic verbatim where possible;
this is a structural extraction, not a rewrite of business logic.

## Out of scope for this pass

- Any backend/API contract change.
- Redesigning the scenario/drill data model.
- Light-mode support for the cockpit screen (deliberately single dark theme, see
  "Visual language").
- Editing/removing existing features (ATIS playback, readback check, radio-check
  auto-answer, radio effects) — all preserved, only relocated/re-skinned.
