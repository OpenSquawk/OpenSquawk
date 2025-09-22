<template>
  <div class="learn-intro-page min-h-screen bg-[#050817] text-white">
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_65%)]"></div>
      <div class="container-outer relative z-10 py-16 sm:py-24">
        <div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start">
          <div class="space-y-6">
            <span class="chip">Training tour</span>
            <h1 class="text-3xl sm:text-5xl font-semibold leading-tight">
              Welcome to OpenSquawk Learn
            </h1>
            <p class="text-base sm:text-lg text-white/80">
              This guided introduction explains how the training environment works. The live AI ATC controller is still in
              closed testing, so this is where you warm up, learn the phraseology and build confidence before talking to the
              live system during a simulator session.
            </p>
            <p class="text-sm text-white/70">
              You will explore each part of the learning flow, try interactive previews and finish with a short checklist. When
              you are ready, continue to the main Learn mission hub.
            </p>
            <div class="flex flex-wrap items-center gap-3 pt-3">
              <NuxtLink to="#tour" class="btn btn-primary flex items-center gap-2">
                <v-icon icon="mdi-rocket-launch" size="18"/>
                Start the tour
              </NuxtLink>
              <button
                  type="button"
                  class="btn btn-ghost flex items-center gap-2"
                  @click="scrollToTour"
              >
                <v-icon icon="mdi-compass-outline" size="18"/>
                Jump to current step
              </button>
            </div>
          </div>

          <aside class="rounded-3xl border border-white/10 bg-white/5/80 backdrop-blur p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
                <v-icon icon="mdi-headset" size="28" class="text-cyan-300"/>
              </div>
              <div>
                <p class="text-sm uppercase tracking-wide text-white/60">Live AI ATC status</p>
                <p class="font-semibold">Private testing in progress</p>
              </div>
            </div>
            <p class="text-sm text-white/70">
              While the live controller is still being hardened, Learn gives you realistic radio drills with AI voices, scoring
              and mission-style briefings. Everything you practise here transfers to the live experience later.
            </p>
            <div class="space-y-3 text-sm text-white/65">
              <div class="flex items-start gap-3">
                <v-icon icon="mdi-clock-check-outline" size="18" class="mt-[2px] text-cyan-300"/>
                <span>Self-paced modules keep your schedule flexible.</span>
              </div>
              <div class="flex items-start gap-3">
                <v-icon icon="mdi-account-school" size="18" class="mt-[2px] text-cyan-300"/>
                <span>Guided explanations mirror the flow you will follow in the cockpit.</span>
              </div>
              <div class="flex items-start gap-3">
                <v-icon icon="mdi-shield-check" size="18" class="mt-[2px] text-cyan-300"/>
                <span>Safe sandbox: no radios to clog and unlimited do-overs.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <section id="tour" ref="tourSection" class="relative z-10 pb-24">
      <div class="container-outer">
        <div class="rounded-[32px] border border-white/10 bg-white/5/60 backdrop-blur px-6 py-10 shadow-[0_40px_120px_-40px_rgba(34,211,238,0.45)]">
          <div class="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside class="space-y-3">
              <p class="text-xs uppercase tracking-[0.3em] text-white/50">Flight plan</p>
              <div class="space-y-3">
                <button
                    v-for="(step, index) in steps"
                    :key="step.id"
                    type="button"
                    class="w-full rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050817]"
                    :class="index === activeStep ? 'border-cyan-400/60 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 text-white' : 'border-white/10 bg-white/5 text-white/75 hover:border-cyan-400/50 hover:text-white'"
                    @click="setStep(index)"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 text-sm font-medium">
                      <div
                          class="flex h-9 w-9 items-center justify-center rounded-xl border"
                          :class="index === activeStep ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-200' : 'border-white/10 bg-white/5 text-white/60'"
                      >
                        <template v-if="index < activeStep">
                          <v-icon icon="mdi-check" size="18" class="text-cyan-300"/>
                        </template>
                        <template v-else>
                          <span>{{ index + 1 }}</span>
                        </template>
                      </div>
                      <span>{{ step.label }}</span>
                    </div>
                    <v-icon :icon="step.icon" size="18" class="text-white/50"/>
                  </div>
                  <p class="mt-2 text-xs text-white/55">{{ step.description }}</p>
                </button>
              </div>
            </aside>

            <div class="rounded-3xl border border-white/10 bg-[#060b18]/90 p-6 sm:p-8">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="text-xs uppercase tracking-[0.3em] text-white/50">Step {{ activeStep + 1 }} of {{ steps.length }}</div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/10 sm:w-60">
                  <div class="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all duration-300"
                       :style="{ width: progressPct + '%' }"></div>
                </div>
              </div>

              <Transition name="fade-scale" mode="out-in">
                <div :key="currentStep.id" class="mt-8 space-y-6">
                  <template v-if="currentStep.id === 'orientation'">
                    <div class="space-y-4">
                      <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight">Orient yourself before flying</h2>
                      <p class="text-white/70">
                        Learn is a dedicated training playground. You will rehearse phraseology, radio discipline and cockpit
                        flows without pressure. Every mission mirrors the structure you will encounter once the live AI
                        controller opens to the public.
                      </p>
                    </div>
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/50">Pick a focus</p>
                      <div class="mt-3 grid gap-3 sm:grid-cols-3">
                        <button
                            v-for="card in orientationCards"
                            :key="card.id"
                            type="button"
                            class="rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b18]"
                            :class="card.id === orientationFocus ? 'border-cyan-400/60 bg-cyan-500/10 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40 hover:text-white'"
                            @click="orientationFocus = card.id"
                        >
                          <div class="flex items-center gap-2 text-sm font-semibold">
                            <v-icon :icon="card.icon" size="18" class="text-cyan-300"/>
                            <span>{{ card.title }}</span>
                          </div>
                          <p class="mt-2 text-xs text-white/60 leading-relaxed">{{ card.summary }}</p>
                        </button>
                      </div>
                      <div class="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5">
                        <h3 class="text-lg font-semibold">{{ orientationSelection.title }}</h3>
                        <p class="mt-2 text-sm text-white/70">{{ orientationSelection.body }}</p>
                        <ul class="mt-4 space-y-2 text-sm text-white/65">
                          <li v-for="tip in orientationSelection.tips" :key="tip" class="flex items-start gap-2">
                            <v-icon icon="mdi-navigation-variant-outline" size="18" class="mt-[2px] text-cyan-300"/>
                            <span>{{ tip }}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="currentStep.id === 'hub'">
                    <div class="space-y-4">
                      <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight">Tour the mission hub</h2>
                      <p class="text-white/70">
                        Every training run starts in the hub. Tiles show new content, track your averages and gate new missions
                        until you are ready. Pick a tile below to preview how progress is visualised.
                      </p>
                    </div>
                    <div class="grid gap-3 sm:grid-cols-3">
                      <button
                          v-for="mission in missionPreviews"
                          :key="mission.id"
                          type="button"
                          class="rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b18]"
                          :class="mission.id === selectedMission ? 'border-cyan-400/60 bg-cyan-500/10 text-white shadow shadow-cyan-500/20' : 'border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40 hover:text-white'"
                          @click="selectMission(mission.id)"
                      >
                        <div class="flex items-center gap-3">
                          <v-icon :icon="mission.icon" size="20" class="text-cyan-300"/>
                          <div>
                            <div class="text-sm font-semibold">{{ mission.title }}</div>
                            <p class="text-xs text-white/55">{{ mission.subtitle }}</p>
                          </div>
                        </div>
                        <div class="mt-4 h-2 rounded-full bg-white/10">
                          <div class="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                               :style="{ width: mission.progress + '%' }"></div>
                        </div>
                        <p class="mt-2 text-[13px] text-white/60">{{ mission.progressLabel }}</p>
                      </button>
                    </div>
                    <div class="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
                      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div class="space-y-3">
                          <h3 class="text-xl font-semibold">{{ selectedMissionData.title }}</h3>
                          <p class="text-sm text-white/70">{{ selectedMissionData.body }}</p>
                          <ul class="space-y-2 text-sm text-white/65">
                            <li v-for="item in selectedMissionData.highlights" :key="item" class="flex items-start gap-2">
                              <v-icon icon="mdi-check-circle-outline" size="18" class="mt-[1px] text-cyan-300"/>
                              <span>{{ item }}</span>
                            </li>
                          </ul>
                        </div>
                        <div class="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 w-full max-w-sm">
                          <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Lesson manifest</p>
                          <ul class="mt-3 space-y-2 text-sm">
                            <li
                                v-for="lesson in selectedMissionData.lessons"
                                :key="lesson.id"
                                class="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/20 bg-white/5 px-3 py-2"
                            >
                              <span>{{ lesson.title }}</span>
                              <span class="text-xs text-white/60">{{ lesson.duration }} min</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="currentStep.id === 'workspace'">
                    <div class="space-y-4">
                      <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight">Understand the lesson workspace</h2>
                      <p class="text-white/70">
                        Lessons combine a briefing card, interactive exercises and instant scoring. Toggle through the panels to
                        see what each section controls before you launch your first training flight.
                      </p>
                    </div>
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-white/50">Workspace panels</p>
                      <div class="mt-3 flex flex-wrap gap-3">
                        <button
                            v-for="panel in workspacePanels"
                            :key="panel.id"
                            type="button"
                            class="rounded-2xl border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b18]"
                            :class="panel.id === workspaceFocus ? 'border-cyan-400/60 bg-cyan-500/10 text-white shadow shadow-cyan-500/20' : 'border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40 hover:text-white'"
                            @click="workspaceFocus = panel.id"
                        >
                          <div class="flex items-center gap-2">
                            <v-icon :icon="panel.icon" size="18" class="text-cyan-300"/>
                            <span>{{ panel.title }}</span>
                          </div>
                        </button>
                      </div>
                      <div class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
                        <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <h3 class="text-lg font-semibold">{{ workspaceSelection.title }}</h3>
                          <p class="mt-2 text-sm text-white/70">{{ workspaceSelection.body }}</p>
                          <ul class="mt-4 space-y-2 text-sm text-white/65">
                            <li v-for="hint in workspaceSelection.hints" :key="hint" class="flex items-start gap-2">
                              <v-icon icon="mdi-target-variant" size="18" class="mt-[2px] text-cyan-300"/>
                              <span>{{ hint }}</span>
                            </li>
                          </ul>
                        </div>
                        <div class="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 space-y-4">
                          <div class="rounded-xl border border-cyan-400/40 bg-[#061021]/80 p-3 text-sm">
                            <div class="flex items-center justify-between">
                              <span class="text-white/70">Audio challenge</span>
                              <span class="text-xs text-cyan-200">{{ workspaceSelection.audioLabel }}</span>
                            </div>
                            <div class="mt-3 h-2 rounded-full bg-white/10">
                              <div class="h-full rounded-full bg-cyan-400" :style="{ width: workspaceSelection.audioIntensity + '%' }"></div>
                            </div>
                          </div>
                          <div class="rounded-xl border border-cyan-400/40 bg-[#061021]/80 p-3 text-sm">
                            <div class="flex items-center justify-between">
                              <span class="text-white/70">Score impact</span>
                              <span class="text-xs text-cyan-200">{{ workspaceSelection.scoreLabel }}</span>
                            </div>
                            <div class="mt-3 h-2 rounded-full bg-white/10">
                              <div class="h-full rounded-full bg-sky-500" :style="{ width: workspaceSelection.scoreIntensity + '%' }"></div>
                            </div>
                          </div>
                          <p class="text-xs text-white/60">
                            Tip: you can reopen the mission briefing at any time if you want to review frequencies or phraseology
                            before submitting your readback.
                          </p>
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="currentStep.id === 'audio'">
                    <div class="space-y-4">
                      <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight">Preview the radio practice</h2>
                      <p class="text-white/70">
                        The <span class="text-cyan-200">Say</span> button plays an AI controller response. Adjust the sliders
                        to mimic noisy or crisp radios and then trigger one of the sample calls. This uses the same <code
                          class="rounded bg-black/40 px-1.5 py-0.5 text-[13px] text-cyan-200">/api/atc/say</code> endpoint as
                        the Learn missions.
                      </p>
                    </div>
                    <div class="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-6">
                      <div class="grid gap-5 lg:grid-cols-2">
                        <div class="space-y-4">
                          <label class="block text-sm font-medium text-white/80">
                            Radio quality · {{ radioLevelLabel }}
                            <input
                                v-model.number="sampleRadioLevel"
                                type="range"
                                min="1"
                                max="5"
                                class="mt-2 w-full accent-cyan-400"
                            >
                          </label>
                          <label class="block text-sm font-medium text-white/80">
                            Speech speed · {{ sampleSpeedLabel }}
                            <input
                                v-model.number="sampleSpeechRate"
                                type="range"
                                min="0.8"
                                max="1.25"
                                step="0.05"
                                class="mt-2 w-full accent-cyan-400"
                            >
                          </label>
                          <p class="text-xs text-white/60">
                            When you enter a mission you can fine-tune these settings inside the ATC panel. Practise with
                            tougher audio here so the real flow feels easy.
                          </p>
                        </div>
                        <div class="space-y-4">
                          <p class="text-xs uppercase tracking-[0.3em] text-white/50">Sample calls</p>
                          <div class="grid gap-3">
                            <button
                                v-for="phrase in samplePhrases"
                                :key="phrase.id"
                                type="button"
                                class="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b18]"
                                :class="isPhraseActive(phrase.id) ? 'border-cyan-400/60 bg-cyan-500/10 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40 hover:text-white'"
                                @click="handleSampleClick(phrase)"
                            >
                              <div>
                                <div class="text-sm font-semibold">{{ phrase.title }}</div>
                                <p class="text-xs text-white/60">{{ phrase.text }}</p>
                              </div>
                              <div class="flex items-center gap-2 text-xs text-white/60">
                                <v-icon :icon="isPhrasePlaying(phrase.id) ? 'mdi-stop-circle' : 'mdi-volume-high'" size="20" class="text-cyan-300"/>
                                <span>{{ isPhrasePlaying(phrase.id) ? 'Stop' : 'Say' }}</span>
                              </div>
                            </button>
                          </div>
                          <div class="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm text-white/70">
                            <div class="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-200">What to
                              listen for</div>
                            <ul class="mt-2 space-y-2">
                              <li class="flex items-start gap-2">
                                <v-icon icon="mdi-waveform" size="18" class="mt-[2px] text-cyan-300"/>
                                <span>{{ radioLevelLabel }} readability with simulated background noise.</span>
                              </li>
                              <li class="flex items-start gap-2">
                                <v-icon icon="mdi-timer-outline" size="18" class="mt-[2px] text-cyan-300"/>
                                <span>Speech rate at {{ sampleSpeedLabel }} so you can match your readback tempo.</span>
                              </li>
                              <li class="flex items-start gap-2">
                                <v-icon icon="mdi-replay" size="18" class="mt-[2px] text-cyan-300"/>
                                <span>Replay as often as you need; repetition cements phraseology.</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <p v-if="sampleError" class="text-sm text-red-300">{{ sampleError }}</p>
                      <p v-else class="text-xs text-white/55">
                        {{ sampleStatusMessage }}
                      </p>
                    </div>
                  </template>

                  <template v-else>
                    <div class="space-y-4">
                      <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight">Final checks before the hub</h2>
                      <p class="text-white/70">
                        Confirm the items below so you know what will happen once you enter the Learn mission hub. This mirrors
                        the pre-flight scan you would do in the cockpit.
                      </p>
                    </div>
                    <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div class="text-sm font-medium text-white/70">Readiness checklist</div>
                        <div class="flex items-center gap-3 text-sm text-white/60">
                          <span>{{ readinessCompleted }} / {{ readinessChecklist.length }} complete</span>
                          <div class="h-2 w-32 overflow-hidden rounded-full bg-white/10">
                            <div class="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                                 :style="{ width: readinessProgress + '%' }"></div>
                          </div>
                        </div>
                      </div>
                      <div class="mt-5 space-y-3">
                        <label
                            v-for="item in readinessChecklist"
                            :key="item.id"
                            class="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-cyan-400/40"
                        >
                          <input
                              v-model="readinessState[item.id]"
                              type="checkbox"
                              class="mt-1 h-4 w-4 rounded border-white/20 bg-[#060b18] text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                          >
                          <div>
                            <div class="text-sm font-semibold">{{ item.label }}</div>
                            <p class="text-xs text-white/60">{{ item.body }}</p>
                          </div>
                        </label>
                      </div>
                      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p class="text-sm" :class="readyForLaunch ? 'text-cyan-200' : 'text-white/60'">{{ readinessMessage }}</p>
                        <div class="flex items-center gap-3">
                          <button
                              type="button"
                              class="btn btn-ghost"
                              @click="markAllReadiness"
                          >
                            Mark all reviewed
                          </button>
                          <button
                              type="button"
                              class="btn btn-primary flex items-center gap-2"
                              :disabled="!readyForLaunch"
                              @click="goToLearn"
                          >
                            <v-icon icon="mdi-airplane-takeoff" size="18"/>
                            Enter mission hub
                          </button>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </Transition>

              <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="button"
                    class="btn btn-ghost"
                    :disabled="activeStep === 0"
                    @click="previousStep"
                >
                  <v-icon icon="mdi-arrow-left" size="18"/>
                  Previous
                </button>
                <div class="flex items-center gap-3">
                  <button
                      v-if="activeStep < steps.length - 1"
                      type="button"
                      class="btn btn-primary"
                      @click="nextStep"
                  >
                    Next step
                    <v-icon icon="mdi-arrow-right" size="18"/>
                  </button>
                  <button
                      v-else
                      type="button"
                      class="btn btn-primary"
                      :disabled="!readyForLaunch"
                      @click="goToLearn"
                  >
                    Start learning
                    <v-icon icon="mdi-map-marker-check" size="18"/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, reactive, ref, watch} from 'vue'
