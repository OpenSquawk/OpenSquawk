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
          class="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-cyan-300/40 bg-cyan-400/10 p-5 text-left transition hover:border-cyan-300/60 hover:bg-cyan-400/15"
          @click="goToClassroom"
        >
          <svg
            class="pointer-events-none absolute -right-6 -bottom-8 h-36 w-36 text-cyan-200/[0.12]"
            viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          >
            <path d="M50 8 L86 30 V70 L50 92 L14 70 V30 Z" stroke="currentColor" stroke-width="2.5" />
            <path d="M50 20 L50 92 M14 45 L86 45" stroke="currentColor" stroke-width="1.5" />
            <circle cx="50" cy="32" r="9" fill="currentColor" />
          </svg>
          <span
            class="absolute right-4 top-4 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200"
          >Default</span>
          <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-400/15">
            <v-icon icon="mdi-school-outline" size="20" class="text-cyan-200" />
          </div>
          <div class="flex-1">
            <p class="text-base font-semibold text-white">1. Classroom</p>
            <p class="mt-1 text-sm text-white/70">
              Structured, self-paced radio practice. No simulator required — this is where most pilots start.
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span class="equip-chip equip-on">
                <v-icon icon="mdi-headphones" size="14" />
                Headphones
              </span>
              <span class="equip-chip equip-off">
                <v-icon icon="mdi-microphone-off" size="14" />
                No mic needed
              </span>
            </div>
          </div>
          <span class="btn primary mt-1 self-start">
            Start Classroom
            <v-icon icon="mdi-arrow-right" size="16" class="text-[#061318]" />
          </span>
        </button>

        <NuxtLink
          v-if="liveAtcUnlocked"
          to="/live-atc"
          class="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-5 transition hover:border-amber-400/50 hover:bg-amber-400/10"
        >
          <svg
            class="pointer-events-none absolute -right-6 -bottom-8 h-36 w-36 text-amber-200/[0.12]"
            viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          >
            <circle cx="50" cy="50" r="14" stroke="currentColor" stroke-width="2.5" />
            <circle cx="50" cy="50" r="30" stroke="currentColor" stroke-width="1.5" />
            <circle cx="50" cy="50" r="46" stroke="currentColor" stroke-width="1.5" />
            <path d="M50 50 L82 26" stroke="currentColor" stroke-width="2" />
            <circle cx="82" cy="26" r="4" fill="currentColor" />
          </svg>
          <span
            class="absolute right-4 top-4 rounded-full border border-amber-300/40 bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200"
          >Alpha</span>
          <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-400/15">
            <v-icon icon="mdi-radar" size="20" class="text-amber-200" />
          </div>
          <div class="flex-1">
            <p class="text-base font-semibold text-white">2. Live ATC</p>
            <p class="mt-1 text-sm text-white/70">
              Connect your simulator and fly against our live AI controller. Early alpha — not everything works
              reliably yet. We'd love your bug reports; this is also how we figure out where to take it next.
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span class="equip-chip equip-on equip-amber">
                <v-icon icon="mdi-headphones" size="14" />
                Headphones
              </span>
              <span class="equip-chip equip-on equip-amber">
                <v-icon icon="mdi-microphone" size="14" />
                Microphone
              </span>
            </div>
          </div>
          <span class="btn soft mt-1 self-start">
            Try Live ATC (Alpha)
            <v-icon icon="mdi-arrow-right" size="16" class="text-amber-100" />
          </span>
        </NuxtLink>
        <div
          v-else
          class="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 opacity-60"
          aria-disabled="true"
        >
          <svg
            class="pointer-events-none absolute -right-6 -bottom-8 h-36 w-36 text-white/[0.08]"
            viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          >
            <circle cx="50" cy="50" r="14" stroke="currentColor" stroke-width="2.5" />
            <circle cx="50" cy="50" r="30" stroke="currentColor" stroke-width="1.5" />
            <circle cx="50" cy="50" r="46" stroke="currentColor" stroke-width="1.5" />
            <path d="M50 50 L82 26" stroke="currentColor" stroke-width="2" />
            <circle cx="82" cy="26" r="4" fill="currentColor" />
          </svg>
          <span
            class="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60"
          >Alpha</span>
          <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
            <v-icon icon="mdi-radar" size="20" class="text-white/50" />
          </div>
          <div class="flex-1">
            <p class="text-base font-semibold text-white">2. Live ATC</p>
            <p class="mt-1 text-sm text-white/70">
              Connect your simulator and fly against our live AI controller. Early alpha — not everything works
              reliably yet. We'd love your bug reports; this is also how we figure out where to take it next.
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span class="equip-chip equip-on">
                <v-icon icon="mdi-headphones" size="14" />
                Headphones
              </span>
              <span class="equip-chip equip-on">
                <v-icon icon="mdi-microphone" size="14" />
                Microphone
              </span>
            </div>
          </div>
          <p class="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">Unlocks {{ unlockEstimate }} after signup</p>
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
.equip-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  padding: 0.2rem 0.6rem;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
}

.equip-chip.equip-on {
  border-color: rgba(103, 232, 249, 0.4);
  background: rgba(34, 211, 238, 0.12);
  color: rgb(165, 243, 252);
}

.equip-chip.equip-amber {
  border-color: rgba(251, 191, 36, 0.4);
  background: rgba(251, 191, 36, 0.12);
  color: rgb(253, 230, 138);
}

.equip-chip.equip-off {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.55);
}
</style>

