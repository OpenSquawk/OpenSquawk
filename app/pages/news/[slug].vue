<template>
  <div class="bg-[#0b1020] text-white min-h-screen">
    <div class="container-outer py-10 md:py-16 space-y-8">
      <NuxtLink to="/news" class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-cyan-300">
        <v-icon icon="mdi-arrow-left" size="18" /> Back to News & updates
      </NuxtLink>

      <article v-if="post" class="card space-y-6">
        <header class="space-y-2">
          <span class="chip text-[10px] uppercase tracking-[0.3em]">{{ formatNewsDate(post.publishedAt) }}</span>
          <h1 class="text-3xl md:text-4xl font-semibold">{{ post.title }}</h1>
          <p class="text-sm text-white/60">{{ post.readingTime }}</p>
        </header>
        <div class="news-body" v-html="post.html" />
      </article>

      <div v-else class="card space-y-4 text-white/70 text-sm">
        <h1 class="text-2xl font-semibold text-white">Article not found</h1>
        <p>The requested news article does not exist. Head back to the feed instead.</p>
        <NuxtLink to="/news" class="btn btn-primary w-fit">Back to overview</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useHead, useRoute } from '#imports'
import { getNewsBySlug } from '~~/shared/utils/news'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const post = computed(() => getNewsBySlug(slug.value))
useHead(() => {
  if (!post.value) {
    return {
      title: 'Article not found – OpenSquawk',
      meta: [{ name: 'robots', content: 'noindex' }],
    }
  }
  const description = post.value.excerpt || 'Update from the OpenSquawk project.'
  return {
    title: `${post.value.title} – OpenSquawk News`,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: `${post.value.title} – OpenSquawk News` },
      { property: 'og:description', content: description },
    ],
  }
})

const formatNewsDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
</script>

<style scoped>
.container-outer { @apply mx-auto max-w-screen-lg px-4; }
.card { @apply glass rounded-2xl p-6 md:p-10; }
.btn { @apply inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-medium transition; }
.btn-primary { @apply bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,.25)]; }
.chip { @apply inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 text-white px-3 py-1 text-xs; }
.news-body :deep(h2) { @apply text-2xl md:text-3xl font-semibold mt-6 mb-3 text-white; }
.news-body :deep(h3) { @apply text-xl font-semibold mt-5 mb-2 text-white; }
.news-body :deep(p) { @apply text-white/80 leading-relaxed mb-4; }
.news-body :deep(ul) { @apply list-disc list-inside text-white/75 mb-4 space-y-2; }
.news-body :deep(code) { @apply bg-white/10 px-1 py-0.5 rounded text-xs; }
.news-body :deep(a) { @apply text-cyan-300 underline; }
.glass { background: rgba(255,255,255,.06); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.08); }
</style>
