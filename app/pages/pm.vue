<script setup lang="ts">
// Legacy URL — /pm was renamed to /live-atc. Kept as a permanent redirect so
// old bookmarks/links (including admin bug-report deep links with query
// params like ?restoreBugReport=<id>) keep working.
definePageMeta({
  middleware: [
    (to) => navigateTo({ path: '/live-atc', query: to.query }, { redirectCode: 301 }),
  ],
})
</script>

<template>
  <div />
</template>
