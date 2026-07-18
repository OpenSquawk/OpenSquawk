<template>
  <div class="marketing-page min-h-screen">
    <MarketingHeader />

    <section class="marketing-hero border-b border-white/10">
      <div class="container-outer py-16 sm:py-20 md:py-24">
        <div class="mx-auto max-w-3xl text-center">
          <span class="chip chip-accent mb-4">Founding Supporter Deal &middot; first 100 accounts only</span>
          <h1 class="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            Become a Founder. Shape OpenSquawk.
          </h1>
          <p class="mx-auto mt-5 max-w-2xl text-base text-white/80 sm:text-lg">
            One payment, two years of Pro, and a permanent seat at the table. For the first 100 pilots
            who back the project early.
          </p>
          <div class="mt-8 inline-flex flex-col items-center gap-2 rounded-3xl border border-cyan-400/40 bg-[#0b1020]/60 px-8 py-6">
            <div class="flex items-baseline gap-2">
              <span class="text-5xl font-semibold">79 €</span>
              <span class="text-white/60">one-time</span>
            </div>
            <p class="text-sm text-cyan-100">First 100 accounts only</p>
          </div>
          <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <NuxtLink to="/login" class="btn btn-primary text-base">Become a Founder</NuxtLink>
            <NuxtLink to="/pricing" class="btn btn-ghost text-base">Compare plans</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-[#0b1020] py-16 sm:py-20">
      <div class="container-outer">
        <h2 class="text-3xl font-semibold sm:text-4xl">What Founders get</h2>
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="perk in perks" :key="perk.title" class="card">
            <v-icon :icon="perk.icon" size="24" class="text-cyan-300" />
            <h3 class="mt-3 text-lg font-semibold">{{ perk.title }}</h3>
            <p class="mt-2 text-sm text-white/70">{{ perk.desc }}</p>
          </article>
        </div>

        <div class="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-5 text-sm text-white/70">
          <strong class="text-white/90">Fair play:</strong> Lifetime Core Cloud access is included, but it does not
          include unlimited AI/voice usage. AI debriefing and premium voice minutes remain subject to fair-use limits
          so the platform stays sustainable for everyone.
        </div>
      </div>
    </section>

    <section class="border-y border-white/10 bg-[#0a0f1c] py-16 sm:py-20">
      <div class="container-outer max-w-3xl">
        <h2 class="text-3xl font-semibold sm:text-4xl">How it works after the Founder phase</h2>
        <p class="mt-4 text-white/75">
          The Founder deal is a one-time offer for the first 100 accounts. After the Founder phase, OpenSquawk Pro
          will be available as a monthly or yearly subscription. Founders keep their 24 months of Pro and their
          lifetime Core Cloud access regardless.
        </p>
        <NuxtLink to="/login" class="btn btn-primary mt-6">Claim your Founder spot</NuxtLink>
      </div>
    </section>

    <section class="border-t border-white/10 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent py-16 sm:py-20">
      <div class="container-outer text-center">
        <h2 class="text-3xl font-semibold sm:text-4xl">Only 100 Founder spots. Ever.</h2>
        <p class="mx-auto mt-3 max-w-xl text-white/80">Back the project early and lock in the best deal we'll offer.</p>
        <NuxtLink to="/login" class="btn btn-primary mt-7">Become a Founder</NuxtLink>
      </div>
    </section>

    <MarketingFooter />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

const perks = [
  { icon: 'mdi-star-circle-outline', title: '24 months of Pro', desc: 'Two full years of AI debriefing, premium voices, premium scenarios and your VATSIM-ready score.' },
  { icon: 'mdi-cloud-lock-outline', title: 'Lifetime Core Cloud access', desc: 'Keep hosted access to the core training platform for life (fair-use limits apply to AI/voice).' },
  { icon: 'mdi-shield-star-outline', title: 'Founder Badge', desc: 'A permanent badge on your profile marking you as an early supporter.' },
  { icon: 'mdi-vote-outline', title: 'Roadmap voting', desc: 'Direct say in what we build next. Founders help set priorities.' },
  { icon: 'mdi-flash-outline', title: 'Early access', desc: 'Try new scenarios, voices and features before anyone else.' },
  { icon: 'mdi-discord', title: 'Discord Founder role', desc: 'A dedicated role and channel in the community server.' },
]

useHead({
  title: 'Founder Deal — 79 € one-time, first 100 only | OpenSquawk',
  meta: [
    {
      name: 'description',
      content:
        'Become an OpenSquawk Founder: 79 € one-time for the first 100 accounts. Includes 24 months of Pro, lifetime Core Cloud access, Founder badge, roadmap voting and early access.',
    },
  ],
})
</script>
