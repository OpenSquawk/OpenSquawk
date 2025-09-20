<template>
  <div class="min-h-screen bg-[#0b1020] text-white py-12 px-6">
    <div class="mx-auto max-w-4xl space-y-8">
      <header class="space-y-3">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Back to landing page
        </NuxtLink>
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Legal</p>
        <h1 class="text-3xl font-semibold">Terms of Service (TOS)</h1>
        <p class="text-white/70">Updated: {{ lastUpdated }}</p>
      </header>

      <section v-for="section in sections" :key="section.title" class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-xl font-semibold">{{ section.title }}</h2>
        <div class="space-y-2 text-white/70">
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          <ul v-if="section.list" class="list-disc space-y-1 pl-6">
            <li v-for="item in section.list" :key="item">{{ item }}</li>
          </ul>
        </div>
      </section>

      <footer class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        <p>Questions about these terms? Email us at info@opensquawk.dev. We provide tailored contracts for enterprise or training programmes on request.</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const lastUpdated = new Date('2025-09-17').toLocaleDateString('en-US')

const sections = [
  {
    title: '1. Scope',
    paragraphs: [
      'These terms govern the use of the OpenSquawk platform (the “Service”), operated by Faktor Mensch MEDIA UG (limited liability). Conflicting user terms only apply if agreed to in writing.',
    ],
  },
  {
    title: '2. Registration & Invitation Codes',
    paragraphs: [
      'Accounts require a valid invitation code. Codes are personal, time-limited and must not be sold or shared without permission.',
    ],
    list: [
      'A waitlist spot does not guarantee immediate access.',
      'Active users may generate up to two invitation codes after 14 days.',
      'We may revoke codes if abuse is suspected.',
    ],
  },
  {
    title: '3. Service Description',
    paragraphs: [
      'OpenSquawk provides AI-assisted communication simulation for flight simulators, including push-to-talk processing, text-to-speech, training modules and integrations. The service is strictly for training purposes and must not be used for real-world aviation.',
    ],
  },
  {
    title: '4. User Responsibilities',
    list: [
      'Keep login credentials confidential and do not share them.',
      'Do not transmit unlawful, harmful or offensive content.',
      'Avoid excessive load or attempts to circumvent security measures.',
      'Back up local recordings or data independently.',
    ],
    paragraphs: [
      'We reserve the right to suspend or terminate accounts that breach these terms.',
    ],
  },
  {
    title: '5. Logging & Analytics',
    paragraphs: [
      'To improve quality we log all radio interactions—text or push-to-talk transcripts—together with metadata such as module, decision path and signal strength. By using the service you consent to this processing.',
    ],
  },
  {
    title: '6. Pricing & Payment',
    paragraphs: [
      'Hosted plans may incur subscription fees disclosed before purchase. Fees are billed monthly in advance. Overdue payments may lead to account suspension.',
    ],
  },
  {
    title: '7. Term & Cancellation',
    paragraphs: [
      'Free accounts can be deleted at any time. Paid plans run month-to-month with a seven-day notice period to month-end unless agreed otherwise. Cancellations must be submitted in writing or via email.',
    ],
  },
  {
    title: '8. Warranty & Liability',
    paragraphs: [
      'OpenSquawk is provided as an alpha service. We do not guarantee uninterrupted availability or absolute accuracy. Liability is limited to intent, gross negligence, or injury to life, body or health.',
    ],
  },
  {
    title: '9. Changes to the Terms',
    paragraphs: [
      'We may amend these terms with at least 14 days’ notice. Continued use after the effective date constitutes acceptance of the updated terms.',
    ],
  },
  {
    title: '10. Governing Law',
    paragraphs: [
      'These terms are governed by German law. The place of jurisdiction for merchants is Berlin. If any clause is invalid, the remaining provisions remain effective.',
    ],
  },
]
</script>

