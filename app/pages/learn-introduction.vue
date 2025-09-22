<template>
  <div class="min-h-screen bg-[#070b18] text-white">
    <header class="border-b border-white/10 bg-[#070b18]/90 backdrop-blur">
      <div class="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 md:px-8">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
            <v-icon icon="mdi-radar" size="24" class="text-cyan-300" />
          </div>
          <div>
            <p class="text-lg font-semibold tracking-tight">Learn warm-up briefing</p>
            <p class="text-sm text-white/60">Get comfortable before you enter the training hub.</p>
          </div>
        </div>
        <NuxtLink
          to="/learn"
          class="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
        >
          Skip to Learn
          <v-icon icon="mdi-launch" size="18" class="text-cyan-300" />
        </NuxtLink>
      </div>
    </header>

    <main>
      <section class="border-b border-white/5 bg-gradient-to-b from-[#0b1124] via-[#070b18] to-[#050911]">
        <div class="mx-auto grid w-full max-w-screen-xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:px-8 md:py-24">
          <div class="space-y-6">
            <span class="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/80">Training hangar</span>
            <h1 class="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
              Learn how the training hub works before live AI ATC goes public
            </h1>
            <p class="max-w-2xl text-base text-white/75 sm:text-lg">
              The Learn platform is your practice space. You will rehearse phraseology, score your readbacks and collect XP here while the live controller network finishes testing. This quick tour keeps everything light and interactive so nothing feels overwhelming.
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-cyan-400/90 px-5 py-3 text-sm font-semibold text-[#06111f] shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
                @click="startTour"
              >
                <v-icon icon="mdi-gesture-tap-button" size="20" class="text-[#06111f]" />
                Take the guided warm-up
              </button>
              <NuxtLink
                to="/learn"
                class="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
              >
                I already know Learn
                <v-icon icon="mdi-arrow-right" size="18" class="text-cyan-300" />
              </NuxtLink>
            </div>
            <p class="text-sm text-white/50">Set aside about five minutes—the instructor will guide you through five short stops.</p>
          </div>

          <div class="relative">
            <div class="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-transparent to-indigo-500/20 blur-3xl" aria-hidden="true"></div>
            <div class="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-2xl shadow-cyan-500/20">
              <img
                src="/img/learn/modules/img8.jpeg"
                alt="Preview of the Learn mission hub"
                class="h-72 w-full object-cover sm:h-80"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="learn-tour" class="border-b border-white/5 bg-[#0b1328] py-16 sm:py-20">
        <div class="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
          <div class="max-w-3xl space-y-3">
            <p class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Interactive warm-up</p>
            <h2 class="text-2xl font-semibold sm:text-3xl">Let the instructor walk you through Learn</h2>
            <p class="text-base text-white/70">
              Follow the friendly instructor through five short stops. We keep one focus area on screen at a time so you can click, listen and absorb the flow without information overload.
            </p>
          </div>

          <div
            v-if="!tourStarted"
            class="mt-10 flex flex-wrap items-center gap-6 rounded-3xl border border-dashed border-cyan-400/40 bg-cyan-400/5 px-6 py-8 sm:px-8"
          >
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-500/15">
              <v-icon icon="mdi-account-voice" size="28" class="text-cyan-200" />
            </div>
            <div class="max-w-2xl space-y-2">
              <p class="text-lg font-semibold">Ready when you are</p>
              <p class="text-sm text-white/70">
                Tap the button to start the guided tour. The instructor will keep the pace relaxed and you can hop into the Learn hub whenever you feel ready.
              </p>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-[#06111f] shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1328]"
                @click="startTour"
              >
                Start the guided warm-up
                <v-icon icon="mdi-arrow-right" size="18" class="text-[#06111f]" />
              </button>
            </div>
          </div>

          <Transition name="fade-step">
            <div
              v-if="tourStarted"
              key="tour-started"
              class="mt-10 grid gap-8 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]"
            >
              <aside class="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30">
                <div class="flex items-center gap-3">
                  <div class="h-16 w-16 overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                    <img src="/img/logo.jpeg" alt="OpenSquawk instructor" class="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white">Your instructor</p>
                    <p class="text-xs text-white/60">OpenSquawk coach on duty</p>
                  </div>
                </div>

                <div class="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                  <p>
                    {{ activeStop.voiceLine || "I'll stick with you from start to finish—use the controls below to choose how you want to follow along." }}
                  </p>
                </div>

                <div class="space-y-2" v-if="activeStop.voiceLine">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1328]"
                    :class="[
                      voiceMode === 'radio' && !isSpeaking
                        ? 'border-cyan-400/60 text-white hover:bg-cyan-400/10'
                        : 'border-white/10 text-white/60',
                      voiceMode !== 'radio' || isSpeaking ? 'cursor-not-allowed opacity-60' : ''
                    ]"
                    :disabled="voiceMode !== 'radio' || isSpeaking"
                    @click="narrateActiveStop"
                  >
                    <v-icon
                      :icon="isSpeaking ? 'mdi-loading' : 'mdi-play-circle'"
                      size="18"
                      :class="isSpeaking ? 'animate-spin text-cyan-200' : 'text-cyan-300'"
                    />
                    Replay instructor voice
                  </button>
                  <p
                    v-if="sayMeta"
                    class="text-[11px] text-white/50"
                  >
                    Last clip: {{ lastClipLabel || 'Instructor' }} · Radio {{ sayMeta.radioQuality || '—' }} · Voice {{ sayMeta.voice || 'default' }} · ×{{ (sayMeta.speed ?? 1).toFixed(2) }}
                  </p>
                  <p v-if="speakError" class="text-xs text-amber-200">{{ speakError }}</p>
                  <p v-else-if="voiceUnavailableMessage" class="text-xs text-amber-200">{{ voiceUnavailableMessage }}</p>
                </div>

                <div class="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">Instructor voice</p>
                  <div class="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      class="rounded-xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1328]"
                      :class="voiceMode === 'radio'
                        ? 'border-cyan-400/60 bg-cyan-400/15 text-white'
                        : 'border-white/10 text-white/70 hover:border-cyan-300/40 hover:text-white'"
                      @click="setVoiceMode('radio')"
                    >
                      Play instructor voice
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1328]"
                      :class="voiceMode === 'silent'
                        ? 'border-cyan-400/60 bg-cyan-400/15 text-white'
                        : 'border-white/10 text-white/70 hover:border-cyan-300/40 hover:text-white'"
                      @click="setVoiceMode('silent')"
                    >
                      I will read it myself
                    </button>
                  </div>
                  <p class="mt-3 text-xs text-white/50">Switch anytime—the content stays the same.</p>
                </div>

                <div
                  class="rounded-2xl border bg-black/30 p-4 transition"
                  :class="[
                    radioCheckStatus === 'success'
                      ? 'border-emerald-400/60 bg-emerald-400/10'
                      : radioCheckStatus === 'error'
                      ? 'border-amber-400/60 bg-amber-400/10'
                      : radioCheckStatus === 'playing'
                      ? 'border-cyan-400/60 bg-cyan-400/10'
                      : 'border-white/10'
                  ]"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <v-icon icon="mdi-radio-handheld" size="20" class="text-cyan-300" />
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-white">Radio check</p>
                        <p class="text-xs text-white/60">{{ radioCheckMessage }}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1328]"
                      :class="[
                        voiceMode === 'radio' && !isSpeaking
                          ? 'border-cyan-400/60 text-cyan-100 hover:bg-cyan-400/10'
                          : 'border-white/10 text-white/40',
                        voiceMode !== 'radio' || isSpeaking ? 'cursor-not-allowed opacity-60' : ''
                      ]"
                      :disabled="voiceMode !== 'radio' || isSpeaking"
                      @click="runRadioCheck"
                    >
                      <v-icon
                        :icon="radioCheckStatus === 'playing' ? 'mdi-loading' : radioCheckStatus === 'success' ? 'mdi-check' : 'mdi-play'"
                        size="16"
                        :class="radioCheckStatus === 'playing' ? 'animate-spin text-cyan-200' : 'text-cyan-200'"
                      />
                      Check
                    </button>
                  </div>
                </div>
              </aside>

              <div class="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30">
                <div class="flex items-center gap-3">
                  <div class="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 transition-all duration-300"
                      :style="{ width: `${progressPercent}%` }"
                    ></div>
                  </div>
                  <span class="text-xs font-semibold text-white/60">{{ progressPercent }}%</span>
                </div>

                <Transition name="fade-step" mode="out-in">
                  <div :key="activeStop.id" class="space-y-6">
                    <div class="space-y-3">
                      <span class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">{{ activeStop.label }}</span>
                      <h3 class="text-2xl font-semibold">{{ activeStop.title }}</h3>
                      <p class="text-sm text-white/70">{{ activeStop.summary }}</p>
                    </div>

                    <div v-if="activeStop.image" class="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      <img
                        :src="activeStop.image"
                        :alt="`${activeStop.title} preview`"
                        class="h-52 w-full object-cover sm:h-60"
                        loading="lazy"
                      />
                    </div>

                    <ul v-if="activeStop.highlights" class="space-y-3 text-sm text-white/70">
                      <li
                        v-for="(point, index) in activeStop.highlights"
                        :key="index"
                        class="flex items-start gap-3"
                      >
                        <v-icon icon="mdi-star-four-points-outline" size="18" class="mt-0.5 text-cyan-300" />
                        <span>{{ point }}</span>
                      </li>
                    </ul>

                    <div v-if="activeStop.phases" class="grid gap-3 sm:grid-cols-2">
                      <div
                        v-for="phase in activeStop.phases"
                        :key="phase.title"
                        class="rounded-2xl border border-white/10 bg-[#101a33]/70 p-4"
                      >
                        <p class="text-xs uppercase tracking-[0.25em] text-white/40">{{ phase.title }}</p>
                        <p class="mt-2 text-sm text-white/80">{{ phase.note }}</p>
                      </div>
                    </div>

                    <div v-if="activeStop.actions" class="grid gap-3 sm:grid-cols-3">
                      <div
                        v-for="action in activeStop.actions"
                        :key="action.title"
                        class="rounded-2xl border border-white/10 bg-[#101a33]/70 p-4"
                      >
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10">
                          <v-icon :icon="action.icon" size="20" class="text-cyan-300" />
                        </div>
                        <p class="mt-3 text-sm font-semibold text-white">{{ action.title }}</p>
                        <p class="mt-2 text-sm text-white/70">{{ action.description }}</p>
                      </div>
                    </div>

                    <div v-if="activeStop.finalCta" class="rounded-2xl border border-cyan-400/60 bg-cyan-400/10 p-6 text-center shadow-lg shadow-cyan-500/20">
                      <p class="text-base font-semibold text-white">Jump into Learn whenever you feel ready.</p>
                      <p class="mt-2 text-sm text-white/80">Open the hub, pick a module and start banking XP today.</p>
                      <NuxtLink
                        to="/learn"
                        class="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#071427] shadow-lg shadow-cyan-500/20 transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cyan-400/30"
                      >
                        <v-icon icon="mdi-launch" size="18" class="text-[#071427]" />
                        Enter the Learn hub
                      </NuxtLink>
                    </div>
                  </div>
                </Transition>

                <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1328]"
                    :disabled="atFirstStop"
                    :class="atFirstStop ? 'cursor-not-allowed opacity-50 hover:border-white/15 hover:text-white/70' : ''"
                    @click="previousStop"
                  >
                    <v-icon icon="mdi-arrow-left" size="18" class="text-cyan-300" />
                    Previous
                  </button>

                  <div class="flex flex-col items-center gap-1 text-xs text-white/60">
                    <span>{{ activeStop.label }} · {{ activeIndex + 1 }} / {{ totalStops }}</span>
                    <div class="flex items-center gap-2">
                      <button
                        v-for="(stop, index) in tourStops"
                        :key="stop.id"
                        type="button"
                        class="h-2.5 w-2.5 rounded-full transition"
                        :class="index === activeIndex ? 'bg-cyan-300' : 'bg-white/20 hover:bg-white/40'"
                        :aria-label="`Go to ${stop.title}`"
                        @click="goToStop(index)"
                      ></button>
                    </div>
                  </div>

                  <button
                    v-if="!atLastStop"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-[#06111f] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1328]"
                    @click="nextStop"
                  >
                    Next stop
                    <v-icon icon="mdi-arrow-right" size="18" class="text-[#06111f]" />
                  </button>
                  <NuxtLink
                    v-else
                    to="/learn"
                    class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#06111f] shadow-lg shadow-cyan-500/20 transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1328]"
                  >
                    Head to Learn
                    <v-icon icon="mdi-launch" size="18" class="text-[#06111f]" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

type VoiceMode = 'radio' | 'silent'

type TourStopId = 'preflight' | 'hub' | 'mission' | 'lesson' | 'wrap'

interface TourStop {
  id: TourStopId
  label: string
  title: string
  summary: string
  image?: string
  voiceLine?: string
  autoNarrate?: boolean
  highlights?: string[]
  phases?: { title: string; note: string }[]
  actions?: { icon: string; title: string; description: string }[]
  finalCta?: boolean
}

const tourStops: TourStop[] = [
  {
    id: 'preflight',
    label: 'Preflight',
    title: 'Set up your instructor',
    summary:
      'Decide if you want the instructor voice and run a quick radio check before we taxi into the Learn tour.',
    image: '/img/learn/modules/img10.jpeg',
    voiceLine:
      "Welcome aboard! I'm your instructor for this warm-up. Pick whether you'd like me to talk you through each stop, then run the radio check so we know your audio is alive.",
    autoNarrate: false,
    highlights: [
      'Choose narrated guidance or text-only notes—you can switch at any moment.',
      'Audio clips come from the ATC voice engine, so sign in first to enable playback.'
    ]
  },
  {
    id: 'hub',
    label: 'Stop 1',
    title: 'Mission hub snapshot',
    summary: 'This is your home base. Tiles show unlocks, XP and the next objective at a glance.',
    image: '/img/learn/modules/img7.jpeg',
    voiceLine:
      'First stop is the mission hub. Each tile shows your XP, unlocks and the next objective. OpenSquawk remembers your last lesson so you can resume in one click.',
    highlights: [
      'Modules unlock in order—Fundamentals comes first, then Readbacks, Advanced and Full Flight.',
      'The Resume button drops you back into the last lesson you touched.',
      'Progress syncs to your account, so signed-in pilots can swap devices without losing momentum.'
    ]
  },
  {
    id: 'mission',
    label: 'Stop 2',
    title: 'Plan and brief a mission',
    summary: 'Pick what you want to practise, roll a route or paste your SimBrief plan, then brief the callouts.',
    image: '/img/learn/missions/full-flight/briefing-route.png',
    voiceLine:
      "Next, let's prep a mission. Pick the module, roll a fresh route or drop in your SimBrief data. The briefing cards highlight weather, squawk and key calls before you fly.",
    phases: [
      { title: 'Choose module', note: 'Select Fundamentals, Readbacks, Advanced or Full Flight.' },
      { title: 'Build the flight', note: 'Random, manual or SimBrief import—match what you want to rehearse.' },
      { title: 'Brief quickly', note: 'Review runway, weather, squawk and special notes.' },
      { title: 'Start mission', note: 'Hit Ready and the first lesson opens instantly.' }
    ],
    highlights: [
      'Reroll random flights until the procedures match what you want to rehearse.',
      'Briefing cards show the same data the lesson console expects you to read back.'
    ]
  },
  {
    id: 'lesson',
    label: 'Stop 3',
    title: 'Fly the lesson console',
    summary: 'Hear the controller, type your readback, then grade yourself with one click.',
    image: '/img/learn/modules/img11.jpeg',
    voiceLine:
      'Now we step into a lesson console. Play the controller, type your readback and press Check to score it. Replay clips, slow the radio and toggle challenge mode whenever you need.',
    actions: [
      {
        icon: 'mdi-play-circle',
        title: 'Play & repeat',
        description: 'Listen to the controller clip as often as you like and adjust the radio speed.'
      },
      {
        icon: 'mdi-keyboard-outline',
        title: 'Type the readback',
        description: 'Enter the call exactly how you would phrase it on frequency.'
      },
      {
        icon: 'mdi-check-decagram',
        title: 'Check & learn',
        description: 'Reveal the target, compare wording and roll a new scenario instantly.'
      }
    ],
    highlights: [
      'Audio challenge mode hides the target text until you request it.',
      'Use Say to hear a model readback whenever you need a refresher.'
    ]
  },
  {
    id: 'wrap',
    label: 'Final',
    title: 'Ready for the Learn hub',
    summary: 'Grab a headset or keyboard and hop into /learn to start banking XP.',
    image: '/img/learn/modules/img14.jpeg',
    voiceLine:
      'That wraps up the warm-up. Jump into the Learn hub when you are ready and loop missions until the readback feels automatic. I will be waiting on frequency.',
    finalCta: true,
    highlights: [
      'Aim for short, frequent sessions—five focused lessons beat one long cram.',
      'When AI ATC goes live, these same flows will feel familiar from day one.'
    ]
  }
]

const totalStops = tourStops.length

const tourStarted = ref(false)
const activeIndex = ref(0)
const voiceMode = ref<VoiceMode>('radio')
const radioCheckStatus = ref<'idle' | 'playing' | 'success' | 'error'>('idle')
const radioCheckMessage = ref('Tap the button to confirm audio output.')
const sayMeta = ref<{ radioQuality?: string; voice?: string | null; speed?: number } | null>(null)
const speakError = ref<string | null>(null)
const isSpeaking = ref(false)
const lastClipLabel = ref<string | null>(null)
const activeAudio = ref<HTMLAudioElement | null>(null)

const api = useApi()
const auth = useAuthStore()
const isAuthenticated = computed(() => auth.isAuthenticated)

const isClient = typeof window !== 'undefined'

const activeStop = computed(() => tourStops[activeIndex.value] ?? tourStops[0])
const progressPercent = computed(() => Math.round(((activeIndex.value + 1) / totalStops) * 100))
const atFirstStop = computed(() => activeIndex.value === 0)
const atLastStop = computed(() => activeIndex.value >= totalStops - 1)

const voiceUnavailableMessage = computed(() => {
  if (voiceMode.value !== 'radio') return null
  if (!isClient) return 'Audio playback is only available in the browser.'
  if (!isAuthenticated.value) return 'Sign in to OpenSquawk to unlock the instructor voice.'
  return null
})

function startTour() {
  tourStarted.value = true
  goToStop(0)
  radioCheckStatus.value = 'idle'
  radioCheckMessage.value =
    voiceMode.value === 'radio'
      ? 'Tap the button to confirm audio output.'
      : 'Switch to the instructor voice if you want to run the radio check.'
  speakError.value = null
  sayMeta.value = null

  nextTick(() => {
    if (!isClient) return
    const el = document.getElementById('learn-tour')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

function setVoiceMode(mode: VoiceMode) {
  if (voiceMode.value === mode) return
  voiceMode.value = mode
}

function goToStop(index: number) {
  const nextIndex = Math.min(Math.max(index, 0), totalStops - 1)
  if (nextIndex === activeIndex.value) return
  activeIndex.value = nextIndex
  sayMeta.value = null
  speakError.value = null
}

function nextStop() {
  if (!atLastStop.value) {
    goToStop(activeIndex.value + 1)
  }
}

function previousStop() {
  if (!atFirstStop.value) {
    goToStop(activeIndex.value - 1)
  }
}

function stopAudio() {
  if (activeAudio.value) {
    activeAudio.value.pause()
    activeAudio.value.currentTime = 0
    activeAudio.value = null
  }
  isSpeaking.value = false
}

async function speak(
  text: string,
  options: { tag: string; label?: string; speed?: number; level?: number; onEnded?: () => void }
) {
  speakError.value = null

  if (!isClient) {
    speakError.value = 'Audio playback is only available in the browser.'
    return false
  }

  if (!isAuthenticated.value) {
    speakError.value = 'Please sign in to your OpenSquawk account to hear the instructor.'
    return false
  }

  if (isSpeaking.value) {
    stopAudio()
  } else {
    stopAudio()
  }

  try {
    isSpeaking.value = true
    const response: any = await api.post('/api/atc/say', {
      text,
      level: options.level ?? 4,
      speed: options.speed ?? 0.92,
      tag: options.tag,
      format: 'smallest'
    })

    const audio = response?.audio
    if (!audio?.base64) {
      throw new Error('Audio payload missing')
    }

    const mime = audio.mime || 'audio/wav'
    const dataUrl = `data:${mime};base64,${audio.base64}`
    const element = new Audio(dataUrl)
    activeAudio.value = element
    lastClipLabel.value = options.label ?? null

    element.addEventListener(
      'ended',
      () => {
        if (activeAudio.value === element) {
          activeAudio.value = null
        }
        isSpeaking.value = false
        if (options.onEnded) {
          options.onEnded()
        }
      },
      { once: true }
    )

    element.addEventListener(
      'error',
      () => {
        if (activeAudio.value === element) {
          activeAudio.value = null
        }
        isSpeaking.value = false
      },
      { once: true }
    )

    await element.play()

    sayMeta.value = {
      radioQuality: typeof response?.radioQuality === 'string' ? response.radioQuality : undefined,
      voice: typeof response?.voice === 'string' ? response.voice : null,
      speed: typeof response?.speed === 'number' ? response.speed : options.speed ?? 1
    }

    return true
  } catch (error: any) {
    stopAudio()
    const message =
      error?.data?.message ||
      error?.statusMessage ||
      error?.message ||
      error?.response?._data?.message ||
      (error?.response?.status === 401
        ? 'Please sign in to your OpenSquawk account to hear the instructor.'
        : null)

    speakError.value = message ? String(message) : 'Could not play audio right now. Try again shortly.'
    return false
  }
}

async function narrateActiveStop() {
  if (voiceMode.value !== 'radio') return
  const stop = activeStop.value
  if (!stop?.voiceLine) return

  const unavailable = voiceUnavailableMessage.value
  if (unavailable) {
    speakError.value = unavailable
    return
  }

  await speak(stop.voiceLine, {
    tag: `learn-intro-${stop.id}`,
    label: stop.title
  })
}

async function runRadioCheck() {
  radioCheckStatus.value = 'playing'
  radioCheckMessage.value = 'Playing the radio check clip...'

  const ok = await speak(
    'OpenSquawk training instructor on frequency. This is your radio check—if you hear this loud and clear, you are ready to continue the tour.',
    {
      tag: 'learn-intro-radio-check',
      label: 'Radio check',
      speed: 0.9,
      level: 4,
      onEnded: () => {
        radioCheckStatus.value = 'success'
        radioCheckMessage.value = 'Loud and clear. You are ready for the tour!'
      }
    }
  )

  if (!ok) {
    radioCheckStatus.value = 'error'
    radioCheckMessage.value = speakError.value || 'We could not play audio. Try again in a moment.'
  }
}

watch(
  () => activeStop.value?.id,
  async () => {
    sayMeta.value = null
    speakError.value = null

    if (!tourStarted.value) return
    if (voiceMode.value !== 'radio') return

    const stop = activeStop.value
    if (!stop || stop.autoNarrate === false) return

    await narrateActiveStop()
  }
)

watch(voiceMode, (mode) => {
  speakError.value = null
  if (mode === 'silent') {
    radioCheckMessage.value = 'Switch to the instructor voice if you want to run the radio check.'
    stopAudio()
    return
  }

  if (radioCheckStatus.value === 'idle') {
    radioCheckMessage.value = 'Tap the button to confirm audio output.'
  }

  if (!tourStarted.value) return

  const stop = activeStop.value
  if (!stop || stop.autoNarrate === false) return

  narrateActiveStop()
})

onBeforeUnmount(() => {
  stopAudio()
})
</script>

<style scoped>
.fade-step-enter-active,
.fade-step-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-step-enter-from,
.fade-step-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
