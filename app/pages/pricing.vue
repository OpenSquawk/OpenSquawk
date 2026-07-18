<template>
  <div class="marketing-page min-h-screen">
    <MarketingHeader />

    <!-- Hero -->
    <section class="marketing-hero border-b border-white/10">
      <div class="container-outer py-16 sm:py-20 md:py-24">
        <div class="mx-auto max-w-3xl text-center">
          <span class="chip chip-accent mb-4">Pricing</span>
          <h1 class="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            Train now for free. Go VATSIM-ready with Pro.
          </h1>
          <p class="mx-auto mt-5 max-w-2xl text-base text-white/80 sm:text-lg">
            Start on the free plan, no credit card. Upgrade when you want AI debriefing, premium voices
            and your VATSIM-ready score. Self-hosting the open-source core stays free forever.
          </p>
          <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <NuxtLink to="#cta" class="btn btn-primary">Start free training</NuxtLink>
            <NuxtLink to="/self-host-vs-cloud" class="btn btn-ghost">Compare self-host vs cloud</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Founder banner -->
    <section class="border-b border-white/10 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent">
      <div class="container-outer py-6">
        <NuxtLink
          to="/founder"
          class="flex flex-col items-start justify-between gap-4 rounded-3xl border border-cyan-400/30 bg-[#0b1020]/50 px-6 py-5 transition hover:border-cyan-300/60 sm:flex-row sm:items-center"
        >
          <div>
            <span class="chip chip-accent mb-2">Founding Supporter Deal &middot; first 100 accounts only</span>
            <p class="text-lg font-semibold">79 € one-time &middot; 24 months Pro + lifetime Core Cloud access</p>
            <p class="mt-1 text-sm text-white/70">Lock in early. Lifetime does not include unlimited AI/voice usage.</p>
          </div>
          <span class="btn btn-primary whitespace-nowrap">
            Become a Founder
            <v-icon icon="mdi-arrow-right" size="18" />
          </span>
        </NuxtLink>
      </div>
    </section>

    <!-- Plans -->
    <section class="bg-[#0b1020] py-16 sm:py-20">
      <div class="container-outer">
        <div class="grid items-stretch gap-6 lg:grid-cols-3 xl:gap-7">
          <article
            v-for="plan in plans"
            :id="plan.id"
            :key="plan.id"
            class="card pricing-card relative flex h-full flex-col scroll-mt-24"
            :class="plan.highlight ? 'pricing-card--highlight' : ''"
          >
            <div v-if="plan.badge" class="absolute -top-3 right-4 chip" :class="plan.highlight ? 'chip-accent' : ''">
              {{ plan.badge }}
            </div>
            <div class="flex flex-1 flex-col">
              <h3 class="text-2xl font-semibold">{{ plan.name }}</h3>
              <p class="mt-2 text-sm text-white/70">{{ plan.tagline }}</p>
              <div class="mt-6 flex items-baseline gap-1">
                <span class="text-3xl font-semibold sm:text-4xl">{{ plan.price }}</span>
                <span v-if="plan.per" class="text-sm text-white/60">{{ plan.per }}</span>
              </div>
              <ul class="mt-6 flex-1 space-y-2.5 text-sm">
                <li v-for="f in plan.features" :key="f" class="flex items-start gap-3 text-white/80">
                  <v-icon icon="mdi-check-circle" size="18" class="mt-[2px] text-emerald-400" />
                  <span>{{ f }}</span>
                </li>
              </ul>
              <NuxtLink
                :to="plan.ctaTo"
                class="btn mt-8 w-full"
                :class="plan.highlight ? 'btn-primary' : 'btn-ghost'"
              >
                {{ plan.cta }}
              </NuxtLink>
            </div>
          </article>
        </div>

        <!-- Secondary plans -->
        <div class="mt-6 grid gap-6 md:grid-cols-2">
          <article
            v-for="plan in secondaryPlans"
            :id="plan.id"
            :key="plan.id"
            class="card pricing-card flex flex-col scroll-mt-24 sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h3 class="text-xl font-semibold">{{ plan.name }}</h3>
              <p class="mt-1 text-sm text-white/70">{{ plan.tagline }}</p>
              <div class="mt-3 flex items-baseline gap-1">
                <span class="text-2xl font-semibold">{{ plan.price }}</span>
                <span v-if="plan.per" class="text-sm text-white/60">{{ plan.per }}</span>
              </div>
            </div>
            <NuxtLink :to="plan.ctaTo" class="btn btn-ghost whitespace-nowrap">{{ plan.cta }}</NuxtLink>
          </article>
        </div>

        <p class="mt-8 text-center text-xs text-white/50">
          Prices in EUR incl. applicable VAT. Fair-use limits apply to AI debriefing and premium voice minutes on all
          plans. Lifetime Core Cloud access does not include unlimited AI/voice usage.
        </p>
      </div>
    </section>

    <!-- VATSIM-ready funnel proof -->
    <section class="border-y border-white/10 bg-[#0a0f1c] py-16 sm:py-20">
      <div class="container-outer grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <span class="marketing-eyebrow">After your first session</span>
          <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">See exactly what's holding you back.</h2>
          <p class="mt-4 text-white/75">
            Every training session ends with a score and a breakdown. Free shows you where you stand.
            Pro unlocks the full debrief so you can fix it fast.
          </p>
          <NuxtLink to="#cta" class="btn btn-primary mt-6">Start free training</NuxtLink>
        </div>
        <div class="card">
          <div class="flex items-center justify-between">
            <span class="text-sm text-white/60">VATSIM-ready score</span>
            <span class="text-2xl font-semibold text-cyan-300">58%</span>
          </div>
          <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-cyan-400" style="width: 58%"></div>
          </div>
          <p class="mt-5 text-sm font-medium text-white/80">Common issues</p>
          <ul class="mt-2 space-y-2 text-sm text-white/70">
            <li class="flex items-center gap-2"><v-icon icon="mdi-alert-circle-outline" size="16" class="text-amber-300" /> Missed readback item</li>
            <li class="flex items-center gap-2"><v-icon icon="mdi-alert-circle-outline" size="16" class="text-amber-300" /> Wrong altitude phraseology</li>
            <li class="flex items-center gap-2"><v-icon icon="mdi-alert-circle-outline" size="16" class="text-amber-300" /> Delayed response</li>
          </ul>
          <div class="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            Unlock the full debriefing with OpenSquawk Pro.
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="bg-[#0b1020] py-16 sm:py-20">
      <div class="container-outer">
        <h2 class="text-3xl font-semibold sm:text-4xl">Pricing FAQ</h2>
        <div class="mt-8 grid gap-5 md:grid-cols-2">
          <article v-for="item in faq" :key="item.q" class="card">
            <h3 class="font-semibold">{{ item.q }}</h3>
            <p class="mt-2 text-sm text-white/75">{{ item.a }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section id="cta" class="border-t border-white/10 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent py-16 sm:py-20">
      <div class="container-outer text-center">
        <h2 class="text-3xl font-semibold sm:text-4xl">Ready to stop freezing on frequency?</h2>
        <p class="mx-auto mt-3 max-w-xl text-white/80">
          Start free, no credit card. Practice readbacks until they feel automatic.
        </p>
        <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <NuxtLink to="/login" class="btn btn-primary">Start free training</NuxtLink>
          <NuxtLink to="/founder" class="btn btn-ghost">See the Founder deal</NuxtLink>
        </div>
      </div>
    </section>

    <MarketingFooter />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

interface Plan {
  id: string
  name: string
  tagline: string
  price: string
  per?: string
  features: string[]
  cta: string
  ctaTo: string
  badge?: string
  highlight?: boolean
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Start training today, no credit card.',
    price: '0 €',
    features: [
      'Core radio training scenarios',
      'Readback & phraseology drills',
      'Basic session score',
      'Community support',
    ],
    cta: 'Start free',
    ctaTo: '/login',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Everything you need to walk onto VATSIM with confidence.',
    price: '12,99 €',
    per: '/ month',
    features: [
      'Everything in Starter',
      'AI debriefing after every session',
      'VATSIM-ready score & error analysis',
      'Premium voice models',
      'Premium scenario packs',
      'Progress tracking',
    ],
    cta: 'Become VATSIM-ready',
    ctaTo: '/founder',
    badge: 'Most popular',
    highlight: true,
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For steady, everyday practice.',
    price: '6,99 €',
    per: '/ month',
    features: [
      'Everything in Free',
      'Full scenario library',
      'Cloud progress sync',
      'Premium voices (fair-use)',
    ],
    cta: 'Start training',
    ctaTo: '/login',
  },
]

