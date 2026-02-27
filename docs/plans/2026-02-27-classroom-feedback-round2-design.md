# Classroom Feedback Round 2 — Design

**Date**: 2026-02-27
**Source**: User feedback from Russ and Samuel

## Changes

### 1. End-of-Content Messaging

When the user reaches the last lesson of the last module, the footer currently shows "Last lesson in this mission." with no next action available. Users think the app is broken.

**Fix**: New computed `isAtEndOfCurriculum` checks if user is on last lesson of last module. When true:
- Footer text: "You've completed all available lessons! More content is coming soon."
- Primary button becomes "Back to hub" (instead of disabled "Next lesson")
- No disabled/dead buttons

**Files**: `app/pages/classroom.vue` (footer template ~line 1185, computeds ~line 3250-3330)

### 2. Collapsible Reference Data Table

Users don't know airline codes (AFR = Air France), nav aids (ANEKI), or other aviation-specific data. Need a reference table per lesson.

**Fix**:
- New optional field on `Lesson` type: `reference?: (scenario: Scenario) => { label: string; value: string }[]`
- Collapsible "Reference" section in the briefing panel, below hints
- Auto-generate fallback from scenario data (callsign, airline, airport, runway, frequencies) when lesson doesn't define custom reference
- State (open/closed) persisted in learn config

**Files**: `shared/learn/types.ts`, `shared/data/learnModules.ts` (optional per-lesson), `app/pages/classroom.vue` (briefing panel UI)

### 3. Add Wind Field to Takeoff/Landing Lessons

ATC says "wind 030/12, runway 26R, cleared for takeoff" but the readback template has no wind field. Users hear "wind" first and enter it in the runway field.

**Fix**: Add wind field to 4 lessons, placed before the runway field to match audio order:
- `takeoff` (line ~968)
- `landing-clearance` (line ~1498)
- `full-takeoff` (line ~2861)
- `full-landing` (line ~3168)

Wind field accepts formats: "030/12", "030/12KT", spoken words.

**Files**: `shared/data/learnModules.ts`
