<script setup lang="ts">
// This page was /start in the monorepo and became the app's front page in the
// split (see index.vue). Bookmarks, the website's redirect and every link that
// predates the split still point at /start, so catch it here instead of
// showing a 404 — the app should not depend on the website being redeployed
// for its own old URLs to work.
definePageMeta({
  layout: false,
  // The redirect has to happen in middleware, not in setup. `await navigateTo()`
  // inside setup suspends the very first render, and the navigation it waits on
  // aborts that render: the URL flips to `/` but nothing is ever painted, so the
  // visitor sits on a blank page until they reload. Middleware runs before the
  // page renders at all, which is the only place a pure redirect route belongs.
  middleware: [to => navigateTo({ path: '/', query: to.query }, { replace: true })],
})
</script>

<template>
  <!-- Never seen: the middleware above redirects before this page renders. It
       exists so a component without a template can never be what is on screen. -->
  <div />
</template>
