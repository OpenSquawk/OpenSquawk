<template>
  <div
      class="relative flex min-h-screen max-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#050713] via-[#080d1f] to-[#010208] text-white">
    <div class="pointer-events-none absolute inset-0 -z-20">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.22),_transparent_65%)]"/>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(129,140,248,0.16),_transparent_70%)]"/>
    </div>

    <div class="pointer-events-none absolute inset-0 radar-layer">
      <div class="radar" aria-hidden="true">
        <span class="radar__halo"></span>
        <span class="radar__grid"></span>
        <span class="radar__ring radar__ring--outer"></span>
        <span class="radar__ring radar__ring--inner"></span>
        <span class="radar__sweep"></span>
        <span class="radar__pulse radar__pulse--1"></span>
        <span class="radar__pulse radar__pulse--2"></span>
        <span class="radar__pulse radar__pulse--3"></span>
        <span class="radar__center"></span>
      </div>
    </div>

    <div class="pointer-events-none absolute inset-0 -z-10 opacity-70">
      <div class="orb orb-one"/>
      <div class="orb orb-two"/>
      <div class="orb orb-three"/>
    </div>

    <div
        class="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col overflow-hidden px-5 py-8 sm:px-8 lg:flex-row lg:items-stretch lg:py-12 lg:pl-0 min-h-0">
      <div
          class="relative hidden h-full min-h-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl lg:flex lg:w-[48%]">
