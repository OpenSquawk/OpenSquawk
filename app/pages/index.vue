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
          <NuxtLink to="#features" class="hover:text-cyan-300">
            {{ locale === 'de' ? 'Vision' : 'Vision' }}
          </NuxtLink>
          <NuxtLink to="#roadmap" class="hover:text-cyan-300">
            {{ locale === 'de' ? 'Roadmap' : 'Roadmap' }}
          </NuxtLink>
          <NuxtLink to="#pricing" class="hover:text-cyan-300">
            {{ locale === 'de' ? 'Pläne' : 'Plans' }}
          </NuxtLink>
          <NuxtLink to="#contributing" class="hover:text-cyan-300">
            {{ locale === 'de' ? 'Mitmachen' : 'Get involved' }}
          </NuxtLink>
          <NuxtLink to="#faq" class="hover:text-cyan-300">FAQ</NuxtLink>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative">
            <label for="landing-language" class="sr-only">
              {{ locale === 'de' ? 'Sprache wählen' : 'Choose language' }}
            </label>
            <select
                id="landing-language"
                v-model="locale"
                class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white/80 outline-none focus:border-cyan-400 focus:text-white"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
          <NuxtLink to="#cta" class="btn btn-primary text-sm">
            {{ locale === 'de' ? 'Warteliste' : 'Waitlist' }}
          </NuxtLink>
          <NuxtLink
              to="https://github.com/FaktorxMensch/OpenSquawk"
              external
              target="_blank"
              rel="noopener"
              class="btn btn-ghost text-sm"
          ><v-icon icon="mdi-github" />
            GitHub
          </NuxtLink>
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
            <span v-if="locale === 'de'">
              Wir bauen eine offene, bezahlbare KI-Flugsicherung für Flugsimulatoren – community-getrieben, mit selbst gehosteten
              und gehosteten Optionen in Planung.
            </span>
            <span v-else>
              We are building an open, affordable AI air traffic control for flight simulators – community-driven, with
              self-hosted and hosted options in planning.
            </span>
          </p>
          <ul class="mt-6 space-y-2 text-white/70 text-sm md:text-base">
            <li class="flex items-start gap-2">
              <v-icon icon="mdi-account-group" size="18" class="mt-[3px] text-cyan-300" />
              <span v-if="locale === 'de'">Community-Roadmap bestimmt Prioritäten. Features landen nur, wenn sie euch wirklich helfen.</span>
              <span v-else>Community roadmap sets the priorities. Features only ship when they truly help you.</span>
            </li>
            <li class="flex items-start gap-2">
              <v-icon icon="mdi-airplane" size="18" class="mt-[3px] text-cyan-300" />
              <span v-if="locale === 'de'"><strong>Simulator-Support</strong>: MSFS zuerst, X-Plane als nächstes – mit Blick auf VATSIM-kompatible Trainings.</span>
              <span v-else><strong>Simulator support</strong>: MSFS first, X-Plane next – all with VATSIM-ready training in mind.</span>
            </li>
          </ul>
          <p class="mt-2 text-sm text-white/70">
            <span v-if="locale === 'de'">
              Wir suchen Mitentwickler:innen (Node/Nuxt, ATC SMEs, Tester, Infra/Kosten). Meld dich via
            </span>
            <span v-else>
              We are looking for collaborators (Node/Nuxt, ATC SMEs, testers, infra/cost benchmarking). Reach out via
            </span>
            <a class="text-cyan-300 underline" href="mailto:info@opensquawk.de">info@opensquawk.de</a>.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 mt-6">
            <NuxtLink to="#cta" class="btn btn-primary text-base">
              {{ locale === 'de' ? 'Warteliste beitreten' : 'Join the waitlist' }}
            </NuxtLink>
            <NuxtLink to="/news" class="btn btn-ghost text-base">
              {{ locale === 'de' ? 'News lesen' : 'Read news' }}
            </NuxtLink>
          </div>
          <div class="mt-8 max-w-xl" data-aos="fade-up" data-aos-delay="120">
            <form class="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4" @submit.prevent="submitUpdates">
              <div class="space-y-1">
                <h3 class="text-lg font-semibold">
                  {{ locale === 'de' ? 'Neue Features zuerst erfahren' : 'Hear about new features first' }}
                </h3>
                <p class="text-sm text-white/70">
                  {{
                    locale === 'de'
                      ? 'Trag dich in die Feature-Liste ein und erhalte Updates zu Releases, Drops & Lerninhalten.'
                      : 'Join the feature list and get updates on releases, drops & learning content.'
                  }}
                </p>
              </div>
              <div class="flex flex-col gap-3 sm:flex-row">
                <input
                    v-model.trim="updatesForm.email"
                    type="email"
                    required
                    :placeholder="locale === 'de' ? 'dein@email' : 'your@email'"
                    class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
                    :aria-label="locale === 'de' ? 'E-Mail für Produkt-Updates' : 'Email for product updates'"
                />
                <button
                    type="submit"
                    class="btn btn-primary w-full sm:w-auto"
                    :disabled="!updatesFormValid || updatesSubmitting"
                >
                  <span v-if="updatesSubmitting" class="flex items-center gap-2">
                    <v-progress-circular indeterminate size="16" width="2" color="white" />
                    {{ locale === 'de' ? 'Speichere…' : 'Saving…' }}
                  </span>
                  <span v-else>{{ locale === 'de' ? 'Benachrichtigt mich' : 'Notify me' }}</span>
                </button>
              </div>
              <div class="space-y-2 text-xs text-white/60">
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="updatesForm.consentMarketing" class="mt-1" required />
                  <span>
                    {{
                      locale === 'de'
                        ? 'Ja, informiert mich per E-Mail über neue Features, Wartelisten-Drops & Lerninhalte.'
                        : 'Yes, email me when new features, waitlist drops or learning content go live.'
                    }}
                  </span>
                </label>
                <label class="flex items-start gap-3">
                  <input type="checkbox" v-model="updatesForm.consentPrivacy" class="mt-1" required />
                  <span>
                    <template v-if="locale === 'de'">
                      Ich habe die
                      <NuxtLink to="/datenschutz" class="text-cyan-300 underline">Datenschutzerklärung</NuxtLink>
                      gelesen.
                    </template>
                    <template v-else>
                      I have read the
                      <NuxtLink to="/datenschutz" class="text-cyan-300 underline">privacy policy</NuxtLink>.
                    </template>
                  </span>
                </label>
              </div>
              <p v-if="updatesSuccess" class="text-sm text-green-300">
                {{ locale === 'de' ? 'Danke! Wir informieren dich, sobald neue Features live gehen.' : 'Thanks! We will let you know when new features go live.' }}
              </p>
              <p v-else-if="updatesError" class="text-sm text-red-300">{{ updatesError }}</p>
              <p v-else class="text-xs text-white/50">
                {{
                  locale === 'de'
                    ? 'Kein Spam – maximal relevante Produkt-Updates. Abmeldung jederzeit per Link möglich.'
                    : 'No spam – only relevant product updates. Unsubscribe any time.'
                }}
              </p>
            </form>
          </div>
        </div>
        <div class="hidden mt-10 md:mt-16" data-aos="zoom-in" data-aos-delay="100">
          <div class="card relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent"></div>
