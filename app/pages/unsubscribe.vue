<template>
  <div class="relative min-h-screen bg-[#050914] text-white">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),transparent_55%)]"/>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(123,77,255,0.12),transparent_60%)]"/>

    <main class="relative z-10 mx-auto flex max-w-4xl flex-col gap-12 px-6 py-16 sm:px-8 md:px-10 lg:py-20">
      <header class="space-y-4 text-center">
        <span class="chip inline-flex items-center justify-center px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white">
          Updates
        </span>
        <h1 class="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">Bleibe oder melde dich ab</h1>
        <p class="mx-auto max-w-3xl text-base text-white/75 sm:text-lg">
          Wir sind auf ehrliches Feedback angewiesen, um OpenSquawk besser zu machen. Es wäre schade, dich zu verlieren –
          hinter <a class="font-semibold text-cyan-200 hover:text-cyan-100" href="mailto:info@opensquawk.de">info@opensquawk.de</a>
          kannst du uns jederzeit schreiben, was du dir wünschst. Deine Nachrichten landen direkt bei den Menschen, die OpenSquawk
          entwickeln, damit wir gemeinsam eine richtig starke Community aufbauen können.
        </p>
      </header>

      <section class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(5,10,35,0.45)] backdrop-blur-2xl sm:p-8">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-2">
            <p class="text-lg font-semibold text-white">E-Mail abmelden</p>
            <p class="text-sm text-white/70">Wir entfernen deine Adresse aus der Warteliste und den Produktupdates.</p>
          </div>
          <div v-if="status === 'success'" class="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100">
            <v-icon icon="mdi-check" size="18" class="text-emerald-200" /> Erfolgreich abgemeldet
          </div>
          <div v-else-if="status === 'error'" class="inline-flex items-center gap-2 rounded-full border border-rose-400/50 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100">
            <v-icon icon="mdi-alert" size="18" class="text-rose-200" /> {{ errorMessage || 'Abmeldung fehlgeschlagen' }}
          </div>
        </div>

        <form class="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]" @submit.prevent="handleSubmit" novalidate>
          <label class="space-y-2 sm:col-span-1">
            <span class="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">E-Mail-Adresse</span>
            <input
              v-model.trim="email"
              type="email"
              required
              placeholder="dein.name@email.de"
              class="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-400 focus:outline-none focus-visible:ring-0"
            />
          </label>

          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/70 bg-cyan-400/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-50 transition hover:border-cyan-300 hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="status === 'loading'"
          >
            <v-icon v-if="status === 'loading'" icon="mdi-loading" size="18" class="animate-spin text-cyan-100" />
            <span>{{ status === 'success' ? 'Erledigt' : 'Abmelden' }}</span>
          </button>
        </form>

        <p class="mt-4 text-xs text-white/60">
          Wir schicken keine weiteren Mails an diese Adresse, sobald du dich abgemeldet hast.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const email = ref<string>((route.query.email as string) || '')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMessage = ref('')

useHead({
  title: 'Newsletter abmelden · OpenSquawk',
  meta: [
    { name: 'description', content: 'Entferne deine E-Mail aus der Warteliste und den Update-Benachrichtigungen von OpenSquawk.' },
  ],
})

async function handleSubmit() {
  if (!email.value) {
    status.value = 'error'
    errorMessage.value = 'Bitte gib deine E-Mail-Adresse an.'
    return
  }

  status.value = 'loading'
  errorMessage.value = ''

  try {
    await $fetch('/api/service/updates', {
      method: 'DELETE',
      body: { email: email.value },
    })
    status.value = 'success'
  } catch (error: unknown) {
    status.value = 'error'
    if (error && typeof error === 'object' && 'statusMessage' in (error as Record<string, unknown>)) {
      errorMessage.value = (error as Record<string, string>).statusMessage || 'Abmeldung fehlgeschlagen.'
    } else {
      errorMessage.value = 'Abmeldung fehlgeschlagen.'
    }
  }
}
</script>
