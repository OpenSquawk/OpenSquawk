<template>
  <div class="min-h-screen text-white"
       style="background: radial-gradient(circle at top, rgba(22,187,215,0.15), transparent 55%), radial-gradient(circle at bottom, rgba(41,45,59,0.4), transparent 65%);"
  >
    <div class="relative isolate overflow-hidden">
      <header class="space-y-6
              text-white/90 px-4 py-20 text-center lg:py-32 lg:px-0
              before:absolute before:inset-0 before:-z-10 before:opacity-30 before:blur-lg before:content-['']
              flex flex-col items-center gap-6"
      >
        <img src="/img/landing/groundpath.jpeg" alt="Path through a forest"
             class="fixed  inset-0 h-screen w-full object-cover object-center brightness-75 mix-blend-overlay"/>
        <div class="absolute inset-0 -z-10 bg-blue-950/60 backdrop-blur-lg"/>
        <div
            class="inline-flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-500/10 "
            style="backdrop-filter: blur(20px);"
        >
          <v-icon icon="mdi-message-bulleted" size="22" class="text-cyan-200"/>
          <span>Feedback makes the product</span>
        </div>
        <div class="space-y-4">
          <h1 class="text-3xl font-semibold sm:text-4xl md:text-5xl">Help us shape OpenSquawk</h1>
          <p class="max-w-3xl text-base text-white/80 sm:text-lg">
            We are trying to build something wonderful that stays free – and if you want it hosted by us, the goal is to
            keep it as affordable as possible without compromising on quality. Your feedback is unbelievably valuable
            and helps us make smart decisions about what to ship next.
          </p>
          <p class="max-w-3xl text-base font-semibold text-cyan-100/80">
            Seriously: every insight you share steers the roadmap. Thank you for lending us your perspective.
          </p>
          <p class="max-w-3xl text-sm text-white/70 sm:text-base">
            Thank you for testing in spite of the rough edges. So many things are still work-in-progress and your notes
            make it possible to keep leveling up the experience for everyone. If you would like to jump on a quick call
            or even co-build with us (coding experience not required!), send a message to <a
              class="text-cyan-300 underline" href="mailto:info@opensquawk.de">info@opensquawk.de</a>.
          </p>
          <p class="max-w-3xl text-xs uppercase tracking-[0.3em] text-cyan-100/70">
            We are currently a German development team, but all public docs and tools start in English so we can reach
            as many people as possible.
          </p>
        </div>

      </header>

      <div class="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-14 sm:px-6 md:px-8 lg:py-20">
        <form
            class="space-y-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/10 backdrop-blur"
            @submit.prevent="handleSubmit" novalidate>
          <div class="grid gap-6 md:grid-cols-2">
            <div class="space-y-2">
              <label for="name" class="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Name
                (optional)</label>
              <input
                  id="name"
                  v-model.trim="form.name"
                  type="text"
                  placeholder="How should we address you?"
                  class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div class="space-y-2">
              <label for="email" class="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Email
                (optional)</label>
              <input
                  id="email"
                  v-model.trim="form.email"
                  type="email"
                  placeholder="Where we can reach you if needed"
                  class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div class="space-y-4">
            <p class="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Overall excitement</p>
            <p class="text-sm text-white/70">How excited are you about OpenSquawk right now?</p>
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

          <div class="grid gap-8 lg:grid-cols-2">
            <fieldset class="space-y-4">
              <legend class="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">What works well</legend>
              <p class="text-sm text-white/70">Tick anything that feels promising already and tell us why.</p>
              <div class="grid gap-3">
                <label
                    v-for="option in highlightOptions"
                    :key="option"
                    class="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80 transition hover:border-cyan-400/60"
                >
                  <input type="checkbox" class="mt-1 accent-cyan-400" :value="option"
                         v-model="form.highlightSelections"/>
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
              <legend class="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Where it hurts</legend>
              <p class="text-sm text-white/70">Checkbox anything that feels rough or confusing and describe it.</p>
              <div class="grid gap-3">
                <label
                    v-for="option in frictionOptions"
                    :key="option"
                    class="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80 transition hover:border-rose-400/60"
                >
                  <input type="checkbox" class="mt-1 accent-rose-400" :value="option"
                         v-model="form.frictionSelections"/>
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

          <div class="space-y-4">
            <label for="classroom-notes" class="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Classroom
              stories</label>
            <p class="text-sm text-white/70">Tell us about the missions you tried, the radio training flow, anything
              that stood out.</p>
            <textarea
                id="classroom-notes"
                v-model.trim="form.classroomNotes"
                rows="5"
                placeholder="What happened in the Classroom? What should we double down on?"
                class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
            ></textarea>
          </div>

          <div class="space-y-4">
            <label for="hosting-interest" class="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Hosting
              or deployment</label>
            <p class="text-sm text-white/70">If you are planning to self-host or need us to host for you, what would
              make it a no-brainer?</p>
            <textarea
                id="hosting-interest"
                v-model.trim="form.hostingInterest"
                rows="4"
                placeholder="Tell us about your setup, budget expectations, or blockers"
                class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
            ></textarea>
          </div>

          <div class="space-y-4">
            <label for="other-ideas" class="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Big ideas
              &amp; requests</label>
            <p class="text-sm text-white/70">Dream loud – features, integrations, workflows, anything that would make
              OpenSquawk remarkable for you.</p>
            <textarea
                id="other-ideas"
                v-model.trim="form.otherIdeas"
                rows="5"
                placeholder="Share every idea. Wild and small ones welcome."
                class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
            ></textarea>
          </div>

          <div class="space-y-3">
            <label class="flex items-start gap-3 text-sm text-white/80">
              <input type="checkbox" class="mt-1 accent-cyan-400" v-model="form.contactConsent"/>
              <span>I am happy for you to email me back about this feedback or to invite me to jam on the roadmap.</span>
            </label>
            <p class="text-xs text-white/50">Submissions are routed straight to <strong>info@opensquawk.de</strong> so
              the team can read and respond quickly.</p>
            <button
                type="submit"
                :disabled="submissionState === 'submitting'"
                class="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,0.35)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-cyan-400"
            >
              <v-icon :icon="submissionState === 'submitting' ? 'mdi-dots-circle' : 'mdi-send'" size="20"
                      class="text-slate-950"/>
              <span>{{ submissionState === 'submitting' ? 'Sending…' : 'Send feedback' }}</span>
            </button>
          </div>
        </form>

        <section v-if="submissionState === 'success'"
                 class="space-y-4 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-sm text-emerald-100 shadow-xl shadow-emerald-500/10">
          <div class="flex items-start gap-3">
            <v-icon icon="mdi-check-decagram" size="28" class="mt-0.5 text-emerald-200"/>
            <div class="space-y-2">
              <h2 class="text-lg font-semibold text-white">Thank you for steering the mission!</h2>
              <p>Your notes are already on their way to the cockpit at info@opensquawk.de. We will follow up if you
                checked that it’s okay.</p>
            </div>
          </div>
        </section>

        <section v-else-if="submissionState === 'error'"
                 class="space-y-4 rounded-3xl border border-rose-400/40 bg-rose-400/10 p-6 text-sm text-rose-100 shadow-xl shadow-rose-500/10">
          <div class="flex items-start gap-3">
            <v-icon icon="mdi-alert" size="26" class="mt-0.5 text-rose-200"/>
            <div class="space-y-2">
              <h2 class="text-lg font-semibold text-white">Something jammed on the way out</h2>
              <p>{{
                  submissionError || 'We could not send this feedback. Please try again in a moment or email info@opensquawk.de directly.'
                }}</p>
            </div>
          </div>
        </section>

        <section
            class="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/80 shadow-xl shadow-cyan-500/10">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="space-y-2">
              <h2 class="text-lg font-semibold text-white">Prefer to talk it through?</h2>
              <p>We are more than happy to jump on Discord or TeamSpeak for a quick debrief about your ideas.</p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
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
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref} from 'vue'
import {useHead, useNuxtApp} from '#imports'

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

const {$fetch} = useNuxtApp()

async function handleSubmit() {
  submissionError.value = null
  submissionState.value = 'submitting'

  try {
    await $fetch('/api/service/feedback', {
      method: 'POST',
      body: {
        ...form,
        excitement: form.excitement,
        highlightSelections: [...form.highlightSelections],
        frictionSelections: [...form.frictionSelections],
      },
    })

    submissionState.value = 'success'

    form.highlightSelections = []
    form.frictionSelections = []
    form.highlightNotes = ''
    form.frictionNotes = ''
    form.classroomNotes = ''
    form.hostingInterest = ''
    form.otherIdeas = ''
  } catch (error: unknown) {
    submissionState.value = 'error'
    if (error && typeof error === 'object') {
      const statusMessage =
          (error as any).statusMessage ||
          ((error as any).data && typeof (error as any).data?.statusMessage === 'string' ? (error as any).data.statusMessage : null)
      if (typeof statusMessage === 'string' && statusMessage.length > 0) {
        submissionError.value = statusMessage
        return
      }
    }
    if (error instanceof Error) {
      submissionError.value = error.message
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
