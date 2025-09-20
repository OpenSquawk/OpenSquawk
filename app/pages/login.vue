<template>
  <div class="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-24 -left-40 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
      <div class="absolute bottom-[-30%] right-[-10%] h-[32rem] w-[32rem] rounded-full bg-blue-600/10 blur-[140px]" />
    </div>

    <div class="relative flex min-h-screen flex-col lg:flex-row">
      <aside class="relative hidden w-full max-w-xl flex-none overflow-hidden border-white/10 bg-slate-900/40 lg:block">
        <img src="/img/landing/runway.jpeg" alt="Lit runway with airplane ready for take-off" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-950/70 to-slate-950" />
        <div class="relative z-10 flex h-full flex-col justify-end space-y-5 p-12">
          <p class="text-xs uppercase tracking-[0.4em] text-cyan-200/80">OpenSquawk</p>
          <h2 class="text-3xl font-semibold leading-tight text-white">Set course for collaborative aviation intelligence.</h2>
          <p class="text-sm text-slate-200/80">
            Stay informed with real-time alerts, curated insights, and a community of aviation experts ready to share their knowledge.
          </p>
        </div>
      </aside>

      <main class="relative z-10 flex flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:px-16">
        <div class="w-full max-w-xl space-y-10">
          <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-cyan-300">
            <v-icon icon="mdi-arrow-left" size="18" />
            Back to landing page
          </NuxtLink>

          <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.4em] text-cyan-300/80">OpenSquawk Alpha Access</p>
            <h1 class="text-4xl font-semibold leading-tight">Welcome back, pilot</h1>
            <p class="text-base text-white/70">
              Sign in to continue your mission or unlock your invitation code to join the control room.
            </p>
          </div>

          <div class="space-y-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_60px_rgba(8,145,178,0.18)] backdrop-blur">
            <div class="flex items-center gap-2 rounded-full bg-white/5 p-1 text-sm font-medium">
              <button
                  class="flex-1 rounded-full px-4 py-2 transition"
                  :class="mode === 'login' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/25' : 'text-white/60 hover:text-white'"
                  @click="mode = 'login'"
              >
                Sign in
              </button>
              <button
                  class="flex-1 rounded-full px-4 py-2 transition"
                  :class="mode === 'register' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/25' : 'text-white/60 hover:text-white'"
                  @click="mode = 'register'"
              >
                Create account
              </button>
            </div>

            <form v-if="mode === 'login'" class="space-y-6" @submit.prevent="submitLogin">
              <div class="space-y-5">
                <label class="block">
                  <span class="text-sm font-medium text-white/80">Email address</span>
                  <input
                      v-model.trim="loginForm.email"
                      type="email"
                      required
                      autocomplete="email"
                      placeholder="you@example.com"
                      class="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-base text-white placeholder-white/40 outline-none transition focus:border-transparent focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-2 focus:ring-offset-slate-950"
                  />
                </label>
                <label class="block">
                  <span class="text-sm font-medium text-white/80">Password</span>
                  <input
                      v-model="loginForm.password"
                      type="password"
                      required
                      autocomplete="current-password"
                      placeholder="••••••••"
                      class="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-base text-white placeholder-white/40 outline-none transition focus:border-transparent focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-2 focus:ring-offset-slate-950"
                  />
                </label>
              </div>

              <div class="flex items-center justify-end text-sm">
                <NuxtLink to="/forgot-password" class="text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline">
                  Forgot your password?
                </NuxtLink>
              </div>

              <button
                  type="submit"
                  class="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:shadow-[0_0_35px_rgba(56,189,248,0.45)] focus:outline-none focus:ring-2 focus:ring-cyan-300/70 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="loginLoading"
              >
                <span v-if="loginLoading" class="flex items-center justify-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="white" />
                  Signing you in…
                </span>
                <span v-else>Sign in</span>
              </button>

              <p v-if="loginError" class="text-sm text-red-300">{{ loginError }}</p>
            </form>

            <form v-else class="space-y-6" @submit.prevent="submitRegister">
              <div class="space-y-5">
                <label class="block">
                  <span class="text-sm font-medium text-white/80">Full name</span>
                  <input
                      v-model.trim="registerForm.name"
                      type="text"
                      autocomplete="name"
                      placeholder="First Last"
                      class="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-base text-white placeholder-white/40 outline-none transition focus:border-transparent focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-2 focus:ring-offset-slate-950"
                  />
                </label>
                <label class="block">
                  <span class="text-sm font-medium text-white/80">Email address</span>
                  <input
                      v-model.trim="registerForm.email"
                      type="email"
                      required
                      autocomplete="email"
                      placeholder="you@example.com"
                      class="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-base text-white placeholder-white/40 outline-none transition focus:border-transparent focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-2 focus:ring-offset-slate-950"
                  />
                </label>
                <label class="block">
                  <span class="text-sm font-medium text-white/80">Password</span>
                  <input
                      v-model="registerForm.password"
                      type="password"
                      required
                      minlength="8"
                      autocomplete="new-password"
                      placeholder="Create a secure password"
                      class="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-base text-white placeholder-white/40 outline-none transition focus:border-transparent focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-2 focus:ring-offset-slate-950"
                  />
                  <p class="mt-2 text-xs text-white/55">At least 8 characters, ideally include a number and special character.</p>
                </label>
                <div>
                  <div class="mb-2 flex items-center justify-between text-sm text-white/80">
                    <span class="font-medium">Invitation code</span>
                    <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-200 transition hover:border-cyan-300/70 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                        @click="checkInvitationCode"
                        :disabled="!registerForm.invitationCode"
                    >
                      <v-icon icon="mdi-radar" size="14" />
                      Check
                    </button>
                  </div>
                  <input
                      v-model.trim="registerForm.invitationCode"
                      type="text"
                      required
                      class="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-base tracking-[0.35em] text-white placeholder-white/40 outline-none transition focus:border-transparent focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-2 focus:ring-offset-slate-950"
                      placeholder="ABCD1234"
                  />
                  <p v-if="invitationStatus === 'valid'" class="mt-2 text-xs text-green-300">Code is valid.</p>
                  <p v-else-if="invitationStatus === 'invalid'" class="mt-2 text-xs text-red-300">This invitation code is invalid or already used.</p>
                  <p v-else-if="invitationStatus === 'checking'" class="mt-2 text-xs text-white/60">Checking invitation code…</p>
                  <p v-else class="mt-2 text-xs text-white/40">Codes are issued to waitlist members and active pilots after two weeks.</p>
                </div>
              </div>

              <div class="space-y-3 text-xs text-white/65">
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="registerForm.acceptTerms" class="mt-1 accent-cyan-400" required />
                  <span>I accept the <NuxtLink to="/agb" class="text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline">Terms of Service</NuxtLink>.</span>
                </label>
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="registerForm.acceptPrivacy" class="mt-1 accent-cyan-400" required />
                  <span>I have read the <NuxtLink to="/datenschutz" class="text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline">privacy policy</NuxtLink> and consent to data processing.</span>
                </label>
              </div>

              <button
                  type="submit"
                  class="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:shadow-[0_0_35px_rgba(56,189,248,0.45)] focus:outline-none focus:ring-2 focus:ring-cyan-300/70 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="registerLoading || !canRegister"
              >
                <span v-if="registerLoading" class="flex items-center justify-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="white" />
                  Registering…
                </span>
                <span v-else>Launch</span>
              </button>

              <p v-if="registerError" class="text-sm text-red-300">{{ registerError }}</p>
            </form>
          </div>

          <div class="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-white">How to get access</h2>
              <span class="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            <ol class="grid gap-4 sm:grid-cols-3">
              <li class="group rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white/70 transition hover:border-cyan-400/40 hover:text-white">
                <span class="chip mb-3">1</span>
                <span>Join the <NuxtLink to="/#cta" class="text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline">waitlist</NuxtLink>.</span>
              </li>
              <li class="group rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white/70 transition hover:border-cyan-400/40 hover:text-white">
                <span class="chip mb-3">2</span>
                <span>Receive your invite by email or get a code from an active member.</span>
              </li>
              <li class="group rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white/70 transition hover:border-cyan-400/40 hover:text-white">
                <span class="chip mb-3">3</span>
                <span>Register here, accept the terms &amp; privacy policy and start flying.</span>
              </li>
            </ol>
          </div>

          <div class="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-blue-500/20 p-6 text-sm text-cyan-100 shadow-[0_0_50px_rgba(34,211,238,0.25)]">
            Tip: After 14 days of active use you can generate up to two invitation codes yourself and share them with friends.
          </div>
        </div>
      </main>
    </div>
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
  @apply inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/40 via-cyan-500/20 to-blue-500/40 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-500/20;
}
</style>

