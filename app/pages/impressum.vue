<template>
  <div class="min-h-screen bg-[#0b1020] text-white py-12 px-6">
    <div class="mx-auto max-w-3xl space-y-8">
      <header class="space-y-3">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Back to landing page
        </NuxtLink>
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Legal</p>
        <h1 class="text-3xl font-semibold">Legal notice</h1>
      </header>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Company details (§5 TMG)</h2>
        <div class="space-y-2 text-white/70">
          <p>Faktor Mensch MEDIA UG (limited liability)</p>
          <p>Wilhelm-Holzamer-Strasse 8</p>
          <p>55129 Mainz</p>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Represented by</h2>
        <p class="text-white/70">Managing directors: Dominik Ziegenhagel, Emanuel Leube</p>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Contact</h2>
        <div class="space-y-2 text-white/70">
          <p>Phone: +49 251 981 157 912 0</p>
          <p>Email: info@opensquawk.de</p>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Register entry</h2>
        <div class="space-y-2 text-white/70">
          <p>Commercial register: Amtsgericht Mainz</p>
          <p>Registration number: HRB 53322</p>
          <p>VAT ID: DE358028053</p>
        </div>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Content responsibility (§55 II RStV)</h2>
        <p class="text-white/70">Dominik Ziegenhagel, Emanuel Leube – address as above.</p>
      </section>

      <section class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 class="text-xl font-semibold">Disclaimer</h2>
        <p class="text-white/70">
          OpenSquawk provides training content for flight simulation. Use is at your own risk. We are not responsible for external links; the respective providers remain liable for their content.
        </p>
      </section>
    </div>
  </div>
</template>

