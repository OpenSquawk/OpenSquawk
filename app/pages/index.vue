<template>
  <div class="bg-[#060a18] text-white antialiased selection:bg-cyan-400/30">
    <!-- NAV -->
    <header class="fixed left-0 right-0 top-0 z-50 bg-[#060a18]/80 backdrop-blur border-b border-white/10">
      <nav class="container-outer flex items-center justify-between py-3">
        <NuxtLink to="#program" class="flex items-center gap-2 font-semibold tracking-tight">
          <v-icon icon="mdi-radar" size="28" class="text-cyan-400" />
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
            class="btn btn-ghost hidden sm:inline-flex"
          >
            <v-icon icon="mdi-github" size="18" />
            <span>GitHub</span>
          </NuxtLink>
          <button
            type="button"
            class="mobile-toggle lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060a18]"
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
          class="lg:hidden border-t border-white/10 bg-[#060a18]/95 backdrop-blur"
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
                  <v-icon v-if="item.icon" :icon="item.icon" size="18" class="text-white/60" />
                  <span>{{ item.label }}</span>
                </span>
                <v-icon icon="mdi-chevron-right" size="18" class="text-white/60" />
              </NuxtLink>
            </nav>
            <div class="grid gap-2">
              <a :href="`mailto:${CONTACT_EMAIL}`" class="btn btn-primary w-full" @click="closeMobileNav">
                <v-icon icon="mdi-email-send" size="18" />
                Mit uns sprechen
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </header>

    <main>
      <!-- HERO / PROGRAM OVERVIEW -->
      <section id="program" class="gradient-hero relative overflow-hidden">
        <div class="hero-overlay absolute inset-0 pointer-events-none" />
        <div class="container-outer relative z-10 pt-28 pb-16 sm:pt-32 sm:pb-20">
          <div class="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,420px)] lg:items-center">
            <div class="space-y-6">
              <span class="chip">Community Pilot Program</span>
              <h1 class="text-3xl sm:text-5xl md:text-6xl font-semibold leading-tight">
                Early-Access, Mitsprache, Credits – konkret & messbar.
              </h1>
              <p class="text-white/80 text-base sm:text-lg">
                OpenSquawk bündelt Early Access, Co-Creation und dauerhafte Credits in einem System.
                Jeder Beitrag landet im Leaderboard, schaltet Rewards frei und beeinflusst die Roadmap in Tagen – nicht Monaten.
              </p>
              <ul class="space-y-2 text-white/70 text-sm sm:text-base">
                <li v-for="highlight in programHighlights" :key="highlight" class="flex items-start gap-2">
                  <v-icon icon="mdi-check-decagram" size="18" class="mt-[2px] text-cyan-300" />
                  <span>{{ highlight }}</span>
                </li>
              </ul>
              <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                <NuxtLink to="#early-access" class="btn btn-primary text-base">
                  <v-icon icon="mdi-flash-outline" size="20" />
                  Programm entdecken
                </NuxtLink>
                <a :href="`mailto:${CONTACT_EMAIL}`" class="btn btn-ghost">
                  <v-icon icon="mdi-account-voice" size="18" />
                  1:1 Austausch starten
                </a>
              </div>
              <p class="text-xs text-white/50">
                Leaderboard-Update jeden Montag im Discord #contributors. Slots werden nach Punkten automatisch freigeschaltet.
              </p>
            </div>
            <div class="card glass space-y-6">
              <div class="space-y-3">
                <h3 class="text-2xl font-semibold">Program Snapshot</h3>
                <p class="text-sm text-white/70">
                  Echtzeit-Scores aus GitHub, Feedback-Form und Discord. Die Zahlen sind Mockups – sie zeigen, wie das Dashboard wirken soll.
                </p>
              </div>
              <div class="grid gap-4">
                <div
                  v-for="stat in programStats"
                  :key="stat.label"
                  class="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div class="text-3xl font-semibold text-cyan-300">{{ stat.value }}</div>
                  <div class="text-sm text-white/80">{{ stat.label }}</div>
                  <div class="text-xs text-white/50">{{ stat.caption }}</div>
                </div>
              </div>
              <div class="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 p-4 space-y-2">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-xs uppercase tracking-[0.3em] text-cyan-200">Nächste Welle</div>
                    <div class="text-lg font-semibold">{{ nextDrop.title }}</div>
                  </div>
                  <span class="chip chip-compact">{{ nextDrop.meta }}</span>
                </div>
                <p class="text-sm text-white/80">{{ nextDrop.focus }}</p>
                <div class="flex items-center gap-2 text-xs text-white/60">
                  <v-icon icon="mdi-timer-sand" size="16" class="text-cyan-200" />
                  Slots werden nach Scorecard-Review 48h vor Start vergeben.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- EARLY ACCESS -->
      <section id="early-access" class="py-12 sm:py-16 md:py-24 bg-[#070c1c] border-t border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4">
            <span class="eyebrow">Early Access</span>
            <h2 class="text-3xl md:text-4xl font-semibold">Wellen, Kriterien & Benefits</h2>
            <p class="text-white/80">
              Alpha, Beta und Preview haben klare Aufgaben. Slots sind an messbare Beiträge gekoppelt – jede Teilnahme wird protokolliert.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3 md:gap-6">
            <article
              v-for="wave in earlyAccessWaves"
              :key="wave.name"
              class="card h-full space-y-4"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                  <v-icon :icon="wave.icon" size="26" class="text-cyan-200" />
                </div>
                <div>
                  <div class="text-xs uppercase tracking-[0.3em] text-white/50">{{ wave.badge }}</div>
                  <h3 class="text-xl font-semibold text-white">{{ wave.name }}</h3>
                </div>
              </div>
              <p class="text-sm text-white/70">{{ wave.description }}</p>
              <div class="space-y-2 text-sm text-white/80">
                <div
                  v-for="item in wave.highlights"
                  :key="item"
                  class="flex items-start gap-2"
                >
                  <v-icon icon="mdi-check-circle" size="18" class="mt-[2px] text-emerald-300" />
                  <span>{{ item }}</span>
                </div>
              </div>
              <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
                {{ wave.slotNote }}
              </div>
            </article>
          </div>
          <div class="grid gap-4 md:grid-cols-2 md:gap-6">
            <div class="card space-y-4">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                  <v-icon icon="mdi-format-list-checks" size="22" class="text-cyan-200" />
                </div>
                <h3 class="text-lg font-semibold">Slot-Kriterien</h3>
              </div>
              <p class="text-sm text-white/70">
                Eine bestätigte Leistung genügt – Review-Team markiert Beiträge mit <code>valid</code>.
              </p>
              <ul class="space-y-2 text-sm text-white/80">
                <li
                  v-for="(criteria, index) in earlyAccessCriteria"
                  :key="criteria"
                  class="flex items-start gap-2"
                >
                  <v-icon icon="mdi-ray-start" size="18" class="mt-[2px] text-cyan-300" />
                  <span>
                    <span v-if="index > 0" class="text-white/40 pr-1">oder</span>{{ criteria }}
                  </span>
                </li>
              </ul>
            </div>
            <div class="card space-y-4">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                  <v-icon icon="mdi-gift" size="22" class="text-cyan-200" />
                </div>
                <h3 class="text-lg font-semibold">Benefits je Welle</h3>
              </div>
              <ul class="space-y-2 text-sm text-white/80">
                <li v-for="benefit in earlyAccessBenefits" :key="benefit" class="flex items-start gap-2">
                  <v-icon icon="mdi-star" size="18" class="mt-[2px] text-amber-300" />
                  <span>{{ benefit }}</span>
                </li>
              </ul>
              <p class="text-xs text-white/50">
                Voting-Power steigt pro Welle: Alpha ×1.5, Beta ×1.2, Preview ×1.1 – sichtbar im Scorecard-Overlay.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CO-CREATION -->
      <section id="co-creation" class="py-12 sm:py-16 md:py-24 bg-[#050b18]">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4">
            <span class="eyebrow">Mitgestaltung</span>
            <h2 class="text-3xl md:text-4xl font-semibold">Co-Creation Formate</h2>
            <p class="text-white/80">
              Feature Council, Content-Guilds und RFC-Runden sorgen dafür, dass Entscheidungen transparent und in klaren Slots getroffen werden.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3 md:gap-6">
            <article
              v-for="item in coCreationStreams"
              :key="item.title"
              class="card h-full space-y-4"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                  <v-icon :icon="item.icon" size="24" class="text-cyan-200" />
                </div>
                <div>
                  <div class="text-xs uppercase tracking-[0.3em] text-white/50">{{ item.meta }}</div>
                  <h3 class="text-xl font-semibold">{{ item.title }}</h3>
                </div>
              </div>
              <p class="text-sm text-white/70">{{ item.description }}</p>
              <ul class="space-y-2 text-sm text-white/80">
                <li v-for="detail in item.bullets" :key="detail" class="flex items-start gap-2">
                  <v-icon icon="mdi-chevron-right-circle" size="18" class="mt-[2px] text-cyan-300" />
                  <span>{{ detail }}</span>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <!-- CREDITS -->
      <section id="credits" class="py-12 sm:py-16 md:py-24 bg-[#060a18] border-t border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4">
            <span class="eyebrow">Credits</span>
            <h2 class="text-3xl md:text-4xl font-semibold">Sichtbar & dauerhaft</h2>
            <p class="text-white/80">
              Jeder Beitrag wird sichtbar – auf der Website, in der App und in kosmetischen Goodies. Credits bleiben erhalten, egal welche Welle aktiv ist.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
            <article
              v-for="credit in creditHighlights"
              :key="credit.title"
              class="card h-full space-y-3"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                  <v-icon :icon="credit.icon" size="24" class="text-cyan-200" />
                </div>
                <h3 class="text-lg font-semibold">{{ credit.title }}</h3>
              </div>
              <p class="text-sm text-white/70">{{ credit.description }}</p>
              <ul v-if="credit.bullets?.length" class="space-y-2 text-sm text-white/80">
                <li v-for="line in credit.bullets" :key="line" class="flex items-start gap-2">
                  <v-icon icon="mdi-star-circle" size="18" class="mt-[2px] text-amber-300" />
                  <span>{{ line }}</span>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <!-- REWARDS & QUALITY -->
      <section id="rewards" class="py-12 sm:py-16 md:py-24 bg-[#050b18]">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4">
            <span class="eyebrow">Punkte & Rewards</span>
            <h2 class="text-3xl md:text-4xl font-semibold">Einfache Regeln, klare Meilensteine</h2>
            <p class="text-white/80">
              Punkte werden nach Review vergeben. Rewards folgen sofort – keine manuellen Listen, sondern automatisierte Rollen & Badges.
            </p>
          </div>
          <div class="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <div class="card space-y-4">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                  <v-icon icon="mdi-format-list-bulleted-square" size="22" class="text-cyan-200" />
                </div>
                <h3 class="text-lg font-semibold">Punkte je Beitrag</h3>
              </div>
              <div class="divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden">
                <div
                  v-for="entry in contributionMatrix"
                  :key="entry.label"
                  class="flex items-center justify-between gap-3 bg-white/5 px-4 py-3 text-sm text-white/80"
                >
                  <span>{{ entry.label }}</span>
                  <span class="text-cyan-200 font-semibold">{{ entry.points }} P</span>
                </div>
              </div>
            </div>
            <div class="card space-y-4">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                  <v-icon icon="mdi-trophy-variant" size="22" class="text-cyan-200" />
                </div>
                <h3 class="text-lg font-semibold">Meilensteine & Rewards</h3>
              </div>
              <div class="space-y-3 text-sm text-white/80">
                <div
                  v-for="milestone in milestoneRewards"
                  :key="milestone.points"
                  class="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div class="text-xs uppercase tracking-[0.3em] text-white/50">{{ milestone.points }}</div>
                  <div class="mt-1 font-semibold text-white">{{ milestone.reward }}</div>
                  <p v-if="milestone.detail" class="text-xs text-white/60 mt-1">{{ milestone.detail }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="card space-y-4">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                <v-icon icon="mdi-shield-check" size="22" class="text-cyan-200" />
              </div>
              <h3 class="text-lg font-semibold">Anti-Abuse & Qualitätssicherung</h3>
            </div>
            <ul class="space-y-2 text-sm text-white/80">
              <li v-for="guard in qualityGuards" :key="guard" class="flex items-start gap-2">
                <v-icon icon="mdi-shield-outline" size="18" class="mt-[2px] text-cyan-300" />
                <span>{{ guard }}</span>
              </li>
            </ul>
            <p class="text-xs text-white/50">
              Limit: max. 1 Punkte-Reward pro Tag und Person – schützt vor Farming und sorgt für hochwertige Beiträge.
            </p>
          </div>
        </div>
      </section>

      <!-- TOOLING & SNIPPETS -->
      <section id="tooling" class="py-12 sm:py-16 md:py-24 bg-[#060a18] border-t border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4">
            <span class="eyebrow">Tooling & Snippets</span>
            <h2 class="text-3xl md:text-4xl font-semibold">Schnelle Umsetzung</h2>
            <p class="text-white/80">
              Wir setzen auf Automatisierung: Labels, Rollen, Formulare und Leaderboard laufen ohne manuellen Aufwand. Dazu gibt es Snippets zum direkten Copy-Paste.
            </p>
          </div>
          <div class="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
            <div class="card space-y-4">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                  <v-icon icon="mdi-tools" size="22" class="text-cyan-200" />
                </div>
                <h3 class="text-lg font-semibold">Tool-Stack</h3>
              </div>
              <ul class="space-y-2 text-sm text-white/80">
                <li v-for="tool in toolingStack" :key="tool" class="flex items-start gap-2">
                  <v-icon icon="mdi-checkbox-marked-circle-outline" size="18" class="mt-[2px] text-emerald-300" />
                  <span>{{ tool }}</span>
                </li>
              </ul>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <article
                v-for="snippet in snippetBlocks"
                :key="snippet.title"
                class="card h-full space-y-3"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                    <v-icon :icon="snippet.icon" size="22" class="text-cyan-200" />
                  </div>
                  <h3 class="text-lg font-semibold">{{ snippet.title }}</h3>
                </div>
                <p v-if="snippet.description" class="text-sm text-white/70">
                  {{ snippet.description }}
                </p>
                <pre class="snippet-code">{{ snippet.body }}</pre>
              </article>
            </div>
          </div>
        </div>
      </section>

      <!-- EXTRAS -->
      <section id="extras" class="py-12 sm:py-16 md:py-24 bg-[#050b18]">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4">
            <span class="eyebrow">Extras</span>
            <h2 class="text-3xl md:text-4xl font-semibold">Formate, die ziehen</h2>
            <p class="text-white/80">
              Bonus-Events sorgen für Sichtbarkeit, Motivation und Community-Growth – inklusive Punkte-Boni und Shoutouts.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3 md:gap-6">
            <article
              v-for="extra in extrasList"
              :key="extra.title"
              class="card h-full space-y-3"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                  <v-icon :icon="extra.icon" size="24" class="text-cyan-200" />
                </div>
                <h3 class="text-lg font-semibold">{{ extra.title }}</h3>
              </div>
              <p class="text-sm text-white/70">{{ extra.description }}</p>
              <p v-if="extra.detail" class="text-xs text-white/50">{{ extra.detail }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section id="cta" class="py-12 sm:py-16 md:py-24 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent border-t border-white/10">
        <div class="container-outer">
          <div class="card space-y-6 md:space-y-0 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:gap-8">
            <div class="space-y-4">
              <h3 class="text-2xl md:text-3xl font-semibold">Bereit für die nächste Welle?</h3>
              <p class="text-white/80 text-sm sm:text-base">
                Wir können direkt loslegen: Issue-Template, Discord-Rollen und Hall-of-Fame-Sektion sind vorbereitet.
                Sag uns einfach, welche Assets du zuerst brauchst – wir liefern die JSON/MD-Dateien auf Zuruf.
              </p>
              <ul class="space-y-2 text-sm text-white/80">
                <li class="flex items-start gap-2">
                  <v-icon icon="mdi-playlist-check" size="18" class="mt-[2px] text-cyan-300" />
                  <span>GitHub-Issue-Template (Bugrubrik inklusive Pflichtfeldern)</span>
                </li>
                <li class="flex items-start gap-2">
                  <v-icon icon="mdi-account-group-outline" size="18" class="mt-[2px] text-cyan-300" />
                  <span>Discord-Rollenliste + Automations-Trigger</span>
                </li>
                <li class="flex items-start gap-2">
                  <v-icon icon="mdi-table" size="18" class="mt-[2px] text-cyan-300" />
                  <span>Hall-of-Fame-Sektion als JSON/Markdown</span>
                </li>
              </ul>
            </div>
            <div class="space-y-3">
              <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 space-y-2">
                <div class="flex items-center gap-2 text-white">
                  <v-icon icon="mdi-calendar-clock" size="20" class="text-cyan-300" />
                  <span>Nächster Sync-Slot: Dienstag, 19:00 UTC (Mockup)</span>
                </div>
                <p>30 Minuten Kickoff, danach Setup-Checkliste & Zugangscodes.</p>
              </div>
              <div class="grid gap-2 sm:grid-cols-2">
                <NuxtLink to="#early-access" class="btn btn-primary w-full">
                  <v-icon icon="mdi-rocket-launch" size="20" />
                  Early Access sichern
                </NuxtLink>
                <a :href="`mailto:${CONTACT_EMAIL}`" class="btn btn-ghost w-full">
                  <v-icon icon="mdi-email-edit" size="18" />
                  Frage senden
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-white/10 bg-[#040713] text-white/70">
      <div class="container-outer py-10 space-y-8">
        <div class="footer-brand">
          <div class="flex items-center gap-3">
            <v-icon icon="mdi-radar" size="28" class="text-cyan-400" />
            <div>
              <div class="text-lg font-semibold text-white">OpenSquawk</div>
              <p class="text-sm text-white/60">Community AI ATC · nicht für real-world aviation</p>
            </div>
          </div>
          <div class="footer-brand-actions">
            <NuxtLink
              :to="GITHUB_URL"
              external
              target="_blank"
              rel="noopener"
              class="footer-action"
            >
              <v-icon icon="mdi-github" size="18" />
              Code
            </NuxtLink>
            <a :href="`mailto:${CONTACT_EMAIL}`" class="footer-action">
              <v-icon icon="mdi-email-edit" size="18" />
              {{ CONTACT_EMAIL }}
            </a>
          </div>
        </div>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 class="mb-3 font-semibold text-white">Programm</h4>
            <ul class="space-y-2 text-sm">
              <li v-for="item in navLinks" :key="`footer-${item.to}`">
                <NuxtLink :to="item.to" class="hover:text-cyan-300">
                  {{ item.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="mb-3 font-semibold text-white">Community</h4>
            <ul class="space-y-2 text-sm">
              <li>Discord #contributors (Leaderboard)</li>
              <li>Feature Council Scorecards</li>
              <li>Content-Guild Assets</li>
            </ul>
          </div>
          <div>
            <h4 class="mb-3 font-semibold text-white">Rechtliches</h4>
            <ul class="space-y-2 text-sm">
              <li>
                <NuxtLink to="/impressum" class="hover:text-cyan-300">Impressum</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/datenschutz" class="hover:text-cyan-300">Datenschutz</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/agb" class="hover:text-cyan-300">AGB</NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="mb-3 font-semibold text-white">Ressourcen</h4>
            <ul class="space-y-2 text-sm">
              <li>
                <NuxtLink to="/docs" class="hover:text-cyan-300">Dokumentation</NuxtLink>
              </li>
              <li>
                <NuxtLink :to="GITHUB_URL" external target="_blank" rel="noopener" class="hover:text-cyan-300">
                  GitHub Repository
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/news" class="hover:text-cyan-300">Updates & News</NuxtLink>
              </li>
            </ul>
          </div>
        </div>
        <div class="border-t border-white/10 pt-6 text-xs text-white/50">
          © {{ year }} OpenSquawk. Nur für Simulator-Training. VATSIM/IVAO: Marken ihrer jeweiligen Inhaber.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, ref, watch} from 'vue'
import {useHead, useRoute} from '#imports'

const GITHUB_URL = 'https://github.com/FaktorxMensch/OpenSquawk'
const CONTACT_EMAIL = 'info@opensquawk.de'

interface NavLink {
  label: string
  to: string
}

interface ExtendedNavLink extends NavLink {
  external?: boolean
  icon?: string
}

const navLinks: NavLink[] = [
  {label: 'Programm', to: '#program'},
  {label: 'Early Access', to: '#early-access'},
  {label: 'Co-Creation', to: '#co-creation'},
  {label: 'Credits', to: '#credits'},
  {label: 'Rewards', to: '#rewards'},
  {label: 'Tooling', to: '#tooling'},
  {label: 'Extras', to: '#extras'},
]

const mobileNavLinks = computed<ExtendedNavLink[]>(() => [
  ...navLinks,
  {label: 'CTA', to: '#cta'},
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
  watch(
    isMobileNavOpen,
    (open) => {
      document.body.classList.toggle('overflow-hidden', open)
    },
  )
  onBeforeUnmount(() => {
    document.body.classList.remove('overflow-hidden')
  })
}

const programHighlights = [
  'Scorecards & Votes entscheiden Features innerhalb von 72 Stunden.',
  'Rewards & Badges binden sich automatisch an Discord-Rollen.',
  'Transparente Leaderboards – jede Aktion erhält ein Label & Log.',
]

interface ProgramStat {
  label: string
  value: string
  caption: string
}

const programStats: ProgramStat[] = [
  {label: 'Aktive Tester', value: '128', caption: 'Alpha & Beta kombiniert (Mockup)'},
  {label: 'Validierte Beiträge', value: '482', caption: 'Bugreports, Videos, Content'},
  {label: 'Vergebene Credits', value: '215', caption: 'Hall of Fame & Badges'},
]

const nextDrop = {
  title: 'Beta Drop 02',
  meta: '11. März · 40 Slots',
  focus: 'Schwerpunkt: Phraseologie-Updates & UX-Checks',
} as const

interface EarlyAccessWave {
  name: string
  badge: string
  icon: string
  description: string
  highlights: string[]
  slotNote: string
}

const earlyAccessWaves: EarlyAccessWave[] = [
  {
    name: 'Alpha',
    badge: 'Core-Tester',
    icon: 'mdi-cog',
    description: 'Validiert Funklogik, Infrastruktur und Stabilität des Kernsystems.',
    highlights: [
      'Direkter Zugriff auf Nightly Builds & Debug-Tools.',
      'Gemeinsame Incident-Reviews mit dem Dev-Team.',
      'Fokus auf Setup, Bridge & LLM-Guardrails.',
    ],
    slotNote: 'Max. 25 Plätze · wöchentliche Syncs · Fokus: Blocker identifizieren.',
  },
  {
    name: 'Beta',
    badge: 'Feature-Tester',
    icon: 'mdi-clipboard-check',
    description: 'Testet neue Features, UX-Flows und Trainingskarten kurz vor dem Rollout.',
    highlights: [
      'Feature-Flags & Guided Tours für neue Module.',
      'Scorecard-Votings bestimmen Go/No-Go.',
      'Feedback landet direkt im Release-Backlog.',
    ],
    slotNote: 'Max. 60 Plätze · zweitägige Feedback-Fenster · Fokus: Releasereife.',
  },
  {
    name: 'Preview',
    badge: 'Creators & Streamer',
    icon: 'mdi-bullhorn-outline',
    description: 'Zeigt den Stand öffentlich, sammelt Community-Feedback und produziert Content.',
    highlights: [
      'Early Briefings & Assets für Content Drops.',
      'Co-Streams bei „Fix-it Friday“ & Launch-Events.',
      'Invite-Codes & Referral-Tracking eingebaut.',
    ],
    slotNote: 'Max. 20 Plätze · Embargo/Preview-Kit · Fokus: Reichweite & Onboarding.',
  },
]

const earlyAccessCriteria = [
  '3 qualifizierte Bugreports (inkl. Log oder Clip)',
  '1 Testsession-Video ≥10 min',
  '3 referierte Nutzer nach abgeschlossener Session',
]

const earlyAccessBenefits = [
  'Früher Build-Zugang & Feature-Flags',
  'Exklusiver Discord-Channel je Welle',
  'Voting-Power-Boost auf Scorecards',
  'Roadmap-Preview & Backlog-Zugriff',
]

interface CoCreationStream {
  title: string
  icon: string
  meta: string
  description: string
  bullets: string[]
}

const coCreationStreams: CoCreationStream[] = [
  {
    title: 'Feature Council',
    icon: 'mdi-vote',
    meta: 'monatlich · 45 min · max. 12 Plätze',
    description: 'Deep-Dive in Specs inkl. Scorecard-Voting. Entscheidungen erhalten sofort einen Umsetzungsslot.',
    bullets: [
      'Spec & Research-Paket 72h vor dem Call.',
      'Scorecards (Impact, Effort, Training Value).',
      'Outcome + Build-Slot + Retro mit Recording.',
    ],
  },
  {
    title: 'Content-Guilds',
    icon: 'mdi-book-multiple',
    meta: 'fortlaufend · async & live',
    description: 'Gemeinsam Phraseologie-Sets, Trainingskarten und Airport-Profile entwickeln.',
    bullets: [
      'Templates für VFR/IFR Phraseologie & Checklisten.',
      'Review-Schleifen mit ATC SMEs & Streamern.',
      'Release im Content-Hub inkl. Credits & Badges.',
    ],
  },
  {
    title: 'RFC-Runden',
    icon: 'mdi-file-document-edit-outline',
    meta: 'rolling · 72h Review',
    description: 'Community schreibt 1-Pager, erhält Feedback und – bei Go – einen Umsetzungsslot im Board.',
    bullets: [
      'Einreichung via 1-Pager + Impact-Skizze.',
      'Community-Review 72h · Labels: accept/needs-info.',
      'Freigabe -> Umsetzungsslot + Owner aus dem Team.',
    ],
  },
]

interface CreditHighlight {
  title: string
  icon: string
  description: string
  bullets?: string[]
}

const creditHighlights: CreditHighlight[] = [
  {
    title: 'Hall of Fame',
    icon: 'mdi-account-star',
    description: 'Website & In-App („About > Contributors“) listen Callsign + Link – dauerhaft abrufbar.',
  },
  {
    title: 'Release-Notes-Shoutouts',
    icon: 'mdi-note-text-outline',
    description: 'Jedes Release erwähnt Contributor, Issue-Nummer und Beitrag.',
  },
  {
    title: 'In-App-Badges',
    icon: 'mdi-shield-star-outline',
    description: '„Early Bird“, „Tower Mentor“, „Bug Hunter“, „Route Architect“ – sichtbar im Profil & Leaderboard.',
  },
  {
    title: 'Kosmetik',
    icon: 'mdi-palette-swatch',
    description: 'Personalisierte Kneeboard-Skin oder ATC-Stimme – reserviert für die Top-5 Contributors.',
  },
  {
    title: 'Invite-Codes',
    icon: 'mdi-ticket-confirmation-outline',
    description: 'Individuelle Referral-Links tracken Sessions und schalten Bonuspunkte frei.',
  },
  {
    title: 'Docs & Credits',
    icon: 'mdi-book-open-variant',
    description: 'Contributor-List wird im Repo & Docs gespiegelt – inklusive Badge-JSON.',
  },
]

interface ContributionEntry {
  label: string
  points: number
}

const contributionMatrix: ContributionEntry[] = [
  {label: 'Bug (reproduzierbar, Log/Clip)', points: 3},
  {label: 'UX-Verbesserung mit Mock/GIF', points: 2},
  {label: 'Testflight-Video ≥10 min', points: 4},
  {label: 'Content-Beitrag (Karten/Checkliste)', points: 4},
  {label: 'Referral (aktive Session abgeschlossen)', points: 2},
]

interface MilestoneReward {
  points: string
  reward: string
  detail?: string
}

const milestoneRewards: MilestoneReward[] = [
  {points: '5 P', reward: 'Beta-Zugang + Badge „Scout“'},
  {points: '10 P', reward: 'Feature-Council-Vote + Namensnennung im nächsten Release'},
  {points: '20 P', reward: 'Personalisierte Kneeboard-Skin + „Contributor“-Rolle'},
  {points: '35 P', reward: 'Stimme/Callsign-Easter-Egg + „Architect“-Badge'},
]

const qualityGuards = [
  'Bug-Rubrik mit Titel, Repro-Steps, Erwartet/Erhalten, Build, Logs/Clip ist Pflicht.',
  'Punkte nur nach Review – Labels: valid, needs-info, duplicate.',
  'Referral zählt erst nach einer abgeschlossenen Testsession.',
  'Automatisches Limit: max. ein Punkte-Reward pro Tag & Person.',
]

const toolingStack = [
  'GitHub-Labels + Issue-Template für Bugreports & RFCs.',
  'Discord Role-Bot koppelt Punkte an Rollen & Channels.',
  'Feedback-Form mit 3 Pflichtfeldern + Upload (Log/Clip).',
  'Leaderboard (wöchentlich) im Discord #contributors.',
]

interface SnippetBlock {
  title: string
  icon: string
  body: string
  description?: string
}

const snippetBlocks: SnippetBlock[] = [
  {
    title: 'Discord-Announcement',
    icon: 'mdi-discord',
    description: 'Teaser-Text für #announcements – Markdown kompatibel.',
    body: `Wir öffnen *OpenSquawk Early Access*. Hol dir den **Beta-Key** mit 5 Punkten:
– 1 Bug mit Repro (3 P)
– 1 Testvideo ≥10 min (4 P)
– 1 Referral mit abgeschl. Session (2 P)
Punkte = Rewards: Badges, Council-Votes, eigene Kneeboard-Skin.
Mitmachen: Link → Feedback-Form | Regeln → #contribute`,
  },
  {
    title: 'Release-Notes-Credits',
    icon: 'mdi-text-box-check-outline',
    body: `Credits: Danke an **DLH478**, **NAX21**, **MUC_ATC** für Bugs #112/#118, IFR-Karten v0.2, Audio-Fix.`,
  },
  {
    title: 'Issue-Template (Kurz)',
    icon: 'mdi-format-list-bulleted',
    description: 'Für GitHub Issues oder Feedback-Form (Required Fields).',
    body: `**Build/Browser**:
**Schritte**: 1)… 2)… 3)…
**Erwartet/Erhalten**:
**Anhang**: Log/Clip/PNG (Pflicht)`,
  },
]

interface ExtraHighlight {
  title: string
  icon: string
  description: string
  detail?: string
}

const extrasList: ExtraHighlight[] = [
  {
    title: 'Readback-Challenge',
    icon: 'mdi-microphone-variant',
    description: 'Wöchentlicher 30-Minuten-Contest – Top 3 erhalten +2 Punkte und einen Shoutout.',
    detail: 'Perfekt für Creator-Streams & Community-Building.',
  },
  {
    title: 'Fix-it Friday',
    icon: 'mdi-hammer-wrench',
    description: 'Wir fixen drei Community-Issues live. Gäste & Streamer willkommen.',
    detail: 'Livestream, Release-Branch & Credits in Echtzeit.',
  },
  {
    title: 'Your Airport, Our Trainer',
    icon: 'mdi-airplane-takeoff',
    description: 'Monatliches Voting: Gewinner-Airport erhält dedizierte Trainingskarte + Namensnennung.',
    detail: 'Content-Guild erstellt Karten, Beta testet, Release mit Credits.',
  },
]

const year = new Date().getFullYear()

useHead(() => ({
  htmlAttrs: {lang: 'de'},
  title: 'OpenSquawk – Early Access Programm & Contributor Credits',
  meta: [
    {
      name: 'description',
      content: 'Early-Access-Wellen, Co-Creation-Formate und Credits für OpenSquawk. Punkte, Rewards und Tooling als GUI-Prototyp.',
    },
    {name: 'theme-color', content: '#0ea5e9'},
    {property: 'og:title', content: 'OpenSquawk – Early Access & Contributor Credits'},
    {
      property: 'og:description',
      content: 'Alpha, Beta, Preview – messbare Beiträge, Rewards & Leaderboards. Community gestaltet OpenSquawk aktiv mit.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:image', content: 'https://opensquawk.example.com/cover.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: 'OpenSquawk – Early Access & Contributor Credits'},
    {
      name: 'twitter:description',
      content: 'Early Access, Co-Creation und Credits als klares Programm – alles trackbar und belohnt.',
    },
    {name: 'twitter:image', content: 'https://opensquawk.example.com/cover.png'},
  ],
}))
</script>

<style scoped>
.container-outer {
  @apply mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8;
}

.gradient-hero {
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(6, 182, 212, .35), transparent),
    radial-gradient(900px 480px at 90% 0%, rgba(59, 130, 246, .28), transparent),
    linear-gradient(180deg, #060a18 0%, #060a18 65%, #040713 100%);
  position: relative;
}

.hero-overlay {
  background: linear-gradient(90deg, rgba(6, 10, 24, 0.95) 0%, rgba(6, 10, 24, 0.65) 45%, rgba(6, 10, 24, 0.15) 100%);
  z-index: 1;
}

main {
  @apply pt-16 lg:pt-20;
}

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition px-4 py-2.5 sm:px-5 sm:py-3;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(14, 165, 233, 1) 0%, rgba(6, 182, 212, 1) 100%);
  color: #041320;
  box-shadow: 0 18px 38px rgba(14, 165, 233, 0.28);
}

.btn-primary:hover {
  box-shadow: 0 22px 46px rgba(14, 165, 233, 0.38);
  transform: translateY(-1px);
}

.btn-ghost {
  @apply border border-white/10 bg-white/5 text-white/80;
}

.btn-ghost:hover {
  @apply border-cyan-400/60 bg-white/10 text-white;
}

.card {
  background: rgba(11, 18, 36, 0.68);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  padding: 1.5rem;
}

.glass {
  background: rgba(10, 18, 36, 0.78);
}

.chip {
  @apply inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200;
}

.chip-compact {
  @apply px-2.5 py-1 text-[10px] tracking-[0.25em];
}

.eyebrow {
  @apply uppercase tracking-[0.35em] text-[11px] text-cyan-200;
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

.snippet-code {
  @apply w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-mono text-white/80;
}

.footer-brand {
  @apply flex flex-col gap-4 text-center sm:text-left sm:items-start lg:flex-row lg:items-center lg:justify-between lg:gap-8;
}

.footer-brand-actions {
  @apply flex flex-wrap items-center justify-center gap-3 sm:justify-start lg:justify-end lg:ml-auto;
}

.footer-action {
  @apply inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-400/60 hover:bg-white/10;
}

a {
  transition: color 0.2s ease;
}
</style>
