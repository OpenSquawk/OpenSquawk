<template>
  <div class="relative min-h-screen bg-[#0B1020] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,187,215,0.12),transparent_55%)]"/>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.18),transparent_65%)]"/>

    <div class="relative mx-auto w-full max-w-6xl px-6 py-12 lg:px-12">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <NuxtLink
          to="/"
          class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10 sm:w-auto"
        >
          <span aria-hidden="true">←</span>
          Back to opensquawk.de
        </NuxtLink>
        <NuxtLink
          to="/bridge/connect"
          class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#292D3B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#353a4c] sm:w-auto"
        >
          Already have a token?
        </NuxtLink>
      </div>

      <header class="mt-10 space-y-4 text-center sm:text-left">
        <span class="inline-flex items-center gap-2 rounded-full bg-[#16BBD7]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.45em] text-[#16BBD7]">Bridge</span>
        <h1 class="text-3xl font-semibold sm:text-4xl">Download the OpenSquawk Bridge</h1>
        <p class="max-w-3xl text-sm text-white/70">
          Pick the build for your simulator and let the desktop Bridge handle the rest. Tokens, login, and live status are all baked in.
        </p>
      </header>

      <div class="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section class="space-y-6">
          <div class="rounded-3xl border border-white/10 bg-[#111832]/80 p-8 shadow-[0_30px_80px_rgba(5,10,30,0.55)] backdrop-blur">
            <h2 class="text-xl font-semibold">Downloads</h2>
            <p class="mt-2 text-sm text-white/70">Short and sweet. Click, install, fly.</p>

            <div class="mt-6 grid gap-5 md:grid-cols-2">
              <article
                v-for="item in downloads"
                :key="item.id"
                class="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-[#0B132A]/80 p-6 transition hover:border-white/20 hover:shadow-[0_25px_60px_rgba(12,18,40,0.5)]"
              >
                <div class="space-y-4">
                  <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-[#16BBD7]">
                    <svg
                      v-if="item.icon === 'plane'"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      class="h-6 w-6"
                    >
                      <path d="M2 13l10-3 10 3" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M12 10V3" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M12 14v7" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M7 21l5-7 5 7" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg
                      v-else-if="item.icon === 'future'"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      class="h-6 w-6"
                    >
                      <path d="M12 3l3 6 6 1-4.5 4.3L18 21l-6-3-6 3 1.5-6.7L3 10l6-1z" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      class="h-6 w-6"
                    >
                      <path d="M4 17l8-11 8 11" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M4 7h16" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M4 12h16" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>

                  <div class="space-y-2">
                    <span
                      class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.35em]"
                      :class="item.available ? 'bg-[#16BBD7]/20 text-[#16BBD7]' : 'bg-white/10 text-white/60'"
                    >
                      {{ item.badge }}
                    </span>
                    <h3 class="text-lg font-semibold">{{ item.title }}</h3>
                    <p class="text-sm text-white/65">{{ item.description }}</p>
                  </div>
                </div>

                <div class="mt-6">
                  <a
                    v-if="item.available"
                    :href="item.href"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16BBD7] px-4 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#13a7c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72d9ea]"
                  >
                    <span aria-hidden="true">⇩</span>
                    Download
                  </a>
                  <button
                    v-else
                    type="button"
                    disabled
                    class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#292D3B] px-4 py-3 text-sm font-semibold text-white/70 opacity-80"
                  >
                    <span aria-hidden="true">⏳</span>
                    Coming soon
                  </button>
                </div>
              </article>
            </div>
          </div>

          <div class="rounded-3xl border border-white/10 bg-[#111832]/70 p-8 shadow-[0_20px_60px_rgba(4,8,24,0.45)] backdrop-blur">
            <h2 class="text-xl font-semibold">How it works</h2>
            <ol class="mt-6 space-y-4 text-sm text-white/70">
              <li v-for="step in steps" :key="step.id" class="flex items-start gap-4">
                <span class="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#16BBD7]/20 text-[#16BBD7]">{{ step.id }}</span>
                <div>
                  <p class="font-medium text-white">{{ step.title }}</p>
                  <p class="text-white/70">{{ step.description }}</p>
                </div>
              </li>
            </ol>

            <div class="mt-6 rounded-2xl border border-white/10 bg-[#0B132A]/70 px-5 py-4 text-sm text-white/70">
              <p class="font-semibold text-white">Status at a glance</p>
              <p class="mt-1 text-white/65">The desktop Bridge mirrors your login, shows simulator + flight status, and updates OpenSquawk every few seconds.</p>
            </div>
          </div>
        </section>

        <aside class="space-y-6">
          <div class="rounded-3xl border border-white/10 bg-[#111832]/80 p-8 shadow-[0_30px_80px_rgba(4,8,24,0.55)] backdrop-blur">
            <h2 class="text-xl font-semibold">Requirements</h2>
            <ul class="mt-4 space-y-3 text-sm text-white/70">
              <li class="flex items-center gap-3">
                <span class="h-2 w-2 rounded-full bg-[#16BBD7] shadow-[0_0_12px_rgba(22,187,215,0.8)]"/>
                Windows 10/11 (64-bit)
              </li>
              <li class="flex items-center gap-3">
                <span class="h-2 w-2 rounded-full bg-[#16BBD7] shadow-[0_0_12px_rgba(22,187,215,0.8)]"/>
                .NET 8 Desktop Runtime
              </li>
              <li class="flex items-center gap-3">
                <span class="h-2 w-2 rounded-full bg-[#16BBD7] shadow-[0_0_12px_rgba(22,187,215,0.8)]"/>
                Active OpenSquawk membership
              </li>
              <li class="flex items-center gap-3">
                <span class="h-2 w-2 rounded-full bg-[#16BBD7] shadow-[0_0_12px_rgba(22,187,215,0.8)]"/>
                Reliable internet connection
              </li>
            </ul>
          </div>

          <div class="rounded-3xl border border-white/10 bg-[#111832]/70 p-8 shadow-[0_20px_60px_rgba(4,8,24,0.45)] backdrop-blur">
            <h2 class="text-xl font-semibold">Need help?</h2>
            <p class="mt-3 text-sm text-white/70">
              Ping us at
              <a href="mailto:support@opensquawk.de" class="text-[#16BBD7] underline decoration-dotted underline-offset-4">support@opensquawk.de</a>
              and we'll get you flying again.
            </p>

            <div class="mt-6 rounded-2xl border border-[#16BBD7]/30 bg-[#16BBD7]/10 px-5 py-4 text-sm text-white/75">
              <p class="font-semibold text-[#16BBD7]">Tip</p>
              <p class="mt-1">Leave the Bridge running in the background. It wakes up when the simulator launches and keeps the data fresh.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

