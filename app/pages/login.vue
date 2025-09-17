<template>
  <div class="min-h-screen bg-[#0b1020] text-white">
    <div class="mx-auto max-w-5xl px-6 py-12 lg:py-16">
      <div class="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-start">
        <div class="space-y-6">
          <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-white/70 hover:text-cyan-300">
            <v-icon icon="mdi-arrow-left" size="18" /> Zurück zur Landingpage
          </NuxtLink>
          <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">OpenSquawk Access</p>
            <h1 class="text-3xl md:text-4xl font-semibold">Melde dich an oder sichere dir deinen Invite</h1>
            <p class="text-white/70">
              Registrierungen sind nur mit Einladungscode möglich. Codes werden nach Eintrag auf die Warteliste vergeben oder von bestehenden Mitgliedern nach zwei Wochen Nutzungsdauer ausgestellt.
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <h2 class="text-lg font-semibold">So bekommst du Zugang</h2>
            <ol class="space-y-3 text-white/70 text-sm">
              <li class="flex gap-3"><span class="chip">1</span><span>Auf der <NuxtLink to="/#cta" class="text-cyan-300 underline">Warteliste</NuxtLink> eintragen.</span></li>
              <li class="flex gap-3"><span class="chip">2</span><span>Invite per E-Mail erhalten oder von einem aktiven Nutzer einen Code bekommen.</span></li>
              <li class="flex gap-3"><span class="chip">3</span><span>Hier registrieren, AGB & Datenschutz bestätigen und direkt loslegen.</span></li>
            </ol>
          </div>
          <div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <p class="text-sm text-cyan-100">
              Tipp: Nach 14 Tagen aktiver Nutzung kannst du selbst bis zu zwei Einladungscodes generieren und mit Freunden teilen.
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div class="flex items-center gap-2">
            <button
                class="flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition"
                :class="mode === 'login' ? 'border-cyan-400 bg-cyan-400/20 text-white' : 'border-white/10 text-white/70 hover:text-white'"
                @click="mode = 'login'"
            >
              Login
            </button>
            <button
                class="flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition"
                :class="mode === 'register' ? 'border-cyan-400 bg-cyan-400/20 text-white' : 'border-white/10 text-white/70 hover:text-white'"
                @click="mode = 'register'"
            >
              Registrieren
            </button>
          </div>

          <form v-if="mode === 'login'" class="space-y-4" @submit.prevent="submitLogin">
            <div class="space-y-3">
              <div>
                <label class="text-xs uppercase tracking-[0.3em] text-white/40">E-Mail</label>
                <input
                    v-model.trim="loginForm.email"
                    type="email"
                    required
                    autocomplete="email"
                    class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label class="text-xs uppercase tracking-[0.3em] text-white/40">Passwort</label>
                <input
                    v-model="loginForm.password"
                    type="password"
                    required
                    autocomplete="current-password"
                    class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                />
                <div class="mt-2 text-right">
                  <NuxtLink to="/reset-password" class="text-xs text-cyan-300 underline">Passwort vergessen?</NuxtLink>
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-full" :disabled="loginLoading">
              <span v-if="loginLoading" class="flex items-center justify-center gap-2">
                <v-progress-circular indeterminate size="16" width="2" color="white" />
                Anmeldung…
              </span>
              <span v-else>Login</span>
            </button>

            <p v-if="loginError" class="text-sm text-red-300">{{ loginError }}</p>
          </form>

          <form v-else class="space-y-4" @submit.prevent="submitRegister">
            <div class="space-y-3">
              <div>
                <label class="text-xs uppercase tracking-[0.3em] text-white/40">Name</label>
                <input
                    v-model.trim="registerForm.name"
                    type="text"
                    autocomplete="name"
                    placeholder="Vorname Nachname"
                    class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label class="text-xs uppercase tracking-[0.3em] text-white/40">E-Mail</label>
                <input
                    v-model.trim="registerForm.email"
                    type="email"
                    required
                    autocomplete="email"
                    class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label class="text-xs uppercase tracking-[0.3em] text-white/40">Passwort</label>
                <input
                    v-model="registerForm.password"
                    type="password"
                    required
                    minlength="8"
                    autocomplete="new-password"
                    class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                />
                <p class="mt-1 text-xs text-white/50">Mindestens 8 Zeichen, gerne inkl. Zahl & Sonderzeichen.</p>
              </div>
              <div>
                <div class="flex items-center justify-between">
                  <label class="text-xs uppercase tracking-[0.3em] text-white/40">Einladungscode</label>
                  <button type="button" class="text-[11px] text-cyan-300 underline" @click="checkInvitationCode" :disabled="!registerForm.invitationCode">
                    Code prüfen
                  </button>
                </div>
                <input
                    v-model.trim="registerForm.invitationCode"
                    type="text"
                    required
                    class="mt-1 w-full uppercase tracking-widest rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                    placeholder="z.B. ABCD1234"
                />
                <p v-if="invitationStatus === 'valid'" class="mt-1 text-xs text-green-300">Code ist gültig.</p>
                <p v-else-if="invitationStatus === 'invalid'" class="mt-1 text-xs text-red-300">Dieser Einladungscode ist ungültig oder bereits verwendet.</p>
                <p v-else-if="invitationStatus === 'checking'" class="mt-1 text-xs text-white/60">Prüfe Einladungscode…</p>
              </div>
            </div>

            <div class="space-y-2 text-xs text-white/60">
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="registerForm.acceptTerms" class="mt-1" required />
                <span>Ich akzeptiere die <NuxtLink to="/agb" class="text-cyan-300 underline">AGB</NuxtLink>.</span>
              </label>
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="registerForm.acceptPrivacy" class="mt-1" required />
                <span>Ich habe die <NuxtLink to="/datenschutz" class="text-cyan-300 underline">Datenschutzerklärung</NuxtLink> gelesen und stimme der Datenverarbeitung zu.</span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary w-full" :disabled="registerLoading || !canRegister">
              <span v-if="registerLoading" class="flex items-center justify-center gap-2">
                <v-progress-circular indeterminate size="16" width="2" color="white" />
                Registriere…
              </span>
              <span v-else>Account erstellen</span>
            </button>

            <p v-if="registerError" class="text-sm text-red-300">{{ registerError }}</p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'

type Mode = 'login' | 'register'

const router = useRouter()
const auth = useAuthStore()
const api = useApi()

const mode = ref<Mode>('login')

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
    router.push('/pm')
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Anmeldung fehlgeschlagen'
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
    router.push('/pm')
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Registrierung fehlgeschlagen'
    registerError.value = message
  } finally {
    registerLoading.value = false
  }
}

useHead({
  title: 'OpenSquawk – Login & Einladung',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' },
  ],
})

onMounted(() => {
  if (auth.isAuthenticated) {
    router.push('/pm')
  }
})
</script>

<style scoped>
.chip {
  @apply inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-medium text-cyan-200;
}
</style>

