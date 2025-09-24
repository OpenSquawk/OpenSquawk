<template>
  <div class="relative min-h-screen bg-[#0B1020] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,187,215,0.15),transparent_55%)]"/>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(41,45,59,0.4),transparent_65%)]"/>

    <main class="relative mx-auto w-full max-w-4xl px-5 py-12 sm:px-7 lg:px-10">
      <nav class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          Link a token
        </NuxtLink>
      </nav>

      <header class="mt-10 space-y-5 text-center sm:text-left">
        <p class="text-xs font-semibold uppercase tracking-[0.45em] text-[#16BBD7]">OpenSquawk Bridge</p>
        <h1 class="text-3xl font-semibold sm:text-4xl">Your simulator, connected in under a minute.</h1>
        <p class="mx-auto max-w-2xl text-sm text-white/70 sm:mx-0">
          Download the Bridge for your sim, sign in once, and let the desktop app keep your flights in sync.
        </p>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="https://github.com/itsrubberduck/OpenSquawk-MSFS-Bridge/"
            target="_blank"
            rel="noopener"
            class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16BBD7] px-5 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#13a7c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72d9ea] sm:w-auto"
          >
            <span aria-hidden="true">⇩</span>
            Download for MSFS 2020
          </a>
          <NuxtLink
            to="/bridge/connect"
            class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/10 sm:w-auto"
          >
            Already have a code? Link it
          </NuxtLink>
        </div>
      </header>

      <section class="mt-14 space-y-4">
        <div class="space-y-2 text-center sm:text-left">
          <h2 class="text-2xl font-semibold">Choose your simulator</h2>
          <p class="text-sm text-white/65">Every build walks you through the same quick link flow.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <article
            v-for="item in downloads"
            :key="item.id"
            class="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-[#111832]/80 p-6 shadow-[0_20px_60px_rgba(4,8,24,0.45)] transition hover:border-white/20 hover:shadow-[0_28px_75px_rgba(4,8,24,0.55)]"
          >
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[#16BBD7]">
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
                <div>
                  <span
                    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.32em]"
                    :class="item.available ? 'bg-[#16BBD7]/15 text-[#16BBD7]' : 'bg-white/10 text-white/55'"
                  >
                    {{ item.status }}
                  </span>
                  <h3 class="mt-2 text-lg font-semibold">{{ item.title }}</h3>
                </div>
              </div>
              <p class="text-sm text-white/70">{{ item.description }}</p>
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
                class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/65 opacity-80"
              >
                <span aria-hidden="true">⏳</span>
                Coming soon
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="mt-16 space-y-6">
        <div class="space-y-2 text-center sm:text-left">
          <h2 class="text-2xl font-semibold">How linking works</h2>
          <p class="text-sm text-white/65">The Bridge walks you through these steps automatically.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <article
            v-for="step in steps"
            :key="step.id"
            class="rounded-3xl border border-white/10 bg-[#111832]/80 p-6 text-left shadow-[0_20px_60px_rgba(4,8,24,0.45)]"
          >
            <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[#16BBD7]">
              <svg
                v-if="step.icon === 'spark'"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                class="h-6 w-6"
              >
                <path d="M12 3l1.8 5.4H19l-4.6 3.3L16.2 17 12 13.8 7.8 17l1-5.3L4 8.4h5.2L12 3z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg
                v-else-if="step.icon === 'lock'"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                class="h-6 w-6"
              >
                <rect x="5" y="10" width="14" height="10" rx="3" ry="3" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 10V7a5 5 0 0110 0v3" stroke-linecap="round" stroke-linejoin="round"/>
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
                <path d="M4 17l4-4 3 3 5-5 4 4" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M4 7h16" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <p class="mt-4 text-base font-semibold">{{ step.title }}</p>
            <p class="mt-2 text-sm text-white/70">{{ step.description }}</p>
          </article>
        </div>
      </section>

      <section class="mt-16 grid gap-4 sm:grid-cols-2">
        <div class="rounded-3xl border border-white/10 bg-[#111832]/80 p-6 shadow-[0_18px_55px_rgba(4,8,24,0.45)]">
          <h2 class="text-xl font-semibold">Requirements</h2>
          <ul class="mt-4 space-y-3 text-sm text-white/70">
            <li class="flex items-center gap-3">
              <span class="h-2 w-2 rounded-full bg-[#16BBD7] shadow-[0_0_12px_rgba(22,187,215,0.85)]"/>
              Windows 10/11 (64-bit)
            </li>
            <li class="flex items-center gap-3">
              <span class="h-2 w-2 rounded-full bg-[#16BBD7] shadow-[0_0_12px_rgba(22,187,215,0.85)]"/>
              .NET 8 Desktop Runtime
            </li>
            <li class="flex items-center gap-3">
              <span class="h-2 w-2 rounded-full bg-[#16BBD7] shadow-[0_0_12px_rgba(22,187,215,0.85)]"/>
              Active OpenSquawk membership
            </li>
            <li class="flex items-center gap-3">
              <span class="h-2 w-2 rounded-full bg-[#16BBD7] shadow-[0_0_12px_rgba(22,187,215,0.85)]"/>
              Reliable internet connection
            </li>
          </ul>
        </div>
        <div class="rounded-3xl border border-white/10 bg-[#111832]/80 p-6 shadow-[0_18px_55px_rgba(4,8,24,0.45)]">
          <h2 class="text-xl font-semibold">Need help?</h2>
          <p class="mt-3 text-sm text-white/70">
            Email
            <a href="mailto:support@opensquawk.de" class="font-medium text-[#16BBD7] underline decoration-dotted underline-offset-4">support@opensquawk.de</a>
            and we&rsquo;ll get you connected.
          </p>
          <div class="mt-6 rounded-2xl border border-[#16BBD7]/30 bg-[#16BBD7]/10 px-5 py-4 text-sm text-white/75">
            <p class="font-semibold text-[#16BBD7]">Tip</p>
            <p class="mt-1">Leave the Bridge running. It wakes up with your sim and keeps sending status updates automatically.</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

useHead({ title: 'Bridge Downloads · OpenSquawk' })

const downloads = [
  {
    id: 'msfs2020',
    title: 'Microsoft Flight Simulator 2020',
    description: 'One-click installer for the current simulator with live status built in.',
    status: 'Ready now',
    available: true,
    href: 'https://github.com/itsrubberduck/OpenSquawk-MSFS-Bridge/',
    icon: 'plane',
  },
  {
    id: 'msfs2024',
    title: 'Microsoft Flight Simulator 2024',
    description: 'We’re updating the Bridge for the new sim launch. Watch this space.',
    status: 'In development',
    available: false,
    href: '#',
    icon: 'future',
  },
  {
    id: 'xplane',
    title: 'X-Plane 12',
    description: 'The same guided setup is coming to X-Plane later this year.',
    status: 'Planned',
    available: false,
    href: '#',
    icon: 'xplane',
  },
]

const steps = [
  {
    id: 1,
    title: 'Start the Bridge app',
    description: 'Launch the desktop Bridge. It drops a secure code and opens this page for you.',
    icon: 'spark',
  },
  {
    id: 2,
    title: 'Sign in & confirm',
    description: 'Log in with your OpenSquawk account and link the code in a single tap.',
    icon: 'lock',
  },
  {
    id: 3,
    title: 'Fly like normal',
    description: 'Head back to the sim. The Bridge keeps your flights and status in sync automatically.',
    icon: 'status',
  },
]
</script>

<style scoped>
code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
</style>