<!--        <img src="/img/landing/runway.jpeg" alt="Guiding lights on a runway"-->
<!--        <img src="/img/learn/modules/img13.jpeg" alt="Guiding lights on a runway"-->
<!--        <img src="/img/learn/modules/img2.jpeg" alt="Guiding lights on a runway"-->
<!--        <img src="/img/learn/modules/img4.jpeg" alt="Guiding lights on a runway"-->
        <img src="/img/learn/modules/img4.jpeg" alt="Guiding lights on a runway"
             class="absolute inset-0 h-full w-full object-cover"/>
        <div class="absolute inset-0 bg-gradient-to-t from-[#050816]/95 via-[#050816]/40 to-transparent"/>
        <div class="relative z-10 flex h-full flex-col justify-between p-10">
          <div>
            <span
                class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-white/70">Alpha Access</span>
            <h1 class="mt-6 text-3xl font-semibold sm:text-4xl">Welcome back to the cockpit</h1>
            <p class="mt-4 max-w-md text-white/70">
              OpenSquawk delivers lightning-fast market audio with curated alerts and transcripts. Sign in to rejoin the
              flow, or use your invitation code to start listening live.
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
        <div
            class="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1020]/85 shadow-2xl backdrop-blur">
          <div class="flex-1 overflow-y-auto px-6 pt-6 pb-10 md:px-8 lg:pr-4">
            <div
                class="floating-card relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl lg:hidden">
              <img src="/img/landing/runway.jpeg" alt="Guiding lights on a runway" class="h-56 w-full object-cover"/>
              <div
                  class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent p-6">
                <p class="text-xs uppercase tracking-[0.3em] text-white/50">Alpha Access</p>
                <p class="mt-2 text-lg font-semibold">Experience the cockpit from anywhere</p>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 text-sm text-white/60">
              <NuxtLink to="/"
                        class="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 font-medium text-white/70 transition hover:bg-white/10 hover:text-white">
                <v-icon icon="mdi-arrow-left" size="18"/>
                Back to landing page
              </NuxtLink>
              <span class="hidden text-xs uppercase tracking-[0.3em] text-white/30 sm:block">Restricted Area</span>
            </div>

            <div class="mt-6 space-y-3">
              <p class="text-[11px] uppercase tracking-[0.4em] text-cyan-300/80">OpenSquawk Members</p>
              <h2 class="text-3xl font-semibold sm:text-4xl">Access your account</h2>
              <p class="max-w-xl text-white/60">
                Use your credentials to sign in or redeem an invitation code. After onboarding, you can invite
                colleagues once you have been active for two weeks.
              </p>
            </div>

            <div class="mt-6">
              <div class="mode-toggle" :data-mode="mode" role="group" aria-label="Switch between login and register">
                <span class="mode-toggle__glow" aria-hidden="true"/>
                <button
                    type="button"
                    class="mode-toggle__btn"
                    :data-active="mode === 'login'"
                    :aria-pressed="mode === 'login'"
                    @click="mode = 'login'"
                >
                  <span class="mode-toggle__btn-inner">
                    <v-icon icon="mdi-login" size="18" class="text-current"/>
                    <span>Login</span>
                  </span>
                </button>
                <button
                    type="button"
                    class="mode-toggle__btn"
                    :data-active="mode === 'register'"
                    :aria-pressed="mode === 'register'"
                    @click="mode = 'register'"
                >
                  <span class="mode-toggle__btn-inner">
                    <v-icon icon="mdi-account-plus-outline" size="18" class="text-current"/>
                    <span>Register</span>
                  </span>
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
                  <NuxtLink to="/forgot-password"
                            class="text-cyan-300 underline decoration-dotted underline-offset-4 transition hover:text-cyan-100">
                    Forgot your password?
                  </NuxtLink>
                </div>
              </div>

              <button type="submit" class="btn btn-primary w-full" :disabled="loginLoading">
                <span v-if="loginLoading" class="relative z-10 flex items-center justify-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="white"/>
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
                  <p class="mt-2 text-xs text-white/50">At least 8 characters, ideally include a number and special
                    character.</p>
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
                  <p v-if="invitationStatus === 'valid'" class="mt-2 text-xs font-medium text-green-300">Code is
                    valid.</p>
                  <p v-else-if="invitationStatus === 'invalid'" class="mt-2 text-xs font-medium text-red-300">This
                    invitation code is invalid or already used.</p>
                  <p v-else-if="invitationStatus === 'checking'" class="mt-2 text-xs font-medium text-white/60">Checking
                    invitation code…</p>
                </div>
              </div>

              <div class="space-y-3 text-xs text-white/60">
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="registerForm.acceptTerms" class="mt-1" required/>
                  <span>I accept the <NuxtLink to="/agb"
                                               class="text-cyan-300 underline decoration-dotted underline-offset-4">Terms of Service</NuxtLink>.</span>
                </label>
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="registerForm.acceptPrivacy" class="mt-1" required/>
                  <span>I have read the <NuxtLink to="/datenschutz"
                                                  class="text-cyan-300 underline decoration-dotted underline-offset-4">privacy policy</NuxtLink> and consent to data processing.</span>
                </label>
              </div>

              <button type="submit" class="btn btn-primary w-full" :disabled="registerLoading || !canRegister">
                <span v-if="registerLoading" class="relative z-10 flex items-center justify-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="white"/>
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
                    <span>Join the <NuxtLink to="/#cta"
                                             class="text-cyan-300 underline decoration-dotted underline-offset-4">waitlist</NuxtLink>.</span>
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
                  Tip: After 14 days of active use you can generate up to two invitation codes yourself and share them
                  with friends.
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
import {reactive, ref, computed, watch, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useHead} from '#imports'
import {useAuthStore} from '~/stores/auth'
import {useApi} from '~/composables/useApi'

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
    await auth.login({...loginForm})
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
    const res: any = await api.get(`/api/service/invitations/${registerForm.invitationCode.trim()}`, {auth: false})
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
    {name: 'robots', content: 'noindex,nofollow'},
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
  @apply relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold transition;
}

.btn-primary {
  @apply bg-cyan-400 text-slate-950 shadow-[0_14px_35px_rgba(56,189,248,0.35)] hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent;
}

.btn-primary:disabled {
  @apply cursor-not-allowed opacity-70 shadow-none;
}

.mode-toggle {
  @apply relative grid grid-cols-2 items-center overflow-hidden rounded-full border border-white/10 bg-white/5 p-1 shadow-inner;
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.9rem;
  font-weight: 600;
}

