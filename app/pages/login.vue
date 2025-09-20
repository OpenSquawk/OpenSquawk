<template>
  <div class="relative flex h-screen max-h-screen flex-col overflow-hidden bg-[#050916] text-white lg:flex-row">
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-[#050916] via-[#08162d] to-[#02030a]"></div>
      <div class="absolute inset-0 opacity-80 mix-blend-screen animate-gradient-pan bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_60%)]"></div>
      <div class="gradient-orb gradient-orb--one"></div>
      <div class="gradient-orb gradient-orb--two"></div>
      <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_60%)] lg:block"></div>
    </div>

    <aside class="relative hidden h-full flex-1 overflow-hidden lg:flex">
      <img
        src="/img/landing/runway.jpeg"
        alt="OpenSquawk runway with a jet preparing for takeoff"
        class="h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-[#050916]/90"></div>
      <div class="absolute inset-x-12 bottom-12 space-y-4 text-white">
        <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-1.5 text-xs uppercase tracking-[0.3em] text-cyan-200">
          Live ATC intelligence
        </span>
        <p class="max-w-sm text-2xl font-semibold">
          Designed for pilots and aviation enthusiasts who demand clarity in every transmission.
        </p>
        <p class="max-w-sm text-sm text-white/75">
          Stay ahead of the traffic pattern with curated insights, collaborative tools, and an invite-only community.
        </p>
      </div>
    </aside>

    <main class="relative z-10 flex w-full flex-1 flex-col items-start overflow-y-auto px-6 py-10 sm:px-10 lg:h-full lg:items-center lg:justify-center lg:px-12">
      <div class="w-full max-w-md space-y-8 pb-14 sm:space-y-10 sm:pb-16 lg:max-w-[520px] lg:pb-20">
        <div class="sm:hidden">
          <div class="card-floating relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_30px_80px_-50px_rgba(8,22,45,0.9)] backdrop-blur-xl">
            <img
              src="/img/landing/runway.jpeg"
              alt="OpenSquawk runway with a jet preparing for takeoff"
              class="absolute inset-0 h-full w-full object-cover opacity-60"
            />
            <div class="relative space-y-4">
              <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
                Live ATC intelligence
              </span>
              <p class="text-2xl font-semibold text-white">
                Designed for clarity on every frequency.
              </p>
              <p class="text-sm leading-relaxed text-white/75">
                Tap into curated audio, mission-ready tooling, and a community built for serious aviators.
              </p>
            </div>
          </div>
        </div>

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

        <div class="card-floating rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_-40px_rgba(8,24,53,0.9)] backdrop-blur lg:p-7" style="--float-delay: 0.8s">
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

            <button
              type="submit"
              class="fancy-cta disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              :disabled="loginLoading"
            >
              <span v-if="loginLoading" class="fancy-cta__content">
                <v-progress-circular indeterminate size="16" width="2" color="#041022" />
                Signing you in…
              </span>
              <span v-else class="fancy-cta__content">Login</span>
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

            <button
              type="submit"
              class="fancy-cta disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              :disabled="registerLoading || !canRegister"
            >
              <span v-if="registerLoading" class="fancy-cta__content">
                <v-progress-circular indeterminate size="16" width="2" color="#041022" />
                Registering…
              </span>
              <span v-else class="fancy-cta__content">Create account</span>
            </button>

            <p v-if="registerError" class="text-sm text-red-300">{{ registerError }}</p>
          </form>
        </div>

        <div class="card-floating rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-45px_rgba(8,22,45,0.9)] backdrop-blur" style="--float-delay: 1.4s">
          <button
            type="button"
            class="flex w-full items-center justify-between text-left text-lg font-semibold transition hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
            @click="showAccess = !showAccess"
            :aria-expanded="showAccess"
            aria-controls="access-guidance"
          >
            <span>How to get access</span>
            <v-icon
              icon="mdi-chevron-down"
              size="20"
              class="transition-transform duration-300"
              :class="showAccess ? 'rotate-180 text-cyan-300' : 'text-white/60'"
            />
          </button>
          <Transition name="accordion">
            <div v-show="showAccess" id="access-guidance" class="accordion-content mt-4 space-y-4 text-sm text-white/70">
              <ol class="space-y-3">
                <li class="flex gap-3"><span class="chip">1</span><span>Join the <NuxtLink to="/#cta" class="text-cyan-300 underline transition hover:text-cyan-200">waitlist</NuxtLink>.</span></li>
                <li class="flex gap-3"><span class="chip">2</span><span>Receive your invite by email or get a code from an active member.</span></li>
                <li class="flex gap-3"><span class="chip">3</span><span>Register here, accept the terms & privacy policy and start flying.</span></li>
              </ol>
            </div>
          </Transition>
        </div>

        <div class="card-floating rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-6 text-sm text-cyan-100 shadow-[0_24px_60px_-45px_rgba(34,211,238,0.65)]" style="--float-delay: 2s">
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
const showAccess = ref(false)

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

.fancy-cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-radius: 1.25rem;
  padding: 0.85rem 1.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #041022;
  background: linear-gradient(115deg, #22d3ee 0%, #38bdf8 35%, #2563eb 100%);
  box-shadow: 0 24px 45px -30px rgba(56, 189, 248, 0.7), 0 24px 40px -32px rgba(21, 94, 239, 0.45);
  transition: transform 0.35s ease, box-shadow 0.35s ease, filter 0.35s ease;
}

.fancy-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.15) 40%, transparent 70%);
  transform: translateX(-120%);
  transition: transform 0.45s ease;
  opacity: 0.6;
  mix-blend-mode: screen;
}

.fancy-cta:hover,
.fancy-cta:focus-visible {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 32px 60px -32px rgba(56, 189, 248, 0.85), 0 28px 48px -32px rgba(21, 94, 239, 0.5);
}

.fancy-cta:hover::before,
.fancy-cta:focus-visible::before {
  transform: translateX(0);
}

.fancy-cta:disabled {
  transform: none;
  filter: saturate(75%);
  box-shadow: 0 20px 40px -35px rgba(56, 189, 248, 0.45);
}

.fancy-cta:disabled::before {
  opacity: 0;
}

.fancy-cta__content {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.card-floating {
  animation: float 12s ease-in-out infinite;
  animation-delay: var(--float-delay, 0s);
}

.animate-gradient-pan {
  animation: gradient-pan 20s ease-in-out infinite;
}

.gradient-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(140px);
  opacity: 0.35;
  animation: orb-pulse 16s ease-in-out infinite;
}

.gradient-orb--one {
  top: -6rem;
  left: -8rem;
  width: 22rem;
  height: 22rem;
  background: radial-gradient(circle at center, rgba(56, 189, 248, 0.55), transparent 60%);
}

.gradient-orb--two {
  bottom: -8rem;
  right: -5rem;
  width: 24rem;
  height: 24rem;
  background: radial-gradient(circle at center, rgba(59, 130, 246, 0.45), transparent 60%);
  animation-delay: 3s;
}

.accordion-content {
  overflow: hidden;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.35s ease, opacity 0.3s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 320px;
  opacity: 1;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes gradient-pan {
  0% {
    transform: translate3d(-5%, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(5%, -3%, 0) scale(1.05);
  }
  100% {
    transform: translate3d(-5%, 0, 0) scale(1);
  }
}

@keyframes orb-pulse {
  0%,
  100% {
    transform: scale(0.95);
    opacity: 0.28;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-floating,
  .animate-gradient-pan,
  .gradient-orb {
    animation: none !important;
  }

  .fancy-cta,
  .fancy-cta::before {
    transition: none !important;
  }
}
</style>
