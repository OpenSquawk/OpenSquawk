<template>
  <div class="min-h-screen bg-[#0b1020] text-white">
    <div class="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div class="space-y-3">
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">OpenSquawk</p>
        <h1 class="text-3xl font-semibold">Signing you out…</h1>
        <p class="text-sm text-white/70">
          We're logging you out and will redirect you in a moment.
        </p>
      </div>
      <v-progress-circular indeterminate size="40" width="3" color="cyan" />
      <NuxtLink to="/login" class="text-sm text-cyan-300 underline">Back to login</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const config = useRuntimeConfig()

useHead({
  title: 'Logout – OpenSquawk',
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
})

onMounted(async () => {
  await auth.logout()

  // Sign out at the issuer too. Sending the user to the app's own /login would
  // only forward them back to an issuer where they are still signed in — they
  // would be handed a fresh code and land straight back inside, which is not
  // what "log out" means.
  const issuer = String(config.public.authIssuer || '').replace(/\/+$/, '')
  if (issuer) {
    return navigateTo(`${issuer}/logout`, { external: true })
  }

  router.replace('/')
})
</script>


