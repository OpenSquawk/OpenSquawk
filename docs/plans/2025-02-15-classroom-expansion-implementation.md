# Classroom Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the Classroom from 4 flat modules into 3 training tracks (Core Flight, Abnormal & Emergency, ATC Perspective) with ~89 new lessons and a new Decision Mode exercise engine.

**Architecture:** The existing `learnModules: ModuleDef[]` array becomes `learnTracks: TrackDef[]`, each containing modules. The Hub UI renders tracks as vertical sections. Cloze exercises reuse the existing engine. ATC Perspective gets a new `DecisionExercise` component with sequencing/choice/assignment interactions.

**Tech Stack:** Nuxt 4 (Vue 3 SFC), TypeScript, existing scenario generation system in `shared/learn/scenario.ts`, Vuetify icons, existing TTS/audio pipeline.

**Design Doc:** `docs/plans/2025-02-15-classroom-expansion-design.md`

---

## Phase 1: Track System (Data Model + Hub UI)

### Task 1: Add TrackDef type and restructure module data

**Files:**
- Modify: `shared/learn/types.ts`
- Modify: `shared/data/learnModules.ts` (bottom section, lines 3260-3295)

**Step 1: Add TrackDef type**

In `shared/learn/types.ts`, add after `ModuleDef`:

```typescript
export type TrackDef = {
  id: string
  title: string
  subtitle: string
  modules: ModuleDef[]
}
```

**Step 2: Wrap existing modules into tracks**

In `shared/data/learnModules.ts`, replace the `learnModules` export (lines 3260-3295) with:

```typescript
import type { TrackDef } from '~~/shared/learn/types'

// Keep the old flat export for backward compat with search etc.
export const learnModules: ModuleDef[] = [
  { id: 'normalize', title: 'Fundamentals · Basics', subtitle: 'Alphabet, Call Signs, ATIS & METAR', art: '/img/learn/modules/img14.jpeg', lessons: fundamentalsLessons },
  { id: 'arc', title: 'Readbacks · Essential Calls', subtitle: 'Clearances, taxi, approach & landing', art: '/img/learn/modules/img11.jpeg', lessons: readbackLessons },
  { id: 'decision-tree', title: 'ATC · Advanced Calls', subtitle: 'Requests, contingencies & interrupts', art: '/img/learn/modules/img10.jpeg', lessons: decisionTreeLessons },
  { id: 'full-flight', title: 'Full Flight · Gate to Gate', subtitle: 'One linked scenario from clearance to taxi-in', art: '/img/learn/modules/img6.jpeg', lessons: fullFlightLessons, meta: { flightPlan: true, briefingArt: '/img/learn/missions/full-flight/briefing-hero.png' } },
]

export const learnTracks: TrackDef[] = [
  {
    id: 'core',
    title: 'Core Flight Missions',
    subtitle: 'From basics to full flight',
    modules: learnModules,
  },
]

export default learnModules
```

**Step 3: Verify dev server starts**

Run: `bun run dev`
Expected: No errors — the change is additive, nothing consumes `learnTracks` yet.

**Step 4: Commit**

```bash
git add shared/learn/types.ts shared/data/learnModules.ts
git commit -m "feat(classroom): add TrackDef type and wrap existing modules into core track"
```

---

### Task 2: Update Hub UI to render tracks

**Files:**
- Modify: `app/pages/classroom.vue` (Hub section, lines ~156-225 and script ~1425)

**Step 1: Import learnTracks and update module source**

In the `<script>` section (~line 1321), add `learnTracks` to the import:

```typescript
import { learnModules, learnTracks, seedFullFlightScenario } from '~~/shared/data/learnModules'
```

Add a ref for tracks (~line 1425):

```typescript
const tracks = shallowRef<TrackDef[]>(learnTracks)
const modules = computed(() => tracks.value.flatMap(t => t.modules))
```

This keeps `modules` working for search, progress, etc. — it's now a computed flat list derived from tracks.

**Step 2: Update Hub template to render track sections**

