# Classroom Feedback Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve classroom audio clarity, fix UI bugs, and enhance phonetic normalization based on beta tester feedback.

**Architecture:** Six independent changes across 3 files: config defaults (`shared/learn/config.ts`), radio speech normalization (`shared/utils/radioSpeech.ts`), lesson data (`shared/data/learnModules.ts`), and the classroom page (`app/pages/classroom.vue`). No new dependencies.

**Tech Stack:** TypeScript, Vue 3 SFC, Nuxt 4. No test framework configured — verify manually with `bun run dev`.

---

### Task 1: Fix "Soll:" → "Expected:" in classroom UI

**Files:**
- Modify: `app/pages/classroom.vue:1068`

**Step 1: Apply the fix**

Change line 1068 from:
```
Soll: {{ fieldExpectedValue(segment.key) }}
```
to:
```
Expected: {{ fieldExpectedValue(segment.key) }}
```

**Step 2: Verify**

Run: `bun run dev`
Open classroom, complete any lesson, click "Check" — feedback should show "Expected:" not "Soll:".

**Step 3: Commit**

```bash
git add app/pages/classroom.vue
git commit -m "fix: replace German 'Soll' with 'Expected' in classroom readback feedback"
```

---

### Task 2: Lower default audio speed and widen slider range

**Files:**
- Modify: `shared/learn/config.ts:28` (default value)
- Modify: `app/pages/classroom.vue:1265-1266` (slider min)
- Modify: `app/pages/classroom.vue:2725-2727` (clamp in sanitizer)

**Step 1: Change default speed**

In `shared/learn/config.ts`, change line 28:
```typescript
audioSpeed: 0.85,
```

**Step 2: Widen slider range**

In `app/pages/classroom.vue`, change the v-slider min (around line 1265):
```
:min="0.5"
```
(was `0.7`)

**Step 3: Update the sanitizer clamp**

In `app/pages/classroom.vue`, around line 2727, update the clamp to match:
```typescript
patch.audioSpeed = Math.min(1.3, Math.max(0.5, rounded))
```
(was `Math.max(0.7, rounded)`)

**Step 4: Verify**

Run: `bun run dev`
Open classroom settings — slider should go from 0.5× to 1.3×. Default for new users should be 0.85×. Test TTS button should play slower.

**Step 5: Commit**

```bash
git add shared/learn/config.ts app/pages/classroom.vue
git commit -m "feat: lower default audio speed to 0.85x and widen slider range to 0.5-1.3x"
```

---

### Task 3: Fix pushback-delay field acceptance

**Files:**
- Modify: `shared/data/learnModules.ts:~760`

**Step 1: Add numeric alternative**

In the `pushback-delay` lesson's `push-delay` field (around line 758-764), add the raw number to alternatives:
```typescript
{
  key: 'push-delay',
  label: 'Delay',
  expected: scenario => scenario.pushDelayWords,
  alternatives: scenario => [
    scenario.pushDelayWords,
    `${scenario.pushDelayMinutes} minutes`,
    scenario.pushDelayMinutes.toString(),
    `${scenario.pushDelayMinutes}`
  ],
  width: 'md'
},
```

**Step 2: Verify**

Run: `bun run dev`
Open classroom → Ground module → "Pushback Delay Acknowledgement" lesson. Type the raw number (e.g. "5") in the delay field and click Check — should be accepted.

**Step 3: Commit**

```bash
git add shared/data/learnModules.ts
git commit -m "fix: accept numeric values for pushback delay field in classroom"
```

---

### Task 4: Expand SID/STAR suffix regex for spaces

**Files:**
- Modify: `shared/utils/radioSpeech.ts:268`

**Step 1: Update the regex**

Change the SID suffix regex (line 268) from:
```typescript
out = out.replace(/\b([A-Z]{4,6})(\s?)(\d)([A-Z])\b/g, (_match, prefix: string, _gap: string, digit: string, letter: string) => {
    return sidSuffixSpeak(prefix, digit, letter);
});
```
to:
```typescript
out = out.replace(/\b([A-Z]{4,6})\s*(\d)\s*([A-Z])\b/g, (_match, prefix: string, digit: string, letter: string) => {
    return sidSuffixSpeak(prefix, digit, letter);
});
```

This handles `SUGOL2S`, `SUGOL 2S`, and `SUGOL 2 S`.

