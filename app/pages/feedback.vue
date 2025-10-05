<template>
  <div class="min-h-screen bg-[#070d1a] text-white">
    <div class="relative isolate overflow-hidden">
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-indigo-500/20"></div>
      <div class="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-14 sm:px-6 md:px-8 lg:py-20">
        <header class="space-y-6">
          <div class="inline-flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-500/10">
            <v-icon icon="mdi-message-bulleted" size="22" class="text-cyan-200" />
            <span>Feedback makes the product</span>
          </div>
          <div class="space-y-4">
            <h1 class="text-3xl font-semibold sm:text-4xl md:text-5xl">Help us shape OpenSquawk</h1>
            <p class="max-w-3xl text-base text-white/80 sm:text-lg">
              We are trying to build something wonderful that stays free – and if you want it hosted by us, the goal is to keep it as affordable as possible without compromising on quality. Your feedback is unbelievably valuable and helps us make smart decisions about what to ship next.
            </p>
            <p class="max-w-3xl text-base font-semibold text-cyan-100/80">
              Seriously: every insight you share steers the roadmap. Thank you for lending us your perspective.
            </p>
            <p class="max-w-3xl text-sm text-white/70 sm:text-base">
              Thank you for testing in spite of the rough edges. So many things are still work-in-progress and your notes make it possible to keep leveling up the experience for everyone. If you would like to jump on a quick call or even co-build with us (coding experience not required!), send a message to <a class="text-cyan-300 underline" href="mailto:info@opensquawk.de">info@opensquawk.de</a>.
            </p>
            <p class="max-w-3xl text-xs uppercase tracking-[0.3em] text-cyan-100/70">
              We are currently a German development team, but all public docs and tools start in English so we can reach as many people as possible.
            </p>
          </div>
          <div class="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100 shadow-lg shadow-amber-500/10">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-1">
                <p class="text-sm font-semibold uppercase tracking-[0.25em] text-amber-50/80">Quick heads-up</p>
                <p class="text-sm text-amber-50/80">All notes are sent by email. When you submit below we prepare an email to <strong>info@opensquawk.de</strong> with your answers, just like the rest of our forms.</p>
              </div>
              <a
                class="inline-flex items-center gap-2 rounded-xl border border-amber-200/40 bg-amber-200/10 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-200/20"
                href="mailto:info@opensquawk.de?subject=OpenSquawk%20feedback%20call"
              >
                <v-icon icon="mdi-phone" size="18" class="text-amber-100" />
                Request a call
              </a>
            </div>
          </div>
        </header>

        <form class="space-y-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/10 backdrop-blur" @submit.prevent="handleSubmit">
          <div class="grid gap-6 md:grid-cols-2">
            <div class="space-y-2">
              <label for="name" class="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Name (optional)</label>
              <input
                id="name"
                v-model.trim="form.name"
                type="text"
                placeholder="How should we address you?"
                class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div class="space-y-2">
              <label for="email" class="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Email (optional)</label>
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
                  <input type="checkbox" class="mt-1 accent-cyan-400" :value="option" v-model="form.highlightSelections" />
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
                  <input type="checkbox" class="mt-1 accent-rose-400" :value="option" v-model="form.frictionSelections" />
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
            <label for="classroom-notes" class="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Classroom stories</label>
            <p class="text-sm text-white/70">Tell us about the missions you tried, the radio training flow, anything that stood out.</p>
            <textarea
              id="classroom-notes"
              v-model.trim="form.classroomNotes"
              rows="5"
              placeholder="What happened in the Classroom? What should we double down on?"
              class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
            ></textarea>
          </div>

          <div class="space-y-4">
            <label for="hosting-interest" class="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Hosting or deployment</label>
            <p class="text-sm text-white/70">If you are planning to self-host or need us to host for you, what would make it a no-brainer?</p>
            <textarea
              id="hosting-interest"
              v-model.trim="form.hostingInterest"
              rows="4"
              placeholder="Tell us about your setup, budget expectations, or blockers"
              class="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
            ></textarea>
          </div>

          <div class="space-y-4">
            <label for="other-ideas" class="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Big ideas &amp; requests</label>
            <p class="text-sm text-white/70">Dream loud – features, integrations, workflows, anything that would make OpenSquawk remarkable for you.</p>
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
              <input type="checkbox" class="mt-1 accent-cyan-400" v-model="form.contactConsent" />
              <span>I am happy for you to email me back about this feedback or to invite me to jam on the roadmap.</span>
            </label>
            <p class="text-xs text-white/50">Submitting prepares an email draft to <strong>info@opensquawk.de</strong>. Please review it and hit send from your client.</p>
            <button
              type="submit"
              class="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,0.35)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <v-icon icon="mdi-send" size="20" class="text-slate-950" />
              Prepare email
            </button>
          </div>
        </form>

        <section v-if="submissionState !== 'idle'" class="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/80 shadow-xl shadow-cyan-500/10">
          <h2 class="text-lg font-semibold text-white">Email preview</h2>
          <p class="mt-2 text-white/70">
            Your email client should open automatically. If not, copy the text below and send it to <a class="text-cyan-300 underline" href="mailto:info@opensquawk.de">info@opensquawk.de</a>.
          </p>
          <div class="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4">
            <pre class="whitespace-pre-wrap break-words text-sm text-white/80">{{ emailBody }}</pre>
          </div>
          <button
            type="button"
            class="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-400 hover:text-cyan-100"
            @click="copyToClipboard"
          >
            <v-icon :icon="copyStatus === 'copied' ? 'mdi-check' : 'mdi-content-copy'" size="18" />
            <span v-if="copyStatus === 'copied'">Copied to clipboard</span>
            <span v-else-if="copyStatus === 'failed'">Copy not available</span>
            <span v-else>Copy email text</span>
          </button>
          <p v-if="copyStatus === 'failed'" class="mt-2 text-xs text-rose-200/80">Please copy the text manually if your browser blocks clipboard access.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useHead } from '#imports'

