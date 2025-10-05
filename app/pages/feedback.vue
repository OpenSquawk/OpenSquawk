<template>
  <div class="relative min-h-screen overflow-hidden bg-[#0B1020] text-white">
    <img
        src="/img/landing/groundpath.jpeg"
        alt="Forest path background"
        class="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-60"
    />
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B1020]/75 via-[#0B1020]/85 to-[#0B1020]/92 backdrop-blur-2xl"/>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,187,215,0.18),transparent_55%)]"/>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(41,45,59,0.45),transparent_65%)]"/>

    <div class="relative z-10">
      <header class="container-outer py-20 sm:py-24 lg:py-28">
        <div class="max-w-3xl space-y-6">
          <span
              class="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-100"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.8)]"/>
            Feedback loop
          </span>
          <h1 class="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">Help us tune OpenSquawk.</h1>
          <p class="text-base text-white/75 sm:text-lg">
            Share how the Bridge, Classroom and radio flow feel in practice. Every note feeds straight into our next sprint.
          </p>
          <p class="text-sm text-white/60">
            Prefer talking? Drop your Discord handle below or email
            <a class="text-cyan-300 underline" href="mailto:info@opensquawk.de">info@opensquawk.de</a>.
          </p>
        </div>
      </header>

      <main class="container-outer pb-20 lg:pb-28">
        <div class="grid gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] xl:gap-14">
          <aside class="flex flex-col gap-6">
            <div class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_55px_rgba(4,8,24,0.45)] backdrop-blur">
              <h2 class="text-lg font-semibold text-white">What helps most</h2>
              <ul class="mt-4 space-y-3 text-sm text-white/70">
                <li class="flex items-start gap-3">
                  <span class="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.8)]"/>
                  Stories from the missions or drills you ran.
                </li>
                <li class="flex items-start gap-3">
                  <span class="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.8)]"/>
                  Moments that felt smooth, confusing or broken.
                </li>
                <li class="flex items-start gap-3">
                  <span class="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.8)]"/>
                  Anything that would make hosting effortless.
                </li>
              </ul>
            </div>

            <div class="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 shadow-[0_18px_55px_rgba(4,8,24,0.45)] backdrop-blur">
              <h2 class="text-lg font-semibold text-white">Want to chat?</h2>
              <p class="mt-3">We&rsquo;re happy to hop on Discord or TeamSpeak after you submit.</p>
              <div class="mt-4 grid gap-3">
                <a
                    class="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200/40 bg-cyan-200/10 px-5 py-3 font-semibold text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-200/20"
                    href="mailto:info@opensquawk.de?subject=OpenSquawk%20feedback%20call&body=I'd%20love%20to%20chat%20about%20feedback%20on%20Discord."
                >
                  <v-icon icon="mdi-discord" size="20"/>
                  Request Discord call
                </a>
                <a
                    class="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200/40 bg-indigo-200/10 px-5 py-3 font-semibold text-indigo-100 transition hover:border-indigo-200/70 hover:bg-indigo-200/20"
                    href="mailto:info@opensquawk.de?subject=OpenSquawk%20feedback%20call&body=TeamSpeak%20works%20great%20for%20me%20%E2%80%93%20let's%20connect!"
                >
                  <v-icon icon="mdi-headset" size="20"/>
                  Request TeamSpeak call
                </a>
              </div>
            </div>

            <div v-if="submissionState === 'success'"
                 class="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-6 text-sm text-emerald-100 shadow-[0_18px_55px_rgba(4,8,24,0.45)] backdrop-blur">
              <div class="flex items-start gap-3">
                <v-icon icon="mdi-check-decagram" size="26" class="mt-0.5 text-emerald-200"/>
                <div class="space-y-2">
                  <h2 class="text-lg font-semibold text-white">Thank you!</h2>
                  <p>Your notes are on their way to info@opensquawk.de. We&rsquo;ll reach out if you asked us to.</p>
                </div>
              </div>
            </div>

            <div v-else-if="submissionState === 'error'"
                 class="rounded-3xl border border-rose-400/40 bg-rose-400/10 p-6 text-sm text-rose-100 shadow-[0_18px_55px_rgba(4,8,24,0.45)] backdrop-blur">
              <div class="flex items-start gap-3">
                <v-icon icon="mdi-alert" size="24" class="mt-0.5 text-rose-200"/>
                <div class="space-y-2">
                  <h2 class="text-lg font-semibold text-white">Sending failed</h2>
                  <p>{{ submissionError || 'Please try again or email info@opensquawk.de directly.' }}</p>
                </div>
              </div>
            </div>
          </aside>

          <form
              class="space-y-10 rounded-3xl border border-white/10 bg-[#0E1630]/80 p-6 shadow-[0_24px_70px_rgba(4,8,24,0.55)] backdrop-blur"
              @submit.prevent="handleSubmit" novalidate>
            <div class="grid gap-6 md:grid-cols-2">
              <div class="space-y-2">
                <label for="name" class="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Name (optional)</label>
                <input
                    id="name"
                    v-model.trim="form.name"
                    type="text"
                    placeholder="How should we address you?"
                    class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                />
              </div>
              <div class="space-y-2">
                <label for="email" class="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Email (optional)</label>
                <input
                    id="email"
                    v-model.trim="form.email"
                    type="email"
                    placeholder="Where can we reply?"
                    class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                />
              </div>
              <div class="space-y-2 md:col-span-2">
                <label for="discord" class="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Discord (optional)</label>
                <input
                    id="discord"
                    v-model.trim="form.discordHandle"
                    type="text"
                    placeholder="Discord username if you&rsquo;d like a call"
                    class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                />
              </div>
            </div>

            <section class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="text-xs font-semibold uppercase tracking-[0.4em] text-white/55">Overall vibe</h2>
                <p class="text-xs text-white/45">1 = cold, 5 = can&rsquo;t wait</p>
              </div>
              <div class="flex flex-wrap gap-3">
                <label
                    v-for="score in ratingScale"
                    :key="score"
                    class="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-cyan-400/70 hover:text-white"
                >
                  <input
                      class="accent-cyan-400"
                      type="radio"
                      name="excitement"
                      :value="score"
                      v-model.number="form.excitement"
                  />
                  <span>{{ score }}</span>
                </label>
              </div>
            </section>

            <div class="grid gap-8 lg:grid-cols-2">
              <fieldset class="space-y-4">
                <legend class="text-xs font-semibold uppercase tracking-[0.4em] text-white/55">What&rsquo;s working</legend>
                <p class="text-sm text-white/65">Pick the highlights and share why they land.</p>
                <div class="grid gap-3">
                  <label
                      v-for="option in highlightOptions"
                      :key="option"
                      class="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:border-cyan-400/60"
                  >
                    <input type="checkbox" class="mt-1 accent-cyan-400" :value="option"
                           v-model="form.highlightSelections"/>
                    <span>{{ option }}</span>
                  </label>
                </div>
                <textarea
                    v-model.trim="form.highlightNotes"
                    rows="4"
                    placeholder="Why did these moments feel good?"
                    class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                ></textarea>
              </fieldset>

              <fieldset class="space-y-4">
                <legend class="text-xs font-semibold uppercase tracking-[0.4em] text-white/55">Needs love</legend>
                <p class="text-sm text-white/65">Flag the rough edges and add context.</p>
                <div class="grid gap-3">
                  <label
                      v-for="option in frictionOptions"
                      :key="option"
                      class="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:border-rose-400/60"
                  >
                    <input type="checkbox" class="mt-1 accent-rose-400" :value="option"
                           v-model="form.frictionSelections"/>
                    <span>{{ option }}</span>
                  </label>
                </div>
                <textarea
                    v-model.trim="form.frictionNotes"
                    rows="4"
                    placeholder="What tripped you up?"
                    class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
                ></textarea>
              </fieldset>
            </div>

            <section class="space-y-4">
              <label for="classroom-notes" class="text-xs font-semibold uppercase tracking-[0.4em] text-white/55">Classroom notes</label>
              <textarea
                  id="classroom-notes"
                  v-model.trim="form.classroomNotes"
                  rows="5"
                  placeholder="Tell us about the missions, pacing or feedback."
                  class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
              ></textarea>
            </section>

            <section class="space-y-4">
              <label for="hosting-interest" class="text-xs font-semibold uppercase tracking-[0.4em] text-white/55">Hosting or deployment</label>
              <textarea
                  id="hosting-interest"
                  v-model.trim="form.hostingInterest"
                  rows="4"
                  placeholder="Self-hosting plans, managed hosting wishes, anything blocking launch."
                  class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
              ></textarea>
            </section>

            <section class="space-y-4">
              <label for="other-ideas" class="text-xs font-semibold uppercase tracking-[0.4em] text-white/55">Big ideas</label>
              <textarea
                  id="other-ideas"
                  v-model.trim="form.otherIdeas"
                  rows="5"
                  placeholder="Features, integrations or workflows you&rsquo;d love to see."
                  class="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
              ></textarea>
            </section>

            <div class="space-y-4">
              <label class="flex items-start gap-3 text-sm text-white/80">
                <input type="checkbox" class="mt-1 accent-cyan-400" v-model="form.contactConsent"/>
                <span>It&rsquo;s okay to reach out about this feedback or invite me to future testing.</span>
              </label>
              <p class="text-xs text-white/50">We route everything straight to <strong>info@opensquawk.de</strong> so the team can respond quickly.</p>
              <button
                  type="submit"
                  :disabled="submissionState === 'submitting'"
                  class="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,0.35)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-cyan-400"
              >
                <v-icon :icon="submissionState === 'submitting' ? 'mdi-dots-circle' : 'mdi-send'" size="20" class="text-slate-950"/>
                <span>{{ submissionState === 'submitting' ? 'Sending…' : 'Send feedback' }}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
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
