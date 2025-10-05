<template>
  <div class="relative min-h-screen bg-[#050914] text-white">
    <img
        src="/img/landing/groundpath.jpeg"
        alt="Path through a forest"
        class="absolute inset-0 -z-20 h-full w-full object-cover object-center brightness-[0.55]"
    />
    <div class="absolute inset-0 -z-10 bg-[#050914]/85 backdrop-blur"/>
    <div
        class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(22,187,215,0.12),transparent_60%)]"/>
    <div
        class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(123,77,255,0.12),transparent_70%)]"/>

    <main class="relative z-10 pb-16 lg:pb-24">
      <header class="container-outer flex flex-col items-center gap-5 py-20 text-center sm:gap-6 sm:py-24 lg:py-28">
        <span
            class="chip inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/80"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" aria-hidden="true"/>
          Feedback loop
        </span>
        <h1 class="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">
          Shape the next OpenSquawk releases with your field notes
        </h1>
        <p class="max-w-2xl text-base text-white/75 sm:text-lg">
          Share what already feels like real-world ATC and where we should smooth the edges next. Every response goes
          straight to the crew building Bridge, Classroom and Live ATC.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
          <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <v-icon icon="mdi-bell-ring" size="18" class="text-cyan-300"/>
            Candid notes welcome — thank you!
          </span>
          <a class="inline-flex items-center gap-2 text-cyan-200 transition hover:text-cyan-100" href="mailto:info@opensquawk.de">
            <v-icon icon="mdi-email-fast" size="18"/>
            Prefer email? info@opensquawk.de
          </a>
        </div>
      </header>

      <section class="container mx-auto">
        <div class="">


          <form
              class="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(5,10,35,0.45)] backdrop-blur"
              @submit.prevent="handleSubmit" novalidate>
            <div class="grid gap-4 md:grid-cols-3">
              <div class="space-y-2 md:col-span-1">
                <label for="name" class="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Name (optional)</label>
                <input
                    id="name"
                    v-model.trim="form.name"
                    type="text"
                    placeholder="How should we address you?"
                    class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-400 focus:outline-none focus-visible:ring-0"
                />
              </div>
              <div class="space-y-2 md:col-span-1">
                <label for="email" class="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Email (optional)</label>
                <input
                    id="email"
                    v-model.trim="form.email"
                    type="email"
                    placeholder="Where we can reach you"
                    class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-400 focus:outline-none focus-visible:ring-0"
                />
              </div>
              <div class="space-y-2 md:col-span-1">
                <label for="discord" class="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Discord (optional)</label>
                <input
                    id="discord"
                    v-model.trim="form.discordHandle"
                    type="text"
                    placeholder="Discord handle if you want to chat"
                    class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-400 focus:outline-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div class="space-y-4">
              <p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Overall excitement</p>
              <p class="text-sm text-white/65">How hyped are you about OpenSquawk right now?</p>
              <div class="flex flex-wrap gap-3">
                <label
                    v-for="score in ratingScale"
                    :key="score"
                    class="group flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition"
                    :class="form.excitement === score
                      ? 'border-cyan-400 bg-cyan-400/10 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-cyan-300/60 hover:text-white'"
                >
                  <input
                      class="sr-only"
                      type="radio"
                      name="excitement"
                      :value="score"
                      v-model.number="form.excitement"
                  />
                  <span
                      class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-base transition group-hover:border-cyan-300/60"
                      :class="form.excitement === score ? 'border-cyan-400 bg-cyan-400/20 text-white' : 'text-white/70'"
                  >
                    {{ score }}
                  </span>
                  <span class="hidden text-xs uppercase tracking-[0.3em] text-white/50 sm:inline">
                    {{ score === 5 ? 'Stellar' : `Level ${score}` }}
                  </span>
                </label>
              </div>
            </div>

            <div class="grid gap-8 lg:grid-cols-2">
              <fieldset class="space-y-4">
                <legend class="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">What works well</legend>
                <p class="text-sm text-white/65">Tick the areas already sparking joy and add a quick note.</p>
                <div class="grid gap-3">
                  <label
                      v-for="option in highlightOptions"
                      :key="option"
                      class="group flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition"
                      :class="form.highlightSelections.includes(option)
                        ? 'border-emerald-400/70 bg-emerald-400/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-emerald-300/60 hover:text-white'"
                  >
                    <input
                        type="checkbox"
                        class="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-emerald-400 focus:ring-emerald-300"
                        :value="option"
                        v-model="form.highlightSelections"
                    />
                    <span>{{ option }}</span>
                  </label>
                </div>
                <textarea
                    v-model.trim="form.highlightNotes"
                    rows="4"
                    placeholder="Share the story behind the highlights"
                    class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-emerald-400 focus:outline-none focus-visible:ring-0"
                ></textarea>
              </fieldset>

              <fieldset class="space-y-4">
                <legend class="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Where it hurts</legend>
                <p class="text-sm text-white/65">Flag pain points so we can triage the sharp edges first.</p>
                <div class="grid gap-3">
                  <label
                      v-for="option in frictionOptions"
                      :key="option"
                      class="group flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition"
                      :class="form.frictionSelections.includes(option)
                        ? 'border-rose-400/70 bg-rose-400/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-rose-300/60 hover:text-white'"
                  >
                    <input
                        type="checkbox"
                        class="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-rose-400 focus:ring-rose-300"
                        :value="option"
                        v-model="form.frictionSelections"
                    />
                    <span>{{ option }}</span>
                  </label>
                </div>
                <textarea
                    v-model.trim="form.frictionNotes"
                    rows="4"
                    placeholder="Help us understand what to fix first"
                    class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-rose-400 focus:outline-none focus-visible:ring-0"
                ></textarea>
              </fieldset>
            </div>

            <div class="space-y-4">
              <label for="classroom-notes" class="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Classroom stories</label>
              <p class="text-sm text-white/65">Which drills or instructor moments stood out?</p>
              <textarea
                  id="classroom-notes"
                  v-model.trim="form.classroomNotes"
                  rows="5"
                  placeholder="What happened in the Classroom? What should we double down on?"
                  class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-400 focus:outline-none focus-visible:ring-0"
              ></textarea>
            </div>

            <div class="space-y-4">
              <label for="hosting-interest" class="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Hosting or deployment</label>
              <p class="text-sm text-white/65">Planning to self-host or need us to do it for you?</p>
              <textarea
                  id="hosting-interest"
                  v-model.trim="form.hostingInterest"
                  rows="4"
                  placeholder="Tell us about your setup, budget expectations, or blockers"
                  class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-400 focus:outline-none focus-visible:ring-0"
              ></textarea>
            </div>

            <div class="space-y-4">
              <label for="other-ideas" class="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Big ideas &amp; requests</label>
              <p class="text-sm text-white/65">Dream loud – features, integrations, workflows, anything goes.</p>
              <textarea
                  id="other-ideas"
                  v-model.trim="form.otherIdeas"
                  rows="5"
                  placeholder="Share every idea. Wild and small ones welcome."
                  class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-400 focus:outline-none focus-visible:ring-0"
              ></textarea>
            </div>

            <div class="space-y-3">
              <label class="flex items-start gap-3 text-sm text-white/75">
                <input type="checkbox" class="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-300" v-model="form.contactConsent"/>
                <span>I&rsquo;m happy for you to follow up about this feedback or invite me to roadmap sessions.</span>
              </label>
              <p class="text-xs text-white/55">Every submission lands in the inbox at <strong>info@opensquawk.de</strong>.</p>
              <button
                  type="submit"
                  :disabled="submissionState === 'submitting'"
                  class="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,0.35)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-cyan-400"
              >
                <template v-if="submissionState === 'submitting'">
                  <v-progress-circular indeterminate size="18" width="2" color="white"/>
                  <span>Sending…</span>
                </template>
                <template v-else>
                  <v-icon icon="mdi-send" size="20" class="text-white"/>
                  <span>Send feedback</span>
                </template>
              </button>
            </div>
          </form>
        </div>

        <section
            v-if="submissionState === 'success'"
            class="space-y-4 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 mt-8 text-sm text-emerald-100 shadow-[0_20px_60px_rgba(12,61,48,0.45)]"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <v-icon icon="mdi-check-decagram" size="28" class="text-emerald-200"/>
            <div class="space-y-2">
              <h2 class="text-lg font-semibold text-white">Thanks for steering the mission!</h2>
              <p>Your notes are already inbound to info@opensquawk.de. We&rsquo;ll reach out if you said it&rsquo;s okay.</p>
            </div>
          </div>
        </section>

        <section
            v-else-if="submissionState === 'error'"
            class="space-y-4 rounded-3xl border border-rose-400/40 bg-rose-400/10 p-6 text-sm text-rose-100 shadow-[0_20px_60px_rgba(83,24,41,0.45)]"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <v-icon icon="mdi-alert" size="26" class="text-rose-200"/>
            <div class="space-y-2">
              <h2 class="text-lg font-semibold text-white">Something jammed on the way out</h2>
              <p>{{ submissionError || 'We couldn’t send this feedback. Please try again or email info@opensquawk.de directly.' }}</p>
            </div>
          </div>
        </section>


      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref} from 'vue'
