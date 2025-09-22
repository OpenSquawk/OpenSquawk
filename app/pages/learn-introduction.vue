<template>
  <div class="bg-[#050910] text-white min-h-screen antialiased">
    <header class="border-b border-white/10 bg-[#050910]/80 backdrop-blur">
      <div class="container-outer py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
            <v-icon icon="mdi-arrow-left" size="18" />
            Back to home
          </NuxtLink>
          <div class="mt-4 flex items-center gap-3">
            <v-chip size="small" color="cyan" variant="outlined" class="uppercase tracking-[0.35em] text-[10px] text-cyan-300/90">
              Learn orientation
            </v-chip>
            <span class="text-xs text-white/60">Guided tour</span>
          </div>
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-semibold mt-4 tracking-tight">
            Welcome to the Training Hangar
          </h1>
          <p class="mt-3 text-sm sm:text-base text-white/70 max-w-2xl">
            This orientation shows you how the <strong>Learn mission hub</strong> works. It's our offline training ground for radio
            phraseology and flows. The live AI ATC that will work inside your simulator is still in closed testing, so this platform
            focuses on sharpening your comms, confidence and muscle memory first.
          </p>
        </div>
        <v-alert
            type="info"
            variant="tonal"
            color="cyan"
            class="bg-cyan-500/10 border border-cyan-400/30 text-white/80 text-sm md:max-w-sm"
        >
          Live AI ATC is not public yet. Completing these lessons gets you ready faster once the network opens up.
        </v-alert>
      </div>
    </header>

    <main class="space-y-20 pb-16">
      <!-- Overview + Orientation Switcher -->
      <section class="container-outer pt-12">
        <div class="grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
          <div class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="card p-5 space-y-3">
                <div class="flex items-center gap-2 text-cyan-300">
                  <v-icon icon="mdi-headset" size="20" />
                  <span class="text-sm uppercase tracking-[0.2em] text-white/70">Why training first?</span>
                </div>
                <p class="text-sm text-white/70">
                  We simulate VATSIM-style interactions without needing an active controller. Practice callouts, readbacks and
                  listening discipline in a safe loop.
                </p>
                <ul class="space-y-2 text-sm text-white/60">
                  <li class="flex items-start gap-2">
                    <v-icon icon="mdi-check-circle" size="18" class="mt-[2px] text-cyan-400" />
                    <span>Drills cover ICAO alphabet, numbers and scenario-driven phraseology.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <v-icon icon="mdi-check-circle" size="18" class="mt-[2px] text-cyan-400" />
                    <span>Feedback and scoring keep you accountable before you ever key the mic live.</span>
                  </li>
                </ul>
              </div>
              <div class="card p-5 space-y-3">
                <div class="flex items-center gap-2 text-amber-300">
                  <v-icon icon="mdi-airplane-clock" size="20" />
                  <span class="text-sm uppercase tracking-[0.2em] text-white/70">What's coming?</span>
                </div>
                <p class="text-sm text-white/70">
                  Hosted AI ATC will hand off clearances in your simulator later. Finish these modules to be on the fast lane for
                  live invites.
                </p>
                <div class="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
                  <strong>Tip:</strong> Sync your waitlist email so we can unlock the network when it's ready for you.
                </div>
              </div>
            </div>

            <div class="card orientation">
              <div class="orientation-body">
                <h2 class="text-2xl font-semibold">Choose your quick briefing</h2>
                <p class="text-white/70 text-sm max-w-xl">
                  Pick what you want to understand first. We'll highlight the most important controls and expectations for that area of
                  the Learn page.
                </p>
              </div>
              <div class="orientation-grid">
                <v-chip-group
                    v-model="selectedOrientation"
                    mandatory
                    column
                    class="orientation-menu"
                >
                  <v-chip
                      v-for="section in orientationSections"
                      :key="section.id"
                      :value="section.id"
                      class="orientation-chip"
                      variant="outlined"
                      color="cyan"
                      size="large"
                  >
                    <v-icon :icon="section.icon" size="20" class="text-cyan-300" />
                    {{ section.title }}
                  </v-chip>
                </v-chip-group>

                <Transition name="fade">
                  <div v-if="activeOrientation" class="orientation-content">
                    <span class="chip">{{ activeOrientation.lead }}</span>
                    <h3 class="text-xl font-semibold">{{ activeOrientation.headline }}</h3>
                    <p class="text-sm text-white/70">{{ activeOrientation.description }}</p>
                    <ul class="mt-4 space-y-3 text-sm text-white/70">
                      <li v-for="item in activeOrientation.highlights" :key="item" class="flex items-start gap-3">
                        <v-icon icon="mdi-radar" size="18" class="mt-[3px] text-cyan-300" />
                        <span>{{ item }}</span>
                      </li>
                    </ul>
                    <div class="note" role="status">
                      <v-icon icon="mdi-information" size="18" class="text-cyan-300" />
                      <span>{{ activeOrientation.tip }}</span>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <div class="card flow">
            <div class="flow-head">
              <span class="chip">Mission flow preview</span>
              <h2 class="text-2xl font-semibold">From briefing to debrief</h2>
              <p class="text-sm text-white/70">
                Step through a condensed run of what you will do inside the Learn hub. Use the controls to explore each stage.
              </p>
            </div>
            <div class="flow-controls">
              <button
                  v-for="(step, index) in flowSteps"
                  :key="step.id"
                  type="button"
                  class="flow-dot"
                  :class="{ 'is-active': activeFlow === step.id }"
                  @click="activeFlow = step.id"
              >
                <span class="sr-only">{{ step.title }}</span>
                <span class="flow-dot-index">{{ index + 1 }}</span>
              </button>
            </div>
            <v-window v-model="activeFlow" class="flow-window">
              <v-window-item v-for="step in flowSteps" :key="step.id" :value="step.id" class="space-y-4">
                <div class="flex items-center gap-3">
                  <v-icon :icon="step.icon" size="26" class="text-cyan-300" />
                  <div>
                    <h3 class="text-xl font-semibold">{{ step.title }}</h3>
                    <p class="text-sm text-white/60">{{ step.tagline }}</p>
                  </div>
                </div>
                <ul class="space-y-3 text-sm text-white/70">
                  <li v-for="bullet in step.details" :key="bullet" class="flex gap-3">
                    <v-icon icon="mdi-chevron-right" size="18" class="mt-[2px] text-cyan-300" />
                    <span>{{ bullet }}</span>
                  </li>
                </ul>
                <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                  {{ step.cta }}
                </div>
              </v-window-item>
            </v-window>
            <div class="flow-actions">
              <v-btn
                  color="cyan"
                  variant="tonal"
                  prepend-icon="mdi-arrow-left"
                  :disabled="currentFlowIndex === 0"
                  @click="goToPrevFlow()"
              >
                Previous
              </v-btn>
              <v-btn
                  color="cyan"
                  variant="flat"
                  append-icon="mdi-arrow-right"
                  :disabled="currentFlowIndex === flowSteps.length - 1"
                  @click="goToNextFlow()"
              >
                Next step
              </v-btn>
            </div>
          </div>
        </div>
      </section>

      <!-- Practice Topics & Checklist -->
      <section class="container-outer">
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="card h-full">
            <div class="space-y-4">
              <span class="chip">What you'll practice</span>
              <h2 class="text-2xl font-semibold">Interactive lesson map</h2>
              <p class="text-sm text-white/70">
                Each module stacks skills. Expand a topic to see how lessons move from drills to live-like exchanges.
              </p>
            </div>
            <v-expansion-panels variant="accordion" class="mt-6 bg-transparent" elevation="0">
              <v-expansion-panel
                  v-for="topic in practiceTopics"
                  :key="topic.id"
                  class="bg-transparent text-white"
              >
                <v-expansion-panel-title class="text-sm text-white/80">
                  <div class="flex items-center gap-3">
                    <v-icon :icon="topic.icon" size="20" class="text-cyan-300" />
                    <span>{{ topic.title }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="text-sm text-white/70 space-y-3">
                  <p>{{ topic.description }}</p>
                  <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.25em] text-cyan-200 mb-2">Sample prompt</p>
                    <p class="text-sm text-white/80 font-medium">{{ topic.sample }}</p>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <div class="card h-full space-y-5">
            <div>
              <span class="chip">Pre-flight checklist</span>
              <h2 class="text-2xl font-semibold">Make sure you're ready</h2>
              <p class="text-sm text-white/70">
                Tick off what you need before jumping into a mission. The Learn hub works best when you can focus for a few
                uninterrupted minutes.
              </p>
            </div>
            <div class="space-y-2">
              <v-checkbox
                  v-for="item in checklistItems"
                  :key="item.id"
                  v-model="completedChecklist"
                  :label="item.label"
                  :value="item.id"
                  color="cyan"
                  hide-details
                  density="comfortable"
              />
            </div>
            <div
                class="rounded-xl border px-4 py-3 text-sm transition"
                :class="isChecklistComplete
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                  : 'border-white/10 bg-white/5 text-white/70'"
            >
              <template v-if="isChecklistComplete">
                <div class="flex items-center gap-2">
                  <v-icon icon="mdi-check-circle" size="20" class="text-emerald-300" />
                  <span>Everything looks good. Launch a mission when you're ready!</span>
                </div>
              </template>
              <template v-else>
                <div class="flex items-start gap-2">
                  <v-icon icon="mdi-information-outline" size="20" class="mt-[2px] text-cyan-300" />
                  <span>Complete each item to get the most out of the training experience.</span>
                </div>
              </template>
            </div>
            <div class="text-xs text-white/50">
              We don't record your microphone here. Speak out loud anyway—the faster you practice, the easier the live network feels.
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="container-outer">
        <div class="card text-center space-y-5 py-10">
          <span class="chip mx-auto">Ready for take-off?</span>
          <h2 class="text-3xl font-semibold">Head over to the Learn mission hub</h2>
          <p class="text-sm text-white/70 max-w-2xl mx-auto">
            You now know how modules unlock, what the flow looks like and why we start with voice drills before live AI control. When
            you're set, jump straight into the hub and start your first mission. Keep an eye on your inbox—we'll invite trained pilots
            to the live AI ATC beta first.
          </p>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <NuxtLink to="/learn" class="btn btn-primary">
              <v-icon icon="mdi-flag-checkered" size="20" />
              Go to Learn hub
            </NuxtLink>
            <NuxtLink to="/#cta" class="btn btn-ghost">
              <v-icon icon="mdi-email-fast" size="20" />
              Join the live AI ATC waitlist
            </NuxtLink>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHead } from '#imports'

