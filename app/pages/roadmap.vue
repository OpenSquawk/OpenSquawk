<template>
  <div class="min-h-screen bg-[#0b1020] text-white">
    <section class="page-hero roadmap-page-hero relative overflow-hidden border-b border-white/10">
      <NuxtImg
        src="/img/learn/missions/full-flight/briefing-route.png"
        alt="Flight route briefing board"
        class="page-hero-image"
        format="webp"
      />
      <div class="page-hero-overlay"></div>
      <div class="page-hero-content container-outer">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/70 hover:text-cyan-300">
              <v-icon icon="mdi-arrow-left" size="18" />
              Back to landing page
            </NuxtLink>
            <h1 class="mt-4 text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">Roadmap & community voting</h1>
            <p class="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
              Landing stays focused on conversion. Product priorities, voting and feature ideas live here.
            </p>
            <div class="mt-5 inline-flex items-center gap-3 rounded-full border border-white/15 bg-[#0b1020]/55 px-4 py-2 text-sm text-white/80">
              <v-icon icon="mdi-account-group" size="18" class="text-cyan-300" />
              <span>{{ roadmapStatsLabel }}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <NuxtLink to="/news" class="btn btn-ghost">News</NuxtLink>
            <NuxtLink to="/feedback" class="btn btn-primary">Send feedback</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <main class="container-outer roadmap-main -mt-8 space-y-8 pb-16 pt-10 md:-mt-10 md:pb-20 md:pt-12">
      <section class="card roadmap-hero" data-aos="fade-up">
        <div class="space-y-4">
          <h2 class="text-2xl font-semibold md:text-3xl">How to vote</h2>
          <p class="max-w-3xl text-white/70">
            Rate each topic from 1 to 5 and submit in one go. We use these votes to prioritize near-term feature work.
          </p>
          <div class="grid gap-3 text-sm text-white/80 sm:grid-cols-3">
            <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">1. Choose priority per topic</div>
            <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">2. Submit your selection</div>
            <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">3. Track updates on News</div>
          </div>
        </div>
      </section>

      <section>
        <div v-if="roadmapLoading" class="card text-white/70" data-aos="fade-up">
          Loading current roadmap priorities…
        </div>

        <template v-else>
          <div class="grid gap-5 md:gap-6 xl:grid-cols-2">
            <article
              v-for="item in roadmapItems"
              :key="item.key"
              class="card roadmap-item flex flex-col gap-4"
              data-aos="fade-up"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2">
                  <span class="chip text-[10px] uppercase tracking-[0.24em]">{{ item.category }}</span>
                  <h3 class="flex items-center gap-2 text-xl font-semibold leading-tight">
                    <v-icon v-if="item.icon" :icon="item.icon" size="22" class="text-cyan-300 shrink-0" />
                    <span>{{ item.title }}</span>
                  </h3>
                </div>
                <div class="score-pill">
                  <template v-if="item.averageImportance !== null">
                    {{ formatAverage(item.averageImportance) }}/5
                  </template>
                  <template v-else>—</template>
                </div>
              </div>

              <p class="text-sm text-white/70">{{ item.description }}</p>

              <div class="flex flex-wrap items-center gap-2 text-xs text-white/65">
                <span class="meta-pill">{{ formatNumber(item.votes) }} votes</span>
                <span v-if="item.lastVoteAt" class="meta-pill">last vote {{ formatRelativeFromNow(item.lastVoteAt) }}</span>
                <span v-else class="meta-pill">no votes yet</span>
              </div>

              <div class="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div class="h-2 rounded-full bg-cyan-400 transition-all" :style="{ width: `${item.scorePercent}%` }" />
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/50">
                  <span>Your priority</span>
                  <span v-if="roadmapTouched[item.key]" class="text-cyan-300">marked</span>
                </div>
                <div class="roadmap-scale" role="group" :aria-label="`Priority for ${item.title}`">
                  <button
                    v-for="value in ROADMAP_SCALE"
                    :key="value"
                    type="button"
                    class="roadmap-pill"
                    :class="{ 'is-active': roadmapSelections[item.key] === value }"
                    :aria-pressed="roadmapSelections[item.key] === value"
                    @click="selectRoadmapImportance(item.key, value)"
                  >
                    <span class="text-sm font-semibold">{{ value }}</span>
                  </button>
                </div>
                <div class="text-sm text-white/80">{{ roadmapImportanceLabel(roadmapSelections[item.key]) }}</div>
              </div>
            </article>
          </div>

          <div
            class="card mt-6 flex flex-col gap-4 border-white/10 bg-white/5 md:flex-row md:items-center md:justify-between"
            data-aos="fade-up"
          >
            <div class="space-y-2">
              <h4 class="text-lg font-semibold">Save your selection</h4>
              <p class="text-sm text-white/70">
                Adjust one or multiple cards and submit everything together.
              </p>
            </div>
            <div class="flex w-full flex-col gap-2 md:w-auto">
              <button
                type="button"
                class="btn btn-primary w-full md:w-auto"
                @click="submitRoadmapVotes"
                :disabled="!hasRoadmapVote || roadmapSubmitting"
              >
                <span v-if="roadmapSubmitting" class="flex items-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="white" />
                  Saving votes…
                </span>
                <span v-else>Submit votes</span>
              </button>
              <p v-if="roadmapSuccess" class="text-center text-sm text-green-300 md:text-left">
                Thanks! Your votes have been recorded.
              </p>
              <p v-else-if="roadmapError" class="text-center text-sm text-red-300 md:text-left">{{ roadmapError }}</p>
              <p v-else class="text-center text-xs text-white/50 md:text-left">
                Tip: vote only on topics where you have concrete usage feedback.
              </p>
            </div>
          </div>
        </template>
      </section>

      <section class="space-y-6">
        <article class="card space-y-4" data-aos="fade-up">
          <div class="space-y-2">
            <h4 class="text-lg font-semibold">Missing something on the roadmap?</h4>
            <p class="text-sm text-white/70">
              Share the feature you are missing or a problem we should solve next.
            </p>
          </div>
          <form class="space-y-3" @submit.prevent="submitRoadmapSuggestion">
            <input
              v-model.trim="roadmapSuggestionForm.title"
              type="text"
              required
              placeholder="Short title – e.g. ATIS integration for EDDF"
              class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
              aria-label="Title for roadmap suggestion"
            />
            <textarea
              v-model.trim="roadmapSuggestionForm.details"
              rows="4"
              required
              placeholder="Describe why this matters or how it would help you."
              class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
            />
            <div class="grid gap-3 sm:grid-cols-2">
              <input
                v-model.trim="roadmapSuggestionForm.email"
                type="email"
                placeholder="Email (optional)"
                class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <label class="flex items-start gap-3 text-xs text-white/60">
                <input
                  type="checkbox"
                  v-model="roadmapSuggestionForm.allowContact"
                  class="mt-1"
                  :disabled="!roadmapSuggestionForm.email"
                />
                <span>Feel free to follow up by email if questions pop up.</span>
              </label>
            </div>
            <label class="flex items-start gap-3 text-xs text-white/60">
              <input type="checkbox" v-model="roadmapSuggestionForm.consentPrivacy" class="mt-1" required />
              <span>
                I have read the
                <NuxtLink to="/datenschutz" class="text-cyan-300 underline">privacy policy</NuxtLink>
                and consent to processing this suggestion.
              </span>
            </label>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                class="btn btn-primary w-full sm:w-auto"
                :disabled="!roadmapSuggestionFormValid || roadmapSuggestionSubmitting"
              >
                <span v-if="roadmapSuggestionSubmitting" class="flex items-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="white" />
                  Sending suggestion…
                </span>
                <span v-else>Send suggestion</span>
              </button>
              <p v-if="roadmapSuggestionSuccess" class="text-sm text-green-300">
                Thanks! We will review your suggestion.
              </p>
              <p v-else-if="roadmapSuggestionError" class="text-sm text-red-300">{{ roadmapSuggestionError }}</p>
            </div>
          </form>
        </article>

        <article class="card" data-aos="fade-up" data-aos-delay="120">
          <h4 class="text-lg font-semibold">Looking for broader context?</h4>
          <p class="mt-3 text-sm text-white/70">
            Product updates, release notes and implementation notes are published on the news page.
          </p>
          <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <NuxtLink to="/news" class="btn btn-ghost">Open News</NuxtLink>
            <NuxtLink to="/feedback" class="btn btn-ghost">Send Feedback</NuxtLink>
            <NuxtLink to="/" class="btn btn-primary">Back to Landing</NuxtLink>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useHead } from '#imports'
