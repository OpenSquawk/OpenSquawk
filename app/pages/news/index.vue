<template>
  <div class="bg-[#0b1020] text-white min-h-screen">
    <section class="page-hero news-page-hero relative overflow-hidden border-b border-white/10">
      <NuxtImg
        src="/img/learn/missions/full-flight/briefing-departure.png"
        alt="Departure briefing board"
        class="page-hero-image"
        format="webp"
      />
      <div class="page-hero-overlay"></div>
      <div class="page-hero-content container-outer">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/70 hover:text-cyan-300">
              <v-icon icon="mdi-arrow-left" size="18" />
              Back to landing page
            </NuxtLink>
            <h1 class="mt-4 text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">News & updates</h1>
            <p class="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
              Release notes, alpha progress and product decisions in one stream.
            </p>
            <div class="mt-5 inline-flex items-center gap-3 rounded-full border border-white/15 bg-[#0b1020]/55 px-4 py-2 text-sm text-white/80">
              <v-icon icon="mdi-newspaper-variant-outline" size="18" class="text-cyan-300" />
              <span>{{ posts.length }} published updates</span>
            </div>
          </div>
          <NuxtLink to="/roadmap" class="btn btn-primary w-fit">Open roadmap & voting</NuxtLink>
        </div>
      </div>
    </section>

    <main class="container-outer news-main -mt-8 space-y-10 pb-16 pt-10 md:-mt-10 md:pb-20 md:pt-12" id="feed">
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
    { property: 'og:description', content: 'Follow releases, milestones and community product updates from OpenSquawk.' },
  ],
})

const formatNewsDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
</script>

<style scoped>
.container-outer {
  @apply mx-auto max-w-screen-xl px-4 sm:px-6 md:px-8;
}

.page-hero {
  min-height: clamp(420px, 62vh, 660px);
  position: relative;
  background: #0a0f1c;
}

.news-page-hero .page-hero-image {
  object-position: center 42%;
}

.page-hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 12, 24, 0.2) 5%, rgba(7, 12, 24, 0.46) 52%, rgba(7, 12, 24, 0.92) 100%),
    radial-gradient(100% 90% at 50% 100%, rgba(34, 211, 238, 0.16), rgba(34, 211, 238, 0));
}

.page-hero-content {
  position: relative;
  z-index: 2;
  min-height: inherit;
  display: flex;
  align-items: flex-end;
  padding-top: 4rem;
  padding-bottom: 3rem;
}

.news-main {
  max-width: 1160px;
}

.card {
  @apply rounded-2xl p-5 md:p-6;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 20px 46px rgba(7, 14, 31, 0.28);
}

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-medium transition;
}

.btn-primary {
  @apply border border-cyan-300/40 bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,.25)];
}

.chip {
  @apply inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs tracking-[0.08em] text-white;
}
</style>