import {useHead, useRouter} from '#imports'
import {useAuthStore} from '~/stores/auth'
import {useApi} from '~/composables/useApi'

definePageMeta({middleware: 'require-auth'})

useHead({title: 'Learn introduction · OpenSquawk'})

interface Step {
  id: 'orientation' | 'hub' | 'workspace' | 'audio' | 'checklist'
  label: string
  description: string
  icon: string
}

interface FocusCard {
  id: string
  title: string
  summary: string
  body: string
  tips: string[]
  icon: string
}

interface MissionPreview {
  id: string
  title: string
  subtitle: string
  progress: number
  progressLabel: string
  icon: string
  body: string
  highlights: string[]
  lessons: { id: string; title: string; duration: number }[]
}

interface WorkspacePanel {
  id: string
  title: string
  body: string
  icon: string
  hints: string[]
  audioIntensity: number
  audioLabel: string
  scoreIntensity: number
  scoreLabel: string
}

interface SamplePhrase {
  id: string
  title: string
  text: string
}

interface ReadinessItem {
  id: string
  label: string
  body: string
}

const router = useRouter()
const auth = useAuthStore()
const api = useApi()

const tourSection = ref<HTMLElement | null>(null)

const steps: Step[] = [
  {
    id: 'orientation',
    label: 'Orientation',
    description: 'Understand what the Learn mode covers.',
    icon: 'mdi-compass-outline'
  },
  {
    id: 'hub',
    label: 'Mission hub',
    description: 'Preview the modules and progress tiles.',
    icon: 'mdi-view-dashboard-outline'
  },
  {
    id: 'workspace',
    label: 'Lesson workspace',
    description: 'See how briefings and scoring align.',
    icon: 'mdi-clipboard-text-outline'
  },
  {
    id: 'audio',
    label: 'Radio practice',
    description: 'Try the Say endpoint with live audio.',
    icon: 'mdi-waveform'
  },
  {
    id: 'checklist',
    label: 'Checklist',
    description: 'Confirm you are ready for the mission hub.',
    icon: 'mdi-checkbox-marked-circle-outline'
  }
]

