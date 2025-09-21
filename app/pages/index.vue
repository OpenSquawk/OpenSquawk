<template>
  <div class="bg-[#050914] text-white antialiased selection:bg-cyan-400/30">
    <header
        class="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#050914]/80 backdrop-blur"
        data-aos="fade-down"
    >
      <nav class="container-outer flex items-center justify-between py-3">
        <NuxtLink to="#" class="flex items-center gap-2 font-semibold tracking-tight">
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
          <NuxtLink to="/login" class="btn btn-primary whitespace-nowrap btn-compact" aria-label="Login">
            <v-icon icon="mdi-login" size="18" />
            <span class="hidden sm:inline">Login</span>
          </NuxtLink>
          <NuxtLink
              :to="GITHUB_URL"
              external
              target="_blank"
              rel="noopener"
              class="hidden lg:inline-flex btn btn-ghost btn-compact text-sm"
          >
            <v-icon icon="mdi-github" />
            GitHub
          </NuxtLink>
          <button
              type="button"
              class="mobile-toggle lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050914]"
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
            class="lg:hidden border-t border-white/10 bg-[#050914]/95 backdrop-blur"
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
              <NuxtLink to="/login" class="btn btn-primary w-full" @click="closeMobileNav">
                <v-icon icon="mdi-login" size="18" />
                Login
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </header>

    <main>
      <section class="gradient-hero relative overflow-hidden">
        <div class="hero-overlay absolute inset-0 pointer-events-none" />
        <div class="container-outer relative z-10 pt-24 pb-20 md:pt-28">
          <div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
            <div class="space-y-6" data-aos="fade-up">
              <span class="chip">Community Program</span>
              <h1 class="text-3xl sm:text-5xl md:text-6xl font-semibold leading-tight">
                Early-Access, Mitsprache, Credits – konkret & messbar.
              </h1>
              <p class="text-base sm:text-lg text-white/80">
                OpenSquawk lädt dich in ein greifbares Early-Access-Programm ein: klare Wellen, transparente Anforderungen
                und Belohnungen, die in App & Community sichtbar bleiben. Alles als visuelles Proto für das neue Landing-Page-Erlebnis.
              </p>
              <div class="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
                <div class="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                  <v-icon icon="mdi-alpha-a-circle" class="text-cyan-300" size="20" />
                  <div>
                    <p class="font-semibold text-white">Alpha · Beta · Preview</p>
                    <p class="text-xs text-white/60">Slots nach Leistung</p>
                  </div>
                </div>
                <div class="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                  <v-icon icon="mdi-vote" class="text-cyan-300" size="20" />
                  <div>
                    <p class="font-semibold text-white">Feature Council</p>
                    <p class="text-xs text-white/60">Scorecards & Abstimmung</p>
                  </div>
                </div>
                <div class="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                  <v-icon icon="mdi-star-shooting" class="text-cyan-300" size="20" />
                  <div>
                    <p class="font-semibold text-white">Hall of Fame</p>
                    <p class="text-xs text-white/60">Callsigned & dauerhaft</p>
                  </div>
                </div>
                <div class="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                  <v-icon icon="mdi-gift" class="text-cyan-300" size="20" />
                  <div>
                    <p class="font-semibold text-white">Belohnungen</p>
                    <p class="text-xs text-white/60">Badges, Skins & Votes</p>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                <NuxtLink to="#cta" class="btn btn-primary text-base">
                  <v-icon icon="mdi-account-plus" size="20" />
                  Slot sichern
                </NuxtLink>
                <NuxtLink to="#rewards" class="btn btn-ghost text-base">
                  <v-icon icon="mdi-trophy-variant" size="20" />
                  Punkte-System ansehen
                </NuxtLink>
              </div>
            </div>
            <div class="card hero-card" data-aos="fade-left" data-aos-delay="120">
              <div class="space-y-5">
                <div>
                  <h3 class="text-2xl font-semibold">Beta-Key Tracker</h3>
                  <p class="mt-1 text-sm text-white/70">
                    5 Punkte = Zugang. Kombiniere Beiträge, die du wirklich liefern kannst.
                  </p>
                </div>
                <div class="space-y-3">
                  <div
                      v-for="item in betaKeyCombos"
                      :key="item.label"
                      class="combo-item"
                  >
                    <div class="flex items-center gap-3">
                      <span class="combo-icon">
                        <v-icon :icon="item.icon" size="20" />
                      </span>
                      <div>
                        <p class="font-semibold">{{ item.label }}</p>
                        <p class="text-xs text-white/60">{{ item.description }}</p>
                      </div>
                      <span class="ml-auto text-sm font-semibold text-cyan-300">+{{ item.points }} P</span>
                    </div>
                  </div>
                </div>
                <div class="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/70">
                  <p class="font-semibold text-white">Freischaltung</p>
                  <p>Review innerhalb 48h · Discord-Rolle „Scout“ automatisch · Voting-Power ↑ in der nächsten Roadmap-Runde.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="early-access" class="py-16 sm:py-20 bg-[#050a1b] border-y border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="section-title">Early Access</h2>
            <p class="text-white/80">
              Drei Wellen strukturieren den Zugang und machen Erwartungen transparent. Jede Phase liefert fokussiertes Feedback
              – und belohnt die Tester:innen, die wirklich liefern.
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="wave in earlyAccessWaves" :key="wave.name" class="chip">{{ wave.name }} · {{ wave.role }}</span>
            </div>
          </div>
          <div class="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-aos="fade-up">
              <article v-for="wave in earlyAccessWaves" :key="`card-${wave.name}`" class="card h-full">
                <div class="flex items-center gap-3">
                  <div class="wave-icon">
                    <v-icon :icon="wave.icon" class="text-cyan-300" size="22" />
                  </div>
                  <div>
                    <p class="text-sm text-white/60 uppercase tracking-[0.2em]">{{ wave.role }}</p>
                    <h3 class="text-xl font-semibold">{{ wave.name }}</h3>
                  </div>
                </div>
                <p class="mt-3 text-sm text-white/70">{{ wave.description }}</p>
                <ul class="mt-4 space-y-2 text-sm text-white/80">
                  <li v-for="focus in wave.focus" :key="focus" class="flex gap-2">
                    <v-icon icon="mdi-check-decagram" size="18" class="text-emerald-400 mt-[2px]" />
                    <span>{{ focus }}</span>
                  </li>
                </ul>
              </article>
            </div>
            <div class="space-y-4" data-aos="fade-left" data-aos-delay="100">
              <article class="card">
                <h3 class="text-lg font-semibold">Slot-Kriterien</h3>
                <p class="mt-2 text-sm text-white/70">
                  Ein Slot pro Welle wird frei, sobald eines der folgenden Ziele erreicht ist:
                </p>
                <ul class="mt-3 space-y-2 text-sm text-white/80">
                  <li v-for="criterion in slotCriteria" :key="criterion" class="flex gap-2">
                    <v-icon icon="mdi-target-account" size="18" class="text-cyan-300 mt-[2px]" />
                    <span>{{ criterion }}</span>
                  </li>
                </ul>
              </article>
              <article class="card">
                <h3 class="text-lg font-semibold">Vorteile</h3>
                <ul class="mt-3 space-y-2 text-sm text-white/80">
                  <li v-for="perk in earlyAccessPerks" :key="perk" class="flex gap-2">
                    <v-icon icon="mdi-gift-open" size="18" class="text-emerald-400 mt-[2px]" />
                    <span>{{ perk }}</span>
                  </li>
                </ul>
                <p class="mt-3 text-xs text-white/60">
                  Feature-Flags erlauben gezieltes Testen. Discord-Channel „tower-lab“ bündelt alles Feedback & Votes.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="co-creation" class="py-16 sm:py-20 bg-[#040814]">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="section-title">Mitgestaltung (Co-Creation)</h2>
            <p class="text-white/80">
              Deine Stimme zählt messbar: Von monatlichen Councils bis zu offenen RFC-Runden. Alles erhält Scorecards,
              Deadlines und sichtbare Entscheidungen.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3" data-aos="fade-up" data-aos-delay="80">
            <article v-for="stream in coCreationStreams" :key="stream.title" class="card h-full">
              <div class="flex items-center gap-3">
                <div class="wave-icon">
                  <v-icon :icon="stream.icon" class="text-cyan-300" size="22" />
                </div>
                <h3 class="text-xl font-semibold">{{ stream.title }}</h3>
              </div>
              <p class="mt-3 text-sm text-white/70">{{ stream.description }}</p>
              <ul class="mt-4 space-y-2 text-sm text-white/80">
                <li v-for="detail in stream.details" :key="detail" class="flex gap-2">
                  <v-icon icon="mdi-chevron-right" size="18" class="text-cyan-300 mt-[1px]" />
                  <span>{{ detail }}</span>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="credits" class="py-16 sm:py-20 bg-[#050a1b] border-y border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="section-title">Credits (sichtbar & dauerhaft)</h2>
            <p class="text-white/80">
              Anerkennung endet nicht beim Discord-Shoutout. Wir verankern deinen Callsign dauerhaft im Produkt – online wie in-app.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-aos="fade-up" data-aos-delay="80">
            <article v-for="credit in creditHighlights" :key="credit.title" class="card h-full">
              <div class="flex items-center gap-3">
                <div class="wave-icon">
                  <v-icon :icon="credit.icon" class="text-cyan-300" size="22" />
                </div>
                <h3 class="text-lg font-semibold">{{ credit.title }}</h3>
              </div>
              <p v-if="credit.description" class="mt-3 text-sm text-white/70">{{ credit.description }}</p>
              <ul v-if="credit.items?.length" class="mt-4 space-y-2 text-sm text-white/80">
                <li v-for="item in credit.items" :key="item" class="flex gap-2">
                  <v-icon icon="mdi-star" size="18" class="text-amber-300 mt-[2px]" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="rewards" class="py-16 sm:py-20 bg-[#040814]">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="section-title">Punkte & Belohnungen</h2>
            <p class="text-white/80">
              Einfaches System, hohe Aussagekraft: Beiträge werden nach Review bewertet und in Rewards umgewandelt.
            </p>
          </div>
          <div class="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <article class="card" data-aos="fade-up">
              <h3 class="text-lg font-semibold">Beitrag → Punkte</h3>
              <div class="mt-4 space-y-3">
                <div
                    v-for="action in contributionActions"
                    :key="action.title"
                    class="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div class="flex items-center gap-3">
                    <span class="combo-icon combo-icon--small">
                      <v-icon :icon="action.icon" size="18" />
                    </span>
                    <div>
                      <p class="font-semibold">{{ action.title }}</p>
                      <p v-if="action.description" class="text-xs text-white/60">{{ action.description }}</p>
                    </div>
                  </div>
                  <span class="sm:ml-auto text-sm font-semibold text-cyan-300">+{{ action.points }} P</span>
                </div>
              </div>
              <p class="mt-4 text-xs text-white/60">
                Punkte werden nach Review durch das Community-Team vergeben. "Needs-info" pausiert, "Duplicate" zählt nicht.
              </p>
            </article>
            <article class="card" data-aos="fade-left" data-aos-delay="80">
              <h3 class="text-lg font-semibold">Meilensteine → Rewards</h3>
              <ul class="mt-4 space-y-3 text-sm text-white/80">
                <li v-for="reward in milestoneRewards" :key="reward.points" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div class="flex items-center gap-3">
                    <span class="combo-icon combo-icon--small">
                      <v-icon icon="mdi-flag-checkered" size="18" />
                    </span>
                    <div>
                      <p class="font-semibold text-white">{{ reward.points }} Punkte</p>
                      <p>{{ reward.reward }}</p>
                    </div>
                  </div>
                </li>
              </ul>
              <p class="mt-4 text-xs text-white/60">Limits & Badges aktualisieren sich automatisch im Profil.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="quality" class="py-16 sm:py-20 bg-[#050a1b] border-y border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="section-title">Anti-Abuse & Qualität</h2>
            <p class="text-white/80">Klare Standards verhindern Farming und sichern verwertbares Feedback.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2" data-aos="fade-up" data-aos-delay="80">
            <article v-for="guard in qualityGuards" :key="guard.title" class="card h-full">
              <div class="flex items-center gap-3">
                <div class="wave-icon">
                  <v-icon :icon="guard.icon" class="text-cyan-300" size="22" />
                </div>
                <h3 class="text-lg font-semibold">{{ guard.title }}</h3>
              </div>
              <p class="mt-3 text-sm text-white/70">{{ guard.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="tooling" class="py-16 sm:py-20 bg-[#040814]">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="section-title">Schnelle Umsetzung (Tooling)</h2>
            <p class="text-white/80">Setup in Tagen statt Wochen – alles über bestehende Tools automatisiert.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2" data-aos="fade-up" data-aos-delay="80">
            <article v-for="tool in toolingStack" :key="tool.title" class="card h-full">
              <div class="flex items-center gap-3">
                <div class="wave-icon">
                  <v-icon :icon="tool.icon" class="text-cyan-300" size="22" />
                </div>
                <h3 class="text-lg font-semibold">{{ tool.title }}</h3>
              </div>
              <p class="mt-3 text-sm text-white/70">{{ tool.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="snippets" class="py-16 sm:py-20 bg-[#050a1b] border-y border-white/10">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="section-title">Snippets (Copy & Paste)</h2>
            <p class="text-white/80">Bereit für Discord, Release-Notes und GitHub – direkt nutzbar im Launch.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2" data-aos="fade-up" data-aos-delay="80">
            <article v-for="snippet in snippets" :key="snippet.title" class="card h-full">
              <h3 class="text-lg font-semibold">{{ snippet.title }}</h3>
              <p class="mt-2 text-sm text-white/70">{{ snippet.description }}</p>
              <div class="snippet-box mt-4">
                <code v-text="snippet.content"></code>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="extras" class="py-16 sm:py-20 bg-[#040814]">
        <div class="container-outer space-y-10">
          <div class="max-w-3xl space-y-4" data-aos="fade-up">
            <h2 class="section-title">Extras (ziehen gut)</h2>
            <p class="text-white/80">Community-Events & Aktionen, die Motivation hochhalten.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-3" data-aos="fade-up" data-aos-delay="80">
            <article v-for="extra in extras" :key="extra.title" class="card h-full">
              <div class="flex items-center gap-3">
                <div class="wave-icon">
                  <v-icon :icon="extra.icon" class="text-cyan-300" size="22" />
                </div>
                <h3 class="text-lg font-semibold">{{ extra.title }}</h3>
              </div>
              <p class="mt-3 text-sm text-white/70">{{ extra.description }}</p>
              <ul v-if="extra.details?.length" class="mt-4 space-y-2 text-sm text-white/80">
                <li v-for="detail in extra.details" :key="detail" class="flex gap-2">
                  <v-icon icon="mdi-plus-circle" size="18" class="text-emerald-400 mt-[2px]" />
                  <span>{{ detail }}</span>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="cta" class="py-16 sm:py-20 bg-[#050a1b] border-y border-white/10">
        <div class="container-outer grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
          <div class="space-y-4" data-aos="fade-up">
            <h2 class="section-title">Bereit, loszulegen?</h2>
            <p class="text-white/80">
              Sag uns, welches Paket du zuerst brauchst: Issue-Template, Discord-Setup oder Hall-of-Fame-Sektion. Wir liefern Mockups
              & Inhalte direkt nach.
            </p>
            <p class="text-sm text-white/60">
              Bonus: Persönliche Kneeboard-Skin ab 20 Punkten, Stimme/Callsign-Easter-Egg bei 35 Punkten – alles bereits visualisiert.
            </p>
          </div>
          <div class="card" data-aos="fade-left" data-aos-delay="80">
            <h3 class="text-lg font-semibold">Nächste Schritte</h3>
            <ol class="mt-4 space-y-3 text-sm text-white/80 list-decimal list-inside">
              <li>Feedback zum Proto sammeln → Slots priorisieren.</li>
              <li>Issue-Template & Form live schalten.</li>
              <li>Leaderboard im Discord #contributors ausrollen.</li>
            </ol>
            <NuxtLink
                :to="GITHUB_URL"
                external
                target="_blank"
                rel="noopener"
                class="btn btn-primary w-full mt-6"
            >
              <v-icon icon="mdi-github" size="20" />
              Repository öffnen
            </NuxtLink>
          </div>
        </div>
      </section>
    </main>

    <footer class="bg-[#03060f] border-t border-white/10 text-white" data-aos="fade-up">
      <div class="container-outer py-12 sm:py-16">
        <div class="flex flex-col gap-10">
          <div class="footer-brand">
            <div class="inline-flex items-center justify-center gap-2 sm:justify-start lg:flex-none">
              <v-icon icon="mdi-radar" size="26" class="text-cyan-400" />
              <span class="text-lg font-semibold">OpenSquawk</span>
            </div>
            <p class="mx-auto max-w-2xl text-sm text-white/70 sm:mx-0 lg:flex-1 lg:max-w-3xl">
              Community-driven AI ATC. Dieses Landing-Page-Prototyping zeigt, wie Early Access, Co-Creation und Credits künftig sichtbar werden.
            </p>
            <div class="footer-brand-actions lg:flex-none">
              <NuxtLink :to="GITHUB_URL" external target="_blank" rel="noopener" class="footer-action">
                <v-icon icon="mdi-github" size="18" class="text-white/70" />
                <span>GitHub</span>
              </NuxtLink>
              <NuxtLink to="/login" class="footer-action">
                <v-icon icon="mdi-login" size="18" class="text-white/70" />
                <span>Login</span>
              </NuxtLink>
            </div>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 class="mb-3 font-semibold">Programm</h4>
              <ul class="space-y-2 text-sm text-white/70">
                <li><NuxtLink to="#early-access" class="hover:text-cyan-300">Early Access</NuxtLink></li>
                <li><NuxtLink to="#co-creation" class="hover:text-cyan-300">Co-Creation</NuxtLink></li>
                <li><NuxtLink to="#credits" class="hover:text-cyan-300">Credits</NuxtLink></li>
              </ul>
            </div>
            <div>
              <h4 class="mb-3 font-semibold">Ressourcen</h4>
              <ul class="space-y-2 text-sm text-white/70">
                <li><NuxtLink to="#rewards" class="hover:text-cyan-300">Punkte & Rewards</NuxtLink></li>
                <li><NuxtLink to="#tooling" class="hover:text-cyan-300">Tooling</NuxtLink></li>
                <li><NuxtLink to="#snippets" class="hover:text-cyan-300">Snippets</NuxtLink></li>
              </ul>
            </div>
            <div>
              <h4 class="mb-3 font-semibold">Kontakt</h4>
              <ul class="space-y-2 text-sm text-white/70">
                <li><a href="mailto:info@opensquawk.de" class="hover:text-cyan-300">info@opensquawk.de</a></li>
                <li><NuxtLink to="/impressum" class="hover:text-cyan-300">Impressum</NuxtLink></li>
                <li><NuxtLink to="/datenschutz" class="hover:text-cyan-300">Datenschutz</NuxtLink></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/60 sm:text-left">
          © {{ year }} OpenSquawk. Nicht für reale Flugsicherung. VATSIM/IVAO: Marken der jeweiligen Eigentümer.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useHead, useRoute} from '#imports'

const GITHUB_URL = 'https://github.com/FaktorxMensch/OpenSquawk'

interface NavLink {
  label: string
  to: string
}

interface ExtendedNavLink extends NavLink {
  external?: boolean
  icon?: string
}

const navLinks: NavLink[] = [
  {label: 'Early Access', to: '#early-access'},
  {label: 'Co-Creation', to: '#co-creation'},
  {label: 'Credits', to: '#credits'},
  {label: 'Rewards', to: '#rewards'},
  {label: 'Qualität', to: '#quality'},
  {label: 'Tooling', to: '#tooling'},
  {label: 'Snippets', to: '#snippets'},
  {label: 'Extras', to: '#extras'},
]

const mobileNavLinks = computed<ExtendedNavLink[]>(() => [
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

const year = new Date().getFullYear()

interface WaveCard {
  name: string
  role: string
  icon: string
  description: string
  focus: string[]
}

const earlyAccessWaves: WaveCard[] = [
  {
    name: 'Alpha',
    role: 'Core-Tester',
    icon: 'mdi-flask',
    description: 'Basissystem stabilisieren, Crashfixes priorisieren, Edge Cases dokumentieren.',
    focus: [
      'Stabilitäts- & Performance-Checks',
      'Reproduzierbare Bugreports mit Logs',
      'Direktes Sparring mit Dev-Team',
    ],
  },
  {
    name: 'Beta',
    role: 'Feature-Tester',
    icon: 'mdi-rocket-launch',
    description: 'Neue Module aktivieren, Feature-Flags evaluieren und Regressionen melden.',
    focus: [
      'Neue Trainingsmodi abnehmen',
      'Feature-Flags aktiv testen',
      'UX-Feedback mit Mockups oder GIFs',
    ],
  },
  {
    name: 'Preview',
    role: 'Creators / Streamer',
    icon: 'mdi-video-wireless',
    description: 'Showcases vorbereiten, Community einbinden, Reichweite für Launches schaffen.',
    focus: [
      'Geführte Test-Sessions streamen',
      'Highlight-Clips & Social Posts',
      'Qualifizierte Referrals aktivieren',
    ],
  },
]

const slotCriteria = [
  '3 qualifizierte Bugreports',
  'oder 1 Testsession-Video (≥10 min)',
  'oder 3 referierte Nutzer mit validiertem Account',
]

const earlyAccessPerks = [
  'Früher Build & direkte Releases',
  'Feature-Flags für neue Module',
  'Exklusiver Discord-Channel (tower-lab)',
  'Voting-Power↑ im Community-Roadmap-Tool',
]

const betaKeyCombos = [
  {
    label: 'Bug mit Repro',
    description: 'inkl. Logs oder Clip, sauber gegliedert',
    icon: 'mdi-bug-check',
    points: 3,
  },
  {
    label: 'Testflight-Video',
    description: '≥10 Minuten, zeigt Szenario & Outcome',
    icon: 'mdi-video-outline',
    points: 4,
  },
  {
    label: 'Referral mit Session',
    description: 'Community-Mitglied schließt 1 Testflug ab',
    icon: 'mdi-account-multiple-plus',
    points: 2,
  },
]

interface StreamCard {
  title: string
  description: string
  icon: string
  details: string[]
}

const coCreationStreams: StreamCard[] = [
  {
    title: 'Feature Council',
    description: 'Monatliches Council mit Scorecard-Abstimmung und vorab geteilten Specs.',
    icon: 'mdi-account-group-outline',
    details: [
      '45 Minuten Fokus-Call, max. 12 Plätze',
      'Specs vorab, Voting via Scorecard',
      'Ergebnisse + Recording im Archiv',
    ],
  },
  {
    title: 'Content-Guilds',
    description: 'Teams für Phraseologie, Trainingskarten und Airport-Profile.',
    icon: 'mdi-book-cog-outline',
    details: [
      'VFR/IFR Phraseologie-Sets',
      'Trainingskarten & Checklisten',
      'Airport-Profiles mit Community-Review',
    ],
  },
  {
    title: 'RFC-Runden',
    description: 'Leichte RFC-Struktur: Idee einreichen, 72h Feedback, Slot fix planen.',
    icon: 'mdi-file-document-edit-outline',
    details: [
      '1-Pager Template für Vorschläge',
      '72h Community-Review & Kommentare',
      'Entscheidung + Umsetzungsslot öffentlich',
    ],
  },
]

interface CreditHighlight {
  title: string
  description?: string
  icon: string
  items?: string[]
}

const creditHighlights: CreditHighlight[] = [
  {
    title: 'Hall of Fame',
    description: 'Website & In-App („About > Contributors“) mit Callsign, Link und Beitragshistorie.',
    icon: 'mdi-star-circle',
  },
  {
    title: 'Release-Notes-Shoutouts',
    description: '„Danke an {Callsign} für Bug #123“ – jede Version listet konkrete Leistungen.',
    icon: 'mdi-bullhorn-outline',
  },
  {
    title: 'In-App-Badges',
    icon: 'mdi-shield-star-outline',
    items: ['Early Bird', 'Tower Mentor', 'Bug Hunter', 'Route Architect'],
  },
  {
    title: 'Kosmetik',
    description: 'Personalisierte Kneeboard-Skin oder eine ATC-Stimme, benannt nach dir (Top 5).',
    icon: 'mdi-headset',
  },
  {
    title: 'Invite-Codes',
    description: 'Eigene Referral-Links mit Tracking und Anzeige im Profil.',
    icon: 'mdi-link-variant',
  },
]

interface ContributionAction {
  title: string
  description?: string
  icon: string
  points: number
}

const contributionActions: ContributionAction[] = [
  {
    title: 'Bug (reproduzierbar, Log/Clip)',
    description: 'vollständige Bug-Rubrik ausgefüllt',
    icon: 'mdi-bug-check',
    points: 3,
  },
  {
    title: 'UX-Verbesserung mit Mock/GIF',
    description: 'Mockups, GIF oder Video mit klarer Empfehlung',
    icon: 'mdi-monitor-edit',
    points: 2,
  },
  {
    title: 'Testflight-Video (≥10 min)',
    description: 'kommentiertes Video oder Stream-Aufzeichnung',
    icon: 'mdi-video-outline',
    points: 4,
  },
  {
    title: 'Content-Beitrag (Karten/Checkliste)',
    description: 'Trainingskarten, Checklisten oder Phraseologie',
    icon: 'mdi-file-chart',
    points: 4,
  },
  {
    title: 'Referral (aktiv, 1 Session abgeschlossen)',
    description: 'Referral wird nach validierter Session gewertet',
    icon: 'mdi-account-multiple-plus',
    points: 2,
  },
]

interface MilestoneReward {
  points: number
  reward: string
}

const milestoneRewards: MilestoneReward[] = [
  {points: 5, reward: 'Beta-Zugang + Badge „Scout“'},
  {points: 10, reward: 'Feature-Council-Vote + Namensnennung im nächsten Release'},
  {points: 20, reward: 'Persönliche Kneeboard-Skin + „Contributor“-Rolle'},
  {points: 35, reward: 'Stimme/Callsign-Easter-Egg + „Architect“-Badge'},
]

interface GuardCard {
  title: string
  description: string
  icon: string
}

const qualityGuards: GuardCard[] = [
  {
    title: 'Bug-Rubrik Pflicht',
    description: 'Titel, Repro-Steps, Erwartet/Erhalten, Build, Logs/Clip – sonst keine Punkte.',
    icon: 'mdi-clipboard-text-outline',
  },
  {
    title: 'Review & Labels',
    description: 'Punkte erst nach Review. Labels: valid, needs-info, duplicate – transparent für alle.',
    icon: 'mdi-tag-check-outline',
  },
  {
    title: 'Referral-Gating',
    description: 'Referral zählt erst nach einer vollständigen Testsession (≥1 ATC-Interaction).',
    icon: 'mdi-account-check-outline',
  },
  {
    title: 'Anti-Farming Limit',
    description: 'Max. 1 Punkte-Reward pro Tag & Person. Leaderboard zeigt tägliche Caps.',
    icon: 'mdi-shield-lock-outline',
  },
]

interface ToolCard {
  title: string
  description: string
  icon: string
}

const toolingStack: ToolCard[] = [
  {
    title: 'GitHub-Labels + Issue-Template',
    description: 'Automatisches Labeln nach Review-Status, Template erzwingt Pflichtfelder.',
    icon: 'mdi-github',
  },
  {
    title: 'Discord Role-Bot',
    description: 'Vergibt Rollen wie „Scout“, „Contributor“, „Architect“ nach Punkten.',
    icon: 'mdi-robot-outline',
  },
  {
    title: 'Feedback-Form',
    description: '3 Pflichtfelder + Upload, schreibt Issues direkt via API.',
    icon: 'mdi-form-select',
  },
  {
    title: 'Leaderboard',
    description: 'Wöchentlich autogeneriert und im Discord #contributors gepostet.',
    icon: 'mdi-podium-gold',
  },
]

interface SnippetCard {
  title: string
  description: string
  content: string
}

const snippets: SnippetCard[] = [
  {
    title: 'Discord-Announcement',
    description: 'Kick-off-Message für #announcements.',
    content: `Wir öffnen *OpenSquawk Early Access*. Hol dir den **Beta-Key** mit 5 Punkten:
– 1 Bug mit Repro (3 P)
– 1 Testvideo ≥10 min (4 P)
– 1 Referral mit abgeschl. Session (2 P)
Punkte = Rewards: Badges, Council-Votes, eigene Kneeboard-Skin.
Mitmachen: Link → Feedback-Form | Regeln → #contribute`,
  },
  {
    title: 'Release-Notes-Credits',
    description: 'Abschnitt für Changelogs & Blogposts.',
    content: `Credits: Danke an **DLH478**, **NAX21**, **MUC_ATC** für Bugs #112/#118, IFR-Karten v0.2, Audio-Fix.`,
  },
  {
    title: 'Issue-Template (Kurz)',
    description: 'GitHub-Template mit Pflichtfeldern.',
    content: `**Build/Browser**:
**Schritte**: 1)… 2)… 3)…
**Erwartet/Erhalten**:
**Anhang**: Log/Clip/PNG (Pflicht)`,
  },
]

interface ExtraCard {
  title: string
  description: string
  icon: string
  details?: string[]
}

const extras: ExtraCard[] = [
  {
    title: 'Readback-Challenge',
    description: 'Wöchentlich 30 min, Top-3 bekommen 2 P Bonus + Shoutout.',
    icon: 'mdi-headset',
    details: ['Voting auf Discord, Ergebnis in Release-Notes'],
  },
  {
    title: 'Fix-it Friday',
    description: 'Wir fixen 3 Community-Issues live – Creator/Streamer einladen.',
    icon: 'mdi-hammer-wrench',
    details: ['Live-Coding mit Q&A', 'Follow-up im Blog mit Credits'],
  },
  {
    title: 'Your Airport, Our Trainer',
    description: 'Monatliches Voting: Gewinner-Airport erhält Trainingskarte + Namensnennung.',
    icon: 'mdi-airplane-takeoff',
    details: ['Voting offen für alle >2 Punkte', 'Veröffentlichung im Content-Hub'],
  },
]

useHead(() => ({
  htmlAttrs: {lang: 'de'},
  title: 'OpenSquawk – Community Early Access & Rewards',
  meta: [
    {
      name: 'description',
      content: 'Early-Access, Mitsprache, Credits – visuelles Proto des neuen Community-Programms von OpenSquawk.',
    },
    {name: 'theme-color', content: '#0ea5e9'},
    {property: 'og:title', content: 'OpenSquawk – Community Early Access & Rewards'},
    {
      property: 'og:description',
      content: 'Alpha-, Beta- und Preview-Wellen mit Punktesystem, Hall of Fame und Co-Creation Councils.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:image', content: 'https://opensquawk.example.com/cover.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: 'OpenSquawk – Community Early Access & Rewards'},
    {
      name: 'twitter:description',
      content: 'Punkte sammeln, Credits verdienen, Features mitentscheiden. Jetzt Proto testen.',
    },
    {name: 'twitter:image', content: 'https://opensquawk.example.com/cover.png'},
  ],
}))

onMounted(async () => {
  if (!import.meta.client) return
  // @ts-ignore Optional dependency for animation-on-scroll
  if (!('AOS' in window)) {
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
  background: radial-gradient(1200px 600px at 10% -10%, rgba(6, 182, 212, .35), transparent),
  radial-gradient(900px 480px at 100% 10%, rgba(59, 130, 246, .25), transparent),
  linear-gradient(180deg, #050914 0%, #050914 55%, #040814 100%);
}

.hero-overlay {
  background: linear-gradient(90deg, rgba(5, 9, 20, 0.95) 0%, rgba(5, 9, 20, 0.65) 45%, rgba(5, 9, 20, 0.2) 100%);
  z-index: 1;
}

.glass {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.card {
  @apply flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 transition;
}

.card:hover {
  border-color: rgba(34, 211, 238, 0.3);
  box-shadow: 0 0 30px rgba(34, 211, 238, 0.12);
}

.chip {
  @apply inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70;
}

.section-title {
  @apply text-3xl md:text-4xl font-semibold;
}

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition px-4 py-2.5 sm:px-5 sm:py-3;
}

.btn-primary {
  @apply bg-cyan-500/90 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70;
}

.btn-ghost {
  @apply border border-white/10 bg-transparent text-white/80 hover:border-cyan-300/60 hover:text-white;
}

.btn-compact {
  @apply px-4 py-2;
}

.hero-card {
  @apply border border-cyan-400/30 bg-black/40 backdrop-blur-lg;
  box-shadow: 0 0 40px rgba(8, 145, 178, 0.18);
}

.combo-item {
  @apply rounded-2xl border border-white/10 bg-white/5 px-4 py-3;
}

.combo-icon {
  @apply flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-200;
}

.combo-icon--small {
  @apply h-8 w-8;
}

.combo-icon--small .v-icon {
  @apply text-cyan-200;
}

.wave-icon {
  @apply flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10;
}

.snippet-box {
  @apply rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/80;
  white-space: pre-wrap;
}

.snippet-box code {
  white-space: pre-wrap;
  word-break: break-word;
  display: block;
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
  @apply inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10;
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

.footer-brand {
  @apply flex flex-col items-center gap-4 text-center sm:items-start sm:text-left lg:flex-row lg:items-center lg:justify-between lg:gap-8;
}

.footer-brand-actions {
  @apply flex flex-wrap items-center justify-center gap-3 sm:justify-start lg:justify-end lg:ml-auto;
}

.footer-action {
  @apply inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-400/60 hover:bg-white/10;
}

@media (max-width: 640px) {
  .combo-item {
    @apply px-3 py-2.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hamburger-bar {
    transition: none;
  }
  .mobile-nav-enter-active,
  .mobile-nav-leave-active {
    transition: none;
  }
}
</style>