.mode-toggle__glow {
  @apply pointer-events-none absolute inset-y-1 left-1 rounded-full shadow-lg shadow-cyan-500/40;
  width: calc(50% - 0.25rem);
  background: rgb(103 232 249 / var(--tw-bg-opacity, 1));
  filter: drop-shadow(0 10px 25px rgba(56, 189, 248, 0.35));
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease;
}

.mode-toggle[data-mode='register'] .mode-toggle__glow {
  transform: translateX(100%);
}

.mode-toggle__btn {
  @apply relative z-10 flex items-center justify-center rounded-full px-4 py-2 transition;
  gap: 0.5rem;
  color: inherit;
}

.mode-toggle__btn-inner {
  @apply inline-flex items-center gap-2;
}

.mode-toggle__btn[data-active='true'] {
  color: #020617;
  text-shadow: 0 8px 18px rgba(15, 118, 230, 0.45);
}

.mode-toggle__btn[data-active='true'] .mode-toggle__btn-inner {
  @apply font-semibold;
}

.mode-toggle__btn:not([data-active='true']):hover,
.mode-toggle__btn:not([data-active='true']):focus-visible {
  color: rgba(255, 255, 255, 0.88);
}

.mode-toggle__btn:focus-visible {
  @apply outline-none ring-2 ring-cyan-300/70 ring-offset-2 ring-offset-transparent;
}

.mode-toggle__btn:active {
  transform: translateY(0);
}

.radar-layer {
  z-index: -1;
}

.radar {
  position: absolute;
  right: clamp(1.75rem, 10vw, 9rem);
  top: clamp(3.5rem, 21vh, 11rem);
  width: clamp(18rem, 34vw, 27rem);
  aspect-ratio: 1;
  border-radius: 9999px;
  overflow: hidden;
  pointer-events: none;
  isolation: isolate;
  background:
    radial-gradient(circle at center, rgba(5, 12, 30, 0.78) 0%, rgba(4, 10, 24, 0.82) 55%, rgba(5, 12, 30, 0) 85%),
    radial-gradient(circle at 28% 30%, rgba(14, 165, 233, 0.38) 0%, rgba(14, 165, 233, 0) 45%);
  border: 1px solid rgba(125, 211, 252, 0.35);
  box-shadow: inset 0 0 85px rgba(56, 189, 248, 0.28), 0 32px 95px rgba(12, 74, 110, 0.32);
  filter: drop-shadow(0 40px 110px rgba(56, 189, 248, 0.28));
}

.radar::after {
  content: '';
  position: absolute;
  inset: -30%;
  border-radius: inherit;
  background: radial-gradient(circle, rgba(12, 74, 110, 0.25) 0%, rgba(8, 25, 53, 0) 60%);
  opacity: 0.45;
  mix-blend-mode: screen;
  filter: blur(18px);
}

.radar__halo,
.radar__grid,
.radar__ring,
.radar__pulse,
.radar__sweep,
.radar__center {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
}

.radar__halo {
  inset: -28%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.32) 0%, rgba(2, 6, 23, 0) 68%);
  mix-blend-mode: screen;
  filter: blur(12px);
  animation: radarHalo 8s ease-in-out infinite;
  opacity: 0.45;
  transform-origin: center;
  z-index: 0;
}

.radar__grid {
  inset: 0;
  background:
    repeating-radial-gradient(circle at center, rgba(165, 243, 252, 0.22) 0px, rgba(165, 243, 252, 0.22) 1px, transparent 1px, transparent 28px),
    linear-gradient(transparent 49%, rgba(125, 211, 252, 0.32) 50%, transparent 51%),
    linear-gradient(90deg, transparent 49%, rgba(125, 211, 252, 0.32) 50%, transparent 51%);
  opacity: 0.4;
  mix-blend-mode: screen;
  animation: radarGridRotate 26s linear infinite;
  transform-origin: center;
  z-index: 1;
}

.radar__ring--outer {
  inset: 11%;
  border: 1px solid rgba(165, 243, 252, 0.42);
  box-shadow: inset 0 0 55px rgba(14, 165, 233, 0.2);
  opacity: 0.85;
  z-index: 2;
}

