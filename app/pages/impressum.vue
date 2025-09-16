<template>
  <div class="min-h-screen bg-[#0b1020] text-white py-12 px-6">
    <div class="mx-auto max-w-3xl space-y-8">
      <header class="space-y-3">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Zurück zur Startseite
        </NuxtLink>
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Rechtliches</p>
        <h1 class="text-3xl font-semibold">Impressum</h1>
      </header>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Angaben gemäß § 5 TMG</h2>
        <div class="space-y-2 text-white/70">
          <p>OpenSquawk UG (haftungsbeschränkt)</p>
          <p>Musterstraße 12</p>
          <p>10115 Berlin</p>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Vertreten durch</h2>
        <p class="text-white/70">Geschäftsführer: Leonie Wagner</p>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Kontakt</h2>
        <div class="space-y-2 text-white/70">
          <p>E-Mail: hallo@opensquawk.dev</p>
          <p>Telefon: +49 (0)30 1234 5678</p>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Registereintrag</h2>
        <div class="space-y-2 text-white/70">
          <p>Amtsgericht Berlin Charlottenburg</p>
          <p>HRB 245678 B</p>
          <p>USt-IdNr.: DE345678912</p>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p class="text-white/70">Leonie Wagner, Anschrift wie oben.</p>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Haftungsausschluss</h2>
        <p class="text-white/70">
          OpenSquawk stellt Trainingsinhalte für Flugsimulatoren bereit. Die Nutzung erfolgt eigenverantwortlich. Für Inhalte externer Links übernehmen wir keine Haftung; für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
        </p>
      </section>
    </div>
  </div>
</template>

