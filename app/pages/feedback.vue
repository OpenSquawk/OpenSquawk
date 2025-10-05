<template>
  <div class="feedback-page relative min-h-screen overflow-hidden bg-[#0B1020] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),transparent_60%)]"/>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(15,23,42,0.65),transparent_55%)]"/>

    <main class="relative mx-auto flex w-full max-w-5xl flex-col gap-14 px-5 py-12 sm:px-8 lg:px-12">
      <nav class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <NuxtLink
          to="/"
          class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10 sm:w-auto"
        >
          <span aria-hidden="true">←</span>
          Zurück zur Startseite
        </NuxtLink>
        <NuxtLink
          to="/classroom"
          class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/0 bg-white/0 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5 sm:w-auto"
        >
          <v-icon icon="mdi-school-outline" class="h-5 w-5" />
          Classroom entdecken
        </NuxtLink>
      </nav>

      <header class="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0E1630]/80 p-8 shadow-[0_30px_120px_rgba(5,10,35,0.55)] sm:p-12">
        <div class="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#22D3EE]/15 blur-3xl" />
        <div class="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#7B4DFF]/15 blur-3xl" />

        <div class="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div class="space-y-5">
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-[#22D3EE]">Feedback Lab</p>
            <h1 class="text-3xl font-semibold leading-tight sm:text-4xl">
              Feedback geben, das motiviert – und sofort weiterbringt.
            </h1>
            <p class="max-w-xl text-sm text-white/75 sm:text-base">
              Unsere Feedback-Strecke verbindet strukturierte Fragen, persönliche Highlights und klare nächste Schritte – alles im Look & Feel des Classrooms.
            </p>

            <div class="flex flex-col gap-3 sm:flex-row">
              <NuxtLink
                to="/bridge/index"
                class="btn primary inline-flex items-center justify-center gap-2 rounded-2xl bg-[#22D3EE] px-5 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#17bad3]"
              >
                <v-icon icon="mdi-rocket-launch" class="h-5 w-5" />
                Starte eine Session
              </NuxtLink>
              <NuxtLink
                to="/present"
                class="btn secondary inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
              >
                <v-icon icon="mdi-chart-timeline-variant" class="h-5 w-5" />
                Live-Demos ansehen
              </NuxtLink>
            </div>
          </div>

          <div class="flex h-full flex-col justify-between gap-6 rounded-[28px] border border-white/10 bg-white/5 p-6 text-left backdrop-blur">
            <div class="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-white/70">
              <span class="inline-flex items-center gap-2 text-[#22D3EE]">
                <span class="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_12px_rgba(34,211,238,0.95)]" />
                Session ready
              </span>
              <span>01 · 03</span>
            </div>
            <div class="space-y-3">
              <p class="text-sm font-semibold text-white/80">Feedback-Flow</p>
              <ul class="space-y-2 text-sm text-white/70">
                <li class="flex items-center gap-3">
                  <v-icon icon="mdi-comment-quote" class="h-5 w-5 text-[#22D3EE]" />
                  Warm-up Check-ins
                </li>
                <li class="flex items-center gap-3">
                  <v-icon icon="mdi-pulse" class="h-5 w-5 text-[#22D3EE]" />
                  Live Scorecards
                </li>
                <li class="flex items-center gap-3">
                  <v-icon icon="mdi-lightbulb-on" class="h-5 w-5 text-[#22D3EE]" />
                  Sofortige Empfehlungen
                </li>
              </ul>
            </div>
            <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-[#141d38]/70 p-4 text-xs text-white/65">
              <span class="flex items-center gap-2">
                <v-icon icon="mdi-clock-fast" class="h-4 w-4 text-[#22D3EE]" />
                Dauer: 4 Minuten
              </span>
              <span class="flex items-center gap-2 text-[#16a9c4]">
                <v-icon icon="mdi-check-circle" class="h-4 w-4" />
                Versendet automatisch
              </span>
            </div>
          </div>
        </div>
      </header>

      <section class="grid gap-5 sm:grid-cols-2">
        <article
          v-for="mode in feedbackModes"
          :key="mode.title"
          class="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111832]/85 p-6 shadow-[0_20px_60px_rgba(4,8,24,0.45)] transition hover:border-white/20 hover:shadow-[0_26px_70px_rgba(4,8,24,0.55)]"
        >
          <div class="pointer-events-none absolute -right-10 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[#22D3EE]/10 blur-3xl opacity-0 transition group-hover:opacity-100" />
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[#22D3EE]">
            <v-icon :icon="mode.icon" class="h-6 w-6" />
          </span>
          <h2 class="mt-4 text-xl font-semibold">{{ mode.title }}</h2>
          <p class="mt-2 text-sm text-white/70">{{ mode.description }}</p>
          <ul class="mt-4 space-y-2 text-xs text-white/55">
            <li
              v-for="bullet in mode.points"
              :key="bullet"
              class="flex items-center gap-2"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
              {{ bullet }}
            </li>
          </ul>
        </article>
      </section>

      <section class="space-y-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="space-y-2">
            <h2 class="text-2xl font-semibold">So fühlt sich der Flow an</h2>
            <p class="max-w-xl text-sm text-white/65">Klare Schritte, leicht zu beantworten und immer im Kontext deiner Session.</p>
          </div>
          <NuxtLink
            to="/bridge/connect"
            class="inline-flex items-center gap-2 text-sm font-semibold text-[#22D3EE] transition hover:text-[#17bad3]"
          >
            <v-icon icon="mdi-flash" class="h-5 w-5" />
            Jetzt verbinden
          </NuxtLink>
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <article
            v-for="(step, index) in flowSteps"
            :key="step.title"
            class="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#111832]/80 p-6"
          >
            <span class="text-sm font-semibold text-[#22D3EE]">0{{ index + 1 }}</span>
            <h3 class="mt-3 text-lg font-semibold">{{ step.title }}</h3>
            <p class="mt-2 text-sm text-white/70">{{ step.description }}</p>
            <div class="mt-4 flex items-center gap-2 text-xs text-white/55">
              <v-icon :icon="step.icon" class="h-4 w-4 text-[#22D3EE]" />
              {{ step.meta }}
            </div>
          </article>
        </div>
      </section>

      <section class="grid gap-6 rounded-[32px] border border-white/10 bg-[#0E1630]/75 p-8 shadow-[0_28px_95px_rgba(5,10,35,0.55)] sm:grid-cols-[0.85fr_1.15fr] sm:p-12">
        <div class="space-y-4">
          <p class="text-xs font-semibold uppercase tracking-[0.38em] text-[#22D3EE]">Insights</p>
          <h2 class="text-2xl font-semibold leading-tight">Alles auf einen Blick – von Trends bis zur To-do-Liste.</h2>
          <p class="text-sm text-white/70">
            Unsere Scorecards bündeln Highlights, Risiken und Empfehlungen. So wissen Crews sofort, worauf sie sich konzentrieren.
          </p>
          <ul class="space-y-3 text-sm text-white/75">
            <li class="flex items-center gap-3">
              <v-icon icon="mdi-timer-sand" class="h-5 w-5 text-[#22D3EE]" />
              Priorisierte Quick Wins
            </li>
            <li class="flex items-center gap-3">
              <v-icon icon="mdi-target-variant" class="h-5 w-5 text-[#22D3EE]" />
              Präzise Trainingsziele
            </li>
            <li class="flex items-center gap-3">
              <v-icon icon="mdi-share-variant" class="h-5 w-5 text-[#22D3EE]" />
              Teilen mit Instruktor:innen & Teams
            </li>
          </ul>
        </div>

        <div class="relative grid gap-4 rounded-[28px] border border-white/10 bg-[#111832]/80 p-6">
          <div class="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="flex items-center justify-between text-xs text-white/60">
              <span>Session Review</span>
              <span class="flex items-center gap-2 text-[#22D3EE]">
                <v-icon icon="mdi-star" class="h-4 w-4" />
                92%
              </span>
            </div>
            <p class="text-sm font-semibold text-white/85">Phraseologie & Timing sitzen.</p>
            <p class="text-xs text-white/60">Zwei kurze Follow-ups empfohlen.</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-white/10 bg-[#141d38]/70 p-4 text-sm text-white/70">
              <p class="text-xs uppercase tracking-[0.28em] text-white/55">Radar Calls</p>
              <p class="mt-2 text-base font-semibold text-white">Stark</p>
              <p class="mt-1 text-xs text-white/55">98% richtig</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-[#141d38]/70 p-4 text-sm text-white/70">
              <p class="text-xs uppercase tracking-[0.28em] text-white/55">Next Steps</p>
              <p class="mt-2 text-base font-semibold text-white">Visual Patterns</p>
              <p class="mt-1 text-xs text-white/55">Neue Übung freigeschaltet</p>
            </div>
          </div>

          <div class="rounded-2xl border border-dashed border-white/15 bg-[#0E1630]/60 p-4 text-xs text-white/55">
            <p class="font-semibold text-white/80">Team-Notiz</p>
            <p class="mt-2">Crew 3 übernimmt Follow-up am Freitag – Export als PDF gesendet.</p>
          </div>
        </div>
      </section>

      <section class="space-y-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="text-2xl font-semibold">Kurzfeedback aus der Community</h2>
          <NuxtLink
            to="/present#testimonials"
            class="inline-flex items-center gap-2 text-sm font-semibold text-[#22D3EE] transition hover:text-[#17bad3]"
          >
            Mehr Stimmen hören
            <v-icon icon="mdi-arrow-right" class="h-5 w-5" />
          </NuxtLink>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <blockquote
            v-for="quote in communityQuotes"
            :key="quote.name"
            class="flex h-full flex-col justify-between rounded-[26px] border border-white/10 bg-[#111832]/80 p-6 text-sm text-white/75"
          >
            <p class="text-sm italic text-white/85">“{{ quote.message }}”</p>
            <footer class="mt-4 flex items-center justify-between text-xs text-white/55">
              <span>{{ quote.name }}</span>
              <span class="flex items-center gap-1 text-[#22D3EE]">
                <v-icon icon="mdi-compass" class="h-4 w-4" />
                {{ quote.role }}
              </span>
            </footer>
          </blockquote>
        </div>
      </section>

      <section class="rounded-[32px] border border-white/10 bg-gradient-to-r from-[#0E1630]/90 via-[#0E1630]/70 to-[#111832]/70 p-8 text-center shadow-[0_26px_90px_rgba(5,10,35,0.55)] sm:p-12">
        <div class="space-y-4">
          <p class="text-xs font-semibold uppercase tracking-[0.42em] text-[#22D3EE]">Ready when you are</p>
          <h2 class="text-2xl font-semibold sm:text-3xl">Feedback, das Lust auf den nächsten Flug macht.</h2>
          <p class="mx-auto max-w-2xl text-sm text-white/70">
            Schalte das Feedback Lab in deiner Crew frei und nutze präzise Auswertungen direkt nach jeder Session.
          </p>
          <div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <NuxtLink
              to="/invite"
              class="inline-flex items-center gap-2 rounded-2xl bg-[#22D3EE] px-6 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#17bad3]"
            >
              <v-icon icon="mdi-email-fast" class="h-5 w-5" />
              Einladung anfordern
            </NuxtLink>
            <NuxtLink
              to="/pm"
              class="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
            >
              <v-icon icon="mdi-message-text" class="h-5 w-5" />
              Fragen? Schreib uns
            </NuxtLink>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const feedbackModes = [
  {
    title: 'Quick Pulse',
    description: 'Zwei Minuten, drei Fragen. Ideal für schnelle Debriefs nach Checklisten.',
    icon: 'mdi-flash-outline',
    points: ['Skalierte Bewertung nach Classroom-Rubriken', 'Optionaler Voice-Comment', 'Automatischer Export ins Crew-Log'],
  },
  {
    title: 'Deep Dive',
    description: 'Geführte Analyse mit Leitfragen zu Phraseologie, Entscheidungen und Timing.',
    icon: 'mdi-radar',
    points: ['Highlight-Karten mit Emojis für Stimmung', 'Zeitmarken aus der Bridge-Session', 'Empfohlene Lernpfade im Classroom'],
  },
  {
    title: 'Crew Sync',
    description: 'Ein gemeinsamer Blick auf To-dos und Follow-ups – perfekt für feste Teams.',
    icon: 'mdi-account-multiple-check',
    points: ['Geteilte Notizen & Mentions', 'Reminder direkt im Bridge Desktop', 'PDF-Export mit Branding'],
  },
  {
    title: 'Instructor Review',
    description: 'Strukturierte Instructor-Noten mit Raum für persönliche Tipps und Video-Timestamps.',
    icon: 'mdi-teach',
    points: ['Konsistente Skalen für alle Klassen', 'Audio-Feedback aus der Classrom App', 'Freigabe an Lernende mit einem Klick'],
  },
];

const flowSteps = [
  {
    title: 'Kurzer Check-in',
    description: 'Wir starten mit den wichtigsten Parametern aus deiner Session.',
    icon: 'mdi-crosshairs-gps',
    meta: '1 Minute Fokus',
  },
  {
    title: 'Scorecards & Highlights',
    description: 'Skalierte Fragen und Emojis halten die Stimmung und den Fortschritt fest.',
    icon: 'mdi-star-three-points',
    meta: 'Leicht bewertbar',
  },
  {
    title: 'Actionable Wrap-up',
    description: 'Smarte Vorschläge, die automatisch im Classroom landen.',
    icon: 'mdi-clipboard-check-outline',
    meta: 'Next Steps fix',
  },
];

const communityQuotes = [
  {
    name: 'Sven, Approach',
    role: 'ATC',
    message: 'Das neue Layout spart uns beim Debrief locker fünf Minuten pro Flug.',
  },
  {
    name: 'Lena, Crew Lead',
    role: 'Instructor',
    message: 'Besonders die kurzen Stimmungsabfragen geben ein Gefühl, wie sich der Flug angefühlt hat.',
  },
  {
    name: 'Marvin, Tower',
    role: 'Pilot',
    message: 'Die Empfehlungen passen exakt zum Classroom-Content – fühlt sich wie ein Level-up an.',
  },
];

useHead({
  title: 'Feedback · OpenSquawk',
  meta: [
    {
      name: 'description',
      content: 'Modernisiertes Feedback-Board von OpenSquawk mit klaren Scorecards, Community-Zitaten und smarten Empfehlungen.',
    },
  ],
});
</script>

<style scoped>
.feedback-page {
  font-family: 'Inter', 'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
</style>