.radar__ring--inner {
  inset: 31%;
  border: 1px solid rgba(125, 211, 252, 0.42);
  box-shadow: 0 0 22px rgba(125, 211, 252, 0.4);
  opacity: 0.9;
  z-index: 3;
}

.radar__sweep {
  inset: -40%;
  background: conic-gradient(from -45deg, rgba(165, 243, 252, 0.82) 0deg, rgba(56, 189, 248, 0.6) 38deg, rgba(14, 116, 144, 0.2) 68deg, rgba(15, 23, 42, 0) 96deg, transparent 360deg);
  mix-blend-mode: screen;
  animation: radarSweep 4.8s linear infinite;
  transform-origin: center;
  filter: blur(0.5px);
  opacity: 0.95;
  z-index: 4;
}

.radar__sweep::after {
  content: '';
  position: absolute;
  inset: 32% 46% 32% 4%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.55) 0%, rgba(165, 243, 252, 0) 100%);
  border-radius: 9999px;
  filter: blur(2px);
  opacity: 0.8;
}

.radar__pulse {
  inset: 23%;
  border: 1px solid rgba(165, 243, 252, 0.55);
  background: radial-gradient(circle, rgba(125, 211, 252, 0.3) 0%, rgba(125, 211, 252, 0.12) 45%, transparent 70%);
  box-shadow: 0 0 40px rgba(125, 211, 252, 0.35);
  transform: scale(0.4);
  opacity: 0;
  mix-blend-mode: screen;
  will-change: transform, opacity;
  animation: radarPulse 5.8s ease-out infinite;
  z-index: 5;
}

.radar__pulse--2 {
  animation-delay: 1.9s;
}

.radar__pulse--3 {
  animation-delay: 3.8s;
}

.radar__center {
  inset: 45%;
  background: radial-gradient(circle, rgba(165, 243, 252, 0.95) 0%, rgba(56, 189, 248, 0.45) 60%, transparent 100%);
  box-shadow: 0 0 25px rgba(165, 243, 252, 0.65), 0 0 55px rgba(56, 189, 248, 0.35);
  animation: radarHeartbeat 2.4s ease-in-out infinite;
  will-change: transform, opacity;
  z-index: 6;
}

@media (max-width: 1024px) {
  .radar {
    left: 50%;
    right: auto;
    top: -2rem;
    transform: translateX(-50%);
    width: clamp(18rem, 72vw, 26rem);
    opacity: 0.85;
  }
}

@media (max-width: 640px) {
  .radar {
    top: -5.5rem;
    width: clamp(16rem, 86vw, 22rem);
    opacity: 0.78;
  }
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

@keyframes radarPulse {
  0% {
    transform: scale(0.38);
    opacity: 0.95;
  }
  45% {
    opacity: 0.55;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
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

@keyframes radarHeartbeat {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
    box-shadow: 0 0 25px rgba(165, 243, 252, 0.6), 0 0 55px rgba(56, 189, 248, 0.35);
  }
  45% {
    transform: scale(1.16);
    opacity: 1;
    box-shadow: 0 0 35px rgba(165, 243, 252, 0.75), 0 0 70px rgba(56, 189, 248, 0.45);
  }
}

@keyframes radarHalo {
  0%, 100% {
    transform: scale(1);
    opacity: 0.42;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.68;
  }
}

@keyframes radarGridRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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

@media (prefers-reduced-motion: reduce) {
  .orb,
  .floating-card,
  .mode-toggle__glow,
  .radar__pulse,
  .radar__sweep,
  .radar__center,
  .radar__grid,
  .radar__halo {
    animation: none !important;
  }

  .mode-toggle__glow {
    transition: none;
  }

  .radar__grid,
  .radar__halo {
    transform: none !important;
  }

  .radar__pulse {
    opacity: 0.35;
    transform: scale(1.05);
  }

  .radar__sweep {
    opacity: 0.55;
  }
}
</style>
