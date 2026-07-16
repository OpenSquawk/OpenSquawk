# OpenSquawk WebSim — Browser-Based A320 Test Cockpit

## Context

OpenSquawk's `/live-atc` currently gets its flight data from a real MSFS bridge
app (`x-bridge-token` header → `POST /api/bridge/data` → the server maps
SimConnect-style fields into `FlightLabTelemetryState` and stores it per user;
`/live-atc?token=...` polls `GET /api/bridge/live` to mirror COM frequencies
and feed telemetry to the Python decision backend). Testing `/live-atc` today
requires MSFS running with the real bridge app. The user wants to test without
MSFS: a browser-only "WebSim" — a simplified A320 cockpit (PFD, map/ND, FCU)
that a tester can fly, which feeds the *exact same* bridge endpoints a real
bridge would, so the server and `/live-atc` cannot tell the difference. It
doubles as a lightweight teaching tool for FCU/PFD basics.

Confirmed via code reading that **no server-side changes are needed** — the
bridge protocol (`/api/bridge/connect`, `/data`, `/status`, `/live`,
`/command`, `/command-result`) already supports exactly this client shape.
This is purely a new frontend feature reusing existing infrastructure:
- `shared/composables/flightlab/useAirbusFBW.ts` — existing simplified normal-law
  flight model (pitch/roll/speed/altitude/VS), used today by `/flightlab/medienstationen/learn-pfd.vue`.
- `app/components/flightlab/pfd/*` — existing PFD components (attitude, speed
  tape, altitude tape, heading, VS, 3D aircraft model), driven by plain props.
- `app/pages/flightlab/medienstationen/stick-input.vue` — existing
  pointer-drag sidestick pattern to adapt (inline instead of cross-device WS).
- `server/api/bridge/data.post.ts` `mapBridgeTelemetry()` — defines the exact
  raw SimConnect-style field names (`ias_kt`, `altitude_ft_indicated`,
  `latitude_deg`, `longitude_deg`, `heading_deg`, `com_active_frequency`,
  `gear_handle`, `on_ground`, `eng_on`, `n1_pct`, `parking_brake`,
  `transponder_code`, `vertical_speed_fpm`, `groundspeed_kt`, `pitch_deg`)
  the WebSim's POST body must use.
- `shared/utils/simControl.ts` + `server/utils/simControlQueue.ts` — the
  frequency-sim-control command channel (pilot says "change my altitude to
  8000" on frequency → command queued → delivered on the next
  `/api/bridge/data` response's `commands` field → bridge executes → reports
  back via `POST /api/bridge/command-result`). WebSim should close this loop
  too, both for realism and to test that feature.

## User decisions (confirmed)

- **Autopilot is a must-have, manual free-flight is secondary.** FCU-driven
  autopilot (HDG/ALT/SPD hold) is the primary way to fly during a test;
  precise hand-flying fidelity is not a priority. Manual sidestick/throttle is
  still needed for ground ops (taxi, takeoff roll) and as an override.
- **Map: Leaflet + real OpenStreetMap tiles**, not an abstract scope — the
  bridge needs real lat/lon anyway, so may as well show them on a real map.
- **3D "look outside" view: very simple/abstract** — sky, ground, a runway
  strip near the aircraft when relevant. No real airport geometry.
- **ILS/LOC autoland with STAR arrival is required in v1**, not deferred.
  The autopilot must be able to sequence a STAR's waypoints (NAV mode), then
  capture localizer + glideslope (APPR mode) and fly down to touchdown +
  rollout deceleration.
- **Spawn presets (v1), all at EDDF (Frankfurt) and EDDS (Stuttgart):**
  1. EDDF approach, already established on the ILS (APPR captured), ~10 NM
     out — fast loop to test the landing/autoland phase on its own.
  2. EDDS approach, ~30 NM out, on a STAR arrival — tester engages NAV mode
     to sequence 2–3 STAR waypoints (with turns), which auto-transitions
     into APPR capture near the final approach fix.
  3. EDDF gate, cold & dark (engines off, parking brake set) — tester starts
     engines and taxis out.
  4. EDDF runway, lined up and ready for takeoff.

## Non-goals (v1)

- Real airport 3D scenery / textures — abstract exterior only.
- Full FCOM engine-start procedure — cold & dark spawn has one simplified
  "Start Engines" action that ramps N1 up over a few seconds.
- Multiplayer / shared sessions — each browser tab is its own user + bridge
  token, exactly like today's real-bridge model (people can each run their own
  WebSim tab simultaneously without interfering).
- Full FMS/CDU (no free-text route entry, no arbitrary STARs) — NAV mode
  only sequences the one hardcoded STAR per preset; APPR only captures the
  one hardcoded ILS per preset runway. This is "just enough" lateral/vertical
  automation to fly the four presets end-to-end, not a real FMS.

## Architecture