<!--            <img src="/img/simulator.jpg" alt="Cockpit" class="rounded-xl w-full object-cover" />-->
            <div class="absolute bottom-3 right-3 text-xs text-white/70 bg-black/40 px-2 py-1 rounded">
              {{ locale === 'de' ? 'Symbolbild' : 'Placeholder image' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SOCIAL PROOF / LOGOS -->
    <section class="py-10 border-t border-white/10 bg-[#0a0f1c]" data-aos="fade-up">
      <div class="container-outer">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 items-center opacity-80 text-sm md:text-base">
          <div class="flex items-center justify-center gap-2 text-white/60">
            <v-icon icon="mdi-test-tube" class="opacity-70" />
            {{ locale === 'de' ? 'Alpha-Status' : 'Alpha status' }}
          </div>
          <div class="flex items-center justify-center gap-2 text-white/60">
            <v-icon icon="mdi-microsoft-xbox" class="opacity-70" />
            {{ locale === 'de' ? 'MSFS (Fokus)' : 'MSFS (focus)' }}
          </div>
          <div class="flex items-center justify-center gap-2 text-white/60">
            <v-icon icon="mdi-airplane" class="opacity-70" />
            {{ locale === 'de' ? 'X‑Plane (als nächstes)' : 'X-Plane (up next)' }}
          </div>
          <div class="flex items-center justify-center gap-2 text-white/60">
            <v-icon icon="mdi-headset" class="opacity-70" />
            {{ locale === 'de' ? 'VATSIM-Lernpfad (geplant)' : 'VATSIM learning path (planned)' }}
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section id="features" class="py-16 md:py-24 bg-gradient-to-b from-[#0a0f1c] to-[#0b1020]">
      <div class="container-outer">
        <div class="max-w-2xl mb-10" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">
            {{ locale === 'de' ? 'Vision & Fokus' : 'Vision & focus' }}
          </h2>
          <p class="mt-3 text-white/80">
            {{
              locale === 'de'
                ? 'Open-source, low-cost AI ATC für Flugsimulatoren. Community-getriebene Features, transparente Kosten und Wahlfreiheit zwischen Self-host und späterem Hosting.'
                : 'Open-source, low-cost AI ATC for flight simulation. Community-driven features, transparent costs and the freedom to self-host or use hosted options later.'
            }}
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20"><v-icon icon="mdi-tower-fire" class="text-cyan-300"/></div>
              <h3 class="font-semibold text-lg">
                {{ locale === 'de' ? 'Offene AI-ATC-Grundlage' : 'Open AI ATC foundation' }}
              </h3>
            </div>
            <p class="mt-3 text-white/80">
              {{
                locale === 'de'
                  ? 'Wir entwickeln eine erschwingliche Kernplattform für Funkanalyse, Entscheidungslogik und Voices, die jede:r inspizieren und erweitern kann.'
                  : 'We are building an affordable core for radio analysis, decision logic and voices that anyone can inspect and extend.'
              }}
            </p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20"><v-icon icon="mdi-vote" class="text-cyan-300"/></div>
              <h3 class="font-semibold text-lg">
                {{ locale === 'de' ? 'Community entscheidet' : 'Community decides' }}
              </h3>
            </div>
            <p class="mt-3 text-white/80">
              {{
                locale === 'de'
                  ? 'Roadmap-Votes und Vorschläge aus der Community lenken unsere Prioritäten – Training, Tools oder Integrationen entstehen mit euch.'
                  : 'Roadmap votes and community proposals steer our priorities – training, tools and integrations grow with you.'
              }}
            </p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="200">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20"><v-icon icon="mdi-source-repository" class="text-cyan-300"/></div>
              <h3 class="font-semibold text-lg">
                {{ locale === 'de' ? 'Self-host & Hosted Optionen' : 'Self-host & hosted options' }}
              </h3>
            </div>
            <p class="mt-3 text-white/80">
              {{
                locale === 'de'
                  ? 'Beta-Ziel: eigene Instanz per Docker in Minuten oder später fair kalkulierte Hosting-Pläne – offen, transparent, bezahlbar.'
                  : 'Beta goal: spin up your own instance via Docker within minutes or pick fairly priced hosting plans – open, transparent, affordable.'
              }}
            </p>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mt-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <h3 class="font-semibold text-lg">
              {{ locale === 'de' ? 'Simulator-Support (Plan)' : 'Simulator support (plan)' }}
            </h3>
            <p class="mt-3 text-white/80">
              {{
                locale === 'de'
                  ? 'Wir fokussieren zuerst Microsoft Flight Simulator, arbeiten parallel am X-Plane-Konzept und sammeln Feedback für weitere Plattformen.'
                  : 'We focus on Microsoft Flight Simulator first, work on the X-Plane concept in parallel and gather feedback for additional platforms.'
              }}
            </p>
            <ul class="mt-3 space-y-2 text-white/70 text-sm list-disc list-inside">
              <li>{{ locale === 'de' ? 'MSFS Alpha: lokale Anbindung + Funkworkflows im Test' : 'MSFS alpha: local connector + radio workflows in testing' }}</li>
              <li>{{ locale === 'de' ? 'X-Plane: Plugin-Skizze, Community-Review willkommen' : 'X-Plane: plugin sketch, community review welcome' }}</li>
              <li>{{ locale === 'de' ? 'VATSIM/IVAO: Lernpfad & Phraseologie-Übungen geplant' : 'VATSIM/IVAO: learning path & phraseology drills planned' }}</li>
            </ul>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <h3 class="font-semibold text-lg">
              {{ locale === 'de' ? 'Alpha-Prototyp' : 'Alpha prototype' }}
            </h3>
            <p class="mt-3 text-white/80">
              {{
                locale === 'de'
                  ? 'Der aktuelle Build läuft lokal (Node/Nuxt + Services). Zum Setup brauchst du Terminal-Basics und Lust auf Experimente.'
                  : 'The current build runs locally (Node/Nuxt + services). You will need basic terminal skills and a taste for experimentation.'
              }}
            </p>
            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-console"/>Setup via CLI</div>
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-docker"/>Docker Compose optional</div>
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-account-hard-hat"/>{{ locale === 'de' ? 'Fehler melden erwünscht' : 'Bug reports welcome' }}</div>
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-source-branch"/>{{ locale === 'de' ? 'PRs & Roadmap-Votes willkommen' : 'PRs & roadmap votes welcome' }}</div>
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
          <p class="mt-3 text-white/80">
            {{
              locale === 'de'
                ? 'Content-driven Beiträge halten dich auf dem Laufenden. Alle Artikel liegen als Markdown vor – neue Stories landen automatisch hier.'
                : 'Content-driven posts keep you in the loop. All articles are stored in Markdown – new stories show up here automatically.'
            }}
          </p>
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
              <NuxtLink :to="`/news/${post.slug}`" class="text-cyan-300 text-sm font-medium hover:underline">
                {{ locale === 'de' ? 'Weiterlesen' : 'Read more' }}
              </NuxtLink>
            </div>
          </article>
        </div>
        <div v-else class="card text-sm text-white/70" data-aos="fade-up">
          {{ locale === 'de' ? 'Noch keine News veröffentlicht – der erste Beitrag folgt in Kürze.' : 'No news published yet – the first post is coming soon.' }}
        </div>
        <div class="flex items-center gap-3" data-aos="fade-up">
          <NuxtLink to="/news" class="btn btn-ghost">
            {{ locale === 'de' ? 'Alle News ansehen' : 'View all news' }}
          </NuxtLink>
          <span class="text-xs text-white/50">
            {{ locale === 'de' ? 'Schreib uns, falls du eigene Erfahrungsberichte teilen willst.' : 'Tell us if you want to share your own experience.' }}
          </span>
        </div>
      </div>
    </section>

    <!-- ROADMAP -->
    <section id="roadmap" class="py-16 md:py-24 bg-[#0b1020] border-y border-white/10">
      <div class="container-outer space-y-10">
        <div class="max-w-3xl" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">
            {{ locale === 'de' ? 'Roadmap & Community-Voting' : 'Roadmap & community voting' }}
          </h2>
          <p class="mt-3 text-white/80">
            {{
              locale === 'de'
                ? 'Stimme ab, was als Nächstes Priorität bekommt. Wir kombinieren die Votes mit Zeitstempel, um Features für Training, Immersion und Infrastruktur zu planen.'
                : 'Vote on what should take priority next. We combine votes with timestamps to plan features for training, immersion and infrastructure.'
            }}
          </p>
          <div class="mt-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            <v-icon icon="mdi-account-group" size="18" class="text-cyan-300" />
            <span>{{ roadmapStatsLabel }}</span>
          </div>
        </div>

        <div class="space-y-6">
          <div v-if="roadmapLoading" class="card text-white/70" data-aos="fade-up">
            {{ locale === 'de' ? 'Wir laden die aktuellen Roadmap-Prioritäten…' : 'Loading current roadmap priorities…' }}
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
                    <div>
                      <span v-if="locale === 'de'">{{ formatNumber(item.votes) }} Stimmen</span>
                      <span v-else>{{ formatNumber(item.votes) }} votes</span>
                    </div>
                    <div v-if="item.lastVoteAt" class="text-white/40">
                      <span v-if="locale === 'de'">zuletzt {{ formatRelativeFromNow(item.lastVoteAt) }}</span>
                      <span v-else>last vote {{ formatRelativeFromNow(item.lastVoteAt) }}</span>
                    </div>
                    <div v-else class="text-white/40">
                      {{ locale === 'de' ? 'noch keine Stimmen' : 'no votes yet' }}
                    </div>
                  </div>
                </div>
                <p class="text-sm text-white/70">{{ item.description }}</p>
                <div class="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div class="h-2 rounded-full bg-cyan-400 transition-all" :style="{ width: `${item.scorePercent}%` }" />
                </div>
                <div class="space-y-3">
                  <div class="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/50">
                    <span>{{ locale === 'de' ? 'Priorität wählen' : 'Choose priority' }}</span>
                    <span v-if="roadmapTouched[item.key]" class="text-cyan-300">
                      {{ locale === 'de' ? 'markiert' : 'marked' }}
                    </span>
                  </div>
                  <div
                      class="roadmap-scale"
                      role="group"
                      :aria-label="locale === 'de' ? `Priorität für ${item.title}` : `Priority for ${item.title}`"
                  >
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
                <h4 class="text-lg font-semibold">
                  {{ locale === 'de' ? 'Deine Auswahl speichern' : 'Save your selection' }}
                </h4>
                <p class="text-sm text-white/70">
                  {{
                    locale === 'de'
                      ? 'Wir speichern jede Stimme einzeln mit Zeitpunkt – so sehen wir, was euch gerade wichtig ist. Du kannst mehrere Karten anpassen und alles gemeinsam absenden.'
                      : 'We store every vote individually with a timestamp, so we see what matters right now. Adjust several cards and submit everything together.'
                  }}
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
                    {{ locale === 'de' ? 'Speichere Stimmen…' : 'Saving votes…' }}
                  </span>
                  <span v-else>{{ locale === 'de' ? 'Stimmen abschicken' : 'Submit votes' }}</span>
                </button>
                <p v-if="roadmapSuccess" class="text-center text-sm text-green-300 md:text-left">
                  {{ locale === 'de' ? 'Danke! Deine Stimmen sind angekommen.' : 'Thanks! Your votes have been recorded.' }}
                </p>
                <p v-else-if="roadmapError" class="text-center text-sm text-red-300 md:text-left">{{ roadmapError }}</p>
                <p v-else class="text-center text-xs text-white/50 md:text-left">
                  {{ locale === 'de' ? 'Tipp: Prioritäten nur anpassen, wenn du zu dem Punkt Feedback hast.' : 'Tip: Only adjust priorities when you have feedback for that topic.' }}
                </p>
              </div>
            </div>
          </template>
          <div class="card space-y-4" data-aos="fade-up">
            <div class="space-y-2">
              <h4 class="text-lg font-semibold">
                {{ locale === 'de' ? 'Fehlt dir etwas in der Roadmap?' : 'Missing something on the roadmap?' }}
              </h4>
              <p class="text-sm text-white/70">
                {{
                  locale === 'de'
                    ? 'Teile deinen Feature-Wunsch oder ein Problem, das wir lösen sollen. Wir priorisieren Community-Ideen.'
                    : 'Share the feature you are missing or a problem we should solve. We prioritise community ideas.'
                }}
              </p>
            </div>
            <form class="space-y-3" @submit.prevent="submitRoadmapSuggestion">
              <input
                  v-model.trim="roadmapSuggestionForm.title"
                  type="text"
                  required
                  :placeholder="
                    locale === 'de'
                      ? 'Kurzer Titel – z. B. ATIS-Integration für EDDF'
                      : 'Short title – e.g. ATIS integration for EDDF'
                  "
                  class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
                  :aria-label="
                    locale === 'de' ? 'Titel für Roadmap-Vorschlag' : 'Title for roadmap suggestion'
                  "
              />
              <textarea
                  v-model.trim="roadmapSuggestionForm.details"
                  rows="4"
                  required
                  :placeholder="locale === 'de' ? 'Beschreibe, warum das wichtig ist oder wie es dir helfen würde.' : 'Describe why this matters or how it would help you.'"
                  class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <div class="grid gap-3 sm:grid-cols-2">
                <input
                    v-model.trim="roadmapSuggestionForm.email"
                    type="email"
                    :placeholder="locale === 'de' ? 'E-Mail (optional)' : 'Email (optional)'"
                    class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-cyan-400"
                />
                <label class="flex items-start gap-3 text-xs text-white/60">
                  <input
                      type="checkbox"
                      v-model="roadmapSuggestionForm.allowContact"
                      class="mt-1"
                      :disabled="!roadmapSuggestionForm.email"
                  />
                  <span>
                    {{
                      locale === 'de'
                        ? 'Gern per E-Mail nachhaken, falls Rückfragen auftauchen.'
                        : 'Feel free to follow up by email if questions pop up.'
                    }}
                  </span>
                </label>
              </div>
              <label class="flex items-start gap-3 text-xs text-white/60">
                <input type="checkbox" v-model="roadmapSuggestionForm.consentPrivacy" class="mt-1" required />
                <span>
                  <template v-if="locale === 'de'">
                    Ich habe die <NuxtLink to="/datenschutz" class="text-cyan-300 underline">Datenschutzerklärung</NuxtLink>
                    gelesen und willige in die Verarbeitung meines Vorschlags ein.
                  </template>
                  <template v-else>
                    I have read the <NuxtLink to="/datenschutz" class="text-cyan-300 underline">privacy policy</NuxtLink> and consent to the processing of my suggestion.
                  </template>
                </span>
              </label>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="submit"
                    class="btn btn-primary w-full sm:w-auto"
                    :disabled="!roadmapSuggestionFormValid || roadmapSuggestionSubmitting"
                >
                  <span v-if="roadmapSuggestionSubmitting" class="flex items-center gap-2">
                    <v-progress-circular indeterminate size="16" width="2" color="white" />
                    {{ locale === 'de' ? 'Sende Vorschlag…' : 'Sending suggestion…' }}
                  </span>
                  <span v-else>{{ locale === 'de' ? 'Vorschlag senden' : 'Send suggestion' }}</span>
                </button>
                <p v-if="roadmapSuggestionSuccess" class="text-sm text-green-300">
                  {{ locale === 'de' ? 'Danke! Wir prüfen deinen Vorschlag und melden uns ggf. zurück.' : 'Thanks! We will review your suggestion and follow up if needed.' }}
                </p>
                <p v-else-if="roadmapSuggestionError" class="text-sm text-red-300">{{ roadmapSuggestionError }}</p>
                <p v-else class="text-xs text-white/50">
                  {{ locale === 'de' ? 'Wir lesen jeden Vorschlag persönlich. Optionales Kontaktfeld nur für Rückfragen.' : 'We read every suggestion personally. The optional contact field is only used for follow-ups.' }}
                </p>
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
            <h2 class="text-3xl md:text-4xl font-semibold">
              {{ locale === 'de' ? 'Lernpfad (in Arbeit)' : 'Learning path (in progress)' }}
            </h2>
            <p class="mt-3 text-white/80">
              {{
                locale === 'de'
                  ? 'Gemeinsam mit der Community strukturieren wir Trainingsmodule – vom ersten Funkkontakt bis zu Netzwerken wie VATSIM. Feedback aus Tests fließt direkt in jedes Kapitel.'
                  : 'Together with the community we structure training modules – from the first radio call to networks like VATSIM. Feedback from tests flows straight into every chapter.'
              }}
            </p>
            <ol class="mt-5 space-y-3 text-white/80">
              <li class="flex gap-3"><span class="chip">1</span><span><b>Basics</b> ({{ locale === 'de' ? 'Konzept' : 'concept' }}): {{ locale === 'de' ? 'Funkalphabet, Zahlen, Standard-Readbacks.' : 'phonetic alphabet, numbers, standard readbacks.' }}</span></li>
              <li class="flex gap-3"><span class="chip">2</span><span><b>Ground</b> ({{ locale === 'de' ? 'Alpha' : 'alpha' }}): {{ locale === 'de' ? 'Taxi-Flows, Hotspots, Holding-short.' : 'taxi flows, hotspots, holding short.' }}</span></li>
              <li class="flex gap-3"><span class="chip">3</span><span><b>Departure</b> ({{ locale === 'de' ? 'geplant' : 'planned' }}): {{ locale === 'de' ? 'SID-Handling, Altitude-/Speed-Calls.' : 'SID handling, altitude/speed calls.' }}</span></li>
              <li class="flex gap-3"><span class="chip">4</span><span><b>Arrival</b> ({{ locale === 'de' ? 'geplant' : 'planned' }}): {{ locale === 'de' ? 'STARs, Vectors, Approach-Briefing.' : 'STARs, vectors, approach briefing.' }}</span></li>
              <li class="flex gap-3"><span class="chip">5</span><span><b>VATSIM</b> ({{ locale === 'de' ? 'Community-Beta' : 'community beta' }}): {{ locale === 'de' ? 'Checklisten, Etiquette, Live-Übungen.' : 'checklists, etiquette, live practice.' }}</span></li>
            </ol>
            <div class="mt-6 flex gap-3">
              <NuxtLink to="#roadmap" class="btn btn-primary">
                {{ locale === 'de' ? 'Roadmap ansehen' : 'View roadmap' }}
              </NuxtLink>
              <NuxtLink to="/news" class="btn btn-ghost">
                {{ locale === 'de' ? 'News lesen' : 'Read news' }}
              </NuxtLink>
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
            <h2 class="text-3xl md:text-4xl font-semibold">
              {{ locale === 'de' ? 'Pläne & Hosting' : 'Plans & hosting' }}
            </h2>
            <p class="mt-3 text-white/80">
              {{
                locale === 'de'
                  ? 'Drei Wege, OpenSquawk zu nutzen – alle aktuell für 0€, solange wir die Infrastruktur stemmen können.'
                  : 'Three ways to use OpenSquawk – all currently €0 while we cover the infrastructure.'
              }}
            </p>
          </div>
        </div>

        <div class="mt-8 grid md:grid-cols-3 gap-6 items-stretch">
          <!-- OSS -->
          <div class="card relative flex flex-col h-full pricing-card" data-aos="fade-up" data-aos-delay="0">
            <div class="absolute -top-3 right-4 chip">Community</div>
<<<<<<< HEAD
            <h3 class="text-xl font-semibold">{{ locale === 'de' ? 'Open‑Source (Self‑host)' : 'Open-source (self-host)' }}</h3>
            <p class="mt-2 text-white/80">
              {{
                locale === 'de'
                  ? 'Volle Kontrolle über Infrastruktur und Daten. Selbst hosten bleibt immer eine Option.'
                  : 'Full control over infrastructure and data. Self-hosting is always an option.'
              }}
            </p>
            <div class="mt-5 text-3xl font-semibold">
              0€<span class="text-white/60 text-sm font-normal"> {{ locale === 'de' ? '/ immer' : '/ forever' }}</span>
=======
            <div class="flex flex-col flex-1">
              <h3 class="text-xl font-semibold">{{ locale === 'de' ? 'Open‑Source (Self‑host)' : 'Open-source (self-host)' }}</h3>
              <p class="mt-2 text-white/80">
                {{
                  locale === 'de'
                    ? 'Volle Kontrolle über Infrastruktur und Daten. Selbst hosten bleibt immer eine Option.'
                    : 'Full control over infrastructure and data. Self-hosting is always an option.'
                }}
              </p>
              <div class="mt-5 text-3xl font-semibold">
                0€<span class="text-white/60 text-sm font-normal"> {{ locale === 'de' ? '/ immer' : '/ forever' }}</span>
              </div>
              <ul class="mt-5 space-y-2 text-white/80 text-sm">
                <li>{{ locale === 'de' ? '✔ Voller Funktionsumfang' : '✔ Full feature set' }}</li>
                <li>✔ Plugins & SDK</li>
                <li>{{ locale === 'de' ? '✔ Community‑Support' : '✔ Community support' }}</li>
              </ul>
>>>>>>> 2b6aa53 (Adjust pricing layout and waitlist copy)
            </div>
            <NuxtLink
                to="https://github.com/FaktorxMensch/OpenSquawk"
                external
                target="_blank"
                rel="noopener"
                class="btn btn-ghost w-full mt-6"
            >
              {{ locale === 'de' ? 'Repository ansehen' : 'View repository' }}
            </NuxtLink>
          </div>
          <!-- Hosted Community -->
<<<<<<< HEAD
          <div class="card border-2 border-cyan-400/40 relative shadow-[0_0_40px_rgba(34,211,238,.25)]" data-aos="fade-up" data-aos-delay="100">
            <div class="absolute -top-3 right-4 chip bg-cyan-500/30 border-cyan-400/50">{{ locale === 'de' ? 'Empfohlen' : 'Recommended' }}</div>
            <h3 class="text-xl font-semibold">{{ locale === 'de' ? 'Hosted – Lernmodus' : 'Hosted – learning mode' }}</h3>
            <p class="mt-2 text-white/80">
              {{
                locale === 'de'
                  ? 'Wir übernehmen die Grundkosten, damit du mit allen Basisfunktionen trainieren kannst. Für Live-ATC hinterlegst du deinen eigenen OpenAI API-Key – wir nutzen ihn nur für die Funkanfragen im Hintergrund.'
                  : 'We cover the base costs so you can train with all fundamental features. For live ATC you provide your own OpenAI API key – we only use it for the background radio requests.'
              }}
            </p>
            <div class="mt-5 text-3xl font-semibold">
              0€<span class="text-white/60 text-sm font-normal"> {{ locale === 'de' ? '/ Beta' : '/ beta' }}</span>
            </div>
            <ul class="mt-5 space-y-2 text-white/80 text-sm">
              <li>{{ locale === 'de' ? '✔ Lernmodule & Basisfunktionen inklusive' : '✔ Learning modules & core features included' }}</li>
              <li>{{ locale === 'de' ? '✔ Kein Setup, Updates durch uns' : '✔ No setup, updates handled by us' }}</li>
              <li>{{ locale === 'de' ? '✔ Live-ATC via deinen OpenAI API-Key' : '✔ Live ATC via your OpenAI API key' }}</li>
            </ul>
=======
          <div class="card border-2 border-cyan-400/40 relative shadow-[0_0_40px_rgba(34,211,238,.25)] flex flex-col h-full pricing-card" data-aos="fade-up" data-aos-delay="100">
            <div class="absolute -top-3 right-4 chip bg-cyan-500/30 border-cyan-400/50">{{ locale === 'de' ? 'Empfohlen' : 'Recommended' }}</div>
            <div class="flex flex-col flex-1">
              <h3 class="text-xl font-semibold">{{ locale === 'de' ? 'Hosted – Lernmodus' : 'Hosted – learning mode' }}</h3>
              <p class="mt-2 text-white/80">
                {{
                  locale === 'de'
                    ? 'Wir übernehmen die Grundkosten, damit du mit allen Basisfunktionen trainieren kannst. Für Live-ATC hinterlegst du deinen eigenen OpenAI API-Key – wir nutzen ihn nur für die Funkanfragen im Hintergrund.'
                    : 'We cover the base costs so you can train with all fundamental features. For live ATC you provide your own OpenAI API key – we only use it for the background radio requests.'
                }}
              </p>
              <div class="mt-5 text-3xl font-semibold">
                0€<span class="text-white/60 text-sm font-normal"> {{ locale === 'de' ? '/ Beta' : '/ beta' }}</span>
              </div>
              <ul class="mt-5 space-y-2 text-white/80 text-sm">
                <li>{{ locale === 'de' ? '✔ Lernmodule & Basisfunktionen inklusive' : '✔ Learning modules & core features included' }}</li>
                <li>{{ locale === 'de' ? '✔ Kein Setup, Updates durch uns' : '✔ No setup, updates handled by us' }}</li>
                <li>{{ locale === 'de' ? '✔ Live-ATC via deinen OpenAI API-Key' : '✔ Live ATC via your OpenAI API key' }}</li>
              </ul>
            </div>
>>>>>>> 2b6aa53 (Adjust pricing layout and waitlist copy)
            <NuxtLink to="#cta" class="btn btn-primary w-full mt-6">
              {{ locale === 'de' ? 'Warteliste' : 'Join waitlist' }}
            </NuxtLink>
          </div>
          <!-- Hosted Teams -->
<<<<<<< HEAD
          <div class="card relative" data-aos="fade-up" data-aos-delay="200">
            <div class="absolute -top-3 right-4 chip">{{ locale === 'de' ? 'Teams' : 'Teams' }}</div>
            <h3 class="text-xl font-semibold">{{ locale === 'de' ? 'Hosted – Community Server' : 'Hosted – community server' }}</h3>
            <p class="mt-2 text-white/80">
              {{
                locale === 'de'
                  ? 'Für virtuelle Airlines und Gruppen, die gemeinsam üben möchten. Wir testen dedizierte Umgebungen – aktuell ebenfalls 0€ und mit eigenem API-Key.'
                  : 'For virtual airlines and groups that want to practise together. We are testing dedicated environments – currently also €0 and powered by your own API key.'
              }}
            </p>
            <div class="mt-5 text-3xl font-semibold">
              0€<span class="text-white/60 text-sm font-normal"> {{ locale === 'de' ? '/ Beta' : '/ beta' }}</span>
            </div>
            <ul class="mt-5 space-y-2 text-white/80 text-sm">
              <li>{{ locale === 'de' ? '✔ Gemeinsame Sessions & Rollen in Planung' : '✔ Shared sessions & roles in planning' }}</li>
              <li>{{ locale === 'de' ? '✔ Eigener OpenAI API-Key oder Self-Host fallback' : '✔ Use your own OpenAI API key or self-host fallback' }}</li>
              <li>{{ locale === 'de' ? '✔ Feedback entscheidet über den weiteren Ausbau' : '✔ Feedback guides the next milestones' }}</li>
            </ul>
=======
          <div class="card relative flex flex-col h-full pricing-card" data-aos="fade-up" data-aos-delay="200">
            <div class="absolute -top-3 right-4 chip">{{ locale === 'de' ? 'Teams' : 'Teams' }}</div>
            <div class="flex flex-col flex-1">
              <h3 class="text-xl font-semibold">{{ locale === 'de' ? 'Hosted – Community Server' : 'Hosted – community server' }}</h3>
              <p class="mt-2 text-white/80">
                {{
                  locale === 'de'
                    ? 'Für virtuelle Airlines und Gruppen, die gemeinsam üben möchten. Wir testen dedizierte Umgebungen – aktuell ebenfalls 0€ und mit eigenem API-Key.'
                    : 'For virtual airlines and groups that want to practise together. We are testing dedicated environments – currently also €0 and powered by your own API key.'
                }}
              </p>
              <div class="mt-5 text-3xl font-semibold">
                0€<span class="text-white/60 text-sm font-normal"> {{ locale === 'de' ? '/ Beta' : '/ beta' }}</span>
              </div>
              <ul class="mt-5 space-y-2 text-white/80 text-sm">
                <li>{{ locale === 'de' ? '✔ Gemeinsame Sessions & Rollen in Planung' : '✔ Shared sessions & roles in planning' }}</li>
                <li>{{ locale === 'de' ? '✔ Eigener OpenAI API-Key oder Self-Host fallback' : '✔ Use your own OpenAI API key or self-host fallback' }}</li>
                <li>{{ locale === 'de' ? '✔ Feedback entscheidet über den weiteren Ausbau' : '✔ Feedback guides the next milestones' }}</li>
              </ul>
            </div>
>>>>>>> 2b6aa53 (Adjust pricing layout and waitlist copy)
            <NuxtLink to="#cta" class="btn btn-ghost w-full mt-6">
              {{ locale === 'de' ? 'Kontakt aufnehmen' : 'Get in touch' }}
            </NuxtLink>
          </div>
        </div>

        <div class="mt-8 text-sm text-white/70 space-y-2" data-aos="fade-up" data-aos-delay="300">
          <p v-if="locale === 'de'">
            Wir dürfen VATSIM nur nutzen, solange wir damit kein Geld verdienen. Deswegen braucht Live-ATC im Moment deinen eigenen OpenAI API-Key, den wir ausschließlich für die entsprechenden Anfragen verwenden.
          </p>
          <p v-else>
            We are only allowed to connect to VATSIM as long as we do not make money with it. That is why live ATC currently requires your own OpenAI API key, which we use solely for the related requests.
          </p>
          <p v-if="locale === 'de'">
            Wir suchen aktiv nach einer einfachen Plug-and-Play-Lösung – sobald wir eine praktikable Variante gefunden haben, rollen wir sie aus.
          </p>
          <p v-else>
            We are actively looking for a simple plug-and-play option – as soon as we find a viable approach, we will roll it out.
          </p>
        </div>
      </div>
    </section>

    <!-- OPEN SOURCE -->
    <section id="opensource" class="py-16 md:py-24 bg-[#0a0f1c]">
      <div class="container-outer">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div data-aos="fade-right">
            <h2 class="text-3xl md:text-4xl font-semibold">
              {{ locale === 'de' ? 'Open‑Source, Community‑getrieben' : 'Open-source, community-driven' }}
            </h2>
            <p class="mt-3 text-white/80">
              {{ locale === 'de' ? 'Transparente Architektur, klare Roadmap, offene Issues. Baue eigene Voices, Integrationen und Workflows.' : 'Transparent architecture, clear roadmap, open issues. Build your own voices, integrations and workflows.' }}
            </p>
            <ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <li class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-license"/>{{ locale === 'de' ? 'MIT/Apache‑Lizenz (tbd)' : 'MIT/Apache licence (tbd)' }}</li>
              <li class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-docker"/>Docker‑Compose / Helm</li>
              <li class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-puzzle"/>Plugin‑SDK (TS/JS)</li>
              <li class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-console"/>CLI & REST API</li>
            </ul>
            <div class="mt-6 flex flex-col sm:flex-row gap-3">
              <NuxtLink to="#cta" class="btn btn-primary">
                {{ locale === 'de' ? 'Mitmachen' : 'Get involved' }}
              </NuxtLink>
              <NuxtLink
                  to="https://github.com/OpenSquawk/OpenSquawk"
                  external
                  target="_blank"
                  rel="noopener"
                  class="btn btn-ghost"
              >
                {{ locale === 'de' ? 'GitHub-Repository' : 'GitHub repository' }}
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
          <h2 class="text-3xl md:text-4xl font-semibold">
            {{ locale === 'de' ? 'So funktioniert’s' : 'How it works' }}
          </h2>
          <p class="mt-3 text-white/80">
            {{ locale === 'de' ? 'Audio rein → Verständnis → Antwort raus. Designed für niedrige Latenz & klare Funk‑Disziplin.' : 'Audio in → understanding → response out. Designed for low latency and clean radio discipline.' }}
          </p>
        </div>
        <div class="grid md:grid-cols-4 gap-4 md:gap-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0"><h3 class="font-semibold flex items-center gap-2"><v-icon icon="mdi-waveform"/>1 · ASR</h3><p class="mt-2 text-white/80">{{ locale === 'de' ? 'Streaming‑Speech‑to‑Text mit Funk‑Tuning.' : 'Streaming speech-to-text tuned for radio.' }}</p></div>
          <div class="card" data-aos="fade-up" data-aos-delay="100"><h3 class="font-semibold flex items-center gap-2"><v-icon icon="mdi-brain"/>2 · NLU</h3><p class="mt-2 text-white/80">{{ locale === 'de' ? 'LLM versteht Intention, Kontext, State.' : 'LLM understands intent, context and state.' }}</p></div>
          <div class="card" data-aos="fade-up" data-aos-delay="200"><h3 class="font-semibold flex items-center gap-2"><v-icon icon="mdi-logic-gate-and"/>3 · Logic</h3><p class="mt-2 text-white/80">{{ locale === 'de' ? 'Regeln, Flugdaten, Taxi‑Routing, Validierung.' : 'Rules, flight data, taxi routing, validation.' }}</p></div>
          <div class="card" data-aos="fade-up" data-aos-delay="300"><h3 class="font-semibold flex items-center gap-2"><v-icon icon="mdi-microphone"/>4 · TTS</h3><p class="mt-2 text-white/80">{{ locale === 'de' ? 'Natürliches Voice‑Out mit korrekten Zahlen.' : 'Natural voice-out with accurate numbers.' }}</p></div>
        </div>
      </div>
    </section>

    <!-- CONTRIBUTING -->
    <section id="contributing" class="py-16 md:py-24 bg-[#0a0f1c] border-y border-white/10">
      <div class="container-outer">
        <div class="grid md:grid-cols-2 gap-8 items-start">
          <div data-aos="fade-right">
            <h2 class="text-3xl md:text-4xl font-semibold">
              {{ locale === 'de' ? 'Mitentwickeln' : 'Contribute' }}
            </h2>
            <p class="mt-3 text-white/80">
              {{ locale === 'de' ? 'Issues mit dem Label ' : 'Issues with the label ' }}<code class="text-xs bg-white/10 px-1.5 py-0.5 rounded">help-wanted</code>{{ locale === 'de' ? ' zeigen Aufgaben, bei denen wir Unterstützung brauchen. Alles passiert offen auf GitHub.' : ' highlight tasks where we need support. Everything happens transparently on GitHub.' }}
            </p>
            <ul class="mt-5 space-y-3 text-white/80 text-sm">
              <li class="flex gap-3"><v-icon icon="mdi-nodejs" class="text-cyan-300 mt-[2px]"/><span>{{ locale === 'de' ? 'Node/Nuxt Devs für Backend & Frontend.' : 'Node/Nuxt devs for backend & frontend.' }}</span></li>
              <li class="flex gap-3"><v-icon icon="mdi-headset" class="text-cyan-300 mt-[2px]"/><span>{{ locale === 'de' ? 'ATC SMEs für Phraseologie, Verfahren und Trainingsfeedback.' : 'ATC SMEs for phraseology, procedures and training feedback.' }}</span></li>
              <li class="flex gap-3"><v-icon icon="mdi-test-tube" class="text-cyan-300 mt-[2px]"/><span>{{ locale === 'de' ? 'Tester:innen für Alpha-Builds & Simulator-Integration.' : 'Testers for alpha builds & simulator integration.' }}</span></li>
              <li class="flex gap-3"><v-icon icon="mdi-cash-multiple" class="text-cyan-300 mt-[2px]"/><span>{{ locale === 'de' ? 'Infra- & Kosten-Benchmarking, damit Hosting bezahlbar bleibt.' : 'Infra & cost benchmarking to keep hosting affordable.' }}</span></li>
            </ul>
            <p class="mt-5 text-sm text-white/70">
              {{ locale === 'de' ? 'Schreib uns an ' : 'Email us at ' }}<a href="mailto:info@opensquawk.de" class="text-cyan-300 underline">info@opensquawk.de</a>{{ locale === 'de' ? ' oder kommentiere direkt im Issue.' : ' or leave a comment directly on the issue.' }}
            </p>
            <div class="mt-6 flex gap-3">
              <NuxtLink to="#roadmap" class="btn btn-primary">
                {{ locale === 'de' ? 'Roadmap mitgestalten' : 'Shape the roadmap' }}
              </NuxtLink>
              <NuxtLink to="/news" class="btn btn-ghost">
                {{ locale === 'de' ? 'Neuigkeiten' : 'Latest updates' }}
              </NuxtLink>
            </div>
          </div>
          <div class="card" data-aos="fade-left">
            <h3 class="font-semibold text-lg">{{ locale === 'de' ? 'Aktuelle Fokus-Themen' : 'Current focus areas' }}</h3>
            <ul class="mt-3 space-y-2 text-white/70 text-sm list-disc list-inside">
              <li>{{ locale === 'de' ? 'Alpha-Prototyp stabilisieren & Setup vereinfachen' : 'Stabilise the alpha prototype & simplify setup' }}</li>
              <li>{{ locale === 'de' ? 'MSFS & X-Plane Anbindung verifizieren' : 'Verify MSFS & X-Plane integration' }}</li>
              <li>{{ locale === 'de' ? 'Roadmap-Ideen bewerten & priorisieren' : 'Review & prioritise roadmap ideas' }}</li>
              <li>{{ locale === 'de' ? 'Kostenmodell für Hosting durchrechnen' : 'Model hosting costs' }}</li>
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
              <h3 class="text-2xl md:text-3xl font-semibold">
                {{ locale === 'de' ? 'Frühzugang & Warteliste' : 'Early access & waitlist' }}
              </h3>
              <p class="mt-2 text-white/80">
                {{
                  locale === 'de'
                    ? 'Trag dich ein und sichere dir deinen Platz für den Alpha-Build. Aktuell (inkl. interner Tests) warten '
                    : 'Sign up to secure your spot for the alpha build. Right now (including internal tests) there are '
                }}
                <span class="font-semibold text-cyan-300">{{ waitlistCountDisplay }}</span>
                {{
                  locale === 'de'
                    ? ' Interessierte auf den nächsten Invite-Drop.'
                    : ' interested pilots waiting for the next invite drop.'
                }}
              </p>
            </div>
            <div>
              <div v-if="waitlistLoading" class="text-sm text-white/60">
                {{ locale === 'de' ? 'Lade Warteliste…' : 'Loading waitlist…' }}
              </div>
              <template v-else>
                <div class="text-xs text-white/60">
                  {{ locale === 'de' ? 'Letzte Anmeldung:' : 'Last signup:' }}
                  <span class="font-medium text-white">{{ waitlistLastJoinedFormatted }}</span>
                  <span v-if="waitlistStats?.lastJoinedAt" class="text-white/40">
                    ({{ formatRelativeFromNow(waitlistStats?.lastJoinedAt) }})
                  </span>
                </div>
              </template>
            </div>
            <p class="text-xs text-white/60">
              {{
                locale === 'de'
                  ? 'Wir senden Einladungen in Batches, priorisieren aktive Wartelistenplätze und verschicken Einladungscodes per E-Mail.'
                  : 'We send invites in batches, prioritise active waitlist spots and deliver invite codes via email.'
              }}
            </p>
          </div>
          <form class="space-y-4" @submit.prevent="submitWaitlist">
            <div class="grid gap-3">
              <input
                  v-model.trim="waitlistForm.name"
                  :aria-label="locale === 'de' ? 'Name' : 'Name'"
                  type="text"
                  :placeholder="
                    locale === 'de'
                      ? 'Vor- und Nachname (optional)'
                      : 'First and last name (optional)'
                  "
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <input
                  v-model.trim="waitlistForm.email"
                  :aria-label="locale === 'de' ? 'E-Mail' : 'Email'"
                  type="email"
                  required
                  :placeholder="locale === 'de' ? 'dein@email' : 'your@email'"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 placeholder-white/40 outline-none focus:border-cyan-400"
              />
              <textarea
                  v-model.trim="waitlistForm.notes"
                  rows="3"
                  :placeholder="
                    locale === 'de'
                      ? 'Was möchtest du mit OpenSquawk lernen? (optional)'
                      : 'What do you want to learn with OpenSquawk? (optional)'
                  "
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 placeholder-white/40 outline-none focus:border-cyan-400"
              />
            </div>
            <div class="space-y-2 text-xs text-white/60">
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.subscribeUpdates" class="mt-1" />
                <span>
                  {{
                    locale === 'de'
                      ? 'Ja, informiert mich, wenn neue Features, Drops oder Lerninhalte starten.'
                      : 'Yes, keep me posted when new features, drops or learning content go live.'
                  }}
                </span>
              </label>
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.consentTerms" class="mt-1" required />
                <span>
                  <template v-if="locale === 'de'">
                    Ich akzeptiere die <NuxtLink to="/agb" class="text-cyan-300 underline">AGB</NuxtLink> von OpenSquawk.
                  </template>
                  <template v-else>
                    I accept the <NuxtLink to="/agb" class="text-cyan-300 underline">terms of service</NuxtLink> of OpenSquawk.
                  </template>
                </span>
              </label>
              <label class="flex items-start gap-3">
                <input type="checkbox" v-model="waitlistForm.consentPrivacy" class="mt-1" required />
                <span>
                  <template v-if="locale === 'de'">
                    Ich habe die <NuxtLink to="/datenschutz" class="text-cyan-300 underline">Datenschutzerklärung</NuxtLink> gelesen und willige in die Speicherung meiner Angaben zur Kontaktaufnahme ein.
                  </template>
                  <template v-else>
                    I have read the <NuxtLink to="/datenschutz" class="text-cyan-300 underline">privacy policy</NuxtLink> and consent to storing my details for contact purposes.
                  </template>
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
                {{ locale === 'de' ? 'Sende Daten…' : 'Sending data…' }}
              </span>
              <span v-else>{{ locale === 'de' ? 'Auf Warteliste setzen' : 'Join the waitlist' }}</span>
            </button>
            <p v-if="waitlistSuccess" class="text-sm text-green-300">
              <template v-if="locale === 'de'">
                Danke! Wir haben dich auf der Warteliste eingetragen und melden uns, sobald Plätze frei werden.
              </template>
              <template v-else>
                Thank you! You are on the waitlist and we will reach out as soon as slots open up.
              </template>
              <span v-if="waitlistLastOptInUpdates" class="mt-1 block text-xs text-green-200/80">
                {{
                  locale === 'de'
                    ? 'Zusätzlich erhältst du Produkt-Updates, sobald neue Features live gehen.'
                    : 'You will also receive product updates when new features go live.'
                }}
              </span>
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
          <p class="mt-3 text-white/80">
            {{ locale === 'de' ? 'Kurz beantwortet.' : 'Quick answers.' }}
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <h3 class="font-semibold">
              {{ locale === 'de' ? 'Ist das für reale Luftfahrt?' : 'Is this for real-world aviation?' }}
            </h3>
            <p class="mt-2 text-white/80">
              {{
                locale === 'de'
                  ? 'Nein, OpenSquawk ist für Flugsimulatoren und Training. Nicht für den realen Flugfunk.'
                  : 'No, OpenSquawk is for flight simulators and training. It is not intended for real-world radio comms.'
              }}
            </p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <h3 class="font-semibold">
              {{ locale === 'de' ? 'Welche Simulatoren werden unterstützt?' : 'Which simulators are supported?' }}
            </h3>
            <p class="mt-2 text-white/80">
              {{
                locale === 'de'
                  ? 'MSFS zuerst (Alpha-Fokus), X‑Plane als nächstes. Weitere Simulatoren richten wir nach Community-Bedarf aus.'
                  : 'MSFS first (alpha focus), X-Plane next. Additional simulators will follow community demand.'
              }}
            </p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="200">
            <h3 class="font-semibold">
              {{ locale === 'de' ? 'Kann ich selbst hosten?' : 'Can I self-host?' }}
            </h3>
            <p class="mt-2 text-white/80">
              {{
                locale === 'de'
                  ? 'Alpha: Docker-Compose + Node-Services sind verfügbar. Doku & Installer werden gerade ergänzt. Hosting-Optionen folgen.'
                  : 'Alpha: Docker Compose + Node services are available. Docs and installers are in progress. Hosting options will follow.'
              }}
            </p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="300">
            <h3 class="font-semibold">
              {{ locale === 'de' ? 'Wie günstig ist „Hosted – Basic“?' : 'How affordable is “Hosted – Basic”?' }}
            </h3>
            <p class="mt-2 text-white/80">
              {{
                locale === 'de'
                  ? 'Zielwert aktuell ~4–5 € monatlich, final nach Kosten-Benchmarking. Wir teilen Ergebnisse transparent im Blog.'
                  : 'Current target is ~€4–5 per month, final pricing after cost benchmarking. We will share the results transparently on the blog.'
              }}
            </p>
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
            <p class="mt-3 text-white/70 text-sm">
              {{
                locale === 'de'
                  ? 'Open-source, low-cost AI ATC für Flugsimulatoren. Alpha-Prototyp verfügbar – benötigt leichte Programmierkenntnisse.'
                  : 'Open-source, low-cost AI ATC for flight simulators. Alpha prototype available – basic coding skills recommended.'
              }}
            </p>
          </div>
          <div>
            <h4 class="font-semibold mb-3">{{ locale === 'de' ? 'Produkt' : 'Product' }}</h4>
            <ul class="space-y-2 text-white/70 text-sm">
              <li>
                <NuxtLink to="#features" class="hover:text-cyan-300">
                  {{ locale === 'de' ? 'Vision' : 'Vision' }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="#learn" class="hover:text-cyan-300">
                  {{ locale === 'de' ? 'Lernpfad' : 'Learning path' }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="#pricing" class="hover:text-cyan-300">
                  {{ locale === 'de' ? 'Preise' : 'Pricing' }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="#faq" class="hover:text-cyan-300">FAQ</NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-3">{{ locale === 'de' ? 'Ressourcen' : 'Resources' }}</h4>
            <ul class="space-y-2 text-white/70 text-sm">
              <li>
                <NuxtLink to="#opensource" class="hover:text-cyan-300">
                  {{ locale === 'de' ? 'Open‑Source' : 'Open-source' }}
                </NuxtLink>
              </li>
              <li><NuxtLink to="#news" class="hover:text-cyan-300">News</NuxtLink></li>
              <li>
                <NuxtLink to="#contributing" class="hover:text-cyan-300">
                  {{ locale === 'de' ? 'Mitmachen' : 'Get involved' }}
                </NuxtLink>
              </li>
              <li><a href="mailto:info@opensquawk.de" class="hover:text-cyan-300">info@opensquawk.de</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-3">{{ locale === 'de' ? 'Rechtliches' : 'Legal' }}</h4>
            <ul class="space-y-2 text-white/70 text-sm">
              <li>
                <NuxtLink to="/impressum" class="hover:text-cyan-300">
                  {{ locale === 'de' ? 'Impressum' : 'Imprint' }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/datenschutz" class="hover:text-cyan-300">
                  {{ locale === 'de' ? 'Datenschutz' : 'Privacy' }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/agb" class="hover:text-cyan-300">
                  {{ locale === 'de' ? 'AGB' : 'Terms' }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/api-docs" class="hover:text-cyan-300">
                  {{ locale === 'de' ? 'API-Dokumentation' : 'API documentation' }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
        <div class="mt-8 pt-6 border-t border-white/10 text-xs text-white/60">
          {{
            locale === 'de'
              ? `© ${year} OpenSquawk. Nicht für reale Luftfahrt. *VATSIM/IVAO: Marken der jeweiligen Eigentümer.`
              : `© ${year} OpenSquawk. Not for real-world aviation. *VATSIM/IVAO: trademarks of their respective owners.`
          }}
        </div>
      </div>
    </footer>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useHead, useState } from '#imports'
import { useApi } from '~/composables/useApi'
import { getAllNews } from '~~/shared/utils/news'
import type { NewsPost } from '~~/shared/utils/news'

const api = useApi()

const SUPPORTED_LOCALES = ['de', 'en'] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'de'
const LOCALE_STORAGE_KEY = 'opensquawk-locale'

const locale = useState<Locale>('landing-locale', () => DEFAULT_LOCALE)

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value === 'de' ? 'de-DE' : 'en-US'))
const formatNumber = (value: number | null | undefined) => numberFormatter.value.format(Math.max(0, Math.round(value ?? 0)))
const ROADMAP_SCALE = [1, 2, 3, 4, 5] as const

const isLocale = (value: string | null | undefined): value is Locale =>
  Boolean(value && SUPPORTED_LOCALES.includes(value as Locale))

const detectLocaleFromNavigator = (): Locale => {
  if (!import.meta.client) {
    return DEFAULT_LOCALE
  }
  const navigatorLocales =
    typeof navigator !== 'undefined'
      ? [...(navigator.languages ?? []), navigator.language]
      : []
  for (const lang of navigatorLocales) {
    const normalized = lang?.toLowerCase().split('-')[0] as Locale | undefined
    if (normalized && SUPPORTED_LOCALES.includes(normalized)) {
      return normalized
    }
  }
  return DEFAULT_LOCALE
}

const applyInitialLocale = () => {
  if (!import.meta.client) return
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (isLocale(stored)) {
    locale.value = stored
    return
  }
  locale.value = detectLocaleFromNavigator()
}

watch(
  locale,
  (value) => {
    if (!import.meta.client) return
    localStorage.setItem(LOCALE_STORAGE_KEY, value)
  },
)

const dateLocale = computed(() => (locale.value === 'de' ? 'de-DE' : 'en-US'))
const shortDateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }

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
    const fallback = locale.value === 'de' ? 'Anmeldung fehlgeschlagen' : 'Registration failed'
    const message = err?.data?.statusMessage || err?.message || fallback
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
    const fallback =
      locale.value === 'de' ? 'Konnte Anmeldung nicht speichern' : 'Could not save sign-up'
    const message = err?.data?.statusMessage || err?.message || fallback
    updatesError.value = message
  } finally {
    updatesSubmitting.value = false
  }
}

const formatWaitlistDate = (iso: string) => {
  if (!iso) return locale.value === 'de' ? 'unbekannt' : 'unknown'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return locale.value === 'de' ? 'unbekannt' : 'unknown'
  }
  return parsed.toLocaleDateString(dateLocale.value, shortDateOptions)
}

const formatRelativeFromNow = (iso?: string | null) => {
  if (!iso) return '–'
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return '–'
  const diff = Date.now() - target.getTime()
  const minute = 1000 * 60
  const hour = minute * 60
  const day = hour * 24
  if (diff < minute) return locale.value === 'de' ? 'gerade eben' : 'just now'
  if (diff < hour) {
    const mins = Math.round(diff / minute)
    if (locale.value === 'de') {
      return `vor ${mins} Min`
    }
    return `${mins} min${mins === 1 ? '' : 's'} ago`
  }
  if (diff < day) {
    const hours = Math.round(diff / hour)
    if (locale.value === 'de') {
      return `vor ${hours} Std`
    }
    return `${hours} hr${hours === 1 ? '' : 's'} ago`
  }
  if (diff < day * 14) {
    const days = Math.round(diff / day)
    if (locale.value === 'de') {
      return `vor ${days} Tag${days === 1 ? '' : 'en'}`
    }
    return `${days} day${days === 1 ? '' : 's'} ago`
  }
  const weeks = Math.round(diff / (day * 7))
  if (weeks < 9) {
    if (locale.value === 'de') {
      return `vor ${weeks} Woche${weeks === 1 ? '' : 'n'}`
    }
    return `${weeks} wk${weeks === 1 ? '' : 's'} ago`
  }
  const months = Math.round(diff / (day * 30))
  if (locale.value === 'de') {
    return `vor ${months} Monat${months === 1 ? '' : 'en'}`
  }
  return `${months} mo${months === 1 ? '' : 's'} ago`
}

const formatAverage = (value: number) => {
  const result = value.toFixed(1)
  return locale.value === 'de' ? result.replace('.', ',') : result
}

const formatNewsDate = (iso: string) => {
  const fallback = locale.value === 'de' ? 'folgt' : 'tbd'
  if (!iso) return fallback
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString(dateLocale.value, shortDateOptions)
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
const roadmapStatsLabel = computed(() => {
  const total = formatNumber(roadmapTotals.value)
  const recent = formatNumber(roadmapRecent7Days.value)
  return locale.value === 'de'
    ? `${total} abgegebene Stimmen · letzte 7 Tage: +${recent}`
    : `${total} votes submitted · last 7 days: +${recent}`
})

const roadmapImportanceLabel = (value?: number) => {
  const german: Record<number, string> = {
    1: 'Nettes Add-on, nicht dringend',
    2: 'Kann warten',
    3: 'Wichtig für mich',
    4: 'Sehr wichtig',
    5: 'Top-Priorität',
  }
  const english: Record<number, string> = {
    1: 'Nice to have, not urgent',
    2: 'Can wait',
    3: 'Important for me',
    4: 'Very important',
    5: 'Top priority',
  }
  const labels = locale.value === 'de' ? german : english
  return labels[value ?? 0] || (locale.value === 'de' ? 'Noch nicht bewertet' : 'Not rated yet')
}
const roadmapImportanceShortLabel = (value: number) => {
  const german: Record<number, string> = {
    1: 'Nein',
    2: 'Egal',
    3: 'Später',
    4: 'Wichtig',
    5: 'Top',
  }
  const english: Record<number, string> = {
    1: 'No',
    2: 'Meh',
    3: 'Later',
    4: 'Important',
    5: 'Top',
  }
  const labels = locale.value === 'de' ? german : english
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
    const fallback =
      locale.value === 'de' ? 'Konnte Stimmen nicht speichern' : 'Could not submit votes'
    const message = err?.data?.statusMessage || err?.message || fallback
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
    const fallback =
      locale.value === 'de' ? 'Konnte Vorschlag nicht speichern' : 'Could not save suggestion'
    const message = err?.data?.statusMessage || err?.message || fallback
    roadmapSuggestionError.value = message
  } finally {
    roadmapSuggestionSubmitting.value = false
  }
}

useHead(() => {
  const isGerman = locale.value === 'de'
  const title = isGerman
    ? 'OpenSquawk – Open-source, low-cost AI ATC für Flugsimulatoren'
    : 'OpenSquawk – Open-source, low-cost AI ATC for flight simulation'
  const description = isGerman
    ? 'Wir bauen OpenSquawk: Open-source, low-cost AI ATC für Flugsimulatoren. Community-Roadmap, Self-host & Hosting in Planung, Alpha-Prototyp verfügbar.'
    : 'We are building OpenSquawk: open-source, low-cost AI ATC for flight sim pilots. Community roadmap, self-host today, hosted options in planning.'
  const ogDescription = isGerman
    ? 'Alpha-Prototyp für Simulatorpiloten. Community-getriebene Features, Self-host & geplante Hosting-Optionen.'
    : 'Alpha prototype for sim pilots. Community-driven features, self-host today, hosted options tomorrow.'
  const twitterDescription = isGerman
    ? 'Alpha-Prototyp mit Community-Roadmap. Self-host heute, Hosting morgen.'
    : 'Alpha prototype with community roadmap. Self-host today, hosted later.'

  return {
    htmlAttrs: { lang: isGerman ? 'de' : 'en' },
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'theme-color', content: '#0ea5e9' },
      { property: 'og:title', content: 'OpenSquawk – Open-source, low-cost AI ATC' },
      { property: 'og:description', content: ogDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: 'https://opensquawk.example.com/cover.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'OpenSquawk – Open-source, low-cost AI ATC' },
      { name: 'twitter:description', content: twitterDescription },
      { name: 'twitter:image', content: 'https://opensquawk.example.com/cover.png' },
    ],
  }
})

onMounted(async () => {
  applyInitialLocale()
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
.pricing-card { overflow: visible; }
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
