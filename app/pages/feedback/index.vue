<template>
  <div class="relative min-h-screen bg-[#0B1020] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,187,215,0.12),transparent_55%)]"/>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(41,45,59,0.45),transparent_65%)]"/>

    <main class="relative mx-auto w-full max-w-5xl px-5 py-16 sm:px-7 lg:px-12">
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
            class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10 sm:w-auto"
        >
          <v-icon icon="mdi-school" class="h-5 w-5"/>
          Classroom entdecken
        </NuxtLink>
      </nav>

      <section class="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div class="space-y-6">
          <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#84E8F6]">
            <span class="h-1.5 w-1.5 rounded-full bg-[#16BBD7] shadow-[0_0_10px_rgba(22,187,215,0.9)]"/>
            Feedback
          </span>
          <div class="space-y-4">
            <h1 class="text-3xl font-semibold leading-tight sm:text-4xl">
              Sag uns, wie OpenSquawk sich anfühlt.
            </h1>
            <p class="text-sm text-white/75 sm:text-base">
              Dein Blick sorgt dafür, dass Bridge, Classroom und kommende ATC Sessions in der Praxis glänzen.
              Wir halten es leichtgewichtig, fokussiert und auf Augenhöhe – du entscheidest, wie viel du teilen möchtest.
            </p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <NuxtLink to="#share" class="btn btn-primary text-base">
              <v-icon icon="mdi-rocket-launch" size="20"/>
              Feedback abgeben
            </NuxtLink>
            <a
                href="mailto:info@opensquawk.de"
                class="btn btn-ghost text-base"
            >
              <v-icon icon="mdi-email-edit" size="20"/>
              Mail schicken
            </a>
          </div>
          <div class="grid gap-4 sm:grid-cols-2" id="share">
            <article
                v-for="item in quickActions"
                :key="item.id"
                class="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-[#111832]/80 p-6 shadow-[0_20px_60px_rgba(4,8,24,0.45)] transition hover:border-white/20 hover:shadow-[0_28px_75px_rgba(4,8,24,0.55)]"
            >
              <div class="space-y-4">
                <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[#16BBD7]">
                  <v-icon :icon="item.icon" class="h-6 w-6"/>
                </span>
                <div class="space-y-2">
                  <h2 class="text-lg font-semibold">{{ item.title }}</h2>
                  <p class="text-sm text-white/70">{{ item.description }}</p>
                </div>
              </div>
              <div class="mt-6">
                <NuxtLink
                    :to="item.href"
                    :external="item.external ?? true"
                    :target="(item.external ?? true) ? '_blank' : undefined"
                    :rel="(item.external ?? true) ? 'noopener' : undefined"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16BBD7] px-4 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#13a7c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72d9ea]"
                >
                  <v-icon :icon="item.ctaIcon" class="h-5 w-5"/>
                  {{ item.cta }}
                </NuxtLink>
              </div>
            </article>
          </div>
        </div>
        <aside class="rounded-3xl border border-white/10 bg-[#111832]/70 p-6 shadow-[0_24px_70px_rgba(4,8,24,0.55)] backdrop-blur">
          <div class="space-y-4">
            <h2 class="text-xl font-semibold">Was passiert mit deinem Input?</h2>
            <ul class="space-y-4 text-sm text-white/70">
              <li v-for="step in feedbackFlow" :key="step.id" class="flex gap-3">
                <span class="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/5 text-[#16BBD7] font-semibold">{{ step.id }}</span>
                <div>
                  <p class="font-semibold text-white">{{ step.title }}</p>
                  <p class="text-white/70">{{ step.description }}</p>
                </div>
              </li>
            </ul>
            <p class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
              Wir speichern nur das, was wir brauchen, und melden uns optional bei dir, wenn wir Rückfragen haben.
            </p>
          </div>
        </aside>
      </section>

      <section class="mt-16 space-y-6">
        <div class="space-y-2 text-center sm:text-left">
          <h2 class="text-2xl font-semibold">Formate, die Spaß machen</h2>
          <p class="mx-auto max-w-3xl text-sm text-white/70 sm:mx-0">
            Feedback darf leichtfüßig sein. Wir kombinieren kleine Impulse mit offenen Gesprächsrunden.
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
              v-for="format in formats"
              :key="format.id"
              class="rounded-3xl border border-white/10 bg-[#111832]/80 p-6 shadow-[0_18px_55px_rgba(4,8,24,0.45)] transition hover:border-white/20 hover:shadow-[0_26px_70px_rgba(4,8,24,0.55)]"
          >
            <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[#16BBD7]">
              <v-icon :icon="format.icon" class="h-6 w-6"/>
            </span>
            <p class="mt-4 text-base font-semibold">{{ format.title }}</p>
            <p class="mt-2 text-sm text-white/70">{{ format.description }}</p>
          </article>
        </div>
      </section>

      <section class="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div class="space-y-4">
          <h2 class="text-2xl font-semibold">Kleine Leitplanke für ehrliches Feedback</h2>
          <ul class="space-y-3 text-sm text-white/70">
            <li class="flex items-start gap-3">
              <v-icon icon="mdi-check-decagram" class="mt-[2px] h-5 w-5 text-[#16BBD7]"/>
              <span>Beschreibe kurz, was gut lief und wo es hakt – konkrete Beispiele helfen uns am meisten.</span>
            </li>
            <li class="flex items-start gap-3">
              <v-icon icon="mdi-emoticon-happy-outline" class="mt-[2px] h-5 w-5 text-[#16BBD7]"/>
              <span>Teile Feelings: Wie hat sich der Flow angefühlt? War etwas überraschend einfach oder schwer?</span>
            </li>
            <li class="flex items-start gap-3">
              <v-icon icon="mdi-shield-alert" class="mt-[2px] h-5 w-5 text-[#16BBD7]"/>
              <span>Keine Idee zu klein. Feature-Snippets oder Textkorrekturen fließen direkt in die nächste Runde ein.</span>
            </li>
          </ul>
        </div>
        <div class="rounded-3xl border border-white/10 bg-[#111832]/80 p-6 shadow-[0_24px_70px_rgba(4,8,24,0.55)]">
          <h3 class="text-xl font-semibold">Direkt loslegen?</h3>
          <p class="mt-2 text-sm text-white/70">
            Wir aktualisieren regelmäßig unsere kurzen Feedback-Formulare. Starte mit dem aktuellen Sprint-Check.
          </p>
          <NuxtLink
              :to="surveyLink"
              external
              target="_blank"
              rel="noopener"
              class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16BBD7] px-4 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#13a7c4]"
          >
            <v-icon icon="mdi-form-select" class="h-5 w-5"/>
            Sprint Feedback öffnen
          </NuxtLink>
          <p class="mt-3 text-xs text-white/60">
            Dauer: ca. {{ surveyDuration }} Minuten. Du kannst jederzeit abbrechen.
          </p>
        </div>
      </section>

      <section class="mt-20 rounded-[32px] border border-white/10 bg-gradient-to-r from-[#121a38]/95 via-[#111832]/80 to-[#151b3a]/95 p-8 shadow-[0_28px_90px_rgba(4,8,24,0.6)]">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-3 max-w-3xl">
            <h2 class="text-2xl font-semibold">Lust auf einen gemeinsamen Deep Dive?</h2>
            <p class="text-sm text-white/70">
              Wir veranstalten monatliche Open Flight Labs. Kleine Crew, lockere Sessions, live UX/UI-Iterationen.
            </p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row">
            <NuxtLink
                to="/present"
                class="btn btn-primary text-base"
            >
              <v-icon icon="mdi-account-group" size="20"/>
              Zur Anmeldung
            </NuxtLink>
            <NuxtLink
                to="/news"
                class="btn btn-ghost text-base"
            >
              <v-icon icon="mdi-newspaper-variant-outline" size="20"/>
              Updates lesen
            </NuxtLink>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const quickActions = [
  {
    id: 1,
    title: 'Kurz und knackig',
    description: 'Zwei Fragen, ein Stimmungsbarometer. Ideal nach einem Testflug oder einer Classroom-Session.',
    href: 'https://airtable.com/shrQ8nciFeedbackPulse',
    cta: 'Mini-Umfrage starten',
    ctaIcon: 'mdi-timer-sand',
    icon: 'mdi-flash'
  },
  {
    id: 2,
    title: 'Roadmap voten',
    description: 'Markiere Feature-Ideen mit Priorität und füge deine Notizen direkt hinzu.',
    href: 'https://airtable.com/shrRoadmapSignal',
    cta: 'Board öffnen',
    ctaIcon: 'mdi-trello',
    icon: 'mdi-clipboard-check'
  },
  {
    id: 3,
    title: 'Voice Drop',
    description: 'Schick uns eine kurze Sprachnachricht – ideal für Radio-Readbacks oder spontane Ideen.',
    href: 'https://www.speakpipe.com/opensquawk',
    cta: 'Voice Recorder starten',
    ctaIcon: 'mdi-microphone-message',
    icon: 'mdi-microphone-message'
  },
  {
    id: 4,
    title: 'Community Talk',
    description: 'Join das Discord-Hangar-Feedback-Board und diskutiere live mit dem Team.',
    href: 'https://discord.gg/opensquawk',
    cta: 'Discord öffnen',
    ctaIcon: 'mdi-discord',
    icon: 'mdi-chat-processing'
  }
];

