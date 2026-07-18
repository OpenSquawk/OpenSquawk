<template>
  <div class="marketing-page min-h-screen">
    <MarketingHeader />

    <section class="marketing-hero border-b border-white/10">
      <div class="container-outer py-16 sm:py-20 md:py-24">
        <div class="mx-auto max-w-3xl">
          <span class="chip chip-accent mb-4">Open source</span>
          <h1 class="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            Open-source core. Hosted training platform.
          </h1>
          <p class="mt-5 max-w-2xl text-base text-white/80 sm:text-lg">
            The OpenSquawk training engine and simulator integrations are open source. Our hosted cloud,
            premium scenarios, AI feedback, voices and team features fund ongoing development.
          </p>
          <div class="mt-7 flex flex-col gap-3 sm:flex-row">
            <a :href="GITHUB_URL" target="_blank" rel="noopener" class="btn btn-primary">
              <v-icon icon="mdi-github" size="20" />
              View on GitHub
            </a>
            <NuxtLink to="/self-host-vs-cloud" class="btn btn-ghost">Self-host vs Cloud</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- What's open / closed -->
    <section class="bg-[#0b1020] py-16 sm:py-20">
      <div class="container-outer">
        <h2 class="text-3xl font-semibold sm:text-4xl">What's open, what's commercial</h2>
        <p class="mt-3 max-w-2xl text-white/75">
          We are honest about the boundary. The parts that drive adoption are open. The parts that cost us money
          to run and fund the project are commercial.
        </p>

        <div class="mt-8 overflow-x-auto rounded-2xl border border-white/10">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Open?</th>
                <th>License</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in matrix" :key="row.area">
                <td>{{ row.area }}</td>
                <td>
                  <span :class="row.open ? 'yes' : 'no'">{{ row.open ? 'Yes' : 'No' }}</span>
                </td>
                <td class="text-white/70">{{ row.license }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="mt-4 text-sm text-white/60">
          We say <strong class="text-white/80">open-source core</strong> &mdash; not &ldquo;fully open source&rdquo;.
          That distinction keeps us credible and keeps the project funded.
        </p>
      </div>
    </section>

    <!-- Repo structure -->
    <section class="border-y border-white/10 bg-[#0a0f1c] py-16 sm:py-20">
      <div class="container-outer">
        <h2 class="text-3xl font-semibold sm:text-4xl">The repositories</h2>
        <p class="mt-3 max-w-2xl text-white/75">
          Core, SDK and connectors are public so anyone can self-host, build plugins and add simulator integrations.
        </p>
        <div class="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <article v-for="repo in repos" :key="repo.name" class="card">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-mono text-sm font-semibold text-cyan-200">{{ repo.name }}</h3>
              <span class="chip text-[10px]" :class="repo.public ? 'chip-accent' : 'opacity-70'">
                {{ repo.public ? 'Public' : 'Private' }}
              </span>
            </div>
            <p class="mt-2 text-sm text-white/70">{{ repo.desc }}</p>
            <p class="mt-3 text-xs text-white/50">License: {{ repo.license }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Licensing docs -->
    <section class="bg-[#0b1020] py-16 sm:py-20">
      <div class="container-outer grid gap-6 md:grid-cols-3">
        <a :href="`${GITHUB_URL}/blob/main/LICENSE`" target="_blank" rel="noopener" class="card transition hover:border-cyan-400/40">
          <v-icon icon="mdi-scale-balance" size="24" class="text-cyan-300" />
          <h3 class="mt-3 font-semibold">AGPL-3.0</h3>
          <p class="mt-2 text-sm text-white/70">The core training engine is copyleft. Self-host, modify and share alike.</p>
        </a>
        <a :href="`${GITHUB_URL}/blob/main/COMMERCIAL.md`" target="_blank" rel="noopener" class="card transition hover:border-cyan-400/40">
          <v-icon icon="mdi-office-building-outline" size="24" class="text-cyan-300" />
          <h3 class="mt-3 font-semibold">Commercial use</h3>
          <p class="mt-2 text-sm text-white/70">Hosted platform, premium content, cloud and instructor features require a paid plan.</p>
        </a>
        <a :href="`${GITHUB_URL}/blob/main/TRADEMARK.md`" target="_blank" rel="noopener" class="card transition hover:border-cyan-400/40">
          <v-icon icon="mdi-registered-trademark" size="24" class="text-cyan-300" />
          <h3 class="mt-3 font-semibold">Trademark policy</h3>
          <p class="mt-2 text-sm text-white/70">You may fork the code. You may not run a competing hosted service under the OpenSquawk brand.</p>
        </a>
      </div>
    </section>

    <section class="border-t border-white/10 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent py-16 sm:py-20">
      <div class="container-outer text-center">
        <h2 class="text-3xl font-semibold sm:text-4xl">Self-hosting is for builders. Cloud is for pilots.</h2>
        <p class="mx-auto mt-3 max-w-xl text-white/80">
          Run the open-source core yourself, or let us host it so you can just train.
        </p>
        <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <a :href="GITHUB_URL" target="_blank" rel="noopener" class="btn btn-ghost">Self-host the core</a>
          <NuxtLink to="/pricing" class="btn btn-primary">See cloud pricing</NuxtLink>
        </div>
      </div>
    </section>

    <MarketingFooter />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

const GITHUB_URL = 'https://github.com/OpenSquawk/OpenSquawk'

const matrix = [
  { area: 'Core Training Engine', open: true, license: 'AGPLv3' },
  { area: 'SDK / Plugin API', open: true, license: 'Apache-2.0' },
  { area: 'Simulator Connectors', open: true, license: 'Apache-2.0' },
  { area: 'Basic Scenarios', open: true, license: 'CC BY 4.0 / AGPL' },
  { area: 'Hosted Cloud', open: false, license: 'Commercial' },
  { area: 'AI Feedback', open: false, license: 'Commercial' },
  { area: 'Premium Scenarios', open: false, license: 'Commercial' },
  { area: 'Billing / Accounts', open: false, license: 'Commercial' },
  { area: 'OpenSquawk brand', open: false, license: 'Trademark' },
]

const repos = [
  { name: 'opensquawk-core', public: true, license: 'AGPLv3', desc: 'The open-source training engine. Self-host for basic radio training.' },
  { name: 'opensquawk-sdk', public: true, license: 'Apache-2.0', desc: 'JS & Python SDKs so anyone can build scenarios and add-ons without copyleft worries.' },
  { name: 'opensquawk-connectors', public: true, license: 'Apache-2.0', desc: 'MSFS SimConnect, X-Plane, FSUIPC, SimBrief and VATSIM data connectors.' },
  { name: 'opensquawk-scenarios-basic', public: true, license: 'CC BY 4.0 / AGPL', desc: 'A starter library of open training scenarios.' },
  { name: 'opensquawk-cloud', public: false, license: 'Commercial', desc: 'Login, billing, teams, subscriptions, usage limits and hosted sessions.' },
  { name: 'opensquawk-ai-service', public: false, license: 'Commercial', desc: 'Prompts, scoring, feedback logic and STT/TTS routing — our moat.' },
]

useHead({
  title: 'Open Source — Open-source core, hosted platform | OpenSquawk',
  meta: [
    {
      name: 'description',
      content:
        'OpenSquawk has an open-source core under AGPLv3. Core engine, SDK and simulator connectors are open. Hosted cloud, AI feedback and premium content are commercial.',
    },
  ],
})
</script>
