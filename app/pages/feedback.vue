<template>
  <div class="min-h-screen bg-[#060b16] text-white">
    <header class="border-b border-white/5 bg-[#060b16]/80 backdrop-blur">
      <div class="mx-auto w-full max-w-screen-xl px-4 py-12 sm:px-6 md:px-8">
        <div class="space-y-6">
          <span class="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
            Feedback mission
          </span>
          <h1 class="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            Help us shape OpenSquawk with your feedback, bug reports and bold ideas
          </h1>
          <div class="space-y-4 text-base text-white/80 sm:text-lg">
            <p>
              We are a small German development team trying to launch something wonderful, free for the community and—if you want us to host it for you—as affordable as possible without losing quality. User feedback is unbelievably valuable for us, and we cannot stress this enough.
            </p>
            <p>
              Thank you for helping us test the product. We know many areas are still a work in progress, and every note you share helps us move faster. If you would like a quick call or even to co-build (no coding experience required, just motivation to support), please email us at
              <a href="mailto:info@opensquawk.de" class="font-semibold text-cyan-300 hover:text-cyan-200">info@opensquawk.de</a>
              and we will schedule a chat.
            </p>
            <p>
              We publish our documentation and tools in English first so we can welcome as many people as possible, but you can always reach the team in either English or German. Everything you write below will be packaged into an email draft to
              <a href="mailto:info@opensquawk.de" class="font-semibold text-cyan-300 hover:text-cyan-200">info@opensquawk.de</a>
              when you hit send.
            </p>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-screen-xl px-4 py-12 sm:px-6 md:px-8">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <form class="space-y-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-cyan-500/10 sm:p-10" @submit.prevent="handleSubmit">
          <fieldset class="space-y-4">
            <legend class="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">What should we focus on?</legend>
            <p class="text-sm text-white/70">Pick every area you want to talk about. You can add details for each topic below.</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <label
                v-for="topic in topicOptions"
                :key="topic.id"
                class="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm transition hover:border-cyan-400/60"
              >
                <input
                  v-model="selectedTopics"
                  type="checkbox"
                  :value="topic.id"
                  class="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-cyan-300 focus:ring-cyan-400"
                />
                <span class="text-white/80">{{ topic.label }}</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="space-y-4">
            <legend class="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Quick pulse check</legend>
            <p class="text-sm text-white/70">1 = needs lots of love · 5 = feels great already</p>
            <div class="space-y-6">
              <div
                v-for="question in ratingQuestions"
                :key="question.id"
                class="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <p class="text-sm font-semibold text-white/80">{{ question.label }}</p>
                  <span v-if="ratingResponses[question.id]" class="text-xs uppercase tracking-[0.35em] text-cyan-200/80">
                    Level {{ ratingResponses[question.id] }}
                  </span>
                </div>
                <div class="mt-4 flex flex-wrap gap-2" role="radiogroup" :aria-label="question.label">
                  <label
                    v-for="score in ratingScale"
                    :key="score"
                    class="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:border-cyan-400/60"
                  >
                    <input
                      v-model.number="ratingResponses[question.id]"
                      type="radio"
                      :name="`rating-${question.id}`"
                      :value="score"
                      class="h-4 w-4 text-cyan-400 focus:ring-cyan-300"
                    />
                    <span class="text-white/75">{{ score }}</span>
                  </label>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset class="space-y-6">
            <legend class="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Tell us more</legend>
            <div class="space-y-6">
              <div
                v-for="prompt in textPrompts"
                :key="prompt.id"
                class="space-y-3"
              >
                <label :for="`prompt-${prompt.id}`" class="block text-sm font-semibold text-white/80">
                  {{ prompt.label }}
                </label>
                <textarea
                  :id="`prompt-${prompt.id}`"
                  v-model.trim="textResponses[prompt.id]"
                  :placeholder="prompt.placeholder"
                  rows="4"
                  class="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/80 placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                ></textarea>
              </div>
            </div>
          </fieldset>

          <fieldset class="space-y-4">
            <legend class="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Stay in the loop</legend>
            <div class="space-y-3 text-sm text-white/70">
              <label for="feedback-email" class="block text-white/80">Email (optional, so we can reply)</label>
              <input
                id="feedback-email"
                v-model.trim="contactEmail"
                type="email"
                placeholder="you@example.com"
                class="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
              />
              <label class="flex cursor-pointer items-center gap-3">
                <input
                  v-model="openToCall"
                  type="checkbox"
                  class="h-4 w-4 rounded border-white/30 bg-transparent text-cyan-300 focus:ring-cyan-400"
                />
                <span>I would happily jump on a quick call to chat through ideas.</span>
              </label>
            </div>
          </fieldset>

          <div class="space-y-3">
            <button
              type="submit"
              class="w-full rounded-2xl bg-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_14px_35px_rgba(56,189,248,0.35)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Send my notes via email
            </button>
            <p class="text-xs text-white/60">
              This opens an email draft to <a href="mailto:info@opensquawk.de" class="text-cyan-300 hover:text-cyan-200">info@opensquawk.de</a> with everything you entered. Please hit send in your email app so it reaches us.
            </p>
            <p v-if="showMailHint" class="text-xs text-emerald-200/80">
              If no email window opened, copy the notes above and email them to <a href="mailto:info@opensquawk.de" class="text-cyan-300 hover:text-cyan-200">info@opensquawk.de</a>—we appreciate every bit of feedback.
            </p>
          </div>
        </form>

        <aside class="space-y-6 rounded-3xl border border-cyan-400/40 bg-cyan-400/10 p-6 text-sm text-cyan-100 shadow-xl shadow-cyan-500/20">
          <h2 class="text-lg font-semibold text-cyan-50">Why your feedback matters</h2>
          <p>
            Every message lands directly with the founding team. We review feedback in weekly build sessions, so even small comments influence what ships next. Screenshots, recordings and links are all welcome—just attach them to the email draft once it opens.
          </p>
          <div class="rounded-2xl border border-cyan-400/40 bg-[#071422]/90 p-5 text-cyan-100">
            <h3 class="text-base font-semibold">Need something else?</h3>
            <ul class="mt-3 space-y-2">
              <li>• Reach us any time at <a href="mailto:info@opensquawk.de" class="text-cyan-300 hover:text-cyan-200">info@opensquawk.de</a>.</li>
              <li>• Mention if you want hosting, integrations or to hack on code or docs.</li>
              <li>• Prefer German? No problem—write in whichever language feels best.</li>
            </ul>
          </div>
          <p>
            We are building OpenSquawk as an open, community-first platform. Sharing your experience keeps us honest and helps us make the service excellent while staying low-cost to host. Thank you again for lending us your eyes, ears and ideas.
          </p>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useHead } from '#imports'