Replace the Hub `<main>` section (lines ~156-225) with track-based rendering:

```html
<main v-if="panel==='hub'" class="container" role="main">
  <div class="hub-head">
    <h2 class="h2">Training Mission Hub</h2>
    <div class="muted">Master radio communications from basics to emergencies.</div>
  </div>

  <div v-for="track in tracks" :key="track.id" class="track-section">
    <div class="track-header">
      <h3 class="track-title">{{ track.title }}</h3>
      <div class="track-subtitle muted">{{ track.subtitle }}</div>
      <div class="track-progress">
        <div class="line">
          <div class="line-fill" :style="{ width: trackPct(track.id) + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="tiles">
      <div
        v-for="m in track.modules"
        :key="m.id"
        class="tile"
        :class="tileClass(m.id)"
        @click="isModuleUnlocked(m.id) && handleModulePrimary(m.id)"
      >
        <!-- existing tile content unchanged -->
        <div class="tile-media" :style="{ backgroundImage: `url(${m.art})` }">
          <span v-if="isFreshModule(m.id)" class="tile-badge">
            <v-icon size="16">mdi-star</v-icon>
            New briefing
          </span>
        </div>
        <div class="tile-body">
          <div class="tile-top">
            <div class="tile-title">
              <v-icon size="18">mdi-flag-checkered</v-icon>
              {{ m.title }}
            </div>
          </div>
          <div class="muted small">{{ m.subtitle }}</div>
          <div class="line">
            <div class="line-fill" :style="{ width: pct(m.id)+'%' }"></div>
          </div>
          <div class="tile-progress-meta">
            <span>{{ doneCount(m.id) }}/{{ m.lessons.length }} lessons</span>
            <span>{{ moduleHasProgress(m.id) ? avgScore(m.id) + '%' : '—' }} avg</span>
          </div>
          <div class="tile-actions">
            <button
              class="btn primary"
              :disabled="!isModuleUnlocked(m.id)"
              @click="handleModulePrimary(m.id)"
            >
              <v-icon size="18">{{ modulePrimaryIcon(m.id) }}</v-icon>
              {{ modulePrimaryLabel(m.id) }}
            </button>
          </div>
        </div>
        <div v-if="!isModuleUnlocked(m.id)" class="tile-overlay">
          <div class="tile-overlay-inner">
            <v-icon size="26">mdi-lock-alert</v-icon>
            <div class="tile-overlay-text">
              <div class="tile-overlay-title">Clearance pending</div>
              <div class="tile-overlay-sub">
                Complete earlier missions to
                <button type="button" class="tile-overlay-link" @click.stop.prevent="attemptUnlockModule(m.id)">unlock</button>
                this briefing.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
```

**Step 3: Add trackPct computed helper**

In the script section, add:

```typescript
function trackPct(trackId: string): number {
  const track = tracks.value.find(t => t.id === trackId)
  if (!track) return 0
  const total = track.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  if (total === 0) return 0
  const done = track.modules.reduce((sum, m) => sum + doneCount(m.id), 0)
  return Math.round((done / total) * 100)
}
```

**Step 4: Add CSS for track sections**

In the `<style>` section, add:

```css
.track-section {
  margin-bottom: 2.5rem;
}

.track-header {
  margin-bottom: 1rem;
}

.track-title {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-primary, #e0e0e0);
}

.track-subtitle {
  font-size: 0.85rem;
  margin-top: 0.15rem;
}

.track-progress {
  margin-top: 0.5rem;
  max-width: 300px;
}

.track-progress .line {
  height: 3px;
}
```

**Step 5: Verify Hub renders with track header**

Run: `bun run dev`, navigate to `/classroom`.
Expected: Hub shows "Core Flight Missions" header above the existing 4 module tiles. Everything else works as before.

**Step 6: Commit**

```bash
git add app/pages/classroom.vue
git commit -m "feat(classroom): render Hub with track sections instead of flat module list"
```

---

## Phase 2: VATSIM Essentials Module (6 lessons)

### Task 3: Add Scenario extensions for new lesson types

