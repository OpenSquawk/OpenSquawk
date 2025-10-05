<template>
  <div class="relative min-h-screen bg-[#0b1020] text-white antialiased">
    <img
        src="/img/landing/groundpath.jpeg"
        alt="Path through a forest"
        class="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-60"
    />
    <div class="absolute inset-0 bg-[#0b1020]/80 backdrop-blur-md"/>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,187,215,0.18),transparent_60%)]"/>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(41,45,59,0.55),transparent_70%)]"/>

    <main class="relative z-10">
      <div class="container-outer flex flex-col gap-16 py-16 sm:py-20 lg:py-24">
        <header class="mx-auto max-w-3xl space-y-5 text-center sm:mx-0 sm:text-left">
          <span
              class="chip inline-flex items-center gap-2 border-cyan-300/40 bg-cyan-300/15 text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-100"
          >
            <v-icon icon="mdi-message-processing" size="16" class="text-cyan-200"/>
            Feedback console
          </span>
          <h1 class="text-3xl font-semibold sm:text-4xl md:text-5xl">Help us tune the next release</h1>
          <p class="text-base text-white/80 sm:text-lg">
            OpenSquawk is growing across the Bridge, Live ATC and the Classroom. Your notes keep the experience sharp
            and help us choose what to polish next.
          </p>
          <p class="text-sm text-white/65 sm:text-base">
            We&rsquo;re a small German crew building in English so every pilot can follow along. Drop the quick wins, the
            rough edges and the big ideas right below.
          </p>
        </header>

        <div class="grid gap-12 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
          <aside class="space-y-6">
            <section class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 class="text-xl font-semibold">What helps most</h2>
              <p class="text-sm text-white/70">
                Share anything that made you smile, stumble or reach for a workaround. We map it directly into the
                roadmap.
              </p>
              <ul class="space-y-2 text-sm text-white/70">
                <li class="flex gap-3"><span class="chip">1</span><span>Moments that already feel like real ATC.</span>
                </li>
                <li class="flex gap-3"><span class="chip">2</span><span>Flows that slow you down or feel confusing.</span>
                </li>
                <li class="flex gap-3"><span class="chip">3</span><span>Ideas that would make OpenSquawk a no-brainer.</span>
                </li>
              </ul>
            </section>

            <section class="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 class="text-xl font-semibold">How we follow up</h2>
              <p class="text-sm text-white/70">
                Every submission lands straight in our cockpit inbox. Add contact details if you&rsquo;d like a quick ping
                back when we ship fixes or want to dive deeper.
              </p>
              <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                <v-icon icon="mdi-email-fast-outline" size="20" class="text-cyan-300"/>
                info@opensquawk.de
              </div>
            </section>

            <section class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div class="space-y-2">
                <h2 class="text-xl font-semibold">Prefer to talk it through?</h2>
                <p class="text-sm text-white/70">
                  Drop your Discord handle in the form or grab a slot for a live debrief.
                </p>
              </div>
              <div class="flex flex-col gap-3">
                <a
                    class="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200/40 bg-cyan-200/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-200/20"
                    href="mailto:info@opensquawk.de?subject=OpenSquawk%20feedback%20call&body=I'd%20love%20to%20chat%20about%20feedback%20on%20Discord%20or%20TeamSpeak."
                >
                  <v-icon icon="mdi-discord" size="20"/>
                  Request Discord call
                </a>
                <a
                    class="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200/40 bg-indigo-200/10 px-5 py-3 text-sm font-semibold text-indigo-100 transition hover:border-indigo-200/70 hover:bg-indigo-200/20"
                    href="mailto:info@opensquawk.de?subject=OpenSquawk%20feedback%20call&body=TeamSpeak%20works%20great%20for%20me%20%E2%80%93%20let's%20connect!"
                >
                  <v-icon icon="mdi-headset" size="20"/>
                  Request TeamSpeak call
                </a>
              </div>
            </section>
          </aside>

          <div class="space-y-6">
            <section
                v-if="submissionState === 'success'"
                class="space-y-3 rounded-3xl border border-emerald-400/40 bg-emerald-400/15 p-6 text-sm text-emerald-100 shadow-[0_22px_60px_rgba(16,185,129,0.25)]"
            >
              <div class="flex items-start gap-3">
                <v-icon icon="mdi-check-decagram" size="26" class="mt-0.5 text-emerald-200"/>
                <div class="space-y-1.5">
                  <h2 class="text-lg font-semibold text-white">Thank you for steering the mission!</h2>
                  <p>Your notes are already on their way to info@opensquawk.de. We&rsquo;ll reach out if you asked us to.</p>
                </div>
              </div>
            </section>

            <section
                v-else-if="submissionState === 'error'"
                class="space-y-3 rounded-3xl border border-rose-400/50 bg-rose-400/15 p-6 text-sm text-rose-100 shadow-[0_22px_60px_rgba(244,63,94,0.25)]"
            >
              <div class="flex items-start gap-3">
                <v-icon icon="mdi-alert" size="24" class="mt-0.5 text-rose-200"/>
                <div class="space-y-1.5">
                  <h2 class="text-lg font-semibold text-white">Something jammed on the way out</h2>
                  <p>
                    {{ submissionError || 'We could not send this feedback. Please try again shortly or email info@opensquawk.de directly.' }}
                  </p>
                </div>
              </div>
            </section>

            <form
                class="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_22px_60px_rgba(13,21,46,0.45)] backdrop-blur"
                @submit.prevent="handleSubmit"
                novalidate
            >
              <section class="space-y-5">
                <header class="space-y-1">
                  <h2 class="text-lg font-semibold text-white">Crew details</h2>
                  <p class="text-sm text-white/60">Optional, but helps us follow up with tailored answers.</p>
                </header>
                <div class="grid gap-5 md:grid-cols-2">
                  <div class="space-y-2">
                    <label for="name" class="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Name</label>
                    <input
                        id="name"
                        v-model.trim="form.name"
                        type="text"
                        placeholder="How should we address you?"
                        class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div class="space-y-2">
                    <label for="email" class="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Email</label>
                    <input
                        id="email"
                        v-model.trim="form.email"
                        type="email"
                        placeholder="Where we can reach you if needed"
                        class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div class="space-y-2 md:col-span-2">
                    <label for="discord" class="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Discord</label>
                    <input
                        id="discord"
                        v-model.trim="form.discordHandle"
                        type="text"
                        placeholder="Discord username if you'd like to chat"
                        class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div class="space-y-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Overall excitement</p>
                  <p class="text-sm text-white/65">How does OpenSquawk feel right now?</p>
                  <div class="flex flex-wrap gap-3">
                    <label
                        v-for="score in ratingScale"
                        :key="score"
                        class="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-cyan-400/70 hover:text-white"
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
                </div>
              </section>

              <section class="space-y-5">
                <header class="space-y-1">
                  <h2 class="text-lg font-semibold text-white">Product notes</h2>
                  <p class="text-sm text-white/60">Highlight the highs and lows so we can triage quickly.</p>
                </header>
                <div class="grid gap-6 lg:grid-cols-2">
                  <fieldset class="space-y-4">
                    <legend class="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">What works well</legend>
                    <div class="grid gap-3">
                      <label
                          v-for="option in highlightOptions"
                          :key="option"
                          class="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80 transition hover:border-cyan-400/60"
                      >
                        <input
                            type="checkbox"
                            class="mt-1 accent-cyan-400"
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
                        class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                    ></textarea>
                  </fieldset>

                  <fieldset class="space-y-4">
                    <legend class="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Where it hurts</legend>
                    <div class="grid gap-3">
                      <label
                          v-for="option in frictionOptions"
                          :key="option"
                          class="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80 transition hover:border-rose-400/60"
                      >
                        <input
                            type="checkbox"
                            class="mt-1 accent-rose-400"
                            :value="option"
                            v-model="form.frictionSelections"
                        />
                        <span>{{ option }}</span>
                      </label>
                    </div>
                    <textarea
                        v-model.trim="form.frictionNotes"
                        rows="4"
                        placeholder="Help us understand what should be fixed first"
                        class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-rose-400 focus:outline-none"
                    ></textarea>
                  </fieldset>
                </div>
              </section>

              <section class="space-y-5">
                <header class="space-y-1">
                  <h2 class="text-lg font-semibold text-white">Mission intel</h2>
                  <p class="text-sm text-white/60">Tell us about the full experience &mdash; Classroom, hosting and big swings.</p>
                </header>
                <div class="space-y-5">
                  <div class="space-y-2">
                    <label for="classroom-notes" class="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Classroom stories</label>
                    <textarea
                        id="classroom-notes"
                        v-model.trim="form.classroomNotes"
                        rows="4"
                        placeholder="What stood out in the missions or radio drills?"
                        class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                    ></textarea>
                  </div>
                  <div class="space-y-2">
                    <label for="hosting-interest" class="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Hosting or deployment</label>
                    <textarea
                        id="hosting-interest"
                        v-model.trim="form.hostingInterest"
                        rows="4"
                        placeholder="Tell us about your setup, budget or blockers"
                        class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                    ></textarea>
                  </div>
                  <div class="space-y-2">
                    <label for="other-ideas" class="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Big ideas &amp; requests</label>
                    <textarea
                        id="other-ideas"
                        v-model.trim="form.otherIdeas"
                        rows="4"
                        placeholder="Dream loud &mdash; features, workflows, integrations"
                        class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                    ></textarea>
                  </div>
                </div>
              </section>

              <section class="space-y-3">
                <label class="flex items-start gap-3 text-sm text-white/80">
                  <input type="checkbox" class="mt-1 accent-cyan-400" v-model="form.contactConsent"/>
                  <span>I&rsquo;m happy for you to follow up about this feedback or invite me to jam on the roadmap.</span>
                </label>
                <p class="text-xs text-white/50">
                  Submissions route straight to <strong>info@opensquawk.de</strong> so the crew can reply quickly.
                </p>
                <button
                    type="submit"
                    :disabled="submissionState === 'submitting'"
                    class="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,0.35)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-cyan-400"
                >
                  <v-icon :icon="submissionState === 'submitting' ? 'mdi-dots-circle' : 'mdi-send'" size="20" class="text-slate-950"/>
                  <span>{{ submissionState === 'submitting' ? 'Sending…' : 'Send feedback' }}</span>
                </button>
              </section>
            </form>
          </div>
        </div>
      </div>
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
