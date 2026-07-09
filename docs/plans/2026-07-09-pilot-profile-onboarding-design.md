# Pilot Profile Onboarding — Design

## Goal

After registration, capture pricing/feature/target-audience market research (pricing
model preference, feature priorities, sim/OS split, existing paid-tool usage, skill
level) without it reading as a market survey. Framed as "setting up your account" —
most questions double as real personalization (e.g. radio confidence sets the actual
Classroom difficulty), so the loading-bar narrative is mostly true, not a dark pattern.

Not a request to reintroduce any decision-routing logic — this is pure onboarding/
profile capture, unrelated to the Python backend's `/pm` decision engine.

## Placement in the flow

```
register.post.ts success
  → /pilot-profile-setup   (NEW — replaces immediate redirect)
      → on finish/skip → /classroom-introduction   (unchanged)
```

`login.vue` `submitRegister()` changes its `router.replace('/classroom-introduction')`
to `router.replace('/pilot-profile-setup')`. The new page's own finish/skip actions do
`setClassroomIntroductionComplete(false)` + `router.replace('/classroom-introduction')`
exactly as today.

`/pilot-profile-setup` is gated by `require-auth` middleware. On mount it checks
whether the user already has a `PilotProfile` with `completedAt` or `skippedAt` set —
if so, skip straight to `/classroom-introduction` (never show twice).

## UX mechanic

- One question per screen, large tappable **icon/wordmark cards** — not checkbox
  lists, not free text anywhere.
- A progress bar starts at ~20% (registration itself counts as step 1) and advances
  with each answered screen, labeled with a "setup log" line per screen (see table
  below) — e.g. "Calibrating radio clarity…". Several of these labels describe a real
  side effect (radio confidence → real `LearnProfile.config.radioLevel` write), which
  is the point: this isn't a fake progress bar dressing up a form, it's a real setup
  sequence that happens to also be the questionnaire.
- A small, low-salience "Skip" text link is always present (bottom corner, no button
  chrome). Skipping at any point marks `skippedAt` with whatever partial answers were
  already saved — never blocks access to the app.
- Each answered screen fires a small `PATCH` immediately (partial-save), so drop-offs
  still leave usable partial signal — matches the existing analytics-event pattern
  (`LandingAnalyticsEvent`, `UsageEvent`) rather than a single end-of-form submit.
- No third-party logos. No official trademarked graphics exist in the repo for any of
  these tools/sims, and using them without permission is a brand risk. Follows the
  existing convention in `bridge/index.vue` (MDI icon + brand-color badge, no real
  logos) — large colorful icon card + wordmark text instead. If real logo assets are
  later licensed, cards can swap the icon for an `<img>` without changing the data
  model.

## Question flow (7 screens + reward card)

