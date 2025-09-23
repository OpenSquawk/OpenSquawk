<template>
  <div class="relative min-h-screen bg-[#0B1020] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,187,215,0.12),transparent_55%)]"/>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(79,70,229,0.12),transparent_60%)]"/>

    <div class="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 lg:px-12">
      <div class="space-y-10">
        <header class="text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.45em] text-[#16BBD7]">OpenSquawk Bridge</p>
          <h1 class="mt-4 text-3xl font-semibold sm:text-4xl">Bridge mit deinem Account verknüpfen</h1>
          <p class="mx-auto mt-4 max-w-3xl text-sm text-white/70">
            Dieser Bildschirm verbindet den lokal erzeugten Bridge-Token mit deinem OpenSquawk Account. Nach erfolgreicher
            Verknüpfung kannst du in die Bridge App zurückkehren – die Anwendung erkennt dich dann automatisch.
          </p>
        </header>

        <div class="flex justify-center">
          <NuxtLink
            to="/bridge"
            class="inline-flex items-center gap-2 rounded-full bg-[#292D3B] px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-[#353a4c] hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Zur Bridge Übersicht
          </NuxtLink>
        </div>

        <div
          v-if="!hasToken"
          class="rounded-3xl border border-red-500/30 bg-red-500/10 px-8 py-12 text-center shadow-[0_25px_80px_rgba(64,18,18,0.35)]"
        >
          <h2 class="text-2xl font-semibold">Token fehlt</h2>
          <p class="mt-4 text-sm text-red-100/80">
            Bitte öffne diesen Bildschirm direkt über die Bridge App. Nur so kann der Token automatisch übergeben werden.
          </p>
          <p class="mt-6 text-xs uppercase tracking-[0.4em] text-red-200/60">Bridge-Link neu starten</p>
        </div>

        <div v-else class="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div class="space-y-6">
            <section
              class="rounded-3xl border border-white/10 bg-[#111832]/85 p-8 shadow-[0_30px_80px_rgba(5,10,30,0.55)] backdrop-blur"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="text-xl font-semibold">Schritt 1 · Anmelden</h2>
                <span class="rounded-full bg-[#292D3B] px-3 py-1 text-xs uppercase tracking-[0.32em] text-white/70">Login</span>
              </div>
              <p class="mt-3 text-sm text-white/70">
                Melde dich mit deinen OpenSquawk Zugangsdaten an. Ohne Anmeldung kann der Token nicht verknüpft werden.
              </p>

              <div
                v-if="isAuthenticated"
                class="mt-6 rounded-2xl border border-[#16BBD7]/40 bg-[#16BBD7]/10 px-5 py-4 text-sm"
              >
                <p class="font-medium text-[#16BBD7]">Bereits angemeldet</p>
                <p class="mt-1 text-white/70">
                  Du bist aktuell als
                  <span class="font-semibold text-white">{{ authDisplayName }}</span>
                  angemeldet.
                </p>
              </div>

              <form v-else class="mt-6 space-y-5" @submit.prevent="submitLogin">
                <div>
                  <label class="block text-sm font-medium text-white/70">E-Mail</label>
                  <input
                    v-model.trim="loginForm.email"
                    type="email"
                    required
                    autocomplete="email"
                    class="mt-2 w-full rounded-2xl border border-white/10 bg-[#0B132A]/90 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-[#16BBD7]/60 focus:ring-2 focus:ring-[#16BBD7]/60"
                  />
                </div>
                <div>
                  <div class="flex items-center justify-between">
                    <label class="block text-sm font-medium text-white/70">Passwort</label>
                    <NuxtLink
                      to="/forgot-password"
                      class="text-xs font-semibold uppercase tracking-[0.28em] text-[#16BBD7] transition hover:text-[#72d9ea]"
                    >
                      Passwort vergessen?
                    </NuxtLink>
                  </div>
                  <input
                    v-model="loginForm.password"
                    type="password"
                    required
                    autocomplete="current-password"
                    class="mt-2 w-full rounded-2xl border border-white/10 bg-[#0B132A]/90 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-[#16BBD7]/60 focus:ring-2 focus:ring-[#16BBD7]/60"
                  />
                </div>

                <button
                  type="submit"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16BBD7] px-5 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#13a7c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72d9ea] disabled:cursor-not-allowed disabled:bg-[#16BBD7]/60"
                  :disabled="loginLoading"
                >
                  <span v-if="loginLoading" class="flex items-center gap-2">
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-[#0B1020]/30 border-t-[#0B1020]"/>
                    Anmeldung läuft …
                  </span>
                  <span v-else>Anmelden</span>
                </button>

                <p v-if="loginError" class="text-sm text-red-300">{{ loginError }}</p>
              </form>
            </section>

            <section
              class="rounded-3xl border border-white/10 bg-[#111832]/85 p-8 shadow-[0_30px_80px_rgba(5,10,30,0.55)] backdrop-blur"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="text-xl font-semibold">Schritt 2 · Bridge verknüpfen</h2>
                <span class="rounded-full bg-[#16BBD7]/10 px-3 py-1 text-xs uppercase tracking-[0.32em] text-[#16BBD7]">
                  Token aktiv
                </span>
              </div>
              <p class="mt-3 text-sm text-white/70">
                Der unten stehende Token stammt direkt aus deiner Bridge App. Verknüpfe ihn mit einem Klick mit deinem Account.
              </p>

              <div class="mt-6 flex flex-wrap items-center gap-3">
                <code class="rounded-2xl bg-[#0B132A]/80 px-4 py-2 font-mono text-sm text-[#72d9ea] shadow-inner">
                  {{ token }}
                </code>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white"
                  @click="copyToken"
                >
                  <span aria-hidden="true">⧉</span>
                  <span>{{ copiedToken ? 'Token kopiert' : 'Token kopieren' }}</span>
                </button>
              </div>

              <div class="mt-8 space-y-4">
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16BBD7] px-5 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#13a7c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72d9ea] disabled:cursor-not-allowed disabled:bg-[#16BBD7]/60"
                  :disabled="!isAuthenticated || connectLoading"
                  @click="connectBridge"
                >
                  <span v-if="connectLoading" class="flex items-center gap-2">
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-[#0B1020]/30 border-t-[#0B1020]"/>
                    Token wird verbunden …
                  </span>
                  <span v-else>Bridge jetzt verbinden</span>
                </button>

                <p v-if="!isAuthenticated" class="text-sm text-white/60">
                  Bitte melde dich zuerst an, um die Verknüpfung durchführen zu können.
                </p>
                <p v-if="connectError" class="text-sm text-red-300">{{ connectError }}</p>

                <div
                  v-if="successBannerVisible"
                  class="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100 shadow-[0_0_35px_rgba(16,185,129,0.25)]"
                >
                  <p class="font-semibold">Verbindung hergestellt!</p>
                  <p class="mt-1 text-emerald-100/80">
                    Du kannst dieses Fenster jetzt schließen und zur Bridge App zurückkehren. Statusupdates werden automatisch
                    synchronisiert.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside>
            <section
              class="h-full rounded-3xl border border-white/10 bg-[#111832]/80 p-8 shadow-[0_30px_80px_rgba(4,8,24,0.55)] backdrop-blur"
              :class="{ 'opacity-80': statusLoading }"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h3 class="text-lg font-semibold">Live Status</h3>
                <span class="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/50">
                  Update alle 5s
                </span>
              </div>

              <div class="mt-6 space-y-4">
                <div class="rounded-2xl border border-white/10 bg-[#0B132A]/80 px-5 py-4 shadow-inner">
                  <p class="text-sm font-semibold text-white/70">Verbindung</p>
                  <p
                    class="mt-1 text-base font-medium"
                    :class="connectionStatus?.connected ? 'text-emerald-300' : 'text-white/50'"
                  >
                    {{ connectionLabel }}
                  </p>
                  <p v-if="connectionSubLabel" class="text-xs text-white/40">{{ connectionSubLabel }}</p>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div
                    class="flex items-center gap-3 rounded-2xl border px-4 py-3 transition"
                    :class="connectionStatus?.simConnected
                      ? 'border-emerald-400/60 bg-emerald-400/10 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                      : 'border-white/10 bg-[#0B132A]/70'"
                  >
                    <span
                      class="h-3 w-3 rounded-full"
                      :class="connectionStatus?.simConnected
                        ? 'bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.85)]'
                        : 'bg-white/30'"
                    />
                    <div>
                      <p class="text-sm font-semibold">Simulator</p>
                      <p class="text-xs text-white/60">
                        {{ connectionStatus?.simConnected ? 'Simulator erkannt' : 'Kein Simulator aktiv' }}
                      </p>
                    </div>
                  </div>
                  <div
                    class="flex items-center gap-3 rounded-2xl border px-4 py-3 transition"
                    :class="connectionStatus?.flightActive
                      ? 'border-emerald-400/60 bg-emerald-400/10 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                      : 'border-white/10 bg-[#0B132A]/70'"
                  >
                    <span
                      class="h-3 w-3 rounded-full"
                      :class="connectionStatus?.flightActive
                        ? 'bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.85)]'
                        : 'bg-white/30'"
                    />
                    <div>
                      <p class="text-sm font-semibold">Flugstatus</p>
                      <p class="text-xs text-white/60">
                        {{ connectionStatus?.flightActive ? 'Flug aktiv' : 'Kein Flug erkannt' }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="rounded-2xl border border-white/10 bg-[#0B132A]/80 px-5 py-4 text-sm text-white/65">
                  <div class="flex items-center justify-between">
                    <span>Verbunden seit</span>
                    <span class="font-medium text-white">{{ formattedConnectedAt }}</span>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-white/60">
                    <span>Letztes Status-Update</span>
                    <span class="font-medium text-white">{{ formattedLastStatusAt }}</span>
                  </div>
                </div>
              </div>

              <p v-if="statusLoading" class="mt-6 text-xs uppercase tracking-[0.4em] text-white/45">Status wird aktualisiert …</p>
              <p v-if="statusError" class="mt-2 text-sm text-red-300">{{ statusError }}</p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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

useHead({ title: 'Bridge verbinden · OpenSquawk' })

const route = useRoute()
const auth = useAuthStore()
const { user, accessToken, isAuthenticated, initialized } = storeToRefs(auth)

const loginForm = reactive({ email: '', password: '' })
const loginLoading = ref(false)
const loginError = ref('')

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

const authDisplayName = computed(() => {
  if (!user.value) return ''
  return user.value.name || user.value.email
})

const connectionLabel = computed(() => {
  if (!connectionStatus.value?.connected) {
    return 'Wartet auf Verbindung'
  }
  const name = connectionStatus.value.user?.name || connectionStatus.value.user?.email
  return name ? `Verbunden als ${name}` : 'Verbunden'
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
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(parsed)
}

async function submitLogin() {
  loginError.value = ''
  connectError.value = ''
  if (!loginForm.email || !loginForm.password) {
    loginError.value = 'Bitte E-Mail und Passwort eingeben.'
    return
  }

  loginLoading.value = true
  try {
    await auth.login({ email: loginForm.email, password: loginForm.password })
    connectSuccess.value = false
    await fetchStatus(true)
  } catch (err: any) {
    loginError.value =
      err?.data?.statusMessage ||
      err?.response?._data?.statusMessage ||
      err?.message ||
      'Login fehlgeschlagen.'
  } finally {
    loginLoading.value = false
  }
}

async function connectBridge() {
  if (!hasToken.value || !isAuthenticated.value || !accessToken.value) {
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
      'Verknüpfung fehlgeschlagen.'
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
      'Status konnte nicht geladen werden.'
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
    // Ignorieren – Kopie ist optional
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

