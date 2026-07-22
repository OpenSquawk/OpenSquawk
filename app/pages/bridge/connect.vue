<template>
  <div class="bridge-connect-page">
    <div class="bridge-connect-background" aria-hidden="true">
      <div class="bridge-connect-background__aurora"/>
      <div class="bridge-connect-background__photo"/>
      <div class="bridge-connect-background__noise"/>
    </div>

    <main class="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-5 py-10">
      <div class="w-full">


        <div class="bridge-card mt-5 p-6 sm:p-8" :class="{ 'bridge-card--success': alreadyLinked }">
          <!-- STATE: linked / done -->
          <div v-if="alreadyLinked" class="flex flex-col items-center text-center">
            <div class="bridge-check">
              <span class="bridge-check__ring"/>
              <span class="bridge-check__ring bridge-check__ring--delayed"/>
              <span class="bridge-check__mark">✓</span>
            </div>
            <span class="bridge-success-pill mt-5">Connected</span>
            <h1 class="mt-3 text-2xl font-semibold text-emerald-50">Bridge connected</h1>
            <p class="mt-2 text-sm text-emerald-100/70">
              Linked to <span class="font-semibold text-white">{{ authDisplayName }}</span>.
            </p>

            <button
              type="button"
              class="mt-5 text-xs text-white/45 transition hover:text-white/75 disabled:opacity-50"
              :disabled="disconnectLoading"
              @click="disconnectBridge"
            >
              {{ disconnectLoading ? 'Unlinking …' : 'Click here to unlink and use another code' }}
            </button>
            <p v-if="disconnectError" class="mt-3 text-sm text-red-300">{{ disconnectError }}</p>
          </div>

          <!-- STATE: no token → ask for it -->
          <div v-else-if="!hasToken" class="text-center">
            <h1 class="text-2xl font-semibold">Enter your pairing code</h1>
            <p class="mt-2 text-sm text-white/[0.66]">
              Type the 6-character code shown in your desktop Bridge app.
            </p>

            <form class="mt-6 space-y-4" @submit.prevent="applyPairingCode">
              <input
                v-model="manualTokenInput"
                type="text"
                inputmode="text"
                autocapitalize="characters"
                autocomplete="one-time-code"
                spellcheck="false"
                maxlength="6"
                placeholder="A1B2C3"
                class="w-full rounded-2xl border border-[#16BBD7]/[0.5] bg-[#050c1f] px-4 py-4 text-center font-mono text-3xl font-semibold uppercase tracking-[0.4em] text-[#9be6f2] placeholder:text-[#9be6f2]/[0.3] focus:border-[#72d9ea] focus:outline-none"
                @input="onManualTokenInput"
              >
              <button type="submit" class="bridge-btn-primary w-full" :disabled="!manualTokenReady">
                Continue
              </button>
              <p v-if="manualTokenError" class="text-sm text-amber-200">{{ manualTokenError }}</p>
            </form>
          </div>

          <!-- STATE: token present, not signed in → login -->
          <div v-else-if="!hasAuthenticatedUser" class="text-center">

            <h1 class="text-2xl font-semibold">Sign in to link</h1>

            <p class="mt-2 text-sm text-white/[0.66]">
              Please sign in to your OpenSquawk account to link the Bridge.
            </p>


            <NuxtLink :to="loginTarget" class="bridge-btn-primary mt-6 w-full gap-2">
              Go to login
              <span aria-hidden="true">→</span>
            </NuxtLink>
            <button
              type="button"
              class="mt-4 text-sm text-white/55 transition hover:text-white/85"
              @click="clearPairingCode"
            >
              Use another code
            </button>
            <p v-if="tokenLinkedToOtherUser" class="mt-4 text-sm text-amber-100/90">
              This code is already linked to another account.
            </p>
          </div>

          <!-- STATE: token + signed in, linking in progress -->
          <div v-else class="flex flex-col items-center text-center">
            <template v-if="tokenLinkedToOtherUser">
              <h1 class="text-2xl font-semibold">Code in use</h1>
              <p class="mt-2 text-sm text-white/[0.66]">
                This pairing code is linked to a different account.
              </p>
              <button type="button" class="bridge-btn-primary mt-6" @click="clearPairingCode">
                Use another code
              </button>
            </template>
            <template v-else-if="connectError">
              <h1 class="text-2xl font-semibold">Couldn't link</h1>
              <p class="mt-2 text-sm text-red-300">{{ connectError }}</p>
              <button type="button" class="bridge-btn-primary mt-6" :disabled="connectLoading" @click="connectBridge">
                {{ connectLoading ? 'Linking …' : 'Try again' }}
              </button>
            </template>
            <template v-else>
              <span class="bridge-spinner"/>
              <h1 class="mt-5 text-xl font-semibold">Linking Bridge …</h1>
              <p class="mt-2 text-sm text-white/[0.6]">Connecting code <span class="font-mono text-[#9be6f2]">{{ token }}</span> to {{ authDisplayName }}.</p>
            </template>
          </div>
        </div>

        <p v-if="statusError && !alreadyLinked" class="mt-3 text-center text-sm text-red-300">{{ statusError }}</p>

        <!-- Collapsible server log (only once linked) -->
        <section v-if="alreadyLinked" class="mt-5">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-t-2xl border border-white/[0.12] bg-[#0a1229]/90 px-4 py-2.5 text-left transition hover:bg-[#0d1633]"
            :class="{ 'rounded-b-2xl': !logPanelOpen }"
            @click="logPanelOpen = !logPanelOpen"
          >
            <span class="flex items-center gap-2.5">
              <span class="font-mono text-xs text-white/45">{{ logPanelOpen ? '▼' : '▶' }}</span>
              <span class="text-sm font-medium text-white/75">Server Log</span>
              <span v-if="logEntries.length" class="rounded-full bg-white/10 px-2 py-0.5 text-[10px] tabular-nums text-white/50">
                {{ logEntries.length }}
              </span>
            </span>
            <span v-if="logPolling" class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"/>
          </button>

          <div v-if="logPanelOpen" class="rounded-b-2xl border border-t-0 border-white/[0.12] bg-[#060c1e]/95">
            <div v-if="latestTelemetry" class="border-b border-white/[0.08] px-4 py-3">
              <p class="mb-2 text-[10px] uppercase tracking-[0.24em] text-white/40">Latest Telemetry</p>
              <div class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
                <span class="text-white/70">IAS <span class="text-[#d946ef]">{{ latestTelemetry.AIRSPEED_INDICATED?.toFixed(0) ?? '—' }}</span>kt</span>
                <span class="text-white/70">ALT <span class="text-[#d946ef]">{{ latestTelemetry.PLANE_ALTITUDE?.toFixed(0) ?? '—' }}</span>ft</span>
                <span class="text-white/70">VS <span class="text-[#d946ef]">{{ latestTelemetry.VERTICAL_SPEED?.toFixed(0) ?? '—' }}</span>fpm</span>
                <span class="text-white/70">GS <span class="text-[#d946ef]">{{ latestTelemetry.GROUND_VELOCITY?.toFixed(0) ?? '—' }}</span>kt</span>
                <span class="text-white/70">N1 <span class="text-[#d946ef]">{{ latestTelemetry.TURB_ENG_N1_1?.toFixed(1) ?? '—' }}</span>%</span>
                <span class="text-white/70">XPDR <span class="text-[#d946ef]">{{ formatSquawk(latestTelemetry.TRANSPONDER_CODE) }}</span></span>
                <span class="text-white/70">GND <span :class="latestTelemetry.SIM_ON_GROUND ? 'text-emerald-400' : 'text-amber-400'">{{ latestTelemetry.SIM_ON_GROUND ? 'YES' : 'NO' }}</span></span>
                <span class="text-white/70">GEAR <span :class="latestTelemetry.GEAR_HANDLE_POSITION ? 'text-emerald-400' : 'text-amber-400'">{{ latestTelemetry.GEAR_HANDLE_POSITION ? 'DN' : 'UP' }}</span></span>
                <span class="text-white/70">BRK <span :class="latestTelemetry.BRAKE_PARKING_POSITION ? 'text-rose-400' : 'text-emerald-400'">{{ latestTelemetry.BRAKE_PARKING_POSITION ? 'SET' : 'OFF' }}</span></span>
              </div>
            </div>

            <div ref="logScrollContainer" class="max-h-[360px] overflow-y-auto">
              <div v-if="!logEntries.length" class="px-5 py-8 text-center text-xs text-white/30">
                No log entries yet. Waiting for bridge activity …
              </div>

              <div
                v-for="entry in logEntries"
                :key="entry.id"
                class="bridge-log-entry border-b border-white/[0.05] last:border-b-0"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/[0.03]"
                  :class="{ 'bg-white/[0.02]': expandedLogIds.has(entry.id) }"
                  @click="toggleLogEntry(entry.id)"
                >
                  <span class="h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: entry.color }"/>
                  <span class="shrink-0 font-mono text-[10px] tabular-nums text-white/35">{{ formatLogTime(entry.timestamp) }}</span>
                  <span class="font-mono text-xs font-medium" :style="{ color: entry.color }">{{ entry.method }}</span>
                  <span class="truncate font-mono text-xs text-white/50">{{ entry.endpoint }}</span>
                  <span class="ml-auto shrink-0 text-xs text-white/40">{{ entry.summary }}</span>
                  <span v-if="entry.data" class="shrink-0 font-mono text-[10px] text-white/25">{{ expandedLogIds.has(entry.id) ? '▼' : '▶' }}</span>
                </button>

                <div v-if="entry.data && expandedLogIds.has(entry.id)" class="border-t border-white/[0.04] bg-[#040812] px-4 py-3">
                  <pre class="max-h-[240px] overflow-auto font-mono text-[11px] leading-relaxed text-white/55">{{ JSON.stringify(entry.data, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const statusRequestActive = ref(false)

const manualTokenInput = ref('')
const manualTokenError = ref('')
const autoConnectAttemptKey = ref('')
const autoCloseFailed = ref(false)

// Log panel state
interface LogEntry {
  id: number
  timestamp: number
  endpoint: string
  method: string
  statusCode: number
  color: string
  summary: string
  data?: Record<string, unknown>
}

const logPanelOpen = ref(false)
const logEntries = ref<LogEntry[]>([])
const logPolling = ref(false)
const expandedLogIds = ref(new Set<number>())
const logScrollContainer = ref<HTMLElement | null>(null)
interface TelemetrySummary {
  AIRSPEED_INDICATED: number
  AIRSPEED_TRUE: number
  GROUND_VELOCITY: number
  VERTICAL_SPEED: number
  PLANE_ALTITUDE: number
  PLANE_PITCH_DEGREES: number
  TURB_ENG_N1_1: number
  TURB_ENG_N1_2: number
  ENG_COMBUSTION: boolean
  SIM_ON_GROUND: boolean
  GEAR_HANDLE_POSITION: boolean
  FLAPS_HANDLE_INDEX: number
  BRAKE_PARKING_POSITION: boolean
  AUTOPILOT_MASTER: boolean
  TRANSPONDER_CODE: number
  ADF_ACTIVE_FREQUENCY: number
  ADF_STANDBY_FREQUENCY: number
}

const latestTelemetry = ref<TelemetrySummary | null>(null)

const pttActive = ref(false)
const pttError = ref('')

async function sendPtt(state: 'down' | 'up') {
  if (!token.value) return
  try {
    await $fetch('/api/bridge/ptt', {
      method: 'POST',
      headers: { 'x-bridge-token': token.value },
      body: { state },
    })
    pttError.value = ''
  } catch (err: any) {
    pttError.value = err?.data?.statusMessage || 'PTT failed'
  }
}

function startPtt() {
  if (pttActive.value) return
  pttActive.value = true
  void sendPtt('down')
}

function stopPtt() {
  if (!pttActive.value) return
  pttActive.value = false
  void sendPtt('up')
}

function onKeyDown(e: KeyboardEvent) {
  if (!alreadyLinked.value || pttActive.value) return
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName ?? '')) return
  if (e.code === 'Space') {
    e.preventDefault()
    startPtt()
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (!alreadyLinked.value) return
  if (e.code === 'Space') {
    e.preventDefault()
    stopPtt()
  }
}

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
const manualTokenReady = computed(() => manualTokenInput.value.length === 6)
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
const tokenLinkedToOtherUser = computed(() => {
  if (!connectionStatus.value?.connected || !hasAuthenticatedUser.value) {
    return false
  }
  return connectionStatus.value.user?.id !== user.value?.id
})

const alreadyLinked = computed(() => isLinkedToAuthenticatedUser.value)

function sanitizePairingCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
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
  }
}

function closeWindow() {
  try {
    window.close()
  } catch {
    autoCloseFailed.value = true
  }
  // window.close() is a no-op for tabs the script didn't open — detect that.
  setTimeout(() => {
    if (!window.closed) {
      autoCloseFailed.value = true
    }
  }, 600)
}

function formatLogTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

function formatSquawk(code: unknown) {
  if (typeof code !== 'number') return '----'
  return String(code).padStart(4, '0')
}

function toggleLogEntry(id: number) {
  const set = new Set(expandedLogIds.value)
  if (set.has(id)) {
    set.delete(id)
  } else {
    set.add(id)
  }
  expandedLogIds.value = set
}

let logPoller: ReturnType<typeof setInterval> | null = null
let lastLogId = 0

async function fetchLog() {
  if (!hasToken.value) return
  try {
    const entries = await $fetch<LogEntry[]>('/api/bridge/log', {
      headers: { 'x-bridge-token': token.value },
      params: { since: lastLogId },
    })
    if (entries.length) {
      logEntries.value.push(...entries)
      const lastEntry = entries[entries.length - 1]!
      lastLogId = lastEntry.id

      // Extract latest telemetry from data endpoint entries
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i]!
        if (entry.endpoint === '/api/bridge/data' && entry.data) {
          latestTelemetry.value = entry.data as unknown as TelemetrySummary
          break
        }
      }

      // Auto-scroll to bottom
      nextTick(() => {
        if (logScrollContainer.value) {
          logScrollContainer.value.scrollTop = logScrollContainer.value.scrollHeight
        }
      })
    }
  } catch {
    // Ignore log fetch errors
  }
}