**Files:**
- Modify: `shared/learn/scenario.ts`
- Modify: `shared/learn/types.ts`

**Step 1: Add new scenario fields**

In `shared/learn/types.ts`, add to the `Scenario` type:

```typescript
// Emergency / abnormal extensions
soulsOnBoard: number
soulsOnBoardWords: string
fuelMinutes: number
fuelMinutesWords: string
positionDescription: string  // e.g. "30 miles north of BARDI"
holdingFix: string
holdingInbound: string
holdingTurn: string           // 'right' | 'left'
holdingLegTime: string        // e.g. '1'
holdingEfc: string            // e.g. '1745'
crossingFix1: string
crossingAlt1: string
crossingAlt1Words: string
crossingRestriction1: string  // 'at or above' | 'at' | 'at or below'
crossingFix2: string
crossingAlt2: string
crossingAlt2Words: string
```

**Step 2: Generate the new fields in createBaseScenario()**

In `shared/learn/scenario.ts`, add inside `createBaseScenario()` before the return:

```typescript
const soulsOnBoard = randInt(87, 224)
const soulsOnBoardWords = digitsToWords(soulsOnBoard.toString())
const fuelMinutes = randInt(25, 180)
const fuelMinutesWords = minutesToWords(fuelMinutes)
const positionDistance = randInt(10, 60)
const positionDirection = choice(['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'])
const positionFix = choice([...airport.transitions, ...(destination.arrivalTransitions ?? destination.transitions)])
const positionDescription = `${positionDistance} miles ${positionDirection} of ${positionFix}`

// Holding pattern data
const holdingFixOptions = [...airport.transitions, ...(destination.arrivalTransitions ?? destination.transitions)]
const holdingFix = choice(holdingFixOptions)
const holdingInbound = (randInt(0, 35) * 10).toString().padStart(3, '0')
const holdingTurn = choice(['right', 'left'] as const)
const holdingLegTime = choice(['1', '1.5', '2'])
const holdingEfcMinutes = randInt(10, 45)
const now2 = new Date()
const efcTime = new Date(now2.getTime() + holdingEfcMinutes * 60000)
const holdingEfc = `${efcTime.getUTCHours().toString().padStart(2, '0')}${efcTime.getUTCMinutes().toString().padStart(2, '0')}`

// Crossing restrictions
const crossingFixOptions = [...(destination.arrivalTransitions ?? destination.transitions)]
const crossingFix1 = crossingFixOptions[0] ?? 'LIPSO'
const crossingFix2 = crossingFixOptions[1] ?? crossingFixOptions[0] ?? 'VAMPS'
const crossingAlt1 = (choice([8000, 9000, 10000, 11000])).toString()
const crossingAlt2 = (choice([5000, 6000, 7000])).toString()
const crossingRestriction1 = choice(['at or above', 'at', 'at or below'] as const)
```

Add these fields to the return object:

```typescript
soulsOnBoard,
soulsOnBoardWords,
fuelMinutes,
fuelMinutesWords,
positionDescription,
holdingFix,
holdingInbound,
holdingTurn,
holdingLegTime,
holdingEfc,
crossingFix1,
crossingAlt1,
crossingAlt1Words: altitudeToWords(Number(crossingAlt1)),
crossingRestriction1,
crossingFix2,
crossingAlt2,
crossingAlt2Words: altitudeToWords(Number(crossingAlt2)),
```

**Step 3: Verify dev server starts**

Run: `bun run dev`
Expected: No errors.

**Step 4: Commit**

```bash
git add shared/learn/types.ts shared/learn/scenario.ts
git commit -m "feat(classroom): extend Scenario with emergency/abnormal fields (SOB, fuel, holding, crossing)"
```

---

### Task 4: Write VATSIM Essentials lessons

**Files:**
- Modify: `shared/data/learnModules.ts`

**Step 1: Add the 6 VATSIM Essentials lessons**

Add a new lesson array before the `learnModules` export. This is a large block — add it after the `fullFlightLessons` array and before `export const learnModules`. Each lesson follows the exact same pattern as existing lessons (see `fundamentalsLessons` for reference).

