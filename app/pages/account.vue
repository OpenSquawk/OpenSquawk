<template>
  <div class="min-h-screen bg-[#050910] text-white">
    <div class="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <NuxtLink to="/pm" class="inline-flex items-center gap-2 text-sm text-white/70 hover:text-cyan-300">
            <v-icon icon="mdi-arrow-left" size="18" /> Zurück zum Cockpit
          </NuxtLink>
          <h1 class="mt-4 text-3xl font-semibold">Account &amp; Billing</h1>
          <p class="text-white/60">Verwalte dein Guthaben, Abonnements und Zahlungsarten.</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
          <p class="text-xs uppercase tracking-[0.3em] text-white/40">Verfügbares Guthaben</p>
          <p class="text-2xl font-semibold text-cyan-300">{{ formatCurrency(accountData?.balanceCents ?? 0) }}</p>
          <p v-if="accountData?.subscription?.status === 'past_due'" class="text-xs text-amber-300">
            Abrechnung steht aus – bitte Guthaben aufladen.
          </p>
        </div>
      </div>

      <div v-if="loading" class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-6">
        <v-progress-circular indeterminate color="cyan" size="20" width="2" />
        <span class="text-sm text-white/70">Lade Accountdaten…</span>
      </div>

      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-6 bg-red-500/10 text-red-100">
        {{ error }}
      </v-alert>

      <div v-else class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="space-y-6">
          <section class="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 class="text-lg font-semibold">Guthaben aufladen</h2>
            <p class="mt-1 text-sm text-white/60">
              Lade dein Guthaben für OpenSquawk auf. Für SEPA-Überweisungen schenken wir dir {{ formatCurrency(accountData?.sepa.bonusCents ?? 25) }} extra.
            </p>

            <form class="mt-4 space-y-4" @submit.prevent="submitTopup">
              <div class="grid gap-4 md:grid-cols-2">
                <label class="flex flex-col text-sm">
                  <span class="text-xs uppercase tracking-[0.3em] text-white/40">Betrag in €</span>
                  <input
                    v-model.number="topupForm.amount"
                    type="number"
                    min="1"
                    step="1"
                    required
                    class="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </label>
                <label class="flex flex-col text-sm">
                  <span class="text-xs uppercase tracking-[0.3em] text-white/40">Zahlungsmethode</span>
                  <select
                    v-model="topupForm.method"
                    class="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="mollie" :disabled="!accountData?.mollieEnabled">Kreditkarte / SEPA via Mollie</option>
                    <option value="sepa_transfer">Banküberweisung (SEPA)</option>
                  </select>
                </label>
              </div>

              <label class="flex items-center gap-3 text-sm text-white/70">
                <input
                  v-model="topupForm.recurring"
                  type="checkbox"
                  :disabled="topupForm.method !== 'mollie'"
                />
                <span>Automatische monatliche Aufladung einrichten (nur über Mollie).</span>
              </label>

              <div class="flex flex-wrap items-center gap-3 text-xs text-white/50">
                <span>Min. 1 €</span>
                <span v-if="topupForm.method === 'sepa_transfer'">+{{ formatCurrency(accountData?.sepa.bonusCents ?? 25) }} Bonus bei Geldeingang</span>
                <span v-if="topupForm.recurring">Du wirst nach erfolgreicher Erstzahlung monatlich automatisch belastet.</span>
              </div>

              <div class="flex flex-col gap-2 md:flex-row">
                <button class="btn btn-primary flex-1" type="submit" :disabled="topupLoading">
                  <span v-if="topupLoading" class="flex items-center justify-center gap-2">
                    <v-progress-circular indeterminate size="16" width="2" color="white" />
                    Verarbeite…
                  </span>
                  <span v-else>Aufladen</span>
                </button>
                <button
                  v-if="topupForm.method === 'mollie' && topupForm.recurring && accountData?.recurringTopups?.length"
                  type="button"
                  class="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:border-red-400 hover:text-red-200"
                  @click="cancelExistingRecurring"
                >
                  Automatik deaktivieren
                </button>
              </div>

              <p v-if="topupError" class="text-sm text-red-300">{{ topupError }}</p>
              <p v-if="topupMessage" class="text-sm text-green-300">{{ topupMessage }}</p>
            </form>

            <div v-if="sepaInstructions" class="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-4 text-sm">
              <h3 class="text-base font-semibold text-cyan-200">Überweisungsdetails</h3>
              <p class="mt-2 text-white/70">
                Bitte überweise <strong>{{ formatCurrency(sepaInstructions.amountCents) }}</strong> an untenstehende Bankverbindung und nutze den Verwendungszweck exakt wie angegeben.
              </p>
              <dl class="mt-3 grid gap-x-6 gap-y-2 md:grid-cols-2">
                <div>
                  <dt class="text-xs uppercase tracking-[0.3em] text-white/40">IBAN</dt>
                  <dd class="font-mono text-sm">{{ sepaInstructions.instructions.iban }}</dd>
                </div>
                <div v-if="sepaInstructions.instructions.bic">
                  <dt class="text-xs uppercase tracking-[0.3em] text-white/40">BIC</dt>
                  <dd class="font-mono text-sm">{{ sepaInstructions.instructions.bic }}</dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-[0.3em] text-white/40">Kontoinhaber</dt>
                  <dd class="text-sm">{{ sepaInstructions.instructions.holder }}</dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-[0.3em] text-white/40">Verwendungszweck</dt>
                  <dd class="font-mono text-sm text-cyan-200">{{ sepaInstructions.reference }}</dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-[0.3em] text-white/40">Bonus</dt>
                  <dd class="text-sm text-cyan-200">+ {{ formatCurrency(sepaInstructions.bonusCents) }} Guthaben</dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold">Monatsabo</h2>
                <p class="text-sm text-white/60">Das Abo nutzt dein Guthaben. Für den Start benötigst du ausreichend Balance.</p>
              </div>
              <div v-if="accountData?.subscription" class="text-right text-sm text-white/50">
                <p>Status: <span :class="subscriptionStatusClass">{{ translateStatus(accountData.subscription.status) }}</span></p>
                <p v-if="accountData.subscription.nextChargeAt">Nächste Abbuchung: {{ formatDate(accountData.subscription.nextChargeAt) }}</p>
              </div>
            </div>

            <div v-if="subscriptionError" class="mt-3 rounded-xl border border-red-300/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {{ subscriptionError }}
            </div>
            <div v-if="subscriptionMessage" class="mt-3 rounded-xl border border-green-300/40 bg-green-500/10 px-3 py-2 text-sm text-green-200">
              {{ subscriptionMessage }}
            </div>

            <div class="mt-4 space-y-4">
              <div v-for="plan in accountData?.availablePlans" :key="plan.id" class="rounded-xl border border-white/10 bg-white/5 p-4">
                <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 class="text-base font-semibold">{{ plan.name }}</h3>
                    <p class="text-sm text-white/60">{{ plan.description }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-semibold text-cyan-300">{{ formatCurrency(plan.amountCents) }}</p>
                    <p class="text-xs text-white/40">alle {{ plan.intervalMonths }} Monat(e)</p>
                  </div>
                </div>
                <div class="mt-4 flex flex-col gap-3 md:flex-row">
                  <button
                    v-if="!accountData?.subscription"
                    class="btn btn-primary flex-1"
                    :disabled="subscriptionLoading"
                    @click="startSubscription(plan.id)"
                  >
                    <span v-if="subscriptionLoading" class="flex items-center justify-center gap-2">
                      <v-progress-circular indeterminate size="16" width="2" color="white" />
                      Verarbeite…
                    </span>
                    <span v-else>Monatsabo starten</span>
                  </button>
                  <button
                    v-else-if="accountData.subscription.planId === plan.id"
                    class="flex-1 rounded-xl border border-red-300/50 px-4 py-3 text-sm text-red-200 hover:border-red-400"
                    :disabled="subscriptionLoading"
                    @click="cancelSubscription"
                  >
                    Abo beenden
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="space-y-6">
          <section class="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 class="text-lg font-semibold">Automatische Aufladungen</h2>
            <p class="text-sm text-white/60">Verwalte wiederkehrende Aufladungen über Mollie.</p>

            <div v-if="accountData?.recurringTopups?.length" class="mt-4 space-y-3">
              <div
                v-for="item in accountData.recurringTopups"
                :key="item.id"
                class="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p class="text-sm text-white/60">{{ item.description || 'Automatische Aufladung' }}</p>
                    <p class="text-lg font-semibold text-cyan-300">{{ formatCurrency(item.amountCents) }} / {{ item.interval }}</p>
                    <p v-if="item.nextPaymentAt" class="text-xs text-white/40">Nächste Zahlung: {{ formatDate(item.nextPaymentAt) }}</p>
                    <p class="text-xs text-white/40">Status: {{ translateRecurringStatus(item.status) }}</p>
                  </div>
                  <button
                    class="rounded-xl border border-red-300/40 px-4 py-2 text-sm text-red-200 hover:border-red-400"
                    :disabled="cancelRecurringLoading === item.id"
                    @click="cancelRecurring(item.id)"
                  >
                    <span v-if="cancelRecurringLoading === item.id" class="flex items-center gap-2">
                      <v-progress-circular indeterminate size="14" width="2" color="white" />
                      Kündige…
                    </span>
                    <span v-else>Automatik kündigen</span>
                  </button>
                </div>
              </div>
            </div>
            <p v-else class="mt-4 text-sm text-white/50">Keine automatischen Aufladungen aktiv.</p>
          </section>

          <section class="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 class="text-lg font-semibold">Transaktionen</h2>
            <p class="text-sm text-white/60">Die letzten Bewegungen deines Kontos.</p>

            <div v-if="!accountData?.transactions?.length" class="mt-4 text-sm text-white/50">
              Noch keine Transaktionen vorhanden.
            </div>

            <div v-else class="mt-4 space-y-3">
              <div
                v-for="tx in accountData.transactions"
                :key="tx.id"
                class="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p class="text-sm font-medium text-white">
                      {{ describeTransaction(tx) }}
                      <span v-if="tx.reference" class="ml-2 text-xs text-white/40">Ref: {{ tx.reference }}</span>
                    </p>
                    <p class="text-xs text-white/40">
                      {{ formatDate(tx.completedAt || tx.createdAt) }} · Status: {{ translateStatus(tx.status) }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-semibold text-cyan-300">{{ formatCurrency(tx.amountCents + (tx.bonusCents || 0)) }}</p>
                    <p v-if="tx.bonusCents" class="text-xs text-cyan-200">inkl. Bonus {{ formatCurrency(tx.bonusCents) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'

interface PaymentTransaction {
  id: string
  type: string
  method: string
  status: string
  amountCents: number
  bonusCents: number
  description?: string
  createdAt: string
  completedAt?: string
  reference?: string
}

interface SubscriptionInfo {
  id: string
  planId: string
  status: 'active' | 'past_due' | 'canceled'
  amountCents: number
  nextChargeAt?: string
  lastChargeAt?: string
}

interface RecurringTopupInfo {
  id: string
  amountCents: number
  interval: string
  status: 'active' | 'paused' | 'canceled'
  nextPaymentAt?: string
  description?: string
}

interface AccountData {
  balanceCents: number
  subscription: SubscriptionInfo | null
  transactions: PaymentTransaction[]
  recurringTopups: RecurringTopupInfo[]
  availablePlans: Array<{ id: string; name: string; amountCents: number; intervalMonths: number; description: string }>
  sepa: {
    bonusCents: number
    iban: string | null
    bic: string | null
    holder: string | null
    referencePrefix: string
  }
  mollieEnabled: boolean
}

interface SepaTopupResponse {
  transactionId: string
  amountCents: number
  bonusCents: number
  reference: string
  instructions: {
    iban: string
    bic: string | null
    holder: string
  }
}

interface MollieTopupResponse {
  transactionId: string
  checkoutUrl: string
}

const router = useRouter()
const auth = useAuthStore()
const api = useApi()

const loading = ref(true)
const error = ref('')
const accountData = ref<AccountData | null>(null)
const sepaInstructions = ref<SepaTopupResponse | null>(null)

const topupForm = reactive({
  amount: 25,
  method: 'mollie',
  recurring: false,
})
const topupLoading = ref(false)
const topupError = ref('')
const topupMessage = ref('')

const subscriptionLoading = ref(false)
const subscriptionError = ref('')
const subscriptionMessage = ref('')

const cancelRecurringLoading = ref<string | null>(null)

const subscriptionStatusClass = computed(() => {
  if (!accountData.value?.subscription) return ''
  const status = accountData.value.subscription.status
  if (status === 'active') return 'text-green-300'
  if (status === 'past_due') return 'text-amber-300'
  return 'text-white/60'
})

watch(
  () => topupForm.method,
  (method) => {
    if (method === 'sepa_transfer') {
      topupForm.recurring = false
    }
  },
)

async function ensureAuthenticated() {
  if (!auth.initialized) {
    await auth.fetchUser()
  }
  if (!auth.isAuthenticated) {
    router.push('/login')
    return false
  }
  return true
}

async function loadAccount() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.get<AccountData>('/api/service/billing/account')
    accountData.value = data
    sepaInstructions.value = null
    if (auth.user) {
      auth.setUser({ ...auth.user, balanceCents: data.balanceCents })
    }
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Konnte Accountdaten nicht laden.'
    error.value = message
  } finally {
    loading.value = false
  }
}

async function submitTopup() {
  if (topupLoading.value) return
  topupError.value = ''
  topupMessage.value = ''

  if (!accountData.value?.mollieEnabled && topupForm.method === 'mollie') {
    topupError.value = 'Mollie ist derzeit nicht verfügbar.'
    return
  }

  const cents = Math.round(Number(topupForm.amount) * 100)
  if (!Number.isFinite(cents) || cents < 100) {
    topupError.value = 'Bitte gib einen gültigen Betrag ein (mind. 1 €).'
    return
  }

  topupLoading.value = true
  try {
    if (topupForm.method === 'mollie') {
      const response = await api.post<MollieTopupResponse>('/api/service/billing/topups', {
        amountCents: cents,
        method: 'mollie',
        recurring: topupForm.recurring,
      })
      topupMessage.value = 'Weiterleitung zu Mollie…'
      window.location.href = response.checkoutUrl
      return
    }

    const response = await api.post<SepaTopupResponse>('/api/service/billing/topups', {
      amountCents: cents,
      method: 'sepa_transfer',
    })
    sepaInstructions.value = response
    topupMessage.value = 'Überweisungsdetails erstellt. Bitte führe die Überweisung durch.'
    await loadAccount()
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Aufladung fehlgeschlagen.'
    topupError.value = message
  } finally {
    topupLoading.value = false
  }
}

async function cancelExistingRecurring() {
  if (!accountData.value?.recurringTopups?.length) return
  await cancelRecurring(accountData.value.recurringTopups[0].id)
}

async function cancelRecurring(id: string) {
  cancelRecurringLoading.value = id
  try {
    await api.del(`/api/service/billing/recurring-topups/${id}`)
    subscriptionMessage.value = 'Automatische Aufladung wurde beendet.'
    await loadAccount()
  } catch (err: any) {
    subscriptionError.value = err?.data?.statusMessage || err?.message || 'Konnte automatische Aufladung nicht beenden.'
  } finally {
    cancelRecurringLoading.value = null
  }
}

async function startSubscription(planId: string) {
  if (subscriptionLoading.value) return
  subscriptionLoading.value = true
  subscriptionError.value = ''
  subscriptionMessage.value = ''
  try {
    const response = await api.post<{ subscription: SubscriptionInfo; balanceCents: number }>(
      '/api/service/billing/subscription',
      { action: 'start', planId },
    )
    subscriptionMessage.value = 'Abo aktiviert.'
    if (auth.user) {
      auth.setUser({ ...auth.user, balanceCents: response.balanceCents })
    }
    await loadAccount()
  } catch (err: any) {
    subscriptionError.value = err?.data?.statusMessage || err?.message || 'Abo konnte nicht gestartet werden.'
  } finally {
    subscriptionLoading.value = false
  }
}

async function cancelSubscription() {
  if (subscriptionLoading.value) return
  subscriptionLoading.value = true
  subscriptionError.value = ''
  subscriptionMessage.value = ''
  try {
    await api.post('/api/service/billing/subscription', { action: 'cancel' })
    subscriptionMessage.value = 'Abo wurde beendet.'
    await loadAccount()
  } catch (err: any) {
    subscriptionError.value = err?.data?.statusMessage || err?.message || 'Abo konnte nicht beendet werden.'
  } finally {
    subscriptionLoading.value = false
  }
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function formatDate(value?: string) {
  if (!value) return '–'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function translateStatus(status: string) {
  switch (status) {
    case 'completed':
    case 'active':
      return 'aktiv'
    case 'pending':
      return 'ausstehend'
    case 'past_due':
      return 'überfällig'
    case 'canceled':
      return 'beendet'
    case 'failed':
      return 'fehlgeschlagen'
    default:
      return status
  }
}

function translateRecurringStatus(status: string) {
  switch (status) {
    case 'active':
      return 'aktiv'
    case 'paused':
      return 'pausiert'
    case 'canceled':
      return 'gekündigt'
    default:
      return status
  }
}

function describeTransaction(tx: PaymentTransaction) {
  if (tx.type === 'subscription_charge') {
    return tx.description || 'Abo-Abbuchung'
  }
  if (tx.method === 'mollie') return tx.description || 'Aufladung via Mollie'
  if (tx.method === 'sepa_transfer') return tx.description || 'SEPA-Aufladung'
  return tx.description || 'Transaktion'
}

useHead({
  title: 'OpenSquawk – Account & Billing',
})

onMounted(async () => {
  const ok = await ensureAuthenticated()
  if (!ok) return
  await loadAccount()
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
