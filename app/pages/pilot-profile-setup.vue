<template>
  <div class="learn-theme min-h-screen bg-[#070d1a] text-white">
    <header class="border-b border-white/5 bg-[#070d1a]/80 backdrop-blur">
      <div class="mx-auto flex w-full max-w-screen-md items-center gap-3 px-4 py-6 sm:px-6">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
          <v-icon icon="mdi-radar" size="26" class="text-cyan-300" />
        </div>
        <div>
          <p class="text-lg font-semibold tracking-tight">Setting up your account</p>
          <p class="text-sm text-white/60">Hang tight, this only takes a minute</p>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-screen-md px-4 py-10 sm:px-6">
      <template v-if="!loading">
        <div v-if="!finished" class="mb-10">
          <button
            v-if="currentStep > 0"
            type="button"
            class="mb-3 inline-flex items-center gap-1 text-xs text-white/40 transition hover:text-white/70"
            @click="goBack"
          >
            <v-icon icon="mdi-arrow-left" size="14" />
            Back
          </button>
          <div class="flex items-center gap-3 text-xs text-white/70">
            <div class="flex-1 overflow-hidden rounded-full bg-white/10">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>
            <span class="font-semibold text-white/80">{{ progress }}%</span>
          </div>
          <p class="mt-3 text-sm text-cyan-100/70">{{ activeLogLine }}</p>
        </div>

        <Transition name="fade-slide" mode="out-in">
          <section v-if="finished" key="reward" class="rounded-3xl border border-cyan-300/30 bg-cyan-400/5 p-8 text-center shadow-xl shadow-cyan-500/10">
            <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Your callsign</p>
            <h1 class="mt-3 text-3xl font-semibold sm:text-4xl">{{ answers.resultCallsign }}</h1>
            <ul class="mt-6 flex flex-wrap justify-center gap-3 text-sm text-white/70">
              <li v-if="simulatorLabel" class="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">{{ simulatorLabel }}</li>
              <li v-if="answers.radioConfidence" class="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                Radio confidence {{ answers.radioConfidence }}/5
              </li>
              <li v-if="toolkitLabels.length" class="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">{{ toolkitLabels.join(', ') }}</li>
            </ul>
            <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button type="button" class="btn primary" @click="finishAndLeave">
                Enter Classroom
                <v-icon icon="mdi-launch" size="18" />
              </button>
              <button type="button" class="btn ghost" @click="copyShareLink">
                <v-icon icon="mdi-link-variant" size="18" />
                {{ copied ? 'Copied!' : 'Copy share line' }}
              </button>
            </div>
          </section>

          <section v-else :key="currentStep" class="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <!-- Screen 1: Cockpit -->
            <div v-if="currentStep === 0">
              <h1 class="text-2xl font-semibold">What are you flying?</h1>
              <p class="mt-2 text-sm text-white/60">This tunes the radio setup that comes next.</p>
              <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <button
                  v-for="opt in SIMULATOR_OPTIONS"
                  :key="opt.value"
                  type="button"
                  class="option-card"
                  :class="{ 'option-card--active': answers.simulator === opt.value }"
                  @click="answers.simulator = opt.value"
                >
                  <v-icon :icon="opt.icon" size="28" class="option-card__icon" />
                  <span class="option-card__label">{{ opt.label }}</span>
                </button>
              </div>

              <Transition name="fade-slide">
                <div v-if="simulatorRequiresOs" class="mt-6">
                  <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Which OS?</p>
                  <div class="mt-3 grid grid-cols-3 gap-3">
                    <button
                      v-for="opt in OS_OPTIONS"
                      :key="opt.value"
                      type="button"
                      class="option-card option-card--sm"
                      :class="{ 'option-card--active': answers.os === opt.value }"
                      @click="answers.os = opt.value"
                    >
                      <v-icon :icon="opt.icon" size="22" class="option-card__icon" />
                      <span class="option-card__label">{{ opt.label }}</span>
                    </button>
                  </div>
                </div>
              </Transition>

              <div class="mt-8 border-t border-white/10 pt-6">
                <p class="text-[11px] uppercase tracking-[0.3em] text-white/40">Anything else in your setup? (optional)</p>
                <div class="mt-3 flex flex-wrap gap-3">
                  <button
                    v-for="opt in HARDWARE_OPTIONS"
                    :key="opt.value"
                    type="button"
                    class="option-chip"
                    :class="{ 'option-chip--active': answers.hardware.includes(opt.value) }"
                    @click="toggleInArray(answers.hardware, opt.value)"
                  >
                    <v-icon :icon="opt.icon" size="16" />
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <button
                type="button"
                class="btn primary mt-8"
                :disabled="!answers.simulator || (simulatorRequiresOs && !answers.os)"
                @click="continueCockpit"
              >
                Continue
                <v-icon icon="mdi-arrow-right" size="18" />
              </button>
            </div>

            <!-- Screen 2: Radio confidence -->
            <div v-else-if="currentStep === 1">
              <h1 class="text-2xl font-semibold">How's your ATC radio game right now?</h1>
              <p class="mt-2 text-sm text-white/60">No wrong answer — this just sets your starting difficulty.</p>
              <div class="mt-6 grid grid-cols-5 gap-2 sm:gap-3">
                <button
                  v-for="n in 5"
                  :key="n"
                  type="button"
                  class="option-card option-card--sm"
                  :class="{ 'option-card--active': answers.radioConfidence === n }"
                  @click="saveAnswer({ radioConfidence: n })"
                >
                  <span class="text-xl font-semibold">{{ n }}</span>
                  <span class="option-card__label">{{ RADIO_CONFIDENCE_LABELS[n] }}</span>
                </button>
              </div>
            </div>

            <!-- Screen 3: Stress point -->
            <div v-else-if="currentStep === 2">
              <h1 class="text-2xl font-semibold">What trips you up most?</h1>
              <p class="mt-2 text-sm text-white/60">We'll surface the right drills first.</p>
              <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <button
                  v-for="opt in RADIO_PAIN_POINT_OPTIONS"
                  :key="opt.value"
                  type="button"
                  class="option-card"
                  :class="{ 'option-card--active': answers.radioPainPoint === opt.value }"
                  @click="saveAnswer({ radioPainPoint: opt.value })"
                >
                  <v-icon :icon="opt.icon" size="26" class="option-card__icon" />
                  <span class="option-card__label">{{ opt.label }}</span>
                </button>
              </div>
            </div>

            <!-- Screen 4: Network experience -->
            <div v-else-if="currentStep === 3">
              <h1 class="text-2xl font-semibold">Ever flown on a live network?</h1>
              <p class="mt-2 text-sm text-white/60">Pick as many as apply — or none, if you're not there yet.</p>
              <div class="mt-6 grid grid-cols-2 gap-4">
                <button
                  v-for="opt in NETWORK_OPTIONS"
                  :key="opt.value"
                  type="button"
                  class="option-card"
                  :class="{ 'option-card--active': answers.networkExperience.includes(opt.value) }"
                  @click="toggleInArray(answers.networkExperience, opt.value)"
                >
                  <v-icon :icon="opt.icon" size="28" class="option-card__icon" />
                  <span class="option-card__label">{{ opt.label }}</span>
                </button>
              </div>
              <button type="button" class="btn primary mt-8" @click="saveAnswer({ networkExperience: answers.networkExperience })">
                {{ answers.networkExperience.length === 0 ? "No, not yet" : 'Continue' }}
                <v-icon icon="mdi-arrow-right" size="18" />
              </button>
            </div>

            <!-- Screen 5: Hangar tools -->
            <div v-else-if="currentStep === 4">
              <h1 class="text-2xl font-semibold">What's already in your hangar?</h1>
              <p class="mt-2 text-sm text-white/60">Tap everything you already use.</p>
              <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div v-for="opt in TOOLKIT_OPTIONS" :key="opt.value" class="flex flex-col gap-2">
                  <button
                    type="button"
                    class="option-card"
                    :class="{ 'option-card--active': answers.toolkit.includes(opt.value) }"
                    @click="toggleToolkit(opt.value)"
                  >
                    <v-icon :icon="opt.icon" size="26" class="option-card__icon" />
                    <span class="option-card__label">{{ opt.label }}</span>
                  </button>
                  <div v-if="answers.toolkit.includes(opt.value) && isPaidToolkitItem(opt.value)" class="flex flex-wrap gap-1.5">
                    <button
                      v-for="d in TOOLKIT_DURATION_OPTIONS"
                      :key="d.value"
                      type="button"
                      class="option-pill"
                      :class="{ 'option-pill--active': answers.toolkitDuration[opt.value] === d.value }"
                      @click="answers.toolkitDuration[opt.value] = d.value"
                    >
                      {{ d.label }}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="btn primary mt-8"
                @click="saveAnswer({ toolkit: answers.toolkit, toolkitDuration: answers.toolkitDuration })"
              >
                Continue
                <v-icon icon="mdi-arrow-right" size="18" />
              </button>
            </div>

            <!-- Screen 6: Feature wish -->
            <div v-else-if="currentStep === 5">
              <h1 class="text-2xl font-semibold">Tap the 2 things you'd miss most</h1>
              <p class="mt-2 text-sm text-white/60">If these vanished from OpenSquawk tomorrow.</p>
              <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <button
                  v-for="opt in FEATURE_WISH_OPTIONS"
                  :key="opt.value"
                  type="button"
                  class="option-card"
                  :class="{
                    'option-card--active': answers.topFeatures.includes(opt.value),
                    'option-card--disabled': !answers.topFeatures.includes(opt.value) && answers.topFeatures.length >= MAX_FEATURE_WISHES,
                  }"
                  :disabled="!answers.topFeatures.includes(opt.value) && answers.topFeatures.length >= MAX_FEATURE_WISHES"
                  @click="toggleFeatureWish(opt.value)"
                >
                  <v-icon :icon="opt.icon" size="26" class="option-card__icon" />
                  <span class="option-card__label">{{ opt.label }}</span>
                </button>
              </div>
              <button
                type="button"
                class="btn primary mt-8"
                :disabled="answers.topFeatures.length === 0"
                @click="saveAnswer({ topFeatures: answers.topFeatures })"
              >
                Continue
                <v-icon icon="mdi-arrow-right" size="18" />
              </button>
            </div>

            <!-- Screen 7: Funding preference -->
            <div v-else-if="currentStep === 6">
              <h1 class="text-2xl font-semibold">Building stuff we can't give away for free</h1>
              <p class="mt-2 text-sm text-white/70">
                Some ideas need real development time — we won't fake that away. If that day comes, what would actually
                work for you?
              </p>
              <div class="mt-6 grid grid-cols-2 gap-4">
                <button
                  v-for="opt in PRICING_PREFERENCE_OPTIONS"
                  :key="opt.value"
                  type="button"
                  class="option-card"
                  :class="{ 'option-card--active': answers.pricingPreference === opt.value }"
                  :disabled="finishing"
                  @click="finish(opt.value)"
                >
                  <v-icon :icon="opt.icon" size="26" class="option-card__icon" />
                  <span class="option-card__label">{{ opt.label }}</span>
                </button>
              </div>
              <p class="mt-6 text-xs text-white/50">
                Nothing here charges you or locks anything today — it just tells us what to build next.
              </p>
            </div>
          </section>
        </Transition>

        <button v-if="!finished" type="button" class="skip-link" @click="skip">Skip for now</button>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useHead, useRouter } from '#imports'
