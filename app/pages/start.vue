<template>
  <div class="learn-theme flex min-h-screen items-center justify-center bg-[#070d1a] px-4 py-16 text-white">
    <div class="w-full max-w-3xl space-y-8">
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
          class="relative flex flex-col gap-3 rounded-2xl border border-cyan-300/40 bg-cyan-400/10 p-5 text-left transition hover:border-cyan-300/60 hover:bg-cyan-400/15"
          @click="goToClassroom"
        >
          <span
            class="absolute right-4 top-4 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200"
          >Default</span>
          <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-400/15">
            <v-icon icon="mdi-school-outline" size="20" class="text-cyan-200" />
          </div>
          <div>
            <p class="text-base font-semibold text-white">Classroom</p>
            <p class="mt-1 text-sm text-white/70">
              Structured, self-paced radio practice. No simulator required — this is where most pilots start.
            </p>
          </div>
          <span class="btn primary mt-1 self-start">
            Start Classroom
            <v-icon icon="mdi-arrow-right" size="16" class="text-[#061318]" />
          </span>
        </button>

        <NuxtLink
          v-if="liveAtcUnlocked"
          to="/pm"
          class="relative flex flex-col gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-5 transition hover:border-amber-400/50 hover:bg-amber-400/10"
        >
          <span
            class="absolute right-4 top-4 rounded-full border border-amber-300/40 bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200"
          >Alpha</span>
          <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-400/15">
            <v-icon icon="mdi-radar" size="20" class="text-amber-200" />
          </div>
          <div>
            <p class="text-base font-semibold text-white">Live ATC</p>
            <p class="mt-1 text-sm text-white/70">
              Connect your simulator and fly against our live AI controller. Early alpha — not everything works
              reliably yet. We'd love your bug reports; this is also how we figure out where to take it next.
            </p>
          </div>
          <span class="btn soft mt-1 self-start">
            Try Live ATC (Alpha)
            <v-icon icon="mdi-arrow-right" size="16" class="text-amber-100" />
          </span>
        </NuxtLink>
        <div
          v-else
          class="relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 opacity-60"
          aria-disabled="true"
        >
          <span
            class="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60"
          >Alpha</span>
          <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
            <v-icon icon="mdi-radar" size="20" class="text-white/50" />
          </div>
          <div>
            <p class="text-base font-semibold text-white">Live ATC</p>
            <p class="mt-1 text-sm text-white/70">
              Connect your simulator and fly against our live AI controller. Early alpha — not everything works
              reliably yet. We'd love your bug reports; this is also how we figure out where to take it next.
            </p>
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
import { useAuthStore } from '~/stores/auth'
import { CLASSROOM_INTRO_STORAGE_KEY } from '~~/shared/constants/storage'

definePageMeta({ middleware: 'require-auth' })

useHead({ title: 'Choose your mode • OpenSquawk' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const LIVE_ATC_UNLOCK_AFTER_MS = 24 * 60 * 60 * 1000

const isFirstTime = computed(() => route.query.firstTime === '1')

const liveAtcUnlocked = computed(() => {
  const createdAt = auth.user?.createdAt
  if (!createdAt) return true
  const createdAtMs = new Date(createdAt).getTime()
  if (Number.isNaN(createdAtMs)) return true
  return Date.now() - createdAtMs >= LIVE_ATC_UNLOCK_AFTER_MS
})

const unlockEstimate = computed(() => {
  const createdAt = auth.user?.createdAt
  if (!createdAt) return ''
  const createdAtMs = new Date(createdAt).getTime()
  if (Number.isNaN(createdAtMs)) return ''
  const remainingMs = LIVE_ATC_UNLOCK_AFTER_MS - (Date.now() - createdAtMs)
  const remainingHours = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)))
  return `in ~${remainingHours}h`
})

function goToClassroom() {
  const introCompleted = typeof window !== 'undefined' && localStorage.getItem(CLASSROOM_INTRO_STORAGE_KEY) === 'true'
  router.push(introCompleted ? '/classroom' : '/classroom-introduction')
}
</script>
