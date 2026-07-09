# Pilot Profile Onboarding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Insert a post-registration "account setup" screen at `/pilot-profile-setup` that
captures pricing/feature/target-audience signal (disguised as personalization) before the
user reaches the existing `/classroom-introduction` tour.

**Architecture:** One new 1:1 `PilotProfile` Mongoose model (admin-only, mirrors
`LearnProfile`/`FeedbackSubmission`), two new Nitro routes (`GET`/`PUT
/api/onboarding/profile`, mirroring `server/api/learn/state.{get,put}.ts`), a shared
`shared/onboarding/config.ts` enum/option module consumed by both the route validation
and the Vue page (single source of truth for labels/icons), and one new Vue page with
7 single-question screens + a reward card. `login.vue`'s post-register redirect changes
from `/classroom-introduction` to `/pilot-profile-setup`; that page hands off to
`/classroom-introduction` exactly as before once finished or skipped.

**Tech Stack:** Nuxt 4 / Vue 3 `<script setup>`, H3/Nitro server routes, Mongoose,
`node:test` + `node:assert/strict` (via `tsx --test`), Tailwind utility classes +
`learn-theme.css` (reused from `classroom-introduction.vue`), `mdi-*` icons via the
existing `v-icon` usage — no new UI library.

**Reference:** Design doc — [`docs/plans/2026-07-09-pilot-profile-onboarding-design.md`](2026-07-09-pilot-profile-onboarding-design.md)

---

## Before you start

Read these existing files — the plan builds directly on their patterns:
- `server/api/learn/state.get.ts` / `server/api/learn/state.put.ts` — the GET/PUT
  upsert pattern this plan copies.
- `server/models/LearnProfile.ts`, `shared/learn/config.ts` — the shared-config +
  model pattern this plan copies.
- `tests/server/bugReport.test.ts` — the test style: pure logic functions and Mongoose
  schema-shape assertions, no live DB, no H3 event mocking.
- `app/pages/classroom-introduction.vue` — the visual language (learn-theme, card
  borders, `.btn` variants, `v-icon` usage) the new page should match.
- `app/pages/login.vue:451-473` (`submitRegister`) — the redirect this plan changes.

Run `yarn test` once before starting so you have a clean baseline.

---

### Task 1: Shared onboarding config

**Files:**
- Create: `shared/onboarding/config.ts`
- Test: `shared/onboarding/config.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SIMULATOR_OPTIONS,
  OS_OPTIONS,
  HARDWARE_OPTIONS,
  RADIO_PAIN_POINT_OPTIONS,
  TOOLKIT_OPTIONS,
  PAID_TOOLKIT_VALUES,
  TOOLKIT_DURATION_OPTIONS,
  FEATURE_WISH_OPTIONS,
  PRICING_PREFERENCE_OPTIONS,
  ONBOARDING_TOTAL_STEPS,
  createDefaultOnboardingProfile,
} from '~~/shared/onboarding/config'

describe('onboarding config', () => {
  it('every option list has unique, non-empty values', () => {
    for (const list of [
      SIMULATOR_OPTIONS, OS_OPTIONS, HARDWARE_OPTIONS, RADIO_PAIN_POINT_OPTIONS,
      TOOLKIT_OPTIONS, TOOLKIT_DURATION_OPTIONS, FEATURE_WISH_OPTIONS, PRICING_PREFERENCE_OPTIONS,
    ]) {
      const values = list.map(o => o.value)
      assert.equal(new Set(values).size, values.length, 'duplicate option value found')
      assert.ok(values.every(v => typeof v === 'string' && v.length > 0))
    }
  })

  it('PAID_TOOLKIT_VALUES is a subset of TOOLKIT_OPTIONS values', () => {
    const toolkitValues = new Set(TOOLKIT_OPTIONS.map(o => o.value))
    for (const paid of PAID_TOOLKIT_VALUES) {
      assert.ok(toolkitValues.has(paid), `${paid} must be a valid toolkit option`)
    }
  })

  it('ONBOARDING_TOTAL_STEPS matches the number of required screens', () => {
    assert.equal(ONBOARDING_TOTAL_STEPS, 7)
  })

  it('createDefaultOnboardingProfile returns empty/undefined fields and no completion timestamps', () => {
    const profile = createDefaultOnboardingProfile()
    assert.equal(profile.completedAt, null)
    assert.equal(profile.skippedAt, null)
    assert.deepEqual(profile.hardware, [])
    assert.deepEqual(profile.networkExperience, [])
    assert.deepEqual(profile.toolkit, [])
    assert.deepEqual(profile.topFeatures, [])
    assert.deepEqual(profile.toolkitDuration, {})
  })
})
```

**Step 2: Run test to verify it fails**

Run: `yarn test 2>&1 | grep -A5 "onboarding config"`
Expected: FAIL — `Cannot find module '~~/shared/onboarding/config'`

**Step 3: Write the implementation**

