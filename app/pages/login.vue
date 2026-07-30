<script setup lang="ts">
import { buildIssuerLoginUrl } from '~~/shared/utils/ssoHandoff'

/**
 * Not a login page — the app has none by design, identity comes from the
 * issuer. This only exists because /login is where the code still sends people
 * (logout, the live-atc session guard, the bridge pairing screen), and in the
 * monorepo that path resolved to the website's login form. Since the split it
 * resolved to nothing, so signing out dropped the user on a 404.
 */
definePageMeta({
  layout: false,
  // Forwarding from middleware, not from setup: an `await navigateTo()` in
  // setup aborts the render it suspends, which leaves a cold load sitting on a
  // blank page instead of moving it along.
  middleware: [
    (to) => {
      const config = useRuntimeConfig()
      const issuer = String(config.public.authIssuer || '').replace(/\/+$/, '')
      const raw = String(to.query.redirect || '/')
      // Only same-origin paths — never bounce onward to an absolute URL from the query.
      const target = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'

      if (issuer) {
        return navigateTo(buildIssuerLoginUrl(issuer, window.location.origin, target), {
          external: true,
        })
      }

      // AUTH_MODE=open: no login exists at all, every request is the local identity.
      return navigateTo(target, { replace: true })
    },
  ],
})
</script>

<template>
  <!-- Never seen: the middleware above forwards before this page renders. -->
  <div />
</template>