useHead({ title: 'Bridge Downloads · OpenSquawk' })

const downloads = [
  {
    id: 'msfs2020',
    title: 'Microsoft Flight Simulator 2020',
    description: 'Stable build with automatic token linking and live updates.',
    badge: 'Available now',
    available: true,
    href: 'https://github.com/itsrubberduck/OpenSquawk-MSFS-Bridge/',
    icon: 'plane',
  },
  {
    id: 'msfs2024',
    title: 'Microsoft Flight Simulator 2024',
    description: 'Integration in progress. The release build is almost ready.',
    badge: 'In progress',
    available: false,
    href: '#',
    icon: 'future',
  },
  {
    id: 'xplane',
    title: 'X-Plane 12',
    description: 'Shared Bridge architecture. Support arrives later this year.',
    badge: 'Planned',
    available: false,
    href: '#',
    icon: 'xplane',
  },
]

const steps = [
  {
    id: 1,
    title: 'Install the Bridge',
    description: 'Download the build, run the installer, and launch the desktop app.',
  },
  {
    id: 2,
    title: 'Open the connect page',
    description: 'Follow the in-app link to opensquawk.de/bridge/connect. The token comes along automatically.',
  },
  {
    id: 3,
    title: 'Link and fly',
    description: 'Sign in, link the token, and head back to the simulator. The Bridge keeps sending updates in the background.',
  },
]
</script>

<style scoped>
code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
</style>
