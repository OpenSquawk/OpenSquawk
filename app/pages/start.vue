<template>
  <div class="learn-theme relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070d1a] px-4 py-16 text-white">
    <RadarBackdrop />

    <div class="relative w-full max-w-3xl space-y-8">
      <div class="space-y-3 text-center">
        <span
          class="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80"
        >Choose your mode</span>
        <h1 class="text-3xl font-semibold leading-tight sm:text-4xl">How do you want to start?</h1>
        <p v-if="isFirstTime" class="mx-auto max-w-xl text-base text-white/80">
          New here? We'd recommend starting with the Classroom before jumping into the Live ATC alpha.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          class="mode-card mode-card--cyan"
          @click="goToClassroom"
        >
          <svg
            class="mode-card__art text-cyan-200/[0.1]"
            viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          >
            <path d="M50 8 L86 30 V70 L50 92 L14 70 V30 Z" stroke="currentColor" stroke-width="2.5" />
            <path d="M50 20 L50 92 M14 45 L86 45" stroke="currentColor" stroke-width="1.5" />
            <circle cx="50" cy="32" r="9" fill="currentColor" />
          </svg>

          <div class="mode-card__head">
            <div class="mode-card__icon border-cyan-300/40 bg-cyan-400/15">
              <v-icon icon="mdi-school-outline" size="20" class="text-cyan-200" />
            </div>
            <span class="mode-card__tag text-cyan-200/70">Recommended</span>
          </div>

          <div class="flex-1">
            <p class="mode-card__title">Classroom</p>
            <p class="mode-card__desc">
              Structured, self-paced radio practice. No simulator needed — this is where most pilots start.
            </p>
          </div>

          <div class="mode-card__foot">
            <span class="mode-card__gear">
              <v-icon icon="mdi-headphones" size="15" /> Headphones only
            </span>
            <v-icon icon="mdi-arrow-right" size="20" class="mode-card__go text-cyan-200" />
          </div>
        </button>

        <NuxtLink
          v-if="liveAtcUnlocked"
          to="/bridge"
          class="mode-card mode-card--amber"
        >
          <svg
            class="mode-card__art text-amber-200/[0.1]"
            viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          >
            <circle cx="50" cy="50" r="14" stroke="currentColor" stroke-width="2.5" />
            <circle cx="50" cy="50" r="30" stroke="currentColor" stroke-width="1.5" />
            <circle cx="50" cy="50" r="46" stroke="currentColor" stroke-width="1.5" />
            <path d="M50 50 L82 26" stroke="currentColor" stroke-width="2" />
            <circle cx="82" cy="26" r="4" fill="currentColor" />
          </svg>

          <div class="mode-card__head">
            <div class="mode-card__icon border-amber-300/40 bg-amber-400/15">
              <v-icon icon="mdi-radar" size="20" class="text-amber-200" />
            </div>
            <span class="mode-card__tag text-amber-200/70">Alpha</span>
          </div>

          <div class="flex-1">
            <p class="mode-card__title">Live ATC</p>
            <p class="mode-card__desc">
              Fly your simulator against our live AI controller. Rough around the edges — your bug reports shape
              where it goes next.
            </p>
          </div>

          <div class="mode-card__foot">
            <span class="mode-card__gear">
              <v-icon icon="mdi-headphones" size="15" /> Headphones + mic
            </span>
            <v-icon icon="mdi-arrow-right" size="20" class="mode-card__go text-amber-200" />
          </div>
        </NuxtLink>

        <div
          v-else
          class="mode-card mode-card--locked"
          aria-disabled="true"
        >
          <svg
            class="mode-card__art text-white/[0.06]"
            viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          >
            <circle cx="50" cy="50" r="14" stroke="currentColor" stroke-width="2.5" />
            <circle cx="50" cy="50" r="30" stroke="currentColor" stroke-width="1.5" />
            <circle cx="50" cy="50" r="46" stroke="currentColor" stroke-width="1.5" />
            <path d="M50 50 L82 26" stroke="currentColor" stroke-width="2" />
            <circle cx="82" cy="26" r="4" fill="currentColor" />
          </svg>

          <div class="mode-card__head">
            <div class="mode-card__icon border-white/15 bg-white/10">
              <v-icon icon="mdi-radar" size="20" class="text-white/50" />
            </div>
            <span class="mode-card__tag text-white/40">Alpha</span>
          </div>

          <div class="flex-1">
            <p class="mode-card__title">Live ATC</p>
            <p class="mode-card__desc">
              Fly your simulator against our live AI controller. Rough around the edges — your bug reports shape
              where it goes next.
            </p>
          </div>

          <div class="mode-card__foot">
            <span class="mode-card__gear">
              <v-icon icon="mdi-lock-outline" size="15" /> Unlocks {{ unlockEstimate }} after signup
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useHead, useRoute, useRouter } from '#imports'
import { CLASSROOM_INTRO_STORAGE_KEY } from '~~/shared/constants/storage'

definePageMeta({ middleware: 'require-auth' })

useHead({ title: 'Choose your mode • OpenSquawk' })

const route = useRoute()
const router = useRouter()

const isFirstTime = computed(() => route.query.firstTime === '1')

// Both modes are unlocked immediately on signup.
const liveAtcUnlocked = computed(() => true)
const unlockEstimate = computed(() => '')

function goToClassroom() {
  const introCompleted = typeof window !== 'undefined' && localStorage.getItem(CLASSROOM_INTRO_STORAGE_KEY) === 'true'
  router.push(introCompleted ? '/classroom' : '/classroom-introduction')
}
</script>

<style scoped>
.mode-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 1.5rem;
  text-align: left;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.mode-card:not(.mode-card--locked) {
  cursor: pointer;
}

.mode-card:not(.mode-card--locked):hover {
  transform: translateY(-2px);
}

.mode-card--cyan {
  border-color: rgba(103, 232, 249, 0.35);
  background: rgba(34, 211, 238, 0.07);
}

.mode-card--cyan:hover {
  border-color: rgba(103, 232, 249, 0.6);
  background: rgba(34, 211, 238, 0.11);
}

.mode-card--amber {
  border-color: rgba(251, 191, 36, 0.28);
  background: rgba(251, 191, 36, 0.05);
}

.mode-card--amber:hover {
  border-color: rgba(251, 191, 36, 0.5);
  background: rgba(251, 191, 36, 0.09);
}

.mode-card--locked {
  opacity: 0.55;
}

.mode-card__art {
  pointer-events: none;
  position: absolute;
  right: -1.5rem;
  bottom: -2rem;
  height: 9rem;
  width: 9rem;
}

.mode-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mode-card__icon {
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  border-width: 1px;
}

.mode-card__tag {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.22em;
}

.mode-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
}

.mode-card__desc {
  margin-top: 0.4rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.65);
}

.mode-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.mode-card__gear {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.mode-card__go {
  transition: transform 0.2s ease;
}

.mode-card:hover .mode-card__go {
  transform: translateX(3px);
}
</style>