function startLogPolling() {
  stopLogPolling()
  if (!hasToken.value) return
  logPolling.value = true
  fetchLog()
  logPoller = setInterval(fetchLog, 2000)
}

function stopLogPolling() {
  logPolling.value = false
  if (logPoller) {
    clearInterval(logPoller)
    logPoller = null
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

let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

watch(token, () => {
  connectError.value = ''
  disconnectError.value = ''
  connectSuccess.value = false
  autoConnectAttemptKey.value = ''
  connectionStatus.value = null
  statusInitialized.value = false
  statusError.value = ''
  autoCloseFailed.value = false

  // Reset log state
  logEntries.value = []
  lastLogId = 0
  expandedLogIds.value = new Set()
  latestTelemetry.value = null
  if (logPanelOpen.value) {
    startLogPolling()
  }

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

// Once linked, try to close the tab automatically and stop polling.
watch(alreadyLinked, (linked) => {
  if (!linked) return
  stopPolling()
  if (autoCloseTimer) clearTimeout(autoCloseTimer)
  autoCloseTimer = setTimeout(() => {
    closeWindow()
  }, 2000)
})

watch(logPanelOpen, (open) => {
  if (open) {
    startLogPolling()
  } else {
    stopLogPolling()
  }
})

onMounted(() => {
  if (!initialized.value) {
    auth.fetchUser().catch(() => {})
  }
  startPolling()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onBeforeUnmount(() => {
  stopPolling()
  stopLogPolling()
  if (pttActive.value) void sendPtt('up')
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
})
</script>

<style scoped>
.bridge-ptt-pad {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  user-select: none;
  touch-action: none;
}
.bridge-ptt-pad:hover {
  border-color: rgba(22, 187, 215, 0.4);
  background: rgba(22, 187, 215, 0.06);
  color: #84e8f6;
}
.bridge-ptt-pad--active {
  border-color: rgba(248, 113, 113, 0.5);
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}
.bridge-kbd {
  display: inline-block;
  padding: 0.05rem 0.35rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.7rem;
  background: rgba(255, 255, 255, 0.06);
}

.bridge-connect-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(120% 70% at 18% -10%, rgba(22, 187, 215, 0.16), transparent 60%),
    radial-gradient(110% 65% at 84% -12%, rgba(70, 98, 255, 0.18), transparent 64%),
    linear-gradient(180deg, #070d1d 0%, #070b1a 50%, #050816 100%);
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
  opacity: 0.62;
  filter: saturate(1.1) contrast(1.04) brightness(0.9);
  transform: scale(1.06);
  -webkit-mask-image: radial-gradient(circle at 50% 32%, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.96) 40%, rgba(0, 0, 0, 0.6) 70%, transparent 92%);
  mask-image: radial-gradient(circle at 50% 32%, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.96) 40%, rgba(0, 0, 0, 0.6) 70%, transparent 92%);
}

.bridge-connect-background__noise {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(6, 11, 24, 0.04), rgba(6, 11, 24, 0.5));
}

@media (max-width: 640px) {
  .bridge-connect-background__photo {
    opacity: 0.48;
    -webkit-mask-image: radial-gradient(circle at 50% 18%, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.78) 30%, rgba(0, 0, 0, 0.25) 62%, transparent 88%);
    mask-image: radial-gradient(circle at 50% 18%, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.78) 30%, rgba(0, 0, 0, 0.25) 62%, transparent 88%);
  }
}

.bridge-card {
  border-radius: 1.6rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(150deg, rgba(13, 23, 46, 0.82), rgba(7, 14, 32, 0.85));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 22px 60px rgba(2, 7, 22, 0.5);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.bridge-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: #16BBD7;
  padding: 0.8rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #081226;
  transition: background 160ms ease;
}

.bridge-btn-primary:hover {
  background: #13aac5;
}

.bridge-btn-primary:disabled {
  cursor: not-allowed;
  background: rgba(22, 187, 215, 0.45);
}

.bridge-card--success {
  border-color: rgba(52, 211, 153, 0.45);
  background: linear-gradient(150deg, rgba(6, 78, 59, 0.5), rgba(7, 14, 32, 0.88));
  box-shadow:
    inset 0 1px 0 rgba(167, 243, 208, 0.18),
    0 0 0 1px rgba(52, 211, 153, 0.12),
    0 22px 70px rgba(5, 60, 40, 0.45);
  animation: bridge-success-card 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

.bridge-check {
  position: relative;
  display: grid;
  place-items: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 999px;
  border: 2px solid rgba(74, 222, 128, 0.7);
  background: radial-gradient(circle at 30% 30%, rgba(167, 243, 208, 0.9), rgba(16, 185, 129, 0.7) 62%, rgba(5, 150, 105, 0.82));
  box-shadow: 0 0 44px rgba(16, 185, 129, 0.6);
  animation: bridge-pop 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.bridge-check__mark {
  position: relative;
  z-index: 2;
  font-size: 2rem;
  font-weight: 700;
  color: rgba(4, 32, 18, 0.85);
}

.bridge-check__ring {
  position: absolute;
  inset: -2px;
  border-radius: 999px;
  border: 2px solid rgba(74, 222, 128, 0.55);
  opacity: 0;
  animation: bridge-ring 1900ms ease-out infinite;
}

.bridge-check__ring--delayed {
  animation-delay: 950ms;
}

.bridge-success-pill {
  border-radius: 999px;
  border: 1px solid rgba(110, 231, 183, 0.4);
  background: rgba(16, 185, 129, 0.18);
  padding: 0.25rem 0.85rem;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(167, 243, 208, 0.95);
}

@keyframes bridge-ring {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.9); }
}

@keyframes bridge-success-card {
  from { transform: translateY(8px) scale(0.99); }
  to { transform: translateY(0) scale(1); }
}

.bridge-spinner {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  border: 3px solid rgba(22, 187, 215, 0.25);
  border-top-color: #16BBD7;
  animation: bridge-spin 700ms linear infinite;
}

@keyframes bridge-spin {
  to { transform: rotate(360deg); }
}

@keyframes bridge-pop {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.bridge-log-entry pre {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
}

.bridge-log-entry pre::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.bridge-log-entry pre::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

@media (prefers-reduced-motion: reduce) {
  .bridge-card--success,
  .bridge-check,
  .bridge-check__ring,
  .bridge-spinner {
    animation: none !important;
  }
}
</style>
