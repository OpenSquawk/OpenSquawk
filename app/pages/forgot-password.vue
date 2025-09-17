<template>
  <div class="min-h-screen bg-[#0b1020] text-white">
    <div class="mx-auto max-w-5xl px-6 py-12 lg:py-16 space-y-8">
      <NuxtLink to="/login" class="inline-flex items-center gap-2 text-sm text-white/70 hover:text-cyan-300">
        <v-icon icon="mdi-arrow-left" size="18" /> Zurück zum Login
      </NuxtLink>

      <div class="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-start">
        <div class="space-y-6">
          <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Passworthilfe</p>
            <h1 class="text-3xl md:text-4xl font-semibold">
              {{ isResetMode ? 'Neues Passwort festlegen' : 'Passwort zurücksetzen' }}
            </h1>
            <p class="text-white/70">
              {{
                isResetMode
                  ? 'Lege jetzt ein neues Passwort für deinen Account fest.'
                  : 'Trage deine registrierte E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.'
              }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <h2 class="text-lg font-semibold">So funktioniert es</h2>
            <ol v-if="!isResetMode" class="space-y-3 text-white/70 text-sm">
              <li class="flex gap-3"><span class="chip">1</span><span>E-Mail-Adresse eingeben und Link anfordern.</span></li>
              <li class="flex gap-3"><span class="chip">2</span><span>E-Mail öffnen und auf den Link klicken.</span></li>
              <li class="flex gap-3"><span class="chip">3</span><span>Neues Passwort vergeben und einloggen.</span></li>
            </ol>
            <ol v-else class="space-y-3 text-white/70 text-sm">
              <li class="flex gap-3"><span class="chip">1</span><span>Neues, sicheres Passwort auswählen.</span></li>
              <li class="flex gap-3"><span class="chip">2</span><span>Zur Sicherheit erneut bestätigen.</span></li>
              <li class="flex gap-3"><span class="chip">3</span><span>Speichern und mit dem neuen Passwort anmelden.</span></li>
            </ol>
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <form v-if="!isResetMode" class="space-y-4" @submit.prevent="submitRequest">
            <div>
              <label class="text-xs uppercase tracking-[0.3em] text-white/40">E-Mail</label>
              <input
                v-model.trim="requestForm.email"
                type="email"
                required
                autocomplete="email"
                class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            <button type="submit" class="btn btn-primary w-full" :disabled="requestLoading">
              <span v-if="requestLoading" class="flex items-center justify-center gap-2">
                <v-progress-circular indeterminate size="16" width="2" color="white" />
                Link wird gesendet…
              </span>
              <span v-else>Link anfordern</span>
            </button>

            <p v-if="requestError" class="text-sm text-red-300">{{ requestError }}</p>
            <div
              v-else-if="requestSuccess"
              class="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100"
            >
              Wenn ein Konto zu dieser Adresse existiert, findest du gleich eine E-Mail mit weiteren Schritten in deinem Postfach.
            </div>
          </form>

          <div v-else class="space-y-4">
            <div v-if="resetCompleted" class="space-y-4">
              <div class="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Dein Passwort wurde erfolgreich geändert. Du kannst dich jetzt mit dem neuen Passwort anmelden.
              </div>
              <NuxtLink to="/login" class="btn btn-primary w-full">Zum Login</NuxtLink>
            </div>

            <form v-else class="space-y-4" @submit.prevent="submitReset">
              <div class="space-y-3">
                <div>
                  <label class="text-xs uppercase tracking-[0.3em] text-white/40">Neues Passwort</label>
                  <input
                    v-model="resetForm.password"
                    type="password"
                    required
                    minlength="8"
                    autocomplete="new-password"
                    class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                  />
                  <p class="mt-1 text-xs text-white/50">Mindestens 8 Zeichen, gerne inkl. Zahl &amp; Sonderzeichen.</p>
                </div>
                <div>
                  <label class="text-xs uppercase tracking-[0.3em] text-white/40">Passwort bestätigen</label>
                  <input
                    v-model="resetForm.confirm"
                    type="password"
                    required
                    autocomplete="new-password"
                    class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <p v-if="passwordMismatch" class="text-xs text-red-300">Die Passwörter stimmen nicht überein.</p>

              <button type="submit" class="btn btn-primary w-full" :disabled="resetLoading || !canSubmitReset">
                <span v-if="resetLoading" class="flex items-center justify-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="white" />
                  Speichere neues Passwort…
                </span>
                <span v-else>Passwort speichern</span>
              </button>

              <p v-if="resetError" class="text-sm text-red-300">{{ resetError }}</p>
              <p class="text-xs text-white/60">
                Link funktioniert nicht?
                <NuxtLink to="/forgot-password" class="text-cyan-300 underline">Neuen Link anfordern</NuxtLink>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '#imports'
import { useApi } from '~/composables/useApi'

const api = useApi()
const route = useRoute()

const requestForm = reactive({
  email: '',
})
const requestLoading = ref(false)
const requestError = ref('')
const requestSuccess = ref(false)

const resetForm = reactive({
  password: '',
  confirm: '',
})
const resetLoading = ref(false)
const resetError = ref('')
const resetCompleted = ref(false)

const token = computed(() => {
  const value = route.query.token
  if (Array.isArray(value)) {
    return value[0] || ''
  }
  return typeof value === 'string' ? value : ''
})

const isResetMode = computed(() => Boolean(token.value))

const canSubmitReset = computed(
  () =>
    Boolean(
      token.value &&
        resetForm.password &&
        resetForm.password.length >= 8 &&
        resetForm.password === resetForm.confirm
    )
)

const passwordMismatch = computed(
  () => Boolean(resetForm.confirm && resetForm.password && resetForm.password !== resetForm.confirm)
)

watch(
  () => token.value,
  () => {
    resetForm.password = ''
    resetForm.confirm = ''
    resetError.value = ''
    resetCompleted.value = false
  }
)

async function submitRequest() {
  if (requestLoading.value) return
  requestLoading.value = true
  requestError.value = ''
  requestSuccess.value = false

  try {
    await api.post(
      '/api/service/auth/forgot-password',
      { email: requestForm.email },
      { auth: false }
    )
    requestSuccess.value = true
    requestForm.email = ''
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Senden fehlgeschlagen'
    requestError.value = message
  } finally {
    requestLoading.value = false
  }
}

async function submitReset() {
  if (resetLoading.value || !token.value) return
  resetLoading.value = true
  resetError.value = ''

  try {
    await api.post(
      '/api/service/auth/reset-password',
      { token: token.value, password: resetForm.password },
      { auth: false }
    )
    resetCompleted.value = true
    resetForm.password = ''
    resetForm.confirm = ''
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Zurücksetzen fehlgeschlagen'
    resetError.value = message
  } finally {
    resetLoading.value = false
  }
}

useHead({
  title: 'OpenSquawk – Passwort zurücksetzen',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' },
  ],
})
</script>

<style scoped>
.chip {
  @apply inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-medium text-cyan-200;
}
</style>