### 1. Flight model — `shared/composables/flightlab/useWebSimFlightModel.ts`

New composable, built on the same normal-law approach as `useAirbusFBW.ts`
(reuse its pitch/roll/speed integration for the airborne case) but extended
with what WebSim needs that `learn-pfd` never did:

- **Ground/air state machine.** On-ground: throttle → taxi speed (simple
  accel/decel, no bank), heading change proportional to stick roll axis ×
  taxi speed (nosewheel steering stand-in), pitch/bank locked to 0. Airborne:
  delegate to the existing FBW integration.
- **Position integration.** `lat/lon` updated every tick from heading +
  groundspeed using an equirectangular approximation (fine at test-flight
  scale). Seeded per spawn preset.
- **Engine state.** `OFF → STARTING (ramps N1 0→~55% idle over ~15s) →
  RUNNING`, triggered by a single "Start Engines" action. Cold & dark preset
  starts in `OFF`; the other three start `RUNNING`.
- **Autopilot layer.** Four modes, all driving the same synthetic
  stick/throttle inputs into the FBW step each tick via simple proportional
  controllers (heading error → roll command, altitude error → pitch command,
  speed error → throttle command) — same input surface the manual stick
  uses, so no mode needs a separate physics path. AP has no authority on the
  ground.
  - **SELECTED** (default when AP engaged): holds FCU `target_ias`/
    `target_hdg`/`target_alt` exactly as dialed — the HDG/ALT/SPD-hold case.
  - **NAV**: instead of a fixed HDG, target bearing is computed to the
    active STAR waypoint (`shared/data/websim/spawnPresets.ts`); crossing a
    waypoint's capture radius (~1 NM) advances to the next one and adopts
    its altitude constraint as the new ALT target. Falls back to SELECTED
    once the STAR is exhausted.
  - **APPR (armed → captured)**: armed by the tester (or auto-armed on the
    last STAR leg); captures once within the localizer/glideslope capture
    cone (course ±2.5°, vertical ±0.7° of the 3° glidepath from the runway
    threshold). Once captured, HDG target continuously tracks the localizer
    course (small correction proportional to lateral deviation) and ALT
    target tracks the glidepath altitude for the current distance-to-
    threshold — this is the "ILS" the STAR feeds into.
  - **AUTOLAND**: engages automatically once APPR is captured and inside
    ~200 ft radio altitude equivalent (derived from `altitude - threshold
    elevation`); flares (reduces descent rate near the ground), sets
    `on_ground = true` at touchdown, and applies deceleration (throttle to
    idle, simple brake drag) down to taxi speed. Control then reverts to
    manual/ground mode for rollout and taxi-in.
- **Systems state.** Gear handle, flaps index, parking brake, transponder
  code, COM1 active/standby — plain reactive fields toggled from a small
  panel.
- **Bridge field mapper.** A function turning model state into the exact raw
  field names `mapBridgeTelemetry()` (`server/api/bridge/data.post.ts`)
  expects, so the POST body round-trips losslessly.

### 2. Bridge client — `app/composables/useWebSimBridgeClient.ts`

- On mount: read or create a persistent token
  (`localStorage['osq_websim_bridge_token']`, `crypto.randomUUID()`).
- Once: `POST /api/bridge/connect` with that token header (page requires
  login, so the session cookie auth on that endpoint links token → current
  user — same call the real bridge-pairing flow uses).
- `setInterval` ~2s (mirrors `BRIDGE_POLL_INTERVAL_MS` used on the consumer
  side in `useSimBridgeSync.ts`): `POST /api/bridge/data` with the mapped
  telemetry; read the `commands` array from the response, apply each to the
  matching AP/systems target (`set_altitude`→AP alt target,
  `set_heading`→AP hdg target, `set_speed`→AP speed target,
  `setup_approach`→reposition using the airport preset data), then
  `POST /api/bridge/command-result` to resolve it (`ok`/`failed`).
- Occasional `POST /api/bridge/status` with `{ simConnected: true,
  flightActive: !onGround }`.
- Exposes `bridgeToken` and a computed `liveAtcUrl` (`/live-atc?token=...`)
  for an "open live-atc" button/link.

### 3. Page — `app/pages/flightlab/websim.vue`

`definePageMeta({ layout: false, middleware: ['require-auth'] })` (same auth
gating as `learn-pfd.vue`).

- **Spawn screen** (shown until a preset is picked): 4 cards from the preset
  data, each sets the flight model's initial state and starts the bridge
  client.
