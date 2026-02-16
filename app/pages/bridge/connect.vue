<template>
  <div class="bridge-connect-page">
    <div class="bridge-connect-background" aria-hidden="true">
      <div class="bridge-connect-background__aurora"/>
      <div class="bridge-connect-background__photo"/>
      <div class="bridge-connect-background__noise"/>
    </div>

    <div
      v-if="successBlastVisible"
      :key="successBlastKey"
      class="bridge-success-overlay"
      aria-hidden="true"
    >
      <div class="bridge-success-blast">
        <div class="bridge-success-ring bridge-success-ring--one"/>
        <div class="bridge-success-ring bridge-success-ring--two"/>
        <div class="bridge-success-ring bridge-success-ring--three"/>

        <span
          v-for="spark in successSparks"
          :key="spark"
          class="bridge-success-spark"
          :style="{
            '--spark-angle': `${(spark / successSparks.length) * 360}deg`,
            '--spark-delay': `${spark * 0.028}s`,
          }"
        />

        <div class="bridge-success-core">
          <span class="bridge-success-check">✓</span>
        </div>
        <p class="bridge-success-label">Bridge linked</p>
      </div>
    </div>

    <main class="relative mx-auto w-full max-w-6xl px-5 pb-14 pt-10 sm:px-7 lg:px-10">
      <nav class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <NuxtLink
          to="/bridge"
          class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.15] bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/[0.3] hover:bg-white/10 sm:w-auto"
        >
          <span aria-hidden="true">←</span>
          Bridge overview
        </NuxtLink>

      </nav>

      <header class="mx-auto mt-9 max-w-3xl space-y-4 text-center sm:text-left">
        <p class="text-xs font-semibold uppercase tracking-[0.42em] text-[#16BBD7]">OpenSquawk Bridge</p>
        <h1 class="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
          Link your simulator in one clean flow
        </h1>
        <p class="text-sm text-white/[0.72] sm:text-base">
          Just two things matter: signed in account + a pairing code. If your Bridge app opened this page with a URL token, you can link instantly.
        </p>
      </header>

      <section class="mt-10 grid gap-5 lg:grid-cols-[1.08fr_1fr]">
        <article class="bridge-surface bridge-surface--warm p-5 sm:p-6 lg:p-7">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-[0.26em] text-[#7edeee]/85">Step 1</p>
              <h2 class="mt-2 text-2xl font-semibold">Pairing code</h2>
            </div>
            <span
              class="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.26em]"
              :class="hasToken ? 'border-[#16BBD7]/[0.55] bg-[#16BBD7]/[0.14] text-[#9ae8f4]' : 'border-white/[0.15] bg-white/[0.06] text-white/60'"
            >
              {{ hasToken ? 'Code ready' : 'Waiting for code' }}
            </span>
          </div>

          <div v-if="!hasToken" class="mt-6 space-y-5">
            <p class="text-sm text-white/[0.72]">
              Paste the 6-character pairing code from your desktop Bridge app.
            </p>

            <form class="space-y-4" @submit.prevent="applyPairingCode">
              <div class="rounded-3xl border border-[#16BBD7]/[0.35] bg-[#081129]/[0.72] p-4">
                <label for="pairing-code" class="block text-xs font-semibold uppercase tracking-[0.28em] text-[#9be6f2]/[0.86]">
                  Pairing code
                </label>
                <input
                  id="pairing-code"
                  v-model="manualTokenInput"
                  type="text"
                  inputmode="text"
                  autocapitalize="characters"
                  autocomplete="one-time-code"
                  spellcheck="false"
                  maxlength="6"
                  placeholder="A1B2C3"
                  class="mt-3 w-full rounded-2xl border border-[#16BBD7]/[0.5] bg-[#050c1f] px-4 py-4 text-center font-mono text-3xl font-semibold uppercase tracking-[0.44em] text-[#9be6f2] placeholder:text-[#9be6f2]/[0.35] focus:border-[#72d9ea] focus:outline-none"
                  @input="onManualTokenInput"
                >
                <p class="mt-3 text-xs uppercase tracking-[0.24em] text-white/[0.52]">A-Z and 0-9 only</p>
              </div>

              <button
                type="submit"
                class="inline-flex w-full items-center justify-center rounded-2xl bg-[#16BBD7] px-5 py-3 text-sm font-semibold text-[#081226] transition hover:bg-[#13aac5] disabled:cursor-not-allowed disabled:bg-[#16BBD7]/[0.55]"
                :disabled="!manualTokenReady"
              >
                Continue with this code
              </button>

              <p v-if="manualTokenError" class="text-sm text-amber-200">{{ manualTokenError }}</p>
            </form>
          </div>

          <div v-else class="mt-6 space-y-5">
            <p class="text-sm text-white/[0.72]">
              Confirmed pairing code. Tap it to copy if you need to paste it back into the Bridge app.
            </p>

            <button
              type="button"
              class="bridge-token-btn"
              :title="'Click to copy code'"
              @click="copyToken"
            >
              <span class="bridge-token-btn__code">{{ token }}</span>
              <span class="bridge-token-btn__hint">{{ copiedToken ? 'Copied' : '' }}</span>
            </button>

            <div class="flex flex-wrap items-center gap-3">
              <span class="rounded-full border border-[#16BBD7]/[0.4] bg-[#16BBD7]/[0.12] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#9be6f2]">
                {{ hasQueryToken ? 'Loaded from URL' : 'Set manually' }}
              </span>
              <button
                type="button"
                class="text-xs uppercase tracking-[0.24em] text-white/[0.68] transition hover:text-white"
                @click="clearPairingCode"
              >
                Use another code
              </button>
            </div>
          </div>
        </article>

        <article class="bridge-surface p-5 sm:p-6 lg:p-7">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-[0.26em] text-[#7edeee]/85">Step 2</p>
              <h2 class="mt-2 text-2xl font-semibold">Account + link</h2>
            </div>
            <span
              class="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.26em]"
              :class="hasAuthenticatedUser ? 'border-emerald-300/[0.45] bg-emerald-400/[0.12] text-emerald-100' : 'border-white/[0.15] bg-white/[0.06] text-white/60'"
            >
              {{ hasAuthenticatedUser ? 'Signed in' : 'Login needed' }}
            </span>
          </div>

          <div class="mt-6 space-y-4">
            <div class="rounded-2xl border border-white/[0.12] bg-[#0B132A]/[0.78] px-4 py-4">
              <p class="text-xs uppercase tracking-[0.24em] text-white/[0.52]">Signed in account</p>

              <template v-if="hasAuthenticatedUser">
                <p class="mt-2 text-base font-semibold text-white">{{ authDisplayName }}</p>
                <p class="mt-2 text-xs text-white/60">
                  Wrong user?
                  <NuxtLink to="/logout" class="font-semibold text-[#86e8f7] transition hover:text-[#b4f3fb]">Logout and switch</NuxtLink>
                </p>
              </template>

              <template v-else>
                <p class="mt-2 text-sm text-white/[0.68]">Sign in once, then link this pairing code to your account.</p>
                <NuxtLink
                  :to="loginTarget"
                  class="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#16BBD7] px-4 py-3 text-sm font-semibold text-[#081226] transition hover:bg-[#13aac5]"
                >
                  Go to login
                </NuxtLink>
              </template>
            </div>

            <div class="rounded-2xl border border-white/[0.12] bg-[#0B132A]/[0.78] px-4 py-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold">Bridge link status</p>
                <span
                  class="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]"
                  :class="alreadyLinked ? 'bg-emerald-400/[0.18] text-emerald-100' : 'bg-white/10 text-white/[0.62]'"
                >
                  {{ alreadyLinked ? 'Linked' : 'Not linked' }}
                </span>
              </div>

              <p class="mt-3 text-sm" :class="alreadyLinked ? 'text-emerald-100/[0.9]' : 'text-white/[0.68]'">
                {{ connectionLabel }}
              </p>
              <p class="mt-1 text-xs text-white/[0.44]">Connected since {{ formattedConnectedAt }}</p>

              <div class="mt-5 space-y-3">
                <div v-if="alreadyLinked" class="space-y-3">
                  <button
                    type="button"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="!hasAuthenticatedUser || disconnectLoading"
                    @click="disconnectBridge"
                  >
                    <span v-if="disconnectLoading" class="flex items-center gap-2">
                      <span class="h-4 w-4 animate-spin rounded-full border-2 border-rose-100/35 border-t-rose-100"/>
                      Unlinking …
                    </span>
                    <span v-else>Unlink Bridge</span>
                  </button>
                </div>

                <button
                  v-else
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16BBD7] px-5 py-3 text-sm font-semibold text-[#081226] transition hover:bg-[#13aac5] disabled:cursor-not-allowed disabled:bg-[#16BBD7]/[0.55]"
                  :disabled="!hasAuthenticatedUser || !hasToken || connectLoading"
                  @click="connectBridge"
                >
                  <span v-if="connectLoading" class="flex items-center gap-2">
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-[#081226]/[0.35] border-t-[#081226]"/>
                    Linking …
                  </span>
                  <span v-else>Link Bridge now</span>
                </button>
              </div>

              <p v-if="disconnectError" class="mt-3 text-sm text-red-300">{{ disconnectError }}</p>
              <p v-if="connectError" class="mt-3 text-sm text-red-300">{{ connectError }}</p>
              <p v-if="tokenLinkedWithoutAuth" class="mt-3 text-sm text-amber-100/90">This code is already linked. Sign in to manage it.</p>
              <p v-else-if="tokenLinkedToOtherUser" class="mt-3 text-sm text-amber-100/90">This code is linked to another account.</p>
              <p v-if="!hasToken" class="mt-3 text-sm text-white/60">Enter or load a pairing code first.</p>
              <p v-else-if="!hasAuthenticatedUser" class="mt-3 text-sm text-white/60">Sign in first to enable linking.</p>

              <div
                v-if="successBannerVisible"
                class="bridge-success-banner mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
              >
                <p class="font-semibold text-emerald-200">Bridge linked</p>
                <p class="mt-1 text-emerald-100/80">You can close this page and return to the desktop app.</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="mt-5 grid gap-3 sm:grid-cols-3">
        <article class="bridge-mini-card">
          <p class="bridge-mini-card__label">Code</p>
          <p class="bridge-mini-card__value">{{ hasToken ? 'Ready' : 'Missing' }}</p>
        </article>
        <article class="bridge-mini-card">
          <p class="bridge-mini-card__label">Auth</p>
          <p class="bridge-mini-card__value">{{ hasAuthenticatedUser ? 'Ready' : 'Missing' }}</p>
        </article>
        <article class="bridge-mini-card">
          <p class="bridge-mini-card__label">Bridge</p>
          <p class="bridge-mini-card__value">{{ alreadyLinked ? 'Linked' : 'Waiting' }}</p>
        </article>
      </section>

      <p v-if="statusLoading" class="mt-4 text-xs uppercase tracking-[0.34em] text-white/[0.42]">Refreshing status …</p>
      <p v-if="statusError" class="mt-2 text-sm text-red-300">{{ statusError }}</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useHead, useRoute, useRouter } from '#imports'
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
const router = useRouter()
const auth = useAuthStore()
const { user, accessToken, isAuthenticated, initialized } = storeToRefs(auth)

const connectLoading = ref(false)
const connectError = ref('')
const connectSuccess = ref(false)
const disconnectLoading = ref(false)
const disconnectError = ref('')

const connectionStatus = ref<BridgeStatusPayload | null>(null)
const statusInitialized = ref(false)
const statusError = ref('')
const statusLoading = ref(false)
const statusRequestActive = ref(false)

const copiedToken = ref(false)
const manualTokenInput = ref('')
const manualTokenError = ref('')
const successBlastVisible = ref(false)
const successBlastKey = ref(0)
const autoConnectAttemptKey = ref('')

const token = computed(() => {
  const value = route.query.token
  const rawToken = Array.isArray(value)
    ? value[0] || ''
    : typeof value === 'string'
      ? value
      : ''
  return rawToken.trim()
})

const hasToken = computed(() => token.value.length >= 6)
const hasQueryToken = computed(() => {
  const value = route.query.token
  if (Array.isArray(value)) {
    return Boolean(value[0])
  }
  return typeof value === 'string' && value.trim().length > 0
})
const manualTokenRemaining = computed(() => Math.max(0, 6 - manualTokenInput.value.length))
const manualTokenReady = computed(() => manualTokenRemaining.value === 0)
const loginTarget = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath || '/bridge')}`)

const authDisplayName = computed(() => {
  if (!user.value) return ''
  return user.value.name || user.value.email
})

const hasAuthenticatedUser = computed(() => Boolean(isAuthenticated.value && user.value))
const isLinkedToAuthenticatedUser = computed(() => {
  if (!hasAuthenticatedUser.value || !connectionStatus.value?.connected) {
    return false
  }
  return connectionStatus.value.user?.id === user.value?.id
})
const tokenLinkedWithoutAuth = computed(() => Boolean(connectionStatus.value?.connected && !hasAuthenticatedUser.value))
const tokenLinkedToOtherUser = computed(() => {
  if (!connectionStatus.value?.connected || !hasAuthenticatedUser.value) {
    return false
  }
  return connectionStatus.value.user?.id !== user.value?.id
})

const connectionLabel = computed(() => {
  if (!hasToken.value) {
    return 'Pairing code missing'
  }
  if (!connectionStatus.value?.connected) {
    return 'Waiting for confirmation'
  }
  if (tokenLinkedWithoutAuth.value) {
    return 'Code already linked'
  }
  if (tokenLinkedToOtherUser.value) {
    return 'Linked to a different account'
  }
  const name = connectionStatus.value.user?.name || connectionStatus.value.user?.email
  return name ? `Linked as ${name}` : 'Linked successfully'
})

const formattedConnectedAt = computed(() => formatTimestamp(connectionStatus.value?.connectedAt ?? null))
const successBannerVisible = computed(() => hasAuthenticatedUser.value && (connectSuccess.value || isLinkedToAuthenticatedUser.value))
const alreadyLinked = computed(() => isLinkedToAuthenticatedUser.value)
const successSparks = Array.from({ length: 14 }, (_unused, index) => index)

function sanitizePairingCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

let successBlastTimer: ReturnType<typeof setTimeout> | null = null

function triggerSuccessBlast() {
  successBlastKey.value += 1
  successBlastVisible.value = true
  if (successBlastTimer) {
    clearTimeout(successBlastTimer)
  }
  successBlastTimer = setTimeout(() => {
    successBlastVisible.value = false
    successBlastTimer = null
  }, 2200)
}

function onManualTokenInput() {
  manualTokenInput.value = sanitizePairingCode(manualTokenInput.value)
  if (manualTokenError.value && manualTokenReady.value) {
    manualTokenError.value = ''
  }
}

async function applyPairingCode() {
  manualTokenInput.value = sanitizePairingCode(manualTokenInput.value)
  if (!manualTokenReady.value) {
    manualTokenError.value = 'Please enter a valid 6-character pairing code.'
    return
  }

  manualTokenError.value = ''
  connectError.value = ''
  await router.replace({
    query: {
      ...route.query,
      token: manualTokenInput.value,
    },
  })
}

async function clearPairingCode() {
  manualTokenInput.value = ''
  manualTokenError.value = ''
  connectError.value = ''
  disconnectError.value = ''

  const query = { ...route.query }
  delete query.token

  await router.replace({ query })
}

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
  if (!hasToken.value || !accessToken.value || !hasAuthenticatedUser.value) {
    return
  }

  connectLoading.value = true
  connectError.value = ''
  disconnectError.value = ''

  try {
    await $fetch('/api/bridge/connect', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        'x-bridge-token': token.value,
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

async function disconnectBridge() {
  if (!hasToken.value || !accessToken.value || !hasAuthenticatedUser.value) {
    return
  }

  disconnectLoading.value = true
  disconnectError.value = ''
  connectError.value = ''

  try {
    await $fetch('/api/bridge/disconnect', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        'x-bridge-token': token.value,
      },
    })

    connectSuccess.value = false
    autoConnectAttemptKey.value = `${token.value}:${accessToken.value}`
    await fetchStatus(true)
  } catch (err: any) {
    disconnectError.value =
      err?.data?.statusMessage ||
      err?.response?._data?.statusMessage ||
      err?.message ||
      'Could not unlink the token.'
  } finally {
    disconnectLoading.value = false
  }
}

async function maybeAutoConnect() {
  if (!hasToken.value || !initialized.value || !hasAuthenticatedUser.value || !accessToken.value || connectLoading.value) {
    return
  }

  const attemptKey = `${token.value}:${accessToken.value}`
  if (autoConnectAttemptKey.value === attemptKey) {
    return
  }

  if (connectionStatus.value?.connected) {
    autoConnectAttemptKey.value = attemptKey
    return
  }

  autoConnectAttemptKey.value = attemptKey
  await connectBridge()
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
      headers: {
        'x-bridge-token': token.value,
      },
    })

    connectionStatus.value = response
    statusError.value = ''
    statusInitialized.value = true

    if (response.connected && hasAuthenticatedUser.value && response.user?.id === user.value?.id) {
      connectSuccess.value = true
    } else {
      connectSuccess.value = false
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
    }, 1800)
  } catch {
    // Ignore clipboard errors.
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
  disconnectError.value = ''
  connectSuccess.value = false
  autoConnectAttemptKey.value = ''
  connectionStatus.value = null
  statusInitialized.value = false
  statusError.value = ''

  if (successBlastTimer) {
    clearTimeout(successBlastTimer)
    successBlastTimer = null
  }
  successBlastVisible.value = false

  startPolling()
})

watch(
  () => hasAuthenticatedUser.value,
  (value) => {
    if (value && hasToken.value) {
      fetchStatus(true)
      return
    }
    connectSuccess.value = false
  },
)

watch(
  [hasToken, initialized, hasAuthenticatedUser, accessToken, () => connectionStatus.value?.connected ?? false],
  () => {
    void maybeAutoConnect()
  },
  { immediate: true },
)

watch(
  () => successBannerVisible.value,
  (visible, wasVisible) => {
    if (visible && !wasVisible) {
      triggerSuccessBlast()
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

  if (successBlastTimer) {
    clearTimeout(successBlastTimer)
    successBlastTimer = null
  }
})
</script>

<style scoped>
.bridge-connect-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(130% 80% at 14% -8%, rgba(22, 187, 215, 0.18), transparent 65%),
    radial-gradient(110% 72% at 86% -12%, rgba(70, 98, 255, 0.22), transparent 70%),
    linear-gradient(180deg, #070d1d 0%, #070b1a 48%, #050816 100%);
}

.bridge-connect-background {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 0;
}

.bridge-connect-background__aurora {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 28% 14%, rgba(113, 242, 255, 0.12), transparent 48%),
    radial-gradient(circle at 75% 9%, rgba(22, 187, 215, 0.12), transparent 44%),
    radial-gradient(circle at 52% 86%, rgba(6, 182, 212, 0.1), transparent 56%);
}

.bridge-connect-background__photo {
  position: absolute;
  inset: -8%;
  background-image: url('/img/bridge/goldengate_angle.jpeg');
  background-position: center 30%;
  background-size: cover;
  opacity: 0.34;
  filter: saturate(1.08) contrast(1.06) brightness(0.82);
  transform: scale(1.06);
  -webkit-mask-image: radial-gradient(circle at 50% 30%, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.86) 26%, rgba(0, 0, 0, 0.34) 58%, transparent 79%);
  mask-image: radial-gradient(circle at 50% 30%, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.86) 26%, rgba(0, 0, 0, 0.34) 58%, transparent 79%);
}

.bridge-connect-background__noise {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(6, 11, 24, 0.12), rgba(6, 11, 24, 0.72));
}

.bridge-surface {
  position: relative;
  border-radius: 1.8rem;
  border: 1px solid rgba(255, 255, 255, 0.13);
  background:
    linear-gradient(150deg, rgba(13, 23, 46, 0.82), rgba(7, 14, 32, 0.84));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 26px 70px rgba(2, 7, 22, 0.5);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  animation: bridge-surface-in 580ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bridge-surface--warm {
  background:
    linear-gradient(165deg, rgba(16, 32, 64, 0.86), rgba(8, 16, 36, 0.86));
}

.bridge-token-btn {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 1.3rem;
  border: 1px solid rgba(22, 187, 215, 0.55);
  background:
    radial-gradient(circle at 20% 20%, rgba(22, 187, 215, 0.24), transparent 45%),
    rgba(5, 12, 31, 0.84);
  padding: 1.05rem 1rem;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.bridge-token-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(122, 224, 241, 0.8);
  box-shadow: 0 14px 34px rgba(5, 35, 55, 0.45);
}

.bridge-token-btn__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: clamp(1.6rem, 4.8vw, 2.4rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  color: rgba(165, 240, 250, 0.98);
}

.bridge-token-btn__hint {
  font-size: 0.69rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.56);
}

.bridge-mini-card {
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: rgba(10, 18, 39, 0.68);
  padding: 0.85rem 0.9rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09);
}

.bridge-mini-card__label {
  font-size: 0.62rem;
  letter-spacing: 0.23em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.bridge-mini-card__value {
  margin-top: 0.35rem;
  font-size: 0.94rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
}

.bridge-success-banner {
  position: relative;
  overflow: hidden;
  animation: bridge-success-card-in 520ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bridge-success-banner::before {
  content: '';
  position: absolute;
  inset: -1px;
  background: linear-gradient(112deg, transparent 12%, rgba(167, 243, 208, 0.82) 48%, transparent 82%);
  transform: translateX(-120%);
  animation: bridge-success-sheen 1200ms ease-out forwards;
  pointer-events: none;
}

.bridge-success-overlay {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.bridge-success-blast {
  position: relative;
  display: grid;
  place-items: center;
  width: min(74vmin, 440px);
  aspect-ratio: 1;
  animation: bridge-success-fade 2200ms ease-out forwards;
}

.bridge-success-core {
  position: relative;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 6.25rem;
  height: 6.25rem;
  border-radius: 999px;
  border: 2px solid rgba(74, 222, 128, 0.78);
  background: radial-gradient(circle at 30% 30%, rgba(167, 243, 208, 0.92), rgba(16, 185, 129, 0.72) 62%, rgba(5, 150, 105, 0.84));
  box-shadow:
    0 0 60px rgba(16, 185, 129, 0.85),
    inset 0 0 28px rgba(220, 252, 231, 0.55);
  animation: bridge-success-core 700ms cubic-bezier(0.22, 1, 0.36, 1);
}

.bridge-success-check {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgba(4, 32, 18, 0.8);
  text-shadow: 0 2px 8px rgba(220, 252, 231, 0.45);
}

.bridge-success-label {
  position: absolute;
  bottom: 14%;
  z-index: 3;
  margin: 0;
  border-radius: 999px;
  border: 1px solid rgba(167, 243, 208, 0.52);
  background: rgba(6, 95, 70, 0.72);
  padding: 0.55rem 1rem;
  font-size: 0.76rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(236, 253, 245, 0.96);
  animation: bridge-success-label 820ms cubic-bezier(0.16, 1, 0.3, 1);
}

.bridge-success-ring {
  position: absolute;
  inset: auto;
  border-radius: 999px;
  border: 2px solid rgba(110, 231, 183, 0.62);
  opacity: 0;
}

.bridge-success-ring--one {
  width: 38%;
  aspect-ratio: 1;
  animation: bridge-success-ring 980ms cubic-bezier(0.16, 1, 0.3, 1);
}

.bridge-success-ring--two {
  width: 54%;
  aspect-ratio: 1;
  animation: bridge-success-ring 980ms 120ms cubic-bezier(0.16, 1, 0.3, 1);
}

.bridge-success-ring--three {
  width: 72%;
  aspect-ratio: 1;
  animation: bridge-success-ring 980ms 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.bridge-success-spark {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0.33rem;
  height: 3.6rem;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(236, 253, 245, 1), rgba(16, 185, 129, 0));
  opacity: 0;
  transform-origin: 50% 0%;
  animation: bridge-success-spark 920ms var(--spark-delay) cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes bridge-surface-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bridge-success-card-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bridge-success-sheen {
  to {
    transform: translateX(120%);
  }
}

@keyframes bridge-success-fade {
  0% {
    opacity: 0;
    transform: scale(0.88);
  }
  15% {
    opacity: 1;
    transform: scale(1);
  }
  76% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.08);
  }
}

@keyframes bridge-success-core {
  0% {
    transform: scale(0.45);
    opacity: 0;
  }
  60% {
    transform: scale(1.12);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bridge-success-label {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bridge-success-ring {
  0% {
    opacity: 0.62;
    transform: scale(0.25);
  }
  100% {
    opacity: 0;
    transform: scale(1.72);
  }
}

@keyframes bridge-success-spark {
  0% {
    opacity: 0;
    transform: rotate(var(--spark-angle)) translateY(-0.5rem) scaleY(0.4);
  }
  24% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(var(--spark-angle)) translateY(-11.25rem) scaleY(1);
  }
}

@media (max-width: 640px) {
  .bridge-connect-background__photo {
    opacity: 0.28;
    -webkit-mask-image: radial-gradient(circle at 50% 18%, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.78) 30%, rgba(0, 0, 0, 0.25) 62%, transparent 88%);
    mask-image: radial-gradient(circle at 50% 18%, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.78) 30%, rgba(0, 0, 0, 0.25) 62%, transparent 88%);
  }

  .bridge-token-btn__code {
    letter-spacing: 0.3em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bridge-surface,
  .bridge-success-banner,
  .bridge-success-banner::before,
  .bridge-success-blast,
  .bridge-success-core,
  .bridge-success-label,
  .bridge-success-ring,
  .bridge-success-spark {
    animation: none !important;
  }
}
</style>
