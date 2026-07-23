<template>
  <div class="relative min-h-screen bg-[#0B1020] text-white">
    <Transition name="fade">
      <div
          v-if="showNotice"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bridge-notice-title"
      >
        <div
            class="relative w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0E1630]/95 px-6 py-8 shadow-[0_30px_100px_rgba(5,10,35,0.65)] sm:px-10 sm:py-12">
          <div
              class="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#16BBD7]/20 blur-3xl"/>
          <div class="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-[#7B4DFF]/20 blur-3xl"/>
          <button
              type="button"
              class="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10"
              @click="showNotice = false"
              aria-label="Close notice"
          >
            <v-icon icon="mdi-close" class="h-5 w-5"/>
          </button>

          <div class="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
            <div class="flex flex-col gap-6">
              <span
                  class="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#84E8F6]">
                <span class="h-1.5 w-1.5 rounded-full bg-[#16BBD7] shadow-[0_0_10px_rgba(22,187,215,0.9)]"/>
                Heads up
              </span>
              <h2 id="bridge-notice-title" class="text-3xl font-semibold leading-tight sm:text-4xl">
                Live ATC is still in the works
              </h2>
              <NuxtImg src="/img/bridge/hangar_sleeping.jpeg" alt="Bridge app screenshot" style="aspect-ratio: 2.7/1;object-fit: cover" class="rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(4,8,24,0.45)]" format="webp" />
              <p class="text-sm text-white/75 sm:text-base">
                We&rsquo;re actively building this part of the Bridge experience. Not every feature works yet,
                and some areas still use static dummy data, but you can already look around and send us feedback.
              </p>

            </div>


          </div>
          <div class="flex gap-6 mt-6 justify-between flex-col sm:flex-row sm:items-center">
            <NuxtLink
                to="/classroom"
                class="btn primary flex flex-none items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition"
            >
              <v-icon icon="mdi-arrow-left" class="h-5 w-5"/>
              Back to the Classroom
            </NuxtLink>

            <button
                type="button"
                @click="showNotice = false"
                class=" btn secondary flex flex-none items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/10"
            >
              Continue anyway
              <v-icon icon="mdi-arrow-right" class="h-5 w-5"/>
            </button>
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
            class="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition sm:w-auto hover:bg-white/5 ">
          <v-icon icon="mdi-link" class="h-5 w-5"/>
          Link a token
        </NuxtLink>
      </nav>

      <header class="mt-12 space-y-3 text-center">
        <span
            class="inline-flex items-center gap-2 rounded-full border border-[#16BBD7]/40 bg-[#16BBD7]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#84E8F6]">
          <span class="h-1.5 w-1.5 rounded-full bg-[#16BBD7] shadow-[0_0_10px_rgba(22,187,215,0.9)]"/>
          OpenSquawk Bridge
        </span>
        <h1 class="text-3xl font-semibold leading-tight sm:text-4xl">Connect your simulator</h1>
        <p class="mx-auto max-w-xl text-base text-white/70">
          Download the Bridge, sign in once, and your flights sync into Live ATC automatically as you fly.
        </p>
      </header>

      <section class="mt-12 space-y-4">
        <div class="grid gap-4 sm:grid-cols-3 items-start">
          <article
              v-for="item in platforms"
              :key="item.id"
              class="relative flex flex-col rounded-3xl border p-6 shadow-[0_20px_60px_rgba(4,8,24,0.45)] transition"
              :class="item.os === detectedOs
                ? 'border-[#16BBD7]/60 bg-[#16BBD7]/[0.09] ring-1 ring-[#16BBD7]/40'
                : 'border-white/10 bg-[#111832]/80 hover:border-white/20 hover:shadow-[0_28px_75px_rgba(4,8,24,0.55)]'"
          >
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <span
                    class="flex h-11 w-11 items-center justify-center rounded-2xl"
                    :class="item.os === detectedOs ? 'bg-[#16BBD7]/15 text-[#16BBD7]' : 'bg-white/5 text-[#16BBD7]'"
                >
                  <v-icon :icon="item.icon" class="h-6 w-6"/>
                </span>
                <div>
                  <h3 class="text-lg font-semibold">{{ item.title }}</h3>
                  <span
                      v-if="item.os === detectedOs"
                      class="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#84E8F6]"
                  >
                    <v-icon icon="mdi-check-circle" class="h-3 w-3"/>
                    Your system
                  </span>
                </div>
              </div>
            </div>
            <div class="mt-6 space-y-2">
              <a
                  :href="item.href"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72d9ea]"
                  :class="item.os === detectedOs
                    ? 'bg-[#16BBD7] text-[#0B1020] hover:bg-[#13a7c4]'
                    : 'border border-white/15 bg-white/5 text-white hover:border-white/25 hover:bg-white/10'"
              >
                <v-icon :icon="item.ctaIcon" class="h-6 w-6"/>
                {{ item.ctaLabel }}
              </a>
            </div>
          </article>
        </div>
        <p class="flex items-center items-start gap-2 text-xs text-white/50 sm:justify-center sm:text-center">
          <v-icon icon="mdi-clock-fast" class="mt-0.5 h-4 w-4 flex-none"/>
          <span>The first start takes about a minute (it downloads the runtime &amp; dependencies). After that the app updates itself automatically on every launch.</span>
        </p>
      </section>

      <!-- First-launch help for macOS. The app is unsigned, so on recent macOS
           (Sonoma/Sequoia) the old right-click → Open trick no longer works and
           Gatekeeper shows a scary "could not verify" dialog. Collapsible to keep
           the page tidy; auto-opens for macOS visitors (see onMounted). -->
      <section
          class="mt-8 overflow-hidden rounded-3xl border transition"
          :class="detectedOs === 'mac'
            ? 'border-[#16BBD7]/50 bg-[#16BBD7]/[0.07]'
            : 'border-white/10 bg-[#111832]/80'"
      >
        <button
            type="button"
            class="flex w-full items-center justify-between gap-3 p-6 text-left transition hover:bg-white/[0.02]"
            :aria-expanded="macHelpOpen"
            @click="macHelpOpen = !macHelpOpen"
        >
          <span class="flex items-center gap-3">
            <span class="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white/5 text-[#16BBD7]">
              <v-icon icon="mdi-apple" class="h-6 w-6"/>
            </span>
            <span>
              <span class="block text-lg font-semibold">Trouble opening it on macOS?</span>
              <span class="mt-0.5 block text-sm text-white/60">A quick one-time approval for the unsigned app — here&rsquo;s exactly how.</span>
            </span>
          </span>
          <v-icon
              :icon="macHelpOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              class="h-6 w-6 flex-none text-white/50"
          />
        </button>

        <Transition name="fade">
          <div v-show="macHelpOpen" class="border-t border-white/10 px-6 pb-6 pt-5">
            <ol class="space-y-3">
              <li class="flex gap-3 text-sm text-white/85">
                <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#16BBD7]/15 text-xs font-semibold text-[#84E8F6]">1</span>
                <span>Open the downloaded <strong>.dmg</strong>, drag <strong>OpenSquawk&nbsp;Bridge</strong> onto the <strong>Applications</strong> folder, then open it <strong>from Applications</strong> — not from inside the disk image.</span>
              </li>
              <li class="flex gap-3 text-sm text-white/85">
                <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#16BBD7]/15 text-xs font-semibold text-[#84E8F6]">2</span>
                <span>Double-click the app. A box appears saying <em>&ldquo;Apple could not verify&hellip;&rdquo;</em> — click <strong>Done</strong>.
                  <span class="text-white/50">Do <strong>not</strong> click &ldquo;Move to Trash&rdquo;.</span></span>
              </li>
              <li class="flex gap-3 text-sm text-white/85">
                <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#16BBD7]/15 text-xs font-semibold text-[#84E8F6]">3</span>
                <span>Open the <strong>Apple menu</strong> (top-left corner) → <strong>System&nbsp;Settings</strong> → <strong>Privacy&nbsp;&amp;&nbsp;Security</strong>.</span>
              </li>
              <li class="flex gap-3 text-sm text-white/85">
                <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#16BBD7]/15 text-xs font-semibold text-[#84E8F6]">4</span>
                <span>Scroll down to the <strong>Security</strong> section. Next to
                  &ldquo;OpenSquawk&nbsp;Bridge was blocked&hellip;&rdquo;, click
                  <strong>Open&nbsp;Anyway</strong>, then confirm with your password or Touch&nbsp;ID.</span>
              </li>
            </ol>
            <p class="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60">
              <v-icon icon="mdi-check-circle-outline" class="mt-0.5 h-4 w-4 flex-none text-[#16BBD7]"/>
              <span>That&rsquo;s it. From now on the app opens with a normal double-click and keeps itself up to date automatically.</span>
            </p>
          </div>
        </Transition>
      </section>


      <footer class="mt-12 text-center text-sm text-white/50">
        <p class="mb-3">
          No simulator connection? <NuxtLink to="/live-atc" class="font-medium text-[#16BBD7] underline decoration-dotted underline-offset-4">Use the reduced online version.</NuxtLink>
        </p>
        Need help?
        <a href="mailto:info@opensquawk.de"
           class="font-medium text-[#16BBD7] underline decoration-dotted underline-offset-4">info@opensquawk.de</a>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {useHead} from '#imports'

