<template>
  <MarketingSeoLanding :page="page" />
</template>

<script setup lang="ts">
import type { SeoLandingData } from '~/components/marketing/SeoLanding.vue'

const page: SeoLandingData = {
  eyebrow: 'IFR clearance practice',
  headline: 'Nail your IFR clearance readback every time.',
  sub: 'The IFR clearance comes fast and full of detail. Drill the CRAFT structure — clearance limit, route, altitude, frequency, transponder — until the readback is automatic.',
  ctaText: 'Practice IFR clearances',
  ctaHeadline: 'Read back a full IFR clearance without missing an item.',
  metaTitle: 'IFR Clearance Practice — Drill the readback | OpenSquawk',
  metaDescription: 'Practice IFR clearance readbacks with the CRAFT structure. Drill route, altitude, frequency and squawk until you never miss an item.',
  problem: {
    title: 'The IFR clearance is where readbacks fall apart.',
    points: [
      'It arrives fast and packed with numbers',
      'You miss the squawk or the initial altitude',
      'You are not sure which items must be read back',
      'You write it down but still stumble on the readback',
    ],
  },
  example: {
    title: 'A full IFR clearance, drilled item by item.',
    exchanges: [
      { from: 'ATC', text: 'DELGA, cleared to Munich, flight planned route, climb initially 5000 feet, expect FL240 ten minutes after departure, departure frequency 121.20, squawk 5501.' },
      { from: 'You', text: 'Cleared to Munich, flight planned route, climb 5000 feet, expect FL240 ten minutes after departure, departure 121.20, squawk 5501, DELGA.' },
      { from: 'ATC', text: 'DELGA, readback correct, report ready for start.' },
    ],
  },
  solution: {
    title: 'Turn the CRAFT readback into muscle memory.',
    points: [
      { icon: 'mdi-clipboard-list-outline', title: 'CRAFT drills', desc: 'Focused reps on clearance limit, route, altitude, frequency and transponder.' },
      { icon: 'mdi-magnify-scan', title: 'Missed-item detection', desc: 'Feedback highlights the exact item you dropped from the readback.' },
      { icon: 'mdi-map-marker-path', title: 'Real departures', desc: 'Practice with SID-based clearances from real airports.' },
    ],
  },
  faq: [
    { q: 'Which clearance items must I read back?', a: 'The mandatory items and altitude/heading/frequency/squawk are drilled explicitly, so you learn the required readback, not just a guess.' },
    { q: 'Is this VFR too?', a: 'This page focuses on IFR clearances, but OpenSquawk covers VFR phraseology as well.' },
  ],
}
</script>
