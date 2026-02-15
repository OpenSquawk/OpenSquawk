# Classroom Expansion Design — New Training Tracks

**Date:** 2025-02-15
**Status:** Draft

## Overview

Expand the Classroom from a single linear module list into a **Track-based** system with 3 tracks, adding Abnormal & Emergency training and an ATC Perspective mode for comprehensive VATSIM preparation.

## Hub Architecture

The Mission Hub gets a new **Track** concept. Tracks are vertically stacked sections, each containing their own modules.

### Track Layout

```
┌────────────────────────────────────────────────┐
│  CORE FLIGHT MISSIONS                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  │Fundament.│ │Readbacks │ │Advanced  │ │Full Flt  │
│  │          │ │          │ │Calls     │ │Gate-Gate │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘
├────────────────────────────────────────────────┤
│  ABNORMAL & EMERGENCY MISSIONS                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  │VATSIM    │ │Abnormal  │ │Emergency │ │Emergency │
│  │Essentials│ │Comms     │ │Basics    │ │Scenarios │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘
├────────────────────────────────────────────────┤
│  ATC PERSPECTIVE MISSIONS                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐
│  │Controller│ │Think Like│ │Reverse   │
│  │Workflow  │ │ATC       │ │Sim       │
│  └──────────┘ └──────────┘ └──────────┘
└────────────────────────────────────────────────┘
```

### Data Model Changes

```typescript
// New: Track definition wrapping modules
type TrackDef = {
  id: string          // 'core' | 'abnormal' | 'atc-perspective'
  title: string
  subtitle: string
  modules: ModuleDef[]
}

// ModuleDef stays as-is for Cloze modules
// New: ModuleDef.meta gets optional exerciseType
type ModuleMeta = {
  flightPlan?: boolean
  briefingArt?: string
  exerciseType?: 'cloze' | 'multi-step' | 'decision'  // NEW
}
```

### Unlock System

- Tracks unlock independently (no cross-track dependencies)
- Within each track, modules unlock sequentially as before
- Core Flight Track is unlocked by default
- Abnormal & Emergency Track unlocks after completing Fundamentals + Readbacks in Core
- ATC Perspective Track unlocks after completing Advanced Calls in Core

---

## Track 1: Core Flight Missions (unchanged)

Existing 4 modules stay exactly as they are, just grouped under the "Core Flight Missions" track header:

1. **Fundamentals - Basics** (9 lessons)
2. **Readbacks - Essential Calls** (20+ lessons)
3. **ATC - Advanced Calls** (19+ lessons)
4. **Full Flight - Gate to Gate** (multi-step with briefing)

---

## Track 2: Abnormal & Emergency Missions

### Module 1: VATSIM Essentials (6 lessons, type: cloze)

Uses existing Cloze exercise engine. Each lesson has multiple meaningful fields.

#### Lesson 1: Unicom Blind Call
- **Situation:** No ATC online, pilot approaching/departing an airport
- **Task:** Construct complete blind call from scratch
- **Readback template:** `[Callsign], [ICAO] Traffic, [position description], [intention]`
- **Fields:** callsign (pre-filled), ICAO code, position (e.g. "10 miles south"), intention (e.g. "inbound runway 25L")
- **Why valuable:** Pilots must build the entire call themselves — no ATC prompt to react to

#### Lesson 2: Radio Check & Readability
- **ATC phrase:** Controller responds with readability rating
- **Task (2 parts):**
  1. Construct radio check call: `[Station], [Callsign], radio check [frequency]`
  2. Parse readability response and confirm: `Readability [number], [Callsign]`
- **Fields:** station name, callsign, frequency, readability number
- **Why valuable:** Frequency must be spoken correctly (e.g. "one two one decimal niner zero five"), readability scale 1-5