```typescript
// shared/onboarding/config.ts

export type Simulator = 'msfs2024' | 'msfs2020' | 'xplane12' | 'other'
export type OperatingSystem = 'windows' | 'mac' | 'linux'
export type HardwareItem = 'keyboard_mouse' | 'hotas' | 'yoke_pedals' | 'multi_monitor'
export type NetworkExperience = 'vatsim' | 'ivao'
export type RadioPainPoint = 'readbacks' | 'fast_controllers' | 'phraseology' | 'accents' | 'none'
export type ToolkitItem = 'navigraph' | 'simbrief' | 'sayintentions' | 'beyondatc' | 'pilotedge'
export type ToolkitDuration = 'trying' | 'few_months' | 'six_plus_months' | 'cant_fly_without'
export type FeatureWish =
  | 'live_ai_atc'
  | 'more_airports'
  | 'network_integration'
  | 'structured_lessons'
  | 'voice_packs'
  | 'faster_stt'
  | 'progress_badges'
export type PricingPreference = 'one_time' | 'monthly' | 'season_pass' | 'free_self_host'

export interface OnboardingOption<T extends string> {
  value: T
  label: string
  icon: string
}

export const SIMULATOR_OPTIONS: OnboardingOption<Simulator>[] = [
  { value: 'msfs2024', label: 'MSFS 2024', icon: 'mdi-microsoft' },
  { value: 'msfs2020', label: 'MSFS 2020', icon: 'mdi-microsoft' },
  { value: 'xplane12', label: 'X-Plane 12', icon: 'mdi-airplane' },
  { value: 'other', label: 'Something else', icon: 'mdi-help-circle-outline' },
]

export const OS_OPTIONS: OnboardingOption<OperatingSystem>[] = [
  { value: 'windows', label: 'Windows', icon: 'mdi-microsoft-windows' },
  { value: 'mac', label: 'macOS', icon: 'mdi-apple' },
  { value: 'linux', label: 'Linux', icon: 'mdi-linux' },
]

export const HARDWARE_OPTIONS: OnboardingOption<HardwareItem>[] = [
  { value: 'keyboard_mouse', label: 'Keyboard & mouse', icon: 'mdi-keyboard-outline' },
  { value: 'hotas', label: 'HOTAS / joystick', icon: 'mdi-controller-classic-outline' },
  { value: 'yoke_pedals', label: 'Yoke & pedals', icon: 'mdi-steering' },
  { value: 'multi_monitor', label: 'Multi-monitor / cockpit build', icon: 'mdi-monitor-multiple' },
]

export const RADIO_CONFIDENCE_LABELS: Record<number, string> = {
  1: 'First solo jitters',
  2: 'Getting the hang of it',
  3: 'Comfortable most days',
  4: 'Rarely rattled',
  5: 'Sounds like a real dispatcher',
}

export const RADIO_PAIN_POINT_OPTIONS: OnboardingOption<RadioPainPoint>[] = [
  { value: 'readbacks', label: 'Getting readbacks right', icon: 'mdi-repeat' },
  { value: 'fast_controllers', label: 'Fast-talking controllers', icon: 'mdi-speedometer' },
  { value: 'phraseology', label: 'Remembering phraseology', icon: 'mdi-book-alphabet' },
  { value: 'accents', label: 'Understanding accents', icon: 'mdi-ear-hearing' },
  { value: 'none', label: "Honestly, I'm solid", icon: 'mdi-check-decagram' },
]

export const NETWORK_OPTIONS: OnboardingOption<NetworkExperience>[] = [
  { value: 'vatsim', label: 'VATSIM', icon: 'mdi-account-group' },
  { value: 'ivao', label: 'IVAO', icon: 'mdi-account-group-outline' },
]

export const TOOLKIT_OPTIONS: OnboardingOption<ToolkitItem>[] = [
  { value: 'navigraph', label: 'Navigraph', icon: 'mdi-map-marker-path' },
  { value: 'simbrief', label: 'SimBrief', icon: 'mdi-clipboard-flow-outline' },
  { value: 'sayintentions', label: 'SayIntentions', icon: 'mdi-chat-processing-outline' },
  { value: 'beyondatc', label: 'BeyondATC', icon: 'mdi-radio-tower' },
  { value: 'pilotedge', label: 'PilotEdge', icon: 'mdi-account-voice' },
]

/** Subscription/paid tools — selecting one of these reveals the "how long?" follow-up. */
export const PAID_TOOLKIT_VALUES: ToolkitItem[] = ['navigraph', 'sayintentions', 'beyondatc', 'pilotedge']

export const TOOLKIT_DURATION_OPTIONS: OnboardingOption<ToolkitDuration>[] = [
  { value: 'trying', label: 'Just trying it', icon: 'mdi-flask-outline' },
  { value: 'few_months', label: 'A few months', icon: 'mdi-calendar-month-outline' },
  { value: 'six_plus_months', label: '6+ months', icon: 'mdi-calendar-check-outline' },
  { value: 'cant_fly_without', label: "Can't fly without it", icon: 'mdi-heart' },
]

export const FEATURE_WISH_OPTIONS: OnboardingOption<FeatureWish>[] = [
  { value: 'live_ai_atc', label: 'More realistic live AI ATC', icon: 'mdi-robot-outline' },
  { value: 'more_airports', label: 'More airports & scenarios', icon: 'mdi-airport' },
  { value: 'network_integration', label: 'VATSIM/IVAO-style network integration', icon: 'mdi-lan-connect' },
  { value: 'structured_lessons', label: 'Structured Classroom lessons', icon: 'mdi-school-outline' },
  { value: 'voice_packs', label: 'Custom controller voice packs', icon: 'mdi-account-voice' },
  { value: 'faster_stt', label: 'Faster, offline-capable speech recognition', icon: 'mdi-lightning-bolt-outline' },
  { value: 'progress_badges', label: 'Progress tracking & badges', icon: 'mdi-medal-outline' },
]

export const MAX_FEATURE_WISHES = 2

export const PRICING_PREFERENCE_OPTIONS: OnboardingOption<PricingPreference>[] = [
  { value: 'one_time', label: 'One-time unlock — I own it', icon: 'mdi-lock-open-variant-outline' },
  { value: 'monthly', label: 'Small monthly add-on, always latest', icon: 'mdi-calendar-sync-outline' },
  { value: 'season_pass', label: 'Bundle / season pass', icon: 'mdi-ticket-confirmation-outline' },
  { value: 'free_self_host', label: "I'd rather stay free-tier / self-host", icon: 'mdi-server-network-outline' },
]

export const ONBOARDING_TOTAL_STEPS = 7

export interface OnboardingProfileFields {
  simulator: Simulator | null
  os: OperatingSystem | null
  hardware: HardwareItem[]
  radioConfidence: number | null
  radioPainPoint: RadioPainPoint | null
  networkExperience: NetworkExperience[]
  toolkit: ToolkitItem[]
  toolkitDuration: Partial<Record<ToolkitItem, ToolkitDuration>>
  topFeatures: FeatureWish[]
  pricingPreference: PricingPreference | null
  resultCallsign: string | null
  completedAt: string | null
  skippedAt: string | null
}

export function createDefaultOnboardingProfile(): OnboardingProfileFields {
  return {
    simulator: null,
    os: null,
    hardware: [],
    radioConfidence: null,
    radioPainPoint: null,
    networkExperience: [],
    toolkit: [],
    toolkitDuration: {},
    topFeatures: [],
    pricingPreference: null,
    resultCallsign: null,
    completedAt: null,
    skippedAt: null,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `yarn test 2>&1 | grep -A10 "onboarding config"`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add shared/onboarding/config.ts shared/onboarding/config.test.ts
git commit -m "feat(onboarding): add shared pilot-profile option config"
```