Write these 6 lessons:
1. **unicom-blind-call** — Pilot constructs blind call on 122.800. Fields: airport ICAO, position, intention. Phrase: scenario description of no-ATC situation.
2. **radio-check** — Pilot initiates radio check. Fields: station, frequency, readability number. Phrase: controller readability response.
3. **say-again-targeted** — Garbled clearance, pilot requests specific missing part. Fields: say-again target phrase. Phrase: partially garbled clearance.
4. **monitor-vs-contact** — Randomly "Monitor" or "Contact". Fields differ based on which. Phrase: ATC frequency change instruction.
5. **two-step-freq-change** — Combined instruction + initial call on new freq. Fields: altitude, facility, frequency, ATIS code. Phrase: ATC combined instruction.
6. **atis-update-taxi** — ATIS change during taxi. Fields: ATIS letter, QNH, new runway. Phrase: ATC update transmission.

Follow the exact pattern from existing lessons: `id`, `title`, `desc`, `keywords`, `hints`, `fields` (with `key`, `label`, `expected`, `alternatives`, `threshold`, `placeholder`, `width`), `readback` segments, `defaultFrequency`, `phrase`, `info`, `generate`.

**Step 2: Create the module definition**

Add to the `learnTracks` array a new Abnormal track:

```typescript
{
  id: 'abnormal',
  title: 'Abnormal & Emergency Missions',
  subtitle: 'Non-standard situations, emergencies & VATSIM procedures',
  modules: [
    {
      id: 'vatsim-essentials',
      title: 'VATSIM · Essentials',
      subtitle: 'Unicom, radio checks, frequency management',
      art: gradientArt(['#1a237e', '#283593', '#3949ab']),
      lessons: vatsimEssentialsLessons,
    },
  ],
}
```

**Step 3: Verify lessons render in Hub**

Run: `bun run dev`, navigate to `/classroom`.
Expected: Two track sections visible — "Core Flight Missions" and "Abnormal & Emergency Missions". VATSIM Essentials module tile visible. Can open and play lessons.

**Step 4: Commit**

```bash
git add shared/data/learnModules.ts
git commit -m "feat(classroom): add VATSIM Essentials module (6 lessons) in Abnormal track"
```

---

## Phase 3: Abnormal Comms Module (8 lessons)

### Task 5: Write Abnormal Comms lessons

**Files:**
- Modify: `shared/data/learnModules.ts`

**Step 1: Add the 8 Abnormal Comms lessons**

Write these lessons following the established pattern:

1. **conditional-crossing** — "Behind the departing 737, cross runway 09 at ECHO, behind". Fields: traffic description, runway, intersection (readback MUST include condition + trailing "behind").
2. **complex-holding** — Full holding clearance. Fields: direction, fix, inbound course, turn direction, leg time, EFC time (6 fields).
3. **amended-departure** — Amended clearance with SID, altitude exception, expect altitude, squawk. Fields: destination, SID, altitude, expect altitude, departure freq, squawk (6 fields).
4. **speed-then-altitude** — Sequential instruction with "then". Fields: speed, flight level. Hint explains "then" = sequential.
5. **immediate-traffic** — "Turn left IMMEDIATELY heading 270". Fields: turn direction, heading. Hint: IMMEDIATELY = execute while reading back.
6. **multiple-crossing-restrictions** — STAR descent with two fixes, different restriction types. Fields: fix1, restriction type, alt1, fix2, alt2 (5 fields).
7. **tcas-ra-override** — Two-part: reject ATC instruction ("Unable, TCAS RA") then report clear of conflict. Fields: rejection phrase, return level.
8. **late-runway-change** — Cancel approach + new vectors. Fields: old runway, heading, new runway, altitude (4 fields).

**Step 2: Add module to Abnormal track**

Add to the `abnormal` track's modules array:

