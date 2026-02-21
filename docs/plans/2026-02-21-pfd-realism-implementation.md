# PFD Realism & Training Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the PFD visually match the real Airbus A320, add realistic flight inertia, and improve training exercises with normal-range targets and a multi-phase speed lesson.

**Architecture:** Pure frontend changes across 3 layers: SVG styling in Vue SFC components, physics constants + smoothing in the FBW composable, and phase data in the learn-pfd scenario definition + engine.

**Tech Stack:** Vue 3 SFC (SVG), TypeScript composables, Node test runner (tsx)

---

### Task 1: Darken Speed Tape colors

**Files:**
- Modify: `app/components/flightlab/pfd/PfdSpeedTape.vue`

**Step 1: Update background colors**

Change outer rect fill from `#8f9198` to `#16181f`.
Change inner rect fill from `#93959c` to `#1c1e26`, stroke from `#d2d4da` to `#3a3d48`.

**Step 2: Update readout colors to green**

Change readout box stroke from `#2fe5ff` to `#19e34a`.
Change readout text fill from `#2fe5ff` to `#19e34a`.
Change speed trend arrow stroke from `#30e3ff` to `#19e34a`.

**Step 3: Change target zone to cyan (not red)**

The target hold zone must NOT be red — red means danger on a real PFD. Change to cyan/turquoise:
- Target zone fill: `rgba(239, 68, 68, 0.22)` → `rgba(45, 212, 255, 0.18)`
- Target zone stroke: `rgba(248, 113, 113, 0.95)` → `rgba(45, 229, 255, 0.8)`
- Top/bottom lines: `rgba(254, 202, 202, 0.95)` → `rgba(45, 229, 255, 0.5)`

**Step 4: Add VFE (overspeed) and minimum speed red bands**

Add two new props: `vfeSpeed` (default 340) and `minSpeed` (default 130).

Add red bands above VFE and below minSpeed, rendered inside the clipped tape group (before the scrolling marks):

```html
<!-- Overspeed band (red, above VFE) -->
<rect
  x="1"
  :y="0"
  :width="width - 2"
  :height="Math.max(0, speedToY(vfeSpeed))"
  fill="rgba(239, 40, 40, 0.45)"
/>
<line
  x1="1" :y1="speedToY(vfeSpeed)"
  :x2="width - 1" :y2="speedToY(vfeSpeed)"
  stroke="#ef4444" stroke-width="1.5"
/>
<!-- Min speed band (red, below min) -->
<rect
  x="1"
  :y="speedToY(minSpeed)"
  :width="width - 2"
  :height="height - speedToY(minSpeed)"
  fill="rgba(239, 40, 40, 0.45)"
/>
<line
  x1="1" :y1="speedToY(minSpeed)"
  :x2="width - 1" :y2="speedToY(minSpeed)"
  stroke="#ef4444" stroke-width="1.5"
/>
```

The red bands only appear when they scroll into the visible tape area. At 220 kts neither will be visible, which is correct — they only show when approaching dangerous speeds.

**Step 4: Verify visually**

Run: `bun run dev`
Navigate to `/flightlab/medienstationen/learn-pfd`, advance to speed phase.
Confirm: dark background, green readout, visible target zone.

**Step 5: Commit**

```
git add app/components/flightlab/pfd/PfdSpeedTape.vue
git commit -m "style(pfd): darken speed tape and use green readout colors"
```

---

### Task 2: Darken Altitude Tape + fix tick side

**Files:**
- Modify: `app/components/flightlab/pfd/PfdAltitudeTape.vue`

**Step 1: Update background colors**

Same as speed tape: outer `#16181f`, inner `#1c1e26` with stroke `#3a3d48`.

**Step 2: Update readout colors to green**

Readout box stroke: `#2fe5ff` → `#19e34a`.
Readout text fill: `#2fe5ff` → `#19e34a`.

**Step 3: Move tick marks to LEFT side**

Change tick x1 from `width - 10` to `1`.
Change tick x2 from `width - 1` to `10`.
Move labels: x from `4` to `14`, keep `text-anchor="start"`.

**Step 4: Verify visually**

Confirm: dark background, green readout, ticks on left side with labels to the right of ticks.

**Step 5: Commit**

```
git add app/components/flightlab/pfd/PfdAltitudeTape.vue
git commit -m "style(pfd): darken altitude tape, green readout, ticks on left"
```

---

### Task 3: Darken Heading Indicator

**Files:**
- Modify: `app/components/flightlab/pfd/PfdHeadingIndicator.vue`

**Step 1: Update background colors**

Outer rect fill: `#8f9198` → `#16181f`.
Inner rect fill: `#94969d` → `#1c1e26`, stroke: `#d4d6dc` → `#3a3d48`.

