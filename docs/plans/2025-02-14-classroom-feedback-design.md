# Classroom Feedback Integration — Design

**Date:** 2025-02-14
**Status:** Approved

## Background

User feedback from beta testers identified several friction points in the classroom experience. This design addresses all reported issues in a single pass.

## Changes

### 1. Audio Speed & Pausen

**Problem:** Multiple users report ATC audio is too fast and hard to understand, especially SID/STAR names and METAR content.

**Solution:**
- Expand speed slider range from `0.7–1.3×` to `0.5–1.3×`
- Lower default speed from `1.0` to `0.85×`
- Insert comma-based pauses in METAR phrases to trigger natural TTS pausing between elements

**Files:** `app/pages/classroom.vue` (slider config, default value)

### 2. "Soll:" → "Expected:"

**Problem:** German word "Soll" appears in the readback feedback UI (line 1068).

**Solution:** Replace `Soll:` with `Expected:` — single string change.

**Files:** `app/pages/classroom.vue` (line 1068)

### 3. Pushback Delay Field Acceptance

**Problem:** In the "Pushback Delay Acknowledgement" lesson, the delay field expects the word form (e.g. "five") but users type the numeral (e.g. "5"). The readback template already appends " minutes" as static text, so the field just needs the number.

**Solution:** Add `scenario.pushDelayMinutes.toString()` to the `alternatives` array for the `push-delay` field.

**Files:** `shared/data/learnModules.ts` (pushback-delay lesson, ~line 760)

### 4. METAR Normalization for TTS

**Problem:** METAR strings are sent to TTS as raw text (e.g. "BKN025"), making them unintelligible when spoken.

**Solution:** New function `normalizeMetarPhrase()` in `shared/utils/radioSpeech.ts` that converts METAR codes to spoken aviation English:

| Raw | Spoken |
|-----|--------|
| `28015KT` | `wind too eight zero degrees, wun fife knots` |
| `28015G25KT` | `wind too eight zero degrees, wun fife gusting too fife knots` |
| `9999` (vis) | `visibility wun zero kilometers or more` |
| `BKN025` | `broken, too fife hundred feet` |
| `SCT040` | `scattered, four thousand feet` |
| `FEW010` | `few, wun thousand feet` |
| `OVC008` | `overcast, eight hundred feet` |
| `RA` | `rain` |
| `SN` | `snow` |
| `15/08` | `temperature wun fife, dew point zero eight` |

Commas between elements provide natural TTS pauses. Integration: detect METAR context in `say()` (via lesson type or pattern) and route through `normalizeMetarPhrase()`.

### 5. Phonetic Expansion for Approach Suffixes

**Problem:** Approach types like "ILS 08R Y" don't get the suffix letter phonetized — user hears "why" instead of "Yankee".

**Solution:** Add regex in `normalizeRadioPhrase()`:
```
/\b(ILS|VOR|RNAV|LOC|RNP)\s+(\d{2}[LCR]?)\s+([A-Z])\b/gi
```
Converts suffix letter to ICAO phonetic (Y → Yankee, Z → Zulu) and runway to spoken form.

**Files:** `shared/utils/radioSpeech.ts`

### 6. SID/STAR Suffix with Spaces

**Problem:** Current SID pattern `/\b([A-Z]{4,6})(\s?)(\d)([A-Z])\b/g` handles `SUGOL2S` but not `SUGOL 2S` or `SUGOL 2 S`.

**Solution:** Relax the regex to allow optional whitespace:
```
/\b([A-Z]{4,6})\s*(\d)\s*([A-Z])\b/g
```

**Files:** `shared/utils/radioSpeech.ts`

## Out of Scope

- Lesson navigation/search UX improvements (existing search works, needs user research)
- Audio reliability issues (infrastructure/browser-dependent)
- Classroom repetitiveness (pedagogical design, not code)