useHead({ title: 'Feedback & ideas • OpenSquawk' })

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

const submissionState = ref<'idle' | 'ready'>('idle')
const emailBody = ref('')
const copyStatus = ref<'idle' | 'copied' | 'failed'>('idle')

const formattedHighlights = computed(() => (form.highlightSelections.length ? form.highlightSelections.join(', ') : '—'))
const formattedFrictions = computed(() => (form.frictionSelections.length ? form.frictionSelections.join(', ') : '—'))

function clipboardAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.clipboard && 'writeText' in navigator.clipboard
}

function buildEmailBody() {
  const lines: string[] = []
  lines.push('Hey OpenSquawk team,', '')
  lines.push(`Name: ${form.name || '—'}`)
  lines.push(`Email: ${form.email || '—'}`)
  lines.push(`Okay to follow up: ${form.contactConsent ? 'Yes' : 'No'}`)
  lines.push('')
  lines.push(`Overall excitement (1-5): ${form.excitement}`)
  lines.push(`What feels great: ${formattedHighlights.value}`)
  if (form.highlightNotes) {
    lines.push(form.highlightNotes)
  }
  lines.push('')
  lines.push(`What feels rough: ${formattedFrictions.value}`)
  if (form.frictionNotes) {
    lines.push(form.frictionNotes)
  }
  lines.push('')
  lines.push('Classroom stories:')
  lines.push(form.classroomNotes || '—')
  lines.push('')
  lines.push('Hosting & deployment thoughts:')
  lines.push(form.hostingInterest || '—')
  lines.push('')
  lines.push('Big ideas & requests:')
  lines.push(form.otherIdeas || '—')
  lines.push('')
  lines.push('Thank you for building something ambitious and keeping it accessible!')

  while (lines[lines.length - 1] === '') {
    lines.pop()
  }

  return lines.join('\n')
}

async function handleSubmit() {
  const body = buildEmailBody()
  emailBody.value = body
  submissionState.value = 'ready'
  copyStatus.value = 'idle'

  const subject = `OpenSquawk feedback – excitement ${form.excitement}`
  const mailto = `mailto:info@opensquawk.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  if (typeof window !== 'undefined') {
    try {
      if (clipboardAvailable()) {
        await navigator.clipboard.writeText(body)
        copyStatus.value = 'copied'
      }
    } catch {
      copyStatus.value = 'failed'
    }

    window.location.href = mailto
  }
}

async function copyToClipboard() {
  if (!clipboardAvailable()) {
    copyStatus.value = 'failed'
    return
  }

  try {
    await navigator.clipboard.writeText(emailBody.value)
    copyStatus.value = 'copied'
  } catch {
    copyStatus.value = 'failed'
  }
}
</script>

<style scoped>
pre {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
</style>
