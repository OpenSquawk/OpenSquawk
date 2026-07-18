<template>
  <MarketingSeoLanding :page="page" />
</template>

<script setup lang="ts">
import type { SeoLandingData } from '~/components/marketing/SeoLanding.vue'

const page: SeoLandingData = {
  eyebrow: 'VATSIM radio training',
  headline: 'Practice VATSIM radio before you key the mic.',
  sub: 'Most pilots know the procedures but freeze on the words. Train clearances, readbacks and phraseology in a safe place until they feel automatic.',
  ctaText: 'Start free training',
  ctaHeadline: 'Walk onto the network prepared.',
  metaTitle: 'VATSIM Radio Training — Practice ATC comms | OpenSquawk',
  metaDescription: 'Practice VATSIM radio communication before your first live flight. Train clearances, readbacks and phraseology with feedback and a VATSIM-ready score.',
  problem: {
    title: 'The network is not the place to learn the radio.',
    points: [
      'You freeze the moment the controller calls your callsign',
      'You know the procedure but not the exact words',
      'You are scared of blocking a busy frequency',
      'Live feedback from real controllers is stressful and rare',
    ],
  },
  example: {
    title: 'A clearance, the way you will actually hear it.',
    exchanges: [
      { from: 'ATC', text: 'Speedbird 24, cleared to Frankfurt via BUB1G departure, runway 25R, climb 5000 feet, squawk 4711.' },
      { from: 'You', text: 'Cleared to Frankfurt, BUB1G departure, runway 25R, climb 5000 feet, squawk 4711, Speedbird 24.' },
      { from: 'ATC', text: 'Speedbird 24, readback correct.' },
    ],
  },
  solution: {
    title: 'Train the radio, not just the theory.',
    points: [
      { icon: 'mdi-format-list-checks', title: 'Structured scenarios', desc: 'Clearance, taxi, tower and approach scenarios that mirror real VATSIM flows.' },
      { icon: 'mdi-check-decagram-outline', title: 'Instant feedback', desc: 'See missed readback items and phraseology errors right after each call.' },
      { icon: 'mdi-speedometer', title: 'VATSIM-ready score', desc: 'Know exactly when you are ready to go live — no guessing.' },
    ],
  },
  faq: [
    { q: 'Do I need to be on VATSIM already?', a: 'No. OpenSquawk is training you do beforehand so your first live flight is calm and confident.' },
    { q: 'Is it free?', a: 'Yes, you can train core radio scenarios for free. Pro adds AI debriefing, premium voices and your VATSIM-ready score.' },
  ],
}
</script>
