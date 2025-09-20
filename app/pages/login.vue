<template>
  <div class="relative flex min-h-screen flex-col bg-[#050916] text-white lg:flex-row">
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-br from-[#050916] via-[#08162d] to-[#02030a]"></div>
      <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_60%)] lg:block"></div>
    </div>

    <aside class="relative hidden flex-1 overflow-hidden lg:flex">
      <img
        src="/img/landing/runway.jpeg"
        alt="OpenSquawk runway with a jet preparing for takeoff"
        class="h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-[#050916]/90"></div>
      <div class="absolute inset-x-10 bottom-12 space-y-4">
        <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
          Live ATC intelligence
        </span>
        <p class="max-w-sm text-2xl font-semibold text-white">
          Designed for pilots and aviation enthusiasts who demand clarity in every transmission.
        </p>
        <p class="max-w-sm text-sm text-white/70">
          Stay ahead of the traffic pattern with curated insights, collaborative tools, and an invite-only community.
        </p>
      </div>
    </aside>

    <main class="relative z-10 flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:w-[520px] lg:px-12">
      <div class="w-full max-w-md space-y-10">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Back to landing page
        </NuxtLink>

        <div class="space-y-3">
          <p class="text-xs uppercase tracking-[0.35em] text-cyan-300/80">OpenSquawk Alpha Access</p>
          <h1 class="text-3xl font-semibold md:text-4xl">Sign in or claim your invite</h1>
          <p class="text-sm leading-relaxed text-white/70">
            Registration requires an invitation code shared by active members or sent after joining the waitlist.
            Already part of the crew? Log in to continue exploring live traffic intelligence.
          </p>
        </div>

        <div class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_-40px_rgba(8,24,53,0.9)] backdrop-blur">
          <div class="mb-6 flex gap-2 rounded-2xl bg-white/5 p-1">
            <button
              class="w-1/2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              :class="mode === 'login' ? 'bg-cyan-400 text-[#051223] shadow-lg shadow-cyan-500/40' : 'text-white/70 hover:bg-white/10 hover:text-white'"
              type="button"
              @click="mode = 'login'"
            >
              Login
            </button>
            <button
              class="w-1/2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              :class="mode === 'register' ? 'bg-cyan-400 text-[#051223] shadow-lg shadow-cyan-500/40' : 'text-white/70 hover:bg-white/10 hover:text-white'"
              type="button"
              @click="mode = 'register'"
            >
              Register
            </button>
          </div>

          <form v-if="mode === 'login'" class="space-y-5" @submit.prevent="submitLogin">
            <div class="space-y-4">
              <div class="space-y-2">
                <label class="text-xs font-medium uppercase tracking-[0.3em] text-white/50">Email</label>
                <input
                  v-model.trim="loginForm.email"
                  type="email"
                  required
                  autocomplete="email"
                  class="w-full rounded-2xl border border-white/10 bg-[#0b1528] px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-medium uppercase tracking-[0.3em] text-white/50">Password</label>
                <input
                  v-model="loginForm.password"
                  type="password"
                  required
                  autocomplete="current-password"
                  class="w-full rounded-2xl border border-white/10 bg-[#0b1528] px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>
              <div class="text-right">
                <NuxtLink to="/forgot-password" class="text-xs font-medium text-cyan-300 underline transition hover:text-cyan-200">
                  Forgot your password?
                </NuxtLink>
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-full" :disabled="loginLoading">
              <span v-if="loginLoading" class="flex items-center justify-center gap-2">
                <v-progress-circular indeterminate size="16" width="2" color="white" />
                Signing you in…
              </span>
              <span v-else>Login</span>
            </button>

            <p v-if="loginError" class="text-sm text-red-300">{{ loginError }}</p>
          </form>

          <form v-else class="space-y-5" @submit.prevent="submitRegister">
            <div class="space-y-4">
              <div class="space-y-2">
                <label class="text-xs font-medium uppercase tracking-[0.3em] text-white/50">Name</label>
                <input
                  v-model.trim="registerForm.name"
                  type="text"
                  autocomplete="name"
                  placeholder="First Last"
                  class="w-full rounded-2xl border border-white/10 bg-[#0b1528] px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-medium uppercase tracking-[0.3em] text-white/50">Email</label>
                <input
                  v-model.trim="registerForm.email"
                  type="email"
                  required
                  autocomplete="email"
                  class="w-full rounded-2xl border border-white/10 bg-[#0b1528] px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs font-medium uppercase tracking-[0.3em] text-white/50">
                  <label>Password</label>
                  <span class="normal-case text-[11px] font-normal tracking-normal text-white/60">Min. 8 characters</span>
                </div>
                <input
                  v-model="registerForm.password"
                  type="password"
                  required
                  minlength="8"
                  autocomplete="new-password"
                  class="w-full rounded-2xl border border-white/10 bg-[#0b1528] px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                />
                <p class="text-xs text-white/50">Ideally include a number and special character.</p>
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-medium uppercase tracking-[0.3em] text-white/50">Invitation code</label>
                  <button
                    type="button"
                    class="text-[11px] font-semibold text-cyan-300 underline transition hover:text-cyan-200 disabled:text-white/40 disabled:hover:text-white/40"
                    @click="checkInvitationCode"
                    :disabled="!registerForm.invitationCode"
                  >
                    Check code
                  </button>
                </div>
                <input
                  v-model.trim="registerForm.invitationCode"
                  type="text"
                  required
                  class="w-full rounded-2xl border border-white/10 bg-[#0b1528] px-4 py-3 text-sm uppercase tracking-[0.45em] outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                  placeholder="e.g. ABCD1234"
                />
                <p v-if="invitationStatus === 'valid'" class="text-xs text-green-300">Code is valid.</p>
                <p v-else-if="invitationStatus === 'invalid'" class="text-xs text-red-300">This invitation code is invalid or already used.</p>
                <p v-else-if="invitationStatus === 'checking'" class="text-xs text-white/60">Checking invitation code…</p>
              </div>
            </div>

            <div class="space-y-3 text-xs text-white/60">
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="registerForm.acceptTerms" class="mt-1 rounded border-white/30 bg-[#0b1528]" required />
                <span>I accept the <NuxtLink to="/agb" class="text-cyan-300 underline transition hover:text-cyan-200">Terms of Service</NuxtLink>.</span>
              </label>
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="registerForm.acceptPrivacy" class="mt-1 rounded border-white/30 bg-[#0b1528]" required />
                <span>I have read the <NuxtLink to="/datenschutz" class="text-cyan-300 underline transition hover:text-cyan-200">privacy policy</NuxtLink> and consent to data processing.</span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary w-full" :disabled="registerLoading || !canRegister">
              <span v-if="registerLoading" class="flex items-center justify-center gap-2">
                <v-progress-circular indeterminate size="16" width="2" color="white" />
                Registering…
              </span>
              <span v-else>Create account</span>
            </button>

            <p v-if="registerError" class="text-sm text-red-300">{{ registerError }}</p>
          </form>
        </div>

        <div class="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur">
          <h2 class="text-lg font-semibold">How to get access</h2>
          <ol class="space-y-3 text-sm text-white/70">
            <li class="flex gap-3"><span class="chip">1</span><span>Join the <NuxtLink to="/#cta" class="text-cyan-300 underline transition hover:text-cyan-200">waitlist</NuxtLink>.</span></li>
            <li class="flex gap-3"><span class="chip">2</span><span>Receive your invite by email or get a code from an active member.</span></li>
            <li class="flex gap-3"><span class="chip">3</span><span>Register here, accept the terms & privacy policy and start flying.</span></li>
          </ol>
        </div>

        <div class="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-6 text-sm text-cyan-100">
          Tip: After 14 days of active use you can generate up to two invitation codes yourself and share them with friends.
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'