import { useApi } from '~/composables/useApi'
import { CLASSROOM_INTRO_STORAGE_KEY } from '~~/shared/constants/storage'
import {
  SIMULATOR_OPTIONS,
  OS_OPTIONS,
  HARDWARE_OPTIONS,
  RADIO_CONFIDENCE_LABELS,
  RADIO_PAIN_POINT_OPTIONS,
  NETWORK_OPTIONS,
  TOOLKIT_OPTIONS,
  PAID_TOOLKIT_VALUES,
  TOOLKIT_DURATION_OPTIONS,
  FEATURE_WISH_OPTIONS,
  MAX_FEATURE_WISHES,
  PRICING_PREFERENCE_OPTIONS,
  ONBOARDING_TOTAL_STEPS,
  SIMULATORS_REQUIRING_OS,
  createDefaultOnboardingProfile,
} from '~~/shared/onboarding/config'
import type { HardwareItem, NetworkExperience, PricingPreference, Simulator, ToolkitItem } from '~~/shared/onboarding/config'

definePageMeta({ middleware: 'require-auth' })

useHead({ title: 'Setting up your account • OpenSquawk' })

const router = useRouter()
const api = useApi()

const answers = reactive(createDefaultOnboardingProfile())
const currentStep = ref(0)
const finished = ref(false)
const finishing = ref(false)
const loading = ref(true)
const copied = ref(false)

