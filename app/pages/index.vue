<template>
  <div class="bg-[#0b1020] text-white antialiased selection:bg-cyan-400/30">
    <!-- NAV -->
    <header class="sticky top-0 z-50 bg-[#0b1020]/70 backdrop-blur border-b border-white/10" data-aos="fade-down">
      <nav class="container-outer py-3 flex items-center justify-between">
        <NuxtLink to="#" class="flex items-center gap-2 font-semibold tracking-tight">
          <v-icon icon="mdi-radar" size="28" class="text-cyan-400" />
          <span class="text-white">OpenSquawk</span>
        </NuxtLink>
        <div class="hidden md:flex gap-6 text-sm">
          <NuxtLink to="#features" class="hover:text-cyan-300">Vision</NuxtLink>
          <NuxtLink to="#roadmap" class="hover:text-cyan-300">Roadmap</NuxtLink>
          <NuxtLink to="#pricing" class="hover:text-cyan-300">Preise</NuxtLink>
          <NuxtLink to="#contributing" class="hover:text-cyan-300">Mitmachen</NuxtLink>
          <NuxtLink to="#faq" class="hover:text-cyan-300">FAQ</NuxtLink>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/news" class="btn btn-ghost text-sm">News</NuxtLink>
          <NuxtLink
              to="https://github.com/FaktorxMensch/OpenSquawk"
              external
              target="_blank"
              rel="noopener"
              class="btn btn-ghost text-sm"
          >
            GitHub
          </NuxtLink>
          <NuxtLink to="#cta" class="btn btn-primary text-sm">Frühzugang</NuxtLink>
        </div>
      </nav>
    </header>

    <!-- HERO -->
    <section class="gradient-hero relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute -top-24 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div class="container-outer pt-16 pb-12 md:pt-24 md:pb-20">
        <div class="max-w-2xl" data-aos="fade-up">
          <span class="chip mb-4">Alpha · Open-Source AI ATC</span>
          <h1 class="text-4xl md:text-6xl font-semibold leading-tight">
            OpenSquawk<br/>
            <span class="text-cyan-400">Open-source, low-cost AI ATC</span>
          </h1>
          <p class="mt-4 md:mt-6 text-white/80 text-base md:text-lg">
            Wir bauen eine offene, bezahlbare KI-Flugsicherung für Flugsimulatoren – community-getrieben, mit selbst gehosteten
            und gehosteten Optionen in Planung.
          </p>
          <ul class="mt-6 space-y-2 text-white/70 text-sm md:text-base">
            <li class="flex items-start gap-2">
              <v-icon icon="mdi-account-group" size="18" class="mt-[3px] text-cyan-300" />
              <span>Community-Roadmap bestimmt Prioritäten. Features landen nur, wenn sie euch wirklich helfen.</span>
            </li>
            <li class="flex items-start gap-2">
              <v-icon icon="mdi-airplane" size="18" class="mt-[3px] text-cyan-300" />
              <span><strong>Simulator-Support</strong>: MSFS zuerst, X-Plane als nächstes – mit Blick auf VATSIM-kompatible Trainings.</span>
            </li>
          </ul>
          <p class="mt-4 text-sm text-cyan-200/80">
            Alpha-Prototyp verfügbar – läuft lokal und setzt leichte Programmierkenntnisse voraus.
          </p>
          <p class="mt-2 text-sm text-white/70">
            Wir suchen Mitentwickler:innen (Node/Nuxt, ATC SMEs, Tester, Infra/Kosten). Meld dich via
            <a class="text-cyan-300 underline" href="mailto:info@opensquawk.de">info@opensquawk.de</a>.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 mt-6">
            <NuxtLink to="#cta" class="btn btn-primary text-base">Frühzugang sichern</NuxtLink>
            <NuxtLink to="/news" class="btn btn-ghost text-base">News lesen</NuxtLink>
          </div>
          <div class="mt-8 max-w-xl" data-aos="fade-up" data-aos-delay="120">
            <form class="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4" @submit.prevent="submitUpdates">
              <div class="space-y-1">
                <h3 class="text-lg font-semibold">Neue Features zuerst erfahren</h3>
                <p class="text-sm text-white/70">Trag dich in die Feature-Liste ein und erhalte Updates zu Releases, Drops & Lerninhalten.</p>
              </div>
              <div class="flex flex-col gap-3 sm:flex-row">
                <input
                    v-model.trim="updatesForm.email"
                    type="email"
                    required
                    placeholder="dein@email"
                    class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
                    aria-label="E-Mail für Produkt-Updates"
                />
                <button
                    type="submit"
                    class="btn btn-primary w-full sm:w-auto"
                    :disabled="!updatesFormValid || updatesSubmitting"
                >
                  <span v-if="updatesSubmitting" class="flex items-center gap-2">
                    <v-progress-circular indeterminate size="16" width="2" color="white" />
                    Speichere…
                  </span>
                  <span v-else>Benachrichtigt mich</span>
                </button>
              </div>
              <div class="space-y-2 text-xs text-white/60">
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="updatesForm.consentMarketing" class="mt-1" required />
                  <span>Ja, informiert mich per E-Mail über neue Features, Wartelisten-Drops & Lerninhalte.</span>
                </label>
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="updatesForm.consentPrivacy" class="mt-1" required />
                  <span>Ich habe die <NuxtLink to="/datenschutz" class="text-cyan-300 underline">Datenschutzerklärung</NuxtLink> gelesen.</span>
                </label>
              </div>
              <p v-if="updatesSuccess" class="text-sm text-green-300">Danke! Wir informieren dich, sobald neue Features live gehen.</p>
              <p v-else-if="updatesError" class="text-sm text-red-300">{{ updatesError }}</p>
              <p v-else class="text-xs text-white/50">Kein Spam – maximal relevante Produkt-Updates. Abmeldung jederzeit per Link möglich.</p>
            </form>
          </div>
        </div>
        <div class="hidden mt-10 md:mt-16" data-aos="zoom-in" data-aos-delay="100">
          <div class="card relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent"></div>
