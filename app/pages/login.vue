<template>
  <div class="login-page relative flex min-h-screen flex-col bg-gradient-to-br from-[#050713] via-[#080d1f] to-[#010208] text-white lg:h-screen lg:max-h-screen lg:overflow-hidden">
    <div class="absolute inset-0 -z-10 overflow-hidden opacity-70">
      <div class="orb orb-left animate-orb-slow" />
      <div class="orb orb-right animate-orb" />
      <div class="moving-grid" />
    </div>

    <div class="relative z-0 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:items-stretch lg:gap-12 lg:py-12">
      <div class="relative hidden overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl lg:flex lg:w-[48%]">
        <img src="/img/landing/runway.jpeg" alt="Guiding lights on a runway" class="absolute inset-0 h-full w-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#050816]/95 via-[#050816]/40 to-transparent" />
        <div class="relative z-10 flex h-full flex-col justify-between p-10">
          <div class="space-y-6">
            <span class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-white/70">
              Alpha Access
            </span>
            <h1 class="text-3xl font-semibold sm:text-4xl">Welcome back to the cockpit</h1>
            <p class="max-w-md text-white/70">
              OpenSquawk delivers lightning-fast market audio with curated alerts and transcripts. Sign in to rejoin the flow, or use your invitation code to start listening live.
            </p>
          </div>
          <div class="space-y-4 text-sm text-white/70">
            <div class="flex items-start gap-4">
              <span class="feature-marker">✦</span>
              <p class="leading-relaxed">Real-time squawks streamed directly to your dashboard.</p>
            </div>
            <div class="flex items-start gap-4">
              <span class="feature-marker">✦</span>
              <p class="leading-relaxed">Invite-only community curated by active market participants.</p>
            </div>
            <div class="flex items-start gap-4">
              <span class="feature-marker">✦</span>
              <p class="leading-relaxed">Grow into a contributor and unlock new sharing capabilities.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex w-full flex-1 flex-col lg:h-full lg:overflow-hidden">
        <div class="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl sm:mb-8 lg:hidden">
          <img src="/img/landing/runway.jpeg" alt="Guiding lights on a runway" class="h-56 w-full object-cover" />
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent p-6">
            <p class="text-[11px] uppercase tracking-[0.3em] text-white/50">Alpha Access</p>
            <p class="mt-2 text-lg font-semibold">Experience the cockpit from anywhere</p>
          </div>
        </div>

        <div class="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020]/80 shadow-2xl backdrop-blur lg:h-full">
          <div class="pointer-events-none absolute inset-0">
            <div class="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
            <div class="absolute -bottom-36 right-6 h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl" />
          </div>

          <div class="relative flex-1 overflow-y-auto px-6 py-8 sm:px-8 sm:py-10">
            <div class="mb-8 flex flex-col gap-4 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
              <NuxtLink to="/" class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 font-medium text-white/70 transition hover:bg-white/10 hover:text-white sm:w-auto">
                <v-icon icon="mdi-arrow-left" size="18" /> Back to landing page
              </NuxtLink>
              <span class="hidden text-xs uppercase tracking-[0.3em] text-white/30 sm:block">Restricted Area</span>
            </div>

            <div class="space-y-3">
              <p class="text-[11px] uppercase tracking-[0.4em] text-cyan-300/80">OpenSquawk Members</p>
              <h2 class="text-3xl font-semibold sm:text-4xl">Access your account</h2>
              <p class="max-w-xl text-white/60">
                Use your credentials to sign in or redeem an invitation code. After onboarding, you can invite colleagues once you have been active for two weeks.
              </p>
            </div>

            <div class="mt-8 rounded-full bg-white/5 p-1 text-sm font-medium text-white/60 shadow-inner">
              <div class="flex gap-1">
                <button
                    type="button"
                    class="flex-1 rounded-full px-4 py-2 transition"
                    :class="mode === 'login' ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30' : 'hover:text-white/80'"
                    @click="mode = 'login'"
                >
                  Login
                </button>
                <button
                    type="button"
                    class="flex-1 rounded-full px-4 py-2 transition"
                    :class="mode === 'register' ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30' : 'hover:text-white/80'"
                    @click="mode = 'register'"
                >
                  Register
                </button>
              </div>
            </div>

            <form v-if="mode === 'login'" class="mt-8 space-y-6" @submit.prevent="submitLogin">
              <div class="space-y-5">
                <div>
                  <label class="field-label">Email</label>
                  <input
                      v-model.trim="loginForm.email"
                      type="email"
                      required
                      autocomplete="email"
                      class="field-input"
                  />
                </div>
                <div>
                  <label class="field-label">Password</label>
                  <input
                      v-model="loginForm.password"
                      type="password"
                      required
                      autocomplete="current-password"
                      class="field-input"
                  />
                </div>
                <div class="text-right text-sm">
                  <NuxtLink to="/forgot-password" class="text-cyan-300 underline decoration-dotted underline-offset-4 transition hover:text-cyan-100">
                    Forgot your password?
                  </NuxtLink>
                </div>
              </div>

              <button type="submit" class="fancy-submit" :disabled="loginLoading">
                <span v-if="loginLoading" class="flex items-center justify-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="#051217" />
                  Signing you in…
                </span>
                <span v-else>Login</span>
              </button>

              <p v-if="loginError" class="text-sm text-red-300">{{ loginError }}</p>
            </form>

            <form v-else class="mt-8 space-y-6" @submit.prevent="submitRegister">
              <div class="space-y-5">
                <div>
                  <label class="field-label">Name</label>
                  <input
                      v-model.trim="registerForm.name"
                      type="text"
                      autocomplete="name"
                      placeholder="First Last"
                      class="field-input"
                  />
                </div>
                <div>
                  <label class="field-label">Email</label>
                  <input
                      v-model.trim="registerForm.email"
                      type="email"
                      required
                      autocomplete="email"
                      class="field-input"
                  />
                </div>
                <div>
                  <label class="field-label">Password</label>
                  <input
                      v-model="registerForm.password"
                      type="password"
                      required
                      minlength="8"
                      autocomplete="new-password"
                      class="field-input"
                  />
                  <p class="mt-2 text-xs text-white/50">At least 8 characters, ideally include a number and special character.</p>
                </div>
                <div>
                  <div class="flex items-center justify-between">
                    <label class="field-label">Invitation code</label>
                    <button
                        type="button"
                        class="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300/80 transition hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-white/30"
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
                      class="field-input tracking-[0.6em] uppercase"
                      placeholder="e.g. ABCD1234"
                  />
                  <p v-if="invitationStatus === 'valid'" class="mt-2 text-xs font-medium text-green-300">Code is valid.</p>
                  <p v-else-if="invitationStatus === 'invalid'" class="mt-2 text-xs font-medium text-red-300">This invitation code is invalid or already used.</p>
                  <p v-else-if="invitationStatus === 'checking'" class="mt-2 text-xs font-medium text-white/60">Checking invitation code…</p>
                </div>
              </div>

              <div class="space-y-3 text-xs text-white/60">
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="registerForm.acceptTerms" class="mt-1" required />
                  <span>I accept the <NuxtLink to="/agb" class="text-cyan-300 underline decoration-dotted underline-offset-4">Terms of Service</NuxtLink>.</span>
                </label>
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="registerForm.acceptPrivacy" class="mt-1" required />
                  <span>I have read the <NuxtLink to="/datenschutz" class="text-cyan-300 underline decoration-dotted underline-offset-4">privacy policy</NuxtLink> and consent to data processing.</span>
                </label>
              </div>

              <button type="submit" class="fancy-submit" :disabled="registerLoading || !canRegister">
                <span v-if="registerLoading" class="flex items-center justify-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="#051217" />
                  Registering…
                </span>
                <span v-else>Create account</span>
              </button>

              <p v-if="registerError" class="text-sm text-red-300">{{ registerError }}</p>
            </form>

            <div class="mt-10 space-y-4">
              <button
                  type="button"
                  class="access-trigger"
                  :class="{ 'access-trigger--open': showAccessGuide }"
                  :aria-expanded="showAccessGuide"
                  aria-controls="access-steps"
                  @click="showAccessGuide = !showAccessGuide"
              >
                <span>How to get access</span>
                <v-icon icon="mdi-chevron-down" size="20" class="access-trigger__icon" :class="{ 'access-trigger__icon--open': showAccessGuide }" />
              </button>
              <Transition name="collapse">
                <div v-if="showAccessGuide" id="access-steps" class="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <ol class="space-y-4 text-sm text-white/70">
                    <li class="flex gap-4">
                      <span class="step-badge">1</span>
                      <span>Join the <NuxtLink to="/#cta" class="text-cyan-300 underline decoration-dotted underline-offset-4">waitlist</NuxtLink>.</span>
                    </li>
                    <li class="flex gap-4">
                      <span class="step-badge">2</span>
                      <span>Receive your invite by email or get a code from an active member.</span>
                    </li>
                    <li class="flex gap-4">
                      <span class="step-badge">3</span>
                      <span>Register here, accept the terms & privacy policy and start flying.</span>
                    </li>
                  </ol>
                </div>
              </Transition>
              <div class="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5 text-sm text-cyan-100">
                Tip: After 14 days of active use you can generate up to two invitation codes yourself and share them with friends.
              </div>
            </div>
          </div>
        </div>
      </div>
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
const showAccessGuide = ref(false)

