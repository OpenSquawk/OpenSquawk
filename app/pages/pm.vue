<script setup lang="ts">
// Legacy URL — /pm was renamed to /live-atc. Kept as a permanent redirect so
// old bookmarks and links keep working.
definePageMeta({
  middleware: [
    (to) => navigateTo({ path: '/live-atc', query: to.query }, { redirectCode: 301 }),
  ],
})
</script>

<template>
  <div />
</template>
