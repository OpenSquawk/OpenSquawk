<template>
  <div class="min-h-screen bg-[#0b1020] text-white py-12 px-6">
    <div class="mx-auto max-w-4xl space-y-8">
      <header class="space-y-3">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Back to landing page
        </NuxtLink>
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Legal</p>
        <h1 class="text-3xl font-semibold">Privacy Notice</h1>
        <p class="text-white/70">Updated: {{ lastUpdated }}</p>
      </header>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">1. Controller</h2>
        <p class="text-white/70">
          The data controller under the GDPR is Faktor Mensch MEDIA UG (limited liability), Wilhelm-Holzamer-Strasse 8,
          55129 Mainz, Germany. Managing directors: Dominik Ziegenhagel, Emanuel Leube. Telephone: +49 251 981 157 912 0.
          Email: info@opensquawk.de.
        </p>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">2. Data we process</h2>
        <ul class="list-disc space-y-2 pl-6 text-white/70">
          <li><strong>Waitlist:</strong> Name (optional), email, optional notes, time of signup, consent records.</li>
          <li><strong>Feature updates:</strong> Email, optional name, opt-in timestamp and marketing consent.</li>
          <li><strong>User accounts:</strong> Name, email, password hash, invitation status, creation/login timestamps, invitation history.</li>
          <li><strong>Roadmap suggestions:</strong> Title, description, optional contact address, consent flags and timestamps.</li>
          <li><strong>Communications:</strong> All radio inputs (typed or push-to-talk transcripts, normalized text, metadata such as module, lesson ID, signal strength, decision context).</li>
          <li><strong>Technical logs:</strong> Device details (browser, OS), timestamps, request IDs, error logs.</li>
        </ul>
        <p class="text-xs text-white/50">Note: Raw audio from push-to-talk is processed temporarily only. Transcripts and context data are stored to improve quality.</p>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">3. Purpose & legal basis</h2>
        <ul class="space-y-3 text-white/70">
          <li><strong>Service delivery (Art. 6(1)(b) GDPR):</strong> Managing waitlist entries, accounts and sessions, issuing invitation codes, preparing billing for future paid plans.</li>
          <li><strong>Product improvement & security (Art. 6(1)(f) GDPR):</strong> Analysing and logging radio interactions, monitoring errors, preventing abuse.</li>
          <li><strong>Communication & community feedback (Art. 6(1)(a) GDPR):</strong> Sending waitlist or product updates after consent and evaluating roadmap suggestions including optional follow-up.</li>
        </ul>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">4. Retention</h2>
        <ul class="space-y-2 text-white/70">
          <li>Waitlist entries: until withdrawal or 24 months after the last activity.</li>
          <li>Feature updates: until you unsubscribe or withdraw consent.</li>
          <li>Roadmap suggestions: until implemented or at most 18 months after submission.</li>
          <li>Account data: for the lifetime of the account and thereafter according to statutory retention periods.</li>
          <li>Communication logs: at least 12 months for quality assurance; longer if needed to resolve support cases or investigate abuse.</li>
        </ul>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">5. Sharing & processors</h2>
        <p class="text-white/70">
          OpenSquawk runs on European cloud infrastructure (currently Hetzner Cloud, Germany). Communication data resides in our MongoDB database. External AI providers (e.g. OpenAI) receive only pseudonymised text to power TTS/LLM features. Appropriate processing agreements are in place. Transfers to third countries rely on EU Standard Contractual Clauses where necessary.
        </p>
        <p class="text-xs text-white/60">
          Note: Form submissions (waitlist, feature updates, roadmap suggestions) trigger an internal notification email to info@opensquawk.de via our SMTP or transactional provider. We only forward the details you submit so we can respond quickly.
        </p>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">6. Your rights</h2>
        <ul class="list-disc space-y-2 pl-6 text-white/70">
          <li>Access, rectification, erasure and restriction (Art. 15–18 GDPR).</li>
          <li>Data portability (Art. 20 GDPR).</li>
          <li>Objection to processing based on legitimate interest (Art. 21 GDPR).</li>
          <li>Withdrawal of consent with future effect.</li>
          <li>Complaint to a supervisory authority, e.g. the Berlin Commissioner for Data Protection and Freedom of Information.</li>
        </ul>
      </section>

      <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">7. Contact</h2>
        <p class="text-white/70">
          To exercise your rights please email info@opensquawk.de. Provide the email address registered with OpenSquawk and, if applicable, additional identifiers (e.g. VATSIM ID) so we can verify your request.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const lastUpdated = new Date('2025-09-17').toLocaleDateString('en-US')
</script>

<style scoped>
.chip {
  @apply inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-medium text-cyan-200;
}
</style>

