<template>
  <div class="bg-[#0b1020] text-white min-h-screen">
    <header class="border-b border-white/10 bg-[#0b1020]/80 backdrop-blur">
      <div class="container-outer py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
            <v-icon icon="mdi-arrow-left" size="18" /> Zurück zur Startseite
          </NuxtLink>
          <h1 class="text-3xl md:text-4xl font-semibold mt-2">News & Updates</h1>
          <p class="text-white/70 text-sm md:text-base mt-2">
            Content-getriebene Updates zu Alpha-Builds, Simulator-Support und Community-Entscheidungen.
          </p>
        </div>
        <NuxtLink to="#feed" class="btn btn-primary w-fit">Zum aktuellen Feed</NuxtLink>
      </div>
    </header>

    <main class="container-outer py-12 md:py-16 space-y-10" id="feed">
      <section>
        <div v-if="posts.length" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article
              v-for="post in posts"
              :key="post.slug"
              class="card h-full flex flex-col gap-4"
          >
            <div class="space-y-2">
              <span class="chip text-[10px] uppercase tracking-[0.3em]">{{ formatNewsDate(post.publishedAt) }}</span>
              <h2 class="text-xl font-semibold">{{ post.title }}</h2>
              <p class="text-sm text-white/70">{{ post.excerpt }}</p>
            </div>
            <div class="mt-auto flex items-center justify-between text-xs text-white/60">
              <span>{{ post.readingTime }}</span>
              <NuxtLink :to="`/news/${post.slug}`" class="text-cyan-300 text-sm font-medium hover:underline">Weiterlesen</NuxtLink>
            </div>
          </article>
        </div>
        <div v-else class="card text-white/70 text-sm">
          Noch keine Beiträge veröffentlicht. Schau bald wieder vorbei!
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '#imports'
import { getAllNews } from '~~/shared/utils/news'

const posts = computed(() => getAllNews())

useHead({
  title: 'News & Updates – OpenSquawk',
  meta: [
    { name: 'description', content: 'Neuigkeiten zum OpenSquawk Alpha-Prototyp, Simulator-Support und Community-Updates.' },
    { name: 'robots', content: 'index,follow' },
    { property: 'og:title', content: 'News & Updates – OpenSquawk' },
    { property: 'og:description', content: 'Open-source, low-cost AI ATC: Wir teilen Fortschritte, Milestones und Aufrufe zum Mitmachen.' },
  ],
})

const formatNewsDate = (iso: string) => new Date(iso).toLocaleDateString('de-DE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
</script>

<style scoped>
.container-outer { @apply mx-auto max-w-screen-xl px-4; }
.card { @apply glass rounded-2xl p-5 md:p-6; }
.btn { @apply inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium transition; }
.btn-primary { @apply bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,.25)]; }
.chip { @apply inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 text-white px-3 py-1 text-xs; }
.glass { background: rgba(255,255,255,.06); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.08); }
</style>
