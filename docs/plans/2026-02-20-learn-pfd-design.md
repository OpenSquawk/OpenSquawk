# Learn PFD — Medienstation Design

## Overview

Interactive media station at `/flightlab/medienstationen/learn-pfd` that teaches Airbus A320 PFD reading and FBW Normal Law handling through progressive, hands-on lessons.

Users receive sidestick (pitch/roll) and throttle input via WebSocket from an external touchscreen (later: hardware via Python script). A PFD is built up element-by-element with TTS narration, and a 3D aircraft model reacts in real-time to the FBW physics output.

## Routing

```
/app/pages/flightlab/medienstationen/
  index.vue              ← Grid overview of all media stations
  learn-pfd.vue          ← PFD learning station (fullscreen)
```

## Learning Phases

Stepper-based, reusing FlightLab TTS + audio patterns.

| # | Phase | PFD Elements Visible | Focus | Interaction |
|---|-------|---------------------|-------|-------------|
| 1 | Willkommen | None (black) | 3D model large | Listen to intro |
| 2 | Horizont | Attitude indicator | Sky/ground, bank | "Roll left — watch the horizon" |
| 3 | Pitch | Attitude indicator | Pitch ladder, Normal Law | "Pull stick back — nose goes up. Let go — it holds." |
| 4 | Speed Tape | + Speed tape (left) | IAS, throttle effect | "Push throttle forward — speed increases" |
| 5 | Altitude Tape | + Altitude tape (right) | Altitude, climb | "You're climbing — watch altitude change" |
| 6 | Vertical Speed | + VS indicator | VS ↔ pitch relationship | "Pitch up more — VS increases" |
| 7 | Heading | + Heading band (bottom) | Heading, turns | "Bank right and watch heading change" |
| 8 | Zusammenspiel | All elements | Combined reading | Mini-tasks: "Climb to 5000ft", "Turn to heading 270" |
| 9 | Freies Üben | All elements | Free practice | Optional takeoff scenario |

Each phase: TTS explains → element fades in (animated) → user interacts → next button or auto-advance.

## Architecture

### Tech Stack

- **PFD**: SVG-based Vue components (one per instrument)
- **3D Model**: Three.js with GLTF A320 model
- **FBW Physics**: `useAirbusFBW()` composable — 60fps simulation loop
- **Input**: WebSocket via existing `/api/flightlab/ws` with new message type
- **Audio/TTS**: Reuse `useFlightLabAudio()` composable
- **Stepper**: Reuse pattern from `takeoff.vue` (sidebar phases, progress)

### PFD Components

```
app/components/flightlab/pfd/
  PfdContainer.vue              ← Orchestrates visibility per phase
  PfdAttitudeIndicator.vue      ← Artificial horizon, pitch ladder, bank scale
  PfdSpeedTape.vue              ← Scrolling speed scale, speed bug, trend
  PfdAltitudeTape.vue           ← Scrolling altitude scale, alt bug
  PfdVerticalSpeed.vue          ← VS scale with needle/band
  PfdHeadingIndicator.vue       ← Rotating compass band
```

All receive flight state as props from FBW composable output.

### FBW Composable (`useAirbusFBW`)

```
shared/composables/flightlab/useAirbusFBW.ts
```

**Input:** `{ pitch: -1..+1, roll: -1..+1, throttle: 0..1 }`

**Normal Law simulation:**
- Pitch stick → target load factor (1G neutral, ~2.5G full back, ~-1G full forward)
- Pitch rate derived from current-G vs target-G delta
- Roll stick → roll rate (max ~15°/s), neutral holds bank angle
- Bank > 33° with stick neutral → slow rollback to 33°
- Protections: max 67° bank, alpha floor (simplified)
- Throttle → thrust → acceleration (simplified drag model)
- Derived: altitude (integrated VS), heading (from bank + speed), VS (from pitch + speed)

**Output (reactive):**
```typescript
{
  pitch: number,           // degrees
  roll: number,            // degrees (bank angle)
  heading: number,         // 0-360
  speed: number,           // knots IAS
  altitude: number,        // feet
  verticalSpeed: number,   // fpm
  bankAngle: number,       // degrees
  aoa: number,             // angle of attack
  throttlePercent: number  // 0-100
}
```

### 3D Aircraft Model

```
app/components/flightlab/pfd/PfdAircraftModel.vue
```

- Three.js canvas with GLTF A320 model
- Camera: slightly above/behind, follows aircraft
- Model rotation mirrors FBW output (pitch, roll, heading)
- Simple sky gradient + cloud layer for motion reference
- Responsive sizing via container

### WebSocket Input

Extends existing `/api/flightlab/ws` with new message type:

```typescript
// From touchscreen/Python to server
{ type: 'stick-input', data: { pitch: number, roll: number, throttle: number } }

// Server broadcasts to PFD client in same session
{ type: 'stick-input', data: { pitch: number, roll: number, throttle: number } }
```

No new WS endpoint needed — reuses session infrastructure.

### Dynamic Layout

Layout shifts based on current phase, animated via CSS Grid transitions:

**Phase 1-3 (intro/horizon/pitch):** 3D model 70%, PFD overlay small
**Phase 4-7 (instruments):** PFD 50%, 3D model 50% side by side
**Phase 8-9 (practice):** PFD 70%, 3D model 30%

Transitions: animated `grid-template-columns` + opacity/transform.

### Scenario Data

```
shared/data/flightlab/learn-pfd.ts
```

Phase definitions following existing `FlightLabPhase` pattern with extensions for:
- `visiblePfdElements: string[]` — which PFD components to show
- `layoutMode: 'model-focus' | 'split' | 'pfd-focus'` — dynamic layout
- `interactionGoal?: { type, target, tolerance }` — e.g. "reach altitude 5000±200"

## Medienstationen Index

Grid of cards (like `/flightlab/index.vue`). Each card:
- Title, description, icon
- Status badge (ready / coming soon)
- Click navigates to station page

First entry: "PFD verstehen" — learn-pfd station.
