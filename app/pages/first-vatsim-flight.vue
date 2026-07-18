<template>
  <MarketingSeoLanding :page="page" />
</template>

<script setup lang="ts">
import type { SeoLandingData } from '~/components/marketing/SeoLanding.vue'

const page: SeoLandingData = {
  eyebrow: 'First VATSIM flight',
  headline: 'Scared of your first VATSIM flight? Practice the radio first.',
  sub: 'Your first push-to-talk moment feels like a test. It does not have to. Rehearse the whole flight — clearance to landing — before a real controller ever hears you.',
  ctaText: 'Start free training',
  ctaHeadline: 'Make your first VATSIM flight less stressful.',
  metaTitle: 'Your First VATSIM Flight — Practice the radio first | OpenSquawk',
  metaDescription: 'Nervous about your first VATSIM flight? Rehearse clearance, taxi, tower and approach calls with feedback so your first live flight feels calm.',
  problem: {
    title: 'The first flight is stressful for almost everyone.',
    points: [
      'You do not know what to say when the controller calls you',
      'You are worried about embarrassing yourself on frequency',
      'You keep postponing your first connection',
      'Tutorials explain theory but never let you practice out loud',
    ],
  },
  example: {
    title: 'Your first call, rehearsed until it is boring.',
    exchanges: [
      { from: 'You', text: 'Ground, DELGA, stand 12, request pushback and start, information Charlie.' },
      { from: 'ATC', text: 'DELGA, pushback and start approved, expect runway 25.' },
      { from: 'You', text: 'Pushback and start approved, runway 25, DELGA.' },
    ],
  },
  solution: {
    title: 'Go from anxious to ready.',
    points: [
      { icon: 'mdi-airplane-takeoff', title: 'Full-flight scenarios', desc: 'Rehearse every phase from clearance delivery to landing clearance.' },
      { icon: 'mdi-repeat', title: 'Safe repetition', desc: 'Repeat any call as many times as you need. No one is listening but you.' },
      { icon: 'mdi-emoticon-happy-outline', title: 'Lose the fear', desc: 'Build muscle memory so your first live flight feels familiar.' },
    ],
  },
  faq: [
    { q: 'How long until I feel ready?', a: 'Most beginners feel noticeably calmer after a handful of short sessions. Your VATSIM-ready score tells you when.' },
    { q: 'Will controllers know I am new?', a: 'On VATSIM you can always say "student pilot". OpenSquawk just makes sure the words come out cleanly when it matters.' },
  ],
}
</script>
