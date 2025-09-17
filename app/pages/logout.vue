<template>
  <div class="min-h-screen bg-[#0b1020] text-white">
    <div class="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div class="space-y-3">
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">OpenSquawk</p>
        <h1 class="text-3xl font-semibold">Du wirst abgemeldet…</h1>
        <p class="text-sm text-white/70">
          Wir melden dich vom Alpha-Dienst ab und leiten dich gleich weiter.
        </p>
      </div>
      <v-progress-circular indeterminate size="40" width="3" color="cyan" />
      <NuxtLink to="/login" class="text-sm text-cyan-300 underline">Zum Login</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '#imports'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const auth = useAuthStore()

useHead({
  title: 'Logout – OpenSquawk',
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
})

onMounted(async () => {
  await auth.logout()
  router.replace('/login')
})
</script>