```typescript
{
  id: 'abnormal-comms',
  title: 'Abnormal · Communications',
  subtitle: 'Holding, re-clearances, TCAS & conditional clearances',
  art: gradientArt(['#b71c1c', '#c62828', '#d32f2f']),
  lessons: abnormalCommsLessons,
}
```

**Step 3: Verify**

Run: `bun run dev`, open Abnormal Comms module, test a few lessons.

**Step 4: Commit**

```bash
git add shared/data/learnModules.ts
git commit -m "feat(classroom): add Abnormal Comms module (8 lessons) — holding, TCAS, conditional clearances"
```

---

## Phase 4: Emergency Basics Module (7 lessons)

### Task 6: Write Emergency Basics lessons

**Files:**
- Modify: `shared/data/learnModules.ts`

**Step 1: Add the 7 Emergency Basics lessons**

1. **mayday-declaration** — Pilot builds full MAYDAY call from scratch. Fields: station, callsign, nature, intentions, position, heading, fuel minutes, souls on board (8 fields). No ATC prompt — pilot initiates.
2. **pan-pan-declaration** — Full PAN PAN call. Fields: addressee (ALL STATIONS or station), callsign, position, nature, assistance, fuel, POB (7 fields).
3. **mayday-vs-panpan-fuel** — Scenario describes fuel state with numbers. Pilot decides MAYDAY FUEL or PAN PAN FUEL + makes the call. Fields: call type, fuel state, callsign, request.
4. **emergency-descent** — Cabin depressurization. Fields: station, callsign, leaving level, squawk code.
5. **emergency-query-response** — ATC asks "state fuel and souls". Fields: fuel in minutes, souls count. Hint: fuel = time not weight, souls = pax + crew.
6. **cancel-emergency** — Cancel MAYDAY/PAN PAN. Fields: call type, reason, intentions.
7. **emergency-squawk-codes** — Situation → correct squawk. Fields: squawk code (7700/7600/7500), associated call phraseology.

**Step 2: Add module to Abnormal track**

```typescript
{
  id: 'emergency-basics',
  title: 'Emergency · Basics',
  subtitle: 'MAYDAY, PAN PAN, squawk codes & fuel emergencies',
  art: gradientArt(['#e65100', '#ef6c00', '#f57c00']),
  lessons: emergencyBasicsLessons,
}
```

**Step 3: Verify and commit**

```bash
git add shared/data/learnModules.ts
git commit -m "feat(classroom): add Emergency Basics module (7 lessons) — MAYDAY, PAN PAN, squawk codes"
```

---

## Phase 5: Emergency Scenario Flights Module (4 multi-step scenarios)

### Task 7: Write Emergency Scenario Flight lessons

**Files:**
- Modify: `shared/data/learnModules.ts`

**Step 1: Create emergency scenario generators**

Create scenario series generators (like `makeFullFlightGenerator`) for emergency contexts. Each scenario is a series of cloze lessons sharing the same generated scenario data.

**Step 2: Write 4 scenarios × ~5 steps each = ~20 lessons**

Each scenario is a linked series of cloze lessons using `createScenarioSeries()`:

1. **Medical Emergency** (5 steps): cruise check-in → PAN PAN declaration → ATC priority vectors readback → approach clearance → landing + ambulance confirm
2. **Engine Failure** (5 steps): MAYDAY declaration → emergency descent coordination → ATC vectors readback → ILS approach → landing
3. **Fuel Emergency Escalation** (5 steps): PAN PAN FUEL → ATC priority readback → situation worsens → MAYDAY FUEL upgrade → direct vectors + approach
4. **Diversion** (5 steps): report problem → request diversion → new clearance readback (new dest, routing, alt) → approach at alternate → landing + taxi

**Step 3: Add module to Abnormal track**

```typescript
{
  id: 'emergency-scenarios',
  title: 'Emergency · Scenario Flights',
  subtitle: 'Multi-step emergency scenarios from onset to landing',
  art: gradientArt(['#ff6f00', '#ff8f00', '#ffa000']),
  lessons: emergencyScenarioLessons,
  meta: { flightPlan: false },
}
```

**Step 4: Verify multi-step flow works**