---

### Task 2: PilotProfile model

**Files:**
- Create: `server/models/PilotProfile.ts`
- Test: `server/models/PilotProfile.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PilotProfile } from '~~/server/models/PilotProfile'

describe('PilotProfile model', () => {
  it('is importable without a DB connection', () => {
    assert.ok(PilotProfile, 'PilotProfile model must be importable')
  })

  it('schema defines the expected fields', () => {
    const paths = PilotProfile.schema.paths
    for (const field of [
      'user', 'simulator', 'os', 'hardware', 'radioConfidence', 'radioPainPoint',
      'networkExperience', 'toolkit', 'toolkitDuration', 'topFeatures',
      'pricingPreference', 'resultCallsign', 'completedAt', 'skippedAt',
    ]) {
      assert.ok(field in paths, `schema must have ${field}`)
    }
  })

  it('user reference is required and unique', () => {
    const userPath = PilotProfile.schema.path('user') as any
    assert.equal(userPath?.options?.required, true)
    assert.equal(userPath?.options?.unique, true)
  })

  it('radioConfidence is bounded 1-5', () => {
    const path = PilotProfile.schema.path('radioConfidence') as any
    assert.equal(path?.options?.min, 1)
    assert.equal(path?.options?.max, 5)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `yarn test 2>&1 | grep -A5 "PilotProfile model"`
Expected: FAIL — `Cannot find module '~~/server/models/PilotProfile'`

**Step 3: Write the implementation**

```typescript
// server/models/PilotProfile.ts
import mongoose from 'mongoose'
import type {
  FeatureWish, HardwareItem, NetworkExperience, OperatingSystem, PricingPreference,
  RadioPainPoint, Simulator, ToolkitDuration, ToolkitItem,
} from '~~/shared/onboarding/config'

export interface PilotProfileDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId
  simulator?: Simulator
  os?: OperatingSystem
  hardware: HardwareItem[]
  radioConfidence?: number
  radioPainPoint?: RadioPainPoint
  networkExperience: NetworkExperience[]
  toolkit: ToolkitItem[]
  toolkitDuration: Partial<Record<ToolkitItem, ToolkitDuration>>
  topFeatures: FeatureWish[]
  pricingPreference?: PricingPreference
  resultCallsign?: string
  completedAt?: Date
  skippedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const pilotProfileSchema = new mongoose.Schema<PilotProfileDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    simulator: { type: String },
    os: { type: String },
    hardware: { type: [String], default: () => [] },
    radioConfidence: { type: Number, min: 1, max: 5 },
    radioPainPoint: { type: String },
    networkExperience: { type: [String], default: () => [] },
    toolkit: { type: [String], default: () => [] },
    toolkitDuration: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    topFeatures: { type: [String], default: () => [] },
    pricingPreference: { type: String },
    resultCallsign: { type: String, trim: true },
    completedAt: { type: Date },
    skippedAt: { type: Date },
  },
  { timestamps: true },
)

export const PilotProfile =
  (mongoose.models.PilotProfile as mongoose.Model<PilotProfileDocument> | undefined) ||
  mongoose.model<PilotProfileDocument>('PilotProfile', pilotProfileSchema)
```

**Step 4: Run test to verify it passes**

Run: `yarn test 2>&1 | grep -A10 "PilotProfile model"`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add server/models/PilotProfile.ts server/models/PilotProfile.test.ts
git commit -m "feat(onboarding): add PilotProfile model"
```

---

### Task 3: Sanitization + callsign computation helpers

**Files:**
- Create: `server/utils/onboardingProfile.ts`
- Test: `server/utils/onboardingProfile.test.ts`

**Step 1: Write the failing tests**

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeOnboardingUpdate, computeResultCallsign } from '~~/server/utils/onboardingProfile'

