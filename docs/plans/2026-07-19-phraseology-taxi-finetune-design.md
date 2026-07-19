# Phraseology Realism & Taxi Fine-Tuning — Design

Date: 2026-07-19
Repos: OpenSquawk (Nuxt) + OpenSquawk-LiveATC-api (Python)

## Goals

1. **AP1 — Voices, tempo, radio noise:** Different stations sound like different
   controllers, speech pacing matches real radar, transmissions have squelch
   clicks/tails instead of clean cuts.
2. **AP2 — Taxi instruction quality:** Find and fix the ~5% of airport-specific
   taxi clearances that skip segments or produce nonsense; freeze the findings as
   offline regression tests.

## AP1: Controller personas, tempo, radio noise (Nuxt repo)

### Voice registry (server)

New `server/utils/voiceRegistry.ts` mapping logical voice ids to Speaches/Piper
model+voice pairs:

- Controller pool `atc-1`…`atc-6`: `en_US-ryan-medium`, `en_GB-alan-medium`,
  `en_US-amy-medium`, `en_US-lessac-medium`, `en_GB-cori-medium`, `en_US-joe-medium`
- Pilot pool `pilot-1`…`pilot-3`: three further voices, disjoint from the
  controller pool (used for pilot readback and AI traffic)

`/api/atc/say` resolves logical ids through the registry and overrides the
Speaches model+voice per request (Speaches auto-downloads missing Piper models).
Unknown ids (e.g. legacy `alloy`) fall back to the env-configured default —
nothing existing breaks. The TTS cache key already includes voice+model, so
caching stays correct.

### Personas (client)

In `useRadioSpeech`/`useFrequencyPresets`: deterministic station→persona
assignment via hash of session id + station type + frequency. A persona is a
voice + base speed (1.1–1.3) + per-transmission jitter (±0.05). Ground sounds
the same all session but different from Tower; handoffs feel like a real
frequency change. Pilot readback and AI traffic draw from the pilot pool.

### Rhythm

Controller base speed up to ~1.2x (persona-dependent). Pauses come from
punctuation in the normalizer (Piper honors commas/periods between phrase
groups).

### Radio noise (`shared/utils/radioEffects.ts`)

Squelch click when the transmission opens, ~200 ms noise tail + click when it
closes, background noise only during the transmission (as today). The
readability profiles 1–5 stay as they are.

## AP2: Taxi sweep + regression fixtures (Python repo)

### Sweep script `tools/taxi_sweep.py`

For EDDF, EDDM, EDDB, EDDH, EDDL, EDDK, EDDS, EDDV, EDDN, EDDW: run all
plausible stand×runway combinations (capped per airport) through
`calculate_taxi_route` + `resolve_taxi_clearance`. Overpass responses are
cached as fixtures under `tests/fixtures/osm/` so the sweep is offline and
reproducible after the first run.

### Invariants

- Route found
- No empty/"unnamed" taxiway names
- No consecutive duplicates after collapse
- Hold-short clause present iff runway crossings were detected
- Crossing designator is a valid runway format
- Phoneticized output contains no raw garbage
- Route length plausible

### Evaluation

Markdown report with all findings per airport. Confirmed defects get fixed in
`taxi_routing.py`/`taxi_route_service.py` and frozen as offline pytest
regression tests.

## Verification

- AP1: browser test against the dev server (Speaches on `sky`, or Piper
  fallback when unreachable)
- AP2: sweep report + `pytest`

## Decisions log

- Both work packages: approach A (persona system + voice registry; sweep with
  regression fixtures) — approved 2026-07-19
- Voice pool: US+GB mix — approved
- Sweep airports: German majors — approved
