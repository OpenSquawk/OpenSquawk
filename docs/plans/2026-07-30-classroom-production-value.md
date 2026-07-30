# Classroom Production Value Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Triple the perceived and actual scope of the Classroom without authoring new lessons, and fill the empty overview page with the 63 lessons that already exist.

**Architecture:** Mastery moves from a flat two-variant counter to per-module thresholds backed by persisted variant signatures (a hash over each roll's expected answers). The overview replaces four anonymous tiles with four stacked module sections that list every lesson.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, `node:test` via tsx.

Design: [2026-07-30-classroom-production-value-design.md](2026-07-30-classroom-production-value-design.md)

---

### Task 1: Variant signature utility

**Files:**
- Create: `shared/learn/variantSignature.ts`
- Test: `shared/learn/variantSignature.test.ts`

FNV-1a over `lesson.fields.map(f => f.expected(scenario)).join('')`, base36.
Two rolls demanding the same answers collide by design; that is the point.

Tests: stable for the same scenario, differs for different expected answers,
non-empty for a lesson with no fields.

### Task 2: Per-module thresholds and the new progress field

**Files:**
- Modify: `shared/learn/config.ts`

Add `variantSignatures?: string[]` to `LessonProgress`. Replace
`CLASSROOM_VARIANTS_FOR_MASTERY` with `CLASSROOM_VARIANTS_BY_MODULE`
(`normalize` 3, `arc` 4, `decision-tree` 4, `full-flight` 5),
`CLASSROOM_VARIANTS_DEFAULT` 3, and `variantsForModule(modId)`.

Keep the old constant exported as a deprecated alias equal to
`CLASSROOM_VARIANTS_DEFAULT` only if a call site still needs it; otherwise
remove it and fix the two call sites in `classroom.vue`.

### Task 3: Signature-aware mastery

**Files:**
- Modify: `shared/learn/assessment.ts`
- Test: `tests/shared/classroomCurriculum.test.ts`

`updateMasteryProgress(previous, assessment, { modelAnswerRevealed, signature, threshold })`.

- Counts when passed, not revealed, and `signature` is not already stored.
- Appends the signature, sets `successfulVariants = max(previous, signatures.length)`.
- **`done` is sticky:** `done: previous?.done || successfulVariants >= threshold`.
  This is what preserves existing customers' check marks when the threshold rises.

`isCurrentMastery(progress)` keeps its current shape — it reads `done`, so
grandfathered entries stay mastered.

Tests: duplicate signature does not count; distinct signatures accumulate;
revealed answer never counts; a legacy `{done:true, successfulVariants:2}` stays
mastered under a threshold of 4; threshold lookup falls back to the default.

### Task 4: Wire the signature through the lesson runner

**Files:**
- Modify: `app/pages/classroom.vue` (evaluation at ~4021, `rollScenario` at ~3862,
  `currentVariantProgressLabel` at ~3072)

Compute the signature from `activeLesson.value` and `scenario.value` at
evaluation time. Delete the `variantCounted` ref — persisted signatures replace
it and fix the reload-dedup hole. Label reads `x of N clean variations` against
the module threshold.

### Task 5: Lesson chips on the overview

**Files:**
- Modify: `app/pages/classroom.vue` (hub markup at 158-212, styles)

Four stacked module sections: header (art band, title, subtitle, progress bar,
counts, Continue button) plus a grid of lesson chips. Each chip shows the lesson
title, `lessonScoreIcon`, variant dots against the module threshold, and best
score. Clicking a chip calls `openLessonFromSearch(modId, lesId)`, which already
does exactly the right thing.

### Task 6: Scope figures in the hub header

**Files:**
- Modify: `app/pages/classroom.vue`

Computed `curriculumStats`: module count, lesson count, and total variations
(sum of `lessons.length * variantsForModule(id)`). Rendered under the subtitle
with overall mastery progress.

### Task 7: Verify and ship

`yarn test`, `yarn typecheck`, commit, merge into `release`, push.
