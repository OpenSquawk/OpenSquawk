<template>
  <div class="relative min-h-screen bg-[#0B1020] text-white">
    <Transition name="fade">
      <div
          v-if="showNotice"
          class="notice-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bridge-notice-title"
      >
        <div class="notice-card">
          <span class="notice-glow notice-glow--cyan" aria-hidden="true"/>
          <span class="notice-glow notice-glow--violet" aria-hidden="true"/>
          <button
              type="button"
              class="notice-close"
              @click="showNotice = false"
              aria-label="Close notice"
          >
            <v-icon icon="mdi-close" class="h-5 w-5"/>
          </button>
          <div class="notice-content">
            <span class="notice-badge">Live ATC preview</span>
            <h2 id="bridge-notice-title" class="notice-title">Live ATC is still in the works</h2>
            <p class="notice-lead">
              We&rsquo;re putting the finishing touches on the live ATC area of Bridge. There isn&rsquo;t a production-ready download just yet,
              but it&rsquo;s coming to this page in the next few weeks and months.
            </p>
            <div class="notice-highlight">
              <v-icon icon="mdi-hammer-wrench" class="h-5 w-5 flex-shrink-0"/>
              <p>
                Comfortable shipping your own builds? Grab the developer packages for the supported simulators and explore ahead of
                launch.
              </p>
            </div>
            <div class="notice-divider" aria-hidden="true"/>
            <div class="notice-grid">
              <div class="notice-panel">
                <h3>While you wait</h3>
                <p>
                  Dive into the OpenSquawk Classroom today &mdash; it works beautifully even without a simulator connected.
                </p>
                <NuxtLink
                    to="/classroom"
                    class="notice-primary"
                >
                  Visit the Classroom
                </NuxtLink>
              </div>
              <div class="notice-panel">
                <h3>Ready to tinker?</h3>
                <ul class="notice-list">
                  <li>
                    <v-icon icon="mdi-download" class="h-4 w-4"/>
                    Download the current developer builds for your sim
                  </li>
                  <li>
                    <v-icon icon="mdi-console" class="h-4 w-4"/>
                    Wire everything up locally and share feedback with us
                  </li>
                  <li>
                    <v-icon icon="mdi-timer-sand" class="h-4 w-4"/>
                    Expect the hosted live version to roll out soon
                  </li>
                </ul>
                <button
                    type="button"
                    class="notice-ghost"
                    @click="showNotice = false"
                >
                  Browse downloads anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,187,215,0.15),transparent_55%)]"/>
    <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(41,45,59,0.4),transparent_65%)]"/>

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
            class="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition sm:w-auto hover:bg-white/5 " >
          <v-icon icon="mdi-link" class="h-5 w-5"/>
          Link a token
        </NuxtLink>
      </nav>

      <div
          class="mt-10 overflow-hidden rounded-3xl border border-white/10"
          style="aspect-ratio: 2.5 / 1;"
      >
        <div
            class="h-full w-full bg-cover bg-center"
            style="background-image: url('http://localhost:3000/img/bridge/goldengate_angle.jpeg');"
        />
      </div>

      <header class="mt-10 space-y-5 text-center sm:text-left">
        <p class="text-xs font-semibold uppercase tracking-[0.45em] text-[#16BBD7]">OpenSquawk Bridge</p>
        <h1 class="text-3xl font-semibold sm:text-4xl">Your simulator, connected in under a minute.</h1>
        <p class="mx-auto max-w-2xl text-sm text-white/70 sm:mx-0">
          Download the Bridge for your sim, sign in once, and let the desktop app keep your flights in sync.
        </p>
      </header>

      <section class="mt-14 space-y-4">
        <div class="space-y-2 text-center sm:text-left">
          <h2 class="text-2xl font-semibold">Choose your simulator</h2>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 items-center justify-center">
          <article
              v-for="item in downloads"
              :key="item.id"
              class="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-[#111832]/80 p-6 shadow-[0_20px_60px_rgba(4,8,24,0.45)] transition hover:border-white/20 hover:shadow-[0_28px_75px_rgba(4,8,24,0.55)]"
          >
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[#16BBD7]">
                  <v-icon :icon="item.icon" class="h-6 w-6"/>
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
                <v-icon icon="mdi-download" class="h-5 w-5"/>
                Download
              </a>
              <button
                  v-else
                  type="button"
                  disabled
                  class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/65 opacity-80"
              >
                <v-icon icon="mdi-clock-outline" class="h-5 w-5"/>
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
              <v-icon :icon="step.icon" class="h-6 w-6"/>
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
            <a href="mailto:info@opensquawk.de"
               class="font-medium text-[#16BBD7] underline decoration-dotted underline-offset-4">info@opensquawk.de</a>
            and we&rsquo;ll get you connected.
          </p>
          <div class="mt-6 rounded-2xl border border-[#16BBD7]/30 bg-[#16BBD7]/10 px-5 py-4 text-sm text-white/75">
            <p class="font-semibold text-[#16BBD7]">Tip</p>
            <p class="mt-1">Leave the Bridge running. It wakes up with your sim and keeps sending status updates
              automatically.</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {useHead} from '#imports'

useHead({title: 'Bridge Downloads · OpenSquawk'})

const showNotice = ref(true)

const downloads = [
  {
    id: 'msfs2020',
    title: 'Microsoft Flight Simulator 2020',
    description: 'One-click installer for the current simulator with live status built in.',
    status: 'Ready now',
    available: true,
    href: 'https://github.com/itsrubberduck/OpenSquawk-MSFS-Bridge/',
    icon: 'mdi-microsoft',
  },
  {
    id: 'msfs2024',
    title: 'Microsoft Flight Simulator 2024',
    description: 'We’re updating the Bridge for the new sim launch. Watch this space.',
    status: 'In development',
    available: false,
    href: '#',
    icon: 'mdi-microsoft',
  },
  {
    id: 'flightgear',
    title: 'FlightGear',
    description: 'Our open-source bridge launches on Linux first, followed by macOS and Windows.',
    status: 'Planned',
    available: false,
    href: '#',
    icon: 'mdi-git',
  },
  {
    id: 'xplane',
    title: 'X-Plane 12',
    description: 'The same guided setup is coming to X-Plane later this year.',
    status: 'Planned',
    available: false,
    href: '#',
    icon: 'mdi-airplane',
  },
]

const steps = [
  {
    id: 1,
    title: 'Start the Bridge app',
    description: 'Launch the desktop Bridge. It drops a secure code and opens this page for you.',
    icon: 'mdi-desktop-mac',
  },
  {
    id: 2,
    title: 'Sign in & confirm',
    description: 'Log in with your OpenSquawk account and link the code in a single tap.',
    icon: 'mdi-account-check',
  },
  {
    id: 3,
    title: 'Fly like normal',
    description: 'Head back to the sim. The Bridge keeps your flights and status in sync automatically.',
    icon: 'mdi-airplane-takeoff',
  },
]
</script>

<style scoped>
code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.notice-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: radial-gradient(circle at top, rgba(22, 187, 215, 0.12), transparent 55%),
    radial-gradient(circle at bottom, rgba(88, 97, 175, 0.18), transparent 60%),
    rgba(3, 5, 16, 0.82);
  backdrop-filter: blur(18px);
}