#### Lesson 3: Say Again (Targeted Request)
- **ATC phrase:** A clearance with a portion deliberately garbled/missing: e.g. "Cleared to... [blocked] ...via COLA 1W departure, squawk 4521"
- **Task:** Pilot requests the specific missing part
- **Readback template:** `[Callsign], say again [specific part]`
- **Fields:** "say again" target (e.g. "clearance limit", "all before squawk", "routing")
- **Info:** Teaches targeted say-again vs lazy "say again all" — proper phraseology is "say again all before [word]" or "say again [element]"
- **Why valuable:** Knowing WHAT to ask for is the real skill

#### Lesson 4: Monitor vs Contact
- **ATC phrase:** Randomized — either "Monitor Tower 118.1" or "Contact Tower 118.1"
- **Task:** Pilot must respond correctly based on which word was used
  - Monitor: Just switch frequency, listen, do NOT transmit
  - Contact: Switch + make initial call: `[Station], [Callsign], [altitude/position], information [ATIS]`
- **Fields:** For "Contact" — station, callsign, altitude, ATIS code. For "Monitor" — just frequency readback
- **Why valuable:** Most common VATSIM beginner mistake — calling in when told to monitor

#### Lesson 5: Two-Step Frequency Change
- **ATC phrase:** "Climb flight level 350, contact London Control 128.050"
- **Task (2 steps):**
  1. Readback: `Climb flight level 350, contact London Control 128.050, [Callsign]`
  2. Initial call on new frequency: `London Control, [Callsign], climbing flight level 350, information [ATIS]`
- **Fields:** altitude, facility name, frequency, callsign, ATIS code
- **Why valuable:** Two combined instructions + building the initial call on the new freq

#### Lesson 6: ATIS Update During Taxi
- **ATC phrase:** "Information now DELTA, QNH 1002, wind changed 170 at 15, runway changed to 18 left"
- **Readback template:** `Information DELTA, QNH [value], runway [number], [Callsign]`
- **Fields:** ATIS letter, QNH value, new runway
- **Why valuable:** Must extract safety-critical items (QNH, runway) from a dense transmission while taxiing

---

### Module 2: Abnormal Comms (8 lessons, type: cloze)

#### Lesson 1: Conditional Runway Crossing
- **ATC:** "Behind the departing 737, cross runway 09 at ECHO, behind"
- **Readback:** `Behind the departing 737, cross runway [number] at [intersection], behind, [Callsign]`
- **Fields:** traffic type, runway, intersection
- **ICAO requirement:** Condition MUST be in readback. "Behind" MUST appear at end. WILCO/ROGER are INSUFFICIENT.

#### Lesson 2: Complex Holding Pattern
- **ATC:** "Hold east of BARDI, inbound course 270, right turns, 1 minute legs, expect further clearance 1745"
- **Readback:** `Hold [direction] of [fix], inbound [course], [turn direction] turns, [leg time] minute legs, expect further clearance [time], [Callsign]`
- **Fields:** direction, fix name, inbound course, turn direction, leg time, EFC time (6 fields)
- **Why valuable:** Holding clearances are the most information-dense single transmission in ATC

#### Lesson 3: Amended Departure Clearance
- **ATC:** "Amended clearance: Cleared to [destination] via DOVEY 2 ECHO departure, climb via SID except maintain 5000, expect FL340 ten minutes after departure, departure frequency 124.2, squawk 4521"
- **Readback:** Full readback of all elements
- **Fields:** destination, SID name, altitude restriction, expect altitude, departure freq, squawk (6+ fields)

#### Lesson 4: Speed Then Altitude (Sequenced Instructions)
- **ATC:** "Reduce speed 210 knots, then descend and maintain flight level 240"
- **Readback:** `Reduce speed [speed], then descend [level], [Callsign]`
- **Fields:** speed, level
- **Info hint:** "then" = sequential execution. Speed reduction FIRST, descent SECOND. Simultaneous is incorrect.

#### Lesson 5: Immediate Traffic Avoidance
- **ATC:** "Turn left IMMEDIATELY heading 270, traffic 12 o'clock, 3 miles, opposite direction, same level"
- **Readback:** `Turn left immediately heading [heading], [Callsign]`
- **Fields:** turn direction, heading
- **Info hint:** "IMMEDIATELY" = execute while reading back. Traffic info is advisory, heading is mandatory.