interface OrientationSection {
  id: string
  title: string
  lead: string
  headline: string
  description: string
  highlights: string[]
  tip: string
  icon: string
}

interface FlowStep {
  id: string
  title: string
  tagline: string
  details: string[]
  cta: string
  icon: string
}

interface PracticeTopic {
  id: string
  title: string
  description: string
  sample: string
  icon: string
}

interface ChecklistItem {
  id: string
  label: string
}

const orientationSections: OrientationSection[] = [
  {
    id: 'hub',
    title: 'Mission hub layout',
    lead: 'Start screen',
    headline: 'Spot your unlocked modules at a glance',
    description:
        'Tiles show you which subjects are available, how many lessons each contains and where you left off. Modules unlock in a sequence so you always know the next logical move.',
    highlights: [
      'Progress bars and averages let you revisit weak areas before moving on.',
      'Locked missions explain the prerequisite to unlock them—no guesswork.',
      'The hub header contains quick links to ATC voice settings and logout.',
    ],
    tip: 'Hover a tile or tap it to preview what the mission covers before committing.',
    icon: 'mdi-view-dashboard'
  },
  {
    id: 'lessons',
    title: 'Lesson stages',
    lead: 'Training flow',
    headline: 'Every mission ramps up from drill to scenario',
    description:
        'Lessons mix quick-fire drills with guided exchanges. You will listen, speak and get immediate scoring so you know when to repeat or advance.',
    highlights: [
      'Short drills break complex phraseology into focused repetitions.',
      'Scenario cards set the context with plain-language briefs before audio starts.',
      'Results screens track accuracy, timing and give concrete redo suggestions.',
    ],
    tip: 'Repeat lessons until you comfortably hit the target percentage—consistency beats speed.',
    icon: 'mdi-timer-sand'
  },
  {
    id: 'briefing',
    title: 'Mission briefing & setup',
    lead: 'Prep phase',
    headline: 'Lock in the route before the radio work begins',
    description:
        'Some modules use flight plans. You can import SimBrief data or choose a pre-built scenario so the clearances feel real.',
    highlights: [
      'Check the route strip, weather and frequencies provided in the briefing sidebar.',
      'Plan status cards show when a flight plan is ready or needs attention.',
      'You can restart or re-brief mid-mission without losing overall progress.',
    ],
    tip: 'If you are short on time, select a ready-made scenario—the lessons adapt automatically.',
    icon: 'mdi-map'
  },
  {
    id: 'scoring',
    title: 'Progress & sync',
    lead: 'After action',
    headline: 'Keep your streak going across sessions',
    description:
        'We store your completions securely so you can pause and pick up later. Progress syncs across devices once you log in.',
    highlights: [
      'Stars mark recently updated content so you don\'t miss fresh briefings.',
      'Scoreboards highlight personal bests and the lessons worth another run.',
      'Cloud sync lets you train on desktop today and continue on a laptop tomorrow.',
    ],
    tip: 'Enable cookies in your browser to avoid losing local practice data when offline.',
    icon: 'mdi-cloud-sync'
  },
]