watch(mode, (value) => {
  if (value === 'register') {
    showAccessGuide.value = true
  }
})

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
.field-label {
  @apply text-xs font-semibold uppercase tracking-[0.35em] text-white/40;
}

.field-input {
  @apply mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[0.95rem] text-white/90 transition placeholder:text-white/30 focus:border-cyan-400 focus:bg-white/[0.08] focus:outline-none;
}

.feature-marker {
  @apply flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base text-cyan-200 shadow-inner;
}

.step-badge {
  @apply flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-200;
}

.fancy-submit {
  @apply relative flex w-full items-center justify-center overflow-hidden rounded-2xl px-4 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-[#0b1020];
  background: linear-gradient(120deg, #22d3ee 0%, #5eead4 45%, #818cf8 100%);
  background-size: 220% 220%;
  animation: gradientShift 14s ease infinite;
}

.fancy-submit::after {
  content: '';
  position: absolute;
  inset: -120% -40%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.35), transparent 60%);
  transform: rotate(12deg);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fancy-submit:hover:not([disabled]) {
  box-shadow: 0 18px 45px rgba(34, 211, 238, 0.35);
  transform: translateY(-1px);
}

.fancy-submit:hover:not([disabled])::after {
  opacity: 1;
}

.fancy-submit[disabled] {
  cursor: not-allowed;
  opacity: 0.75;
  box-shadow: none;
}

.fancy-submit[disabled]::after {
  opacity: 0;
}

.access-trigger {
  @apply flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white/70 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#0b1020];
}

.access-trigger--open {
  @apply border-cyan-400/50 bg-white/10 text-white;
}

.access-trigger__icon {
  @apply text-white/40 transition-transform duration-300;
}

.access-trigger__icon--open {
  @apply rotate-180 text-cyan-300;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.35s ease, opacity 0.25s ease, transform 0.35s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-0.5rem);
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 360px;
  opacity: 1;
  transform: translateY(0);
}

.orb {
  @apply pointer-events-none rounded-full blur-3xl;
}

.orb-left {
  @apply absolute -left-24 top-16 h-72 w-72 bg-cyan-500/20;
}

.orb-right {
  @apply absolute -right-28 bottom-10 h-96 w-96 bg-indigo-500/15;
}

.moving-grid {
  position: absolute;
  inset: -40% 0;
  background-image: linear-gradient(90deg, rgba(129, 140, 248, 0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px);
  background-size: 140px 140px;
  opacity: 0.18;
  animation: gridDrift 36s linear infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes orbFloat {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(20px, -30px, 0) scale(1.05);
  }
  100% {
    transform: translate3d(-10px, 10px, 0) scale(1);
  }
}

@keyframes gridDrift {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-120px);
  }
}

.animate-orb {
  animation: orbFloat 18s ease-in-out infinite alternate;
}

.animate-orb-slow {
  animation: orbFloat 26s ease-in-out infinite alternate;
}
</style>