useHead({title: 'Bridge Downloads · OpenSquawk'})

// "Still in the works" heads-up — silenced for now per product decision, kept
// around (rather than deleted) in case we want to bring it back for a future notice.
const showNotice = ref(false)

// Launchers are published as "latest release" assets on the source repo, so the
// download URLs stay stable across versions (the app auto-updates itself anyway).
const RELEASE_BASE = 'https://github.com/OpenSquawk/OpenSquawk-Python-Bridge/releases/latest/download'

type OsId = 'mac' | 'windows' | 'linux'

const platforms = [
  {
    id: 'mac',
    os: 'mac' as OsId,
    title: 'macOS',
    description: 'Same self-updating thin launcher — download once, it keeps itself current from GitHub.',
    note: 'Drag it to Applications and open it from there. First launch needs a one-time approval — see “Trouble opening it on macOS?” below.',
    code: '',
    ctaLabel: 'Download for macOS',
    ctaIcon: 'mdi-download',
    file: 'OpenSquawk-Bridge-macOS.dmg',
    href: `${RELEASE_BASE}/OpenSquawk-Bridge-macOS.dmg`,
    icon: 'mdi-apple',
  },
  {
    id: 'windows',
    os: 'windows' as OsId,
    title: 'Windows',
    description: 'Same self-updating thin launcher — download once, it keeps itself current from GitHub.',
    note: 'Double-click the file. If SmartScreen warns: More info → Run anyway.',
    code: '',
    ctaLabel: 'Download for Windows',
    ctaIcon: 'mdi-download',
    file: 'OpenSquawk-Bridge-windows.cmd',
    href: `${RELEASE_BASE}/OpenSquawk-Bridge-windows.cmd`,
    icon: 'mdi-microsoft-windows',
  },
  {
    id: 'linux',
    os: 'linux' as OsId,
    title: 'Linux',
    description: 'Same self-updating thin launcher — download once, it keeps itself current from GitHub.',
    note: 'Make it executable and run it — it then appears in your app menu:',
    code: 'chmod +x OpenSquawk-Bridge-linux.sh && ./OpenSquawk-Bridge-linux.sh',
    ctaLabel: 'Download for Linux',
    ctaIcon: 'mdi-download',
    file: 'OpenSquawk-Bridge-linux.sh',
    href: `${RELEASE_BASE}/OpenSquawk-Bridge-linux.sh`,
    icon: 'mdi-linux',
  },
]