import {useHead} from '#imports'

useHead({title: 'Feedback & ideas • OpenSquawk'})

const ratingScale = [1, 2, 3, 4, 5] as const

const highlightOptions = [
  'Classroom orientation and mission flow',
  'Lesson console and radio playback',
  'Voice quality or radio effects',
  'Guidance from the instructor (Avery)',
  'UI design and accessibility',
  'Setup or invite experience',
]

const frictionOptions = [
  'Finding the right lessons or missions',
  'Audio reliability or clarity',
  'Latency or responsiveness',
  'Understanding the scoring and feedback',
  'Installation or setup hurdles',
  'Anything else that feels broken',
]

const form = reactive({
  name: '',
  email: '',
  discordHandle: '',
  excitement: 4,
  highlightSelections: [] as string[],
  highlightNotes: '',
  frictionSelections: [] as string[],
  frictionNotes: '',
  classroomNotes: '',
  hostingInterest: '',
  otherIdeas: '',
  contactConsent: true,
})

const submissionState = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const submissionError = ref<string | null>(null)

async function handleSubmit() {
  submissionError.value = null
  submissionState.value = 'submitting'

  try {
    const response = await fetch('/api/service/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        excitement: form.excitement,
        highlightSelections: [...form.highlightSelections],
        frictionSelections: [...form.frictionSelections],
      }),
    })

    if (!response.ok) {
      let errorMessage: string | null = null

      try {
        const errorBody = await response.json()
        if (errorBody && typeof errorBody === 'object') {
          if (typeof errorBody.statusMessage === 'string') {
            errorMessage = errorBody.statusMessage
          } else if (typeof errorBody.message === 'string') {
            errorMessage = errorBody.message
          }
        }
      } catch (parseError) {
        // ignore JSON parse errors and fall back to status text
      }

      if (!errorMessage || errorMessage.length === 0) {
        errorMessage = response.statusText || 'Failed to send feedback.'
      }

      throw new Error(errorMessage)
    }

    submissionState.value = 'success'

    form.highlightSelections = []
    form.frictionSelections = []
    form.highlightNotes = ''
    form.frictionNotes = ''
    form.classroomNotes = ''
    form.hostingInterest = ''
    form.otherIdeas = ''
    form.discordHandle = ''
  } catch (error: unknown) {
    submissionState.value = 'error'
    if (error instanceof Error) {
      submissionError.value = error.message
    } else if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
      submissionError.value = (error as any).message
    } else {
      submissionError.value = 'Unknown error occurred.'
    }
  } finally {
    if (submissionState.value === 'submitting') {
      submissionState.value = 'idle'
    }
  }
}
</script>
