<template>
  <div class="min-h-screen bg-[#0b1020] text-white py-12 px-6">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <header class="space-y-4">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" />
          Back to landing page
        </NuxtLink>
        <div class="space-y-3">
          <p class="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Open feedback</p>
          <h1 class="text-3xl font-semibold leading-tight">Help us shape OpenSquawk</h1>
          <p class="text-white/70">
            We are building something awesome that you can use for free — and if you ever need us to host it for you we want to
            keep it as affordable as possible without cutting quality. Your feedback is unbelievably valuable for getting there,
            so thank you for taking the time to test and tell us what works and what is still rough around the edges.
          </p>
          <div class="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-5 text-sm text-emerald-100">
            <p class="font-semibold text-emerald-50">Thank you for helping!</p>
            <p class="mt-1 text-emerald-100/80">
              Every note you send shows us where to focus next. We know lots of things are still WIP — keep the reports coming.
            </p>
          </div>
          <p class="text-white/70">
            We are currently a German development team, but we publish docs and tools in English first so more people can join.
            If you want to chat or co-build (no coding knowledge required), drop us a line at
            <a class="text-cyan-300 underline" href="mailto:info@opensquawk.de">info@opensquawk.de</a> and we can schedule a
            short call.
          </p>
        </div>
      </header>

      <section class="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/10">
        <h2 class="text-2xl font-semibold">Send us your notes</h2>
        <p class="mt-2 text-sm text-white/70">
          This form prepares an email to <strong>info@opensquawk.de</strong>. Feel free to edit the message before sending —
          all text lands directly in our inbox just like the rest of your mail.
        </p>

        <form
          class="mt-6 space-y-8"
          action="mailto:info@opensquawk.de"
          method="POST"
          enctype="text/plain"
        >
          <fieldset class="grid gap-4 sm:grid-cols-2">
            <legend class="text-xs uppercase tracking-[0.3em] text-white/50">Who is writing?</legend>
            <label class="space-y-2 text-sm text-white/80">
              <span>Callsign or name (optional)</span>
              <input
                name="name"
                type="text"
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/90 placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                placeholder="e.g. DLH123 or Sam"
              />
            </label>
            <label class="space-y-2 text-sm text-white/80">
              <span>Reply-to email (optional)</span>
              <input
                name="email"
                type="email"
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/90 placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                placeholder="Only if you want us to follow up"
              />
            </label>
          </fieldset>

          <fieldset class="space-y-3">
            <legend class="text-xs uppercase tracking-[0.3em] text-white/50">What did you look at?</legend>
            <p class="text-sm text-white/70">Check as many areas as apply.</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                <input type="checkbox" name="topics" value="Classroom orientation" class="mt-1 rounded border-white/30" />
                <span>Classroom orientation tour</span>
              </label>
              <label class="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                <input type="checkbox" name="topics" value="Mission hub & lessons" class="mt-1 rounded border-white/30" />
                <span>Mission hub & lessons</span>
              </label>
              <label class="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                <input type="checkbox" name="topics" value="Audio quality" class="mt-1 rounded border-white/30" />
                <span>Radio / audio quality</span>
              </label>
              <label class="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                <input type="checkbox" name="topics" value="Live ATC preview" class="mt-1 rounded border-white/30" />
                <span>Live ATC preview / cockpit plug-in</span>
              </label>
              <label class="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                <input type="checkbox" name="topics" value="User interface" class="mt-1 rounded border-white/30" />
                <span>User interface & accessibility</span>
              </label>
              <label class="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                <input type="checkbox" name="topics" value="Other" class="mt-1 rounded border-white/30" />
                <span>Something else entirely</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="space-y-3">
            <legend class="text-xs uppercase tracking-[0.3em] text-white/50">How does it feel right now?</legend>
            <div class="grid gap-3 sm:grid-cols-3">
              <label class="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
                <input type="checkbox" name="mood" value="Amazing" class="rounded border-white/30" />
                <span>✨ Amazing / ready to show off</span>
              </label>
              <label class="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
                <input type="checkbox" name="mood" value="Promising" class="rounded border-white/30" />
                <span>👍 Promising but needs polish</span>
              </label>
              <label class="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
                <input type="checkbox" name="mood" value="Broken" class="rounded border-white/30" />
                <span>🪛 Broken / confusing</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="space-y-4">
            <legend class="text-xs uppercase tracking-[0.3em] text-white/50">Tell us everything</legend>
            <label class="space-y-2 text-sm text-white/80">
              <span>What felt great or surprisingly fun?</span>
              <textarea
                name="highlights"
                rows="3"
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/90 placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                placeholder="Moments, features or flows that clicked for you"
              ></textarea>
            </label>
            <label class="space-y-2 text-sm text-white/80">
              <span>Where did you struggle or hit bugs?</span>
              <textarea
                name="issues"
                rows="4"
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/90 placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                placeholder="Tell us what broke, what was confusing or what blocked you"
              ></textarea>
            </label>
            <label class="space-y-2 text-sm text-white/80">
              <span>Ideas, workflows or integrations you would love?</span>
              <textarea
                name="ideas"
                rows="4"
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/90 placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                placeholder="Crazy wishes welcome – hardware, networks, training formats, anything"
              ></textarea>
            </label>
            <label class="space-y-2 text-sm text-white/80">
              <span>Anything else we should know?</span>
              <textarea
                name="extra"
                rows="3"
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/90 placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                placeholder="Optional notes, links or shout-outs"
              ></textarea>
            </label>
          </fieldset>

          <div class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-white/70">
            <p>
              Prefer to write a free-form email? That works too — send everything straight to
              <a class="text-cyan-300 underline" href="mailto:info@opensquawk.de">info@opensquawk.de</a>.
            </p>
            <p>
              If you want to co-create or jump on a call, mention it above. We are happy to host short syncs with pilots,
              controllers, designers, developers and anyone excited to support the project.
            </p>
          </div>

          <button
            type="submit"
            class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3.5 text-base font-semibold text-slate-950 shadow-[0_14px_35px_rgba(56,189,248,0.35)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            <v-icon icon="mdi-send" size="20" class="text-[#061318]" />
            Prepare email to OpenSquawk
          </button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

useHead({
  title: 'Feedback & ideas • OpenSquawk',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' },
  ],
})
</script>
