<script setup lang="ts">
// /bridge is where the app sends anyone who does not have the desktop Bridge
// yet — the Live ATC card on the front page and the experience switcher in the
// classroom. There is no page for it here (only /bridge/connect, which pairs an
// already-installed Bridge with a code), so the bare path resolved to nothing
// and those links 404'd. The download lives on the website, so forward there.
const BRIDGE_DOWNLOAD_URL = 'https://opensquawk.de/bridge'

definePageMeta({
  layout: false,
  // Redirect from middleware, not from setup: an `await navigateTo()` in setup
  // suspends the first render and the navigation aborts it, leaving the URL
  // changed and the screen blank until a reload (see /start and /login).
  middleware: [() => navigateTo(BRIDGE_DOWNLOAD_URL, { external: true, replace: true })],
})
</script>

<template>
  <!-- Never seen: the middleware above redirects before this page renders. It
       exists so a component without a template can never be what is on screen. -->
  <div />
</template>