const SETUP_LOG_LINES = [
  'Configuring sim bridge…',
  'Calibrating radio clarity…',
  'Prioritizing your drills…',
  'Tuning traffic density…',
  'Linking flight-planning tools…',
  'Prioritizing your roadmap…',
  'Noting upgrade preferences…',
]

const activeLogLine = computed(() => SETUP_LOG_LINES[currentStep.value] ?? SETUP_LOG_LINES[SETUP_LOG_LINES.length - 1])
const progress = computed(() => {
  if (finished.value) return 100
  return Math.min(99, 20 + Math.round((currentStep.value / ONBOARDING_TOTAL_STEPS) * 80))
})

const simulatorLabel = computed(() => SIMULATOR_OPTIONS.find(o => o.value === answers.simulator)?.label || '')
const simulatorRequiresOs = computed(() => Boolean(answers.simulator && (SIMULATORS_REQUIRING_OS as string[]).includes(answers.simulator)))
const toolkitLabels = computed(() => TOOLKIT_OPTIONS.filter(o => answers.toolkit.includes(o.value)).map(o => o.label))

function toggleInArray<T>(arr: T[], value: T) {
  const idx = arr.indexOf(value)
  if (idx === -1) arr.push(value)
  else arr.splice(idx, 1)
}

function isPaidToolkitItem(value: ToolkitItem) {
  return (PAID_TOOLKIT_VALUES as ToolkitItem[]).includes(value)
}

