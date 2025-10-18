<template>
  <div class="learn-theme min-h-screen bg-[#070d1a] text-white">
    <header class="border-b border-white/5 bg-[#070d1a]/80 backdrop-blur">
      <div
        class="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 md:px-8"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
            <v-icon icon="mdi-radar" size="26" class="text-cyan-300" />
          </div>
          <div>
            <p class="text-lg font-semibold tracking-tight">Classroom orientation</p>
            <p class="text-sm text-white/60">Guided preflight briefing</p>
          </div>
        </div>
        <NuxtLink v-if="false" to="/classroom" class="btn primary" @click="handleClassroomEntry">
          Enter Classroom hub
          <v-icon icon="mdi-launch" size="18" class="text-[#061318]" />
        </NuxtLink>
      </div>
    </header>

    <main>
      <section class="relative border-b border-white/5">
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-indigo-500/25"></div>
        <div class="relative z-10 mx-auto w-full max-w-screen-xl px-4 py-16 sm:px-6 md:px-8">
          <div class="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
            <div class="space-y-6">
              <span
                class="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80"
              >Orientation</span>
              <h1 class="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
                Get comfortable with the Classroom before you call live AI ATC
              </h1>
              <p class="max-w-2xl text-base text-white/80 sm:text-lg">
                This is your training playground. Live AI controllers for the simulator are still in closed testing, so we
                start with the Classroom to build phraseology, timing and confidence. I will guide you through the flow
                before you dive into the hub.
              </p>
              <div class="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-amber-100 shadow-lg shadow-amber-500/10" role="status">
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/50 bg-amber-300/20">
                    <v-icon icon="mdi-alert-decagram-outline" size="22" class="text-amber-200" />
                  </div>
                  <div class="space-y-1">
                    <p class="text-sm font-semibold uppercase tracking-wide text-amber-100/90">Heads-up</p>
                    <p class="text-sm text-amber-50/90">
                      The Classroom mirrors the calls you will make later, but today it runs as a standalone trainer. Treat it
                      like a warm-up before the live network opens.
                    </p>
                  </div>
                </div>
              </div>
              <ul class="grid gap-3 text-sm text-white/70 sm:grid-cols-2 sm:text-base">
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-compass-outline" size="20" class="mt-1 text-cyan-300" />
                  <span>Follow a short, interactive tour so nothing drops on you all at once.</span>
                </li>
                <li class="flex items-start gap-3">
                  <v-icon icon="mdi-headset" size="20" class="mt-1 text-cyan-300" />
                  <span>Choose text only or let the instructor speak over a radio-style voice.</span>
                </li>
              </ul>
            </div>
            <div class="flex flex-col gap-6">
              <div class="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-xl shadow-cyan-500/10">
                <NuxtImg
                  src="/img/learn/modules/img14.jpeg"
                  alt="Pilots reviewing the Classroom mission board"
                  class="h-56 w-full object-cover"
                  loading="lazy"
                  format="webp"
                />
              </div>
              <div class="rounded-3xl border border-white/10 bg-[#0b1328]/90 p-6 shadow-xl shadow-cyan-500/10">
                <div class="flex items-center gap-4">
                  <NuxtImg src="/img/learn/instructor.png" alt="Avery, the Classroom instructor" class="h-14 w-14 rounded-2xl border border-cyan-400/40 object-cover" />
                  <div>
                    <p class="text-base font-semibold">Avery</p>
                    <p class="text-sm text-white/60">Your Classroom instructor</p>
                  </div>
                </div>
                <p class="mt-4 text-sm text-white/70">
                  Hey! I will keep the pace relaxed and fun. Pick how you want to follow along and we will walk through each
                  stop together.
                </p>
                <div class="mt-6 space-y-4">
                  <div>
                    <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Delivery</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="btn soft voice-toggle"
                        :class="{ active: voiceMode === 'text' }"
                        @click="setVoiceMode('text')"
                        :aria-pressed="voiceMode === 'text'"
                      >
                        <v-icon icon="mdi-text" size="18" class="text-cyan-200" />
                        Text only
                      </button>
                      <button
                        type="button"
                        class="btn soft voice-toggle"
                        :class="{ active: voiceMode === 'radio' }"
                        @click="setVoiceMode('radio')"
                        :aria-pressed="voiceMode === 'radio'"
                      >
                        <v-icon icon="mdi-radio-handheld" size="18" class="text-cyan-200" />
                        Radio voice
                      </button>
                    </div>
                  </div>
                  <div
                    v-if="voiceMode === 'radio'"
                    class="space-y-4 rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-4"
                  >
                    <div>
                      <label
                        for="radio-level"
                        class="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-cyan-100/80"
                      >
                        Radio clarity
                        <span class="text-[11px] text-cyan-100/60">Level {{ radioLevel }}</span>
                      </label>
                      <input
                        id="radio-level"
                        v-model.number="radioLevel"
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        class="mt-2 h-1 w-full rounded-full accent-cyan-300"
                      />
                      <p class="mt-2 text-xs text-cyan-100/70">Lower numbers add static. Higher numbers sound crisp.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        class="btn primary"
                        @click="handleRadioCheck"
                        :disabled="speechLoading"
                      >
                        <v-icon
                          :icon="speechLoading ? 'mdi-loading' : 'mdi-radio-check'"
                          size="18"
                          class="text-[#061318]"
                          :class="{ 'animate-spin': speechLoading }"
                        />
                        {{ speechLoading ? 'Checking…' : hasCompletedRadioCheck ? 'Radio check again' : 'Run radio check' }}
                      </button>
                      <p v-if="!hasCompletedRadioCheck" class="text-xs text-cyan-100/70">
                        Play a quick sample to confirm the instructor audio works.
                      </p>
                      <p v-else class="flex items-center gap-1 text-xs text-emerald-200/80">
                        <v-icon icon="mdi-check-circle" size="16" class="text-emerald-300" />
                        Loud and clear! Audio is ready.
                      </p>
                    </div>
                  </div>
                </div>
                <div class="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    class="btn primary"
                    @click="startTour"
                    :disabled="startDisabled"
                  >
                    <v-icon icon="mdi-gesture-tap-button" size="18" class="text-[#061318]" />
                    Start guided tour
                  </button>
                  <NuxtLink to="/classroom" class="btn ghost" @click="handleClassroomEntry">
                    Skip to Classroom
                    <v-icon icon="mdi-arrow-right" size="16" />
                  </NuxtLink>
                </div>
                <p v-if="startDisabled && voiceMode === 'radio'" class="mt-2 text-xs text-amber-200/80">
                  Run the radio check once so I know you can hear me before we roll.
                </p>
                <p v-if="speechError" class="mt-2 text-xs text-rose-200/80">
                  {{ speechError }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="orientation" class="border-b border-white/5 bg-[#080f1f]/80 py-16 sm:py-20">
        <div class="mx-auto flex w-full max-w-screen-xl flex-col gap-10 px-4 sm:px-6 md:px-8 lg:flex-row">
          <aside class="shrink-0 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 lg:w-80">
            <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Itinerary</p>
            <div class="mt-4">
              <div class="flex items-center gap-3 text-xs text-white/70">
                <div class="flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    class="progress-fill"
                    :style="{ width: `${stageProgress}%` }"
                  ></div>
                </div>
                <span class="font-semibold text-white/80">{{ stageProgress }}%</span>
              </div>
              <p class="mt-2 text-[13px] text-white/60">
                We will stop at {{ stages.length }} stations. Follow them in order for the smoothest ride.
              </p>
            </div>
            <ol class="mt-6 space-y-2">
              <li v-for="(stop, index) in stages" :key="stop.id">
                <button
                  type="button"
                  class="group flex w-full items-center gap-3 rounded-2xl border border-white/5 px-4 py-3 text-left transition hover:border-cyan-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080f1f]"
                  :class="{
                    'border-cyan-300/60 bg-cyan-400/10 text-white': tourStarted && index === stageIndex,
                    'cursor-not-allowed opacity-50': index > unlockedStageIndex
                  }"
                  @click="goToStage(index)"
                  :disabled="index > unlockedStageIndex"
                >
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-500/10 text-sm font-semibold text-cyan-200"
                  >
                    {{ index + 1 }}
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-white">{{ stop.title }}</p>
                    <p v-if="tourStarted && index === stageIndex" class="text-xs text-white/60">{{ stop.summary }}</p>
                  </div>
                  <v-icon v-if="index < stageIndex" icon="mdi-check" size="18" class="text-emerald-300" />
                </button>
              </li>
            </ol>
            <button
              v-if="tourStarted"
              type="button"
              class="btn ghost mini mt-6"
              @click="restartTour"
            >
              <v-icon icon="mdi-refresh" size="18" class="text-cyan-200" />
              Restart tour
            </button>
          </aside>

          <div class="flex-1">
            <div
              v-if="!tourStarted"
              class="flex h-full flex-col justify-center rounded-3xl border border-dashed border-white/10 bg-[#0a1326]/60 p-8 text-center shadow-inner shadow-black/20"
            >
              <p class="text-lg font-semibold">Ready when you are</p>
              <p class="mt-3 text-sm text-white/70">
                Start the guided tour above. I will only show one stop at a time so it never feels overwhelming.
              </p>
              <div class="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  class="btn primary"
                  @click="startTour"
                  :disabled="startDisabled"
                >
                  <v-icon icon="mdi-gesture-tap-button" size="18" class="text-[#061318]" />
                  Start guided tour
                </button>
              </div>
              <p v-if="startDisabled && voiceMode === 'radio'" class="mt-4 text-xs text-amber-200/80">
                Run the radio check above to enable the instructor voice.
              </p>
              <p v-if="speechError" class="mt-2 text-xs text-rose-200/80">
                {{ speechError }}
              </p>
            </div>

            <Transition name="fade-slide" mode="out-in">
              <article
                v-if="tourStarted"
                :key="activeStage.id"
                class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 via-white/[0.03] to-white/[0.02] shadow-xl shadow-black/30"
              >
                <div class="relative h-48 w-full overflow-hidden border-b border-white/5 sm:h-56">
                  <NuxtImg :src="activeStage.image" :alt="activeStage.imageAlt" class="h-full w-full object-cover" loading="lazy" />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#080f1f] via-transparent to-transparent"></div>
                  <div class="absolute bottom-4 left-4 rounded-full bg-[#080f1f]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                    Stop {{ stageIndex + 1 }} of {{ stages.length }}
                  </div>
                </div>
                <div class="space-y-6 px-6 py-8 sm:px-8">
                  <div class="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 class="text-2xl font-semibold">{{ activeStage.title }}</h2>
                      <p class="mt-2 max-w-2xl text-sm text-white/70">
                        {{ activeStage.summary }}
                      </p>
                    </div>
                    <div class="rounded-2xl border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100/90">
                      {{ progressLabel }}
                    </div>
                  </div>

                  <ul class="space-y-3 text-sm text-white/75">
                    <li v-for="(point, pointIndex) in activeStage.points" :key="pointIndex" class="flex items-start gap-3">
                      <v-icon icon="mdi-check-circle-outline" size="18" class="mt-0.5 text-cyan-300" />
                      <span>{{ point }}</span>
                    </li>
                  </ul>

                  <div v-if="activeStage.tip" class="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-sm text-emerald-100/90">
                    <div class="flex items-start gap-3">
                      <v-icon icon="mdi-lightbulb-on-outline" size="20" class="mt-0.5 text-emerald-200" />
                      <div>
                        <p class="font-semibold text-emerald-50">Instructor tip</p>
                        <p class="mt-1 text-emerald-100/80">{{ activeStage.tip }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-white/10 bg-[#0c162c]/80 p-4 sm:p-5">
                    <div class="flex items-start gap-4">
                      <NuxtImg
                        src="/img/learn/instructor.png"
                        alt="Avery instructor avatar"
                        class="h-24 w-24 rounded-2xl border border-cyan-400/40 object-cover"
                      />
                      <div class="flex-1 space-y-3">
                        <div class="flex flex-wrap items-center gap-2">
                          <p class="text-xl font-semibold text-white">Avery on comms</p>
                          <span
                            v-if="voiceMode === 'radio' && speechPlaying"
                            class="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200"
                          >
                            <v-icon icon="mdi-volume-high" size="14" class="text-emerald-200" />
                            Speaking
                          </span>
                        </div>
                        <p class="text-sm text-white/70">
                          "{{ activeStage.voiceLine }}"
                        </p>
                        <div v-if="voiceMode === 'radio'" class="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            class="btn soft mini voice-replay"
                            @click="replayStageVoice"
                            :disabled="speechLoading"
                          >
                            <v-icon
                              :icon="speechLoading ? 'mdi-loading' : 'mdi-replay'"
                              size="18"
                              class="text-cyan-200"
                              :class="{ 'animate-spin': speechLoading }"
                            />
                            Replay radio voice
                          </button>
                          <p v-if="speechError" class="text-xs text-rose-200/80">{{ speechError }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="border-t border-white/10 pt-6">
                    <div class="flex flex-wrap items-center gap-3">
                      <button
                        v-if="canGoPrevious"
                        type="button"
                        class="btn ghost"
                        @click="goToPrevious"
                      >
                        <v-icon icon="mdi-arrow-left" size="18" class="text-cyan-200" />
                        Previous stop
                      </button>
                      <div class="ml-auto flex flex-wrap items-center gap-3">
                        <button
                          v-if="voiceMode === 'radio'"
                          type="button"
                          class="btn ghost mini play-again"
                          @click="maybeSpeakForStage"
                          :disabled="speechLoading"
                        >
                          <v-icon icon="mdi-play-circle" size="16" class="text-cyan-200" />
                          Play again
                        </button>
                        <button
                          v-if="canGoNext"
                          type="button"
                          class="btn primary"
                          @click="goToNext"
                        >
                          Next stop
                          <v-icon icon="mdi-arrow-right" size="18" class="text-[#061318]" />
                        </button>
                      <NuxtLink v-else to="/classroom" class="btn primary" @click="handleClassroomEntry">
                        Enter Classroom hub
                          <v-icon icon="mdi-launch" size="18" class="text-[#061318]" />
                      </NuxtLink>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </Transition>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useHead } from '#imports'
import { useApi } from '~/composables/useApi'
import { CLASSROOM_INTRO_STORAGE_KEY } from '~~/shared/constants/storage'
import type { PizzicatoLite } from '~~/shared/utils/pizzicatoLite'
import { loadPizzicatoLite } from '~~/shared/utils/pizzicatoLite'
import { clampReadability, createNoiseGenerators, getReadabilityProfile } from '~~/shared/utils/radioEffects'

type VoiceMode = 'text' | 'radio'

interface StageStop {
  id: string
  title: string
  summary: string
  points: string[]
  tip?: string
  image: string
  imageAlt: string
  voiceLine: string
}

definePageMeta({ middleware: 'require-auth' })

useHead({ title: 'Classroom orientation • OpenSquawk' })

const stages: StageStop[] = [
  {
    id: 'hub',
    title: 'Mission hub',
    summary: 'Browse modules, see XP progress and decide what to train next.',
    points: [
      'Each tile shows remaining lessons, best scores and unlock status.',
      'Use “Continue” to jump back into the last lesson you touched.'
    ],
    tip: 'Hover or tap a tile for a quick brief before opening it.',
    image: '/img/learn/modules/img11.jpeg',
    imageAlt: 'Classroom mission hub interface with highlighted modules',
    voiceLine:
      'First stop is the mission hub. This is our briefing room before any AI frequency opens. Pick the module you want and you are two clicks from a lesson.'
  },
  {
    id: 'planning',
    title: 'Plan your mission',
    summary: 'Some lessons need a quick flight setup so the scenario makes sense.',
    points: [
      'Roll a random plan for an instant route or import SimBrief if you have one ready.',
      'Confirm the callsign, runway notes and weather before starting the lesson.'
    ],
    tip: 'Full Flight missions always start here, while most drills jump straight into the console.',
    image: '/img/learn/modules/img3.jpeg',
    imageAlt: 'Pilots preparing a flight plan on a tablet',
    voiceLine:
      'When a mission asks for a plan, choose Random, Manual or SimBrief. Try the random generator at least once—it is the fastest way to get airborne.'
  },
  {
    id: 'console',
    title: 'Lesson console',
    summary: 'Play the ATC clip, give your readback and grade it when ready.',
    points: [
      'Press Play to hear ATC, type or speak your response and tap Check to score it.',
      'Reveal hints or slow the audio whenever you need extra help.'
    ],
    tip: 'The console saves your best answer so you can see improvement at a glance.',
    image: '/img/learn/modules/img8.jpeg',
    imageAlt: 'Lesson console showing ATC playback controls',
    voiceLine:
      'Inside the console you control the pace. Listen to the call, craft your readback and check it only when it sounds right to you.'
  },
  {
    id: 'settings',
    title: 'Practice boosters',
    summary: 'Tune the challenge level whenever you want a new workout.',
    points: [
      'Adjust audio speed and radio clarity to simulate a quiet or busy frequency.',
      'Enable Audio Challenge to hide on-screen text once you feel confident.'
    ],
    tip: 'Drop the radio level for extra static when you want to stress-test your ears.',
    image: '/img/learn/modules/img10.jpeg',
    imageAlt: 'Audio settings and challenge toggles inside the Classroom',
    voiceLine:
      'Your settings live here. Slide the radio level for more or less static and flip on Audio Challenge when you want the full listen-and-respond workout.'
  },
  {
    id: 'wrap',
    title: 'Wrap-up & next steps',
    summary: 'Review the scorecard and pick your next move back in the hub.',
    points: [
      'Every lesson ends with accuracy notes, timing feedback and retry suggestions.',
      'Use the summary to decide whether to repeat, advance or swap to another module.'
    ],
    tip: 'Bookmark /classroom so a quick refresher is always a tab away.',
    image: '/img/learn/modules/img7.jpeg',
    imageAlt: 'Pilot reviewing a scorecard summary',
    voiceLine:
      'That is the full loop. Check the scorecard for anything to repeat, then head back to the hub and pick your next practice hop.'
  }
]

const api = useApi()

function markClassroomIntroComplete() {
  if (typeof window === 'undefined') return
  localStorage.setItem(CLASSROOM_INTRO_STORAGE_KEY, 'true')
}

function handleClassroomEntry() {
  markClassroomIntroComplete()
}

const voiceMode = ref<VoiceMode>('text')
const radioLevel = ref(5)
const hasCompletedRadioCheck = ref(false)
const tourStarted = ref(false)
const stageIndex = ref(0)
const unlockedStageIndex = ref(0)

const speechLoading = ref(false)
const speechPlaying = ref(false)
const speechError = ref<string | null>(null)
const audioElement = ref<HTMLAudioElement | null>(null)
let speechRequestId = 0

const isClient = typeof window !== 'undefined'
let speechContext: AudioContext | null = null
let pizzicatoLiteInstance: PizzicatoLite | null = null
type RadioSoundInstance = Awaited<ReturnType<PizzicatoLite['createSoundFromBase64']>>
let activeRadioSound: RadioSoundInstance | null = null
let activeRadioCleanup: Array<() => void> = []

const activeStage = computed(() => stages[stageIndex.value])
const canGoPrevious = computed(() => stageIndex.value > 0)
const canGoNext = computed(() => stageIndex.value < stages.length - 1)
const stageProgress = computed(() => {
  if (!tourStarted.value) return 0
  const raw = ((stageIndex.value + 1) / stages.length) * 100
  return Math.min(100, Math.max(0, Math.round(raw)))
})
const progressLabel = computed(() => {
  if (!tourStarted.value) return 'Not started yet'
  return `Leg ${stageIndex.value + 1} · ${stageProgress.value}% ready`
})
const startDisabled = computed(() => voiceMode.value === 'radio' && !hasCompletedRadioCheck.value)

async function ensureSpeechAudioContext(): Promise<AudioContext | null> {
  if (!isClient) return null

  const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext }
  const AudioContextCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext
  if (!AudioContextCtor) return null

  if (!speechContext || speechContext.state === 'closed') {
    speechContext = new AudioContextCtor()
  }

  if (speechContext.state === 'suspended') {
    try {
      await speechContext.resume()
    } catch (error) {
      console.warn('Failed to resume speech audio context', error)
    }
  }

  return speechContext
}

async function ensurePizzicato(ctx: AudioContext | null): Promise<PizzicatoLite | null> {
  if (!ctx) return null
  if (!pizzicatoLiteInstance) {
    pizzicatoLiteInstance = await loadPizzicatoLite()
  }
  return pizzicatoLiteInstance
}

function setMediaElementPreservesPitch(media: HTMLMediaElement | null, preserve: boolean) {
  if (!media) return
  const target = !!preserve
  try {
    ;(media as any).preservesPitch = target
  } catch {
    // ignore unsupported assignments
  }
  try {
    ;(media as any).mozPreservesPitch = target
  } catch {
    // ignore unsupported assignments
  }
  try {
    ;(media as any).webkitPreservesPitch = target
  } catch {
    // ignore unsupported assignments
  }
}

function releaseRadio(cleanups: Array<() => void>, sound: RadioSoundInstance | null) {
  if (activeRadioSound === sound) {
    activeRadioSound = null
  }
  if (activeRadioCleanup === cleanups) {
    activeRadioCleanup = []
  }
  if (cleanups.length) {
    cleanups.forEach(stop => {
      try {
        stop()
      } catch {
        // ignore cleanup failures
      }
    })
    cleanups.length = 0
  }
  sound?.clearEffects()
}

async function playWithRadioEffect(base64: string, readability: number, requestId: number): Promise<boolean> {
  let sound: RadioSoundInstance | null = null
  const cleanups: Array<() => void> = []

  try {
    const ctx = await ensureSpeechAudioContext()
    if (!ctx || speechRequestId !== requestId) return false

    const pizzicato = await ensurePizzicato(ctx)
    if (!pizzicato || speechRequestId !== requestId) return false

    sound = await pizzicato.createSoundFromBase64(ctx, base64)
    if (!sound || speechRequestId !== requestId) return false

    const profile = getReadabilityProfile(readability)
    const { Effects } = pizzicato

    const highpass = new Effects.HighPassFilter(ctx, {
      frequency: profile.eq.highpass,
      q: profile.eq.highpassQ
    })
    const lowpass = new Effects.LowPassFilter(ctx, {
      frequency: profile.eq.lowpass,
      q: profile.eq.lowpassQ
    })

    sound.addEffect(highpass)
    sound.addEffect(lowpass)

    if (profile.eq.bandpass) {
      sound.addEffect(
        new Effects.BandPassFilter(ctx, {
          frequency: profile.eq.bandpass.frequency,
          q: profile.eq.bandpass.q
        })
      )
    }

    if (profile.presence) {
      sound.addEffect(new Effects.PeakingFilter(ctx, profile.presence))
    }

    profile.distortions.forEach(amount => {
      sound?.addEffect(new Effects.Distortion(ctx, { amount }))
    })

    sound.addEffect(new Effects.Compressor(ctx, profile.compressor))

    if (profile.tremolos) {
      profile.tremolos.forEach(tremolo => {
        sound?.addEffect(new Effects.Tremolo(ctx, tremolo))
      })
    }

    sound.setVolume(profile.gain)

    const playbackDuration = Math.max(0.1, sound.duration)
    cleanups.push(...createNoiseGenerators(ctx, playbackDuration, profile, readability))

    if (speechRequestId !== requestId) {
      releaseRadio(cleanups, sound)
      return false
    }

    activeRadioSound = sound
    activeRadioCleanup = cleanups

    if (speechRequestId !== requestId) {
      releaseRadio(cleanups, sound)
      return false
    }

    const playbackPromise = sound.play()
    if (speechRequestId === requestId) {
      speechPlaying.value = true
    }

    playbackPromise.finally(() => {
      const shouldUpdateState = speechRequestId === requestId
      releaseRadio(cleanups, sound)
      if (shouldUpdateState) {
        speechPlaying.value = false
      }
    })

    return true
  } catch (error) {
    releaseRadio(cleanups, sound)
    console.error('Failed to apply radio effect', error)
    return false
  }
}

function stopAudio(advanceRequestId = true) {
  speechPlaying.value = false

  if (activeRadioSound || activeRadioCleanup.length) {
    const sound = activeRadioSound
    if (sound) {
      try {
        sound.stop()
      } catch (error) {
        console.warn('Failed to stop radio voice', error)
      }
    }
    releaseRadio(activeRadioCleanup, sound ?? null)
  }

  if (audioElement.value) {
    try {
      audioElement.value.pause()
      audioElement.value.currentTime = 0
    } catch (error) {
      console.warn('Failed to stop audio', error)
    }
    audioElement.value = null
  }

  if (advanceRequestId) {
    speechRequestId += 1
  }
}

async function speak(text: string, stageId?: string): Promise<boolean> {
  const trimmed = text?.trim()
  if (!trimmed) return false

  stopAudio(false)

  const requestId = ++speechRequestId

  speechError.value = null
  speechLoading.value = true
  speechPlaying.value = false

  try {
    const payload: Record<string, unknown> = {
      text: trimmed,
      level: radioLevel.value,
      speed: 1,
      moduleId: 'classroom-intro',
      lessonId: stageId || null,
      tag: 'classroom-orientation'
    }

    const response: any = await api.post('/api/atc/say', payload)
    if (requestId !== speechRequestId) {
      return false
    }

    const base64 = response?.audio?.base64
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('The radio voice is unavailable right now.')
    }

    const mime = response?.audio?.mime || 'audio/wav'
    const readability = clampReadability(radioLevel.value)

    const playedWithEffects = await playWithRadioEffect(base64, readability, requestId)
    if (requestId !== speechRequestId) {
      return false
    }

    if (playedWithEffects) {
      return true
    }

    const audio = new Audio(`data:${mime};base64,${base64}`)
    audio.preload = 'auto'
    setMediaElementPreservesPitch(audio, true)

    audio.onended = () => {
      if (speechRequestId === requestId) {
        speechPlaying.value = false
        if (audioElement.value === audio) {
          audioElement.value = null
        }
      }
    }

    audio.onerror = () => {
      if (speechRequestId === requestId) {
        speechPlaying.value = false
        speechError.value = 'Playback failed. Check your audio output and try again.'
        if (audioElement.value === audio) {
          audioElement.value = null
        }
      }
    }

    audioElement.value = audio

    try {
      await audio.play()
      if (speechRequestId === requestId) {
        speechPlaying.value = true
      }
      return true
    } catch (error) {
      if (speechRequestId === requestId) {
        speechError.value = 'Audio was blocked by the browser. Click anywhere on the page and try again.'
        speechPlaying.value = false
        if (audioElement.value === audio) {
          audioElement.value = null
        }
      }
      return false
    }
  } catch (error: any) {
    if (speechRequestId === requestId) {
      const message = typeof error?.message === 'string' ? error.message : 'The radio voice is unavailable right now.'
      speechError.value = message
    }
    return false
  } finally {
    if (speechRequestId === requestId) {
      speechLoading.value = false
    }
  }
}