import { useApi } from '~/composables/useApi'

const api = useApi()

interface RoadmapItemWithStats {
  key: string
  title: string
  description: string
  category: string
  icon: string
  votes: number
  averageImportance: number | null
  scorePercent: number
  lastVoteAt: string | null
}

interface RoadmapResponse {
  items: RoadmapItemWithStats[]
  totalVotes: number
  recentVotes7Days: number
}

const numberFormatter = computed(() => new Intl.NumberFormat('en-US'))
const formatNumber = (value: number | null | undefined) => numberFormatter.value.format(Math.max(0, Math.round(value ?? 0)))
const formatAverage = (value: number) => value.toFixed(1)

const ROADMAP_SCALE = [1, 2, 3, 4, 5] as const

const roadmapItems = ref<RoadmapItemWithStats[]>([])
const roadmapLoading = ref(false)
const roadmapTotals = ref(0)
const roadmapRecent7Days = ref(0)
const roadmapSelections = reactive<Record<string, number>>({})
const roadmapTouched = reactive<Record<string, boolean>>({})
const roadmapSubmitting = ref(false)
const roadmapSuccess = ref(false)
const roadmapError = ref('')

const hasRoadmapVote = computed(() => Object.values(roadmapTouched).some(Boolean))
const roadmapStatsLabel = computed(() => {
  const total = formatNumber(roadmapTotals.value)
  const recent = formatNumber(roadmapRecent7Days.value)
  return `${total} votes submitted · ${recent} in the last 7 days`
})