const activeStep = ref(0)
const currentStep = computed(() => steps[activeStep.value])
const progressPct = computed(() => {
  if (steps.length <= 1) return 100
  return Math.round((activeStep.value / (steps.length - 1)) * 100)
})

const orientationCards: FocusCard[] = [
  {
    id: 'flow',
    title: 'Guided workflow',
    summary: 'Follow the same phases you will fly later.',
    body: 'Each module mirrors the briefing → setup → lesson → debrief flow that you will see again when live AI ATC launches.',
    tips: [
      'Briefings set the context, frequencies and expectations before you speak.',
      'Interactive cards guide you through exact readbacks and radio etiquette.',
      'You can restart any module without losing XP if you want more practice.'
    ],
    icon: 'mdi-timeline-text-outline'
  },
  {
    id: 'sandbox',
    title: 'Safe sandbox',
    summary: 'Make mistakes with zero pressure.',
    body: 'The training environment is intentionally forgiving. You can repeat a scenario, slow down speech or lower radio fidelity whenever you need to regroup.',
    tips: [
      'Toggle the audio challenge slider to match your comfort level.',
      'Hints are available on-demand – use them, then hide them to test retention.',
      'Scores are private and resettable so you can focus on learning, not perfection.'
    ],
    icon: 'mdi-shield-half-full'
  },
  {
    id: 'handoff',
    title: 'Bridge to live AI ATC',
    summary: 'Build muscle memory before connecting to the controller.',
    body: 'By the time the hosted controller opens up, you will already know the cadence, phraseology and flow. Learn primes you for that handoff.',
    tips: [
      'Objectives unlock progressively, similar to live airspace access.',
      'Recorded calls use the same neural voices that power the controller.',
      'Your settings follow you into the live environment for a seamless jump.'
    ],
    icon: 'mdi-airplane-takeoff'
  }
]

