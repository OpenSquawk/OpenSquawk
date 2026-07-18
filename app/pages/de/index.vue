<template>
  <div class="min-h-screen bg-[#0b1020] text-white">
    <header class="border-b border-white/10 bg-[#070b16]/90">
      <div class="container-outer flex min-h-16 items-center justify-between gap-4">
        <NuxtLink to="/de" class="flex items-center gap-2 text-lg font-semibold">
          <v-icon icon="mdi-radar" class="text-cyan-400" />
          OpenSquawk
        </NuxtLink>
        <nav class="flex items-center gap-3 text-sm">
          <NuxtLink to="/" hreflang="en" class="text-white/65 hover:text-cyan-300">English</NuxtLink>
          <NuxtLink to="/login" class="btn btn-ghost">Login</NuxtLink>
        </nav>
      </div>
    </header>

    <main>
      <section class="hero relative overflow-hidden border-b border-white/10">
        <div class="hero-image" />
        <div class="hero-overlay" />
        <div class="container-outer relative z-10 flex min-h-[620px] items-end py-16 sm:py-24">
          <div class="max-w-3xl">
            <p class="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">ATC-Training für Flugsimulator-Piloten</p>
            <h1 class="text-4xl font-semibold leading-tight sm:text-6xl md:text-7xl">Sprich sicher, bevor du auf VATSIM funkt.</h1>
            <p class="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Trainiere realistische Phraseologie, Readbacks und komplette Funkabläufe in einer geschützten Lernumgebung – mit direktem Feedback und klarer Progression.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <NuxtLink to="/#cta" class="btn btn-primary">Zur Warteliste</NuxtLink>
              <NuxtLink to="/news" class="btn btn-ghost">Neuigkeiten lesen</NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <section class="py-16 sm:py-24">
        <div class="container-outer">
          <div class="max-w-2xl">
            <p class="eyebrow">So funktioniert OpenSquawk</p>
            <h2 class="section-title">Vom ersten Funkspruch bis zum vollständigen Flug.</h2>
          </div>
          <div class="mt-10 grid gap-5 md:grid-cols-3">
            <article class="card">
              <v-icon icon="mdi-school-outline" size="34" class="text-cyan-300" />
              <h3>Classroom</h3>
              <p>Geführte Übungen erklären Phraseologie, lassen dich zuhören und bewerten deine Readbacks direkt.</p>
            </article>
            <article class="card">
              <v-icon icon="mdi-radio-handheld" size="34" class="text-cyan-300" />
              <h3>Live ATC</h3>
              <p>Ein Echtzeit-Funkablauf reagiert auf deine Übertragungen und begleitet deinen Simulatorflug.</p>
            </article>
            <article class="card">
              <v-icon icon="mdi-source-branch" size="34" class="text-cyan-300" />
              <h3>Offen und selbst hostbar</h3>
              <p>Der Kern ist Open Source. Du kannst den Stack prüfen, erweitern und kostenlos selbst betreiben.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="border-y border-white/10 bg-[#0a0f1c] py-16 sm:py-24">
        <div class="container-outer grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p class="eyebrow">Für deinen ersten Onlineflug</p>
            <h2 class="section-title">Üben ohne Frequenzdruck.</h2>
            <p class="mt-5 text-white/70">Fehler gehören zum Training. OpenSquawk gibt dir Raum zum Wiederholen, bevor andere Piloten und Controller zuhören.</p>
          </div>
          <ul class="grid gap-4 sm:grid-cols-2">
            <li class="benefit"><v-icon icon="mdi-check-circle" /> Strukturierte Szenarien</li>
            <li class="benefit"><v-icon icon="mdi-check-circle" /> Sofortiges Feedback</li>
            <li class="benefit"><v-icon icon="mdi-check-circle" /> Realistische Phraseologie</li>
            <li class="benefit"><v-icon icon="mdi-check-circle" /> Simulator-Integration</li>
          </ul>
        </div>
      </section>

      <section class="py-16 sm:py-24" id="faq">
        <div class="container-outer">
          <p class="eyebrow">Häufige Fragen</p>
          <h2 class="section-title">FAQ</h2>
          <div class="mt-10 grid gap-5 md:grid-cols-2">
            <article v-for="item in faq" :key="item.question" class="card">
              <h3>{{ item.question }}</h3>
              <p>{{ item.answer }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="border-t border-white/10 bg-cyan-400/10 py-16 text-center">
        <div class="container-outer">
          <h2 class="text-3xl font-semibold sm:text-4xl">Bereit für deinen nächsten Funkspruch?</h2>
          <p class="mx-auto mt-4 max-w-2xl text-white/75">OpenSquawk befindet sich in der Einladungs-Alpha. Trage dich ein und erhalte Zugang, sobald der nächste Platz frei wird.</p>
          <NuxtLink to="/#cta" class="btn btn-primary mt-7">Zur Warteliste</NuxtLink>
        </div>
      </section>
    </main>

    <footer class="border-t border-white/10 bg-[#070b16] py-10 text-sm text-white/60">
      <div class="container-outer flex flex-col justify-between gap-4 sm:flex-row">
        <span>© {{ new Date().getFullYear() }} OpenSquawk · Nicht für die reale Luftfahrt.</span>
        <div class="flex gap-5">
          <NuxtLink to="/impressum" class="hover:text-cyan-300">Impressum</NuxtLink>
          <NuxtLink to="/datenschutz" class="hover:text-cyan-300">Datenschutz</NuxtLink>
          <NuxtLink to="/agb" class="hover:text-cyan-300">AGB</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const faq = [
  { question: 'Ist Classroom aktuell kostenlos?', answer: 'Ja. Classroom ist während der Einladungs-Alpha aktuell kostenlos.' },
  { question: 'Was ist der Unterschied zwischen Classroom und Live ATC?', answer: 'Classroom bietet strukturierte Hör-, Readback- und Feedbackübungen. Live ATC ist der Echtzeit-Funk für den Flugsimulator und befindet sich in der geschlossenen Alpha.' },
  { question: 'Muss ich bei VATSIM angemeldet sein?', answer: 'Nein. OpenSquawk bereitet dich auf VATSIM vor, damit du vor dem ersten Onlineflug sicher üben kannst.' },
  { question: 'Kann ich OpenSquawk selbst hosten?', answer: 'Ja. Der Kern ist Open Source und kann kostenlos selbst gehostet werden.' },
  { question: 'Wie erhalte ich Zugang?', answer: 'Trage dich in die Warteliste für Classroom und Live ATC ein. Einladungen werden schrittweise freigeschaltet.' },
  { question: 'Ist OpenSquawk für die reale Luftfahrt gedacht?', answer: 'Nein. OpenSquawk ist Trainingssoftware für Flugsimulatoren und nicht für echten Flugfunk vorgesehen.' },
]
</script>

<style scoped>
.container-outer { @apply mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8; }
.hero { background: #070b16; }
.hero-image { @apply absolute inset-0; background: url('/img/learn/missions/full-flight/briefing-hero.png') center 45% / cover no-repeat; }
.hero-overlay { @apply absolute inset-0; background: linear-gradient(180deg, rgba(7,11,22,.22), rgba(7,11,22,.92)), linear-gradient(90deg, rgba(7,11,22,.75), transparent); }
.btn { @apply inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition; }
.btn-primary { @apply bg-cyan-400 text-[#061018] hover:bg-cyan-300; }
.btn-ghost { @apply border border-white/15 bg-white/5 text-white hover:border-cyan-300/50 hover:text-cyan-200; }
.eyebrow { @apply text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300; }
.section-title { @apply mt-3 text-3xl font-semibold leading-tight sm:text-5xl; }
.card { @apply rounded-2xl border border-white/10 bg-white/[.055] p-6; }
.card h3 { @apply mt-4 text-lg font-semibold; }
.card p { @apply mt-2 leading-relaxed text-white/70; }
.benefit { @apply flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.055] p-5 text-white/85; }
.benefit :deep(.v-icon) { @apply text-cyan-300; }
</style>