**Step 2: Verify visually**

Yellow readout stays — already correct for Airbus selected heading.

**Step 3: Commit**

```
git add app/components/flightlab/pfd/PfdHeadingIndicator.vue
git commit -m "style(pfd): darken heading indicator background"
```

---

### Task 4: Darken Vertical Speed channel

**Files:**
- Modify: `app/components/flightlab/pfd/PfdVerticalSpeed.vue`

**Step 1: Update channel fill**

Channel polygon fill: `#8f9198` → `#1c1e26`, stroke: `#d2d4da` → `#3a3d48`.

**Step 2: Verify visually**

Green vector and labels should remain unchanged and visible against dark bg.

**Step 3: Commit**

```
git add app/components/flightlab/pfd/PfdVerticalSpeed.vue
git commit -m "style(pfd): darken vertical speed channel"
```

---

### Task 5: Add sky/ground gradients to Attitude Indicator

**Files:**
- Modify: `app/components/flightlab/pfd/PfdAttitudeIndicator.vue`

**Step 1: Update gradient stops**

Sky gradient: change both stops from `#22a7eb` to:
- stop offset="0%": `#0a4a8a`
- stop offset="100%": `#22a7eb`

Ground gradient: change both stops from `#b26113` to:
- stop offset="0%": `#b26113`
- stop offset="100%": `#5a2e08`

**Step 2: Make aircraft symbol W-shaped**

Replace the two wing rectangles and center dot with a path that has a slight droop at wing tips. Change the wing construction:

Current wings are flat rectangles at `cy`. Add small downward offsets at the outer wing ends to create the characteristic W-shape:

Replace left wing rect with a polygon:
```
points: `${cx - wingSpan - dotRadius},${cy + 3} ${cx - dotRadius - 2},${cy - wingThickness/2} ${cx - dotRadius},${cy - wingThickness/2} ${cx - dotRadius},${cy + wingThickness/2} ${cx - dotRadius - 2},${cy + wingThickness/2}`
```

Simpler approach: keep rects but add small "wing tip" lines descending from each wing end:
- Left tip: line from `(cx - wingSpan - dotRadius, cy)` to `(cx - wingSpan - dotRadius, cy + 5)`
- Right tip: line from `(cx + wingSpan + dotRadius, cy)` to `(cx + wingSpan + dotRadius, cy + 5)`

Both lines yellow, stroke-width 3, stroke-linecap round.

**Step 3: Verify visually**

Confirm gradient visible in sky (darker blue at top) and ground (darker brown at bottom). W-shape visible on aircraft symbol.

**Step 4: Commit**

```
git add app/components/flightlab/pfd/PfdAttitudeIndicator.vue
git commit -m "style(pfd): add sky/ground gradients and W-shaped aircraft symbol"
```

---

### Task 6: Add pitch inertia smoothing to FBW engine

**Files:**
- Modify: `shared/composables/flightlab/useAirbusFBW.ts`

**Step 1: Update constants**

```typescript
const MAX_ROLL_RATE = 7        // was 15
const ROLL_RETURN_RATE = 2     // was 5
const PITCH_RATE_PER_G_DELTA = 1.2  // was 3.5
const SPEED_PITCH_COUPLING = 2.0    // was 1.2
```

**Step 2: Add smoothed pitch rate state**

Add a `smoothedPitchRate` variable (initialized to 0) before the `tick` function:

```typescript
let smoothedPitchRate = 0
const PITCH_SMOOTH_TAU = 2.0  // seconds — exponential smoothing time constant
```

**Step 3: Apply exponential smoothing in tick**

In the pitch section of `tick()`, replace:
```typescript
const pitchRate = gDelta * PITCH_RATE_PER_G_DELTA
state.pitch += pitchRate * dt
```

With:
```typescript
const rawPitchRate = gDelta * PITCH_RATE_PER_G_DELTA
const alpha = 1 - Math.exp(-dt / PITCH_SMOOTH_TAU)
smoothedPitchRate += (rawPitchRate - smoothedPitchRate) * alpha
state.pitch += smoothedPitchRate * dt
```

**Step 4: Reset smoothedPitchRate in reset()**

Add `smoothedPitchRate = 0` to the `reset()` function.

**Step 5: Verify by running dev**

Run: `bun run dev`
Navigate to `/flightlab/medienstationen/learn-pfd`. Pull stick back — pitch should ramp up slowly over ~2-3 seconds instead of responding instantly.

**Step 6: Commit**

```
git add shared/composables/flightlab/useAirbusFBW.ts
git commit -m "feat(flightlab): add realistic inertia to pitch/roll/speed response"
```

---

### Task 7: Update pitch/bank exercise targets to normal ranges