// Try to pre-select the visitor's OS so the right card is highlighted.
const detectedOs = ref<OsId | null>(null)

// The macOS first-launch help is collapsed by default and auto-expands for
// macOS visitors (they're the ones who hit Gatekeeper); everyone can toggle it.
const macHelpOpen = ref(false)

function detectOs(): OsId | null {
  if (typeof navigator === 'undefined') return null
  const uaData = (navigator as any).userAgentData
  const hint = `${uaData?.platform ?? ''} ${navigator.platform ?? ''} ${navigator.userAgent ?? ''}`.toLowerCase()
  if (/mac|iphone|ipad|ipod/.test(hint)) return 'mac'
  if (/win/.test(hint)) return 'windows'
  if (/linux|x11|android|cros/.test(hint)) return 'linux'
  return null
}

onMounted(() => {
  detectedOs.value = detectOs()
  macHelpOpen.value = detectedOs.value === 'mac'
})

const steps = [
  {
    id: 1,
    title: 'Start the Bridge app',
    description: 'Launch the desktop Bridge — it drops a secure code and opens this page.',
    icon: 'mdi-desktop-mac',
  },
  {
    id: 2,
    title: 'Sign in & confirm',
    description: 'Log in with your OpenSquawk account and confirm the code.',
    icon: 'mdi-account-check',
  },
  {
    id: 3,
    title: 'Fly like normal',
    description: 'Back to the sim — flights and status stay in sync automatically.',
    icon: 'mdi-airplane-takeoff',
  },
]
</script>

<style scoped>
code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
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