const flowSteps: FlowStep[] = [
  {
    id: 'signin',
    title: '1. Sign in & check audio',
    tagline: 'Confirm access and choose your voice input settings.',
    details: [
      'Use the ATC button in the header to select preferred voices and volumes.',
      'We recommend a headset or clear microphone—background noise lowers scores.',
      'Once set, you rarely need to revisit these controls unless you switch devices.',
    ],
    cta: 'Pro tip: run a short mic check before starting a new module so you can focus on phraseology, not hardware.',
    icon: 'mdi-account-voice'
  },
  {
    id: 'select',
    title: '2. Pick a module',
    tagline: 'Start where you are comfortable and work forward.',
    details: [
      'Choose between ICAO alphabet, numbers, ground, tower and en-route missions.',
      'Tiles show how many lessons you have completed and what is pending.',
      'Locked tiles list what to finish before they unlock—follow the breadcrumb.',
    ],
    cta: 'Aim for 80%+ accuracy before jumping to the next area—consistency builds confidence.',
    icon: 'mdi-layers-triple-outline'
  },
  {
    id: 'train',
    title: '3. Run the lesson',
    tagline: 'Listen, respond and iterate as needed.',
    details: [
      'Drill segments loop until you feel fluent—use them to warm up.',
      'Scenario segments present ATC audio; you respond aloud and see grading instantly.',
      'Pause any time to review the transcript or restart the mission if you want a clean run.',
    ],
    cta: 'Don\'t worry about perfect radio speed—clarity beats pace while you are learning.',
    icon: 'mdi-headset'
  },
  {
    id: 'debrief',
    title: '4. Review & plan next steps',
    tagline: 'Check your results and decide the next repetition.',
    details: [
      'Scores highlight timing, accuracy and key words you missed.',
      'Use the restart button if you want to attempt the mission with a fresh plan.',
      'Head back to the hub to pick the next mission or revisit any weak spots.',
    ],
    cta: 'Capture notes about tricky callsigns or phraseology—you\'ll see them again when live AI ATC launches.',
    icon: 'mdi-clipboard-text'
  },
]