.notice-card {
  position: relative;
  width: 100%;
  max-width: 780px;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(145deg, rgba(13, 18, 38, 0.95), rgba(17, 24, 50, 0.85));
  box-shadow: 0 40px 120px rgba(4, 8, 24, 0.65);
}

.notice-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
  filter: blur(40px);
  opacity: 0.7;
}

.notice-glow--cyan {
  top: -120px;
  right: -80px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(22, 187, 215, 0.38), transparent 60%);
}

.notice-glow--violet {
  bottom: -140px;
  left: -60px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(113, 88, 226, 0.32), transparent 65%);
}

.notice-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.25s ease;
}

.notice-close:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.85);
}

.notice-content {
  position: relative;
  padding: 3.5rem 3rem 3rem;
  text-align: left;
  color: rgba(255, 255, 255, 0.9);
}

.notice-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: rgba(22, 187, 215, 0.16);
  border: 1px solid rgba(22, 187, 215, 0.3);
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 600;
  color: #72d9ea;
}

.notice-title {
  margin-top: 1.5rem;
  font-size: clamp(1.9rem, 2.3vw + 1.4rem, 2.6rem);
  font-weight: 600;
}

.notice-lead {
  margin-top: 1rem;
  font-size: 0.95rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.7);
}

.notice-highlight {
  margin-top: 1.75rem;
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  border-radius: 20px;
  background: rgba(17, 33, 54, 0.75);
  border: 1px solid rgba(22, 187, 215, 0.18);
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.9rem;
  line-height: 1.55;
}

.notice-divider {
  margin: 2.25rem 0 2rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent);
}

.notice-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.notice-panel {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.6rem;
  border-radius: 22px;
  background: rgba(10, 15, 32, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.notice-panel h3 {
  font-size: 1.05rem;
  font-weight: 600;
}

.notice-panel p {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

.notice-list {
  display: grid;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
  list-style: none;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.72);
}

.notice-list li {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.notice-primary,
.notice-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.9rem 1.2rem;
  border-radius: 18px;
  font-size: 0.92rem;
  font-weight: 600;
  transition: all 0.25s ease;
}

.notice-primary {
  background: linear-gradient(135deg, #16bbd7, #12a0d7);
  color: #061423;
  box-shadow: 0 18px 35px rgba(22, 187, 215, 0.28);
}

.notice-primary:hover {
  background: linear-gradient(135deg, #22cfe9, #16b0ff);
  box-shadow: 0 22px 45px rgba(22, 187, 215, 0.35);
}

.notice-ghost {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.78);
}

.notice-ghost:hover {
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.95);
}

.notice-ghost:focus-visible,
.notice-primary:focus-visible,
.notice-close:focus-visible {
  outline: 2px solid rgba(22, 187, 215, 0.65);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .notice-content {
    padding: 3rem 1.75rem 2.4rem;
  }

  .notice-panel {
    padding: 1.35rem;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