| # | Screen | UI | "Setup log" label | Real signal captured |
|---|--------|----|--------------------|------------------------|
| 1 | **Cockpit** | Sim cards: MSFS 2024 / MSFS 2020 / X-Plane 12 / Other. If "Other" → inline OS cards (Windows/Mac/Linux) appear beneath. Below a soft divider, a de-emphasized optional hardware icon row (Keyboard+Mouse / HOTAS / Yoke+Pedals / Multi-Monitor) — no separate screen, low visual weight | "Configuring sim bridge…" | `simulator`, `os` (conditional), `hardware[]` (optional) |
| 2 | **Radio confidence** | 5 cards, escalating icon + flavor label ("First solo jitters" → "Sounds like a real dispatcher") | "Calibrating radio clarity…" | `radioConfidence` (1-5) — **also writes** `LearnProfile.config.radioLevel` |
| 3 | **Stress point** | Icon cards: Readbacks / Fast controllers / Phraseology / Accents / "I'm solid" | "Prioritizing your drills…" | `radioPainPoint` |
| 4 | **Network experience** | Wordmark cards: VATSIM / IVAO / Both / Not yet | "Tuning traffic density…" | `networkExperience[]` |
| 5 | **Hangar tools** | Multi-select wordmark cards: Navigraph / SimBrief / SayIntentions / BeyondATC / PilotEdge / None. Selecting a **paid** tool (Navigraph/SayIntentions/BeyondATC/PilotEdge) reveals a compact "how long?" row for that tool inline (Just trying / A few months / 6+ months / Can't fly without it) — still one screen | "Linking flight-planning tools…" | `toolkit[]`, `toolkitDuration{tool: enum}` — proxy for recurring-payment tolerance, no direct "would you pay monthly" question asked |
| 6 | **Feature wish** | Icon cards, tap up to 2 of 6-7 (Live AI ATC realism, more airports/scenarios, VATSIM-style network integration, structured Classroom lessons, custom voice packs, offline/faster STT, progress & badges) | "Prioritizing your roadmap…" | `topFeatures[]` (max 2) |
| 7 | **Funding preference** | Icon cards. Honest copy: *"Some ideas need real development time — we won't fake that away. If that day comes, what would actually work for you?"* Options: One-time unlock / Small monthly add-on / Bundle / season pass / I'd rather stay free-tier / self-host | "Noting upgrade preferences…" | `pricingPreference` — the actual pricing-model question, framed as the user's own preference rather than "would you pay?" |
| — | **Callsign card** (reward) | Generated title from answers (e.g. "Weekend VATSIM Learner", "Subscription-Ready Power User", "Freeware Purist") + a few stat badges. Share button optional/best-effort for v1 (copy-link is enough; image export is a stretch goal, not required) | — | `resultCallsign` (stored for reuse) |

## Psychological principles applied

- **Reciprocity framing** — every screen is phrased as us doing something *for* the
  user (calibrating, tuning, linking), not asking them to fill something out.
- **Progressive disclosure / foot-in-the-door** — easiest, identity-affirming question
  (cockpit) first; the one sensitive question (funding preference) near the end, right
  before the payoff.
- **Proxy over direct questions** — monthly-payment tolerance is inferred from
  existing paid-tool usage + duration (screen 5), never asked directly. Direct
  willingness-to-pay questions are known to under-report; behavioral proxies are both
  less uncomfortable and more valid.
- **Autonomy-supportive + honest framing for the one direct question** — screen 7 is
  unavoidably the pricing question, so instead of disguising it, it's transparent
  about *why* we're asking ("we won't fake that away") and includes a non-judged
  "stay free / self-host" option positioned neutrally, not last-and-worst.
- **Chunking + tap-only** — one decision per screen, no free text, no ranking/drag
  UI — minimizes decision fatigue and avoids the "written survey" feel entirely.
- **Curiosity-gap reward** — the callsign card is a personalized, variable payoff,
  which is what motivates completion, not the questions themselves.
- **Non-hierarchical labels** — skill self-assessment avoids "beginner/expert"
  language so nobody feels embarrassed picking the low end.

## Uncomfortable points identified & mitigations

- **Hardware question reading as "are you rich"** → kept intentionally small/optional
  and folded into the Cockpit screen instead of its own step, framed as setup detail
  ("anything else in your setup?"), not spending power.
- **Network-experience question feeling like a competence test** → no "wrong answer"
  framing anywhere, no gating of content based on the answer.
- **Funding-preference screen (the most sensitive one)** → explicit reassurance copy
  that nothing here charges the user or locks anything now; "stay free/self-host" is a
  legitimate, non-penalized option, not hidden at the bottom.
- **Fake-feeling progress bar** → mitigated structurally by making several setup-log
  labels literally true (radio calibration really happens), not just copy.
- **Data tied to an identifiable user record** → flagged as an open item: current
  privacy policy (`datenschutz.vue`) and the existing `acceptedPrivacyAt` consent at
  registration should be checked/extended to explicitly cover product-preference data
  collection. Not blocking for implementation, but should be resolved before shipping
  to real users outside the closed alpha.

## Data model

New model `server/models/PilotProfile.ts`, 1:1 with `User`, admin/internal-only
(same visibility tier as `FeedbackSubmission`, feeds into `kpiReport.ts`-style
reporting — no new user-facing surface beyond the callsign card):

```ts
interface PilotProfileDocument {
  user: ObjectId              // ref User, unique
  simulator?: 'msfs2024' | 'msfs2020' | 'xplane12' | 'other'
  os?: 'windows' | 'mac' | 'linux'                 // only when simulator === 'other'
  hardware: string[]                                 // optional, subset of fixed enum
  radioConfidence?: number                          // 1-5
  radioPainPoint?: 'readbacks' | 'fast_controllers' | 'phraseology' | 'accents' | 'none'
  networkExperience: string[]                       // subset of vatsim/ivao/none
  toolkit: string[]                                 // subset of fixed tool enum
  toolkitDuration: Record<string, string>            // per selected paid tool
  topFeatures: string[]                              // max 2, fixed feature enum
  pricingPreference?: 'one_time' | 'monthly' | 'season_pass' | 'free_self_host'
  resultCallsign?: string
  completedAt?: Date
  skippedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

## Backend

- `PATCH /api/service/onboarding/profile` — upserts the caller's `PilotProfile` with
  whatever partial fields are sent; called once per answered screen. When
  `radioConfidence` is included, also upserts `LearnProfile.config.radioLevel` for
  that user (the one real side effect).
- `POST /api/service/onboarding/profile/complete` (or a `finished: true` flag on the
  same PATCH) — sets `completedAt`, computes and stores `resultCallsign` server-side
  from the accumulated answers, returns it for the reward card.
- `POST /api/service/onboarding/profile/skip` — sets `skippedAt` on whatever partial
  document exists.
- All three require auth (same middleware pattern as other `service` routes) and are
  scoped to `event.context.user` — no ability to write another user's profile.

## Out of scope for v1

- Real third-party logo assets (wordmark cards only, see UX mechanic).
- Image export / social share of the callsign card (copy-link is enough).
- Editing answers later from account settings.
- Any change to `/pm` decision routing, the Python backend, or `communicationsEngine.ts`.