const roadmapImportanceLabel = (value?: number) => {
  const labels: Record<number, string> = {
    1: 'Nice to have, not urgent',
    2: 'Can wait',
    3: 'Important for me',
    4: 'Very important',
    5: 'Top priority',
  }
  return labels[value ?? 0] || 'Not rated yet'
}

const selectRoadmapImportance = (key: string, value: number) => {
  if (!ROADMAP_SCALE.includes(value as (typeof ROADMAP_SCALE)[number])) return
  roadmapSelections[key] = value
  roadmapTouched[key] = true
  roadmapSuccess.value = false
}

const formatRelativeFromNow = (iso?: string | null) => {
  if (!iso) return '–'
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return '–'

  const diff = Date.now() - target.getTime()
  const minute = 1000 * 60
  const hour = minute * 60
  const day = hour * 24

  if (diff < minute) return 'just now'
  if (diff < hour) {
    const mins = Math.round(diff / minute)
    return `${mins} min${mins === 1 ? '' : 's'} ago`
  }
  if (diff < day) {
    const hours = Math.round(diff / hour)
    return `${hours} hr${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.round(diff / day)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

async function loadRoadmap() {
  try {
    roadmapLoading.value = true
    const data = (await api.get('/api/service/roadmap', { auth: false })) as RoadmapResponse
    roadmapItems.value = data.items ?? []
    roadmapTotals.value = data.totalVotes ?? 0
    roadmapRecent7Days.value = data.recentVotes7Days ?? 0

    const activeKeys = new Set<string>()
    for (const item of roadmapItems.value) {
      activeKeys.add(item.key)
      if (typeof roadmapSelections[item.key] !== 'number') {
        roadmapSelections[item.key] = 3
      }
      if (roadmapTouched[item.key] === undefined) {
        roadmapTouched[item.key] = false
      }
    }

    for (const key of Object.keys(roadmapSelections)) {
      if (!activeKeys.has(key)) {
        delete roadmapSelections[key]
        delete roadmapTouched[key]
      }
    }
  } catch (err) {
    console.warn('Roadmap stats unavailable', err)
  } finally {
    roadmapLoading.value = false
  }
}

async function submitRoadmapVotes() {
  if (!hasRoadmapVote.value || roadmapSubmitting.value) return

  const votes = Object.entries(roadmapSelections)
    .filter(([key]) => roadmapTouched[key])
    .map(([key, importance]) => ({ key, importance }))

  if (!votes.length) return

  roadmapSubmitting.value = true
  roadmapError.value = ''
  roadmapSuccess.value = false

  try {
    await api.post('/api/service/roadmap', { votes }, { auth: false })
    roadmapSuccess.value = true
    Object.keys(roadmapTouched).forEach((key) => {
      roadmapTouched[key] = false
    })
    await loadRoadmap()
  } catch (err: any) {
    const fallback = 'Could not submit votes'
    const message = err?.data?.statusMessage || err?.message || fallback
    roadmapError.value = message
  } finally {
    roadmapSubmitting.value = false
  }
}

const roadmapSuggestionForm = reactive({
  title: '',
  details: '',
  email: '',
  allowContact: false,
  consentPrivacy: false,
})
const roadmapSuggestionSubmitting = ref(false)
const roadmapSuggestionSuccess = ref(false)
const roadmapSuggestionError = ref('')

const roadmapSuggestionFormValid = computed(() => {
  const title = roadmapSuggestionForm.title.trim()
  const details = roadmapSuggestionForm.details.trim()
  const email = roadmapSuggestionForm.email.trim()
  const wantsContact = roadmapSuggestionForm.allowContact

  return title.length >= 4 && details.length >= 20 && roadmapSuggestionForm.consentPrivacy && (!wantsContact || email.length > 0)
})

watch(
  () => roadmapSuggestionForm.email,
  (value) => {
    if (!value) {
      roadmapSuggestionForm.allowContact = false
    }
  },
)

async function submitRoadmapSuggestion() {
  if (!roadmapSuggestionFormValid.value || roadmapSuggestionSubmitting.value) return

  roadmapSuggestionSubmitting.value = true
  roadmapSuggestionError.value = ''
  roadmapSuggestionSuccess.value = false

  try {
    await api.post(
      '/api/service/roadmap-suggestions',
      {
        title: roadmapSuggestionForm.title,
        details: roadmapSuggestionForm.details,
        email: roadmapSuggestionForm.email || undefined,
        allowContact: roadmapSuggestionForm.allowContact,
        consentPrivacy: roadmapSuggestionForm.consentPrivacy,
      },
      { auth: false },
    )

    roadmapSuggestionSuccess.value = true
    roadmapSuggestionForm.title = ''
    roadmapSuggestionForm.details = ''
    roadmapSuggestionForm.email = ''
    roadmapSuggestionForm.allowContact = false
    roadmapSuggestionForm.consentPrivacy = false
  } catch (err: any) {
    const fallback = 'Could not save suggestion'
    const message = err?.data?.statusMessage || err?.message || fallback
    roadmapSuggestionError.value = message
  } finally {
    roadmapSuggestionSubmitting.value = false
  }
}

const initAosIfNeeded = async () => {
  if (!import.meta.client) return
  // @ts-ignore optional runtime global from module
  if ('AOS' in window) return
  const [{ default: AOS }] = await Promise.all([import('aos'), import('aos/dist/aos.css')])
  AOS.init({ once: true, duration: 600, easing: 'ease-out' })
}

onMounted(async () => {
  await Promise.all([loadRoadmap(), initAosIfNeeded()])
})

useHead({
  title: 'Roadmap & Community Voting – OpenSquawk',
  meta: [
    {
      name: 'description',
      content: 'Vote on OpenSquawk roadmap priorities and submit feature suggestions for upcoming releases.',
    },
    { name: 'robots', content: 'index,follow' },
    { property: 'og:title', content: 'Roadmap & Community Voting – OpenSquawk' },
    {
      property: 'og:description',
      content: 'Community voting and feature suggestions for OpenSquawk product priorities.',
    },
  ],
})
</script>

<style scoped>
.container-outer {
  @apply mx-auto max-w-screen-xl px-4 sm:px-6 md:px-8;
}

.page-hero {
  min-height: clamp(420px, 62vh, 660px);
  position: relative;
  background: #0a0f1c;
}

.roadmap-page-hero .page-hero-image {
  object-position: center 42%;
}

.page-hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 12, 24, 0.22) 5%, rgba(7, 12, 24, 0.48) 52%, rgba(7, 12, 24, 0.92) 100%),
    radial-gradient(100% 90% at 50% 100%, rgba(34, 211, 238, 0.16), rgba(34, 211, 238, 0));
}

.page-hero-content {
  position: relative;
  z-index: 2;
  min-height: inherit;
  display: flex;
  align-items: flex-end;
  padding-top: 4rem;
  padding-bottom: 3rem;
}

.roadmap-main {
  max-width: 1120px;
}

.card {
  @apply rounded-2xl p-5 md:p-6;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 20px 46px rgba(7, 14, 31, 0.28);
}

.roadmap-hero {
  border-color: rgba(34, 211, 238, 0.24);
  box-shadow: 0 22px 70px rgba(8, 19, 43, 0.34);
}

.roadmap-item {
  border-color: rgba(255, 255, 255, 0.12);
}

.score-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4rem;
  border-radius: 9999px;
  border: 1px solid rgba(34, 211, 238, 0.34);
  background: rgba(34, 211, 238, 0.14);
  color: rgba(232, 249, 255, 0.95);
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.65rem;
}

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-medium transition;
}

.btn-primary {
  @apply bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,.25)];
}

.btn-ghost {
  @apply bg-white/5 text-white hover:bg-white/10;
}

.chip {
  @apply inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 text-white px-3 py-1 text-xs;
}

.roadmap-scale {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 0.5rem;
  padding-bottom: 0.15rem;
}

.roadmap-pill {
  flex: 1 0 48px;
  min-width: 48px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.875rem;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.roadmap-pill:hover {
  background: rgba(34, 211, 238, 0.18);
  border-color: rgba(34, 211, 238, 0.4);
  color: #fff;
}

.roadmap-pill.is-active {
  background: rgba(34, 211, 238, 0.28);
  border-color: rgba(34, 211, 238, 0.65);
  color: #fff;
  box-shadow: 0 0 24px rgba(34, 211, 238, 0.25);
}

@media (max-width: 480px) {
  .roadmap-pill {
    min-width: 44px;
    height: 42px;
  }
}
</style>