const feedbackFlow = [
  {
    id: 1,
    title: 'Sortieren',
    description: 'Wir labeln dein Feedback nach Produkt, Kontext und Stimmung, damit es dort landet, wo es helfen kann.'
  },
  {
    id: 2,
    title: 'Bewerten',
    description: 'Das Team checkt Impact und Aufwand, formuliert schnelle Fixes oder nimmt es in den Sprint auf.'
  },
  {
    id: 3,
    title: 'Antworten',
    description: 'Du bekommst auf Wunsch ein kurzes Update, sobald etwas live geht oder mehr Details gebraucht werden.'
  }
];

const formats = [
  {
    id: 1,
    title: 'Flight Notes',
    description: 'Kurze Notizzettel im Sim: druck sie aus oder nutz den digitalen Block direkt im Browser.',
    icon: 'mdi-note-text'
  },
  {
    id: 2,
    title: 'Micro Interviews',
    description: '15 Minuten Video-Call, Fokus auf einem Feature. Wir protokollieren live, du bekommst eine Zusammenfassung.',
    icon: 'mdi-video-account'
  },
  {
    id: 3,
    title: 'Classroom Replay',
    description: 'Wir hören gemeinsam deine Aufnahme, markieren Highlights und Stolpersteine und planen den nächsten Drill.',
    icon: 'mdi-replay'
  },
  {
    id: 4,
    title: 'Design Crit Walkthrough',
    description: 'Wir zeigen aktuelle Mockups, du kommentierst direkt via Figma oder FigJam.',
    icon: 'mdi-drawing-box'
  },
  {
    id: 5,
    title: 'Async Loom Drop',
    description: 'Nimm deinen Bildschirm mit Stimme auf – perfekt, um Edge Cases oder Bugs zu zeigen.',
    icon: 'mdi-video-plus'
  },
  {
    id: 6,
    title: 'Office Hour Huddle',
    description: 'Offene Runde im Discord, kurze Agenda, viel Q&A. Bringe dein Thema oder hör einfach zu.',
    icon: 'mdi-account-group-outline'
  }
];

const surveyLink = 'https://airtable.com/shrSprintFeedback';
const surveyDuration = 4;
</script>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition;
}

.btn-primary {
  @apply border border-transparent bg-[#16BBD7] text-[#0B1020] shadow-[0_12px_35px_rgba(22,187,215,0.35)] hover:bg-[#13a7c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72d9ea];
}

.btn-ghost {
  @apply border border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10;
}
</style>
