# Phraseology Realism & Taxi Fine-Tuning — Implementation Plan

> **For Claude:** Execute sequentially in-session (user rule: no subagents).
> Design: docs/plans/2026-07-19-phraseology-taxi-finetune-design.md

**Goal:** Stations sound like distinct controllers with realistic pacing and
squelch noise; taxi clearances stop skipping segments / producing nonsense.

**Architecture:** Logical voice ids stay the existing `voicePool.ts` names
(OpenAI-style). A server-side registry maps them to Speaches/Piper model+voice
pairs only when the Speaches provider is active — the same client code works on
both providers. Client assigns a persona (voice + base speed + jitter) per ATC
position via the existing hash infrastructure. Radio effects gain squelch
open/close transients. The Python repo gets an offline-cachable sweep harness
over German major airports whose findings become fixes + regression tests.

**Tech stack:** Nuxt 4 / H3 / Web Audio (PizzicatoLite), Speaches (Piper),
Python 3 + pytest + Overpass.

---

## AP1 — OpenSquawk (Nuxt)

### Task 1: Server voice registry (Speaches mapping)

**Files:**
- Create: `server/utils/voiceRegistry.ts`
- Test: `server/utils/voiceRegistry.test.ts` (tsx --test convention)
- Modify: `server/api/atc/say.post.ts` (speaches branch + cache key)

Registry maps logical voice → `{ model: 'speaches-ai/piper-<v>', voice: '<v>' }`:

| logical | piper voice |
|---|---|
| alloy | en_US-ryan-medium |
| echo | en_GB-alan-medium |
| onyx | en_US-john-medium |
| sage | en_GB-jenny_dioco-medium |
| verse | en_US-lessac-medium |
| ash | en_US-joe-medium |
| ballad | en_GB-northern_english_male-medium |
| coral | en_US-amy-medium |
| fable | en_US-danny-low |
| nova | en_US-hfc_female-medium |
| shimmer | en_US-kristin-medium |

`resolveSpeachesVoice(logical, fallback: {model, voice})` returns the mapped
pair, or the fallback (env `SPEECH_MODEL_ID`/`VOICE_ID`) for unknown ids.
In `say.post.ts` the speaches branch resolves before calling `speachesTTS`;
`providerModel` must be the resolved model so the cache key stays per-voice.

Steps: failing test → implement → `yarn test` → commit.

### Task 2: Controller personas (client)

**Files:**
- Modify: `shared/utils/voicePool.ts` (persona = voice + speed)
- Test: extend voicePool test (create if missing)
- Modify: `app/composables/useRadioSpeech.ts`

`controllerPersonaFor(positionKey)` → `{ voice, baseSpeed }` with baseSpeed
hashed into [1.1, 1.3]. `transmissionSpeed(base)` adds ±0.05 jitter.
`scheduleControllerSpeech` derives positionKey from the tuned station
(airport + entry.type via `tunedStationEntry()`, fallback 'TWR') and passes
`voice` + `speed`. AI-traffic ATC lines (voice currently `undefined`) get the
same persona via the options already flowing through `speakWithRadioEffects`
(default in `fetchSpeechAudio`/`speakPlainText`: persona of tuned station
instead of hard `'alloy'`). User pilot readback keeps `verse`; simulated pilots
keep `pilotVoiceFor` — both now actually differ audibly through Task 1.

Steps: failing test for persona determinism/range → implement → wire
useRadioSpeech → `yarn test` → commit.

### Task 3: Squelch transients in radio effects

**Files:**
- Modify: `shared/utils/radioEffects.ts`
- Modify: `app/composables/useRadioSpeech.ts` (`playAudioWithEffects`)

`createSquelchTransients(ctx, duration, level)`: short filtered noise burst
(~30–60 ms, bandpassed ~2 kHz) at t=0 (carrier open) and at speech end a
~200 ms noise tail that cuts to a click (carrier close). Amplitude scales
inversely with readability. Hook into the same start/stop lifecycle as
`createNoiseGenerators`.

Steps: implement → `yarn test` (type-level) → browser verify later → commit.

### Task 4: Browser verification (AP1)

`yarn dev` via launch.json + `/dev-login?redirect=/live-atc`. Trigger a
session, confirm: different voices per station on Speaches (needs `sky`
reachable; else verify request payload carries mapped model+voice via mock),
speed varies per transmission, squelch clicks audible (verify via console/
waveform if needed). Fix regressions, commit.

## AP2 — OpenSquawk-LiveATC-api (Python)

### Task 5: Sweep harness

**Files:**
- Create: `tools/taxi_sweep.py`
- Create: `tests/fixtures/osm/` (cache dir, gitignored large? — commit; they
  compress well and make tests offline)

For ICAOs EDDF EDDM EDDB EDDH EDDL EDDK EDDS EDDV EDDN EDDW:
fetch taxiway graph + geocode features once, cache raw Overpass JSON to
`tests/fixtures/osm/<icao>_<kind>.json`; monkeypatch/inject a caching client
into `taxi_route_service`. Enumerate stands (`_stand_features`) × runway ends
(from parsed runways), cap ~40 combos/airport (seeded sample). For each run
`calculate_taxi_route` and check invariants:

- route found (or a *categorized* structured failure)
- taxi_route names non-empty, no 'unnamed', no consecutive duplicates
- hold-short clause ⇔ detected crossings
- crossing designators match `^\d{2}[LRC]?$`
- phoneticized route has only phonetic-alphabet words/digits
- total length < 8 km and > 50 m

Write `docs/taxi-sweep-report.md` (per-airport stats + each violation with
inputs to reproduce). Commit harness + fixtures + report.

### Task 6: Fix defects found

For each violation class from the report: reproduce with a focused failing
pytest using the cached fixture → fix in `taxi_routing.py` /
`taxi_route_service.py` → test green → commit per defect class.

### Task 7: Regression suite + final verify

- `tests/test_taxi_sweep_regressions.py`: runs the sweep invariants offline
  over the cached fixtures (skip cleanly if fixture missing).
- Full `pytest` green; rerun sweep → report clean (or documented leftovers).
- Nuxt: `yarn test` green.
- Commit; push both repos (user-approved).