type Mode = 'login' | 'register'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const api = useApi()

const mode = ref<Mode>('login')

const redirectTarget = computed(() => {
  const redirectParam = route.query.redirect
  const redirectValue = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam
  if (!redirectValue) return ''

  let decoded = redirectValue
  try {
    decoded = decodeURIComponent(redirectValue)
  } catch {
    decoded = redirectValue
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded === '/login') {
    return ''
  }

  return decoded
})

const loginForm = reactive({
  email: '',
  password: '',
})
const loginLoading = ref(false)
const loginError = ref('')

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  invitationCode: '',
  acceptTerms: false,
  acceptPrivacy: false,
})
const registerLoading = ref(false)
const registerError = ref('')
const invitationStatus = ref<'unknown' | 'checking' | 'valid' | 'invalid'>('unknown')

const canRegister = computed(() =>
  Boolean(
    registerForm.email &&
    registerForm.password &&
    registerForm.invitationCode &&
    registerForm.acceptTerms &&
    registerForm.acceptPrivacy &&
    invitationStatus.value !== 'invalid'
  )
)

async function submitLogin() {
  if (loginLoading.value) return
  loginLoading.value = true
  loginError.value = ''
  try {
    await auth.login({ ...loginForm })
    await auth.fetchUser()
    const target = redirectTarget.value || '/learn'
    await router.replace(target)
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Login failed'
    loginError.value = message
  } finally {
    loginLoading.value = false
  }
}

async function checkInvitationCode() {
  if (!registerForm.invitationCode) {
    invitationStatus.value = 'unknown'
    return
  }
  invitationStatus.value = 'checking'
  try {
    const res: any = await api.get(`/api/service/invitations/${registerForm.invitationCode.trim()}`, { auth: false })
    invitationStatus.value = res.valid ? 'valid' : 'invalid'
  } catch {
    invitationStatus.value = 'invalid'
  }
}

let codeCheckTimeout: ReturnType<typeof setTimeout> | null = null
watch(
  () => registerForm.invitationCode,
  (code) => {
    invitationStatus.value = code ? 'checking' : 'unknown'
    if (codeCheckTimeout) clearTimeout(codeCheckTimeout)
    if (!code) return
    codeCheckTimeout = setTimeout(() => {
      checkInvitationCode()
    }, 400)
  }
)

async function submitRegister() {
  if (registerLoading.value || !canRegister.value) return
  registerLoading.value = true
  registerError.value = ''
  try {
    await auth.register({
      name: registerForm.name,
      email: registerForm.email,
      password: registerForm.password,
      invitationCode: registerForm.invitationCode,
      acceptTerms: registerForm.acceptTerms,
      acceptPrivacy: registerForm.acceptPrivacy,
    })
    await auth.fetchUser()
    const target = redirectTarget.value || '/learn'
    await router.replace(target)
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Registration failed'
    registerError.value = message
  } finally {
    registerLoading.value = false
  }
}

useHead({
  title: 'OpenSquawk – Login & invite',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' },
  ],
})

onMounted(() => {
  if (auth.isAuthenticated) {
    const target = redirectTarget.value || '/learn'
    router.replace(target)
  }
})
</script>

<style scoped>
.chip {
  @apply inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-medium text-cyan-200;
}
</style>