Test that stepping through the linked lessons shares scenario data correctly (same callsign, airport, etc. throughout the emergency).

**Step 5: Commit**

```bash
git add shared/data/learnModules.ts
git commit -m "feat(classroom): add Emergency Scenario Flights module (4 multi-step scenarios)"
```

---

## Phase 6: Decision Mode Engine (ATC Perspective)

### Task 8: Define Decision Mode types

**Files:**
- Create: `shared/learn/decision-types.ts`

**Step 1: Create the type definitions**

```typescript
export type DecisionType = 'sequencing' | 'choice' | 'assignment' | 'priority'

export type FlightStrip = {
  callsign: string
  type: string
  altitude: string
  heading: string
  position: string
  intention: string
  category: 'heavy' | 'medium' | 'light'
  status: 'emergency' | 'normal'
}

export type DecisionStep = {
  prompt: string
  type: DecisionType
  options?: string[]
  items?: string[]
  correct: string | string[]
  explanation: string
}

export type DecisionScenario = {
  briefing: string
  strips: FlightStrip[]
  steps: DecisionStep[]
}

export type DecisionLesson = {
  id: string
  title: string
  desc: string
  keywords: string[]
  hints: string[]
  generate: () => DecisionScenario
}

export type DecisionModuleDef = {
  id: string
  title: string
  subtitle: string
  art: string
  lessons: DecisionLesson[]
  meta?: { exerciseType: 'decision' }
}
```

**Step 2: Commit**

```bash
git add shared/learn/decision-types.ts
git commit -m "feat(classroom): add Decision Mode types for ATC Perspective track"
```

---

### Task 9: Build DecisionExercise component

**Files:**
- Create: `app/components/learn/DecisionExercise.vue`

**Step 1: Build the component**

This component receives a `DecisionScenario` and renders:
- **Briefing panel** (top) — text description of the situation
- **Stripboard** (left) — list of `FlightStrip` cards showing callsign, type, altitude, heading, status
- **Decision area** (right) — renders the current step:
  - `sequencing`: drag-and-drop list (use native HTML drag API)
  - `choice`: radio button group
  - `assignment`: dropdown/select per aircraft
  - `priority`: drag-and-drop ranking
- **Submit button** — evaluates answer against `correct`
- **Evaluation** — shows correct/incorrect + explanation text

Props: `scenario: DecisionScenario`
Emits: `complete(score: number)` — when all steps answered

Keep the component focused. No TTS, no audio effects — this is about cognitive decision-making.

The stripboard should use the same dark card style as the existing lesson console. Decision area uses the existing `.btn` and form styles.

**Step 2: Commit**

```bash
git add app/components/learn/DecisionExercise.vue
git commit -m "feat(classroom): build DecisionExercise component with strip board and decision UI"
```

---

### Task 10: Integrate Decision Mode into classroom.vue

**Files:**
- Modify: `app/pages/classroom.vue`
- Modify: `shared/learn/types.ts`

**Step 1: Update ModuleMeta to support exerciseType**

In `shared/learn/types.ts`:

```typescript
export type ModuleMeta = {
  flightPlan?: boolean
  briefingArt?: string
  exerciseType?: 'cloze' | 'decision'
}
```

**Step 2: Add conditional rendering in classroom.vue**

In the module/lesson section of classroom.vue, add a condition:

- If `current.meta?.exerciseType === 'decision'` → render `<DecisionExercise>` instead of the cloze readback UI
- The DecisionExercise component handles its own evaluation and emits score
- Wire `@complete` to the same progress-saving logic that cloze uses

**Step 3: Import DecisionExercise**

```typescript
import DecisionExercise from '~/components/learn/DecisionExercise.vue'
```

**Step 4: Verify**

Create a test decision module with 1 dummy lesson, verify it renders the DecisionExercise component.

**Step 5: Commit**

```bash
git add app/pages/classroom.vue shared/learn/types.ts
git commit -m "feat(classroom): integrate DecisionExercise into classroom with conditional rendering"
```

---

