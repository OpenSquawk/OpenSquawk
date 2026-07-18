<template>
  <MarketingSeoLanding :page="page" />
</template>

<script setup lang="ts">
import type { SeoLandingData } from '~/components/marketing/SeoLanding.vue'

const page: SeoLandingData = {
  eyebrow: 'VATSIM anxiety',
  headline: 'Stop freezing on frequency.',
  sub: 'Radio anxiety is normal — and it fades fast with practice. Rehearse real calls in private, at your own pace, until the fear turns into routine.',
  ctaText: 'Start free training',
  ctaHeadline: 'Turn the fear into routine.',
  metaTitle: 'VATSIM Anxiety — Beat radio nerves | OpenSquawk',
  metaDescription: 'Nervous about talking on VATSIM? Beat radio anxiety by rehearsing real ATC calls in private, at your own pace, until the fear becomes routine.',
  problem: {
    title: 'The fear is real, but it is beatable.',
    points: [
      'Your heart races the moment you have to transmit',
      'You rehearse the call, then blank when it is your turn',
      'You avoid controlled airports to avoid the radio',
      'You have been "about to try VATSIM" for months',
    ],
  },
  example: {
    title: 'Rehearse the moment you dread — safely.',
    exchanges: [
      { from: 'ATC', text: 'DELGA, radar contact, climb flight level 100.' },
      { from: 'You', text: 'Climb flight level 100, DELGA.' },
      { from: 'ATC', text: 'DELGA, roger.' },
    ],
  },
  solution: {
    title: 'Practice removes the pressure.',
    points: [
      { icon: 'mdi-shield-check-outline', title: 'Private & judgment-free', desc: 'No live frequency, no audience. Just you and the mic.' },
      { icon: 'mdi-repeat-variant', title: 'Repeat until calm', desc: 'Run the same call again and again until your heart rate drops.' },
      { icon: 'mdi-trending-up', title: 'Visible progress', desc: 'Watch your VATSIM-ready score climb — proof you are improving.' },
    ],
  },
  faq: [
    { q: 'Will this really help my nerves?', a: 'Anxiety fades with familiarity. Rehearsing real calls in private is the fastest way to make the live moment feel ordinary.' },
    { q: 'Where do I start?', a: 'Start free, pick a beginner scenario, and repeat one call until it feels easy. Then move to the next.' },
  ],
}
</script>
