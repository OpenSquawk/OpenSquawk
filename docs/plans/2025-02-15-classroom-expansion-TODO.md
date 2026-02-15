# Classroom Expansion — Remaining TODOs & Notes

> This file tracks what's left to do, key decisions made, and lessons learned during implementation.
> See also: `2025-02-15-classroom-expansion-design.md` and `2025-02-15-classroom-expansion-implementation.md`

---

## What's Done

### Track System (Tasks 1-2)
- [x] `TrackDef` type added to `shared/learn/types.ts`
- [x] `learnTracks` export in `shared/data/learnModules.ts` wrapping existing modules under "Core Flight Missions"
- [x] Hub UI renders tracks as vertical sections with track header, subtitle, progress bar
- [x] `modules` computed derived from `tracks.flatMap()` — backward compatible with search/progress

### Scenario Extensions (Task 3)
- [x] New fields on `Scenario`: soulsOnBoard, fuelMinutes, positionDescription, holding pattern data, crossing restriction data
- [x] All generated in `createBaseScenario()` in `shared/learn/scenario.ts`

### VATSIM Essentials Module (Task 4 + Fixes)
- [x] 6 lessons: Unicom Blind Call, Radio Check, Say Again, Monitor vs Contact, Two-Step Freq Change, ATIS Update
- [x] **Fixed Radio Check** — removed readability field (pilot can't know it before controller responds), now just practices initiating the radio check call
- [x] **Fixed Say Again** — expected answer is now concrete ("all before [SID name]") instead of subjective
- [x] **Fixed Monitor vs Contact** — replaced huge initial-call field with simple "do you transmit? yes/no" field

### Abnormal Comms Module (Task 5)
- [x] 8 lessons: Conditional Crossing, Complex Holding, Amended Departure, Speed Then Altitude, Immediate Traffic, Multiple Crossing Restrictions, TCAS RA Override, Late Runway Change

---

## What's Left To Do

### Task 6: Emergency Basics Module (7 lessons, type: cloze)

| # | Lesson ID | Title | Key Fields |
|---|-----------|-------|------------|
| 1 | `mayday-declaration` | MAYDAY Declaration | station, callsign, nature, intentions, position, heading, fuel minutes, SOB (8 fields) |
| 2 | `pan-pan-declaration` | PAN PAN Declaration | addressee, callsign, position, nature, assistance, fuel, POB (7 fields) |
| 3 | `mayday-vs-panpan-fuel` | MAYDAY FUEL vs PAN PAN FUEL | call type decision, fuel state, callsign, request |
| 4 | `emergency-descent` | Emergency Descent | station, callsign, leaving level, squawk 7700 |
| 5 | `emergency-query-response` | ATC Emergency Query | fuel in MINUTES (not weight!), souls count (pax + crew) |
| 6 | `cancel-emergency` | Cancel Emergency | call type, reason, intentions |
| 7 | `emergency-squawk-codes` | Emergency Squawk Codes | squawk code (7700/7600/7500), associated phraseology |

**Add module to abnormal track:**
```typescript
{
  id: 'emergency-basics',
  title: 'Emergency · Basics',
  subtitle: 'MAYDAY, PAN PAN, squawk codes & fuel emergencies',
  art: gradientArt(['#e65100', '#ef6c00', '#f57c00']),
  lessons: emergencyBasicsLessons,
}
```

**ICAO standards to follow:**
- MAYDAY spoken 3 times (3 words), PAN PAN spoken 3 times (6 words)
- Fuel MUST be stated as time remaining, not weight
- Souls = everyone on board including crew
- MAYDAY FUEL = calculated usable fuel less than planned final reserve
- PAN PAN FUEL / MINIMUM FUEL = advisory, fuel above reserve but below planned
- 7700 = emergency, 7600 = radio failure (NORDO), 7500 = unlawful interference
- 7500 is NEVER cancelled by radio even if resolved (security protocol)

---

### Task 7: Emergency Scenario Flights (4 multi-step scenarios)

Uses same multi-step engine as Full Flight (`createScenarioSeries()`). Each scenario = 4-5 linked cloze lessons sharing scenario data.

| Scenario | Steps |
|----------|-------|
| **Medical Emergency** | Cruise check-in → PAN PAN declaration → ATC priority vectors readback → Approach clearance → Landing + ambulance |
| **Engine Failure** | MAYDAY declaration → Emergency descent → ATC vectors readback → ILS approach → Landing |
| **Fuel Emergency (Escalation)** | PAN PAN FUEL → ATC priority readback → MAYDAY FUEL upgrade → Direct vectors → Approach + landing |
| **Diversion** | Report problem → Request diversion → New clearance readback → Approach at alternate → Landing + taxi |

**Add module to abnormal track:**
```typescript
{
  id: 'emergency-scenarios',
  title: 'Emergency · Scenario Flights',
  subtitle: 'Multi-step emergency scenarios from onset to landing',
  art: gradientArt(['#ff6f00', '#ff8f00', '#ffa000']),
  lessons: emergencyScenarioLessons,
}
```

---

### Tasks 8-10: Decision Mode Engine (NEW exercise type for ATC Perspective)

This is the most complex remaining work — a completely new exercise type.

**New file to create:** `shared/learn/decision-types.ts`
```typescript
export type DecisionType = 'sequencing' | 'choice' | 'assignment' | 'priority'

export type FlightStrip = {
  callsign: string
  type: string           // aircraft type (A320, B777, C172)
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
  options?: string[]          // for choice type
  items?: string[]            // for sequencing/priority (drag & drop)
  correct: string | string[]  // correct answer(s)
  explanation: string         // shown after evaluation
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
```

**New component:** `app/components/learn/DecisionExercise.vue`
- Stripboard (left) — flight strip cards
- Decision area (right) — renders per step type:
  - `sequencing`: native HTML drag-and-drop list
  - `choice`: radio button group
  - `assignment`: dropdown per aircraft
  - `priority`: drag-and-drop ranking
- Scoring: Safety 60%, Correctness 30%, Efficiency 10%

**Integration:** `classroom.vue` needs conditional rendering:
- If `current.meta?.exerciseType === 'decision'` → render `<DecisionExercise>` instead of cloze UI
- Wire `@complete(score)` to same progress-saving logic

**`ModuleMeta` needs update:**
```typescript
export type ModuleMeta = {
  flightPlan?: boolean
  briefingArt?: string
  exerciseType?: 'cloze' | 'decision'
}
```

---

### Tasks 11-12: ATC Perspective Lessons (16 decision + 4 reverse sim)

**New file:** `shared/data/learnDecisionModules.ts`

**Module 1: Controller Workflow** (6 lessons)
1. Departure Sequencing — 3 aircraft, different wake/SIDs → drag into departure order
2. Arrival Spacing — 4 arrivals → order + assign base headings
3. Wake Turbulence Separation — Heavy/Medium/Light → pick correct separation times
4. Runway Conflict — departure, arrival, crosser → pick correct instruction
5. Frequency Priority — 8 aircraft incl. emergency → rank by priority
6. Weather Deviation — deviation request + conflicting traffic → approve/deny/alternative

**Module 2: Think Like ATC** (6 lessons)
1. Departure Puzzle — 2 aircraft same runway, different SIDs/categories → sequence + reasoning
2. Conflict Detection — 2 converging aircraft → who turns, what heading
3. Go-Around Call — aircraft on final, runway not clear → go-around or wait + vectors
4. Emergency Reshuffling — MAYDAY in approach sequence → reprioritize all
5. Taxi Conflict — 3 aircraft at intersection → hold/continue/reroute
6. Handoff Timing — climbing aircraft, busy next sector → when to handoff

**Module 3: Reverse Sim** (4 multi-step scenarios)
1. Busy Ground — 4 aircraft, pushback/taxi/landing conflicts
2. Tower Rush Hour — 3 departures + 2 arrivals + potential go-around
3. Approach Sequencing — 5 arrivals from all directions
4. Emergency Inbound — normal flow disrupted by MAYDAY

**Add as third track:**
```typescript
{
  id: 'atc-perspective',
  title: 'ATC Perspective Missions',
  subtitle: 'Understand, decide & control like ATC',
  modules: [
    { id: 'controller-workflow', ..., meta: { exerciseType: 'decision' } },
    { id: 'think-like-atc', ..., meta: { exerciseType: 'decision' } },
    { id: 'reverse-sim', ..., meta: { exerciseType: 'decision' } },
  ],
}
```

**Adapter needed:** Decision lessons have different shape than Cloze lessons. Either:
- Extend `ModuleDef` to accept both types
- Or wrap `DecisionLesson` into a `Lesson`-compatible shell with empty fields

---

### Tasks 13-15: Unlock System + Polish

**Cross-track unlock logic** (update `isModuleUnlocked` in classroom.vue):
- Core Track: sequential unlock as before
- Abnormal Track: unlocks after Fundamentals (`normalize`) + Readbacks (`arc`) completed
- ATC Perspective Track: unlocks after Advanced Calls (`decision-tree`) completed
- Within each track: sequential unlock

**Lesson search:** Should work automatically since `modules` computed is `tracks.flatMap(t => t.modules)`. Verify by searching "MAYDAY" etc.

**Integration test checklist:**
- [ ] Hub shows 3 track sections (once all are implemented)
- [ ] Each Cloze module opens and plays lessons correctly
- [ ] Multi-step Emergency Scenarios link steps with shared scenario data
- [ ] Decision Mode renders stripboard + decision area
- [ ] Scoring saves to server via API
- [ ] Unlock logic works cross-track

---

## Key Decisions & Lessons Learned

### Design Decisions
1. **Separate Tracks** (not flat list) — user chose this for clearer organization
2. **VATSIM Etiquette inside Abnormal track** — not its own track, fits thematically as "what's different on VATSIM"
3. **ATC Perspective as Interactive Sim** — user chose most ambitious option (not just quiz)
4. **Emergency exercises: progressive** — basics as cloze drills first, then multi-step scenarios

### Lessons Learned During Implementation
1. **Radio Check lesson was broken** — showed readability field that pilot can't know before controller responds. Fixed by removing readability, focusing on initiating the check call.
2. **Say Again was too subjective** — "clearance limit and routing" is just one possible answer. Fixed with concrete expected: "all before [SID name]".
3. **Monitor vs Contact had too-big initial-call field** — overwhelming for a lesson about one concept. Simplified to yes/no "do you transmit?" field.
4. **General principle:** Every field must be something the pilot ACTUALLY KNOWS from the ATC phrase. Don't ask for info the pilot has to guess or that comes later in the flow.

### ATC Conformity Sources
All phraseology verified against:
- ICAO Doc 9432, Annex 10
- CAP 413 (UK Radiotelephony Manual)
- EUROCONTROL Standard Phraseology
- VATSIM Code of Conduct + operational docs
- SKYbrary aviation safety references

Key rules enforced:
- Hold/Hold Short MUST be read back in full (ROGER/WILCO insufficient)
- Conditional clearances MUST include condition in readback
- MAYDAY 3x, PAN PAN 3x (6 words)
- TCAS RA > ATC instruction (pilot MUST refuse)
- Fuel: MAYDAY FUEL vs PAN PAN FUEL / MINIMUM FUEL
- Squawk codes: 7700/7600/7500