<!--            <img src="/img/simulator.jpg" alt="Cockpit" class="rounded-xl w-full object-cover" />-->
            <div class="absolute bottom-3 right-3 text-xs text-white/70 bg-black/40 px-2 py-1 rounded">Symbolbild</div>
          </div>
        </div>
      </div>
    </section>

    <!-- SOCIAL PROOF / LOGOS -->
    <section class="py-10 border-t border-white/10 bg-[#0a0f1c]" data-aos="fade-up">
      <div class="container-outer">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 items-center opacity-80 text-sm md:text-base">
          <div class="flex items-center justify-center gap-2 text-white/60"><v-icon icon="mdi-test-tube" class="opacity-70"/>Alpha-Status</div>
          <div class="flex items-center justify-center gap-2 text-white/60"><v-icon icon="mdi-microsoft-xbox" class="opacity-70"/>MSFS (Fokus)</div>
          <div class="flex items-center justify-center gap-2 text-white/60"><v-icon icon="mdi-airplane" class="opacity-70"/>X‑Plane (als nächstes)</div>
          <div class="flex items-center justify-center gap-2 text-white/60"><v-icon icon="mdi-headset" class="opacity-70"/>VATSIM-Lernpfad (geplant)</div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section id="features" class="py-16 md:py-24 bg-gradient-to-b from-[#0a0f1c] to-[#0b1020]">
      <div class="container-outer">
        <div class="max-w-2xl mb-10" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">Vision & Fokus</h2>
          <p class="mt-3 text-white/80">Open-source, low-cost AI ATC für Flugsimulatoren. Community-getriebene Features, transparente Kosten und Wahlfreiheit zwischen Self-host und späterem Hosting.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20"><v-icon icon="mdi-tower-fire" class="text-cyan-300"/></div>
              <h3 class="font-semibold text-lg">Offene AI-ATC-Grundlage</h3>
            </div>
            <p class="mt-3 text-white/80">Wir entwickeln eine erschwingliche Kernplattform für Funkanalyse, Entscheidungslogik und Voices, die jede:r inspizieren und erweitern kann.</p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20"><v-icon icon="mdi-vote" class="text-cyan-300"/></div>
              <h3 class="font-semibold text-lg">Community entscheidet</h3>
            </div>
            <p class="mt-3 text-white/80">Roadmap-Votes und Vorschläge aus der Community lenken unsere Prioritäten – Training, Tools oder Integrationen entstehen mit euch.</p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="200">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20"><v-icon icon="mdi-source-repository" class="text-cyan-300"/></div>
              <h3 class="font-semibold text-lg">Self-host & Hosted Optionen</h3>
            </div>
            <p class="mt-3 text-white/80">Beta-Ziel: eigene Instanz per Docker in Minuten oder später fair kalkulierte Hosting-Pläne – offen, transparent, bezahlbar.</p>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mt-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <h3 class="font-semibold text-lg">Simulator-Support (Plan)</h3>
            <p class="mt-3 text-white/80">Wir fokussieren zuerst Microsoft Flight Simulator, arbeiten parallel am X-Plane-Konzept und sammeln Feedback für weitere Plattformen.</p>
            <ul class="mt-3 space-y-2 text-white/70 text-sm list-disc list-inside">
              <li>MSFS Alpha: lokale Anbindung + Funkworkflows im Test</li>
              <li>X-Plane: Plugin-Skizze, Community-Review willkommen</li>
              <li>VATSIM/IVAO: Lernpfad & Phraseologie-Übungen geplant</li>
            </ul>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <h3 class="font-semibold text-lg">Alpha-Prototyp</h3>
            <p class="mt-3 text-white/80">Der aktuelle Build läuft lokal (Node/Nuxt + Services). Zum Setup brauchst du Terminal-Basics und Lust auf Experimente.</p>
            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-console"/>Setup via CLI</div>
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-docker"/>Docker Compose optional</div>
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-account-hard-hat"/>Fehler melden erwünscht</div>
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-source-branch"/>PRs & Roadmap-Votes willkommen</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- NEWS -->
    <section id="news" class="py-16 md:py-24 bg-[#0b1020] border-y border-white/10">
      <div class="container-outer space-y-8">
        <div class="max-w-2xl" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">News & Updates</h2>
          <p class="mt-3 text-white/80">Content-driven Beiträge halten dich auf dem Laufenden. Alle Artikel liegen als Markdown vor – neue Stories landen automatisch hier.</p>
        </div>
        <div v-if="latestNews.length" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article
              v-for="post in latestNews"
              :key="post.slug"
              class="card flex flex-col gap-4"
              data-aos="fade-up"
          >
            <div class="space-y-2">
              <span class="chip text-[10px] uppercase tracking-[0.3em]">{{ formatNewsDate(post.publishedAt) }}</span>
              <h3 class="text-xl font-semibold">{{ post.title }}</h3>
              <p class="text-sm text-white/70">{{ post.excerpt }}</p>
            </div>
            <div class="mt-auto flex items-center justify-between text-xs text-white/60">
              <span>{{ post.readingTime }}</span>
              <NuxtLink :to="`/news/${post.slug}`" class="text-cyan-300 text-sm font-medium hover:underline">Weiterlesen</NuxtLink>
            </div>
          </article>
        </div>
        <div v-else class="card text-sm text-white/70" data-aos="fade-up">
          Noch keine News veröffentlicht – der erste Beitrag folgt in Kürze.
        </div>
        <div class="flex items-center gap-3" data-aos="fade-up">
          <NuxtLink to="/news" class="btn btn-ghost">Alle News ansehen</NuxtLink>
          <span class="text-xs text-white/50">Schreib uns, falls du eigene Erfahrungsberichte teilen willst.</span>
        </div>
      </div>
    </section>

    <!-- ROADMAP -->
    <section id="roadmap" class="py-16 md:py-24 bg-[#0b1020] border-y border-white/10">
      <div class="container-outer space-y-10">
        <div class="max-w-3xl" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">Roadmap & Community-Voting</h2>
          <p class="mt-3 text-white/80">
            Stimme ab, was als Nächstes Priorität bekommt. Wir kombinieren die Votes mit Zeitstempel, um Features für Training,
            Immersion und Infrastruktur zu planen.
          </p>
          <div class="mt-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            <v-icon icon="mdi-account-group" size="18" class="text-cyan-300" />
            <span>
              {{ formatNumber(roadmapTotals) }} abgegebene Stimmen · letzte 7 Tage: +{{ formatNumber(roadmapRecent7Days) }}
            </span>
          </div>
        </div>

        <div class="space-y-6">
          <div v-if="roadmapLoading" class="card text-white/70" data-aos="fade-up">
            Wir laden die aktuellen Roadmap-Prioritäten…
          </div>
          <template v-else>
            <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div
                  v-for="item in roadmapItems"
                  :key="item.key"
                  class="card flex flex-col gap-4"
                  data-aos="fade-up"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <span class="chip text-[10px] uppercase tracking-[0.3em]">{{ item.category }}</span>
                    <h3 class="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <v-icon v-if="item.icon" :icon="item.icon" size="22" class="text-cyan-300" />
                      <span>{{ item.title }}</span>
                    </h3>
                  </div>
                  <div class="text-right text-xs text-white/60 space-y-1">
                    <div class="text-sm font-semibold text-white">
                      <template v-if="item.averageImportance !== null">
                        {{ formatAverage(item.averageImportance) }}/5
                      </template>
                      <template v-else>—</template>
                    </div>
                    <div>{{ formatNumber(item.votes) }} Stimmen</div>
                    <div v-if="item.lastVoteAt" class="text-white/40">zuletzt {{ formatRelativeFromNow(item.lastVoteAt) }}</div>
                    <div v-else class="text-white/40">noch keine Stimmen</div>
                  </div>
                </div>
                <p class="text-sm text-white/70">{{ item.description }}</p>
                <div class="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div class="h-2 rounded-full bg-cyan-400 transition-all" :style="{ width: `${item.scorePercent}%` }" />
                </div>
                <div class="space-y-3">
                  <div class="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/50">
                    <span>Priorität wählen</span>
                    <span v-if="roadmapTouched[item.key]" class="text-cyan-300">markiert</span>
                  </div>
                  <div class="roadmap-scale" role="group" :aria-label="`Priorität für ${item.title}`">
                    <button
                        v-for="value in ROADMAP_SCALE"
                        :key="value"
                        type="button"
                        class="roadmap-pill"
                        :class="{ 'is-active': roadmapSelections[item.key] === value }"
                        :aria-pressed="roadmapSelections[item.key] === value"
                        @click="selectRoadmapImportance(item.key, value)"
                    >
                      <span class="text-sm font-semibold">{{ value }}</span>
                      <span class="label">{{ roadmapImportanceShortLabel(value) }}</span>
                    </button>
                  </div>
                  <div class="text-sm text-white/80">
                    {{ roadmapImportanceLabel(roadmapSelections[item.key]) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="card flex flex-col gap-4 border-white/10 bg-white/5 md:flex-row md:items-center md:justify-between" data-aos="fade-up">
              <div class="space-y-2">
                <h4 class="text-lg font-semibold">Deine Auswahl speichern</h4>
                <p class="text-sm text-white/70">
                  Wir speichern jede Stimme einzeln mit Zeitpunkt – so sehen wir, was euch gerade wichtig ist. Du kannst mehrere Karten anpassen und alles gemeinsam absenden.
                </p>
              </div>
              <div class="flex w-full flex-col gap-2 md:w-auto">
                <button
                    type="button"
                    class="btn btn-primary w-full md:w-auto"
                    @click="submitRoadmapVotes"
                    :disabled="!hasRoadmapVote || roadmapSubmitting"
                >
                  <span v-if="roadmapSubmitting" class="flex items-center gap-2">
                    <v-progress-circular indeterminate size="16" width="2" color="white" />
                    Speichere Stimmen…
                  </span>
                  <span v-else>Stimmen abschicken</span>
                </button>
                <p v-if="roadmapSuccess" class="text-center text-sm text-green-300 md:text-left">Danke! Deine Stimmen sind angekommen.</p>
                <p v-else-if="roadmapError" class="text-center text-sm text-red-300 md:text-left">{{ roadmapError }}</p>
                <p v-else class="text-center text-xs text-white/50 md:text-left">
                  Tipp: Prioritäten nur anpassen, wenn du zu dem Punkt Feedback hast.
                </p>
              </div>
            </div>
          </template>
          <div class="card space-y-4" data-aos="fade-up">
            <div class="space-y-2">
              <h4 class="text-lg font-semibold">Fehlt dir etwas in der Roadmap?</h4>
              <p class="text-sm text-white/70">Teile deinen Feature-Wunsch oder ein Problem, das wir lösen sollen. Wir priorisieren Community-Ideen.</p>
            </div>
            <form class="space-y-3" @submit.prevent="submitRoadmapSuggestion">
              <input
                  v-model.trim="roadmapSuggestionForm.title"
                  type="text"
                  required
                  placeholder="Kurzer Titel – z. B. 'ATIS-Integration für EDDF'"
                  class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
                  aria-label="Titel für Roadmap-Vorschlag"
              />
              <textarea
                  v-model.trim="roadmapSuggestionForm.details"
                  rows="4"
                  required
                  placeholder="Beschreibe, warum das wichtig ist oder wie es dir helfen würde."
                  class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <div class="grid gap-3 sm:grid-cols-2">
                <input
                    v-model.trim="roadmapSuggestionForm.email"
                    type="email"
                    placeholder="E-Mail (optional)"
                    class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
                />
                <label class="flex items-start gap-3 text-xs text-white/60">
                  <input
                      type="checkbox"
                      v-model="roadmapSuggestionForm.allowContact"
                      class="mt-1"
                      :disabled="!roadmapSuggestionForm.email"
                  />
                  <span>Gern per E-Mail nachhaken, falls Rückfragen auftauchen.</span>
                </label>
              </div>
              <label class="flex items-start gap-3 text-xs text-white/60">
                <input type="checkbox" v-model="roadmapSuggestionForm.consentPrivacy" class="mt-1" required />
                <span>Ich habe die <NuxtLink to="/datenschutz" class="text-cyan-300 underline">Datenschutzerklärung</NuxtLink> gelesen und willige in die Verarbeitung meines Vorschlags ein.</span>
              </label>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="submit"
                    class="btn btn-primary w-full sm:w-auto"
                    :disabled="!roadmapSuggestionFormValid || roadmapSuggestionSubmitting"
                >
                  <span v-if="roadmapSuggestionSubmitting" class="flex items-center gap-2">
                    <v-progress-circular indeterminate size="16" width="2" color="white" />
                    Sende Vorschlag…
                  </span>
                  <span v-else>Vorschlag senden</span>
                </button>
                <p v-if="roadmapSuggestionSuccess" class="text-sm text-green-300">Danke! Wir prüfen deinen Vorschlag und melden uns ggf. zurück.</p>
                <p v-else-if="roadmapSuggestionError" class="text-sm text-red-300">{{ roadmapSuggestionError }}</p>
                <p v-else class="text-xs text-white/50">Wir lesen jeden Vorschlag persönlich. Optionales Kontaktfeld nur für Rückfragen.</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- LEARN PATH -->
    <section id="learn" class="py-16 md:py-24 bg-[#0b1020]">
      <div class="container-outer">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div data-aos="fade-right">
            <h2 class="text-3xl md:text-4xl font-semibold">Lernpfad (in Arbeit)</h2>
            <p class="mt-3 text-white/80">Gemeinsam mit der Community strukturieren wir Trainingsmodule – vom ersten Funkkontakt bis zu Netzwerken wie VATSIM. Feedback aus Tests fließt direkt in jedes Kapitel.</p>
            <ol class="mt-5 space-y-3 text-white/80">
              <li class="flex gap-3"><span class="chip">1</span><span><b>Basics</b> (Konzept): Funkalphabet, Zahlen, Standard-Readbacks.</span></li>
              <li class="flex gap-3"><span class="chip">2</span><span><b>Ground</b> (Alpha): Taxi-Flows, Hotspots, Holding-short.</span></li>
              <li class="flex gap-3"><span class="chip">3</span><span><b>Departure</b> (geplant): SID-Handling, Altitude-/Speed-Calls.</span></li>
              <li class="flex gap-3"><span class="chip">4</span><span><b>Arrival</b> (geplant): STARs, Vectors, Approach-Briefing.</span></li>
              <li class="flex gap-3"><span class="chip">5</span><span><b>VATSIM</b> (Community-Beta): Checklisten, Etiquette, Live-Übungen.</span></li>
            </ol>
            <div class="mt-6 flex gap-3">
              <NuxtLink to="#roadmap" class="btn btn-primary">Roadmap ansehen</NuxtLink>
              <NuxtLink to="/news" class="btn btn-ghost">News lesen</NuxtLink>
            </div>
          </div>
          <div class="card" data-aos="fade-left">
            <nuxt-img src="/img/landing/runway.jpeg" alt="Runway" class="rounded-lg w-full object-cover" />
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING -->
    <section id="pricing" class="py-16 md:py-24 bg-gradient-to-b from-[#0b1020] to-[#0a0f1c]">
      <div class="container-outer">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4" data-aos="fade-up">
          <div class="max-w-2xl">
            <h2 class="text-3xl md:text-4xl font-semibold">Preise (Zielbild)</h2>
            <p class="mt-3 text-white/80">Wir arbeiten an einer fairen Kalkulation für Hosting. Zahlen unten sind grobe Zielwerte – Feedback willkommen.
              <button @click="yearly=!yearly" class="chip ml-2"><span>{{ yearly ? 'jährlich' : 'monatlich' }}</span></button>
            </p>
          </div>
        </div>

        <div class="mt-8 grid md:grid-cols-3 gap-6">
          <!-- OSS -->
          <div class="card relative" data-aos="fade-up" data-aos-delay="0">
            <div class="absolute -top-3 right-4 chip">Community</div>
            <h3 class="text-xl font-semibold">Open‑Source (Self‑host)</h3>
            <p class="mt-2 text-white/80">Volle Kontrolle. Eigene Infrastruktur. API‑Keys selbst verwalten.</p>
            <div class="mt-5 text-3xl font-semibold">0€<span class="text-white/60 text-sm font-normal"> / immer</span></div>
            <ul class="mt-5 space-y-2 text-white/80 text-sm">
              <li>✔ Voller Funktionsumfang</li>
              <li>✔ Plugins & SDK</li>
              <li>✔ Community‑Support</li>
            </ul>
            <NuxtLink
                to="https://github.com/FaktorxMensch/OpenSquawk"
                external
                target="_blank"
                rel="noopener"
                class="btn btn-ghost w-full mt-6"
            >
              Repository ansehen
            </NuxtLink>
          </div>
          <!-- Hosted Basic -->
          <div class="card border-2 border-cyan-400/40 relative shadow-[0_0_40px_rgba(34,211,238,.25)]" data-aos="fade-up" data-aos-delay="100">
            <div class="absolute -top-3 right-4 chip bg-cyan-500/30 border-cyan-400/50">Empfohlen</div>
            <h3 class="text-xl font-semibold">Hosted – Basic</h3>
            <p class="mt-2 text-white/80">Geplanter Rundum-Service: Kein Setup, Updates inklusive. Aktuell nur als Konzept.</p>
            <div class="mt-5 text-3xl font-semibold"><span>{{ yearly ? '≈4€' : '≈4,50€' }}</span><span class="text-white/60 text-sm font-normal"> / Monat*</span></div>
            <ul class="mt-5 space-y-2 text-white/80 text-sm">
              <li>✔ Fair-Use Audio-Minuten (Ausarbeitung)</li>
              <li>✔ Lernpfad & Fortschritt (abhängig von Community-Feedback)</li>
              <li>✔ Updates & Cloud-Scaling (Kostenmodell in Arbeit)</li>
            </ul>
            <NuxtLink to="#cta" class="btn btn-primary w-full mt-6">Interesse melden</NuxtLink>
            <p class="mt-3 text-xs text-white/60">* Zielwert, finale Preise folgen nach Kostentest.</p>
          </div>
          <!-- Hosted Pro -->
          <div class="card relative" data-aos="fade-up" data-aos-delay="200">
            <div class="absolute -top-3 right-4 chip">Power‑User</div>
            <h3 class="text-xl font-semibold">Hosted – Pro</h3>
            <p class="mt-2 text-white/80">Konzept für größere Gruppen & virtuelle Airlines. Preise werden gemeinsam kalkuliert.</p>
            <div class="mt-5 text-3xl font-semibold"><span>{{ yearly ? '≈12€' : '≈14€' }}</span><span class="text-white/60 text-sm font-normal"> / Monat*</span></div>
            <ul class="mt-5 space-y-2 text-white/80 text-sm">
              <li>✔ Höhere Limits (nach Bedarf)</li>
              <li>✔ Team-Seats & Rollen (Diskussion offen)</li>
              <li>✔ Priorisierter Support (Community + optional SLA)</li>
            </ul>
            <NuxtLink to="#cta" class="btn btn-ghost w-full mt-6">Kontakt aufnehmen</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- OPEN SOURCE -->
    <section id="opensource" class="py-16 md:py-24 bg-[#0a0f1c]">
      <div class="container-outer">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div data-aos="fade-right">
            <h2 class="text-3xl md:text-4xl font-semibold">Open‑Source, Community‑getrieben</h2>
            <p class="mt-3 text-white/80">Transparente Architektur, klare Roadmap, offene Issues. Baue eigene Voices, Integrationen und Workflows.</p>
            <ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <li class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-license"/>MIT/Apache‑Lizenz (tbd)</li>
              <li class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-docker"/>Docker‑Compose / Helm</li>
              <li class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-puzzle"/>Plugin‑SDK (TS/JS)</li>
              <li class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-console"/>CLI & REST API</li>
            </ul>
            <div class="mt-6 flex flex-col sm:flex-row gap-3">
              <NuxtLink to="#cta" class="btn btn-primary">Mitmachen</NuxtLink>
              <NuxtLink
                  to="https://github.com/OpenSquawk/OpenSquawk"
                  external
                  target="_blank"
                  rel="noopener"
                  class="btn btn-ghost"
              >
                GitHub-Repository
              </NuxtLink>
              <NuxtLink to="/news" class="btn btn-ghost">News</NuxtLink>
            </div>
          </div>
          <div class="card" data-aos="fade-left">
            <pre class="text-xs md:text-sm overflow-x-auto"><code>// Beispiel: REST‑Route für Taxi‑Routen
POST /api/route/taxi
{
  "icao": "EDDF",
  "from": { "type": "gate", "ref": "A20" },
  "to":   { "type": "runway", "ref": "25C" }
}
// → Antwort: Liste der Segmente, Geometrie, Readback‑Vorschlag</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="py-16 md:py-24 bg-[#0b1020]">
      <div class="container-outer">
        <div class="max-w-2xl mb-10" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">So funktioniert’s</h2>
          <p class="mt-3 text-white/80">Audio rein → Verständnis → Antwort raus. Designed für niedrige Latenz & klare Funk‑Disziplin.</p>
        </div>
        <div class="grid md:grid-cols-4 gap-4 md:gap-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0"><h3 class="font-semibold flex items-center gap-2"><v-icon icon="mdi-waveform"/>1 · ASR</h3><p class="mt-2 text-white/80">Streaming‑Speech‑to‑Text mit Funk‑Tuning.</p></div>
          <div class="card" data-aos="fade-up" data-aos-delay="100"><h3 class="font-semibold flex items-center gap-2"><v-icon icon="mdi-brain"/>2 · NLU</h3><p class="mt-2 text-white/80">LLM versteht Intention, Kontext, State.</p></div>
          <div class="card" data-aos="fade-up" data-aos-delay="200"><h3 class="font-semibold flex items-center gap-2"><v-icon icon="mdi-logic-gate-and"/>3 · Logic</h3><p class="mt-2 text-white/80">Regeln, Flugdaten, Taxi‑Routing, Validierung.</p></div>
          <div class="card" data-aos="fade-up" data-aos-delay="300"><h3 class="font-semibold flex items-center gap-2"><v-icon icon="mdi-microphone"/>4 · TTS</h3><p class="mt-2 text-white/80">Natürliches Voice‑Out mit korrekten Zahlen.</p></div>
        </div>
      </div>
    </section>

    <!-- CONTRIBUTING -->
    <section id="contributing" class="py-16 md:py-24 bg-[#0a0f1c] border-y border-white/10">
      <div class="container-outer">
        <div class="grid md:grid-cols-2 gap-8 items-start">
          <div data-aos="fade-right">
            <h2 class="text-3xl md:text-4xl font-semibold">Mitentwickeln</h2>
            <p class="mt-3 text-white/80">Issues labeled <code class="text-xs bg-white/10 px-1.5 py-0.5 rounded">help-wanted</code> markieren Aufgaben, bei denen wir Support brauchen. Alles passiert offen auf GitHub.</p>
            <ul class="mt-5 space-y-3 text-white/80 text-sm">
              <li class="flex gap-3"><v-icon icon="mdi-nodejs" class="text-cyan-300 mt-[2px]"/><span>Node/Nuxt Devs für Backend & Frontend.</span></li>
              <li class="flex gap-3"><v-icon icon="mdi-headset" class="text-cyan-300 mt-[2px]"/><span>ATC SMEs für Phraseologie, Verfahren und Trainingsfeedback.</span></li>
              <li class="flex gap-3"><v-icon icon="mdi-test-tube" class="text-cyan-300 mt-[2px]"/><span>Tester:innen für Alpha-Builds & Simulator-Integration.</span></li>
              <li class="flex gap-3"><v-icon icon="mdi-cash-multiple" class="text-cyan-300 mt-[2px]"/><span>Infra- & Kosten-Benchmarking, damit Hosting bezahlbar bleibt.</span></li>
            </ul>
            <p class="mt-5 text-sm text-white/70">Schreib uns an <a href="mailto:info@opensquawk.de" class="text-cyan-300 underline">info@opensquawk.de</a> oder kommentiere direkt im Issue.</p>
            <div class="mt-6 flex gap-3">
              <NuxtLink to="#roadmap" class="btn btn-primary">Roadmap mitgestalten</NuxtLink>
              <NuxtLink to="/news" class="btn btn-ghost">Neuigkeiten</NuxtLink>
            </div>
          </div>
          <div class="card" data-aos="fade-left">
            <h3 class="font-semibold text-lg">Aktuelle Fokus-Themen</h3>
            <ul class="mt-3 space-y-2 text-white/70 text-sm list-disc list-inside">
              <li>Alpha-Prototyp stabilisieren & Setup vereinfachen</li>
              <li>MSFS & X-Plane Anbindung verifizieren</li>
              <li>Roadmap-Ideen bewerten & priorisieren</li>
              <li>Kostenmodell für Hosting durchrechnen</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section id="cta" class="py-16 md:py-24 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent border-y border-white/10">
      <div class="container-outer">
        <div class="card grid gap-8 md:grid-cols-2" data-aos="zoom-in">
          <div class="space-y-4">
            <div>
              <h3 class="text-2xl md:text-3xl font-semibold">Frühzugang & Warteliste</h3>
              <p class="mt-2 text-white/80">
                Trag dich ein und sichere dir deinen Platz für den Alpha-Build. Aktuell (inkl. interner Tests) warten
                <span class="font-semibold text-cyan-300">{{ waitlistCountDisplay }}</span>
                Interessierte auf den nächsten Invite-Drop.
              </p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-4">
              <div v-if="waitlistLoading" class="text-sm text-white/60">Lade Warteliste…</div>
              <template v-else>
                <div class="grid gap-3 sm:grid-cols-3">
                  <div class="glass rounded-xl p-3">
                    <div class="text-[11px] uppercase tracking-[0.3em] text-white/50">Neu (7 Tage)</div>
                    <div class="mt-1 text-lg font-semibold text-white">+{{ formatNumber(waitlistRecent7) }}</div>
                    <div class="text-xs text-white/50">aktive Lernplätze</div>
                  </div>
                  <div class="glass rounded-xl p-3">
                    <div class="text-[11px] uppercase tracking-[0.3em] text-white/50">Neu (30 Tage)</div>
                    <div class="mt-1 text-lg font-semibold text-white">+{{ formatNumber(waitlistRecent30) }}</div>
                    <div class="text-xs text-white/50">Langfristiger Zufluss</div>
                  </div>
                  <div class="glass rounded-xl p-3">
                    <div class="text-[11px] uppercase tracking-[0.3em] text-white/50">Sichtbarer Puffer</div>
                    <div class="mt-1 text-lg font-semibold text-white">+{{ formatNumber(waitlistSyntheticBoost) }}</div>
                    <div class="text-xs text-white/50">Reserve für nächste Drops</div>
                  </div>
                </div>
                <div class="text-xs text-white/60">
                  Letzte Anmeldung:
                  <span class="font-medium text-white">{{ waitlistLastJoinedFormatted }}</span>
                  <span v-if="waitlistStats?.lastJoinedAt" class="text-white/40">
                    ({{ formatRelativeFromNow(waitlistStats?.lastJoinedAt) }})
                  </span>
                </div>
              </template>
            </div>
            <p class="text-xs text-white/60">
              Wir senden Einladungen in Batches, priorisieren aktive Wartelistenplätze und verschicken Einladungscodes per E-Mail.
            </p>
          </div>
          <form class="space-y-4" @submit.prevent="submitWaitlist">
            <div class="grid gap-3">
              <input
                  v-model.trim="waitlistForm.name"
                  aria-label="Name"
                  type="text"
                  placeholder="Vor- und Nachname (optional)"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <input
                  v-model.trim="waitlistForm.email"
                  aria-label="E-Mail"
                  type="email"
                  required
                  placeholder="dein@email"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <textarea
                  v-model.trim="waitlistForm.notes"
                  rows="3"
                  placeholder="Was möchtest du mit OpenSquawk lernen? (optional)"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 placeholder-white/40 outline-none focus:border-cyan-400"
              />
            </div>
            <div class="space-y-2 text-xs text-white/60">
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.subscribeUpdates" class="mt-1" />
                <span>Ja, informiert mich, wenn neue Features, Drops oder Lerninhalte starten.</span>
              </label>
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.consentTerms" class="mt-1" required />
                <span>
                  Ich akzeptiere die <NuxtLink to="/agb" class="text-cyan-300 underline">AGB</NuxtLink> von OpenSquawk.
                </span>
              </label>
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.consentPrivacy" class="mt-1" required />
                <span>
                  Ich habe die <NuxtLink to="/datenschutz" class="text-cyan-300 underline">Datenschutzerklärung</NuxtLink> gelesen und willige in die Speicherung meiner Angaben zur Kontaktaufnahme ein.
                </span>
              </label>
            </div>
            <button
                type="submit"
                class="btn btn-primary w-full"
                :disabled="!waitlistFormValid || waitlistSubmitting"
            >
              <span v-if="waitlistSubmitting" class="flex items-center gap-2">
                <v-progress-circular indeterminate size="16" width="2" color="white" />
                Sende Daten…
              </span>
              <span v-else>Auf Warteliste setzen</span>
            </button>
            <p v-if="waitlistSuccess" class="text-sm text-green-300">
              Danke! Wir haben dich auf der Warteliste eingetragen und melden uns, sobald Plätze frei werden.
              <span v-if="waitlistLastOptInUpdates" class="mt-1 block text-xs text-green-200/80">Zusätzlich erhältst du Produkt-Updates, sobald neue Features live gehen.</span>
            </p>
            <p v-else-if="waitlistError" class="text-sm text-red-300">{{ waitlistError }}</p>
          </form>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="py-16 md:py-24 bg-[#0a0f1c]">
      <div class="container-outer">
        <div class="max-w-2xl mb-10" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">FAQ</h2>
          <p class="mt-3 text-white/80">Kurz beantwortet.</p>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <h3 class="font-semibold">Ist das für reale Luftfahrt?</h3>
            <p class="mt-2 text-white/80">Nein, OpenSquawk ist für Flugsimulatoren und Training. Nicht für den realen Flugfunk.</p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <h3 class="font-semibold">Welche Simulatoren werden unterstützt?</h3>
            <p class="mt-2 text-white/80">MSFS zuerst (Alpha-Fokus), X‑Plane als nächstes. Weitere Simulatoren richten wir nach Community-Bedarf aus.</p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="200">
            <h3 class="font-semibold">Kann ich selbst hosten?</h3>
            <p class="mt-2 text-white/80">Alpha: Docker-Compose + Node-Services sind verfügbar. Doku & Installer werden gerade ergänzt. Hosting-Optionen folgen.</p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="300">
            <h3 class="font-semibold">Wie günstig ist „Hosted – Basic“?</h3>
            <p class="mt-2 text-white/80">Zielwert aktuell ~4–5 € monatlich, final nach Kosten-Benchmarking. Wir teilen Ergebnisse transparent im Blog.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="py-12 bg-[#0b1020] border-t border-white/10" data-aos="fade-up">
      <div class="container-outer">
        <div class="grid md:grid-cols-4 gap-6">
          <div>
            <div class="flex items-center gap-2 font-semibold"><v-icon icon="mdi-radar" class="text-cyan-400"/>OpenSquawk</div>
            <p class="mt-3 text-white/70 text-sm">Open-source, low-cost AI ATC für Flugsimulatoren. Alpha-Prototyp verfügbar – benötigt leichte Programmierkenntnisse.</p>
          </div>
          <div>
            <h4 class="font-semibold mb-3">Produkt</h4>
            <ul class="space-y-2 text-white/70 text-sm">
              <li><NuxtLink to="#features" class="hover:text-cyan-300">Vision</NuxtLink></li>
              <li><NuxtLink to="#learn" class="hover:text-cyan-300">Lernpfad</NuxtLink></li>
              <li><NuxtLink to="#pricing" class="hover:text-cyan-300">Preise</NuxtLink></li>
              <li><NuxtLink to="#faq" class="hover:text-cyan-300">FAQ</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-3">Ressourcen</h4>
            <ul class="space-y-2 text-white/70 text-sm">
              <li><NuxtLink to="#opensource" class="hover:text-cyan-300">Open‑Source</NuxtLink></li>
              <li><NuxtLink to="#news" class="hover:text-cyan-300">News</NuxtLink></li>
              <li><NuxtLink to="#contributing" class="hover:text-cyan-300">Mitmachen</NuxtLink></li>
              <li><a href="mailto:info@opensquawk.de" class="hover:text-cyan-300">info@opensquawk.de</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-3">Rechtliches</h4>
            <ul class="space-y-2 text-white/70 text-sm">
              <li><NuxtLink to="/impressum" class="hover:text-cyan-300">Impressum</NuxtLink></li>
              <li><NuxtLink to="/datenschutz" class="hover:text-cyan-300">Datenschutz</NuxtLink></li>
              <li><NuxtLink to="/agb" class="hover:text-cyan-300">AGB</NuxtLink></li>
              <li><NuxtLink to="/api-docs" class="hover:text-cyan-300">API-Dokumentation</NuxtLink></li>
            </ul>
          </div>
        </div>
        <div class="mt-8 pt-6 border-t border-white/10 text-xs text-white/60">© {{ year }} OpenSquawk. Nicht für reale Luftfahrt. *VATSIM/IVAO: Marken der jeweiligen Eigentümer.</div>
      </div>
    </footer>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useHead } from '#imports'
import { useApi } from '~/composables/useApi'
import { getAllNews } from '~~/shared/utils/news'
import type { NewsPost } from '~~/shared/utils/news'

const api = useApi()

const numberFormatter = new Intl.NumberFormat('de-DE')
const formatNumber = (value: number | null | undefined) => numberFormatter.format(Math.max(0, Math.round(value ?? 0)))
const ROADMAP_SCALE = [1, 2, 3, 4, 5] as const

interface WaitlistStats {
  count: number
  displayCount: number
  syntheticBoost: number
  recent7Days: number
  recent30Days: number
  lastJoinedAt: string | null
  generatedAt: string
}

interface RoadmapItemWithStats {
  key: string
  title: string
  description: string
  category: string
  icon: string
  votes: number
  averageImportance: number | null
  scorePercent: number
  lastVoteAt: string | null
}

interface RoadmapResponse {
  items: RoadmapItemWithStats[]
  totalVotes: number
  recentVotes7Days: number
}

const yearly = ref(true)
const year = new Date().getFullYear()

const waitlistForm = reactive({
  name: '',
  email: '',
  notes: '',
  consentPrivacy: false,
  consentTerms: false,
  subscribeUpdates: false,
})

const waitlistSubmitting = ref(false)
const waitlistSuccess = ref(false)
const waitlistError = ref('')
const waitlistLastOptInUpdates = ref(false)
const waitlistStats = ref<WaitlistStats | null>(null)
const waitlistLoading = ref(false)

const updatesForm = reactive({
  email: '',
  consentPrivacy: false,
  consentMarketing: false,
})
const updatesSubmitting = ref(false)
const updatesSuccess = ref(false)
const updatesError = ref('')

const roadmapSuggestionForm = reactive({
  title: '',
  details: '',
  email: '',
  allowContact: false,
  consentPrivacy: false,
})
const roadmapSuggestionSubmitting = ref(false)
const roadmapSuggestionSuccess = ref(false)
const roadmapSuggestionError = ref('')

const allNewsEntries = computed<NewsPost[]>(() => getAllNews())
const latestNews = computed<NewsPost[]>(() => allNewsEntries.value.slice(0, 3))

const waitlistCountDisplay = computed(() => formatNumber(waitlistStats.value?.displayCount ?? 0))
const waitlistRecent7 = computed(() => waitlistStats.value?.recent7Days ?? 0)
const waitlistRecent30 = computed(() => waitlistStats.value?.recent30Days ?? 0)
const waitlistSyntheticBoost = computed(() => waitlistStats.value?.syntheticBoost ?? 0)
const waitlistLastJoinedFormatted = computed(() => {
  const iso = waitlistStats.value?.lastJoinedAt
  if (!iso) return '–'
  return formatWaitlistDate(iso)
})
const waitlistFormValid = computed(() =>
  Boolean(waitlistForm.email && waitlistForm.consentPrivacy && waitlistForm.consentTerms)
)
const updatesFormValid = computed(() =>
  Boolean(updatesForm.email && updatesForm.consentPrivacy && updatesForm.consentMarketing)
)
const roadmapSuggestionFormValid = computed(() => {
  const title = roadmapSuggestionForm.title.trim()
  const details = roadmapSuggestionForm.details.trim()
  const email = roadmapSuggestionForm.email.trim()
  const wantsContact = roadmapSuggestionForm.allowContact

  return (
    title.length >= 4 &&
    details.length >= 20 &&
    roadmapSuggestionForm.consentPrivacy &&
    (!wantsContact || email.length > 0)
  )
})

watch(
  () => roadmapSuggestionForm.email,
  (value) => {
    if (!value) {
      roadmapSuggestionForm.allowContact = false
    }
  },
)


async function loadWaitlistStats() {
  try {
    waitlistLoading.value = true
    const data = (await api.get('/api/service/waitlist', { auth: false })) as WaitlistStats
    waitlistStats.value = data
  } catch (err) {
    console.warn('Waitlist stats unavailable', err)
  } finally {
    waitlistLoading.value = false
  }
}

async function submitWaitlist() {
  if (!waitlistFormValid.value || waitlistSubmitting.value) return

  waitlistSubmitting.value = true
  waitlistError.value = ''
  waitlistSuccess.value = false
  waitlistLastOptInUpdates.value = false

  try {
    const wantsProductUpdates = waitlistForm.subscribeUpdates
    await api.post(
      '/api/service/waitlist',
      {
        name: waitlistForm.name,
        email: waitlistForm.email,
        notes: waitlistForm.notes,
        consentPrivacy: waitlistForm.consentPrivacy,
        consentTerms: waitlistForm.consentTerms,
        wantsProductUpdates,
      },
      { auth: false },
    )
    waitlistLastOptInUpdates.value = wantsProductUpdates
    waitlistSuccess.value = true
    await loadWaitlistStats()
    waitlistForm.name = ''
    waitlistForm.email = ''
    waitlistForm.notes = ''
    waitlistForm.consentPrivacy = false
    waitlistForm.consentTerms = false
    waitlistForm.subscribeUpdates = false
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Anmeldung fehlgeschlagen'
    waitlistError.value = message
  } finally {
    waitlistSubmitting.value = false
  }
}

async function submitUpdates() {
  if (!updatesFormValid.value || updatesSubmitting.value) return

  updatesSubmitting.value = true
  updatesError.value = ''
  updatesSuccess.value = false

  try {
    await api.post(
      '/api/service/updates',
      {
        email: updatesForm.email,
        consentPrivacy: updatesForm.consentPrivacy,
        consentMarketing: updatesForm.consentMarketing,
        source: 'landing-hero',
      },
      { auth: false },
    )
    updatesSuccess.value = true
    updatesForm.email = ''
    updatesForm.consentPrivacy = false
    updatesForm.consentMarketing = false
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Konnte Anmeldung nicht speichern'
    updatesError.value = message
  } finally {
    updatesSubmitting.value = false
  }
}

const formatWaitlistDate = (iso: string) => {
  if (!iso) return 'unbekannt'
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatRelativeFromNow = (iso?: string | null) => {
  if (!iso) return '–'
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return '–'
  const diff = Date.now() - target.getTime()
  const minute = 1000 * 60
  const hour = minute * 60
  const day = hour * 24
  if (diff < minute) return 'gerade eben'
  if (diff < hour) {
    const mins = Math.round(diff / minute)
    return `vor ${mins} Min`
  }
  if (diff < day) {
    const hours = Math.round(diff / hour)
    return `vor ${hours} Std`
  }
  if (diff < day * 14) {
    const days = Math.round(diff / day)
    return `vor ${days} Tag${days === 1 ? '' : 'en'}`
  }
  const weeks = Math.round(diff / (day * 7))
  if (weeks < 9) {
    return `vor ${weeks} Woche${weeks === 1 ? '' : 'n'}`
  }
  const months = Math.round(diff / (day * 30))
  return `vor ${months} Monat${months === 1 ? '' : 'en'}`
}

const formatAverage = (value: number) => value.toFixed(1).replace('.', ',')

const formatNewsDate = (iso: string) => {
  if (!iso) return 'tbd'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'tbd'
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const roadmapItems = ref<RoadmapItemWithStats[]>([])
const roadmapLoading = ref(false)
const roadmapTotals = ref(0)
const roadmapRecent7Days = ref(0)
const roadmapSelections = reactive<Record<string, number>>({})
const roadmapTouched = reactive<Record<string, boolean>>({})
const roadmapSubmitting = ref(false)
const roadmapSuccess = ref(false)
const roadmapError = ref('')

const hasRoadmapVote = computed(() => Object.values(roadmapTouched).some(Boolean))

const roadmapImportanceLabel = (value?: number) => {
  const labels: Record<number, string> = {
    1: 'Nettes Add-on, nicht dringend',
    2: 'Kann warten',
    3: 'Wichtig für mich',
    4: 'Sehr wichtig',
    5: 'Top-Priorität',
  }
  return labels[value ?? 0] || 'Noch nicht bewertet'
}
const roadmapImportanceShortLabel = (value: number) => {
  const labels: Record<number, string> = {
    1: 'Optional',
    2: 'Später',
    3: 'Wichtig',
    4: 'Dringend',
    5: 'Top',
  }
  return labels[value] || ''
}

const selectRoadmapImportance = (key: string, value: number) => {
  if (!ROADMAP_SCALE.includes(value as (typeof ROADMAP_SCALE)[number])) {
    return
  }
  roadmapSelections[key] = value
  roadmapTouched[key] = true
  roadmapSuccess.value = false
}

async function loadRoadmap() {
  try {
    roadmapLoading.value = true
    const data = (await api.get('/api/service/roadmap', { auth: false })) as RoadmapResponse
    roadmapItems.value = data.items ?? []
    roadmapTotals.value = data.totalVotes ?? 0
    roadmapRecent7Days.value = data.recentVotes7Days ?? 0

    const activeKeys = new Set<string>()
    for (const item of roadmapItems.value) {
      activeKeys.add(item.key)
      if (typeof roadmapSelections[item.key] !== 'number') {
        roadmapSelections[item.key] = 3
      }
      if (roadmapTouched[item.key] === undefined) {
        roadmapTouched[item.key] = false
      }
    }
    for (const key of Object.keys(roadmapSelections)) {
      if (!activeKeys.has(key)) {
        delete roadmapSelections[key]
        delete roadmapTouched[key]
      }
    }
  } catch (err) {
    console.warn('Roadmap stats unavailable', err)
  } finally {
    roadmapLoading.value = false
  }
}

async function submitRoadmapVotes() {
  if (!hasRoadmapVote.value || roadmapSubmitting.value) return

  const votes = Object.entries(roadmapSelections)
    .filter(([key]) => roadmapTouched[key])
    .map(([key, importance]) => ({ key, importance }))

  if (!votes.length) {
    return
  }

  roadmapSubmitting.value = true
  roadmapError.value = ''
  roadmapSuccess.value = false

  try {
    await api.post('/api/service/roadmap', { votes }, { auth: false })
    roadmapSuccess.value = true
    Object.keys(roadmapTouched).forEach((key) => {
      roadmapTouched[key] = false
    })
    await loadRoadmap()
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Konnte Stimmen nicht speichern'
    roadmapError.value = message
  } finally {
    roadmapSubmitting.value = false
  }
}

async function submitRoadmapSuggestion() {
  if (!roadmapSuggestionFormValid.value || roadmapSuggestionSubmitting.value) return

  roadmapSuggestionSubmitting.value = true
  roadmapSuggestionError.value = ''
  roadmapSuggestionSuccess.value = false

  try {
    await api.post(
      '/api/service/roadmap-suggestions',
      {
        title: roadmapSuggestionForm.title,
        details: roadmapSuggestionForm.details,
        email: roadmapSuggestionForm.email || undefined,
        allowContact: roadmapSuggestionForm.allowContact,
        consentPrivacy: roadmapSuggestionForm.consentPrivacy,
      },
      { auth: false },
    )
    roadmapSuggestionSuccess.value = true
    roadmapSuggestionForm.title = ''
    roadmapSuggestionForm.details = ''
    roadmapSuggestionForm.email = ''
    roadmapSuggestionForm.allowContact = false
    roadmapSuggestionForm.consentPrivacy = false
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Konnte Vorschlag nicht speichern'
    roadmapSuggestionError.value = message
  } finally {
    roadmapSuggestionSubmitting.value = false
  }
}

useHead({
  title: 'OpenSquawk – Open-source, low-cost AI ATC für Flugsimulatoren',
  meta: [
    { name: 'description', content: 'Wir bauen OpenSquawk: Open-source, low-cost AI ATC für Flugsimulatoren. Community-Roadmap, Self-host & Hosting in Planung, Alpha-Prototyp verfügbar.' },
    { name: 'theme-color', content: '#0ea5e9' },
    { property: 'og:title', content: 'OpenSquawk – Open-source, low-cost AI ATC' },
    { property: 'og:description', content: 'Alpha-Prototyp für Simulatorpiloten. Community-getriebene Features, Self-host & geplante Hosting-Optionen.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://opensquawk.example.com/cover.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'OpenSquawk – Open-source, low-cost AI ATC' },
    { name: 'twitter:description', content: 'Alpha-Prototyp mit Community-Roadmap. Self-host heute, Hosting morgen.' },
    { name: 'twitter:image', content: 'https://opensquawk.example.com/cover.png' }
  ]
})

onMounted(async () => {
  await Promise.all([loadWaitlistStats(), loadRoadmap()])
  // @ts-ignore – optionaler Fallback
  if (!('AOS' in window)) {
    const [{ default: AOS }] = await Promise.all([
      import('aos'),
      import('aos/dist/aos.css')
    ])
    AOS.init({ once: true, duration: 600, easing: 'ease-out' })
  }
})
</script>


<style scoped>
.container-outer { @apply mx-auto max-w-screen-xl px-4; }
.gradient-hero {
  background: radial-gradient(1200px 600px at 10% -10%, rgba(6,182,212,.35), transparent),
  radial-gradient(900px 480px at 100% 10%, rgba(59,130,246,.25), transparent),
  linear-gradient(180deg, #0b1020 0%, #0b1020 60%, #0a0f1c 100%);
}
.glass { background: rgba(255,255,255,.06); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.08); }
.btn { @apply inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium transition; }
.btn-primary { @apply bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,.25)]; }
.btn-ghost { @apply bg-white/5 text-white hover:bg-white/10; }
.card { @apply glass rounded-2xl p-5 md:p-6; }
.chip { @apply inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 text-white px-3 py-1 text-xs; }
.roadmap-scale {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
}
.roadmap-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.55rem 0.65rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.875rem;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.roadmap-pill:hover {
  background: rgba(34, 211, 238, 0.18);
  border-color: rgba(34, 211, 238, 0.4);
  color: #fff;
}
.roadmap-pill.is-active {
  background: rgba(34, 211, 238, 0.28);
  border-color: rgba(34, 211, 238, 0.65);
  color: #fff;
  box-shadow: 0 0 24px rgba(34, 211, 238, 0.25);
}
.roadmap-pill .label {
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}
.roadmap-pill.is-active .label {
  color: rgba(224, 242, 254, 0.85);
}
</style>
