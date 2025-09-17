<template>
  <div class="min-h-screen bg-[#0b1020] text-white">
    <div class="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16 sm:px-6">
      <div class="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-lg">
        <NuxtLink to="/login" class="inline-flex items-center gap-2 text-sm text-white/70 hover:text-cyan-300">
          <v-icon icon="mdi-arrow-left" size="18" /> Zurück zum Login
        </NuxtLink>
        <h1 class="mt-4 text-2xl font-semibold">{{ token ? 'Neues Passwort setzen' : 'Passwort vergessen?' }}</h1>
        <p class="text-sm text-white/60">
          {{ token ? 'Bitte vergib ein neues Passwort für dein Konto.' : 'Wir senden dir einen Link zum Zurücksetzen deines Passworts.' }}
        </p>

        <div v-if="token">
          <div v-if="tokenStatus === 'checking'" class="mt-6 flex items-center gap-3 text-sm text-white/60">
            <v-progress-circular indeterminate size="16" width="2" color="cyan" /> Prüfe Link…
          </div>
          <v-alert
            v-else-if="tokenStatus === 'invalid'"
            type="error"
            variant="tonal"
            class="mt-6 bg-red-500/10 text-red-100"
          >
            Dieser Link ist ungültig oder abgelaufen. Fordere bitte einen neuen Link an.
          </v-alert>

          <form v-else class="mt-6 space-y-4" @submit.prevent="submitPassword">
            <label class="flex flex-col text-sm">
              <span class="text-xs uppercase tracking-[0.3em] text-white/40">Neues Passwort</span>
              <input
                v-model="passwordForm.password"
                type="password"
                minlength="8"
                required
                class="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </label>
            <label class="flex flex-col text-sm">
              <span class="text-xs uppercase tracking-[0.3em] text-white/40">Passwort bestätigen</span>
              <input
                v-model="passwordForm.confirm"
                type="password"
                minlength="8"
                required
                class="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </label>
            <p class="text-xs text-white/50">Mindestens 8 Zeichen, gerne inkl. Zahl &amp; Sonderzeichen.</p>

            <button type="submit" class="btn btn-primary w-full" :disabled="passwordLoading">
              <span v-if="passwordLoading" class="flex items-center justify-center gap-2">
                <v-progress-circular indeterminate size="16" width="2" color="white" /> Speichere…
              </span>
              <span v-else>Passwort speichern</span>
            </button>

            <p v-if="passwordError" class="text-sm text-red-300">{{ passwordError }}</p>
          </form>
        </div>

        <form v-else class="mt-6 space-y-4" @submit.prevent="submitRequest">
          <label class="flex flex-col text-sm">
            <span class="text-xs uppercase tracking-[0.3em] text-white/40">E-Mail</span>
            <input
              v-model.trim="requestEmail"
              type="email"
              required
              class="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </label>

          <button type="submit" class="btn btn-primary w-full" :disabled="requestLoading">
            <span v-if="requestLoading" class="flex items-center justify-center gap-2">
              <v-progress-circular indeterminate size="16" width="2" color="white" /> Sende Link…
            </span>
            <span v-else>Reset-Link senden</span>
          </button>

          <p v-if="requestSuccess" class="text-sm text-green-300">
            Wenn die E-Mail bei uns registriert ist, senden wir dir in Kürze einen Link zum Zurücksetzen.
          </p>
          <p v-if="requestError" class="text-sm text-red-300">{{ requestError }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '#imports'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const router = useRouter()
const api = useApi()
const auth = useAuthStore()

const token = ref(typeof route.query.token === 'string' ? route.query.token : '')
const requestEmail = ref('')
const requestLoading = ref(false)
const requestSuccess = ref(false)
const requestError = ref('')

const passwordForm = reactive({ password: '', confirm: '' })
const passwordLoading = ref(false)
const passwordError = ref('')
const tokenStatus = ref<'checking' | 'valid' | 'invalid'>(token.value ? 'checking' : 'valid')

watch(
  () => route.query.token,
  (value) => {
    token.value = typeof value === 'string' ? value : ''
    if (token.value) {
      validateToken()
    }
  },
)

async function validateToken() {
  tokenStatus.value = 'checking'
  try {
    const result = await api.get<{ valid: boolean }>('/api/service/auth/password-reset/validate', {
      auth: false,
      query: { token: token.value },
    })
    tokenStatus.value = result.valid ? 'valid' : 'invalid'
  } catch {
    tokenStatus.value = 'invalid'
  }
}

async function submitRequest() {
  if (requestLoading.value) return
  requestLoading.value = true
  requestError.value = ''
  requestSuccess.value = false
  try {
    await api.post('/api/service/auth/password-reset/request', { email: requestEmail.value }, { auth: false })
    requestSuccess.value = true
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Link konnte nicht gesendet werden.'
    requestError.value = message
  } finally {
    requestLoading.value = false
  }
}

async function submitPassword() {
  if (passwordLoading.value || tokenStatus.value !== 'valid') return
  if (passwordForm.password.length < 8 || passwordForm.password !== passwordForm.confirm) {
    passwordError.value = 'Passwörter müssen übereinstimmen und mindestens 8 Zeichen haben.'
    return
  }

  passwordLoading.value = true
  passwordError.value = ''
  try {
    const response = await api.post<{ accessToken: string; user: any }>(
      '/api/service/auth/password-reset/confirm',
      { token: token.value, password: passwordForm.password },
      { auth: false },
    )
    auth.setAccessToken(response.accessToken)
    auth.setUser(response.user)
    await router.push('/pm')
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Passwort konnte nicht gesetzt werden.'
    passwordError.value = message
  } finally {
    passwordLoading.value = false
  }
}

useHead({ title: token.value ? 'Passwort setzen – OpenSquawk' : 'Passwort vergessen – OpenSquawk' })

onMounted(() => {
  if (token.value) {
    validateToken()
  }
})
</script>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-4 py-3 text-sm font-medium text-white transition hover:bg-cyan-500/30;
}

.btn-primary {
  @apply border-cyan-400 bg-cyan-500/40 hover:bg-cyan-500/60;
}
</style>
