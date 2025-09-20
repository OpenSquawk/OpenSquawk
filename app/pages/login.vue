<template>
  <div class="relative flex min-h-screen max-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#050713] via-[#080d1f] to-[#010208] text-white">
    <div class="pointer-events-none absolute inset-0 -z-20">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.22),_transparent_65%)]" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(129,140,248,0.16),_transparent_70%)]" />
    </div>

    <div class="pointer-events-none absolute inset-0 -z-10 opacity-70">
      <div class="orb orb-one" />
      <div class="orb orb-two" />
      <div class="orb orb-three" />
    </div>

    <div class="pointer-events-none absolute right-[-6rem] top-[-6rem] z-[-5] hidden h-[420px] w-[420px] lg:block">
      <div class="radar" aria-hidden="true">
        <div class="radar__sweep" aria-hidden="true"></div>
        <div class="radar__pulse" aria-hidden="true"></div>
      </div>
    </div>

    <div class="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col overflow-hidden px-5 py-8 sm:px-8 lg:flex-row lg:items-stretch lg:py-12 lg:pl-0 min-h-0">
      <div class="relative hidden h-full min-h-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl lg:flex lg:w-[48%]">
        <img src="/img/landing/runway.jpeg" alt="Guiding lights on a runway" class="absolute inset-0 h-full w-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#050816]/95 via-[#050816]/40 to-transparent" />
        <div class="relative z-10 flex h-full flex-col justify-between p-10">
          <div>
            <span class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-white/70">Alpha Access</span>
            <h1 class="mt-6 text-3xl font-semibold sm:text-4xl">Welcome back to the cockpit</h1>
            <p class="mt-4 max-w-md text-white/70">
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

      <div class="flex w-full flex-1 flex-col min-h-0 lg:pl-8">
        <div class="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1020]/85 shadow-2xl backdrop-blur">
          <div class="flex-1 overflow-y-auto px-6 pt-6 pb-10 md:px-8 lg:pr-4">
            <div class="floating-card relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl lg:hidden">
              <img src="/img/landing/runway.jpeg" alt="Guiding lights on a runway" class="h-56 w-full object-cover" />
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent p-6">
                <p class="text-xs uppercase tracking-[0.3em] text-white/50">Alpha Access</p>
                <p class="mt-2 text-lg font-semibold">Experience the cockpit from anywhere</p>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 text-sm text-white/60">
              <NuxtLink to="/" class="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 font-medium text-white/70 transition hover:bg-white/10 hover:text-white">
                <v-icon icon="mdi-arrow-left" size="18" /> Back to landing page
              </NuxtLink>
              <span class="hidden text-xs uppercase tracking-[0.3em] text-white/30 sm:block">Restricted Area</span>
            </div>

            <div class="mt-6 space-y-3">
              <p class="text-[11px] uppercase tracking-[0.4em] text-cyan-300/80">OpenSquawk Members</p>
              <h2 class="text-3xl font-semibold sm:text-4xl">Access your account</h2>
              <p class="max-w-xl text-white/60">
                Use your credentials to sign in or redeem an invitation code. After onboarding, you can invite colleagues once you have been active for two weeks.
              </p>
            </div>

            <div class="mt-6">
              <div class="mode-toggle" role="group" aria-label="Switch between login and register">
                <button
                    type="button"
                    class="btn mode-toggle__btn"
                    :class="mode === 'login' ? 'btn-primary mode-toggle__btn--active' : 'mode-toggle__btn--inactive'"
                    :aria-pressed="mode === 'login'"
                    @click="mode = 'login'"
                >
                  <v-icon icon="mdi-login" size="18" class="text-current" />
                  <span>Login</span>
                </button>
                <button
                    type="button"
                    class="btn mode-toggle__btn"
                    :class="mode === 'register' ? 'btn-primary mode-toggle__btn--active' : 'mode-toggle__btn--inactive'"
                    :aria-pressed="mode === 'register'"
                    @click="mode = 'register'"
                >
                  <v-icon icon="mdi-account-plus-outline" size="18" class="text-current" />
                  <span>Register</span>
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

              <button type="submit" class="btn btn-primary w-full" :disabled="loginLoading">
                <span v-if="loginLoading" class="relative z-10 flex items-center justify-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="white" />
                  Signing you in…
                </span>
                <span v-else class="relative z-10">Login</span>
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

              <button type="submit" class="btn btn-primary w-full" :disabled="registerLoading || !canRegister">
                <span v-if="registerLoading" class="relative z-10 flex items-center justify-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="white" />
                  Registering…
                </span>
                <span v-else class="relative z-10">Create account</span>
              </button>

              <p v-if="registerError" class="text-sm text-red-300">{{ registerError }}</p>
            </form>
          </div>
          <div class="card-footer border-t border-white/10">
            <button
                type="button"
                class="card-footer__toggle"
                :class="showAccessDetails ? 'bg-white/10 text-white' : ''"
                :aria-expanded="showAccessDetails"
                aria-controls="access-instructions"
                @click="showAccessDetails = !showAccessDetails"
            >
              <span>How to get access</span>
              <v-icon
                  icon="mdi-chevron-down"
                  size="20"
                  :class="['transition-transform duration-300', showAccessDetails ? 'rotate-180' : '']"
              />
            </button>
            <Transition name="collapse">
              <div v-show="showAccessDetails" id="access-instructions" class="card-footer__panel">
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
                    <span>Register here, accept the terms &amp; privacy policy and start flying.</span>
                  </li>
                </ol>
                <div class="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5 text-sm text-cyan-100">
                  Tip: After 14 days of active use you can generate up to two invitation codes yourself and share them with friends.
                </div>
              </div>
            </Transition>
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
const showAccessDetails = ref(false)

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