**Files:**
- Modify: `shared/data/flightlab/learn-pfd.ts`

**Step 1: Update horizon_intro phase**

Change `interactionGoal` target from `-20` to `-10`, tolerance from `15` to `8`.
Update `atcMessage` to: `'Das hier ist der künstliche Horizont. Blau ist der Himmel, braun ist der Boden. Genau wie draußen. Beweg jetzt den Stick ganz sanft nach links — nur ein kleines bisschen. Im echten Flugzeug macht man immer nur kleine, sanfte Bewegungen.'`
Update `goalHint` to: `'Drück den Stick ganz leicht nach links. Nur ein kleiner Ausschlag reicht.'`

**Step 2: Update horizon_roll_right phase**

Change `interactionGoal` target from `20` to `10`, tolerance from `15` to `8`.
Update `atcMessage` to: `'Perfekt! Jetzt ganz sanft in die andere Richtung — Stick leicht nach rechts.'`
Update `goalHint` to: `'Stick ganz leicht nach rechts. Kleine, sanfte Bewegungen.'`

**Step 3: Update pitch_intro phase**

Change `interactionGoal` target from `10` to `4`, tolerance from `5` to `3`.
Update `atcMessage` to: `'Jetzt kommt was Wichtiges. Zieh den Stick ganz leicht nach hinten. Nur ein kleines bisschen. Das Besondere beim Airbus: Wenn du loslässt, hält er die Lage. Und das Flugzeug reagiert langsam — du musst immer vorausdenken.'`
Update `goalHint` to: `'Zieh den Stick nur ganz leicht nach hinten. Beim echten Airbus macht man nur minimale Bewegungen.'`

**Step 4: Update pitch_down phase**

Change `interactionGoal` target from `-5` to `-3`, tolerance from `5` to `3`.
Update `atcMessage` to: `'Gut gemacht! Jetzt drück den Stick ganz leicht nach vorne. Auch hier gilt: kleine Bewegungen, und Geduld — das Flugzeug braucht ein paar Sekunden bis es reagiert.'`
Update `goalHint` to: `'Stick ganz leicht nach vorne drücken und warten. Das Flugzeug reagiert mit Verzögerung.'`

**Step 5: Commit**

```
git add shared/data/flightlab/learn-pfd.ts
git commit -m "feat(flightlab): use normal-range targets for pitch/bank exercises"
```

---

### Task 8: Add multi-phase speed exercise

**Files:**
- Modify: `shared/data/flightlab/learn-pfd.ts`
- Modify: `shared/composables/flightlab/useLearnPfdEngine.ts`

**Step 1: Replace speed_hold_pitch with 3 new phases in learn-pfd.ts**

Remove the existing `speed_hold_pitch` phase object. Insert 3 new phase objects after `speed_intro`:

```typescript
// --- Phase 7a: Speed Explain ---
{
    id: 'speed_explain',
    atcMessage: 'Bevor wir loslegen, eine wichtige Regel: Beim Airbus kontrollierst du die Geschwindigkeit mit der Nase. Nase hoch — du wirst langsamer. Nase runter — du wirst schneller. Der Schub bleibt dabei immer gleich. Das nennt man Energie-Management.',
    explanation: 'Im echten Flug hält der Autopilot den Schub konstant. Der Pilot steuert die Geschwindigkeit über den Pitch.',
    visibleElements: ['attitude', 'speedTape'],
    layoutMode: 'split',
    buttons: [
        { id: 'understood', label: 'Verstanden', icon: 'mdi-check', next: 'speed_set_throttle', type: 'primary' },
    ],
},

// --- Phase 7b: Speed Set Throttle (existing speed_intro content, target stays) ---
// speed_intro already handles throttle setting — keep as is

// --- Phase 7c: Speed Hold Coarse ---
{
    id: 'speed_hold_coarse',
    atcMessage: 'Gut, Schub steht. Jetzt versuch die Geschwindigkeit in den türkisen Bereich zu bringen. Nase ganz leicht hoch oder runter — und dann warten. Das Flugzeug braucht mehrere Sekunden bis sich die Speed ändert.',
    explanation: 'Erste Annäherung: Bringe die Speed grob in den Zielbereich.',
    visibleElements: ['attitude', 'speedTape'],
    layoutMode: 'split',
    interactionGoal: { parameter: 'speed', target: 225, tolerance: 10, holdMs: 5000 },
    speedTargetRange: { min: 215, max: 235 },
    goalTimeoutMs: 30000,
    goalHint: 'Korrigiere nur mit ganz kleinen Pitch-Bewegungen. Die Speed ändert sich langsam — hab Geduld.',
    autoAdvanceAfterTTS: false,
    buttons: [
        { id: 'skip_coarse', label: 'Weiter', icon: 'mdi-arrow-right', next: 'speed_hold_fine', type: 'primary' },
    ],
},

// --- Phase 7d: Speed Hold Fine ---
{
    id: 'speed_hold_fine',
    atcMessage: 'Sehr gut! Jetzt genauer. Halte die Geschwindigkeit möglichst exakt auf 225 Knoten. Nur winzige Korrekturen — und immer ein paar Sekunden warten bevor du nachkorrigierst.',
    explanation: 'Feinsteuerung: Präzise Speed-Kontrolle mit minimalen Pitch-Änderungen.',
    visibleElements: ['attitude', 'speedTape'],
    layoutMode: 'split',
    interactionGoal: { parameter: 'speed', target: 225, tolerance: 5, holdMs: 8000 },
    speedTargetRange: { min: 220, max: 230 },
    goalTimeoutMs: 40000,
    goalHint: 'Ganz kleine Pitch-Korrekturen. Warte nach jeder Korrektur 3-4 Sekunden bevor du nachjustierst.',
    autoAdvanceAfterTTS: false,
    buttons: [
        { id: 'skip_fine', label: 'Weiter', icon: 'mdi-arrow-right', next: 'alt_intro', type: 'primary' },
    ],
},
```

