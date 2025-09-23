<template>
  <div class="relative min-h-screen bg-[#0B1020] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,187,215,0.12),transparent_55%)]"/>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.18),transparent_65%)]"/>

    <div class="relative mx-auto w-full max-w-6xl px-6 py-16 lg:px-12">
      <header class="text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.45em] text-[#16BBD7]">OpenSquawk Bridge</p>
        <h1 class="mt-4 text-3xl font-semibold sm:text-4xl">Deine Verbindung zwischen Simulator und OpenSquawk</h1>
        <p class="mx-auto mt-4 max-w-3xl text-sm text-white/70">
          Die OpenSquawk Bridge streamt Ereignisse aus deinem Simulator direkt zu unserem Netzwerk. Installiere die passende
          Version für deine Plattform, starte die App und verknüpfe sie in wenigen Klicks mit deinem Account.
        </p>
      </header>

      <div class="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section class="space-y-6">
          <div class="rounded-3xl border border-white/10 bg-[#111832]/80 p-8 shadow-[0_30px_80px_rgba(5,10,30,0.55)] backdrop-blur">
            <h2 class="text-xl font-semibold">Download-Zentrale</h2>
            <p class="mt-2 text-sm text-white/70">
              Wähle die Version deiner Bridge. Neue Simulatoren werden automatisch nachgereicht, sobald Builds verfügbar sind.
            </p>

            <div class="mt-6 grid gap-5 md:grid-cols-2">
              <article
                v-for="item in downloads"
                :key="item.id"
                class="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-[#0B132A]/80 p-6 transition hover:border-white/20 hover:shadow-[0_25px_60px_rgba(12,18,40,0.5)]"
              >
                <div class="space-y-3">
                  <span
                    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.35em]"
                    :class="item.available ? 'bg-[#16BBD7]/20 text-[#16BBD7]' : 'bg-white/10 text-white/60'"
                  >
                    {{ item.badge }}
                  </span>
                  <h3 class="text-lg font-semibold">{{ item.title }}</h3>
                  <p class="text-sm text-white/65">{{ item.description }}</p>
                </div>

                <div class="mt-6">
                  <a
                    v-if="item.available"
                    :href="item.href"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16BBD7] px-4 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#13a7c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72d9ea]"
                  >
                    <span aria-hidden="true">⇩</span>
                    Download starten
                  </a>
                  <button
                    v-else
                    type="button"
                    disabled
                    class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#292D3B] px-4 py-3 text-sm font-semibold text-white/70 opacity-80"
                  >
                    <span aria-hidden="true">⏳</span>
                    Coming soon
                  </button>
                </div>
              </article>
            </div>
          </div>

          <div class="rounded-3xl border border-white/10 bg-[#111832]/70 p-8 shadow-[0_20px_60px_rgba(4,8,24,0.45)] backdrop-blur">
            <h2 class="text-xl font-semibold">So funktioniert die Verknüpfung</h2>
            <ol class="mt-6 space-y-4 text-sm text-white/70">
              <li class="flex items-start gap-4">
                <span class="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#16BBD7]/20 text-[#16BBD7]">1</span>
                <span>Bridge herunterladen, installieren und starten. Die App erzeugt automatisch deinen Token.</span>
              </li>
              <li class="flex items-start gap-4">
                <span class="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#16BBD7]/20 text-[#16BBD7]">2</span>
                <span>Folge dem angezeigten Link <code class="rounded bg-[#0B132A]/80 px-2 py-1 text-xs">opensquawk.de/bridge/connect</code>
                  – der Token wird beim Öffnen automatisch übergeben.</span>
              </li>
              <li class="flex items-start gap-4">
                <span class="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#16BBD7]/20 text-[#16BBD7]">3</span>
                <span>Melde dich mit deinem OpenSquawk Account an, bestätige die Verknüpfung und kehre zur App zurück.</span>
              </li>
            </ol>

            <div class="mt-6 rounded-2xl border border-white/10 bg-[#0B132A]/70 px-5 py-4 text-sm text-white/70">
              <p class="font-semibold text-white">Hinweis</p>
              <p class="mt-1 text-white/65">
                Die Bridge zeigt dir jederzeit an, ob der Simulator erkannt wurde und ob ein Flug aktiv ist. Alle Statusmeldungen
                werden alle zehn Sekunden an OpenSquawk übertragen.
              </p>
            </div>
          </div>
        </section>

        <aside class="space-y-6">
          <div class="rounded-3xl border border-white/10 bg-[#111832]/80 p-8 shadow-[0_30px_80px_rgba(4,8,24,0.55)] backdrop-blur">
            <h2 class="text-xl font-semibold">Systemvoraussetzungen</h2>
            <ul class="mt-4 space-y-3 text-sm text-white/70">
              <li>Windows 10/11 (64-bit)</li>
              <li>.NET 8 Desktop Runtime</li>
              <li>Aktive OpenSquawk Mitgliedschaft</li>
              <li>Internetverbindung (mind. 5 Mbit/s)</li>
            </ul>
          </div>

          <div class="rounded-3xl border border-white/10 bg-[#111832]/70 p-8 shadow-[0_20px_60px_rgba(4,8,24,0.45)] backdrop-blur">
            <h2 class="text-xl font-semibold">Support</h2>
            <p class="mt-3 text-sm text-white/70">
              Fragen oder Feedback? Unser Team hilft dir gerne weiter. Schreibe uns jederzeit an
              <a href="mailto:support@opensquawk.de" class="text-[#16BBD7] underline decoration-dotted underline-offset-4">support@opensquawk.de</a>.
            </p>

            <div class="mt-6 rounded-2xl border border-[#16BBD7]/30 bg-[#16BBD7]/10 px-5 py-4 text-sm text-white/75">
              <p class="font-semibold text-[#16BBD7]">Pro Tipp</p>
              <p class="mt-1">
                Lass die Bridge App im Hintergrund laufen – sie synchronisiert automatisch, sobald dein Simulator startet und ein
                Flug aktiv ist.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

useHead({ title: 'Bridge · OpenSquawk' })

const downloads = [
  {
    id: 'msfs2020',
    title: 'Microsoft Flight Simulator 2020',
    description: 'Stabile Bridge-Version für den MSFS 2020 mit automatischer Token-Verknüpfung und Status-Updates.',
    badge: 'Verfügbar',
    available: true,
    href: 'https://github.com/itsrubberduck/OpenSquawk-MSFS-Bridge/',
  },
  {
    id: 'msfs2024',
    title: 'Microsoft Flight Simulator 2024',
    description: 'Die neue Generation des MSFS wird aktuell angebunden. Release der Bridge folgt in Kürze.',
    badge: 'In Arbeit',
    available: false,
    href: '#',
  },
  {
    id: 'xplane',
    title: 'X-Plane 12',
    description: 'Gemeinsame Bridge-Architektur – X-Plane Support ist geplant, sobald die MSFS-Versionen stabil laufen.',
    badge: 'In Planung',
    available: false,
    href: '#',
  },
]
</script>

<style scoped>
code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
</style>