**Step 2: Verify**

Quick check: the regex should match all three forms. Test in dev with a lesson that contains SID references.

**Step 3: Commit**

```bash
git add shared/utils/radioSpeech.ts
git commit -m "fix: handle spaces in SID/STAR suffix patterns for phonetic expansion"
```

---

### Task 5: Add approach suffix phonetic expansion

**Files:**
- Modify: `shared/utils/radioSpeech.ts` (add new function + regex in `normalizeRadioPhrase`)

**Step 1: Add approach suffix handler**

Add after the `sidSuffixSpeak` function (around line 253):

```typescript
function approachSpeak(type: string, runway: string, suffix: string): string {
    const rw = runwaySpeak(runway);
    const phonetic = ICAO_LETTERS[suffix.toUpperCase()] ?? suffix;
    return `${type} ${rw} ${phonetic}`;
}
```

**Step 2: Add regex in normalizeRadioPhrase**

After the SID suffix replacement block (around line 271), add:

```typescript
out = out.replace(
    /\b(ILS|VOR|RNAV|LOC|RNP)\s+(\d{2}[LCR]?)\s+([A-Z])\b/gi,
    (_match, type: string, runway: string, suffix: string) => approachSpeak(type.toUpperCase(), runway, suffix)
);
```

**Step 3: Verify**

Test that `normalizeRadioPhrase("cleared ILS 08R Y approach")` produces something like `"cleared ILS runway zero eight right Yankee approach"`.

**Step 4: Commit**

```bash
git add shared/utils/radioSpeech.ts
git commit -m "feat: phonetic expansion for approach type suffixes (ILS 08R Y → Yankee)"
```

---

### Task 6: Add METAR normalization for TTS

**Files:**
- Modify: `shared/utils/radioSpeech.ts` (add `normalizeMetarPhrase` function)
- Modify: `app/pages/classroom.vue` (use it in `say()`)

**Step 1: Add METAR weather codes map**

Add at the top of `radioSpeech.ts`, after the ICAO maps:

```typescript
const METAR_WEATHER: Record<string, string> = {
    'RA': 'rain', 'SN': 'snow', 'DZ': 'drizzle', 'FG': 'fog',
    'BR': 'mist', 'HZ': 'haze', 'TS': 'thunderstorm', 'SH': 'showers',
    'FZ': 'freezing', 'GR': 'hail', 'GS': 'small hail',
    '+RA': 'heavy rain', '-RA': 'light rain',
    '+SN': 'heavy snow', '-SN': 'light snow',
    '+TSRA': 'thunderstorm with heavy rain', 'TSRA': 'thunderstorm with rain',
    '+DZ': 'heavy drizzle', '-DZ': 'light drizzle',
    '+SHRA': 'heavy rain showers', '-SHRA': 'light rain showers',
    'SHRA': 'rain showers',
};

const METAR_CLOUD: Record<string, string> = {
    'FEW': 'few', 'SCT': 'scattered', 'BKN': 'broken', 'OVC': 'overcast',
};
```

**Step 2: Add normalizeMetarPhrase function**

Add before the `normalizeRadioPhrase` export:

```typescript
export function normalizeMetarPhrase(metar: string): string {
    const parts: string[] = [];

    // Wind: 28015KT or 28015G25KT or VRB05KT
    const windMatch = metar.match(/\b(VRB|\d{3})(\d{2,3})(G(\d{2,3}))?KT\b/);
    if (windMatch) {
        const dir = windMatch[1] === 'VRB' ? 'variable' : `${spellIcaoDigits(windMatch[1])} degrees`;
        const speed = spellIcaoDigits(windMatch[2]);
        let windPart = `wind ${dir}, ${speed} knots`;
        if (windMatch[4]) {
            windPart += `, gusting ${spellIcaoDigits(windMatch[4])} knots`;
        }
        parts.push(windPart);
    }

    // Visibility: 9999, 0800, CAVOK
    if (metar.includes('CAVOK')) {
        parts.push('CAVOK');
    } else {
        const visMatch = metar.match(/\b(\d{4})\b/);
        if (visMatch && !metar.match(new RegExp(`\\b${visMatch[1]}(KT|Z)\\b`))) {
            const vis = parseInt(visMatch[1]);
            if (vis >= 9999) {
                parts.push(`visibility, ${spellIcaoDigits('1')} ${spellIcaoDigits('0')} kilometers or more`);
            } else {
                parts.push(`visibility, ${spellIcaoDigits(vis.toString())} meters`);
            }
        }
    }

    // Weather phenomena
    const wxPatterns = Object.keys(METAR_WEATHER).sort((a, b) => b.length - a.length);
    for (const wx of wxPatterns) {
        if (metar.includes(` ${wx} `) || metar.includes(` ${wx}\b`)) {
            const spoken = METAR_WEATHER[wx];
            if (spoken) parts.push(spoken);
            break;
        }
    }

    // Clouds: BKN025, SCT040, FEW010, OVC008
    const cloudRegex = /\b(FEW|SCT|BKN|OVC)(\d{3})\b/g;
    let cloudMatch;
    while ((cloudMatch = cloudRegex.exec(metar)) !== null) {
        const cover = METAR_CLOUD[cloudMatch[1]] ?? cloudMatch[1];
        const alt = parseInt(cloudMatch[2]) * 100;
        parts.push(`${cover}, ${altitudeSpeak(alt).replace(' feet', '')} feet`);
    }

    // Temperature: 15/08 or M02/M05
    const tempMatch = metar.match(/\b(M?\d{2})\/(M?\d{2})\b/);
    if (tempMatch) {
        const speakTemp = (raw: string) => {
            if (raw.startsWith('M')) {
                return `minus ${spellIcaoDigits(raw.slice(1))}`;
            }
            return spellIcaoDigits(raw);
        };
        parts.push(`temperature ${speakTemp(tempMatch[1])}, dew point ${speakTemp(tempMatch[2])}`);
    }

    // QNH: Q1013
    const qnhMatch = metar.match(/\bQ(\d{4})\b/);
    if (qnhMatch) {
        parts.push(qnhSpeak(qnhMatch[1]));
    }

    if (!parts.length) return metar;
    return parts.join(', ');
}
```

**Step 3: Integrate in classroom `say()`**

In `app/pages/classroom.vue`, add the import for `normalizeMetarPhrase` alongside the existing `normalizeRadioPhrase` import (around line 1334):

```typescript
import {DEFAULT_AIRLINE_TELEPHONY, normalizeRadioPhrase, normalizeMetarPhrase} from '~~/shared/utils/radioSpeech'
```

Then in the `say()` function (around line 4373), detect METAR context and use the appropriate normalizer. The active lesson ID is available via `activeLesson.value?.id`. Change:

```typescript
const spokenPhrase = normalizeRadioPhrase(trimmed, {
    airlineMap: DEFAULT_AIRLINE_TELEPHONY,
    expandAirports: true,
    expandCallsigns: true
})
```

to:

```typescript
const isMetarLesson = activeLesson.value?.id === 'metar' || activeLesson.value?.id === 'atis'
const spokenPhrase = isMetarLesson
    ? normalizeMetarPhrase(trimmed)
    : normalizeRadioPhrase(trimmed, {
        airlineMap: DEFAULT_AIRLINE_TELEPHONY,
        expandAirports: true,
        expandCallsigns: true
    })
```

**Step 4: Verify**

Run: `bun run dev`
Open classroom → Weather module → "Decode the METAR" lesson. Click the speaker icon. The METAR should now be spoken with intelligible expanded terms and natural pauses between elements.

**Step 5: Commit**

```bash
git add shared/utils/radioSpeech.ts app/pages/classroom.vue
git commit -m "feat: add METAR normalization for intelligible TTS playback in classroom"
```

---

## Execution Order

Tasks 1–5 are independent and can be parallelized. Task 6 depends on nothing but is the largest.

Recommended order: 1 → 2 → 3 → 4 → 5 → 6 (smallest to largest, builds confidence).

## Verification Checklist

After all tasks:
- [ ] `bun run dev` starts without errors
- [ ] Classroom settings slider: 0.5× to 1.3×, default 0.85×
- [ ] Readback feedback shows "Expected:" not "Soll:"
- [ ] Pushback delay accepts "5" and "five"
- [ ] "SUGOL 2S" spoken as "SUGOL too Sierra"
- [ ] "ILS 08R Y" spoken as "ILS runway zero eight right Yankee"
- [ ] METAR lesson: weather codes spoken intelligibly with pauses