const infoEmail = 'info@opensquawk.de'

useHead({
  title: 'Feedback, bugs & ideas • OpenSquawk',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' }
  ]
})

const topicOptions = [
  { id: 'classroom', label: 'Classroom training experience' },
  { id: 'live-atc', label: 'Live ATC & radio flow' },
  { id: 'ui', label: 'User interface & accessibility' },
  { id: 'stability', label: 'Stability, bugs or performance' },
  { id: 'pricing', label: 'Pricing, hosting or rollout plans' },
  { id: 'collab', label: 'I want to help build, translate or document' }
]

const ratingQuestions = [
  { id: 'clarity', label: 'How clear are the current lessons and mission briefs?' },
  { id: 'stability', label: 'How stable does the platform feel while you explore?' },
  { id: 'excitement', label: 'How excited are you to keep using or sharing OpenSquawk?' }
]

const ratingScale = [1, 2, 3, 4, 5]

const textPrompts = [
  { id: 'wins', label: 'What already feels great or valuable?', placeholder: 'Tell us about the moments that clicked or saved you time.' },
  { id: 'improve', label: 'What needs the most love right now?', placeholder: 'Which flows, lessons or tools feel rough or confusing?' },
  { id: 'ideas', label: 'Dream big—what would you love to see next?', placeholder: 'Integrations, AI helpers, training drills, community features…' },
  { id: 'bugs', label: 'Any bugs or blockers we should chase first?', placeholder: 'Describe what happened, which browser or simulator you used, and any steps to reproduce it.' }
]

const selectedTopics = ref<string[]>([])
const ratingResponses = reactive<Record<string, number | undefined>>({})
const textResponses = reactive<Record<string, string>>({})
const contactEmail = ref('')
const openToCall = ref(false)
const showMailHint = ref(false)

function handleSubmit() {
  if (typeof window === 'undefined') return

  const lines: string[] = []
  lines.push('OpenSquawk feedback summary:')

  if (selectedTopics.value.length) {
    const labels = selectedTopics.value
      .map((id) => topicOptions.find((topic) => topic.id === id)?.label)
      .filter(Boolean)
    if (labels.length) {
      lines.push(`Focus areas: ${labels.join(', ')}`)
    }
  }

  const ratings = ratingQuestions
    .map((question) => {
      const value = ratingResponses[question.id]
      if (!value && value !== 0) return ''
      return `${question.label}: ${value}/5`
    })
    .filter(Boolean)

  if (ratings.length) {
    lines.push('Pulse check:')
    ratings.forEach((rating) => lines.push(`- ${rating}`))
  }

  const answers = textPrompts
    .map((prompt) => {
      const response = textResponses[prompt.id]?.trim()
      if (!response) return ''
      return `${prompt.label}\n${response}`
    })
    .filter(Boolean)

  if (answers.length) {
    lines.push('Detailed notes:')
    answers.forEach((answer) => lines.push('', answer))
  }

  if (contactEmail.value) {
    lines.push('', `Reply-to email: ${contactEmail.value}`)
  }

  lines.push('', `Open to a quick call: ${openToCall.value ? 'Yes' : 'No'}`)
  lines.push('', 'Thank you for building OpenSquawk together!')

  const body = lines.join('\n')
  const params = new URLSearchParams()
  params.set('subject', 'OpenSquawk feedback & ideas')
  params.set('body', body)

  const mailto = `mailto:${infoEmail}?${params.toString()}`
  window.location.href = mailto
  showMailHint.value = true
}
</script>