## Phase 7: ATC Perspective Lessons

### Task 11: Write Controller Workflow lessons (6 decision lessons)

**Files:**
- Create: `shared/data/learnDecisionModules.ts`

**Step 1: Write the 6 Controller Workflow decision lessons**

Each lesson has a `generate()` function that returns a `DecisionScenario` with randomized flight strips and steps:

1. **departure-sequencing** — 3 aircraft, different wake categories + SIDs. Sequencing task.
2. **arrival-spacing** — 4 arrivals from different directions. Sequencing + assignment.
3. **wake-turbulence-separation** — Heavy/Medium/Light on ILS. Choice: correct separation times.
4. **runway-conflict** — Departure, arrival, crosser. Choice: who gets what instruction.
5. **frequency-priority** — 8 aircraft with emergency. Priority ranking.
6. **weather-deviation** — Deviation request with conflicting traffic. Choice.

**Step 2: Write Think Like ATC lessons (6 decision lessons)**

1. **departure-puzzle** — 2 aircraft same runway, different SIDs/categories. Sequencing + reasoning.
2. **conflict-detection** — 2 converging aircraft. Assignment: who turns, what heading.
3. **go-around-call** — Aircraft on final, runway not clear. Choice + assignment.
4. **emergency-reshuffling** — MAYDAY in approach sequence. Priority + assignment.
5. **taxi-conflict** — 3 aircraft at intersection. Assignment: hold/continue/reroute.
6. **handoff-timing** — Climbing aircraft, busy next sector. Choice.

**Step 3: Write Reverse Sim scenarios (4 multi-step decision scenarios)**

Each has 4-6 DecisionSteps that build on each other:

1. **busy-ground** — 4 aircraft ground movements.
2. **tower-rush-hour** — 3 departures + 2 arrivals.
3. **approach-sequencing** — 5 arrivals from all directions.
4. **emergency-inbound** — Normal flow disrupted by MAYDAY.

**Step 4: Commit**

```bash
git add shared/data/learnDecisionModules.ts
git commit -m "feat(classroom): add all ATC Perspective lessons (16 decision + 4 reverse sim)"
```

---

### Task 12: Add ATC Perspective track

**Files:**
- Modify: `shared/data/learnModules.ts`

**Step 1: Import decision modules and add track**

```typescript
import { controllerWorkflowLessons, thinkLikeAtcLessons, reverseSimLessons } from './learnDecisionModules'
```

Add the third track to `learnTracks`:

```typescript
{
  id: 'atc-perspective',
  title: 'ATC Perspective Missions',
  subtitle: 'Understand, decide & control like ATC',
  modules: [
    {
      id: 'controller-workflow',
      title: 'Controller · Workflow',
      subtitle: 'Understand sequencing, priority & separation',
      art: gradientArt(['#004d40', '#00695c', '#00796b']),
      lessons: [],  // decision lessons need adapter — see step 2
      meta: { exerciseType: 'decision' as const },
    },
    {
      id: 'think-like-atc',
      title: 'Think Like · ATC',
      subtitle: 'Make controller decisions under pressure',
      art: gradientArt(['#006064', '#00838f', '#0097a7']),
      lessons: [],
      meta: { exerciseType: 'decision' as const },
    },
    {
      id: 'reverse-sim',
      title: 'Reverse · Sim',
      subtitle: 'Multi-step scenarios as the controller',
      art: gradientArt(['#01579b', '#0277bd', '#0288d1']),
      lessons: [],
      meta: { exerciseType: 'decision' as const },
    },
  ],
}
```

Note: Decision lessons have a different shape than Cloze lessons. The ModuleDef type may need to accept both, or we use an adapter. The adapter approach: wrap each `DecisionLesson` into a `Lesson`-compatible shell where `phrase` returns the briefing text, `fields` are empty, and the actual decision rendering is handled by the component.

**Step 2: Create adapter to make DecisionLessons fit ModuleDef**

In `shared/data/learnDecisionModules.ts`, export a function that wraps decision lessons into Lesson-compatible objects:

