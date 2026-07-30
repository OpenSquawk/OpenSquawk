<script setup lang="ts">
// /bridge is the address everything points at — the Live ATC card on the front
// page, the cockpit's "connect a bridge" hint, and the post-login redirect the
// pairing screen builds for itself. The page behind it is /bridge/connect, so
// the bare path resolved to nothing and every one of those links 404'd.
definePageMeta({
  layout: false,
  // Redirect from middleware, not from setup: an `await navigateTo()` in setup
  // suspends the first render and the navigation aborts it, leaving the URL
  // changed and the screen blank until a reload (see /start and /login).
  middleware: [to => navigateTo({ path: '/bridge/connect', query: to.query }, { replace: true })],
})
</script>

<template>
  <!-- Never seen: the middleware above redirects before this page renders. It
       exists so a component without a template can never be what is on screen. -->
  <div />
</template>