#### Lesson 6: Multiple STAR Crossing Restrictions
- **ATC:** "Descend via the STAR, cross LIPSO at or above flight level 100, cross VAMPS at 6000"
- **Readback:** `Descend via STAR, cross [fix1] at or above [alt1], cross [fix2] at [alt2], [Callsign]`
- **Fields:** fix1, restriction type ("at or above"), altitude1, fix2, altitude2 (5 fields)
- **Why valuable:** Different restriction types at different fixes — "at or above" vs "at" is frequently confused

#### Lesson 7: TCAS RA Override
- **Step 1 — ATC:** "Descend and maintain flight level 340"
- **Pilot (TCAS says CLIMB):** `Unable, TCAS RA, [Callsign]`
- **Step 2 — After resolution:** `[Callsign], clear of conflict, returning to [level]`
- **Fields:** rejection phrase ("Unable, TCAS RA"), original level
- **Why valuable:** Pilots MUST reject ATC instructions when TCAS RA conflicts. Beginners almost never do this.

#### Lesson 8: Late Runway Change on Approach
- **ATC:** "Cancel approach runway 27R, turn right heading 360, vectors runway 09L, descend 3000"
- **Readback:** `Cancel approach [old runway], right heading [heading], vectors [new runway], descend [altitude], [Callsign]`
- **Fields:** old runway, heading, new runway, altitude (4 fields)

---

### Module 3: Emergency Basics (7 lessons, type: cloze)

#### Lesson 1: MAYDAY Declaration
- **Situation:** Engine fire over the North Sea at FL370
- **Task:** Pilot builds complete MAYDAY call from scratch (no ATC prompt)
- **Template:** `MAYDAY MAYDAY MAYDAY, [station], [callsign], [nature], [intentions], position [distance] [direction] of [fix], heading [heading], fuel [minutes] minutes, [number] souls on board`
- **Fields:** station, callsign, nature of emergency, intentions, position, heading, fuel (minutes), souls on board (8 fields)
- **ICAO reference:** Doc 9432, Annex 10 — MAYDAY spoken 3 times, then structured message

#### Lesson 2: PAN PAN Declaration
- **Situation:** Passenger medical emergency at FL350
- **Task:** Pilot builds complete PAN PAN call
- **Template:** `PAN PAN PAN PAN PAN PAN, [station/ALL STATIONS], [callsign], [position], [nature], request [assistance], fuel [time], [number] souls on board`
- **Fields:** addressee, callsign, position, nature, requested assistance, fuel, POB (7 fields)
- **ICAO note:** PAN PAN spoken 3 times (6 words total). Urgency, NOT distress.

#### Lesson 3: MAYDAY FUEL vs PAN PAN FUEL
- **Situation:** Scenario describes specific fuel state (e.g. "Fuel remaining: 35 min, planned final reserve: 30 min")
- **Task:** Pilot must DECIDE which call applies + construct it
  - Fuel < final reserve → MAYDAY FUEL
  - Fuel above reserve but below planned → PAN PAN FUEL (minimum fuel)
- **Fields:** Call type (MAYDAY/PAN PAN), fuel state, callsign, request
- **ICAO reference:** "MINIMUM FUEL" = advisory. "MAYDAY FUEL" = calculated usable fuel less than planned final reserve.

#### Lesson 4: Emergency Descent
- **Situation:** Cabin depressurization at FL370
- **Task:** Announce emergency descent + squawk
- **Template:** `MAYDAY MAYDAY MAYDAY, [station], [callsign], cabin depressurization, emergency descent, leaving [level], squawk 7700`
- **Fields:** station, callsign, leaving level, squawk code

#### Lesson 5: ATC Emergency Query Response
- **ATC:** "State fuel remaining and souls on board"
- **Readback:** `[Callsign], fuel [number] minutes, [number] souls on board`
- **Fields:** fuel in MINUTES (not kg/lbs!), souls count (passengers + crew)
- **Info hint:** Fuel MUST be stated as time remaining, not weight. Souls = everyone on board including crew.