async function handleRadioCheck() {
  if (speechLoading.value) return
  const success = await speak('Classmate, this is Avery. If you can hear me loud and clear, give me a thumbs up and we will taxi to the first stop.', 'radio-check')
  if (success) {
    hasCompletedRadioCheck.value = true
  }
}

async function maybeSpeakForStage() {
  if (!tourStarted.value || voiceMode.value !== 'radio' || !hasCompletedRadioCheck.value) return
  const stage = activeStage.value
  if (!stage?.voiceLine) return
  await nextTick()
  await speak(stage.voiceLine, stage.id)
}

function replayStageVoice() {
  maybeSpeakForStage()
}

async function startTour() {
  if (startDisabled.value) return
  stageIndex.value = 0
  unlockedStageIndex.value = 0
  if (!tourStarted.value) {
    tourStarted.value = true
    await nextTick()
    if (typeof window !== 'undefined') {
      document.getElementById('orientation')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  await maybeSpeakForStage()
}

function goToStage(index: number) {
  if (!tourStarted.value) return
  if (index < 0 || index >= stages.length) return
  if (index > unlockedStageIndex.value) return
  if (stageIndex.value === index) {
    maybeSpeakForStage()
    return
  }
  stageIndex.value = index
  maybeSpeakForStage()
}

function goToNext() {
  if (!canGoNext.value) return
  stageIndex.value = Math.min(stages.length - 1, stageIndex.value + 1)
  unlockedStageIndex.value = Math.max(unlockedStageIndex.value, stageIndex.value)
  maybeSpeakForStage()
}

function goToPrevious() {
  if (!canGoPrevious.value) return
  stageIndex.value = Math.max(0, stageIndex.value - 1)
  maybeSpeakForStage()
}

function restartTour() {
  stageIndex.value = 0
  unlockedStageIndex.value = 0
  if (!tourStarted.value) {
    tourStarted.value = true
  }
  maybeSpeakForStage()
}

function setVoiceMode(mode: VoiceMode) {
  if (voiceMode.value === mode) return
  voiceMode.value = mode
  stopAudio()
  if (mode === 'radio') {
    hasCompletedRadioCheck.value = false
  } else {
    speechError.value = null
  }
}

watch(
  () => [tourStarted.value, stageIndex.value, voiceMode.value, hasCompletedRadioCheck.value],
  () => {
    maybeSpeakForStage()
  }
)

onBeforeUnmount(() => {
  stopAudio()
})
</script>

<style scoped>
.voice-toggle {
  transition: border-color 0.25s ease, background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}

.voice-toggle .v-icon {
  color: color-mix(in srgb, var(--accent) 70%, white 30%);
}

.voice-toggle.active {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  color: var(--text);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--accent) 26%, transparent);
}

.voice-toggle.active .v-icon {
  color: color-mix(in srgb, var(--accent) 85%, white 15%);
}

.voice-replay {
  color: var(--t2);
}

.voice-replay:disabled {
  opacity: 0.6;
}

.play-again {
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.progress-fill {
  height: 0.5rem;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(34, 211, 238, 0.85), rgba(14, 165, 233, 0.92));
  box-shadow: 0 0 18px rgba(14, 165, 233, 0.35);
  transition: width 0.45s ease;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