const secondaryPlans: Plan[] = [
  {
    id: 'club',
    name: 'Club',
    tagline: 'For virtual airlines, flight schools and groups.',
    price: '29 €',
    per: '/ month',
    features: [],
    cta: 'For groups',
    ctaTo: 'mailto:info@opensquawk.de?subject=OpenSquawk%20Club%20plan',
  },
  {
    id: 'instructor',
    name: 'Instructor / Commercial',
    tagline: 'Teach with OpenSquawk or use it commercially.',
    price: 'from 99 €',
    per: '/ month',
    features: [],
    cta: 'Contact us',
    ctaTo: 'mailto:info@opensquawk.de?subject=OpenSquawk%20Commercial%20license',
  },
]

const faq = [
  {
    q: 'Is there really a free plan?',
    a: 'Yes. You can train core radio scenarios for free with no credit card. Paid plans add AI debriefing, premium voices, premium scenarios and your VATSIM-ready score.',
  },
  {
    q: 'What is the difference between self-hosting and Cloud?',
    a: 'The open-source core is free to self-host for basic radio training. The official Cloud adds easy setup, premium voices, AI debriefing, progress tracking and premium scenarios. See the self-host vs cloud comparison.',
  },
  {
    q: 'Does the Founder deal include unlimited AI usage?',
    a: 'No. The Founder deal includes 24 months of Pro plus lifetime Core Cloud access, but AI debriefing and premium voice minutes remain subject to fair-use limits.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Monthly plans can be cancelled at any time and remain active until the end of the billing period.',
  },
]

useHead({
  title: 'Pricing — Free, Pro & Founder plans | OpenSquawk',
  meta: [
    {
      name: 'description',
      content:
        'OpenSquawk pricing: train free, upgrade to Pro (12,99 €/mo) for AI debriefing, premium voices and your VATSIM-ready score. Self-hosting the open-source core stays free.',
    },
  ],
})
</script>