const orientationFocus = ref<string>(orientationCards[0].id)
const orientationSelection = computed(() => orientationCards.find(card => card.id === orientationFocus.value) || orientationCards[0])

const missionPreviews: MissionPreview[] = [
  {
    id: 'alphabet',
    title: 'ICAO alphabet & numbers',
    subtitle: 'Boot-up essentials',
    progress: 80,
    progressLabel: '4 / 5 lessons complete',
    icon: 'mdi-alphabetical-variant',
    body: 'Master the fundamentals with call sign pronunciation, numbers and readback rhythm. Perfect as a warm-up before more complex modules.',
    highlights: [
      'Practice call signs with instant phonetic feedback.',
      'Drill numbers, headings and altitudes with increasing difficulty.',
      'Earn your first streak bonus by finishing the module in sequence.'
    ],
    lessons: [
      {id: 'alpha', title: 'Alpha to Zulu warm-up', duration: 5},
      {id: 'numbers', title: 'Climb & descent numbers', duration: 6},
      {id: 'callsign', title: 'Call sign challenge', duration: 7}
    ]
  },
  {
    id: 'ground',
    title: 'Ground operations',
    subtitle: 'Taxi, push & hold',
    progress: 45,
    progressLabel: '2 / 5 lessons complete',
    icon: 'mdi-runway',
    body: 'Work through pushback approvals, taxi instructions and hold short calls. You will decode complex taxiways and practise crisp readbacks.',
    highlights: [
      'Animated airport diagrams show the route you need to read back.',
      'Controller prompts vary so you learn to handle surprises.',
      'Replay your answers with the audio mirror to catch improvements.'
    ],
    lessons: [
      {id: 'pushback', title: 'Pushback & start', duration: 6},
      {id: 'taxi', title: 'Taxi clearance maze', duration: 8},
      {id: 'hold', title: 'Hold short discipline', duration: 5}
    ]
  },
  {
    id: 'departure',
    title: 'Departure clearance',
    subtitle: 'SIDs & readbacks',
    progress: 20,
    progressLabel: '1 / 5 lessons complete',
    icon: 'mdi-airplane-takeoff',
    body: 'Prepare for the moment of truth: expect a full IFR clearance, practise copying amendments and confirm with confident readbacks.',
    highlights: [
      'SimBrief import shows your filed route alongside the clearance.',
      'Blank fields train you to capture altitudes, squawk codes and fixes.',
      'XP bonuses reward accurate readbacks on the first attempt.'
    ],
    lessons: [
      {id: 'clearance', title: 'IFR clearance copy', duration: 8},
      {id: 'squawk', title: 'Squawk change drill', duration: 4},
      {id: 'sid', title: 'SID walk-through', duration: 7}
    ]
  }
]