.btn {
  @apply relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold transition duration-300;
  transition-property: transform, box-shadow, background-position, background-size, color, opacity;
}

.btn-primary {
  @apply text-slate-950;
  background-image: linear-gradient(135deg, #67e8f9 0%, #38bdf8 45%, #6366f1 100%);
  box-shadow: 0 18px 45px rgba(56, 189, 248, 0.35), 0 0 30px rgba(129, 140, 248, 0.25);
  background-size: 160% 160%;
}

.btn-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.55), transparent 55%);
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.btn-primary:disabled {
  @apply cursor-not-allowed opacity-70 shadow-none;
  background-image: linear-gradient(135deg, rgba(103, 232, 249, 0.6) 0%, rgba(56, 189, 248, 0.6) 45%, rgba(99, 102, 241, 0.6) 100%);
}

.btn-primary:disabled::after {
  display: none;
}

.btn-primary:hover {
  box-shadow: 0 22px 55px rgba(56, 189, 248, 0.45), 0 0 38px rgba(129, 140, 248, 0.32);
  background-position: 20% 20%;
  transform: translateY(-1px);
}

.btn-primary:hover::after {
  opacity: 0.65;
  transform: scale(1.05);
}

.btn-primary:focus-visible {
  @apply outline-none ring-2 ring-cyan-200/70 ring-offset-2 ring-offset-transparent;
  box-shadow: 0 18px 45px rgba(56, 189, 248, 0.45), 0 0 38px rgba(129, 140, 248, 0.35);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 12px 28px rgba(56, 189, 248, 0.35), 0 0 20px rgba(129, 140, 248, 0.25);
}

.mode-toggle {
  @apply flex flex-wrap gap-3;
}

.mode-toggle__btn {
  @apply flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm;
  min-width: 0;
}

.mode-toggle__btn--active {
  @apply relative text-slate-950;
  background-image: linear-gradient(135deg, #22d3ee 0%, #0ea5e9 45%, #2563eb 100%);
  box-shadow: 0 18px 45px rgba(14, 165, 233, 0.35), 0 0 30px rgba(37, 99, 235, 0.28);
}

.mode-toggle__btn--inactive {
  @apply border border-white/10 bg-white/5 text-white/70;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.08);
  transition: all 0.3s ease;
}

.mode-toggle__btn--inactive:hover,
.mode-toggle__btn--inactive:focus-visible {
  @apply text-white;
  background-color: rgba(255, 255, 255, 0.12);
}

.mode-toggle__btn--inactive:focus-visible {
  @apply outline-none ring-2 ring-cyan-300/60 ring-offset-2 ring-offset-transparent;
}

.mode-toggle__btn--active:focus-visible {
  @apply outline-none ring-2 ring-cyan-200/70 ring-offset-2 ring-offset-transparent;
}

.mode-toggle__btn--inactive:active {
  transform: translateY(0);
}

