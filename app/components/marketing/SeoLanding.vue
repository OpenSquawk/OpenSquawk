<template>
  <div class="marketing-page min-h-screen">
    <MarketingHeader />

    <!-- Hero -->
    <section class="marketing-hero border-b border-white/10">
      <div class="container-outer py-16 sm:py-20 md:py-24">
        <div class="max-w-3xl">
          <span class="chip chip-accent mb-4">{{ page.eyebrow }}</span>
          <h1 class="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">{{ page.headline }}</h1>
          <p class="mt-5 max-w-2xl text-base text-white/80 sm:text-lg">{{ page.sub }}</p>
          <div class="mt-7 flex flex-col gap-3 sm:flex-row">
            <NuxtLink to="/login" class="btn btn-primary">{{ page.ctaText || 'Start free training' }}</NuxtLink>
            <NuxtLink to="/pricing" class="btn btn-ghost">View pricing</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Problem -->
    <section class="bg-[#0b1020] py-16 sm:py-20">
      <div class="container-outer max-w-4xl">
        <span class="marketing-eyebrow">The problem</span>
        <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">{{ page.problem.title }}</h2>
        <ul class="mt-6 grid gap-3 sm:grid-cols-2">
          <li v-for="p in page.problem.points" :key="p" class="glass rounded-xl px-4 py-3 text-sm text-white/85">
            <span class="inline-flex items-start gap-3">
              <v-icon icon="mdi-alert-circle-outline" size="18" class="mt-[2px] text-cyan-300" />
              <span>{{ p }}</span>
            </span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Example exchange -->
    <section class="border-y border-white/10 bg-[#0a0f1c] py-16 sm:py-20">
      <div class="container-outer max-w-3xl">
        <span class="marketing-eyebrow">What it sounds like</span>
        <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">{{ page.example.title }}</h2>
        <div class="mt-6 space-y-3">
          <div
            v-for="(line, i) in page.example.exchanges"
            :key="i"
            class="card flex gap-3"
            :class="line.from === 'ATC' ? '' : 'border-cyan-400/30'"
          >
            <span
              class="mt-[2px] inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-wide"
              :class="line.from === 'ATC' ? 'bg-white/10 text-white/70' : 'bg-cyan-500/20 text-cyan-200'"
            >
              {{ line.from }}
            </span>
            <p class="text-sm text-white/85">{{ line.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Solution -->
    <section class="bg-[#0b1020] py-16 sm:py-20">
      <div class="container-outer">
        <span class="marketing-eyebrow">The OpenSquawk way</span>
        <h2 class="mt-3 text-3xl font-semibold sm:text-4xl">{{ page.solution.title }}</h2>
        <div class="mt-8 grid gap-5 md:grid-cols-3">
          <article v-for="item in page.solution.points" :key="item.title" class="card">
            <v-icon :icon="item.icon" size="24" class="text-cyan-300" />
            <h3 class="mt-3 text-lg font-semibold">{{ item.title }}</h3>
            <p class="mt-2 text-sm text-white/70">{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section v-if="page.faq?.length" class="border-y border-white/10 bg-[#0a0f1c] py-16 sm:py-20">
      <div class="container-outer">
        <h2 class="text-3xl font-semibold sm:text-4xl">FAQ</h2>
        <div class="mt-8 grid gap-5 md:grid-cols-2">
          <article v-for="item in page.faq" :key="item.q" class="card">
            <h3 class="font-semibold">{{ item.q }}</h3>
            <p class="mt-2 text-sm text-white/75">{{ item.a }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="border-t border-white/10 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent py-16 sm:py-20">
      <div class="container-outer text-center">
        <h2 class="text-3xl font-semibold sm:text-4xl">{{ page.ctaHeadline }}</h2>
        <p class="mx-auto mt-3 max-w-xl text-white/80">Start free, no credit card. Practice until it feels automatic.</p>
        <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <NuxtLink to="/login" class="btn btn-primary">{{ page.ctaText || 'Start free training' }}</NuxtLink>
          <NuxtLink to="/founder" class="btn btn-ghost">See the Founder deal</NuxtLink>
        </div>
      </div>
    </section>

    <MarketingFooter />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

export interface SeoLandingData {
  eyebrow: string
  headline: string
  sub: string
  ctaText?: string
  ctaHeadline: string
  metaTitle: string
  metaDescription: string
  problem: { title: string; points: string[] }
  example: { title: string; exchanges: { from: string; text: string }[] }
  solution: { title: string; points: { icon: string; title: string; desc: string }[] }
  faq?: { q: string; a: string }[]
}

const props = defineProps<{ page: SeoLandingData }>()

useHead({
  title: props.page.metaTitle,
  meta: [{ name: 'description', content: props.page.metaDescription }],
})
</script>