const selectedMission = ref<string>(missionPreviews[0].id)
const selectedMissionData = computed(() => missionPreviews.find(mission => mission.id === selectedMission.value) || missionPreviews[0])
const selectMission = (id: string) => {
  selectedMission.value = id
}

const workspacePanels: WorkspacePanel[] = [
  {
    id: 'briefing',
    title: 'Mission briefing',
    body: 'Review the scenario, frequencies and weather. It is your "clearance delivery" before any interaction.',
    icon: 'mdi-clipboard-list-outline',
    hints: [
      'Download the PDF or keep it pinned while you practise.',
      'The right-hand column highlights what the controller expects from you.',
      'Briefings include real charts when the mission needs them.'
    ],
    audioIntensity: 35,
    audioLabel: 'Optional background',
    scoreIntensity: 20,
    scoreLabel: 'No scoring impact'
  },
  {
    id: 'trainer',
    title: 'Interactive trainer',
    body: 'Speak or type your answer, then use Say to hear how the controller would respond. You get hints before revealing the answer.',
    icon: 'mdi-microphone-message',
    hints: [
      'Use the practise mode to rehearse as often as you want.',
      'Switch between keyboard input and microphone when ready.',
      'Audio hints are recorded by the same model as the live controller.'
    ],
    audioIntensity: 65,
    audioLabel: 'Modulated radio',
    scoreIntensity: 75,
    scoreLabel: 'High score weight'
  },
  {
    id: 'debrief',
    title: 'Debrief & scoring',
    body: 'See what you nailed and what to repeat. Scores feed into mission unlocks and XP for bragging rights.',
    icon: 'mdi-chart-box-outline',
    hints: [
      'Objective badges show which skills you have mastered.',
      'Replay your best answers to compare improvement over time.',
      'Use the retry button to immediately jump back into the mission.'
    ],
    audioIntensity: 10,
    audioLabel: 'Playback only',
    scoreIntensity: 100,
    scoreLabel: 'Determines unlocks'
  }
]