#### Lesson 6: Cancel Emergency
- **Situation:** Engine restarted, situation resolved
- **Template:** `[Station], [Callsign], cancel [MAYDAY/PAN PAN], [reason], request [intentions]`
- **Fields:** call type to cancel, reason (e.g. "engine restarted"), intentions (e.g. "continue to destination")

#### Lesson 7: Emergency Squawk Codes
- **Task:** Scenario-based — situation described, pilot selects correct squawk + makes the call
  - 7700 = General Emergency
  - 7600 = Radio Failure (NORDO)
  - 7500 = Unlawful Interference (Hijack)
- **Fields:** squawk code, associated phraseology
- **Info:** 7500 is NEVER cancelled by radio even if situation resolves (security protocol)

---

### Module 4: Emergency Scenario Flights (4 scenarios, type: multi-step)

Uses the same multi-step engine as Full Flight. Each scenario is a linked sequence of 4-6 cloze exercises telling a coherent emergency story. Scenario data is generated the same way (random airline, airports, etc.).

#### Scenario 1: Medical Emergency
1. Normal cruise check-in with Center
2. PAN PAN Declaration (full — 7 fields)
3. ATC gives priority vectors → readback (heading, altitude, frequency)
4. Approach clearance readback (runway, approach type, altitude)
5. Landing clearance + "Confirm ambulance standing by"

#### Scenario 2: Engine Failure
1. MAYDAY Declaration (full — 8 fields)
2. Emergency descent coordination (leaving level, descending to, heading)
3. ATC vectors to nearest suitable → readback (heading, altitude, distance)
4. ILS approach clearance readback
5. Landing clearance

#### Scenario 3: Fuel Emergency (Escalation)
1. PAN PAN FUEL declaration (minimum fuel state)
2. ATC acknowledges, gives priority sequencing → readback
3. Fuel situation worsens → upgrade to MAYDAY FUEL
4. Direct-to vectors → readback (direct fix, descend altitude)
5. Approach + landing clearance

#### Scenario 4: Diversion
1. Report technical problem / weather issue to ATC
2. Request diversion: "[Callsign], request diversion to [alternate]"
3. ATC issues completely new clearance (new destination, routing, altitude) → full readback
4. Approach at alternate airport → readback
5. Landing + taxi-in at unfamiliar airport

---

## Track 3: ATC Perspective Missions

### New Exercise Type: Decision Mode

This track introduces a new exercise engine separate from Cloze. The UI shows a traffic situation and the pilot makes controller-like decisions.

#### UI Layout
```
┌─────────────────────────────────────────────────────┐
│  SITUATION BRIEFING                                  │
│  "You are Munich Approach. 4 arrivals inbound,       │
│   runway 26L in use, wind 250/12..."                │
├──────────────┬──────────────────────────────────────┤
│  STRIPBOARD  │  DECISION AREA                       │
│              │                                      │
│  DLH456  ▼   │  Multiple Choice / Drag-Drop         │
│  A320        │  sequencing / heading assignment      │
│  FL120       │                                      │
│  HDG 090     │  ┌─────────────────────────────┐     │
│              │  │  Your decision + reasoning  │     │
│  BAW22   ▼   │  └─────────────────────────────┘     │
│  B777        │                                      │
│  FL150       │  [SUBMIT]                            │
│  HDG 180     │                                      │
├──────────────┴──────────────────────────────────────┤
│  EVALUATION: Safety 60% | Correctness 30% | Eff 10% │
└─────────────────────────────────────────────────────┘
```

#### Decision Types
1. **Sequencing** — Drag & drop aircraft into landing/departure order
2. **Choice** — Multiple choice: which clearance/instruction is correct?
3. **Assignment** — Select heading/altitude/speed for specific aircraft
4. **Priority** — Rank aircraft by priority (emergency > approach > departure > taxi)

#### Evaluation Scoring
- **Safety (60%):** No conflicts created? Emergency prioritized? Separation maintained?
- **Correctness (30%):** Is the sequence/decision ATC-standard? Wake turbulence respected?
- **Efficiency (10%):** Minimal unnecessary delays? Reasonable flow?

