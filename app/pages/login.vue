<template>
  <div class="relative min-h-screen overflow-hidden bg-[#050b1a] text-white">
    <div class="absolute inset-0">
      <img
        src="/img/landing/runway.jpeg"
        alt="Illuminated runway at night representing the OpenSquawk flight deck"
        class="h-full w-full object-cover opacity-60"
      />
      <div class="absolute inset-0 bg-[linear-gradient(115deg,_rgba(5,11,26,0.94),_rgba(11,16,32,0.96)_35%,_rgba(12,32,54,0.85))]"></div>
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.28),_transparent_55%)] mix-blend-screen"></div>
    </div>

    <div class="relative z-10">
      <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:py-14 lg:px-10">
        <div>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-300/60 hover:text-cyan-200/90"
          >
            <v-icon icon="mdi-arrow-left" size="18" />
            Back to landing page
          </NuxtLink>
        </div>

        <div class="mt-12 grid flex-1 items-center gap-12 pb-12 lg:mt-16 lg:grid-cols-[1.08fr_1fr]">
          <div class="max-w-2xl space-y-10">
            <div class="space-y-6">
              <div class="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.45em] text-white/70 backdrop-blur">
                <span class="inline-flex h-2 w-2 animate-pulse rounded-full bg-cyan-300"></span>
                OpenSquawk Alpha Access
              </div>
              <h1 class="text-4xl font-semibold leading-tight md:text-5xl">
                Sign in to the cockpit or claim your invite
              </h1>
              <p class="text-base text-white/75 md:text-lg">
                Registration requires an invitation code. Codes are issued after joining the waitlist or shared by active members
                after two weeks of use.
              </p>
              <div class="flex flex-wrap gap-3 text-[13px] text-white/70 md:text-sm">
                <span class="rounded-full border border-white/20 bg-white/5 px-4 py-2">Waitlist approvals are processed in weekly waves.</span>
                <span class="rounded-full border border-white/20 bg-white/5 px-4 py-2">Members can unlock two community invites after 14 days.</span>
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
              <div class="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-black/20 backdrop-blur">
                <h2 class="text-lg font-semibold text-white">How to get access</h2>
                <ol class="mt-4 space-y-4 text-sm text-white/75">
                  <li class="flex gap-3">
                    <span class="chip">1</span>
                    <span>Join the <NuxtLink to="/#cta" class="text-cyan-300 underline">waitlist</NuxtLink>.</span>
                  </li>
                  <li class="flex gap-3">
                    <span class="chip">2</span>
                    <span>Receive your invite by email or get a code from an active member.</span>
                  </li>
                  <li class="flex gap-3">
                    <span class="chip">3</span>
                    <span>Register here, accept the terms & privacy policy and start flying.</span>
                  </li>
                </ol>
              </div>

              <div class="rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/25 via-cyan-500/10 to-transparent p-6 shadow-xl shadow-cyan-500/20 backdrop-blur">
                <div class="flex items-center gap-3 text-cyan-50/90">
                  <span class="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/20">
                    <v-icon icon="mdi-airplane-takeoff" size="24" class="text-cyan-100" />
                  </span>
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.35em] text-cyan-100/80">Crew tip</p>
                    <p class="text-base font-semibold text-cyan-50">Share the excitement</p>
                  </div>
                </div>
                <p class="mt-4 text-sm text-cyan-50/80">
                  After 14 days of active use you can generate up to two invitation codes yourself and share them with friends.
                </p>
                <div class="mt-5 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-[13px] text-cyan-50/75">
                  Switch between the login and registration tabs on the right to use your code immediately.
                </div>
              </div>
            </div>
          </div>

          <div class="relative">
            <div class="absolute -top-8 left-10 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl"></div>
            <div class="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-500/20 blur-[120px]"></div>
            <div class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-[1px] shadow-2xl shadow-black/40 backdrop-blur">
              <div class="rounded-[2rem] bg-[#0c1225]/80 p-6 sm:p-8">
                <div class="space-y-6">
                  <div class="space-y-2 text-center">
                    <p class="text-xs uppercase tracking-[0.4em] text-white/50">Account access</p>
                    <h2 class="text-2xl font-semibold">Login or create an account</h2>
                    <p class="text-sm text-white/60">Use your email and password or switch to registration with your invitation code.</p>
                  </div>

                  <div class="flex rounded-2xl bg-white/5 p-1 text-sm font-medium">
                    <button
                      class="flex-1 rounded-2xl px-4 py-2 transition"
                      :class="mode === 'login' ? 'bg-gradient-to-r from-cyan-400/70 via-cyan-500/70 to-cyan-400/70 text-white shadow-lg shadow-cyan-500/40' : 'text-white/70 hover:text-white'"
                      @click="mode = 'login'"
                    >
                      Login
                    </button>
                    <button
                      class="flex-1 rounded-2xl px-4 py-2 transition"
                      :class="mode === 'register' ? 'bg-gradient-to-r from-cyan-400/70 via-cyan-500/70 to-cyan-400/70 text-white shadow-lg shadow-cyan-500/40' : 'text-white/70 hover:text-white'"
                      @click="mode = 'register'"
                    >
                      Register
                    </button>
                  </div>

                  <form v-if="mode === 'login'" class="space-y-5 text-left" @submit.prevent="submitLogin">
                    <div class="space-y-4">
                      <div>
                        <label class="text-[11px] uppercase tracking-[0.35em] text-white/40">Email</label>
                        <input
                          v-model.trim="loginForm.email"
                          type="email"
                          required
                          autocomplete="email"
                          class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60"
                        />
                      </div>
                      <div>
                        <label class="text-[11px] uppercase tracking-[0.35em] text-white/40">Password</label>
                        <input
                          v-model="loginForm.password"
                          type="password"
                          required
                          autocomplete="current-password"
                          class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60"
                        />
                      </div>
                      <div class="text-right">
                        <NuxtLink to="/forgot-password" class="text-xs text-cyan-300 underline transition hover:text-cyan-200">
                          Forgot your password?
                        </NuxtLink>
                      </div>
                    </div>

                    <button
                      type="submit"
                      class="btn btn-primary w-full rounded-xl py-3 text-base font-semibold shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5 hover:shadow-cyan-400/40 disabled:translate-y-0"
                      :disabled="loginLoading"
                    >
                      <span v-if="loginLoading" class="flex items-center justify-center gap-2">
                        <v-progress-circular indeterminate size="16" width="2" color="white" />
                        Signing you in…
                      </span>
                      <span v-else>Login</span>
                    </button>

                    <p v-if="loginError" class="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {{ loginError }}
                    </p>
                  </form>

                  <form v-else class="space-y-5 text-left" @submit.prevent="submitRegister">
                    <div class="space-y-4">
                      <div>
                        <label class="text-[11px] uppercase tracking-[0.35em] text-white/40">Name</label>
                        <input
                          v-model.trim="registerForm.name"
                          type="text"
                          autocomplete="name"
                          placeholder="First Last"
                          class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60"
                        />
                      </div>
                      <div>
                        <label class="text-[11px] uppercase tracking-[0.35em] text-white/40">Email</label>
                        <input
                          v-model.trim="registerForm.email"
                          type="email"
                          required
                          autocomplete="email"
                          class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60"
                        />
                      </div>
                      <div>
                        <label class="text-[11px] uppercase tracking-[0.35em] text-white/40">Password</label>
                        <input
                          v-model="registerForm.password"
                          type="password"
                          required
                          minlength="8"
                          autocomplete="new-password"
                          class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60"
                        />
                        <p class="mt-1 text-xs text-white/60">
                          At least 8 characters, ideally include a number and special character.
                        </p>
                      </div>
                      <div>
                        <div class="flex items-center justify-between">
                          <label class="text-[11px] uppercase tracking-[0.35em] text-white/40">Invitation code</label>
                          <button
                            type="button"
                            class="text-[11px] font-medium text-cyan-300 underline transition hover:text-cyan-200"
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
                          class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm uppercase tracking-widest text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/60"
                          placeholder="e.g. ABCD1234"
                        />
                        <p v-if="invitationStatus === 'valid'" class="mt-2 text-xs text-green-300">Code is valid.</p>
                        <p v-else-if="invitationStatus === 'invalid'" class="mt-2 text-xs text-red-300">This invitation code is invalid or already used.</p>
                        <p v-else-if="invitationStatus === 'checking'" class="mt-2 text-xs text-white/60">Checking invitation code…</p>
                      </div>
                    </div>

                    <div class="space-y-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
                      <label class="flex items-start gap-3">
                        <input type="checkbox" v-model="registerForm.acceptTerms" class="mt-1" required />
                        <span>I accept the <NuxtLink to="/agb" class="text-cyan-300 underline">Terms of Service</NuxtLink>.</span>
                      </label>
                      <label class="flex items-start gap-3">
                        <input type="checkbox" v-model="registerForm.acceptPrivacy" class="mt-1" required />
                        <span>I have read the <NuxtLink to="/datenschutz" class="text-cyan-300 underline">privacy policy</NuxtLink> and consent to data processing.</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      class="btn btn-primary w-full rounded-xl py-3 text-base font-semibold shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5 hover:shadow-cyan-400/40 disabled:translate-y-0"
                      :disabled="registerLoading || !canRegister"
                    >
                      <span v-if="registerLoading" class="flex items-center justify-center gap-2">
                        <v-progress-circular indeterminate size="16" width="2" color="white" />
                        Registering…
                      </span>
                      <span v-else>Create account</span>
                    </button>

                    <p v-if="registerError" class="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {{ registerError }}
                    </p>
                  </form>
                </div>
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
