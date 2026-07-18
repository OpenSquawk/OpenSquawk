<template>
  <header class="sticky top-0 z-50 border-b border-white/10 bg-[#0b1020]/80 backdrop-blur">
    <nav class="container-outer flex items-center justify-between py-3.5 sm:py-4">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold tracking-tight">
        <v-icon icon="mdi-radar" size="28" class="text-cyan-400" />
        <span class="text-white">OpenSquawk</span>
      </NuxtLink>

      <div class="hidden lg:flex items-center gap-6 text-sm">
        <template v-for="item in navLinks" :key="item.label">
          <a
            v-if="item.external"
            :href="item.to"
            target="_blank"
            rel="noopener"
            class="text-white/70 transition-colors hover:text-cyan-300"
          >
            {{ item.label }}
          </a>
          <NuxtLink
            v-else
            :to="item.to"
            class="text-white/70 transition-colors hover:text-cyan-300"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <NuxtLink to="/pricing" class="btn btn-primary whitespace-nowrap btn-compact">
          <v-icon icon="mdi-rocket-launch-outline" size="18" />
          <span class="hidden sm:inline">Start free training</span>
          <span class="sm:hidden">Start</span>
        </NuxtLink>
        <a
          :href="GITHUB_URL"
          target="_blank"
          rel="noopener"
          class="hidden sm:inline-flex btn btn-ghost whitespace-nowrap btn-compact"
          aria-label="GitHub"
        >
          <v-icon icon="mdi-github" size="18" />
        </a>
        <button
          type="button"
          class="mobile-toggle lg:hidden"
          :aria-expanded="isOpen ? 'true' : 'false'"
          aria-label="Toggle navigation"
          @click="isOpen = !isOpen"
        >
          <span class="hamburger" :class="{ 'is-open': isOpen }">
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
          </span>
        </button>
      </div>
    </nav>

    <Transition name="mobile-nav">
      <div v-if="isOpen" class="lg:hidden border-t border-white/10 bg-[#0b1020]/95 backdrop-blur">
        <div class="container-outer py-4">
          <nav class="grid gap-2 text-sm">
            <template v-for="item in navLinks" :key="`m-${item.label}`">
              <a
                v-if="item.external"
                :href="item.to"
                target="_blank"
                rel="noopener"
                class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 transition hover:bg-white/10"
                @click="isOpen = false"
              >
                <span>{{ item.label }}</span>
                <v-icon icon="mdi-chevron-right" size="18" class="text-white/60" />
              </a>
              <NuxtLink
                v-else
                :to="item.to"
                class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 transition hover:bg-white/10"
                @click="isOpen = false"
              >
                <span>{{ item.label }}</span>
                <v-icon icon="mdi-chevron-right" size="18" class="text-white/60" />
              </NuxtLink>
            </template>
          </nav>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const GITHUB_URL = 'https://github.com/OpenSquawk/OpenSquawk'

interface NavItem {
  label: string
  to: string
  external?: boolean
}

const navLinks: NavItem[] = [
  { label: 'Product', to: '/' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Open Source', to: '/open-source' },
  { label: 'For VATSIM', to: '/vatsim-radio-training' },
  { label: 'For Clubs', to: '/pricing#club' },
  { label: 'Docs', to: GITHUB_URL, external: true },
]

const isOpen = ref(false)
</script>

<style scoped>
.mobile-toggle {
  @apply inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10;
  width: 44px;
  height: 44px;
}

.hamburger {
  position: relative;
  width: 20px;
  height: 14px;
}

.hamburger-bar {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.9);
  transition: top 0.25s ease, transform 0.25s ease, opacity 0.25s ease;
}

.hamburger-bar:nth-child(1) { top: 0; }
.hamburger-bar:nth-child(2) { top: 6px; }
.hamburger-bar:nth-child(3) { top: 12px; }

.hamburger.is-open .hamburger-bar:nth-child(1) { top: 6px; transform: rotate(45deg); }
.hamburger.is-open .hamburger-bar:nth-child(2) { opacity: 0; }
.hamburger.is-open .hamburger-bar:nth-child(3) { top: 6px; transform: rotate(-45deg); }

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