const practiceTopics: PracticeTopic[] = [
  {
    id: 'alphabet',
    title: 'ICAO alphabet & numbers',
    description: 'Rapid-fire drills to ingrain proper spelling and number pronunciation without hesitation.',
    sample: 'Tower: "State the tail number of the aircraft ahead using the phonetic alphabet."',
    icon: 'mdi-alphabetical-variant'
  },
  {
    id: 'ground',
    title: 'Ground procedures',
    description: 'Pushback, taxi and handoff practice with branching instructions that adjust to your inputs.',
    sample: 'Ground: "DLH39A, taxi via N7, M, holding point runway 25C, report ready."',
    icon: 'mdi-road-variant'
  },
  {
    id: 'tower',
    title: 'Tower departures & arrivals',
    description: 'Clearance delivery, lineup, take-off and pattern work with runway changes and wind updates.',
    sample: 'Tower: "DLH39A, wind 240 at 12, runway 25C cleared for take-off."',
    icon: 'mdi-radar'
  },
  {
    id: 'enroute',
    title: 'En-route & approach',
    description: 'Altitude step climbs, directs and STAR briefings so you stay ahead of the automation.',
    sample: 'Center: "DLH39A, climb FL360, when ready direct UNOKO."',
    icon: 'mdi-chart-timeline-variant'
  },
]

