<template>
  <footer class="border-t border-white/10 bg-[#070b16] text-white">
    <div class="container-outer py-12 sm:py-16">
      <div class="flex flex-col gap-10">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div class="flex items-center gap-2">
            <v-icon icon="mdi-radar" size="26" class="text-cyan-400" />
            <span class="text-lg font-semibold">OpenSquawk</span>
          </div>
          <p class="max-w-2xl text-sm text-white/70">
            Open-source core. Paid hosted training. Practice aviation radio before going live on VATSIM.
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <a :href="GITHUB_URL" target="_blank" rel="noopener" class="footer-action">
              <v-icon icon="mdi-github" size="18" class="text-white/70" />
              <span>GitHub</span>
            </a>
            <a :href="DISCORD_INVITE_URL" target="_blank" rel="noopener" class="footer-action">
              <v-icon icon="mdi-discord" size="18" class="text-white/70" />
              <span>Discord</span>
            </a>
            <NuxtLink to="/roadmap" class="footer-action">
              <v-icon icon="mdi-map-marker-path" size="18" class="text-white/70" />
              <span>Roadmap</span>
            </NuxtLink>
          </div>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 class="mb-3 font-semibold">Product</h4>
            <ul class="space-y-2 text-sm text-white/70">
              <li><NuxtLink to="/pricing" class="hover:text-cyan-300">Pricing</NuxtLink></li>
              <li><NuxtLink to="/founder" class="hover:text-cyan-300">Founder deal</NuxtLink></li>
              <li><NuxtLink to="/self-host-vs-cloud" class="hover:text-cyan-300">Self-host vs Cloud</NuxtLink></li>
              <li><NuxtLink to="/roadmap" class="hover:text-cyan-300">Roadmap</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h4 class="mb-3 font-semibold">Open Source</h4>
            <ul class="space-y-2 text-sm text-white/70">
              <li><NuxtLink to="/open-source" class="hover:text-cyan-300">What's open</NuxtLink></li>
              <li><a :href="GITHUB_URL" target="_blank" rel="noopener" class="hover:text-cyan-300">GitHub repository</a></li>
              <li><a :href="`${GITHUB_URL}/blob/main/COMMERCIAL.md`" target="_blank" rel="noopener" class="hover:text-cyan-300">Commercial use</a></li>
              <li><a :href="`${GITHUB_URL}/blob/main/TRADEMARK.md`" target="_blank" rel="noopener" class="hover:text-cyan-300">Trademark policy</a></li>
            </ul>
          </div>
          <div>
            <h4 class="mb-3 font-semibold">Learn</h4>
            <ul class="space-y-2 text-sm text-white/70">
              <li><NuxtLink to="/vatsim-radio-training" class="hover:text-cyan-300">VATSIM radio training</NuxtLink></li>
              <li><NuxtLink to="/first-vatsim-flight" class="hover:text-cyan-300">First VATSIM flight</NuxtLink></li>
              <li><NuxtLink to="/ifr-clearance-practice" class="hover:text-cyan-300">IFR clearance practice</NuxtLink></li>
              <li><NuxtLink to="/aviation-phraseology-trainer" class="hover:text-cyan-300">Phraseology trainer</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h4 class="mb-3 font-semibold">Legal</h4>
            <ul class="space-y-2 text-sm text-white/70">
              <li><NuxtLink to="/impressum" class="hover:text-cyan-300">Imprint</NuxtLink></li>
              <li><NuxtLink to="/datenschutz" class="hover:text-cyan-300">Privacy</NuxtLink></li>
              <li><NuxtLink to="/agb" class="hover:text-cyan-300">Terms</NuxtLink></li>
              <li><a href="mailto:info@opensquawk.de" class="hover:text-cyan-300">info@opensquawk.de</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/60 sm:text-left">
        © {{ year }} OpenSquawk. Open-source core under AGPLv3. Not for real-world aviation.
        *VATSIM/IVAO: trademarks of their respective owners.
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const GITHUB_URL = 'https://github.com/OpenSquawk/OpenSquawk'
const DISCORD_INVITE_URL = 'https://discord.gg/jJztEW8r2S'
const year = new Date().getFullYear()
</script>

<style scoped>
.footer-action {
  @apply inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-400/60 hover:bg-white/10;
}
</style>
