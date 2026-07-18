<template>
  <MarketingSeoLanding :page="page" />
</template>

<script setup lang="ts">
import type { SeoLandingData } from '~/components/marketing/SeoLanding.vue'

const page: SeoLandingData = {
  eyebrow: 'MSFS ATC training',
  headline: 'Real ATC training for Microsoft Flight Simulator.',
  sub: 'The default MSFS ATC does not prepare you for VATSIM. Train realistic radio communication alongside your MSFS flights and carry the confidence onto the network.',
  ctaText: 'Start free training',
  ctaHeadline: 'Fly MSFS today, fly VATSIM ready.',
  metaTitle: 'MSFS ATC Training — Realistic radio for Flight Simulator | OpenSquawk',
  metaDescription: 'Train realistic ATC communication for Microsoft Flight Simulator (MSFS). Practice clearances, readbacks and phraseology before flying on VATSIM.',
  problem: {
    title: 'The built-in MSFS ATC is not the real thing.',
    points: [
      'Menu-based ATC never trains you to speak',
      'The phraseology differs from live networks',
      'You still freeze the first time a human controller replies',
      'There is no feedback on what you did wrong',
    ],
  },
  example: {
    title: 'Realistic comms next to your MSFS session.',
    exchanges: [
      { from: 'You', text: 'Tower, DELGA, holding point runway 25, ready for departure.' },
      { from: 'ATC', text: 'DELGA, wind 240 degrees 8 knots, runway 25, cleared for takeoff.' },
      { from: 'You', text: 'Cleared for takeoff, runway 25, DELGA.' },
    ],
  },
  solution: {
    title: 'Bridge MSFS and the network.',
    points: [
      { icon: 'mdi-microsoft', title: 'MSFS-friendly', desc: 'Train the calls that matter for your MSFS flights and VATSIM sessions.' },
      { icon: 'mdi-connection', title: 'Sim connectors', desc: 'Open-source SimConnect connector on the roadmap for live flight data.' },
      { icon: 'mdi-speedometer', title: 'Ready score', desc: 'Track your progress toward being VATSIM-ready.' },
    ],
  },
  faq: [
    { q: 'Does it connect to MSFS directly?', a: 'The open-source SimConnect connector brings live flight data in; standalone radio training works without any connection.' },
    { q: 'Do I need VATSIM?', a: 'No. Train on your own, then take that confidence to the network whenever you are ready.' },
  ],
}
</script>
