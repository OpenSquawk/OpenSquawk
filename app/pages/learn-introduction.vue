<template>
  <div class="bg-[#0b1020] text-white min-h-screen pb-24">
    <header class="border-b border-white/10 bg-[#0b1020]/80 backdrop-blur">
      <div class="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 md:px-8">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
            <v-icon icon="mdi-radar" size="26" class="text-cyan-300" />
          </div>
          <div>
            <p class="text-lg font-semibold tracking-tight">OpenSquawk Learn</p>
            <p class="text-sm text-white/60">Training introduction</p>
          </div>
        </div>
        <NuxtLink
            to="/learn"
            class="inline-flex items-center gap-2 rounded-xl bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-[#0b1020] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
        >
          <v-icon icon="mdi-play-circle" size="18" class="text-[#0b1020]" />
          Enter training hub
        </NuxtLink>
      </div>
    </header>

    <main>
      <section class="relative overflow-hidden border-b border-white/5">
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-indigo-500/25" aria-hidden="true"></div>
        <div class="relative z-10 mx-auto w-full max-w-screen-xl px-4 py-16 sm:px-6 md:px-8 md:py-24">
          <div class="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
            <div class="space-y-6">
              <span class="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Guide</span>
              <h1 class="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
                Understand the Learn mission trainer
              </h1>
              <p class="max-w-2xl text-base text-white/80 sm:text-lg">
                This walkthrough explains how the Learn page works today. The hosted live AI ATC that you will use during full simulator sessions is still private—what is available now is the dedicated training environment that lets you drill readbacks, phraseology and radio discipline before you ever connect to the network.
              </p>
              <div class="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-amber-100 shadow-lg shadow-amber-500/10" role="status">
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/50 bg-amber-300/20">
                    <v-icon icon="mdi-alert-decagram-outline" size="22" class="text-amber-200" />
                  </div>
                  <div class="space-y-1">
                    <p class="text-sm font-semibold uppercase tracking-wide text-amber-100/90">Current status</p>
                    <p class="text-sm text-amber-50/90">
                      Live AI ATC is in closed testing. The Learn hub is the publicly available path today and already gives you structured practice with the same phraseology the AI will expect.
                    </p>
                  </div>
                </div>
              </div>
              <ul class="grid gap-3 text-sm text-white/70 sm:grid-cols-2 sm:text-base">
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-target" size="20" class="mt-1 text-cyan-300" />
                  <span>Practice ICAO alphabet, clearances, taxi and full-flight sequences with instant scoring.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-sync" size="20" class="mt-1 text-cyan-300" />
                  <span>Progress, XP and mission states sync with your OpenSquawk account when you are signed in.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-headset" size="20" class="mt-1 text-cyan-300" />
                  <span>Simulate radio conditions with audio challenge mode, radio readability levels and adjustable ATC speed.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-airplane-clock" size="20" class="mt-1 text-cyan-300" />
                  <span>Import a SimBrief dispatch or handcraft your own flight to rehearse real-world trips.</span>
                </li>
              </ul>
            </div>
            <div class="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-500/10">
              <div class="rounded-2xl border border-white/10 bg-black/40 p-6">
                <h2 class="text-lg font-semibold">What you will learn</h2>
                <p class="mt-3 text-sm text-white/70">
                  The Learn hub mirrors the workflow of real operations in a simulator session:
                </p>
                <ul class="mt-4 space-y-3 text-sm text-white/70">
                  <li class="flex items-start gap-3">
                    <v-icon icon="mdi-radar" size="18" class="mt-0.5 text-cyan-300" />
                    <span>Mission hub tiles show which module is next, what is new and your completion percentage.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <v-icon icon="mdi-clipboard-text-outline" size="18" class="mt-0.5 text-cyan-300" />
                    <span>Briefings consolidate runway data, weather, frequencies and squawk codes before every scenario.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <v-icon icon="mdi-check-decagram" size="18" class="mt-0.5 text-cyan-300" />
                    <span>Lesson scoring highlights each field so you can spot weak spots instantly and reroll new scenarios.</span>
                  </li>
                </ul>
              </div>
              <div class="rounded-2xl border border-white/10 bg-black/30 p-6">
                <h3 class="text-base font-semibold">Available mission modules</h3>
                <ul class="mt-3 space-y-3 text-sm text-white/70">
                  <li v-for="module in moduleSummaries" :key="module.title" class="flex items-start gap-3">
                    <v-icon :icon="module.icon" size="18" class="mt-0.5 text-cyan-300" />
                    <span><strong class="font-semibold text-white">{{ module.title }}</strong> – {{ module.description }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-16 sm:py-20">
        <div class="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
          <div class="max-w-3xl space-y-4">
            <h2 class="text-2xl font-semibold sm:text-3xl">Mission structure at a glance</h2>
            <p class="text-base text-white/70">
              Every module follows the same rhythm: pick a mission, brief it, practice the calls and keep leveling up. Use these cards as a quick reference when you load into the Learn hub.
            </p>
          </div>
          <div class="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <article
                v-for="card in overviewCards"
                :key="card.title"
                class="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-black/20"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
                  <v-icon :icon="card.icon" size="22" class="text-cyan-300" />
                </div>
                <h3 class="text-lg font-semibold">{{ card.title }}</h3>
              </div>
              <p class="text-sm text-white/70">{{ card.description }}</p>
              <ul class="space-y-2 text-sm text-white/60">
                <li v-for="point in card.points" :key="point" class="flex items-start gap-2">
                  <v-icon icon="mdi-check" size="16" class="mt-1 text-cyan-300" />
                  <span>{{ point }}</span>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section class="border-y border-white/5 bg-white/5 py-16 sm:py-20">
        <div class="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
          <div class="max-w-2xl space-y-4">
            <h2 class="text-2xl font-semibold sm:text-3xl">From first login to finished mission</h2>
            <p class="text-base text-white/70">Follow this flow whenever you load into Learn. Each step mirrors what you will do later with live controllers.</p>
          </div>
          <ol class="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <li
                v-for="step in stepFlow"
                :key="step.title"
                class="relative flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-[#0b1020]/80 p-6 shadow-lg shadow-black/20"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Step</span>
                <span class="text-3xl font-semibold text-cyan-300/70">{{ step.order }}</span>
              </div>
              <h3 class="text-lg font-semibold">{{ step.title }}</h3>
              <p class="text-sm text-white/70">{{ step.description }}</p>
              <ul v-if="step.tips?.length" class="space-y-2 text-sm text-white/60">
                <li v-for="tip in step.tips" :key="tip" class="flex items-start gap-2">
                  <v-icon icon="mdi-arrow-right" size="16" class="mt-1 text-cyan-300" />
                  <span>{{ tip }}</span>
                </li>
              </ul>
            </li>
          </ol>
        </div>
      </section>

      <section class="py-16 sm:py-20">
        <div class="mx-auto w-full max-w-screen-xl space-y-12 px-4 sm:px-6 md:px-8">
          <div class="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <div class="space-y-4">
              <h2 class="text-2xl font-semibold sm:text-3xl">Inside the lesson console</h2>
              <p class="text-base text-white/70">
                The console simulates a busy ATC frequency. Each panel maps to a task you will perform when talking to live controllers, so mastering it here speeds up your first real session.
              </p>
              <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 class="text-base font-semibold">Navigation quick hits</h3>
                <ul class="mt-3 space-y-3 text-sm text-white/70">
                  <li class="flex items-start gap-3">
                    <v-icon icon="mdi-format-list-bulleted" size="18" class="mt-0.5 text-cyan-300" />
                    <span>Use the “Mission overview” dropdown on the left to jump between lessons and monitor completion.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <v-icon icon="mdi-history" size="18" class="mt-0.5 text-cyan-300" />
                    <span>The footer buttons move to the previous or next lesson, or roll a brand-new scenario on demand.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <v-icon icon="mdi-eye-off" size="18" class="mt-0.5 text-cyan-300" />
                    <span>Enable Audio challenge mode if you want to hide the target text until you intentionally reveal it.</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="grid gap-6 md:grid-cols-2">
              <article
                  v-for="consoleCard in consoleHighlights"
                  :key="consoleCard.title"
                  class="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-black/10"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
                    <v-icon :icon="consoleCard.icon" size="20" class="text-cyan-300" />
                  </div>
                  <h3 class="text-base font-semibold">{{ consoleCard.title }}</h3>
                </div>
                <p class="text-sm text-white/70">{{ consoleCard.description }}</p>
                <ul class="space-y-2 text-sm text-white/60">
                  <li v-for="item in consoleCard.points" :key="item" class="flex items-start gap-2">
                    <v-icon icon="mdi-checkbox-blank-circle" size="10" class="mt-1 text-cyan-300" />
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </article>
            </div>
          </div>

          <div class="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div class="space-y-4">
              <h3 class="text-xl font-semibold">Progress, XP and objectives</h3>
              <p class="text-base text-white/70">
                The Learn hub keeps you motivated with a lightweight progression system. Every graded readback adds XP, updates your badge track and keeps your next objective front and center.
              </p>
              <ul class="space-y-3 text-sm text-white/70">
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-trophy" size="18" class="mt-0.5 text-cyan-300" />
                  <span>The “Your progress” card in the hub shows your current level, XP percentage and the next badge you are chasing.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-chart-areaspline" size="18" class="mt-0.5 text-cyan-300" />
                  <span>Primary objectives focus on your weakest area—for example finishing remaining lessons or raising an average score.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-cloud-check" size="18" class="mt-0.5 text-cyan-300" />
                  <span>State is stored locally for offline practice and syncs to the cloud whenever you are logged in, so you can resume anywhere.</span>
                </li>
              </ul>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/10">
              <div class="flex items-center gap-4">
                <div class="relative flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/50 bg-black/60">
                  <span class="text-2xl font-semibold text-cyan-200">XP</span>
                  <span class="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400/90 px-3 py-1 text-xs font-semibold text-[#0b1020]">Level up</span>
                </div>
                <div class="space-y-2 text-sm text-white/70">
                  <p>Expect a toast every time you pass a lesson. Higher accuracy awards more XP and unlocks new badges.</p>
                  <p class="text-white/60">Use the reset option in the settings dialog if you ever want to start from scratch on that device.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="border-y border-white/5 bg-[#0d1426]/80 py-16 sm:py-20">
        <div class="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
          <div class="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
            <div class="space-y-4">
              <h2 class="text-2xl font-semibold sm:text-3xl">ATC settings & supporting tools</h2>
              <p class="text-base text-white/70">
                Click the “ATC” button in the top-right HUD inside Learn to fine-tune how the radio behaves. These controls help you match the noise level and pacing you expect online.
              </p>
              <div class="grid gap-6 md:grid-cols-2">
                <article
                    v-for="setting in settings"
                    :key="setting.title"
                    class="flex h-full flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
                      <v-icon :icon="setting.icon" size="20" class="text-cyan-300" />
                    </div>
                    <h3 class="text-base font-semibold">{{ setting.title }}</h3>
                  </div>
                  <p class="text-sm text-white/70">{{ setting.description }}</p>
                </article>
              </div>
            </div>
            <aside class="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30">
              <h3 class="text-base font-semibold">Training tips</h3>
              <ul class="space-y-3 text-sm text-white/70">
                <li v-for="tip in trainingTips" :key="tip" class="flex items-start gap-3">
                  <v-icon icon="mdi-lightbulb-on-outline" size="18" class="mt-0.5 text-cyan-300" />
                  <span>{{ tip }}</span>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section class="py-16 sm:py-20">
        <div class="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
          <div class="max-w-3xl space-y-4">
            <h2 class="text-2xl font-semibold sm:text-3xl">Frequently asked</h2>
            <p class="text-base text-white/70">Still unsure about something? These answers cover the questions pilots ask most often when they start using the Learn hub.</p>
          </div>
          <div class="mt-10 space-y-6">
            <details
                v-for="faq in faqs"
                :key="faq.question"
                class="group rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            >
              <summary class="flex cursor-pointer items-center justify-between gap-4 text-left text-lg font-semibold">
                <span>{{ faq.question }}</span>
                <v-icon icon="mdi-chevron-down" size="20" class="text-cyan-300 transition group-open:rotate-180" />
              </summary>
              <p class="mt-4 text-sm text-white/70">{{ faq.answer }}</p>
            </details>
          </div>
        </div>
      </section>

      <section class="py-16 sm:py-20">
        <div class="mx-auto w-full max-w-screen-xl px-4 text-center sm:px-6 md:px-8">
          <div class="mx-auto max-w-2xl space-y-4">
            <h2 class="text-2xl font-semibold sm:text-3xl">Ready to start training?</h2>
            <p class="text-base text-white/70">
              Jump into the Learn hub, pick the module that matches your goals and repeat each mission until the readback feels automatic. When live AI ATC opens to the public, you will already sound like a pro.
            </p>
          </div>
          <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
            <NuxtLink
                to="/learn"
                class="inline-flex items-center gap-2 rounded-2xl bg-cyan-400/90 px-6 py-3 text-base font-semibold text-[#0b1020] shadow-xl shadow-cyan-500/25 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
            >
              <v-icon icon="mdi-launch" size="20" class="text-[#0b1020]" />
              Open the Learn hub
            </NuxtLink>
            <NuxtLink
                to="/"
                class="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-base font-semibold text-white/80 transition hover:border-cyan-400/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
            >
              <v-icon icon="mdi-home-outline" size="20" class="text-cyan-300" />
              Back to homepage
            </NuxtLink>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const moduleSummaries = [
  {
    icon: 'mdi-alpha',
    title: 'Fundamentals · Basics',
    description: 'Drill the ICAO alphabet, numbers, ATIS and METAR decoding so every call starts clean.'
  },
  {
    icon: 'mdi-walkie-talkie',
    title: 'Readbacks · Essential Calls',
    description: 'Practice clearances, taxi instructions, approach handoffs and landing confirmations.'
  },
  {
    icon: 'mdi-traffic-light',
    title: 'ATC · Advanced Calls',
    description: 'Handle requests, contingencies and priority interruptions with confidence.'
  },
  {
    icon: 'mdi-airplane',
    title: 'Full Flight · Gate to Gate',
    description: 'String everything together with a single scenario from clearance to taxi-in, including flight planning.'
  }
] as const

const overviewCards = [
  {
    icon: 'mdi-radar',
    title: 'Mission hub overview',
    description: 'The Learn landing page lists all available training modules with unlockable tiles and live progress bars.',
    points: [
      'Start with Fundamentals to unlock Readbacks, Advanced calls and the full-flight mission.',
      'Tiles display how many lessons you have completed plus the average score for each mission.',
      'Locked modules explain what to do next so you always know the next action to unlock them.'
    ]
  },
  {
    icon: 'mdi-clipboard-text',
    title: 'Mission setup & briefing',
    description: 'Modules with flight planning walk you through random flights, manual inputs or SimBrief imports before training.',
    points: [
      'Random flights instantly generate a realistic callsign, route and weather—reroll as often as you like.',
      'Manual planning lets you recreate an upcoming simulator session down to the runway and squawk code.',
      'Paste your SimBrief pilot ID to pull the most recent dispatch and load it straight into the briefing.'
    ]
  },
  {
    icon: 'mdi-teach',
    title: 'Lesson console & scoring',
    description: 'Each lesson plays an ATC transmission, asks for your readback and grades every field for accuracy.',
    points: [
      'Listen with the speaker button, stop playback anytime or reveal the text if audio challenge mode hides it.',
      'Fill the blanks, hit Check and review the per-field breakdown with similarity percentages.',
      'Use Reset to clear entries, Auto-fill to study the perfect answer and New scenario to reroll fresh data.'
    ]
  }
] as const

const stepFlow = [
  {
    order: '01',
    title: 'Sign in and open the mission hub',
    description: 'Head to /learn after logging in. The top HUD confirms you are in training mode with mission tiles below.',
    tips: ['If you are returning, the hub restores the last module you opened so you can continue immediately.']
  },
  {
    order: '02',
    title: 'Choose a module',
    description: 'Select Fundamentals for basics, Readbacks for clearances, Advanced for edge cases or Full Flight for an end-to-end run.',
    tips: ['Hover a tile to see your completion stats and the main skills a module covers.']
  },
  {
    order: '03',
    title: 'Lock in a flight (if required)',
    description: 'Some missions need a flight plan first. Pick random, manual or SimBrief and confirm the details before proceeding.',
    tips: ['Keep rerolling random flights until you find a route that matches the procedures you want to practice.']
  },
  {
    order: '04',
    title: 'Brief the mission',
    description: 'Review the hero briefing card for runways, frequencies, weather, squawk and any altitude or timing calls.',
    tips: ['Use the art and bullet cards to double-check SID, STAR and weather cues before clicking Start mission.']
  },
  {
    order: '05',
    title: 'Practice the lesson',
    description: 'Listen to the ATC call, complete the readback blanks, evaluate and iterate until the score feels consistent.',
    tips: ['Activate audio challenge to force yourself to decode the call without reading ahead for extra realism.']
  },
  {
    order: '06',
    title: 'Advance & celebrate progress',
    description: 'Use the footer navigation to move on. XP awards update your level, objectives and badges automatically.',
    tips: ['Aim for 80%+ on each lesson to turn the progress bars green and unlock the next missions faster.']
  }
] as const

const consoleHighlights = [
  {
    icon: 'mdi-volume-high',
    title: 'Target audio & phrase',
    description: 'The target panel plays the ATC call and shows reference text when revealed.',
    points: [
      'Speaker button triggers TTS. The stop icon halts playback instantly if you want to replay.',
      'Audio challenge hides the phrase until you click “Reveal text”, ideal for training pure listening skills.',
      'The dice icon (“Roll”) swaps in a new scenario with fresh numbers, frequencies or weather.'
    ]
  },
  {
    icon: 'mdi-form-textbox',
    title: 'Readback workspace',
    description: 'Fields highlight success or gaps so you can focus revisions on weak spots.',
    points: [
      'Green checks confirm each blank is correct; amber warns you which element still needs work.',
      'Similarity percentages quantify how close your wording is even when it is not a perfect match.',
      'Hints and info pills recap phraseology rules, conversions and contextual data from the scenario.'
    ]
  },
  {
    icon: 'mdi-auto-fix',
    title: 'Evaluation controls',
    description: 'Three buttons keep the repetition loop tight and efficient.',
    points: [
      '“Check” grades your readback and pushes XP when you pass.',
      '“Reset” clears all answers so you can attempt the same call again without leaving the lesson.',
      '“Auto-fill” drops in the official solution—great for studying how the AI expects the wording.'
    ]
  },
  {
    icon: 'mdi-timeline-clock',
    title: 'Mission footer & sequencing',
    description: 'The bottom toolbar ensures you always know what comes next.',
    points: [
      'Previous and Next buttons move between lessons or modules, showing the upcoming topic in the hint.',
      '“New scenario” in the footer mirrors the dice button for quick-fire repetitions of the same skill.',
      'When you finish a mission the footer points you to the next module so you keep momentum.'
    ]
  }
] as const

const settings = [
  {
    icon: 'mdi-voice',
    title: 'Browser TTS toggle',
    description: 'Switch between browser-based speech (fast, offline) and the hosted AI voice for richer delivery.'
  },
  {
    icon: 'mdi-eye-outline',
    title: 'Audio challenge',
    description: 'Hide target text until you reveal it manually. Perfect for practicing pure listening comprehension.'
  },
  {
    icon: 'mdi-signal-variant',
    title: 'Radio level',
    description: 'Set readability from 1 (noisy) to 5 (crisp) to simulate different radio conditions.'
  },
  {
    icon: 'mdi-speedometer',
    title: 'ATC speaking speed',
    description: 'Adjust playback between 0.7× and 1.3× to slow down or accelerate the controller cadence.'
  },
  {
    icon: 'mdi-volume-high',
    title: 'Quick test',
    description: 'Use the built-in sample phrase to confirm your audio output and chosen voice before starting a mission.'
  },
  {
    icon: 'mdi-refresh',
    title: 'Reset training data',
    description: 'Clear XP, progress and local settings on the current device if you want a fresh slate.'
  }
] as const

const trainingTips = [
  'Repeat each lesson five to ten times with the dice “Roll” action to lock in the phraseology muscle memory.',
  'Alternate between modules—revisit Fundamentals after a complex mission to keep basics sharp.',
  'Use manual flight plans to rehearse a real-world route you intend to fly on VATSIM or another network.',
  'Turn on audio challenge and drop the radio level when you are comfortable to stress-test comprehension.'
] as const

const faqs = [
  {
    question: 'Is this the same AI that will control my simulator session?',
    answer: 'Not yet. The Learn hub is a standalone training environment. Live AI ATC is still in closed testing, but the phraseology and flows you practice here match what the live system will expect.'
  },
  {
    question: 'Do I need a SimBrief account to use Learn?',
    answer: 'No. SimBrief import is optional. You can generate random flights instantly or enter your own departure, arrival and route data manually.'
  },
  {
    question: 'How is my progress saved?',
    answer: 'Your XP, lesson scores, mission state and settings are stored locally for offline work and sync to your OpenSquawk account whenever you are logged in.'
  },
  {
    question: 'Can I restart my training?',
    answer: 'Yes. Open the ATC settings dialog and use “Reset training data” to clear progress on the current device before starting again.'
  },
  {
    question: 'Which devices work best?',
    answer: 'Learn runs in the browser on desktop or laptop. A headset or microphone is optional today—the trainer focuses on readbacks you type, not voice recognition yet.'
  }
] as const
</script>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}

details {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

details[open] {
  border-color: rgba(34, 211, 238, 0.4);
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.15), 0 25px 50px -12px rgba(15, 118, 110, 0.35);
}

details summary {
  outline: none;
}

details summary:focus-visible {
  outline: 2px solid rgba(165, 243, 252, 0.8);
  outline-offset: 4px;
}
</style>