### Module 1: Controller Workflow (6 lessons — "Understand the Controller")

Pilot observes/analyzes ATC decisions. Lighter exercises to build understanding.

| # | Title | Situation | Decision Type |
|---|-------|-----------|---------------|
| 1 | **Departure Sequencing** | 3 aircraft want to depart. Different SIDs, different wake categories (Heavy, Medium, Light). | Sequencing: drag into correct departure order. Must respect wake turbulence (Light before Heavy avoids waiting) and SID conflicts (same SID = extra separation) |
| 2 | **Arrival Spacing** | 4 arrivals on different headings/altitudes approaching from different directions | Sequencing + Assignment: order the arrivals, assign base turn headings |
| 3 | **Wake Turbulence Separation** | Heavy (B747) followed by Medium (A320) followed by Light (C172) on ILS | Choice: what are the minimum separation times? Heavy-Medium = 2min, Heavy-Light = 3min, Medium-Light = 3min |
| 4 | **Runway Conflict** | Departure holding at runway, arrival on 3nm final, crossing traffic needs to cross | Choice: Hold the crosser? Send departure? Tell arrival to go around? |
| 5 | **Frequency Priority** | 8 aircraft on frequency: 1 emergency, 2 on approach, 3 taxiing, 2 requesting pushback | Priority: rank who gets answered first |
| 6 | **Weather Deviation** | Aircraft requests 20nm left deviation for weather, but conflicting traffic on that route | Choice: approve deviation? Deny with reason? Offer alternative? |

### Module 2: Think Like ATC (6 lessons — "Make the Decision")

Pilot IS the controller. More complex scenarios with multiple correct elements.

| # | Title | Situation | Decision Type |
|---|-------|-----------|---------------|
| 1 | **Departure Puzzle** | 2 aircraft, same runway. A = Heavy/SID North, B = Light/SID South | Sequencing + reasoning: B first (diverging SIDs eliminate wake wait), then A |
| 2 | **Conflict Detection** | 2 aircraft converging, same altitude, 15nm apart, closing at 600kts combined | Assignment: which one turns? What heading? (Turn the one with less traffic behind them) |
| 3 | **Go-Around Call** | Aircraft on 2nm final, previous aircraft still on runway at taxiway exit | Choice: wait 10 more seconds (aircraft almost clear)? Or go-around now? + assign heading/altitude for the go-around |
| 4 | **Emergency Reshuffling** | 4 aircraft in approach sequence, #3 declares MAYDAY | Priority + Assignment: MAYDAY becomes #1, others get holds/new vectors |
| 5 | **Taxi Conflict** | 3 aircraft on intersecting taxiways approaching same intersection simultaneously | Assignment: who holds short, who continues, alternate routing? |
| 6 | **Handoff Timing** | Aircraft climbing through your sector, next sector controller has 8 aircraft already | Choice: handoff now (early, adds to their load), handoff at boundary (standard), or hold in your sector and coordinate? |

### Module 3: Reverse Sim (4 scenarios — "You Are the Controller")

Multi-step interactive scenarios. Each has 4-6 decision steps that build on each other.

#### Scenario 1: Busy Ground
- **Setup:** Airport ground view. 2 aircraft requesting pushback, 1 requesting taxi to runway, 1 landed wanting taxi to gate
- **Steps:**
  1. Assign pushback sequence (who first based on stand position)
  2. Route taxi-to-runway aircraft (avoid conflict with pushback)
  3. Route landed aircraft to gate (avoid all moving traffic)
  4. Handle new pushback request that conflicts with taxi route

#### Scenario 2: Tower Rush Hour
- **Setup:** Tower view. 3 departures ready, 2 arrivals on ILS (8nm and 4nm)
- **Steps:**
  1. Clear first departure (gap before arrivals)
  2. First arrival: clear to land or go around?
  3. Second arrival sequencing
  4. Handle go-around if issued (heading + altitude)
  5. Fit remaining departures between arrivals

