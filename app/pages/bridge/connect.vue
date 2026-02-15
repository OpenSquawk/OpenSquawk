<template>
  <div class="relative min-h-screen bg-[#0B1020] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,187,215,0.14),transparent_55%)]"/>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(79,70,229,0.12),transparent_60%)]"/>

    <main class="relative mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 lg:px-8">
      <nav class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <NuxtLink
          to="/bridge"
          class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10 sm:w-auto"
        >
          <span aria-hidden="true">←</span>
          Download the Bridge
        </NuxtLink>
      </nav>

      <header class="mt-10 space-y-4 text-center sm:text-left">
        <p class="text-xs font-semibold uppercase tracking-[0.45em] text-[#16BBD7]">OpenSquawk Bridge</p>
        <h1 class="text-3xl font-semibold sm:text-4xl">Link your Bridge in seconds</h1>
        <p class="mx-auto max-w-2xl text-sm text-white/70 sm:mx-0">Follow the prompt from the desktop Bridge app and you&rsquo;ll be ready to fly.</p>
      </header>

      <div
        v-if="!hasToken"
        class="mt-10 rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-10 text-center shadow-[0_25px_80px_rgba(64,18,18,0.35)] sm:px-8"
      >
        <h2 class="text-2xl font-semibold">Open from the Bridge app</h2>
        <p class="mt-4 text-sm text-red-100/80">Launch the desktop Bridge and tap the &ldquo;Link account&rdquo; button so we can pass the code over automatically.</p>
        <p class="mt-6 text-xs uppercase tracking-[0.38em] text-red-200/60">Waiting for desktop link</p>
      </div>

      <template v-else>
        <section class="mt-10 rounded-3xl border border-white/10 bg-[#111832]/85 p-6 shadow-[0_24px_70px_rgba(5,10,30,0.55)] sm:p-8">
          <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16BBD7]/15 text-sm font-semibold text-[#16BBD7]">1</span>
            <div>
              <p class="text-xs uppercase tracking-[0.32em] text-white/55">Step 1</p>
              <h2 class="text-lg font-semibold">{{ isAuthenticated ? 'Signed in' : 'Sign in required' }}</h2>
            </div>
          </div>
          <p class="mt-4 text-sm text-white/70">
            {{ isAuthenticated ? 'You are authenticated with your OpenSquawk account.' : 'Please sign in once to link your Bridge token.' }}
          </p>

          <template v-if="isAuthenticated">
            <div class="mt-6 rounded-2xl border border-[#16BBD7]/40 bg-[#16BBD7]/10 px-5 py-4 text-sm">
              <p class="font-medium text-[#16BBD7]">You&rsquo;re signed in</p>
              <p class="mt-1 text-white/70">Logged in as <span class="font-semibold text-white">{{ authDisplayName }}</span>.</p>
              <p class="mt-3 text-xs text-white/60">
                Wrong account?
                <NuxtLink to="/logout" class="font-semibold text-[#72d9ea] transition hover:text-[#9be6f2]">Log out</NuxtLink>
                and sign in again.
              </p>
            </div>
          </template>
          <template v-else>
            <div class="mt-6">
              <NuxtLink
                :to="loginTarget"
                class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16BBD7] px-5 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#13a7c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72d9ea]"
              >
                Go to login
              </NuxtLink>
            </div>
          </template>
        </section>

        <section class="mt-6 rounded-3xl border border-white/10 bg-[#111832]/85 p-6 shadow-[0_24px_70px_rgba(5,10,30,0.55)] sm:p-8">
          <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16BBD7]/15 text-sm font-semibold text-[#16BBD7]">2</span>
            <div>
              <p class="text-xs uppercase tracking-[0.32em] text-white/55">Step 2</p>
              <h2 class="text-lg font-semibold">Confirm the code</h2>
            </div>
          </div>
          <p class="mt-4 text-sm text-white/70">This secure code comes straight from the desktop Bridge.</p>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <code class="rounded-2xl bg-[#0B132A]/80 px-4 py-2 font-mono text-sm text-[#72d9ea] shadow-inner">{{ token }}</code>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white"
              @click="copyToken"
            >
              <span aria-hidden="true">⧉</span>
              <span>{{ copiedToken ? 'Copied' : 'Copy code' }}</span>
            </button>
          </div>

          <div class="mt-6 space-y-4">
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16BBD7] px-5 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#13a7c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72d9ea] disabled:cursor-not-allowed disabled:bg-[#16BBD7]/60"
              :disabled="!isAuthenticated || connectLoading"
              @click="connectBridge"
            >
              <span v-if="connectLoading" class="flex items-center gap-2">
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-[#0B1020]/30 border-t-[#0B1020]"/>
                Linking …
              </span>
              <span v-else>Link Bridge</span>
            </button>

            <p v-if="connectError" class="text-sm text-red-300">{{ connectError }}</p>
            <p v-if="!isAuthenticated" class="text-sm text-white/60">Sign in first to enable bridge linking.</p>

            <div
              v-if="successBannerVisible"
              class="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100 shadow-[0_0_35px_rgba(16,185,129,0.25)]"
            >
              <p class="text-base font-semibold text-emerald-200">Bridge linked</p>
              <p class="mt-1 text-emerald-100/80">You can close this page and head back to the Bridge app.</p>
            </div>
          </div>
        </section>

        <section class="mt-6 rounded-3xl border border-white/10 bg-[#111832]/85 p-6 shadow-[0_24px_70px_rgba(5,10,30,0.55)] sm:p-8">
          <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16BBD7]/15 text-sm font-semibold text-[#16BBD7]">3</span>
            <div>
              <p class="text-xs uppercase tracking-[0.32em] text-white/55">Step 3</p>
              <h2 class="text-lg font-semibold">Watch the Bridge</h2>
            </div>
          </div>
          <p class="mt-4 text-sm text-white/70">The desktop app pings us every few seconds while it&rsquo;s running.</p>

          <div class="mt-5 space-y-4">
            <div
              class="rounded-2xl border px-4 py-4"
              :class="connectionStatus?.connected
                ? 'border-emerald-400/45 bg-emerald-400/10 shadow-[0_0_35px_rgba(16,185,129,0.25)]'
                : 'border-white/10 bg-[#0B132A]/75'"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm font-semibold">Bridge status</p>
                <span
                  class="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.32em]"
                  :class="connectionStatus?.connected ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/10 text-white/60'"
                >
                  {{ connectionStatus?.connected ? 'Linked' : 'Waiting' }}
                </span>
              </div>
              <p
                class="mt-3 text-base font-medium"
                :class="connectionStatus?.connected ? 'text-emerald-200' : 'text-white/60'"
              >
                {{ connectionLabel }}
              </p>
              <p v-if="connectionSubLabel" class="text-xs text-white/45">{{ connectionSubLabel }}</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div
                class="flex items-center gap-3 rounded-2xl border px-4 py-3"
                :class="connectionStatus?.simConnected
                  ? 'border-emerald-400/45 bg-emerald-400/10 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
                  : 'border-white/10 bg-[#0B132A]/75'"
              >
                <span
                  class="flex h-3 w-3 items-center justify-center rounded-full"
                  :class="connectionStatus?.simConnected
                    ? 'bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.85)]'
                    : 'bg-white/30'"
                />
                <div>
                  <p class="text-sm font-semibold">Simulator</p>
                  <p class="text-xs text-white/60">{{ connectionStatus?.simConnected ? 'Simulator detected' : 'Waiting for simulator' }}</p>
                </div>
              </div>
              <div
                class="flex items-center gap-3 rounded-2xl border px-4 py-3"
                :class="connectionStatus?.flightActive
                  ? 'border-emerald-400/45 bg-emerald-400/10 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
                  : 'border-white/10 bg-[#0B132A]/75'"
              >
                <span
                  class="flex h-3 w-3 items-center justify-center rounded-full"
                  :class="connectionStatus?.flightActive
                    ? 'bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.85)]'
                    : 'bg-white/30'"
                />
                <div>
                  <p class="text-sm font-semibold">Flight</p>
                  <p class="text-xs text-white/60">{{ connectionStatus?.flightActive ? 'Flight in progress' : 'No flight detected' }}</p>
                </div>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl border border-white/10 bg-[#0B132A]/75 px-4 py-3 text-sm text-white/65">
                <p class="text-xs uppercase tracking-[0.28em] text-white/45">Connected since</p>
                <p class="mt-1 font-medium text-white">{{ formattedConnectedAt }}</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-[#0B132A]/75 px-4 py-3 text-sm text-white/65">
                <p class="text-xs uppercase tracking-[0.28em] text-white/45">Last update</p>
                <p class="mt-1 font-medium text-white">{{ formattedLastStatusAt }}</p>
              </div>
            </div>
          </div>

          <p v-if="statusLoading" class="mt-6 text-xs uppercase tracking-[0.38em] text-white/45">Refreshing …</p>
          <p v-if="statusError" class="mt-2 text-sm text-red-300">{{ statusError }}</p>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useHead, useRoute } from '#imports'
import { useAuthStore } from '~/stores/auth'

interface BridgeStatusPayload {
  token: string
  connected: boolean
  user: {
    id: string
    email: string
    name?: string | null
  } | null
  simConnected: boolean
  flightActive: boolean
  connectedAt: string | null
  lastStatusAt: string | null
}

useHead({ title: 'Link Bridge · OpenSquawk' })

const route = useRoute()
const auth = useAuthStore()
const { user, accessToken, isAuthenticated, initialized } = storeToRefs(auth)

const connectLoading = ref(false)
const connectError = ref('')
const connectSuccess = ref(false)

const connectionStatus = ref<BridgeStatusPayload | null>(null)
const statusInitialized = ref(false)
const statusError = ref('')
const statusLoading = ref(false)
const statusRequestActive = ref(false)

const copiedToken = ref(false)

const token = computed(() => {
  const value = route.query.token
  if (Array.isArray(value)) {
    return value[0] || ''
  }
  return typeof value === 'string' ? value : ''
})

const hasToken = computed(() => token.value.length > 0)
const loginTarget = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath || '/bridge')}`)

const authDisplayName = computed(() => {
  if (!user.value) return ''
  return user.value.name || user.value.email
})

const connectionLabel = computed(() => {
  if (!connectionStatus.value?.connected) {
    return 'Waiting for the desktop app'
  }
  const name = connectionStatus.value.user?.name || connectionStatus.value.user?.email
  return name ? `Linked as ${name}` : 'Linked'
})

const connectionSubLabel = computed(() => {
  if (!connectionStatus.value?.connected) return null
  return connectionStatus.value.user?.email && connectionStatus.value.user.email !== connectionStatus.value.user?.name
    ? connectionStatus.value.user.email
    : null
})

const formattedConnectedAt = computed(() => formatTimestamp(connectionStatus.value?.connectedAt ?? null))
const formattedLastStatusAt = computed(() => formatTimestamp(connectionStatus.value?.lastStatusAt ?? null))

const successBannerVisible = computed(() => connectSuccess.value || Boolean(connectionStatus.value?.connected))

function formatTimestamp(value: string | null) {
  if (!value) {
    return '—'
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(parsed)
}

async function connectBridge() {
  if (!hasToken.value || !accessToken.value) {
    return
  }

  connectLoading.value = true
  connectError.value = ''
  try {
    await $fetch('/api/bridge/connect', {
      method: 'POST',
      body: { token: token.value },
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
      },
    })
    connectSuccess.value = true
    await fetchStatus(true)
  } catch (err: any) {
    connectError.value =
      err?.data?.statusMessage ||
      err?.response?._data?.statusMessage ||
      err?.message ||
      'Could not link the token.'
  } finally {
    connectLoading.value = false
  }
}

async function fetchStatus(force = false) {
  if (!hasToken.value) {
    return
  }
  if (statusRequestActive.value) {
    return
  }

  statusRequestActive.value = true
  if (force || !statusInitialized.value) {
    statusLoading.value = true
  }

  try {
    const response = await $fetch<BridgeStatusPayload>('/api/bridge/me', {
      params: { token: token.value },
    })
    connectionStatus.value = response
    statusError.value = ''
    statusInitialized.value = true
    if (response.connected) {
      connectSuccess.value = true
    }
  } catch (err: any) {
    statusError.value =
      err?.data?.statusMessage ||
      err?.response?._data?.statusMessage ||
      err?.message ||
      'We could not refresh the status.'
  } finally {
    statusRequestActive.value = false
    statusLoading.value = false
  }
}

async function copyToken() {
  if (!hasToken.value) return
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(token.value)
    copiedToken.value = true
    setTimeout(() => {
      copiedToken.value = false
    }, 2000)
  } catch {
    // Ignore copy errors – clipboard access is optional
  }
}

let poller: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (poller) {
    clearInterval(poller)
    poller = null
  }
}

function startPolling() {
  stopPolling()
  if (!hasToken.value) {
    return
  }
  fetchStatus(!statusInitialized.value)
  poller = setInterval(() => {
    fetchStatus()
  }, 5000)
}

watch(token, () => {
  connectError.value = ''
  connectSuccess.value = false
  connectionStatus.value = null
  statusInitialized.value = false
  statusError.value = ''
  startPolling()
})

watch(
  () => isAuthenticated.value,
  (value) => {
    if (value && hasToken.value) {
      fetchStatus(true)
    }
  },
)

onMounted(() => {
  if (!initialized.value) {
    auth.fetchUser().catch(() => {})
  }
  startPolling()
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
code {
  word-break: break-all;
}
</style>
