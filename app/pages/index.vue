<template>
  <div class="bg-[#080d1d] text-white antialiased selection:bg-cyan-400/30">
    <header
        class="fixed left-0 right-0 top-0 z-50 bg-[#080d1d]/80 backdrop-blur border-b border-white/10"
        data-aos="fade-down"
    >
      <nav class="container-outer flex items-center justify-between py-3">
        <NuxtLink to="#overview" class="flex items-center gap-2 font-semibold tracking-tight">
          <v-icon icon="mdi-radar" size="28" class="text-cyan-400"/>
          <span class="text-white">OpenSquawk</span>
        </NuxtLink>
        <div class="hidden lg:flex items-center gap-6 text-sm">
          <NuxtLink
              v-for="item in navLinks"
              :key="item.to"
              :to="item.to"
              class="hover:text-cyan-300"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <NuxtLink
              :to="GITHUB_URL"
              external
              target="_blank"
              rel="noopener"
              class="btn btn-ghost btn-compact hidden sm:inline-flex"
          >
            <v-icon icon="mdi-github"/>
            GitHub
          </NuxtLink>
          <button
              type="button"
              class="mobile-toggle lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d1d]"
              :aria-expanded="isMobileNavOpen ? 'true' : 'false'"
              aria-controls="mobile-navigation"
              aria-label="Navigation umschalten"
              @click="toggleMobileNav"
          >
            <span class="sr-only">Navigation umschalten</span>
            <span class="hamburger" :class="{ 'is-open': isMobileNavOpen }">
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
            </span>
          </button>
        </div>
      </nav>
      <Transition name="mobile-nav">
        <div
            v-if="isMobileNavOpen"
            id="mobile-navigation"
            class="lg:hidden border-t border-white/10 bg-[#080d1d]/95 backdrop-blur"
        >
          <div class="container-outer py-4 space-y-4">
            <nav class="grid gap-2 text-sm">
              <NuxtLink
                  v-for="item in mobileNavLinks"
                  :key="`mobile-${item.to}`"
                  :to="item.to"
                  :external="item.external"
                  :target="item.external ? '_blank' : undefined"
                  :rel="item.external ? 'noopener' : undefined"
                  class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 transition hover:bg-white/10"
                  @click="closeMobileNav"
              >
                <span class="flex items-center gap-3">
                  <v-icon v-if="item.icon" :icon="item.icon" size="18" class="text-white/60"/>
                  <span>{{ item.label }}</span>
                </span>
                <v-icon icon="mdi-chevron-right" size="18" class="text-white/60"/>
              </NuxtLink>
            </nav>
          </div>
        </div>
      </Transition>
    </header>

    <main>
      <section id="overview" class="gradient-hero relative overflow-hidden">
        <div class="hero-overlay absolute inset-0 pointer-events-none" aria-hidden="true"/>
        <div class="container-outer relative z-10 pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pb-24">
          <div class="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,420px)] lg:items-center">
            <div class="space-y-6" data-aos="fade-up">
              <span class="chip">Community Early Access</span>
              <h1 class="text-3xl sm:text-5xl md:text-6xl font-semibold leading-tight">
                Early-Access, Mitsprache, Credits – konkret &amp; messbar.
              </h1>
              <p class="text-white/80 text-base sm:text-lg max-w-2xl">
                Kickstart das OpenSquawk Early-Access-Programm mit klaren Anreizen, transparenten Slots und sichtbarer Anerkennung.
                Diese Seite zeigt den vollständigen GUI-Prototyp – alle Zahlen sind Mock-Daten.
              </p>
              <ul class="grid gap-2 text-sm sm:text-base text-white/70 sm:grid-cols-2">
                <li v-for="highlight in heroHighlights" :key="highlight" class="flex items-start gap-2">
                  <v-icon icon="mdi-check-decagram" size="18" class="mt-[3px] text-cyan-300"/>
                  <span>{{ highlight }}</span>
                </li>
              </ul>
              <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                <NuxtLink to="#early-access" class="btn btn-primary text-base">
                  <v-icon icon="mdi-radar" size="20"/>
                  Waves &amp; Kriterien
                </NuxtLink>
                <NuxtLink to="#rewards" class="btn btn-ghost text-base">
                  <v-icon icon="mdi-crown" size="20"/>
                  Rewards ansehen
                </NuxtLink>
              </div>
              <p class="text-xs text-white/50">
                Hinweis: Alle Module sind klickbare Mockups. Logik &amp; Backend folgen, sobald das Konzept freigegeben ist.
              </p>
            </div>
            <div class="card hero-panel space-y-5" data-aos="fade-left" data-aos-delay="120">
              <div class="space-y-2">
                <div class="chip text-xs uppercase tracking-[0.3em]">Dashboard-Vorschau</div>
                <h3 class="text-2xl font-semibold">Community Pulse (Mock)</h3>
                <p class="text-sm text-white/70">
                  Visualisiert die späteren Live-Daten: verfügbare Slots, aktive Beiträge &amp; Credits.
                </p>
              </div>
              <div class="stat-grid">
                <div v-for="stat in heroStats" :key="stat.label" class="stat-card">
                  <div class="text-xs uppercase tracking-[0.3em] text-white/50">{{ stat.label }}</div>
                  <div class="text-2xl font-semibold text-cyan-300">{{ stat.value }}</div>
                  <p class="text-xs text-white/60">{{ stat.description }}</p>
                </div>
              </div>
              <div class="divider"/>
              <div class="space-y-3">
                <h4 class="text-lg font-semibold">Warum jetzt mitmachen?</h4>
                <ul class="space-y-2 text-sm text-white/70">
                  <li v-for="perk in earlyAccessPerks" :key="perk" class="flex items-start gap-2">
                    <v-icon icon="mdi-star-circle" size="18" class="mt-[3px] text-cyan-300"/>
                    <span>{{ perk }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="early-access" class="py-16 sm:py-20 md:py-24 bg-[#0b1020] border-t border-white/10">
        <div class="container-outer space-y-12">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="text-3xl md:text-4xl font-semibold">Early-Access-Wellen &amp; Slot-Kriterien</h2>
            <p class="text-white/80 text-base sm:text-lg">
              Jede Welle adressiert eine andere Zielgruppe. Slots werden transparent nach Beiträgen vergeben – Motivation statt Zufall.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3 md:gap-6">
            <div v-for="wave in earlyAccessWaves" :key="wave.title" class="card h-full flex flex-col gap-4" data-aos="fade-up">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="chip text-xs uppercase tracking-[0.3em]">{{ wave.tag }}</div>
                  <h3 class="mt-3 text-xl font-semibold">{{ wave.title }}</h3>
                </div>
                <v-icon :icon="wave.icon" size="28" class="text-cyan-300"/>
              </div>
              <p class="text-sm text-white/70">{{ wave.description }}</p>
              <div class="glass rounded-xl p-3">
                <div class="text-xs uppercase tracking-[0.3em] text-white/50">Fokus</div>
                <div class="mt-1 text-sm text-white/80">{{ wave.focus }}</div>
              </div>
              <ul class="space-y-2 text-sm text-white/70">
                <li v-for="item in wave.highlights" :key="item" class="flex items-start gap-2">
                  <v-icon icon="mdi-circle-small" size="22" class="text-cyan-300"/>
                  <span>{{ item }}</span>
                </li>
              </ul>
              <div class="mt-auto text-xs text-white/40">Mock Slots: {{ wave.mockSlots }}</div>
            </div>
          </div>
          <div class="card space-y-6" data-aos="fade-up" data-aos-delay="60">
            <div class="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center">
              <div class="space-y-3">
                <h3 class="text-2xl font-semibold">Wie sichere ich mir einen Platz?</h3>
                <p class="text-sm text-white/70">
                  Slots werden manuell nach Review vergeben. Eines der folgenden Kriterien reicht aus – Kombinationen beschleunigen den Zugang.
                </p>
                <div class="points-grid">
                  <div v-for="path in eligibilityPaths" :key="path.label" class="points-card">
                    <div class="points-value">{{ path.badge }}</div>
                    <div class="points-body">
                      <h4 class="text-lg font-semibold text-white">{{ path.label }}</h4>
                      <p class="text-sm text-white/70">{{ path.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="glass rounded-2xl p-5 space-y-4">
                <div>
                  <div class="chip text-xs uppercase tracking-[0.3em]">Vorteile</div>
                  <h4 class="mt-3 text-lg font-semibold">Für alle Wellen gültig</h4>
                </div>
                <ul class="space-y-2 text-sm text-white/70">
                  <li v-for="benefit in sharedBenefits" :key="benefit" class="flex items-start gap-2">
                    <v-icon icon="mdi-shield-check" size="18" class="mt-[3px] text-cyan-300"/>
                    <span>{{ benefit }}</span>
                  </li>
                </ul>
                <p class="text-xs text-white/50">Feature-Flags &amp; Voting-Power werden im finalen Build an das Punktesystem gekoppelt.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="co-creation" class="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#0b1020] to-[#0a0f1c] border-y border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="text-3xl md:text-4xl font-semibold">Mitgestaltung &amp; Co-Creation</h2>
            <p class="text-white/80 text-base sm:text-lg">
              Mitsprache ist planbar: dedizierte Formate für Feature-Entscheidungen, Content-Produktion und RFCs.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3 md:gap-6">
            <div v-for="stream in coCreationStreams" :key="stream.title" class="card flex flex-col gap-4" data-aos="fade-up">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="chip text-xs uppercase tracking-[0.3em]">{{ stream.badge }}</div>
                  <h3 class="mt-3 text-xl font-semibold">{{ stream.title }}</h3>
                </div>
                <v-icon :icon="stream.icon" size="26" class="text-cyan-300"/>
              </div>
              <p class="text-sm text-white/70">{{ stream.description }}</p>
              <ul class="space-y-2 text-sm text-white/70">
                <li v-for="detail in stream.details" :key="detail" class="flex items-start gap-2">
                  <v-icon icon="mdi-checkbox-blank-circle" size="18" class="mt-[2px] text-cyan-300"/>
                  <span>{{ detail }}</span>
                </li>
              </ul>
              <p class="mt-auto text-xs text-white/40">{{ stream.meta }}</p>
            </div>
          </div>
        </div>
      </section>
      <section id="credits" class="py-16 sm:py-20 md:py-24 bg-[#0a0f1c]">
        <div class="container-outer space-y-10">
          <div class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
            <div class="space-y-5" data-aos="fade-right">
              <h2 class="text-3xl md:text-4xl font-semibold">Credits, die sichtbar bleiben</h2>
              <p class="text-white/80 text-base sm:text-lg">
                Jeder Beitrag hinterlässt Spuren – im Produkt, auf der Website und in der Community. Langfristige Anerkennung ist Teil des Systems.
              </p>
              <div class="glass rounded-2xl p-5 space-y-4">
                <div class="flex items-center gap-3">
                  <v-icon icon="mdi-trophy" size="26" class="text-cyan-300"/>
                  <h3 class="text-xl font-semibold">Hall of Fame</h3>
                </div>
                <p class="text-sm text-white/70">
                  In-App („About &gt; Contributors“) und auf der Website, inklusive Callsign &amp; Link. Filterbar nach Welle, Badge &amp; Aktivität.
                </p>
                <div class="text-xs text-white/40">Mock UI – Daten folgen nach Launch.</div>
              </div>
            </div>
            <div class="grid gap-4 md:grid-cols-2" data-aos="fade-left">
              <div v-for="credit in creditStreams" :key="credit.title" class="card flex flex-col gap-3">
                <div class="flex items-center gap-3">
                  <v-icon :icon="credit.icon" size="24" class="text-cyan-300"/>
                  <h3 class="text-lg font-semibold">{{ credit.title }}</h3>
                </div>
                <p class="text-sm text-white/70">{{ credit.description }}</p>
                <ul v-if="credit.points?.length" class="space-y-2 text-xs text-white/60">
                  <li v-for="point in credit.points" :key="point" class="flex items-start gap-2">
                    <v-icon icon="mdi-menu-right" size="18" class="text-cyan-400/80"/>
                    <span>{{ point }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="rewards" class="py-16 sm:py-20 md:py-24 bg-[#080d1d] border-t border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="text-3xl md:text-4xl font-semibold">Punkte sammeln, Rewards freischalten</h2>
            <p class="text-white/80 text-base sm:text-lg">
              Einfache Skala, große Wirkung. Beiträge werden bewertet, freigeschaltet und bleiben nachvollziehbar.
            </p>
          </div>
          <div class="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-stretch">
            <div class="card space-y-5" data-aos="fade-right">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-2xl font-semibold">Aktionen → Punkte</h3>
                <div class="chip text-xs uppercase tracking-[0.3em]">Review nötig</div>
              </div>
              <div class="points-grid">
                <div v-for="action in pointActions" :key="action.label" class="points-row">
                  <div class="points-badge">+{{ action.points }} P</div>
                  <div class="points-info">
                    <h4 class="text-lg font-semibold text-white">{{ action.label }}</h4>
                    <p class="text-sm text-white/70">{{ action.description }}</p>
                  </div>
                </div>
              </div>
              <p class="text-xs text-white/50">
                Punkte werden täglich geprüft. Label-Status entscheidet, ob sie zählen.
              </p>
            </div>
            <div class="card space-y-5" data-aos="fade-left">
              <div>
                <h3 class="text-2xl font-semibold">Meilensteine</h3>
                <p class="text-sm text-white/70">Rewards stapeln sich – jede Stufe bringt dauerhafte Vorteile.</p>
              </div>
              <div class="timeline">
                <div v-for="milestone in milestoneRewards" :key="milestone.points" class="timeline-item">
                  <div class="timeline-dot">
                    <span class="text-sm font-semibold">{{ milestone.points }}P</span>
                  </div>
                  <div class="timeline-body">
                    <h4 class="text-lg font-semibold text-white">{{ milestone.title }}</h4>
                    <p class="text-sm text-white/70">{{ milestone.description }}</p>
                  </div>
                </div>
              </div>
              <p class="text-xs text-white/50">Limit: max. 1 Punkte-Reward pro Tag/Person → Anti-Farming.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="quality" class="py-16 sm:py-20 md:py-24 bg-[#080d1d] border-t border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="text-3xl md:text-4xl font-semibold">Qualität &amp; Anti-Abuse</h2>
            <p class="text-white/80 text-base sm:text-lg">
              Klare Templates und Labels sorgen für verlässliches Feedback, ohne das System ausnutzbar zu machen.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="card space-y-4" data-aos="fade-right">
              <h3 class="text-xl font-semibold">Bug-Rubrik</h3>
              <ul class="space-y-2 text-sm text-white/70">
                <li v-for="item in bugTemplate" :key="item" class="flex items-start gap-2">
                  <v-icon icon="mdi-clipboard-text" size="18" class="mt-[3px] text-cyan-300"/>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
            <div class="card space-y-4" data-aos="fade-left">
              <h3 class="text-xl font-semibold">Review-Prozess</h3>
              <ul class="space-y-2 text-sm text-white/70">
                <li v-for="rule in qualityChecklist" :key="rule" class="flex items-start gap-2">
                  <v-icon icon="mdi-shield-star" size="18" class="mt-[3px] text-cyan-300"/>
                  <span>{{ rule }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="tooling" class="py-16 sm:py-20 md:py-24 bg-[#0a0f1c] border-y border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="text-3xl md:text-4xl font-semibold">Schnelle Umsetzung</h2>
            <p class="text-white/80 text-base sm:text-lg">
              Tooling ist leichtgewichtig und kann sofort umgesetzt werden – perfekt für eine erste Iteration.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3 md:gap-6">
            <div v-for="tool in toolingStack" :key="tool.title" class="card flex flex-col gap-3" data-aos="fade-up">
              <div class="flex items-center gap-3">
                <v-icon :icon="tool.icon" size="24" class="text-cyan-300"/>
                <h3 class="text-lg font-semibold">{{ tool.title }}</h3>
              </div>
              <p class="text-sm text-white/70">{{ tool.description }}</p>
              <ul v-if="tool.items?.length" class="space-y-2 text-xs text-white/60">
                <li v-for="entry in tool.items" :key="entry" class="flex items-start gap-2">
                  <v-icon icon="mdi-menu-right" size="18" class="text-cyan-400/80"/>
                  <span>{{ entry }}</span>
                </li>
              </ul>
            </div>
          </div>
          <div class="glass rounded-2xl p-6 space-y-3" data-aos="fade-up" data-aos-delay="80">
            <div class="flex items-center gap-3 text-sm text-white/70">
              <v-icon icon="mdi-podium-gold" size="20" class="text-cyan-300"/>
              Leaderboard aktualisiert sich wöchentlich automatisch im Discord-Kanal <span class="text-white">#contributors</span>.
            </div>
          </div>
        </div>
      </section>

      <section id="snippets" class="py-16 sm:py-20 md:py-24 bg-[#080d1d] border-t border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="text-3xl md:text-4xl font-semibold">Snippets zum Copy-Pasten</h2>
            <p class="text-white/80 text-base sm:text-lg">
              Kommunikations-Templates für Discord, Release Notes und GitHub – sofort einsatzbereit.
            </p>
          </div>
          <div class="grid gap-4 lg:grid-cols-3">
            <div v-for="snippet in snippetBlocks" :key="snippet.title" class="card snippet-card" data-aos="fade-up">
              <div class="space-y-2">
                <div class="chip text-xs uppercase tracking-[0.3em]">{{ snippet.badge }}</div>
                <h3 class="text-lg font-semibold">{{ snippet.title }}</h3>
                <p class="text-sm text-white/70">{{ snippet.description }}</p>
              </div>
              <pre class="snippet-content" v-text="snippet.content"></pre>
            </div>
          </div>
        </div>
      </section>

      <section id="extras" class="py-16 sm:py-20 md:py-24 bg-[#0a0f1c]">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="text-3xl md:text-4xl font-semibold">Extras, die ziehen</h2>
            <p class="text-white/80 text-base sm:text-lg">
              Regelmäßige Community-Highlights, die Aufmerksamkeit schaffen und zusätzliche Punkte verteilen.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3 md:gap-6">
            <div v-for="extra in extras" :key="extra.title" class="card flex flex-col gap-3" data-aos="fade-up">
              <div class="flex items-center gap-3">
                <v-icon :icon="extra.icon" size="24" class="text-cyan-300"/>
                <h3 class="text-lg font-semibold">{{ extra.title }}</h3>
              </div>
              <p class="text-sm text-white/70">{{ extra.description }}</p>
              <ul v-if="extra.points?.length" class="space-y-2 text-xs text-white/60">
                <li v-for="detail in extra.points" :key="detail" class="flex items-start gap-2">
                  <v-icon icon="mdi-menu-right" size="18" class="text-cyan-400/80"/>
                  <span>{{ detail }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" class="py-16 sm:py-20 md:py-24 bg-[#050812] border-t border-white/10">
        <div class="container-outer">
          <div class="card bg-white/5 border border-white/10 p-6 sm:p-8 md:p-10 space-y-6 text-center" data-aos="fade-up">
            <div class="flex flex-col items-center gap-3">
              <v-icon icon="mdi-airplane-takeoff" size="32" class="text-cyan-300"/>
              <h2 class="text-3xl font-semibold">Bereit zum Abheben?</h2>
            </div>
            <p class="text-sm sm:text-base text-white/70 max-w-2xl mx-auto">
              Dieses Mockup bündelt das komplette Early-Access-Programm – von Slots über Credits bis Tooling.
              Gib uns grünes Licht und wir verwandeln das Konzept in eine produktive Experience.
            </p>
            <div class="flex flex-col sm:flex-row sm:justify-center gap-3">
              <NuxtLink to="/kontakt" class="btn btn-primary text-base">
                <v-icon icon="mdi-chat-processing" size="20"/>
                Feedback dalassen
              </NuxtLink>
              <NuxtLink to="#overview" class="btn btn-ghost text-base">
                <v-icon icon="mdi-arrow-up" size="20"/>
                Nach oben
              </NuxtLink>
            </div>
            <p class="text-xs text-white/40">
              Nächste Schritte: Issue-Templates live schalten, Discord-Rollen synchronisieren, Leaderboard-Feed anbinden.
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useHead, useRoute} from '#imports'

const GITHUB_URL = 'https://github.com/FaktorxMensch/OpenSquawk'

interface NavLink {
  label: string
  to: string
  external?: boolean
  icon?: string
}

const navLinks: NavLink[] = [
  {label: 'Overview', to: '#overview'},
  {label: 'Early Access', to: '#early-access'},
  {label: 'Co-Creation', to: '#co-creation'},
  {label: 'Credits', to: '#credits'},
  {label: 'Rewards', to: '#rewards'},
  {label: 'Qualität', to: '#quality'},
  {label: 'Tooling', to: '#tooling'},
  {label: 'Extras', to: '#extras'},
  {label: 'Snippets', to: '#snippets'},
]

const mobileNavLinks = computed<NavLink[]>(() => [
  ...navLinks,
  {label: 'GitHub', to: GITHUB_URL, external: true, icon: 'mdi-github'},
])

const isMobileNavOpen = ref(false)
const toggleMobileNav = () => {
  isMobileNavOpen.value = !isMobileNavOpen.value
}
const closeMobileNav = () => {
  isMobileNavOpen.value = false
}

const route = useRoute()
watch(
    () => route.fullPath,
    () => {
      closeMobileNav()
    },
)

if (import.meta.client) {
  watch(isMobileNavOpen, (open) => {
    document.body.classList.toggle('overflow-hidden', open)
  })

  onBeforeUnmount(() => {
    document.body.classList.remove('overflow-hidden')
  })
}

const heroHighlights = [
  'Alpha-, Beta- und Preview-Wellen mit Fokusgruppen',
  'Slots an Beiträge gebunden: Bugs, Videos, Referrals',
  'Voting-Power & Feature-Flags über Punktekonto',
  'Credits sichtbar in Hall of Fame & Release Notes',
]

const heroStats = [
  {label: 'Alpha-Spots vergeben', value: '24/60', description: 'Mockdaten – final automatisiert'},
  {label: 'Validierte Bugreports', value: '38', description: 'Status: Label „valid“'},
  {label: 'Council-Stimmen (Monat)', value: '128', description: 'Scorecard-Auswertung'},
  {label: 'Referral-Aktivierungen', value: '17', description: 'Nur nach kompletter Session'},
]

const earlyAccessPerks = [
  'Früher Zugang zu Builds & Feature-Flags',
  'Exklusiver Discord-Channel je Welle',
  'Mehr Voting-Power für Roadmap-Entscheidungen',
  'Sichtbare Credits & Badges für jeden Beitrag',
]

const earlyAccessWaves = [
  {
    title: 'Alpha · Core-Tester',
    tag: 'Wave · Alpha',
    icon: 'mdi-flask',
    description: 'Hands-on mit den rohesten Builds. Fokus auf Stabilität, Funk-Parser und System-Resilience.',
    focus: 'Stabilität · Edge-Cases · Crash-Prevention',
    highlights: [
      '2-wöchige Testzyklen mit Debrief & Fix-Priorisierung',
      'Direkter Draht zu Dev & Infra-Team',
      'Höchstes Voting-Gewicht für kritische Tickets',
    ],
    mockSlots: '24/60 vergeben',
  },
  {
    title: 'Beta · Feature-Tester',
    tag: 'Wave · Beta',
    icon: 'mdi-beaker-check',
    description: 'Neue Features validieren, UX-Feedback liefern und Trainingsmodule prüfen.',
    focus: 'Feature-Polish · Workflows · UX-Feedback',
    highlights: [
      'Feature-Flags pro Modul aktivierbar',
      'Feedback-Canvas für schnelle Iterationen',
      'Gemeinsame Playback-Sessions (≥ 1×/Monat)',
    ],
    mockSlots: '40/80 vergeben',
  },
  {
    title: 'Preview · Creators & Streamer',
    tag: 'Wave · Preview',
    icon: 'mdi-video-wireless',
    description: 'Storytelling & Sichtbarkeit. Fokus auf Content, Tutorials und Streaming-Events.',
    focus: 'Content-Kits · Early Briefings · Audience-Feedback',
    highlights: [
      'Embargo-Kalender & Marketing-Support',
      'Coaching-Slots für On-Air-Sessions',
      'Eigenes Media-Pack & Referral-Tracking',
    ],
    mockSlots: '12/25 vergeben',
  },
]

const eligibilityPaths = [
  {badge: 'Option 1', label: '3 qualifizierte Bugreports', description: 'Mit Titel, Repro-Steps, Erwartet/Erhalten sowie Log/Clip.'},
  {badge: 'Option 2', label: '1 Testsession-Video (≥10 min)', description: 'Öffentlicher oder privater Link plus kurze Zusammenfassung.'},
  {badge: 'Option 3', label: '3 referierte Nutzer', description: 'Zählt sobald 1 Session abgeschlossen ist (Referral aktiv).'},
]

const sharedBenefits = [
  'Früher Build-Zugang & Feature-Flags',
  'Exklusiver Discord-Channel je Welle',
  'Voting-Power-Boost im Roadmap-Tool',
  'Hall-of-Fame-Eintrag & Badge-Award',
]

const coCreationStreams = [
  {
    title: 'Feature Council',
    badge: 'Monthly Council',
    icon: 'mdi-account-group',
    description: 'Monatliches Review-Meeting (45 min) mit maximal 12 Sitzen.',
    details: [
      'Specs vorab im Miro/Figma-Snapshot',
      'Scorecard-Voting (Impact · Effort · Wow)',
      'Follow-up Tickets direkt im Backlog',
    ],
    meta: 'Meets 1×/Monat · Slots an Punkte gebunden',
  },
  {
    title: 'Content-Guilds',
    badge: 'Content Ops',
    icon: 'mdi-book-multiple',
    description: 'Spezialisierte Teams für Phraseologie, Trainingskarten & Airport-Profile.',
    details: [
      'VFR/IFR Phraseologie-Sets als Shared Library',
      'Trainingskarten inkl. Kneeboard-Export',
      'Airport-Profile mit Community-Notizen',
    ],
    meta: 'Async via Notion & Discord · Review 1×/Woche',
  },
  {
    title: 'RFC-Runden',
    badge: '72h Review',
    icon: 'mdi-file-document-edit',
    description: '1-Pager-Vorschläge mit Community-Review und klarer Entscheidung.',
    details: [
      'Submission via Template (Problem · Impact · Lösung)',
      '72h öffentliches Feedback & Fragen',
      'Umsetzungsslot nach Approval reserviert',
    ],
    meta: 'Rolling Intake · Ergebnisse transparent geloggt',
  },
]

const creditStreams = [
  {
    title: 'Release-Notes-Shoutouts',
    icon: 'mdi-bullhorn',
    description: '„Danke an {Callsign} für Bug #123“ – sichtbarer Dank im Changelog.',
    points: ['Automatisch aus Label „credit:release“', 'Verlinkung auf Issue/PR & Beitrag'],
  },
  {
    title: 'In-App-Badges',
    icon: 'mdi-shield-star',
    description: 'Badges wie „Early Bird“, „Tower Mentor“, „Bug Hunter“, „Route Architect“ – dauerhaft sichtbar.',
    points: ['Vergabe nach Meilensteinen', 'Discord-Rollen synchronisieren das Badge-Set'],
  },
  {
    title: 'Kosmetik & Audio',
    icon: 'mdi-headset',
    description: 'Personalisierte Kneeboard-Skins & ATC-Stimmen (Top-5 Contributors).',
    points: ['Skin-Editor Preview & Mockups', 'Voice-Tag in App & Release Notes'],
  },
  {
    title: 'Invite-Codes & Referrals',
    icon: 'mdi-link-variant',
    description: 'Personalisierte Referral-Links mit Tracking & Bonuspunkten.',
    points: ['Referral zählt nach vollständiger Session', 'Leaderboard zeigt Aktivierungen'],
  },
]

const pointActions = [
  {label: 'Bug (reproduzierbar, Log/Clip)', points: 3, description: 'Mit Build-Angabe, klaren Steps & Pflichtanhang.'},
  {label: 'UX-Verbesserung mit Mock/GIF', points: 2, description: 'Kurzbeschreibung, Visual und erwartetes Ergebnis.'},
  {label: 'Testflight-Video (≥10 min)', points: 4, description: 'Playback-Link plus Fokus-Report.'},
  {label: 'Content-Beitrag (Karten/Checkliste)', points: 4, description: 'Guild-Review & Upload im Repository.'},
  {label: 'Referral (aktiv, 1 Session abgeschlossen)', points: 2, description: 'Automatische Gutschrift nach Session-Abschluss.'},
]

const milestoneRewards = [
  {points: 5, title: 'Beta-Zugang + Badge „Scout“', description: 'Direkter Zugang zur Beta-Welle & Badge in App/Discord.'},
  {points: 10, title: 'Feature-Council-Vote + Release-Credit', description: 'Stimme im Council & Namensnennung im nächsten Release.'},
  {points: 20, title: 'Persönliche Kneeboard-Skin + „Contributor“-Rolle', description: 'Custom Skin & permanente Rolle im Discord.'},
  {points: 35, title: 'ATC-Stimme/Callsign-Easter-Egg + „Architect“-Badge', description: 'In-App Voice Tag & Top-Tier Badge.'},
]

const bugTemplate = [
  'Titel mit kurzer Zusammenfassung (z.B. „Audio droppt nach Handoff“)',
  'Repro-Steps (1…2…3…) inklusive erwartetes Ergebnis',
  'Feld „Erwartet/Erhalten“ für klare Abgrenzung',
  'Build/Browser + Logs/Clip als Pflichtanhang',
]

const qualityChecklist = [
  'Labels „valid“, „needs-info“, „duplicate“ entscheiden über Punkte',
  '„needs-info“ pausiert die Vergabe bis Nachbesserung',
  'Referral zählt erst nach einer vollständigen Testsession',
  'Max. 1 Punkte-Reward pro Tag & Person – Farm-Schutz',
]

const toolingStack = [
  {
    title: 'GitHub Issue Template',
    icon: 'mdi-github',
    description: 'Strukturiertes Formular für Bugs & Feedback.',
    items: [
      'Felder: Build/Browser, Schritte, Erwartet/Erhalten, Anhang',
      'Labels: valid · needs-info · duplicate',
      'Automation für Punktevergabe via Actions (Mock)',
    ],
  },
  {
    title: 'Discord Role-Bot',
    icon: 'mdi-discord',
    description: 'Vergibt Rollen & Badges nach Review automatisch.',
    items: ['Rollen: Early Bird, Contributor, Architect', 'Webhook für Leaderboard-Updates'],
  },
  {
    title: 'Feedback-Form & Airtable',
    icon: 'mdi-form-select',
    description: '3 Pflichtfelder + Upload – schnell ausgefüllt, klar strukturiert.',
    items: ['Upload für Logs, Clips oder PNGs', 'Sync nach GitHub/Notion (Mock Flow)'],
  },
]

const snippetBlocks = [
  {
    badge: 'Discord',
    title: 'Discord-Announcement',
    description: 'Teaser für den Early-Access-Start mit klaren Punkten.',
    content: `Wir öffnen *OpenSquawk Early Access*. Hol dir den **Beta-Key** mit 5 Punkten:
– 1 Bug mit Repro (3 P)
– 1 Testvideo ≥10 min (4 P)
– 1 Referral mit abgeschl. Session (2 P)
Punkte = Rewards: Badges, Council-Votes, eigene Kneeboard-Skin.
Mitmachen: Link → Feedback-Form | Regeln → #contribute`,
  },
  {
    badge: 'Release Notes',
    title: 'Release-Notes-Credits',
    description: 'Dank an Contributor:innen direkt im Changelog.',
    content: 'Credits: Danke an **DLH478**, **NAX21**, **MUC\\_ATC** für Bugs #112/#118, IFR-Karten v0.2, Audio-Fix.',
  },
  {
    badge: 'GitHub',
    title: 'Issue-Template (Kurz)',
    description: 'Einfaches Template für valide Bugreports.',
    content: '* **Build/Browser**:\n* **Schritte**: 1)… 2)… 3)…\n* **Erwartet/Erhalten**:\n* **Anhang**: Log/Clip/PNG (Pflicht)',
  },
]

const extras = [
  {
    title: 'Readback-Challenge',
    icon: 'mdi-microphone-variant',
    description: 'Wöchentliche 30-Minuten-Session mit Fokus auf Phraseologie.',
    points: ['Top-3 erhalten +2P Bonus & Shoutout', 'Highlight-Clip im Hall-of-Fame-Feed'],
  },
  {
    title: 'Fix-it Friday',
    icon: 'mdi-wrench-clock',
    description: 'Wir fixen 3 Community-Issues live – perfekt für Streams.',
    points: ['Streamer & Creators werden eingeladen', 'Release-Notes nennen alle Beteiligten'],
  },
  {
    title: 'Your Airport, Our Trainer',
    icon: 'mdi-airplane',
    description: 'Monatliches Voting: Gewinner-Airport erhält dedizierte Trainingskarte + Credits.',
    points: ['Voting via Feature Council & Guilds', 'Airport-Profile landen im Content Hub'],
  },
]

useHead(() => ({
  htmlAttrs: {lang: 'de'},
  title: 'OpenSquawk Early Access – Community Programm Mockup',
  meta: [
    {name: 'description', content: 'GUI-Prototyp für das Early-Access-, Co-Creation- und Credits-Programm von OpenSquawk.'},
    {name: 'theme-color', content: '#0ea5e9'},
    {property: 'og:title', content: 'OpenSquawk Early Access – Community Programm'},
    {property: 'og:description', content: 'Mockup für Wellen, Rewards, Credits und Community-Tooling.'},
    {property: 'og:type', content: 'website'},
    {property: 'og:image', content: 'https://opensquawk.example.com/cover.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: 'OpenSquawk Early Access – Community Programm'},
    {name: 'twitter:description', content: 'GUI-Prototyp für Slots, Punkte & Credits.'},
    {name: 'twitter:image', content: 'https://opensquawk.example.com/cover.png'},
  ],
}))

onMounted(async () => {
  if (typeof window === 'undefined') {
    return
  }
  if (!(window as any).AOS) {
    const [{default: AOS}] = await Promise.all([
      import('aos'),
      import('aos/dist/aos.css'),
    ])
    AOS.init({once: true, duration: 600, easing: 'ease-out'})
  }
})
</script>

<style scoped>
.container-outer {
  @apply mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8;
}

.gradient-hero {
  background: radial-gradient(1200px 600px at 10% -10%, rgba(14, 165, 233, 0.35), transparent),
  radial-gradient(900px 480px at 100% 10%, rgba(59, 130, 246, 0.25), transparent),
  linear-gradient(180deg, #080d1d 0%, #080d1d 60%, #0a0f1c 100%);
}

.gradient-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/img/learn/modules/img6.jpeg') center/cover no-repeat;
  opacity: 0.3;
  pointer-events: none;
  z-index: 0;
}

.hero-overlay {
  background: linear-gradient(90deg, rgba(8, 13, 29, 0.92) 0%, rgba(8, 13, 29, 0.7) 45%, rgba(8, 13, 29, 0.2) 100%);
  z-index: 1;
}

.glass {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition px-4 py-2.5 sm:px-5 sm:py-3;
}

.btn-primary {
  @apply bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,.25)];
}

.btn-ghost {
  @apply bg-white/5 text-white hover:bg-white/10;
}

.btn-compact {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

@media (min-width: 640px) {
  .btn-compact {
    padding: 0.6rem 1rem;
    font-size: 0.875rem;
  }
}

.card {
  @apply rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6;
  backdrop-filter: blur(16px);
}

.hero-panel {
  background: rgba(12, 18, 36, 0.65);
}

.chip {
  @apply inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 text-white px-3 py-1 text-xs;
}

.stat-grid {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.stat-card {
  @apply rounded-2xl border border-white/10 bg-white/5 p-4;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 255, 255, 0.05) 100%);
}

.points-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .points-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

.points-card {
  @apply flex gap-3 items-start rounded-2xl border border-white/10 bg-white/5 p-4;
}

.points-value {
  @apply inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/70;
}

.points-body {
  @apply space-y-1;
}

.points-row {
  @apply flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4;
}

.points-badge {
  @apply inline-flex items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200;
}

.points-info {
  @apply space-y-1;
}

.timeline {
  position: relative;
  display: grid;
  gap: 1.5rem;
  padding-left: 0.5rem;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0.95rem;
  width: 2px;
  background: rgba(255, 255, 255, 0.12);
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 1rem;
  padding-left: 2.5rem;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 0;
  width: 2.1rem;
  height: 2.1rem;
  @apply flex items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-100;
}

.timeline-body {
  @apply space-y-1;
}

.snippet-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.snippet-content {
  @apply rounded-xl border border-white/10 bg-black/60 p-4 text-xs sm:text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed;
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.mobile-toggle {
  @apply inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10;
  width: 44px;
  height: 44px;
}

@media (min-width: 1024px) {
  .mobile-toggle {
    display: none;
  }
}

.hamburger {
  position: relative;
  width: 20px;
  height: 14px;
}

.hamburger-bar {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.9);
  transition: top 0.25s ease, transform 0.25s ease, opacity 0.25s ease;
}

.hamburger-bar:nth-child(1) {
  top: 0;
}

.hamburger-bar:nth-child(2) {
  top: 6px;
}

.hamburger-bar:nth-child(3) {
  top: 12px;
}

.hamburger.is-open .hamburger-bar:nth-child(1) {
  top: 6px;
  transform: rotate(45deg);
}

.hamburger.is-open .hamburger-bar:nth-child(2) {
  opacity: 0;
  transform: translateX(-6px);
}

.hamburger.is-open .hamburger-bar:nth-child(3) {
  top: 6px;
  transform: rotate(-45deg);
}

@media (prefers-reduced-motion: reduce) {
  .hamburger-bar {
    transition: none;
  }
}
</style>