const workspaceFocus = ref<string>(workspacePanels[0].id)
const workspaceSelection = computed(() => workspacePanels.find(panel => panel.id === workspaceFocus.value) || workspacePanels[0])

const samplePhrases: SamplePhrase[] = [
  {id: 'taxi-request', title: 'Taxi request', text: 'Frankfurt Ground, Lufthansa one two three, request taxi.'},
  {id: 'pushback', title: 'Pushback approved', text: 'Lufthansa one two three, push and start approved, facing east.'},
  {id: 'departure', title: 'Departure clearance', text: 'Lufthansa one two three, cleared to Munich via ANEKI FIVE FOXTROT, squawk 4203.'}
]

const sampleRadioLevel = ref<number>(3)
const sampleSpeechRate = ref<number>(1)

const radioLevelMap: Record<number, string> = {
  1: 'Very poor',
  2: 'Poor',
  3: 'Good',
  4: 'Very good',
  5: 'Crystal clear'
}

const radioLevelLabel = computed(() => radioLevelMap[Math.round(sampleRadioLevel.value)] || 'Standard')
const sampleSpeedLabel = computed(() => `${sampleSpeechRate.value.toFixed(2)}×`)

const playingPhraseId = ref<string | null>(null)
const lastSelectedPhraseId = ref<string>(samplePhrases[0].id)
const isLoadingSample = ref(false)
const isPlayingSample = ref(false)
const sampleError = ref('')
const sampleAudioElement = ref<HTMLAudioElement | null>(null)

