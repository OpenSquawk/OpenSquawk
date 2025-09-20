<template>
  <div class="relative min-h-screen overflow-hidden bg-[#060b1b] text-white">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-36 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[160px]"></div>
      <div class="absolute bottom-[-180px] right-[-160px] h-[420px] w-[420px] rounded-full bg-purple-500/20 blur-[150px]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,118,255,0.12),_transparent_55%)]"></div>
    </div>

    <div class="relative flex min-h-screen flex-col lg:flex-row">
      <aside class="relative hidden w-full overflow-hidden border-b border-white/10 lg:flex lg:w-[48%] lg:border-b-0 lg:border-r lg:border-white/10">
        <img src="/img/landing/runway.jpeg" alt="Runway illuminated at night" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#050915] via-[#050915]/85 to-transparent"></div>
        <div class="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
          <div>
            <NuxtLink to="/" class="inline-flex items-center gap-3 text-sm font-medium text-white/80 transition hover:text-white">
              <span class="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
                <v-icon icon="mdi-arrow-left" size="18" />
              </span>
              Back to landing page
            </NuxtLink>
          </div>

          <div class="space-y-6">
            <div class="space-y-4">
              <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-cyan-200">Alpha Access</span>
              <h1 class="text-4xl font-semibold leading-tight xl:text-5xl">Welcome back to the cockpit</h1>
              <p class="max-w-md text-base text-white/80">
                Sign in to continue your approach and keep learning from real-world ATC communications curated by the OpenSquawk crew.
              </p>
            </div>

            <div class="space-y-5">
              <div class="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
                <p class="text-sm font-semibold text-white">How to get access</p>
                <ol class="mt-4 space-y-4 text-sm text-white/75">
                  <li class="flex items-start gap-3">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-cyan-200">1</span>
                    <span>Join the <NuxtLink to="/#cta" class="text-cyan-300 underline decoration-dotted underline-offset-4 transition hover:text-cyan-200">waitlist</NuxtLink>.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-cyan-200">2</span>
                    <span>Receive your invite by email or get a code from an active member.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-cyan-200">3</span>
                    <span>Register here, accept the terms &amp; privacy policy and start flying.</span>
                  </li>
                </ol>
              </div>
              <div class="rounded-3xl border border-cyan-400/30 bg-cyan-500/10 p-6 text-sm text-cyan-100 shadow-[0_30px_120px_rgba(16,147,203,0.25)]">
                Tip: After 14 days of active use you can generate up to two invitation codes yourself and share them with friends.
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="relative flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div class="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-cyan-400/20 blur-[120px]"></div>
        <div class="pointer-events-none absolute bottom-10 left-10 hidden h-40 w-40 rounded-full bg-cyan-500/10 blur-[90px] lg:block"></div>
        <div class="relative z-10 w-full max-w-xl space-y-10">
          <div class="flex items-center justify-between lg:hidden">
            <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white">
              <v-icon icon="mdi-arrow-left" size="18" />
              Back to landing page
            </NuxtLink>
            <span class="text-xs uppercase tracking-[0.35em] text-cyan-200">Alpha Access</span>
          </div>

          <div class="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#070d1f]/80 p-8 shadow-[0_30px_120px_rgba(8,19,47,0.55)] backdrop-blur">
            <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div class="relative z-10 space-y-8">
              <div class="space-y-4">
                <h2 class="text-3xl font-semibold">Access your mission</h2>
                <p class="text-sm text-white/70">
                  Choose between logging in or activating your invite code to join the OpenSquawk training platform.
                </p>
              </div>

              <div class="flex items-center gap-2 rounded-full bg-white/5 p-1">
                <button
                  class="flex-1 rounded-full px-4 py-2 text-sm font-medium transition duration-200"
                  :class="mode === 'login' ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-[#040914] shadow-lg shadow-cyan-500/30' : 'text-white/70 hover:text-white'"
                  @click="mode = 'login'"
                >
                  Login
                </button>
                <button
                  class="flex-1 rounded-full px-4 py-2 text-sm font-medium transition duration-200"
                  :class="mode === 'register' ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-[#040914] shadow-lg shadow-cyan-500/30' : 'text-white/70 hover:text-white'"
                  @click="mode = 'register'"
                >
                  Register
                </button>
              </div>

              <form v-if="mode === 'login'" class="space-y-6" @submit.prevent="submitLogin">
                <div class="space-y-5">
                  <div>
                    <label class="form-label">Email</label>
                    <input
                      v-model.trim="loginForm.email"
                      type="email"
                      required
                      autocomplete="email"
                      placeholder="you@example.com"
                      class="input-field"
                    />
                  </div>
                  <div>
                    <label class="form-label">Password</label>
                    <input
                      v-model="loginForm.password"
                      type="password"
                      required
                      autocomplete="current-password"
                      placeholder="Enter your password"
                      class="input-field"
                    />
                  </div>
                  <div class="text-right">
                    <NuxtLink to="/forgot-password" class="text-xs text-cyan-300 underline decoration-dotted underline-offset-4 transition hover:text-cyan-200">
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

                <p v-if="loginError" class="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{{ loginError }}</p>
              </form>

              <form v-else class="space-y-6" @submit.prevent="submitRegister">
                <div class="space-y-5">
                  <div>
                    <label class="form-label">Name</label>
                    <input
                      v-model.trim="registerForm.name"
                      type="text"
                      autocomplete="name"
                      placeholder="First Last"
                      class="input-field"
                    />
                  </div>
                  <div>
                    <label class="form-label">Email</label>
                    <input
                      v-model.trim="registerForm.email"
                      type="email"
                      required
                      autocomplete="email"
                      placeholder="you@example.com"
                      class="input-field"
                    />
                  </div>
                  <div>
                    <label class="form-label">Password</label>
                    <input
                      v-model="registerForm.password"
                      type="password"
                      required
                      minlength="8"
                      autocomplete="new-password"
                      placeholder="Create a secure password"
                      class="input-field"
                    />
                    <p class="mt-2 text-xs text-white/50">At least 8 characters, ideally include a number and special character.</p>
                  </div>
                  <div>
                    <div class="flex items-center justify-between">
                      <label class="form-label">Invitation code</label>
                      <button
                        type="button"
                        class="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-cyan-200 transition hover:border-cyan-300 hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"
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
                      placeholder="e.g. ABCD1234"
                      class="input-field uppercase tracking-[0.3em]"
                    />
                    <p v-if="invitationStatus === 'valid'" class="mt-2 flex items-center gap-2 text-xs text-emerald-300">
                      <v-icon icon="mdi-check-circle" size="16" />
                      Code is valid.
                    </p>
                    <p v-else-if="invitationStatus === 'invalid'" class="mt-2 flex items-center gap-2 text-xs text-red-300">
                      <v-icon icon="mdi-alert-circle" size="16" />
                      This invitation code is invalid or already used.
                    </p>
                    <p v-else-if="invitationStatus === 'checking'" class="mt-2 flex items-center gap-2 text-xs text-white/60">
                      <v-progress-circular indeterminate size="14" width="2" color="cyan" />
                      Checking invitation code…
                    </p>
                  </div>
                </div>

                <div class="space-y-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs text-white/70">
                  <label class="flex items-start gap-3">
                    <input type="checkbox" v-model="registerForm.acceptTerms" class="mt-1" required />
                    <span>I accept the <NuxtLink to="/agb" class="text-cyan-300 underline decoration-dotted underline-offset-4 transition hover:text-cyan-200">Terms of Service</NuxtLink>.</span>
                  </label>
                  <label class="flex items-start gap-3">
                    <input type="checkbox" v-model="registerForm.acceptPrivacy" class="mt-1" required />
                    <span>I have read the <NuxtLink to="/datenschutz" class="text-cyan-300 underline decoration-dotted underline-offset-4 transition hover:text-cyan-200">privacy policy</NuxtLink> and consent to data processing.</span>
                  </label>
                </div>

                <button type="submit" class="btn btn-primary w-full" :disabled="registerLoading || !canRegister">
                  <span v-if="registerLoading" class="flex items-center justify-center gap-2">
                    <v-progress-circular indeterminate size="16" width="2" color="white" />
                    Registering…
                  </span>
                  <span v-else>Create account</span>
                </button>

                <p v-if="registerError" class="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{{ registerError }}</p>
              </form>
            </div>
          </div>

          <div class="space-y-4 text-sm text-white/75 lg:hidden">
            <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p class="text-sm font-semibold text-white">How to get access</p>
              <ol class="mt-4 space-y-4">
                <li class="flex items-start gap-3">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold text-cyan-200">1</span>
                  <span>Join the <NuxtLink to="/#cta" class="text-cyan-300 underline decoration-dotted underline-offset-4 transition hover:text-cyan-200">waitlist</NuxtLink>.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold text-cyan-200">2</span>
                  <span>Receive your invite by email or get a code from an active member.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold text-cyan-200">3</span>
                  <span>Register here, accept the terms &amp; privacy policy and start flying.</span>
                </li>
              </ol>
            </div>
            <div class="rounded-3xl border border-cyan-400/30 bg-cyan-500/10 p-5 text-sm text-cyan-100">
              Tip: After 14 days of active use you can generate up to two invitation codes yourself and share them with friends.
            </div>
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
.input-field {
  @apply mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none transition placeholder:text-white/40 focus:border-cyan-400 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/40;
}

.form-label {
  @apply text-[11px] uppercase tracking-[0.32em] text-white/45;
}
</style>

