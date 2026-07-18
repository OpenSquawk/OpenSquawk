<template>
  <div class="marketing-page min-h-screen">
    <MarketingHeader />

    <section class="marketing-hero border-b border-white/10">
      <div class="container-outer py-16 sm:py-20 md:py-24">
        <div class="mx-auto max-w-3xl text-center">
          <span class="chip chip-accent mb-4">Self-host vs Cloud</span>
          <h1 class="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            Why pay if it's open source?
          </h1>
          <p class="mx-auto mt-5 max-w-2xl text-base text-white/80 sm:text-lg">
            Because setup, premium voices, AI debriefing and progress tracking take real infrastructure to run.
            Self-hosting is for builders. Cloud is for pilots who just want to train.
          </p>
        </div>
      </div>
    </section>

    <section class="bg-[#0b1020] py-16 sm:py-20">
      <div class="container-outer">
        <div class="overflow-x-auto rounded-2xl border border-white/10">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th class="text-center">Self-host Free</th>
                <th class="text-center">Official Cloud</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.feature">
                <td>{{ row.feature }}</td>
                <td class="text-center">
                  <span :class="cellClass(row.selfHost)">{{ cellText(row.selfHost) }}</span>
                </td>
                <td class="text-center">
                  <span :class="cellClass(row.cloud)">{{ cellText(row.cloud) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-8 grid gap-6 md:grid-cols-2">
          <article class="card">
            <v-icon icon="mdi-wrench-outline" size="24" class="text-cyan-300" />
            <h3 class="mt-3 text-xl font-semibold">Self-hosting is for builders</h3>
            <p class="mt-2 text-sm text-white/70">
              Clone the repo, run Docker, adapt the training engine and build your own scenarios. Free forever under AGPLv3.
              You bring your own keys, infrastructure and time.
            </p>
            <a :href="GITHUB_URL" target="_blank" rel="noopener" class="btn btn-ghost mt-5">View on GitHub</a>
          </article>
          <article class="card pricing-card pricing-card--highlight">
            <v-icon icon="mdi-cloud-check-outline" size="24" class="text-cyan-300" />
            <h3 class="mt-3 text-xl font-semibold">Cloud is for pilots who just want to train</h3>
            <p class="mt-2 text-sm text-white/70">
              No setup. Premium voices, AI debriefing, your VATSIM-ready score and progress tracking, ready in minutes.
              We keep it running so you can focus on flying.
            </p>
            <NuxtLink to="/pricing" class="btn btn-primary mt-5">See cloud pricing</NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <section class="border-t border-white/10 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent py-16 sm:py-20">
      <div class="container-outer text-center">
        <h2 class="text-3xl font-semibold sm:text-4xl">Start training in the cloud in minutes.</h2>
        <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <NuxtLink to="/login" class="btn btn-primary">Start free training</NuxtLink>
          <NuxtLink to="/open-source" class="btn btn-ghost">Learn about the open core</NuxtLink>
        </div>
      </div>
    </section>

    <MarketingFooter />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

const GITHUB_URL = 'https://github.com/OpenSquawk/OpenSquawk'

// 2 = yes, 1 = limited, 0 = no
type Cell = 0 | 1 | 2

const rows: { feature: string; selfHost: Cell; cloud: Cell }[] = [
  { feature: 'Basic radio training', selfHost: 2, cloud: 2 },
  { feature: 'Local scenarios', selfHost: 2, cloud: 2 },
  { feature: 'Sim integration', selfHost: 2, cloud: 2 },
  { feature: 'Easy setup', selfHost: 0, cloud: 2 },
  { feature: 'Premium voices', selfHost: 0, cloud: 2 },
  { feature: 'AI debriefing', selfHost: 0, cloud: 2 },
  { feature: 'Progress tracking', selfHost: 1, cloud: 2 },
  { feature: 'VATSIM-ready score', selfHost: 0, cloud: 2 },
  { feature: 'Premium scenarios', selfHost: 0, cloud: 2 },
  { feature: 'Support', selfHost: 1, cloud: 2 },
]

const cellText = (c: Cell) => (c === 2 ? '✓' : c === 1 ? 'Limited' : '—')
const cellClass = (c: Cell) => (c === 2 ? 'yes text-lg' : c === 1 ? 'text-amber-300 text-sm font-medium' : 'no text-lg')

useHead({
  title: 'Self-host vs Cloud | OpenSquawk',
  meta: [
    {
      name: 'description',
      content:
        'Compare self-hosting the open-source OpenSquawk core with the official Cloud: easy setup, premium voices, AI debriefing, progress tracking and your VATSIM-ready score.',
    },
  ],
})
</script>
