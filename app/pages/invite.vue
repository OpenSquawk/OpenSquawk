<template>
  <div class="min-h-screen bg-[#050910] px-4 py-12 text-white">
    <div class="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
      <div class="mb-8 space-y-1 text-center">
        <p class="text-xs uppercase tracking-[0.35em] text-cyan-300/80">OpenSquawk</p>
        <h1 class="text-2xl font-semibold">Generate invitation code</h1>
        <p class="text-sm text-white/60">Password-protected surface for internal approvals.</p>
      </div>

      <form class="space-y-6" @submit.prevent="submit">
        <div class="space-y-2">
          <label for="invite-password" class="block text-sm font-medium text-white/80">Password</label>
          <input
            id="invite-password"
            v-model.trim="password"
            type="password"
            autocomplete="off"
            required
            class="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300"
            placeholder="Enter password"
          >
        </div>

        <div class="space-y-2">
          <label for="invite-label" class="block text-sm font-medium text-white/80">Label (optional)</label>
          <input
            id="invite-label"
            v-model.trim="label"
            type="text"
            maxlength="80"
            class="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300"
            placeholder="e.g. event, support or name"
          >
        </div>

        <button
          type="submit"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-[#050910] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
        >
          <span v-if="!loading">Generate invitation code</span>
          <span v-else class="flex items-center gap-2">
            <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
            Creating…
          </span>
        </button>
      </form>

      <transition name="fade">
        <p v-if="errorMessage" class="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {{ errorMessage }}
        </p>
      </transition>

      <transition name="fade">
        <div
          v-if="result"
          class="mt-8 space-y-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-emerald-100"
        >
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Invitation code</p>
            <p class="mt-2 font-mono text-3xl tracking-widest text-white">{{ result.code }}</p>
          </div>
          <div class="grid gap-2 text-sm text-emerald-100/80 sm:grid-cols-2">
            <div>
              <p class="text-xs uppercase tracking-[0.3em] text-emerald-200/60">Valid until</p>
              <p>{{ expiresAtDisplay }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.3em] text-emerald-200/60">Label</p>
              <p>{{ result.label || 'No label set' }}</p>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'

interface ManualInviteResponse {
  success: true
  code: string
  expiresAt: string
  label: string | null
}

const api = useApi()
const password = ref('')
const label = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const result = ref<ManualInviteResponse | null>(null)

const expiresAtDisplay = computed(() => {
  if (!result.value) return ''
  const date = new Date(result.value.expiresAt)
  if (Number.isNaN(date.getTime())) return result.value.expiresAt
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})

useHead({ title: 'Generate invitation code • OpenSquawk' })

async function submit() {
  if (loading.value) return
  errorMessage.value = null
  result.value = null
  loading.value = true

  try {
    const response = await api.post<ManualInviteResponse>(
      '/api/service/invitations/manual',
      { password: password.value, label: label.value || undefined },
      { auth: false },
    )

    result.value = response
    password.value = ''
  } catch (error: any) {
    const message =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.data?.message ||
      error?.message ||
      'Creating the invitation code failed.'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