```typescript
export function adaptDecisionLesson(dl: DecisionLesson): Lesson {
  return {
    id: dl.id,
    title: dl.title,
    desc: dl.desc,
    keywords: dl.keywords,
    hints: dl.hints,
    fields: [],
    readback: [],
    phrase: () => '',
    info: () => [],
    generate: () => createBaseScenario(), // placeholder — actual scenario handled by DecisionExercise
    _decision: dl,  // stash the real decision lesson for the component
  } as Lesson & { _decision: DecisionLesson }
}
```

**Step 3: Verify Hub shows all 3 tracks**

Run: `bun run dev`, navigate to `/classroom`.
Expected: 3 track sections visible with all modules.

**Step 4: Commit**

```bash
git add shared/data/learnModules.ts shared/data/learnDecisionModules.ts
git commit -m "feat(classroom): add ATC Perspective track with 3 decision modules"
```

---

## Phase 8: Unlock System + Polish

### Task 13: Update unlock logic for new tracks

**Files:**
- Modify: `app/pages/classroom.vue`

**Step 1: Find and update the unlock logic**

Search for `isModuleUnlocked` and `attemptUnlockModule` in classroom.vue. Update the logic:

- Core Track: existing unlock logic stays (sequential within track)
- Abnormal Track: unlocks after Fundamentals (`normalize`) + Readbacks (`arc`) in Core are completed
- ATC Perspective Track: unlocks after Advanced Calls (`decision-tree`) in Core is completed
- Within each track: sequential unlock as before

**Step 2: Update the default unlockedModules**

In `shared/learn/config.ts`, ensure `createDefaultLearnState()` defaults to unlocking only `normalize` (first module of Core track) — this is already the case.

**Step 3: Test unlock flow**

Verify:
- New user sees only Core track modules, first unlocked
- After completing Fundamentals + Readbacks, Abnormal track's first module unlocks
- After completing Advanced Calls, ATC Perspective track's first module unlocks

**Step 4: Commit**

```bash
git add app/pages/classroom.vue shared/learn/config.ts
git commit -m "feat(classroom): update unlock logic for cross-track progression"
```

---

### Task 14: Update lesson search to work across tracks

**Files:**
- Modify: `app/pages/classroom.vue`

**Step 1: Verify search still works**

The `modules` computed now derives from `tracks.value.flatMap(t => t.modules)`. The search already iterates `modules.value`, so it should automatically include new track modules.

Verify by searching for "MAYDAY" — should find Emergency Basics lessons.

**Step 2: Update search group headers**

The search groups by module. Optionally add track name to the group header for clarity. In the search results template, you could prefix the group header with the track title.

**Step 3: Commit if changes needed**

```bash
git add app/pages/classroom.vue
git commit -m "feat(classroom): verify lesson search works across all tracks"
```

---

### Task 15: Final integration test

**Step 1: Full walkthrough**

1. Open `/classroom` — verify 3 track sections render
2. Open each Cloze module, play a lesson, verify evaluation works
3. Open a multi-step Emergency Scenario, verify steps link correctly
4. Open an ATC Perspective lesson, verify DecisionExercise renders
5. Complete a sequencing task, verify scoring
6. Check progress saves to server via API
7. Check unlock logic across tracks

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(classroom): complete classroom expansion with 3 training tracks"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 | Tasks 1-2 | Track system (data model + Hub UI) |
| 2 | Tasks 3-4 | VATSIM Essentials module (6 lessons) |
| 3 | Task 5 | Abnormal Comms module (8 lessons) |
| 4 | Task 6 | Emergency Basics module (7 lessons) |
| 5 | Task 7 | Emergency Scenario Flights (4 multi-step) |
| 6 | Tasks 8-10 | Decision Mode engine |
| 7 | Tasks 11-12 | ATC Perspective lessons (16 + 4) |
| 8 | Tasks 13-15 | Unlock system + search + integration test |

Each phase is independently deployable. Phase 1-5 (Cloze-based content) can ship before Phase 6-7 (Decision Mode) is ready.