describe('sanitizeOnboardingUpdate', () => {
  it('accepts a valid simulator value', () => {
    const result = sanitizeOnboardingUpdate({ simulator: 'msfs2024' })
    assert.equal(result.simulator, 'msfs2024')
  })

  it('drops an unknown simulator value', () => {
    const result = sanitizeOnboardingUpdate({ simulator: 'flightgear' })
    assert.equal('simulator' in result, false)
  })

  it('only keeps os when simulator is other', () => {
    const withOther = sanitizeOnboardingUpdate({ simulator: 'other', os: 'linux' })
    assert.equal(withOther.os, 'linux')
    const withMsfs = sanitizeOnboardingUpdate({ simulator: 'msfs2024', os: 'linux' })
    assert.equal('os' in withMsfs, false)
  })

  it('dedupes and filters hardware to known values', () => {
    const result = sanitizeOnboardingUpdate({ hardware: ['hotas', 'hotas', 'jetpack'] })
    assert.deepEqual(result.hardware, ['hotas'])
  })

  it('clamps radioConfidence to 1-5', () => {
    assert.equal(sanitizeOnboardingUpdate({ radioConfidence: 9 }).radioConfidence, 5)
    assert.equal(sanitizeOnboardingUpdate({ radioConfidence: 0 }).radioConfidence, 1)
    assert.equal(sanitizeOnboardingUpdate({ radioConfidence: 3.7 }).radioConfidence, 4)
  })

  it('caps topFeatures at MAX_FEATURE_WISHES', () => {
    const result = sanitizeOnboardingUpdate({
      topFeatures: ['live_ai_atc', 'more_airports', 'voice_packs'],
    })
    assert.equal(result.topFeatures?.length, 2)
  })

  it('only keeps toolkitDuration entries for tools present in toolkit', () => {
    const result = sanitizeOnboardingUpdate({
      toolkit: ['navigraph'],
      toolkitDuration: { navigraph: 'six_plus_months', sayintentions: 'trying' },
    })
    assert.deepEqual(result.toolkitDuration, { navigraph: 'six_plus_months' })
  })

  it('sets completedAt/skippedAt flags to true when requested', () => {
    assert.equal(sanitizeOnboardingUpdate({ completed: true }).completed, true)
    assert.equal(sanitizeOnboardingUpdate({ skipped: true }).skipped, true)
  })

  it('ignores unknown top-level fields', () => {
    const result = sanitizeOnboardingUpdate({ notAField: 'x' } as any)
    assert.equal('notAField' in result, false)
  })
})

