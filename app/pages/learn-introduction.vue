<template>
  <div class="relative min-h-screen bg-[#050713] text-white">
    <div class="pointer-events-none absolute inset-0 -z-10 opacity-70">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),_transparent_65%)]" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_70%)]" />
    </div>

    <div class="relative mx-auto max-w-5xl px-6 py-16 space-y-16">
      <header class="space-y-6">
        <NuxtLink
            to="/learn"
            class="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-cyan-300"
        >
          <v-icon icon="mdi-arrow-left" size="18" />
          Back to the training hub
        </NuxtLink>
        <div class="space-y-3">
          <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Pilot Voice Prep</p>
          <h1 class="text-3xl font-semibold sm:text-4xl">How the Learn training environment works</h1>
          <p class="max-w-3xl text-white/70">
            This introduction walks you through every part of the Learn page. It is a dedicated training ground to
            master radio phraseology and readbacks before you enter a live FSim session. The real-time Live AI ATC
            experience is still in closed testing, so what you have today is this learning platform — and it is the
            best way to prepare for understanding the comms flow once the live system opens up.
          </p>
        </div>
        <div class="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-2">
              <span class="inline-flex items-center gap-2 rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                <v-icon icon="mdi-radar" size="16" /> Training first
              </span>
              <h2 class="text-xl font-semibold">Not the live AI controller (yet)</h2>
              <p class="text-sm text-cyan-100/80">
                Use these modules to drill the phraseology, call structure, and timing. When Live AI ATC becomes
                publicly available you&apos;ll already know the flows, and your saved settings will carry over for a
                seamless upgrade.
              </p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              <ul class="space-y-2 list-disc pl-5">
                <li>Interactive modules mirror typical ATC phases.</li>
                <li>Controller audio is synthesized inside your browser — practice as often as needed.</li>
                <li>Progress, XP, and unlocks sync to your OpenSquawk account and can be reset anytime.</li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <section class="space-y-6">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="text-2xl font-semibold">Training flow at a glance</h2>
          <span class="text-sm uppercase tracking-[0.3em] text-white/40">Mission overview</span>
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <article
              v-for="step in missionSteps"
              :key="step.number"
              class="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Step {{ step.number }}</span>
              <v-icon :icon="step.icon" size="26" class="text-cyan-300" />
            </div>
            <h3 class="mt-4 text-xl font-semibold">{{ step.title }}</h3>
            <p class="mt-2 text-white/70">{{ step.description }}</p>
            <ul v-if="step.details?.length" class="mt-4 space-y-2 text-sm text-white/60 list-disc pl-5">
              <li v-for="point in step.details" :key="point">{{ point }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="text-2xl font-semibold">Inside a mission</h2>
          <span class="text-sm uppercase tracking-[0.3em] text-white/40">Workspace breakdown</span>
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <article
              v-for="area in workspaceAreas"
              :key="area.title"
              class="rounded-2xl border border-white/10 bg-[#0b1020]/80 p-6"
          >
            <div class="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-cyan-300/70">
              <v-icon :icon="area.icon" size="20" class="text-cyan-300" />
              <span>{{ area.label }}</span>
            </div>
            <h3 class="mt-3 text-lg font-semibold">{{ area.title }}</h3>
            <p class="mt-2 text-sm text-white/70">{{ area.description }}</p>
            <ul v-if="area.points?.length" class="mt-4 space-y-2 text-sm text-white/60 list-disc pl-5">
              <li v-for="point in area.points" :key="point">{{ point }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="text-2xl font-semibold">Controller &amp; audio settings</h2>
          <span class="text-sm uppercase tracking-[0.3em] text-white/40">Fine-tune your practice</span>
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <article
              v-for="option in settingsTips"
              :key="option.title"
              class="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div class="flex items-center gap-3">
              <v-icon :icon="option.icon" size="22" class="text-cyan-300" />
              <h3 class="text-lg font-semibold">{{ option.title }}</h3>
            </div>
            <p class="mt-3 text-sm text-white/70">{{ option.description }}</p>
          </article>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="text-2xl font-semibold">Progress tracking &amp; objectives</h2>
          <span class="text-sm uppercase tracking-[0.3em] text-white/40">Stay on course</span>
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <article
              v-for="item in progressHighlights"
              :key="item.title"
              class="rounded-2xl border border-white/10 bg-[#0b1020]/80 p-6"
          >
            <div class="flex items-center gap-3">
              <v-icon :icon="item.icon" size="22" class="text-cyan-300" />
              <h3 class="text-lg font-semibold">{{ item.title }}</h3>
            </div>
            <p class="mt-3 text-sm text-white/70">{{ item.description }}</p>
          </article>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="text-2xl font-semibold">Best practices before your FSim session</h2>
          <span class="text-sm uppercase tracking-[0.3em] text-white/40">Build confident habits</span>
        </div>
        <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
          <ul class="grid gap-4 text-sm text-white/70 md:grid-cols-2">
            <li v-for="tip in practiceTips" :key="tip" class="flex items-start gap-3">
              <span class="mt-1 text-cyan-300">✦</span>
              <span>{{ tip }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="text-2xl font-semibold">Frequently asked</h2>
          <span class="text-sm uppercase tracking-[0.3em] text-white/40">Quick answers</span>
        </div>
        <div class="space-y-4">
          <details
              v-for="faq in faqItems"
              :key="faq.question"
              class="group rounded-2xl border border-white/10 bg-[#0b1020]/80 p-5 transition"
          >
            <summary class="flex cursor-pointer items-center justify-between gap-3 text-left text-lg font-semibold text-white/90">
              {{ faq.question }}
              <v-icon icon="mdi-chevron-down" size="20" class="text-white/60 transition group-open:rotate-180" />
            </summary>
            <p class="mt-3 text-sm text-white/70">{{ faq.answer }}</p>
          </details>
        </div>
      </section>

      <section class="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-8 text-center">
        <h2 class="text-2xl font-semibold">Ready to continue your training?</h2>
        <p class="mt-3 text-sm text-cyan-50/80">
          Jump back into the Mission Hub, pick your next module, and keep stacking confident, high-quality readbacks.
        </p>
        <NuxtLink
            to="/learn"
            class="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-400/90 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#050713] transition hover:bg-cyan-300"
        >
          <v-icon icon="mdi-flag-checkered" size="18" />
          Return to Learn hub
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'require-auth'
})

useHead({
  title: 'Learn introduction – Pilot Voice Prep'
})

const missionSteps = [
  {
    number: '01',
    icon: 'mdi-view-dashboard',
    title: 'Explore the Mission Hub',
    description: 'Tiles organise the curriculum from alphabet drills to full-flight scenarios. Each tile shows how many lessons you have completed, your best average, and whether a mission is unlocked.',
    details: [
      'Locked missions display a “Clearance pending” overlay. Finish the prerequisite modules to unlock them.',
      'Use the primary button on each tile to start a fresh mission or resume exactly where you left off.'
    ]
  },
  {
    number: '02',
    icon: 'mdi-flag-checkered',
    title: 'Launch a module',
    description: 'When you open a mission you land on the module overview. Lessons are listed with keywords, scores, and order tags so you always know what comes next.',
    details: [
      'The module overview can expand or collapse. Hover or focus it to pin it open while you inspect lessons.',
      'Select any lesson card to jump directly to it — perfect for revisiting a specific procedure.'
    ]
  },
  {
    number: '03',
    icon: 'mdi-map-marker-path',
    title: 'Configure the scenario',
    description: 'Missions that need a flight plan start in the setup stage. Choose between an auto-generated route, manual inputs, or a SimBrief import so the controller phrases match the traffic you expect.',
    details: [
      'SimBrief imports remember your user ID locally for quick re-use and pull the latest dispatch in seconds.',
      'Manual setup expands detailed sections for callsigns, SIDs, STARs, and approaches — ideal when you want to mirror an upcoming online flight.'
    ]
  },
  {
    number: '04',
    icon: 'mdi-headset',
    title: 'Train inside the mission console',
    description: 'Lessons blend controller audio, hints, and structured readback fields. Listen to the ATC prompt, fill in the blanks, then evaluate your readback to see scores, similarity, and per-field feedback.',
    details: [
      'Use the dice icon to roll a brand-new scenario with different numbers, frequencies, and clearances without leaving the lesson.',
      'Mission footer controls keep you moving: repeat the current call, jump to the next lesson, or reopen the briefing when you need a quick refresh.'
    ]
  }
]

const workspaceAreas = [
  {
    label: 'Lesson navigator',
    title: 'Module overview & lesson track',
    icon: 'mdi-view-carousel',
    description: 'The left-hand lesson track mirrors the hub tile. It shows completion state, best score badges, and tags such as “Listen first” or “Departure”. Click any lesson to switch instantly.',
    points: [
      'Progress colours help you scan quickly: new lessons, in-progress drills, and ≥80% successes each have their own badge.',
      'Keyboard users can focus the overview to navigate with arrow keys and enter.'
    ]
  },
  {
    label: 'Scenario context',
    title: 'Scenario bar & frequency chips',
    icon: 'mdi-transit-connection-variant',
    description: 'Full-flight missions surface the active callsign, airports, and controller frequencies at the top of the console.',
    points: [
      'Click a frequency chip to highlight it and reveal the spoken words (e.g. “one two one decimal eight”).',
      'If you re-open a mission later, your last scenario stays loaded so you can continue where you paused.'
    ]
  },
  {
    label: 'Controller side',
    title: 'Briefing panel & target phrase',
    icon: 'mdi-account-voice',
    description: 'The left panel houses the controller briefing: you get the mission description, target phrase, and contextual hints.',
    points: [
      'Tap “Play” to hear the synthetic controller audio. The button animates while TTS is loading and switches to “Stop” when audio is playing.',
      'Enable the audio challenge in settings to blur the text until you decide to reveal it — great for pure listening drills.'
    ]
  },
  {
    label: 'Pilot side',
    title: 'Readback workspace',
    icon: 'mdi-form-textbox',
    description: 'On the right you respond. Structured blanks guide you through callsigns, altitudes, routes, and clearances.',
    points: [
      'Use Check to evaluate, Reset to clear inputs, and Auto-fill to review the correct answer when you want to study wording.',
      'Scores combine exact field matches with similarity, so you can see whether your free-text phrases still read correctly.'
    ]
  },
  {
    label: 'Mission control',
    title: 'Footer actions & pacing',
    icon: 'mdi-timer-sand',
    description: 'The mission footer summarises what is next and surfaces navigation.',
    points: [
      'New scenario rolls keep the same lesson but swap in new data so you can repeat the pattern until it is automatic.',
      'The “Next lesson” button adapts: it continues the module, advances to the next mission set, or confirms completion when you are done.'
    ]
  }
]

const settingsTips = [
  {
    title: 'Browser TTS or cloud voices',
    icon: 'mdi-volume-high',
    description: 'Toggle the Browser TTS switch to use the Web Speech voice built into your device. Leave it off to request higher-fidelity voices from OpenSquawk — ideal when you want crisp articulation.'
  },
  {
    title: 'Audio challenge mode',
    icon: 'mdi-eye-off-outline',
    description: 'When enabled, the target phrase and info stay blurred until you reveal them. It forces you to listen first, just like on frequency.'
  },
  {
    title: 'Radio readability & speed',
    icon: 'mdi-tune-variant',
    description: 'Use the radio level slider (1–5) to add static and reduced clarity, and adjust the speaking speed between 0.7× and 1.3× to simulate slow training to rapid live traffic.'
  },
  {
    title: 'Test, stop, and reset',
    icon: 'mdi-refresh-circle',
    description: 'Try sample transmissions with the Test button, stop playback instantly, or reset your entire training data set when you want a clean slate.'
  }
]

const progressHighlights = [
  {
    title: 'XP & level ring',
    icon: 'mdi-trophy-variant',
    description: 'Every successful readback adds XP. The orb on the hub shows your current level and how close you are to the next milestone.'
  },
  {
    title: 'Daily objectives',
    icon: 'mdi-calendar-check',
    description: 'Complete three ≥80% readbacks, start at least one module, and play the controller audio each day to clear the rotating set of goals.'
  },
  {
    title: 'Module & badge tracking',
    icon: 'mdi-shield-star-outline',
    description: 'A dedicated objective highlights the next mission to continue, and badge progress shows how many XP you still need for the next recognition level.'
  },
  {
    title: 'Account sync & reset',
    icon: 'mdi-cloud-sync',
    description: 'Your XP, configuration, and unlocks sync to your OpenSquawk account automatically. Use “Reset training data” in settings to wipe everything if you want to start from scratch.'
  }
]

const practiceTips = [
  'Speak the readback out loud before you type. It trains muscle memory for the phrasing you will use on-air.',
  'Roll a new scenario several times in a row. Repetition with varied data locks in the structure beyond rote memorisation.',
  'Mirror an upcoming event by entering your real callsign, route, and procedures in manual setup or via SimBrief import.',
  'Experiment with lower radio readability and faster speech so the live network never catches you off guard.',
  'Check the lesson hints and info cards whenever you stumble — they explain why a certain word or order matters.',
  'Schedule short, frequent sessions. Ten focused minutes each day easily clear the daily objectives and keep your XP climbing.'
]

const faqItems = [
  {
    question: 'Is this the same as the Live AI ATC I will use during FSim events?',
    answer: 'Not yet. The Live AI controller is still in private testing. The Learn page is the training environment available right now so you can master phraseology before the live system opens to everyone.'
  },
  {
    question: 'Will my progress carry over once Live AI launches?',
    answer: 'Yes. Your XP, unlocked modules, and ATC preferences sync to your OpenSquawk account. When the live controller goes public you will already have the fundamentals dialled in and the same settings ready.'
  },
  {
    question: 'Do I need any special equipment?',
    answer: 'A headset or microphone is highly recommended so you can speak the readbacks naturally, but you can still practise by typing. Browser-based TTS works on desktop and mobile as long as the page remains in focus.'
  }
]
</script>
