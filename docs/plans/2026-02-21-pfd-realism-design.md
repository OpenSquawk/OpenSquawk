# PFD Realism & Training Improvements

## Context

Comparing the simulator PFD to the real Airbus A320 PFD reveals styling inaccuracies in the elements we use. Additionally, the flight physics react too quickly (no inertia), and the speed-hold exercise doesn't teach energy management effectively. Pitch/bank exercises use values outside normal flight envelopes.

## 1. PFD Styling Corrections

### Attitude Indicator
- Sky: gradient `#0a4a8a` (top) → `#22a7eb` (horizon) instead of flat `#22a7eb`
- Ground: gradient `#b26113` (horizon) → `#5a2e08` (bottom) instead of flat `#b26113`
- Aircraft symbol: make W-shaped (small droop at wing ends)

### Speed Tape
- Background: `#16181f` instead of `#93959c`
- Inner rect: `#1c1e26`, border `#3a3d48` instead of `#93959c`/`#d2d4da`
- Readout text/border: green `#19e34a` instead of cyan `#2fe5ff`

### Altitude Tape
- Same dark background as speed tape
- Readout: green instead of cyan
- Tick marks on LEFT side (toward attitude indicator), labels right of ticks

### Vertical Speed
- Channel fill: darken to match tape style
- Already uses green — correct

### Heading Indicator
- Background: dark (`#16181f`) instead of `#8f9198`/`#94969d`
- Inner: `#1c1e26` with border `#3a3d48`
- Yellow readout stays (correct for selected heading on Airbus)

## 2. Realistic Flight Handling

### Pitch Inertia
- `PITCH_RATE_PER_G_DELTA`: 3.5 → 1.2 (3x slower response)
- Add exponential smoothing on pitch rate (tau ~2s) so changes ramp up gradually

### Roll Inertia
- `MAX_ROLL_RATE`: 15 → 7 deg/s
- `ROLL_RETURN_RATE`: 5 → 2 deg/s

### Speed-Pitch Coupling
- `SPEED_PITCH_COUPLING`: 1.2 → 2.0 (pitch changes affect speed more, forcing planning)

## 3. Training Exercise Improvements

### Pitch/Bank: Normal Ranges
- `horizon_intro` bank target: -20° → -10° (tolerance 8°)
- `horizon_roll_right` bank target: 20° → 10° (tolerance 8°)
- `pitch_intro` target: 10° → 4° (tolerance 3°)
- `pitch_down` target: -5° → -3° (tolerance 3°)
- ATC messages emphasize small, gentle inputs

### Speed Tape: Correct Color Semantics
- Target hold zone: cyan/turquoise (NOT red — red = danger on real PFD)
- Add VFE (overspeed) red band at top (~340 kts)
- Add minimum speed red band at bottom (~130 kts)
- Red bands only visible when approaching dangerous speeds

### Speed Exercise: Multi-Phase
Split single `speed_hold_pitch` into 4 phases:

1. **`speed_explain`** — Explanation only. "Beim Airbus kontrollierst du Geschwindigkeit mit Pitch. Nase hoch = langsamer, Nase runter = schneller." Button: "Verstanden".

2. **`speed_set_throttle`** — Set throttle to 70% (existing phase, unchanged).

3. **`speed_hold_coarse`** — Coarse hold: speed 215-235 kts, hold 5s. Wide tolerance, first success.

4. **`speed_hold_fine`** — Fine hold: speed 225 ±5 kts, hold 8s. ATC emphasizes tiny corrections only.

Update `goalNextPhase` mapping accordingly:
- `speed_intro` → `speed_explain` (was → `speed_hold_pitch`)
- `speed_explain` → `speed_set_throttle` (new, button-driven)
- `speed_set_throttle` → `speed_hold_coarse` (new)
- `speed_hold_coarse` → `speed_hold_fine` (new)
- `speed_hold_fine` → `alt_intro` (was `speed_hold_pitch` → `alt_intro`)

Also update `mainPhaseIds` to include new speed phases for progress tracking.