**Step 2: Update speed_intro phase**

Change the `speed_intro` button's `next` from `'speed_hold_pitch'` to `'speed_explain'`.

**Step 3: Update goalNextPhase in useLearnPfdEngine.ts**

Replace:
```typescript
'speed_intro': 'speed_hold_pitch',
'speed_hold_pitch': 'alt_intro',
```

With:
```typescript
'speed_intro': 'speed_explain',
'speed_set_throttle': 'speed_hold_coarse',
'speed_hold_coarse': 'speed_hold_fine',
'speed_hold_fine': 'alt_intro',
```

Note: `speed_explain` → `speed_set_throttle` is button-driven (not goal-driven), so no entry needed in `goalNextPhase`. But `speed_set_throttle` is actually `speed_intro` with the throttle goal. Wait — looking at the existing flow:

- `speed_intro` has goal: throttle 70%. On goal met → `goalNextPhase['speed_intro']` fires.
- So `speed_intro` goal-advances to `speed_explain` (explanation screen).
- `speed_explain` has no goal, button-advances to `speed_set_throttle`.

Actually this is wrong — `speed_intro` IS the throttle-setting phase. The flow should be:

- `speed_intro` (throttle 70% goal) → goal met → `speed_explain`
- `speed_explain` (no goal, button) → `speed_hold_coarse`
- `speed_hold_coarse` (speed ±10, 5s) → goal met → `speed_hold_fine`
- `speed_hold_fine` (speed ±5, 8s) → goal met → `alt_intro`

Fix `speed_explain` button next to `'speed_hold_coarse'` (not `speed_set_throttle`).

Updated goalNextPhase:
```typescript
'speed_intro': 'speed_explain',
'speed_hold_coarse': 'speed_hold_fine',
'speed_hold_fine': 'alt_intro',
```

**Step 4: Update mainPhaseIds**

Replace `'speed_hold_pitch'` with `'speed_explain', 'speed_hold_coarse', 'speed_hold_fine'` in the `mainPhaseIds` array:

```typescript
const mainPhaseIds = ['welcome', 'horizon_intro', 'pitch_intro', 'speed_intro', 'speed_explain', 'speed_hold_coarse', 'speed_hold_fine', 'alt_intro', 'vs_intro', 'heading_intro', 'combined', 'free_practice', 'end']
```

**Step 5: Verify the full flow**

Run: `bun run dev`
Walk through all phases from welcome to end. Verify:
- Speed explain shows text + "Verstanden" button
- Coarse hold has wide band, 5s hold requirement
- Fine hold has narrow band, 8s hold requirement
- Progress bar advances smoothly through new phases

**Step 6: Commit**

```
git add shared/data/flightlab/learn-pfd.ts shared/composables/flightlab/useLearnPfdEngine.ts
git commit -m "feat(flightlab): multi-phase speed exercise with progressive difficulty"
```

---

### Task 9: Final visual verification

**Step 1: Full walkthrough**

Run: `bun run dev`
Navigate to `/flightlab/medienstationen/learn-pfd`.
Walk through every phase and verify:
- All tapes have dark backgrounds
- Green readouts on speed and altitude
- Yellow heading readout
- Attitude has sky/ground gradients
- Aircraft symbol has W-shape
- Flight physics feel sluggish and realistic
- Pitch/bank exercises use small targets
- Speed exercise teaches energy management in 3 steps

**Step 2: Commit any final tweaks**

If color adjustments needed for contrast/readability on dark backgrounds, adjust and commit.
