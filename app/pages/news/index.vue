<template>
  <div class="bg-[#0b1020] text-white min-h-screen">
    <header class="border-b border-white/10 bg-[#0b1020]/80 backdrop-blur">
      <div class="container-outer py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
            <v-icon icon="mdi-arrow-left" size="18" /> Back to landing page
          </NuxtLink>
          <h1 class="text-3xl md:text-4xl font-semibold mt-2">News & updates</h1>
          <p class="text-white/70 text-sm md:text-base mt-2">
            Content-driven updates covering the alpha build, simulator support and community decisions.
          </p>
        </div>
        <NuxtLink to="/#contributing" class="btn btn-primary w-fit">View contributing section</NuxtLink>
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
              <NuxtLink :to="`/news/${post.slug}`" class="text-cyan-300 text-sm font-medium hover:underline">Read more</NuxtLink>
            </div>
          </article>
        </div>
        <div v-else class="card text-white/70 text-sm">
          No posts published yet. Check back soon!
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
    { name: 'description', content: 'Updates on the OpenSquawk alpha build, simulator integrations and community news.' },
    { name: 'robots', content: 'index,follow' },
    { property: 'og:title', content: 'News & Updates – OpenSquawk' },
    { property: 'og:description', content: 'Open-source, low-cost AI ATC: follow progress, milestones and community calls to action.' },
  ],
})

const formatNewsDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', {
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
