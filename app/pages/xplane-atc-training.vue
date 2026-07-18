<template>
  <MarketingSeoLanding :page="page" />
</template>

<script setup lang="ts">
import type { SeoLandingData } from '~/components/marketing/SeoLanding.vue'

const page: SeoLandingData = {
  eyebrow: 'X-Plane ATC training',
  headline: 'Realistic ATC training for X-Plane pilots.',
  sub: 'X-Plane models the aircraft beautifully — but not the radio you will use on VATSIM. Train clearances, readbacks and phraseology so the comms are as sharp as your flying.',
  ctaText: 'Start free training',
  ctaHeadline: 'Match your X-Plane skills with sharp radio work.',
  metaTitle: 'X-Plane ATC Training — Realistic radio practice | OpenSquawk',
  metaDescription: 'Train realistic ATC communication for X-Plane. Practice clearances, readbacks and phraseology before flying on VATSIM.',
  problem: {
    title: 'Great flying, shaky radio.',
    points: [
      'X-Plane has no realistic ATC training built in',
      'You can hand-fly an approach but stumble on the frequency change',
      'You have never practiced the calls out loud',
      'Networks feel intimidating without rehearsal',
    ],
  },
  example: {
    title: 'The approach call, rehearsed.',
    exchanges: [
      { from: 'ATC', text: 'DELGA, turn left heading 090, descend 3000 feet, cleared ILS approach runway 07.' },
      { from: 'You', text: 'Left heading 090, descend 3000 feet, cleared ILS runway 07, DELGA.' },
      { from: 'ATC', text: 'DELGA, contact Tower 118.7.' },
    ],
  },
  solution: {
    title: 'Train the comms that X-Plane leaves out.',
    points: [
      { icon: 'mdi-airplane', title: 'X-Plane-friendly', desc: 'Practice the radio work alongside your X-Plane flights.' },
      { icon: 'mdi-connection', title: 'Open connectors', desc: 'X-Plane connector on the open-source roadmap for live data.' },
      { icon: 'mdi-check-decagram-outline', title: 'Feedback', desc: 'See exactly which readback items you missed and fix them fast.' },
    ],
  },
  faq: [
    { q: 'Does OpenSquawk support X-Plane?', a: 'Standalone radio training works with any simulator. An open-source X-Plane connector for live flight data is on the roadmap.' },
    { q: 'Is it free?', a: 'Yes, you can train core scenarios for free. Pro adds AI debriefing, premium voices and your VATSIM-ready score.' },
  ],
}
</script>