function toggleToolkit(value: ToolkitItem) {
  toggleInArray(answers.toolkit, value)
  if (!answers.toolkit.includes(value)) {
    delete answers.toolkitDuration[value]
  }
}

function toggleFeatureWish(value: (typeof FEATURE_WISH_OPTIONS)[number]['value']) {
  if (answers.topFeatures.includes(value)) {
    toggleInArray(answers.topFeatures, value)
  } else if (answers.topFeatures.length < MAX_FEATURE_WISHES) {
    answers.topFeatures.push(value)
  }
}

async function saveAnswer(partial: Record<string, unknown>) {
  Object.assign(answers, partial)
  const response = await api.put('/api/onboarding/profile', partial)
  Object.assign(answers, response as object)
  currentStep.value = Math.min(currentStep.value + 1, ONBOARDING_TOTAL_STEPS - 1)
}

function goBack() {
  currentStep.value = Math.max(0, currentStep.value - 1)
}

function continueCockpit() {
  const payload: { simulator: Simulator | null; hardware: HardwareItem[]; os?: string | null } = {
    simulator: answers.simulator,
    hardware: answers.hardware,
  }
  if (simulatorRequiresOs.value) {
    payload.os = answers.os
  }
  saveAnswer(payload)
}

async function finish(pricingPreference: PricingPreference) {
  answers.pricingPreference = pricingPreference
  finishing.value = true
  try {
    const response = await api.put('/api/onboarding/profile', { pricingPreference, completed: true })
    Object.assign(answers, response as object)
    finished.value = true
  } finally {
    finishing.value = false
  }
}

function finishAndLeave() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLASSROOM_INTRO_STORAGE_KEY, 'false')
  }
  router.replace('/start?firstTime=1')
}

async function skip() {
  try {
    await api.put('/api/onboarding/profile', { skipped: true })
  } finally {
    finishAndLeave()
  }
}

async function copyShareLink() {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(`I'm a "${answers.resultCallsign}" on OpenSquawk. What's your callsign?`)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // clipboard access can fail silently — non-critical feature
  }
}

onMounted(async () => {
  try {
    const response = await api.get<Record<string, unknown>>('/api/onboarding/profile')
    Object.assign(answers, response)
    if (response.completedAt || response.skippedAt) {
      finishAndLeave()
    }
  } catch {
    // fall back to defaults — the user can still proceed through the flow
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.option-card {
  @apply relative flex flex-col items-center gap-2 rounded-2xl border-2 border-white/10 bg-white/5 px-4 py-5 text-center text-sm text-white/80 transition hover:border-cyan-300/50 hover:bg-white/10;
}

.option-card--active {
  @apply border-cyan-300 bg-cyan-400/20 text-white shadow-lg shadow-cyan-500/20;
}

.option-card--active::after {
  content: '\2713';
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: #22d3ee;
  color: #061318;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.option-card--sm {
  @apply px-3 py-4;
}

.option-card--disabled {
  @apply cursor-not-allowed opacity-35 hover:border-white/10 hover:bg-white/5;
}

.option-card__icon {
  @apply text-cyan-300;
}

.option-card__label {
  @apply text-xs text-white/70;
}

.option-chip {
  @apply inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:border-cyan-300/40 hover:text-white;
}

.option-chip--active {
  @apply border-cyan-300/50 bg-cyan-400/10 text-white;
}

.option-pill {
  @apply rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60 transition hover:border-cyan-300/40;
}

.option-pill--active {
  @apply border-cyan-300/60 bg-cyan-400/15 text-white;
}

.skip-link {
  @apply mt-8 block w-full text-center text-xs text-white/30 transition hover:text-white/60;
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
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