- **Cockpit layout** once flying:
  - Center: PFD via existing `FlightlabPfdContainer` (reused as-is — same
    props already used in `learn-pfd.vue`: pitch, bankAngle, heading, speed,
    altitude, verticalSpeed, visibleElements, scale).
  - Right: ND — Leaflet map (OSM tile layer), aircraft icon rotated to
    heading at `lat/lon`, short track trail.
  - Bottom strip: FCU — SPD/HDG/ALT/V-S value fields with +/- steppers, AP
    engage toggle, NAV button (engages STAR-sequencing mode), APPR button
    (arms LOC/GS capture) — each with armed/captured visual states matching
    real FCU conventions (blue = engaged, boxed = armed).
  - Small radio/systems panel: COM1 active/standby (click to swap — same
    semantics `useSimBridgeSync.ts` expects on the consumer side), squawk
    code, gear handle, parking brake, "Start Engines" (enabled only when on
    ground and engines off).
  - Sidestick pad: inline adaptation of `stick-input.vue`'s pointer-drag
    logic (pointerdown/move sets pitch/roll, release springs to center).
    `wheel` event over the same pad sets throttle (accumulate `deltaY`,
    clamp 0–1) — this replaces `stick-input.vue`'s separate throttle slider
    per the user's request. Disabled while AP is engaged, except a manual
    "override AP" toggle.
  - Exterior panel: three.js scene — sky gradient + ground plane tilted to
    current pitch/bank, and a flat runway rectangle drawn near the aircraft
    when within ~2 NM of a preset's runway threshold. No textures/assets
    beyond flat materials.
  - Bridge status indicator + "Open /live-atc in new tab" button using
    `liveAtcUrl`.

### 4. Spawn/airport data — `shared/data/websim/spawnPresets.ts`

Reference coordinates for EDDF and EDDS (ARP, runway threshold + course, one
gate) — public factual airport data, hardcoded. Each airport also gets one
hardcoded STAR: an ordered waypoint list (`{ lat, lon, altitude_ft }`)
ending near the final approach fix, feeding NAV mode. Runway threshold +
course + elevation feeds APPR/autoland (localizer course = runway heading,
glidepath = 3° from threshold elevation).

Four presets as decided above, each resolving to an initial
`useWebSimFlightModel` state (lat/lon, heading, altitude, speed, on_ground,
engine state, gear, flaps, parking brake, active AP mode):
1. EDDF 10 NM final — spawns with APPR already captured.
2. EDDS 30 NM out — spawns with NAV armed on the first STAR waypoint, off
   the runway axis so the STAR's turns are actually required.
3. EDDF gate, cold & dark — AP off, on ground, engines off.
4. EDDF runway ready for takeoff — AP off, on ground, engines running.

## New dependency

`leaflet` + `@types/leaflet` (MIT license) for the ND map — no map library
currently exists in the project.

## Verification

1. `yarn dev`, log in, open `/flightlab/websim`, pick each of the 4 spawn
   presets in turn.
2. Confirm telemetry is flowing: check `/bridge` (existing bridge status
   page) or `GET /api/bridge/live` with the WebSim's token.
3. Open `/live-atc?token=<websim token>` in a second tab — confirm the
   "Bridge connected" badge appears and COM1 active/standby mirror what's set
   in the WebSim radio panel.
4. Engage AP with a HDG/ALT/SPD target on the 30 NM EDDS preset, confirm the
   aircraft turns/climbs/descends toward target and the ND track updates.
5. From the `/live-atc` tab, trigger a frequency-sim-control voice command
   (e.g. "change my altitude to 8000") and confirm the WebSim's FCU altitude
   target updates and a command result round-trips back.
6. Full loop: fly the cold-and-dark EDDF gate preset — start engines, taxi,
   line up, take off, and confirm `/live-atc` receives ATC-triggering
   telemetry (on_ground transitions, etc.) throughout.

## Phase 2 (explicitly deferred)

- Shared/instructor multiplayer view (could reuse the existing
  `useFlightLabSync` WS session pattern from `learn-pfd`/`stick-input`).
- Richer 3D exterior scenery.
- More airports/spawns/STARs, or a freeform spawn builder.
- Free-text FMS route entry (v1's NAV/APPR only fly the one hardcoded STAR
  and ILS per preset airport).

## Implementation order

Given the scope, build and sanity-check bottom-up rather than top-down:
1. This design doc, committed.
2. Airport/STAR/spawn preset data (pure data, no dependencies).
3. `useWebSimFlightModel` — ground/air physics + AP modes (SELECTED → NAV →
   APPR → AUTOLAND) + bridge field mapper. Add `tests/shared/` unit tests for
   the pure tick math (waypoint sequencing, LOC/GS capture geometry, bridge
   field mapping) the same way `tests/shared/bridgeTelemetry.test.ts` covers
   the consumer-side mapper — this is the highest-risk, most bug-prone part
   and the only part practically unit-testable in isolation.
4. `useWebSimBridgeClient` (token + connect/data/status/command-result loop).
5. UI: sidestick pad → FCU panel → radio/systems panel → ND (Leaflet) →
   exterior (three.js) → spawn screen → page wiring.
6. `yarn dev` verification pass per the Verification section above.