#### Scenario 3: Approach Sequencing
- **Setup:** Radar view. 5 arrivals from N/S/E/W, different altitudes and distances
- **Steps:**
  1. Assign initial descent altitudes
  2. Assign base headings for downwind
  3. Determine landing sequence (consider distance, speed, wake turbulence)
  4. Turn aircraft to final approach (spacing)
  5. Transfer to tower frequency

#### Scenario 4: Emergency Inbound
- **Setup:** Normal approach sequence with 3 aircraft, then MAYDAY call
- **Steps:**
  1. Acknowledge MAYDAY
  2. Clear path: hold/vector other traffic away
  3. Give emergency aircraft direct vectors
  4. Coordinate: clear runway, alert emergency services
  5. Resume normal operations after emergency lands

---

## Technical Implementation Notes

### Track System
- `learnModules` array becomes `learnTracks: TrackDef[]`
- Each track has its own progress bar (aggregate of module progress)
- Hub renders tracks as vertical sections with horizontal module rows
- Backward compatible: existing progress data maps to Core track modules

### Decision Mode Engine (new)
- New component: `DecisionExercise.vue` (parallel to existing Cloze renderer)
- Scenario data format for decisions:
  ```typescript
  type DecisionScenario = {
    briefing: string
    strips: FlightStrip[]
    steps: DecisionStep[]
  }

  type FlightStrip = {
    callsign: string
    type: string        // aircraft type
    altitude: string
    heading: string
    position: string
    intention: string
    category: 'heavy' | 'medium' | 'light'
    status: 'emergency' | 'normal'
  }

  type DecisionStep = {
    prompt: string
    type: 'sequencing' | 'choice' | 'assignment' | 'priority'
    options?: string[]           // for choice type
    items?: string[]             // for sequencing/priority (drag & drop)
    correct: string | string[]   // correct answer(s)
    explanation: string          // shown after evaluation
    safetyWeight: number
    correctnessWeight: number
    efficiencyWeight: number
  }
  ```

### Multi-Step Emergency Scenarios
- Reuse existing Full Flight multi-step engine
- Same `createScenarioSeries()` infrastructure
- Add emergency-specific scenario fields (emergencyProblem, emergencyIntent already exist in Scenario type)
- New scenario generators for emergency contexts

### Lesson Count Summary
| Track | Module | Lessons | Type |
|-------|--------|---------|------|
| Core Flight | Fundamentals | 9 | cloze |
| Core Flight | Readbacks | 20+ | cloze |
| Core Flight | Advanced Calls | 19+ | cloze |
| Core Flight | Full Flight | varies | multi-step |
| Abnormal & Emergency | VATSIM Essentials | 6 | cloze |
| Abnormal & Emergency | Abnormal Comms | 8 | cloze |
| Abnormal & Emergency | Emergency Basics | 7 | cloze |
| Abnormal & Emergency | Emergency Scenarios | 4 | multi-step |
| ATC Perspective | Controller Workflow | 6 | decision |
| ATC Perspective | Think Like ATC | 6 | decision |
| ATC Perspective | Reverse Sim | 4 | decision (multi-step) |
| **Total** | **11 modules** | **~89+ new lessons** | |

### ATC Conformity Sources
All phraseology verified against:
- ICAO Doc 9432 (Radiotelephony Manual)
- ICAO Annex 10 (Aeronautical Telecommunications)
- CAP 413 (UK Radiotelephony Manual)
- EUROCONTROL Standard Phraseology
- VATSIM Code of Conduct and operational documentation
- SKYbrary aviation safety references

Key standards enforced:
- Hold/Hold Short MUST be read back in full (ICAO) — ROGER/WILCO insufficient
- Conditional clearances MUST include the condition in readback
- MAYDAY spoken 3 times, PAN PAN spoken 3 times (6 words)
- TCAS RA takes priority over ATC instructions (pilot MUST refuse conflicting ATC)
- Fuel: MAYDAY FUEL (below final reserve) vs PAN PAN FUEL / MINIMUM FUEL (advisory)
- Emergency squawk codes: 7700 (emergency), 7600 (radio failure), 7500 (unlawful interference)
