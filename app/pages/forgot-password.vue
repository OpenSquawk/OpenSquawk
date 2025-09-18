<template>
  <div class="min-h-screen bg-[#0b1020] text-white">
    <div class="mx-auto max-w-5xl px-6 py-12 lg:py-16 space-y-8">
      <NuxtLink to="/login" class="inline-flex items-center gap-2 text-sm text-white/70 hover:text-cyan-300">
        <v-icon icon="mdi-arrow-left" size="18" /> Back to login
      </NuxtLink>

      <div class="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-start">
        <div class="space-y-6">
          <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Password support</p>
            <h1 class="text-3xl md:text-4xl font-semibold">
              {{ isResetMode ? 'Set a new password' : 'Reset your password' }}
            </h1>
            <p class="text-white/70">
              {{
                isResetMode
                  ? 'Set a new password for your account now.'
                  : 'Enter the email you registered with and we will send you a reset link.'
              }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <h2 class="text-lg font-semibold">How it works</h2>
            <ol v-if="!isResetMode" class="space-y-3 text-white/70 text-sm">
              <li class="flex gap-3"><span class="chip">1</span><span>Enter your email address and request the link.</span></li>
              <li class="flex gap-3"><span class="chip">2</span><span>Open the email and click the link.</span></li>
              <li class="flex gap-3"><span class="chip">3</span><span>Choose a new password and sign in.</span></li>
            </ol>
            <ol v-else class="space-y-3 text-white/70 text-sm">
              <li class="flex gap-3"><span class="chip">1</span><span>Choose a new secure password.</span></li>
              <li class="flex gap-3"><span class="chip">2</span><span>Confirm it for safety.</span></li>
              <li class="flex gap-3"><span class="chip">3</span><span>Save it and sign in with the new password.</span></li>
            </ol>
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <form v-if="!isResetMode" class="space-y-4" @submit.prevent="submitRequest">
            <div>
              <label class="text-xs uppercase tracking-[0.3em] text-white/40">Email</label>
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
                Sending link…
              </span>
              <span v-else>Request link</span>
            </button>

            <p v-if="requestError" class="text-sm text-red-300">{{ requestError }}</p>
            <div
              v-else-if="requestSuccess"
              class="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100"
            >
              If an account exists for this address, you'll soon find an email with the next steps in your inbox.
            </div>
          </form>

          <div v-else class="space-y-4">
            <div v-if="resetCompleted" class="space-y-4">
              <div class="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Your password was changed successfully. You can now sign in with the new password.
              </div>
              <NuxtLink to="/login" class="btn btn-primary w-full">Back to login</NuxtLink>
            </div>

            <form v-else class="space-y-4" @submit.prevent="submitReset">
              <div class="space-y-3">
                <div>
                  <label class="text-xs uppercase tracking-[0.3em] text-white/40">New password</label>
                  <input
                    v-model="resetForm.password"
                    type="password"
                    required
                    minlength="8"
                    autocomplete="new-password"
                    class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                  />
                  <p class="mt-1 text-xs text-white/50">At least 8 characters, ideally include a number and special character.</p>
                </div>
                <div>
                  <label class="text-xs uppercase tracking-[0.3em] text-white/40">Confirm password</label>
                  <input
                    v-model="resetForm.confirm"
                    type="password"
                    required
                    autocomplete="new-password"
                    class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <p v-if="passwordMismatch" class="text-xs text-red-300">The passwords do not match.</p>

              <button type="submit" class="btn btn-primary w-full" :disabled="resetLoading || !canSubmitReset">
                <span v-if="resetLoading" class="flex items-center justify-center gap-2">
                  <v-progress-circular indeterminate size="16" width="2" color="white" />
                  Saving new password…
                </span>
                <span v-else>Save password</span>
              </button>

              <p v-if="resetError" class="text-sm text-red-300">{{ resetError }}</p>
              <p class="text-xs text-white/60">
                Link not working?
                <NuxtLink to="/forgot-password" class="text-cyan-300 underline">Request a new link</NuxtLink>
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
    const message = err?.data?.statusMessage || err?.message || 'Sending failed'
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
    const message = err?.data?.statusMessage || err?.message || 'Reset failed'
    resetError.value = message
  } finally {
    resetLoading.value = false
  }
}

useHead({
  title: 'OpenSquawk – Reset password',
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
