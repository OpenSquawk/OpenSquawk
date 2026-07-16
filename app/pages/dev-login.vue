<script setup lang="ts">
// Local-dev-only auto-login helper: navigate to /dev-login?redirect=/some/page
// to skip the invite-only login form while testing on localhost. Backed by
// POST /api/dev/login, which is hard-disabled outside development.
definePageMeta({ layout: false })

const route = useRoute()
const auth = useAuthStore()
const status = ref('Logging in…')

onMounted(async () => {
  if (!import.meta.dev) {
    status.value = 'Dev login is disabled outside local development.'
    return
  }
  try {
    const response = await $fetch<{ accessToken: string; user: any }>('/api/dev/login', { method: 'POST' })
    auth.setAccessToken(response.accessToken)
    auth.setUser(response.user)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await navigateTo(redirect)
  } catch {
    status.value = 'Dev login failed — check the server console.'
  }
})
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-[#070d1a] text-sm text-white/60">
    {{ status }}
  </div>
</template>