const readinessChecklist: ReadinessItem[] = [
  {
    id: 'hub',
    label: 'I know how to open a mission from the hub',
    body: 'Select a tile and use the primary action to jump into setup.'
  },
  {
    id: 'settings',
    label: 'I can adjust audio, speech rate and hints',
    body: 'The ATC panel keeps your preferences between lessons.'
  },
  {
    id: 'scoring',
    label: 'I understand how scoring unlocks new missions',
    body: 'Higher scores and completed objectives open advanced content.'
  }
]

const readinessState = reactive<Record<string, boolean>>({})
readinessChecklist.forEach(item => {
  readinessState[item.id] = false
})

const readinessCompleted = computed(() => readinessChecklist.filter(item => readinessState[item.id]).length)
const readinessProgress = computed(() => {
  if (readinessChecklist.length === 0) return 0
  return Math.round((readinessCompleted.value / readinessChecklist.length) * 100)
})
const readyForLaunch = computed(() => readinessCompleted.value === readinessChecklist.length)
const readinessMessage = computed(() => {
  if (readyForLaunch.value) {
    return 'Checklist complete – you are cleared to enter the mission hub.'
  }
  return 'Tick each item to confirm you know what happens inside Learn.'
})

const sampleStatusMessage = computed(() => {
  if (isLoadingSample.value) {
    return 'Requesting audio sample…'
  }
  if (isPlayingSample.value && playingPhraseId.value) {
    return 'Playing controller response. Use Stop to rehearse again.'
  }
  return 'Pick a sample call to hear the AI controller voice with your current settings.'
})