describe('computeResultCallsign', () => {
  it('returns Subscription-Ready Power User for long-term paid-tool users choosing monthly', () => {
    const callsign = computeResultCallsign({
      toolkit: ['sayintentions'],
      toolkitDuration: { sayintentions: 'cant_fly_without' },
      pricingPreference: 'monthly',
    } as any)
    assert.equal(callsign, 'Subscription-Ready Power User')
  })

  it('returns Freeware Purist for free_self_host preference', () => {
    const callsign = computeResultCallsign({ pricingPreference: 'free_self_host' } as any)
    assert.equal(callsign, 'Freeware Purist')
  })

  it('returns Weekend VATSIM Learner for low-confidence network flyers', () => {
    const callsign = computeResultCallsign({
      networkExperience: ['vatsim'],
      radioConfidence: 2,
    } as any)
    assert.equal(callsign, 'Weekend VATSIM Learner')
  })

  it('falls back to a neutral default', () => {
    const callsign = computeResultCallsign({} as any)
    assert.equal(callsign, 'Cleared for Takeoff')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `yarn test 2>&1 | grep -A5 "sanitizeOnboardingUpdate\|computeResultCallsign"`
Expected: FAIL — `Cannot find module '~~/server/utils/onboardingProfile'`

**Step 3: Write the implementation**

```typescript
// server/utils/onboardingProfile.ts
import {
  SIMULATOR_OPTIONS, OS_OPTIONS, HARDWARE_OPTIONS, RADIO_PAIN_POINT_OPTIONS,
  NETWORK_OPTIONS, TOOLKIT_OPTIONS, PAID_TOOLKIT_VALUES, TOOLKIT_DURATION_OPTIONS,
  FEATURE_WISH_OPTIONS, PRICING_PREFERENCE_OPTIONS, MAX_FEATURE_WISHES,
} from '~~/shared/onboarding/config'
import type {
  FeatureWish, HardwareItem, NetworkExperience, OperatingSystem, PricingPreference,
  RadioPainPoint, Simulator, ToolkitDuration, ToolkitItem,
} from '~~/shared/onboarding/config'

const SIMULATOR_VALUES = new Set(SIMULATOR_OPTIONS.map(o => o.value))
const OS_VALUES = new Set(OS_OPTIONS.map(o => o.value))
const HARDWARE_VALUES = new Set(HARDWARE_OPTIONS.map(o => o.value))
const RADIO_PAIN_POINT_VALUES = new Set(RADIO_PAIN_POINT_OPTIONS.map(o => o.value))
const NETWORK_VALUES = new Set(NETWORK_OPTIONS.map(o => o.value))
const TOOLKIT_VALUES = new Set(TOOLKIT_OPTIONS.map(o => o.value))
const TOOLKIT_DURATION_VALUES = new Set(TOOLKIT_DURATION_OPTIONS.map(o => o.value))
const FEATURE_WISH_VALUES = new Set(FEATURE_WISH_OPTIONS.map(o => o.value))
const PRICING_PREFERENCE_VALUES = new Set(PRICING_PREFERENCE_OPTIONS.map(o => o.value))
const PAID_TOOLKIT_SET = new Set(PAID_TOOLKIT_VALUES)

function dedupeFiltered<T extends string>(input: unknown, allowed: Set<T>): T[] {
  if (!Array.isArray(input)) return []
  return Array.from(new Set(input.filter((v): v is T => typeof v === 'string' && allowed.has(v as T))))
}

export interface OnboardingUpdateInput {
  simulator?: unknown
  os?: unknown
  hardware?: unknown
  radioConfidence?: unknown
  radioPainPoint?: unknown
  networkExperience?: unknown
  toolkit?: unknown
  toolkitDuration?: unknown
  topFeatures?: unknown
  pricingPreference?: unknown
  completed?: unknown
  skipped?: unknown
}

export interface SanitizedOnboardingUpdate {
  simulator?: Simulator
  os?: OperatingSystem
  hardware?: HardwareItem[]
  radioConfidence?: number
  radioPainPoint?: RadioPainPoint
  networkExperience?: NetworkExperience[]
  toolkit?: ToolkitItem[]
  toolkitDuration?: Partial<Record<ToolkitItem, ToolkitDuration>>
  topFeatures?: FeatureWish[]
  pricingPreference?: PricingPreference
  completed?: boolean
  skipped?: boolean
}

/** WHY: os is only meaningful when simulator === 'other' — MSFS/X-Plane imply Windows/cross-platform already. */
export function sanitizeOnboardingUpdate(body: OnboardingUpdateInput): SanitizedOnboardingUpdate {
  const result: SanitizedOnboardingUpdate = {}

  if (typeof body.simulator === 'string' && SIMULATOR_VALUES.has(body.simulator as Simulator)) {
    result.simulator = body.simulator as Simulator
  }

  if (result.simulator === 'other' && typeof body.os === 'string' && OS_VALUES.has(body.os as OperatingSystem)) {
    result.os = body.os as OperatingSystem
  }

  if (body.hardware !== undefined) {
    result.hardware = dedupeFiltered(body.hardware, HARDWARE_VALUES)
  }

  if (typeof body.radioConfidence === 'number' && Number.isFinite(body.radioConfidence)) {
    result.radioConfidence = Math.min(5, Math.max(1, Math.round(body.radioConfidence)))
  }

  if (typeof body.radioPainPoint === 'string' && RADIO_PAIN_POINT_VALUES.has(body.radioPainPoint as RadioPainPoint)) {
    result.radioPainPoint = body.radioPainPoint as RadioPainPoint
  }

  if (body.networkExperience !== undefined) {
    result.networkExperience = dedupeFiltered(body.networkExperience, NETWORK_VALUES)
  }

  let toolkit: ToolkitItem[] | undefined
  if (body.toolkit !== undefined) {
    toolkit = dedupeFiltered(body.toolkit, TOOLKIT_VALUES)
    result.toolkit = toolkit
  }

  if (body.toolkitDuration !== undefined && body.toolkitDuration && typeof body.toolkitDuration === 'object') {
    const allowedTools = toolkit ?? []
    const duration: Partial<Record<ToolkitItem, ToolkitDuration>> = {}
    for (const [tool, value] of Object.entries(body.toolkitDuration as Record<string, unknown>)) {
      if (
        PAID_TOOLKIT_SET.has(tool as ToolkitItem) &&
        allowedTools.includes(tool as ToolkitItem) &&
        typeof value === 'string' &&
        TOOLKIT_DURATION_VALUES.has(value as ToolkitDuration)
      ) {
        duration[tool as ToolkitItem] = value as ToolkitDuration
      }
    }
    result.toolkitDuration = duration
  }

  if (body.topFeatures !== undefined) {
    result.topFeatures = dedupeFiltered(body.topFeatures, FEATURE_WISH_VALUES).slice(0, MAX_FEATURE_WISHES)
  }

  if (typeof body.pricingPreference === 'string' && PRICING_PREFERENCE_VALUES.has(body.pricingPreference as PricingPreference)) {
    result.pricingPreference = body.pricingPreference as PricingPreference
  }

  if (body.completed === true) result.completed = true
  if (body.skipped === true) result.skipped = true

  return result
}

interface CallsignInput {
  networkExperience?: NetworkExperience[]
  radioConfidence?: number
  toolkit?: ToolkitItem[]
  toolkitDuration?: Partial<Record<ToolkitItem, ToolkitDuration>>
  hardware?: HardwareItem[]
  pricingPreference?: PricingPreference
}

const LONG_TERM_DURATIONS = new Set<ToolkitDuration>(['six_plus_months', 'cant_fly_without'])

/**
 * Ordered rule list — first match wins. WHY ordered: a user can match multiple
 * archetypes (e.g. long-term Navigraph subscriber who also flies VATSIM); the
 * order reflects which signal is the strongest predictor for pricing conversations.
 */
export function computeResultCallsign(profile: CallsignInput): string {
  const hasLongTermPaidTool = (profile.toolkit ?? []).some(
    tool => LONG_TERM_DURATIONS.has(profile.toolkitDuration?.[tool] as ToolkitDuration),
  )

  if (hasLongTermPaidTool && profile.pricingPreference === 'monthly') {
    return 'Subscription-Ready Power User'
  }

  if (profile.pricingPreference === 'free_self_host') {
    return 'Freeware Purist'
  }

  if ((profile.hardware ?? []).some(h => h === 'yoke_pedals' || h === 'multi_monitor')) {
    return 'Cockpit Builder'
  }

  if ((profile.networkExperience ?? []).length > 0 && (profile.radioConfidence ?? 5) <= 3) {
    return 'Weekend VATSIM Learner'
  }

  if ((profile.networkExperience ?? []).length > 0) {
    return 'Network-Ready Radio Pro'
  }

  return 'Cleared for Takeoff'
}
```

**Step 4: Run tests to verify they pass**

Run: `yarn test 2>&1 | grep -A15 "sanitizeOnboardingUpdate\|computeResultCallsign"`
Expected: PASS (13 tests)

**Step 5: Commit**

```bash
git add server/utils/onboardingProfile.ts server/utils/onboardingProfile.test.ts
git commit -m "feat(onboarding): add sanitization and callsign computation helpers"
```

---

### Task 4: GET /api/onboarding/profile

**Files:**
- Create: `server/api/onboarding/profile.get.ts`

No new pure logic here (it's a thin auth + read), so this task is implemented directly
and verified via the manual check in Task 6 rather than a dedicated unit test — matching
how `server/api/learn/state.get.ts` has no test file of its own either.

**Step 1: Write the implementation**

```typescript
// server/api/onboarding/profile.get.ts
import { requireUserSession } from '../../utils/auth'
import { PilotProfile } from '../../models/PilotProfile'
import { createDefaultOnboardingProfile } from '~~/shared/onboarding/config'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const profile = await PilotProfile.findOne({ user: user._id })

  if (!profile) {
    return createDefaultOnboardingProfile()
  }

  return {
    simulator: profile.simulator ?? null,
    os: profile.os ?? null,
    hardware: profile.hardware ?? [],
    radioConfidence: profile.radioConfidence ?? null,
    radioPainPoint: profile.radioPainPoint ?? null,
    networkExperience: profile.networkExperience ?? [],
    toolkit: profile.toolkit ?? [],
    toolkitDuration: profile.toolkitDuration ?? {},
    topFeatures: profile.topFeatures ?? [],
    pricingPreference: profile.pricingPreference ?? null,
    resultCallsign: profile.resultCallsign ?? null,
    completedAt: profile.completedAt ? profile.completedAt.toISOString() : null,
    skippedAt: profile.skippedAt ? profile.skippedAt.toISOString() : null,
  }
})
```

**Step 2: Verify it type-checks**

Run: `yarn typecheck`
Expected: no new errors from this file.

**Step 3: Commit**

```bash
git add server/api/onboarding/profile.get.ts
git commit -m "feat(onboarding): add GET /api/onboarding/profile route"
```

---

### Task 5: PUT /api/onboarding/profile (+ LearnProfile radioLevel side effect)

**Files:**
- Create: `server/api/onboarding/profile.put.ts`

**Step 1: Write the implementation**

```typescript
// server/api/onboarding/profile.put.ts
import { readBody } from 'h3'
import { requireUserSession } from '../../utils/auth'
import { PilotProfile } from '../../models/PilotProfile'
import { LearnProfile } from '../../models/LearnProfile'
import { createDefaultLearnConfig } from '~~/shared/learn/config'
import { sanitizeOnboardingUpdate, computeResultCallsign, type OnboardingUpdateInput } from '../../utils/onboardingProfile'

/** WHY inverted: a low self-rated confidence should start the learner on the clearest,
 * least-static audio (radioLevel 5); a confident pilot gets more static (radioLevel 1). */
function radioConfidenceToLearnLevel(radioConfidence: number): number {
  return Math.min(5, Math.max(1, 6 - radioConfidence))
}

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const body = await readBody<OnboardingUpdateInput>(event)
  const update = sanitizeOnboardingUpdate(body)

  let profile = await PilotProfile.findOne({ user: user._id })
  if (!profile) {
    profile = new PilotProfile({ user: user._id })
  }

  if (update.simulator !== undefined) profile.simulator = update.simulator
  if (update.os !== undefined) profile.os = update.os
  if (update.hardware !== undefined) profile.hardware = update.hardware
  if (update.radioConfidence !== undefined) profile.radioConfidence = update.radioConfidence
  if (update.radioPainPoint !== undefined) profile.radioPainPoint = update.radioPainPoint
  if (update.networkExperience !== undefined) profile.networkExperience = update.networkExperience
  if (update.toolkit !== undefined) profile.toolkit = update.toolkit
  if (update.toolkitDuration !== undefined) profile.toolkitDuration = update.toolkitDuration
  if (update.topFeatures !== undefined) profile.topFeatures = update.topFeatures
  if (update.pricingPreference !== undefined) profile.pricingPreference = update.pricingPreference

  if (update.skipped) {
    profile.skippedAt = new Date()
  }

  if (update.completed) {
    profile.resultCallsign = computeResultCallsign(profile.toObject())
    profile.completedAt = new Date()
  }

  await profile.save()

  if (update.radioConfidence !== undefined) {
    const learnLevel = radioConfidenceToLearnLevel(update.radioConfidence)
    let learnProfile = await LearnProfile.findOne({ user: user._id })
    if (!learnProfile) {
      learnProfile = new LearnProfile({ user: user._id })
    }
    learnProfile.config = { ...createDefaultLearnConfig(), ...(learnProfile.config || {}), radioLevel: learnLevel }
    await learnProfile.save()
  }

  return {
    simulator: profile.simulator ?? null,
    os: profile.os ?? null,
    hardware: profile.hardware ?? [],
    radioConfidence: profile.radioConfidence ?? null,
    radioPainPoint: profile.radioPainPoint ?? null,
    networkExperience: profile.networkExperience ?? [],
    toolkit: profile.toolkit ?? [],
    toolkitDuration: profile.toolkitDuration ?? {},
    topFeatures: profile.topFeatures ?? [],
    pricingPreference: profile.pricingPreference ?? null,
    resultCallsign: profile.resultCallsign ?? null,
    completedAt: profile.completedAt ? profile.completedAt.toISOString() : null,
    skippedAt: profile.skippedAt ? profile.skippedAt.toISOString() : null,
  }
})
```

**Step 2: Run the full suite to make sure nothing broke**

Run: `yarn test`
Expected: all existing + new tests PASS

**Step 3: Commit**

```bash
git add server/api/onboarding/profile.put.ts
git commit -m "feat(onboarding): add PUT /api/onboarding/profile route with radioLevel side effect"
```

---

### Task 6: Redirect registration to the new page

**Files:**
- Modify: `app/pages/login.vue:451-473` (`submitRegister`)

**Step 1: Change the redirect target**

In `submitRegister()`, change:

```typescript
    await auth.fetchUser()
    setClassroomIntroductionComplete(false)
    await router.replace('/classroom-introduction')
```

to:

```typescript
    await auth.fetchUser()
    setClassroomIntroductionComplete(false)
    await router.replace('/pilot-profile-setup')
```

Leave everything else in `login.vue` untouched — `resolvePostAuthTarget` (used for
*returning* logged-in users hitting `/login`) intentionally still points at
`/classroom-introduction`/`/classroom`, since the profile setup is only for the
moment right after registration, not every login.

**Step 2: Commit**

```bash
git add app/pages/login.vue
git commit -m "feat(onboarding): send new registrations to pilot-profile-setup"
```

(This will momentarily 404 until Task 7 adds the page — that's fine, it lands in the
same PR/branch before merge.)

---

### Task 7: Build `/pilot-profile-setup` — shell, progress, screens 1-4

**Files:**
- Create: `app/pages/pilot-profile-setup.vue`

This is a UI-only task (this codebase has no component test harness — `yarn test`'s
glob is `tests/**`, `server/**`, `shared/**` only, confirmed in `package.json`).
Verify by running the dev server and clicking through, not by writing component tests.

**Step 1: Page shell + data loading + progress mechanics**

Build the page with:
- `definePageMeta({ middleware: 'require-auth' })`
- On mount: `GET /api/onboarding/profile`; if `completedAt` or `skippedAt` is already
  set, immediately `router.replace('/classroom-introduction')` (never show twice).
- Local reactive `answers` object seeded from `createDefaultOnboardingProfile()`,
  overwritten by the GET response (handles resuming after an accidental refresh).
- `currentStep` ref (0-6, corresponding to the 7 screens); `setupLog` computed array
  of the per-screen "setup log" strings (see design doc table) — render the ones up to
  `currentStep` as a scrolling log above/behind the progress bar, styled like
  `classroom-introduction.vue`'s `.progress-fill` bar.
- Progress percentage: `20 + Math.round((currentStep / ONBOARDING_TOTAL_STEPS) * 80)`
  (starts at 20% per the design's "registration already counts as step 1").
- `saveAnswer(partial)`: calls `PUT /api/onboarding/profile` with just the changed
  field(s), merges the response back into `answers`, then advances `currentStep`.
- `skip()`: calls `PUT /api/onboarding/profile` with `{ skipped: true }`, then
  `localStorage.setItem(CLASSROOM_INTRO_STORAGE_KEY, 'false')` and
  `router.replace('/classroom-introduction')`.
- A small, low-contrast "Skip for now" text link, always visible, bottom-right.
- Layout wrapper: reuse `learn-theme` class + the same background treatment as
  `classroom-introduction.vue` (`bg-[#070d1a] text-white`) for visual consistency.

Use a reusable local sub-component pattern (a `<template>` block or small inline
computed render, whichever fits — this file will be large; splitting each screen into
its own `<OptionCard>`-style local component within the same SFC via `<script setup>`
composition is fine, no need for separate files) for the icon-card:

```vue
<button
  type="button"
  class="option-card"
  :class="{ 'option-card--active': isSelected }"
  @click="onSelect"
>
  <v-icon :icon="option.icon" size="28" class="option-card__icon" />
  <span class="option-card__label">{{ option.label }}</span>
</button>
```

```css
.option-card {
  @apply flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-center text-sm text-white/80 transition hover:border-cyan-300/50 hover:bg-white/10;
}
.option-card--active {
  @apply border-cyan-300/60 bg-cyan-400/10 text-white shadow-lg shadow-cyan-500/10;
}
.option-card__icon {
  @apply text-cyan-300;
}
```

**Step 2: Screen 1 — Cockpit**

- Grid of `SIMULATOR_OPTIONS` cards, single-select.
- When `answers.simulator === 'other'`, reveal `OS_OPTIONS` cards beneath (single-select).
- Below a `<hr class="opacity-10 my-6">`, a visually smaller, de-emphasized row of
  `HARDWARE_OPTIONS` cards (multi-select toggle), labeled "Anything else in your
  setup? (optional)" in muted `text-white/40 text-xs uppercase tracking-widest`.
- "Continue" button calls `saveAnswer({ simulator, os, hardware })` — only include
  `os` if `simulator === 'other'`.

**Step 3: Screen 2 — Radio confidence**

- 5 cards numbered 1-5, label under each from `RADIO_CONFIDENCE_LABELS[n]`.
- Single-select, immediately calls `saveAnswer({ radioConfidence: n })` on click
  (no separate "Continue" — one-tap screens feel faster; matches the "tap-only, no
  extra chrome" principle from the design doc).

**Step 4: Screen 3 — Stress point**

- `RADIO_PAIN_POINT_OPTIONS` cards, single-select, one-tap advance like Screen 2.

**Step 5: Screen 4 — Network experience**

- `NETWORK_OPTIONS` cards (VATSIM / IVAO), multi-select toggle (0, 1, or 2 selected).
- "Continue" button (not one-tap, since 0 selections — "not yet" — is a valid deliberate answer, not a default).

**Step 6: Manual verification**

Run: `yarn dev`, register a fresh test account (or reuse an existing invitation code),
confirm:
- Landing on `/pilot-profile-setup` right after registering.
- Screens 1-4 render, selections persist visually, "Continue"/one-tap advance works.
- Network tab shows `PUT /api/onboarding/profile` firing after each screen with only
  the new field(s) in the body.
- Refreshing mid-flow resumes with previously-saved answers pre-selected (via the GET
  on mount).

**Step 7: Commit**

```bash
git add app/pages/pilot-profile-setup.vue
git commit -m "feat(onboarding): add pilot-profile-setup page shell and screens 1-4"
```

---

### Task 8: Screens 5-7 + reward card + finish wiring

**Files:**
- Modify: `app/pages/pilot-profile-setup.vue`

**Step 1: Screen 5 — Hangar tools**

- `TOOLKIT_OPTIONS` cards, multi-select toggle.
- For each selected value that's in `PAID_TOOLKIT_VALUES`, render a compact inline
  row directly under that card (not a new screen) with `TOOLKIT_DURATION_OPTIONS`
  as small pill-style single-select chips, bound to `answers.toolkitDuration[tool]`.
- "Continue" calls `saveAnswer({ toolkit, toolkitDuration })`.

**Step 2: Screen 6 — Feature wish**

- `FEATURE_WISH_OPTIONS` cards, multi-select capped at `MAX_FEATURE_WISHES` (2) —
  disable unselected cards once 2 are picked (visually grey out, not clickable) so the
  cap is obvious without an error message.
- "Continue" calls `saveAnswer({ topFeatures })`.

**Step 3: Screen 7 — Funding preference**

- Header copy: *"Some ideas need real development time — we won't fake that away. If
  that day comes, what would actually work for you?"*
- `PRICING_PREFERENCE_OPTIONS` cards, single-select, `free_self_host` positioned
  visually neutral (not last-and-smallest — same card size/grid position as the rest).
- Small reassurance line beneath the grid: *"Nothing here charges you or locks
  anything today — it just tells us what to build next."*
- Selecting calls `saveAnswer({ pricingPreference })` AND immediately
  `PUT /api/onboarding/profile` with `{ completed: true }` in the same request (merge
  both into one call: extend `saveAnswer` to accept an optional `finish: boolean` that
  adds `completed: true` to the body) — this is the screen where the flow finishes.

**Step 4: Reward card**

- After `completed: true` succeeds, the PUT response includes `resultCallsign` —
  render a final card view: big title (`resultCallsign`), a few stat lines pulled from
  `answers` (simulator label, toolkit labels, radio confidence label).
- "Enter Classroom" primary button: `localStorage.setItem(CLASSROOM_INTRO_STORAGE_KEY, 'false')`
  then `router.replace('/classroom-introduction')` — matches what `submitRegister()`
  used to do directly.
- Copy-link share button is a stretch goal — a simple `navigator.clipboard.writeText`
  of a static congratulatory string is enough for v1; no image export.

**Step 5: Manual end-to-end verification**

Run: `yarn dev`, walk the entire 7-screen flow for a fresh registration:
- Confirm the reward card shows a sensible callsign for a few different answer
  combinations (try one path that hits `Freeware Purist`, one that hits `Subscription-Ready Power User`).
- Confirm clicking "Enter Classroom" lands on `/classroom-introduction` and that page
  behaves exactly as before (unaffected by this change).
- Confirm clicking "Skip for now" at various points lands on `/classroom-introduction`
  too, and that reloading `/pilot-profile-setup` afterward redirects straight past it
  (since `skippedAt` is now set).
- Check `mdi-*` icons actually render (no broken icon glyphs) — swap any icon name
  that doesn't exist in the installed MDI set for a valid one.

**Step 6: Commit**

```bash
git add app/pages/pilot-profile-setup.vue
git commit -m "feat(onboarding): add screens 5-7, reward card, and finish flow"
```

---

## Follow-ups (not part of this plan)

- **Privacy policy**: `app/pages/datenschutz.vue` and the `acceptedPrivacyAt` consent
  captured at registration should be reviewed to confirm they cover this new
  product-preference data collection before rolling this out beyond the closed alpha.
  Flagged in the design doc; out of scope for this implementation plan.
- **Admin visibility**: surfacing `PilotProfile` data in the admin dashboard
  (`app/pages/admin/index.vue`) or KPI reports (`server/utils/kpiReport.ts`) is
  intentionally left out — v1 only needs the data captured and queryable directly in
  MongoDB.
