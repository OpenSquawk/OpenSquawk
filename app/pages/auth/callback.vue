<template>
  <div class="callback-shell">
    <div class="callback-card">
      <template v-if="error">
        <h1 class="callback-title">Anmeldung fehlgeschlagen</h1>
        <p class="callback-text">{{ error }}</p>
        <button class="callback-action" type="button" @click="retry">Erneut anmelden</button>
      </template>
      <template v-else>
        <div class="callback-spinner" aria-hidden="true" />
        <h1 class="callback-title">Anmeldung wird abgeschlossen …</h1>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter, useRuntimeConfig, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'

// Consumer end of the SSO handoff: the issuer sent the browser here with a
// one-time code. Redeeming it happens server-side (the code alone is useless
// without SERVICE_SECRET); all this page does is trigger it and get out of the
// way.
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const auth = useAuthStore()

const error = ref('')

function safeRedirectTarget(): string {
  const raw = String(route.query.redirect || '/')
  // Only same-origin paths — never bounce onward to an absolute URL supplied
  // in the query string.
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'
}

function retry() {
  const issuer = String(config.public.authIssuer || '').replace(/\/+$/, '')
  const target = new URL(safeRedirectTarget(), window.location.origin).toString()
  if (!issuer) {
    return router.replace(`/login?redirect=${encodeURIComponent(safeRedirectTarget())}`)
  }
  return navigateTo(`${issuer}/login?redirect=${encodeURIComponent(target)}`, { external: true })
}

onMounted(async () => {
  const code = String(route.query.code || '').trim()
  if (!code) {
    error.value = 'Es wurde kein Anmelde-Code übergeben.'
    return
  }

  try {
    await auth.ssoCallback(code)
  } catch (err: any) {
    error.value = err?.data?.statusMessage
      || err?.statusMessage
      || 'Der Anmelde-Code ist abgelaufen oder wurde bereits verwendet.'
    return
  }

  await router.replace(safeRedirectTarget())
})
</script>

<style scoped>
.callback-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #0b1020;
  color: #e2e8f0;
}

.callback-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 380px;
}

.callback-title {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.callback-text {
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.5;
}

.callback-spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid rgba(34, 211, 238, 0.25);
  border-top-color: #22d3ee;
  animation: callback-spin 0.8s linear infinite;
}

.callback-action {
  padding: 9px 18px;
  border-radius: 999px;
  border: 1px solid rgba(34, 211, 238, 0.45);
  background: rgba(34, 211, 238, 0.1);
  color: #22d3ee;
  font-size: 0.85rem;
  cursor: pointer;
}

.callback-action:hover {
  background: rgba(34, 211, 238, 0.18);
}

@keyframes callback-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .callback-spinner { animation-duration: 2.4s; }
}
</style>