function scrollToTour() {
  if (typeof window === 'undefined') return
  const element = tourSection.value
  if (element) {
    element.scrollIntoView({behavior: 'smooth', block: 'start'})
  }
}

function setStep(index: number) {
  if (index < 0 || index >= steps.length) return
  activeStep.value = index
}

function nextStep() {
  if (activeStep.value < steps.length - 1) {
    activeStep.value += 1
  }
}

function previousStep() {
  if (activeStep.value > 0) {
    activeStep.value -= 1
  }
}

function markAllReadiness() {
  readinessChecklist.forEach(item => {
    readinessState[item.id] = true
  })
}

function goToLearn() {
  if (!readyForLaunch.value) return
  stopSample()
  router.push('/learn')
}

function isPhraseActive(id: string) {
  if (playingPhraseId.value) {
    return playingPhraseId.value === id
  }
  return lastSelectedPhraseId.value === id
}

function isPhrasePlaying(id: string) {
  return playingPhraseId.value === id && isPlayingSample.value
}

async function handleSampleClick(phrase: SamplePhrase) {
  sampleError.value = ''
  lastSelectedPhraseId.value = phrase.id
  if (isPhrasePlaying(phrase.id)) {
    stopSample()
    return
  }
  await playSample(phrase)
}

async function playSample(phrase: SamplePhrase) {
  if (!phrase?.text) return
  if (!auth.user) {
    sampleError.value = 'Please log in to preview the controller audio.'
    return
  }

  stopSample()

  isLoadingSample.value = true
  playingPhraseId.value = phrase.id

  const payload = {
    text: phrase.text,
    level: Math.round(sampleRadioLevel.value),
    speed: Number(sampleSpeechRate.value.toFixed(2)),
    moduleId: 'learn-introduction',
    lessonId: phrase.id,
    tag: 'learn-intro'
  }

  try {
    const response: any = await api.post('/api/atc/say', payload)
    const base64 = response?.audio?.base64
    const mime = response?.audio?.mime || 'audio/wav'

    if (!base64) {
      throw new Error('Audio payload missing')
    }

    const audioUrl = `data:${mime};base64,${base64}`
    const audio = new Audio(audioUrl)
    audio.playbackRate = 1

    audio.addEventListener('ended', () => {
      stopSample()
    })
    audio.addEventListener('error', () => {
      stopSample()
      sampleError.value = 'Playback failed. Try again or adjust the settings.'
    })

    sampleAudioElement.value = audio
    await audio.play()
    isPlayingSample.value = true
  } catch (err: any) {
    console.error('Sample playback failed', err)
    sampleError.value = err?.message || 'Failed to request controller audio.'
    stopSample()
  } finally {
    isLoadingSample.value = false
  }
}

function stopSample() {
  const current = sampleAudioElement.value
  if (current) {
    try {
      current.pause()
    } catch (err) {
      console.warn('Failed to stop sample audio', err)
    }
    sampleAudioElement.value = null
  }
  isPlayingSample.value = false
  if (playingPhraseId.value) {
    playingPhraseId.value = null
  }
}

watch(activeStep, (step) => {
  if (steps[step]?.id !== 'audio') {
    stopSample()
  }
})

onBeforeUnmount(() => {
  stopSample()
})
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.25s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.fade-scale-leave-from,
.fade-scale-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