.radar {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  border: 1px solid rgba(125, 211, 252, 0.28);
  background:
    radial-gradient(circle at center, rgba(56, 189, 248, 0.18) 0%, rgba(5, 9, 20, 0.1) 55%, rgba(2, 6, 23, 0) 70%),
    repeating-radial-gradient(circle at center, transparent 0, transparent 12%, rgba(56, 189, 248, 0.12) 12.5%, transparent 16%);
  box-shadow: 0 0 120px rgba(56, 189, 248, 0.25), inset 0 0 60px rgba(12, 74, 110, 0.45);
  overflow: hidden;
}

.radar::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at center, rgba(125, 211, 252, 0.35), rgba(125, 211, 252, 0));
  opacity: 0.25;
  animation: radarGlow 6s ease-in-out infinite;
}

.radar__sweep {
  position: absolute;
  inset: -55%;
  background: conic-gradient(from 0deg, rgba(165, 243, 252, 0.45) 0deg, rgba(56, 189, 248, 0.18) 60deg, transparent 75deg, transparent 360deg);
  animation: radarSweep 5.5s linear infinite;
  mix-blend-mode: screen;
}

.radar__pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 34%;
  height: 34%;
  border-radius: 9999px;
  border: 1px solid rgba(165, 243, 252, 0.55);
  transform: translate(-50%, -50%) scale(0.35);
  box-shadow: 0 0 40px rgba(56, 189, 248, 0.45);
  animation: radarPulse 3.8s ease-out infinite;
}

.radar__pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid rgba(165, 243, 252, 0.45);
  animation: radarPulse 3.8s ease-out infinite;
  animation-delay: 1.4s;
  box-shadow: 0 0 35px rgba(56, 189, 248, 0.28);
}

.orb {
  @apply absolute rounded-full blur-3xl;
  animation: orbFloat 16s ease-in-out infinite;
}

.orb-one {
  @apply -left-20 top-16 h-72 w-72 bg-cyan-500/25;
}

.orb-two {
  @apply bottom-[-6rem] right-[-5rem] h-96 w-96 bg-indigo-500/20;
  animation-delay: 2s;
}

.orb-three {
  @apply -top-20 right-1/3 h-64 w-64 bg-sky-500/10;
  animation-delay: 4s;
}

.floating-card {
  animation: cardFloat 10s ease-in-out infinite;
}

.card-footer {
  background: linear-gradient(180deg, rgba(12, 20, 42, 0.35) 0%, rgba(4, 7, 19, 0.82) 100%);
  box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.12);
}

.card-footer__toggle {
  @apply flex w-full items-center justify-between gap-3 px-6 py-4 text-left text-sm font-medium text-white/80 transition duration-300 ease-out;
  background-color: rgba(255, 255, 255, 0.03);
}

.card-footer__toggle:hover {
  background-color: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.92);
}

.card-footer__toggle:focus-visible {
  @apply outline-none ring-2 ring-cyan-300/70 ring-offset-2 ring-offset-transparent;
}

.card-footer__panel {
  @apply relative space-y-4 overflow-hidden border-t border-white/10 px-6 pb-6 pt-5 text-sm text-white/70;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(10, 16, 32, 0.58) 100%);
}

.card-footer__panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0) 0%, rgba(56, 189, 248, 0.45) 50%, rgba(56, 189, 248, 0) 100%);
  opacity: 0.5;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.35s ease, opacity 0.35s ease, transform 0.35s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 500px;
  opacity: 1;
  transform: translateY(0);
}

@keyframes orbFloat {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(12px, -14px, 0) scale(1.1);
  }
}

@keyframes cardFloat {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -12px, 0);
  }
}

@keyframes radarGlow {
  0%, 100% {
    opacity: 0.2;
    transform: scale(0.98);
  }
  50% {
    opacity: 0.35;
    transform: scale(1.04);
  }
}

@keyframes radarSweep {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes radarPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.35);
    opacity: 0.8;
  }
  60% {
    opacity: 0.15;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.05);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .orb,
  .floating-card {
    animation: none !important;
  }

  .btn-primary {
    transition: none;
  }

  .btn-primary::after {
    display: none;
  }

  .radar::before,
  .radar__sweep,
  .radar__pulse,
  .radar__pulse::after {
    animation: none !important;
  }
}
</style>