const checklistItems: ChecklistItem[] = [
  { id: 'account', label: 'You are logged into your OpenSquawk account.' },
  { id: 'audio', label: 'Headset or microphone connected and audio output checked.' },
  { id: 'time', label: 'You have at least 10 focused minutes for a full mission.' },
  { id: 'notes', label: 'Notepad or EFB ready for jotting down clearances or frequencies.' },
]

const selectedOrientation = ref<OrientationSection['id']>(orientationSections[0].id)
const activeFlow = ref<FlowStep['id']>(flowSteps[0].id)
const completedChecklist = ref<ChecklistItem['id'][]>([])

const activeOrientation = computed(() => orientationSections.find(section => section.id === selectedOrientation.value) || orientationSections[0])
const currentFlowIndex = computed(() => flowSteps.findIndex(step => step.id === activeFlow.value))
const isChecklistComplete = computed(() => checklistItems.every(item => completedChecklist.value.includes(item.id)))

const goToPrevFlow = () => {
  const idx = currentFlowIndex.value
  if (idx > 0) {
    activeFlow.value = flowSteps[idx - 1].id
  }
}

const goToNextFlow = () => {
  const idx = currentFlowIndex.value
  if (idx < flowSteps.length - 1) {
    activeFlow.value = flowSteps[idx + 1].id
  }
}

useHead({
  title: 'Learn Orientation – OpenSquawk',
  meta: [
    {
      name: 'description',
      content: 'Explore how the Learn mission hub works, why training comes first and how to prepare for the upcoming live AI ATC experience.',
    },
    { property: 'og:title', content: 'Learn Orientation – OpenSquawk' },
    {
      property: 'og:description',
      content: 'Guided tour of the OpenSquawk Learn page: mission hub overview, lesson flow, practice topics and readiness checklist.',
    },
  ],
})
</script>

<style scoped>
.container-outer {
  @apply mx-auto max-w-screen-xl px-4;
}
.card {
  @apply rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl;
}
.card.orientation {
  @apply p-6 md:p-7;
}
.card.flow {
  @apply p-6 md:p-7 space-y-6;
}
.card.flow .flow-head {
  @apply space-y-3;
}
.card.flow .flow-controls {
  @apply flex gap-2;
}
.card.flow .flow-window {
  @apply rounded-2xl border border-white/10 bg-black/30 p-5;
}
.card.flow .flow-actions {
  @apply flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between;
}
.orientation-body {
  @apply space-y-3;
}
.orientation-grid {
  @apply mt-6 grid gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)];
}
.orientation-menu {
  @apply flex flex-col gap-3;
}
.orientation-chip {
  @apply w-full justify-start rounded-2xl border border-white/15 bg-white/0 px-4 py-3 text-left text-white/80 transition;
}
.orientation-chip:hover {
  @apply border-cyan-400/50 bg-cyan-400/10 text-white;
}
.orientation-content {
  @apply rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4;
}
.note {
  @apply flex items-start gap-3 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-xs text-cyan-100;
}
.chip {
  @apply inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70;
}
.flow-dot {
  @apply relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-medium text-white/60 transition;
}
.flow-dot .flow-dot-index {
  @apply font-semibold;
}
.flow-dot.is-active {
  @apply border-cyan-400/70 bg-cyan-400/20 text-white;
}
.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition;
}
.btn-primary {
  @apply bg-cyan-500 text-white shadow-[0_0_30px_rgba(34,211,238,.25)] hover:bg-cyan-400;
}
.btn-ghost {
  @apply border border-white/15 bg-white/5 text-white/80 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
