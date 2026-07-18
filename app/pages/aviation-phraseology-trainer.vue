<template>
  <MarketingSeoLanding :page="page" />
</template>

<script setup lang="ts">
import type { SeoLandingData } from '~/components/marketing/SeoLanding.vue'

const page: SeoLandingData = {
  eyebrow: 'Phraseology trainer',
  headline: 'Speak standard phraseology, not everyday English.',
  sub: 'Controllers expect the words in the right order. Train standard aviation phraseology — the numbers, the readbacks, the callsign at the end — until it comes out clean under pressure.',
  ctaText: 'Train phraseology',
  ctaHeadline: 'Sound like you have done this a hundred times.',
  metaTitle: 'Aviation Phraseology Trainer — Standard R/T | OpenSquawk',
  metaDescription: 'Train standard aviation phraseology: numbers, readbacks, standard words and callsign placement. Practice until clean R/T is automatic.',
  problem: {
    title: 'Plain English gives you away on frequency.',
    points: [
      'You say "okay" instead of "wilco" or "roger"',
      'Numbers come out as everyday English, not aviation format',
      'You forget to end the transmission with your callsign',
      'You use twice as many words as you need to',
    ],
  },
  example: {
    title: 'The same message, in standard phraseology.',
    exchanges: [
      { from: 'ATC', text: 'DELGA, descend to altitude 4000 feet, reduce speed 180 knots.' },
      { from: 'You', text: 'Descend altitude 4000 feet, speed 180 knots, DELGA.' },
      { from: 'ATC', text: 'DELGA, contact Tower 118.7, good day.' },
    ],
  },
  solution: {
    title: 'Build clean R/T habits.',
    points: [
      { icon: 'mdi-numeric', title: 'Number & format drills', desc: 'Say altitudes, headings, frequencies and squawks the aviation way.' },
      { icon: 'mdi-comment-check-outline', title: 'Standard words', desc: 'Roger, wilco, affirm, standby, readback — used correctly and in context.' },
      { icon: 'mdi-scissors-cutting', title: 'Say it in fewer words', desc: 'Learn the concise structure controllers actually expect.' },
    ],
  },
  faq: [
    { q: 'Is this ICAO phraseology?', a: 'Scenarios follow standard ICAO-style R/T with notes on regional differences where relevant.' },
    { q: 'Good for real-world students too?', a: 'It is training software for simulators and networks, but the phraseology habits carry over to study. It is not a substitute for a real-world instructor.' },
  ],
}
</script>
