# Classroom Production Value — Design

Date: 2026-07-30

## Problem

The Classroom overview at `/classroom` renders four module cards and roughly
half a page of empty space below them. The cards expose no lesson titles, so the
curriculum looks like four items with a handful of exercises each. The product
sells for 30 €; the page undersells what is already built.

The curriculum actually holds **63 lessons across 4 modules**
(`shared/data/learnModules.ts`). Every lesson carries a `generate()` function
that rolls a fresh scenario from `randInt`/`sample`, so the number of distinct
practice runs is effectively unbounded. Mastery currently requires only two
clean runs (`CLASSROOM_VARIANTS_FOR_MASTERY = 2`), which caps the whole
curriculum at 126 runs.

Two levers follow, neither of which requires authoring new lesson content:

1. Require more rolled variants per lesson, and track which ones were passed.
2. Show the 63 lessons on the overview instead of four anonymous cards.

## Decisions

- Presentation first. No new lessons are authored in this work.
- Variant thresholds are staggered per module, not one global constant.
- Passed variants are stored as signatures, not just a counter.
- Existing progress is preserved. A lesson already marked `done` keeps its
  check mark; the raised threshold shows up as a new goal beside it, never as a
  regression.

## Part 1 — Variant mastery

### Variant signature

A lesson defines `fields[].expected(scenario)` (`shared/learn/types.ts:145`).
The signature of a roll is a short hash over exactly those expected answer
values, joined in field order. Two rolls that demand the same spoken answer are
the same exercise regardless of unrelated scenario differences, so this needs no
per-lesson configuration.

Encoding: FNV-1a over the joined string, base36, ~8 characters. At five variants
across 63 lessons that is roughly 3 KB per profile — irrelevant next to the
existing `Mixed` progress blob in `server/models/LearnProfile.ts`.

### Data model

```ts
// shared/learn/config.ts
export interface LessonProgress {
  best: number
  done: boolean
  assessmentVersion?: number
  successfulVariants?: number      // retained; stays the displayed count
  variantSignatures?: string[]     // new
}

export const CLASSROOM_VARIANTS_BY_MODULE: Record<string, number> = {
  'normalize': 3,       // Foundations, 7 lessons
  'arc': 4,             // Mandatory Readbacks, 22 lessons
  'decision-tree': 4,   // Pilot Calls & Abnormal Situations, 17 lessons
  'full-flight': 5,     // Guided Flight Sequence, 17 lessons
}

export const CLASSROOM_VARIANTS_DEFAULT = 3
```

Short drills need less repetition than full scenarios, which is why the
threshold rises with module complexity. Total runs to full mastery:
7×3 + 22×4 + 17×4 + 17×5 = **262**, up from 126.

`CLASSROOM_VARIANTS_FOR_MASTERY` is replaced by a lookup that falls back to
`CLASSROOM_VARIANTS_DEFAULT` for unknown module ids.

### Assessment change

`updateMasteryProgress` (`shared/learn/assessment.ts:43`) takes the current
roll's signature and the module threshold instead of the
`variantAlreadyCounted` boolean:

- A pass counts when the model answer was not revealed **and** the signature is
  absent from `variantSignatures`.
- On count, the signature is appended and `successfulVariants` is set to
  `max(previous, variantSignatures.length)`.
- `done` becomes `successfulVariants >= threshold`.

This also fixes a live defect: `variantCounted` is a session ref reset on every
roll (`app/pages/classroom.vue:3873`), so today the same variant can be counted
again after a page reload. Signatures persist, so dedup now survives reloads.

### Migration

`CLASSROOM_ASSESSMENT_VERSION` stays at 2 — bumping it would wipe paying
customers' progress. Legacy entries have `successfulVariants` between 0 and 2
and no signatures. They are read as-is: the counter is authoritative until
signatures overtake it, and `isCurrentMastery` keeps returning true for anything
already `done`. A previously mastered lesson therefore keeps its check mark and
additionally shows "2 of 4 variations" as the new goal.

## Part 2 — Overview shows the curriculum

Four cards side by side cannot carry 22 lessons underneath. The overview becomes
four stacked module sections:

- **Section header** — artwork as a narrow band on the left, title and subtitle,
  progress bar, "Continue" button on the right.
- **Lesson grid** — every lesson of the module as a compact chip: title, status
  icon, variant dots (●●●○○ against the module threshold), best score.
- Clicking a chip opens that lesson directly.

That puts 63 concrete entries on the page. A buyer reads "ATIS", "METAR",
"Go-Around", "TCAS RA", "Mayday Vector" instead of four unlabelled tiles, and
the empty lower half is gone.

The existing lesson search stays as-is; it now duplicates a browsing path rather
than being the only way to discover a lesson title.

## Part 3 — Scope figures in the header

Below the headline, one line of figures derived from the data, not from
marketing: **4 modules · 63 lessons · 262 practice variations**, plus overall
progress. All three numbers are computed from `learnModules` and
`CLASSROOM_VARIANTS_BY_MODULE` so they cannot drift from reality.

## Testing

- `tests/shared/classroomCurriculum.test.ts` covers the counter today. Extend
  with: identical signature does not count twice; distinct signatures accumulate;
  a legacy entry without signatures keeps `done`; module thresholds resolve, and
  unknown ids fall back to the default.
- Add a signature-stability test: the same scenario hashed twice is equal, and
  two rolls with different expected answers differ.
- `yarn typecheck` must pass; `LessonProgress` gains an optional field, so no
  call site breaks.

## Out of scope

- New lessons or modules.
- Streaks, activity history, or time-based statistics — `LessonProgress` has no
  timestamps, and adding them is a separate piece of work.
- XP, which is already marked legacy in `shared/learn/config.ts`.
