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
          <NuxtLink to="#features" class="hover:text-cyan-300">Features</NuxtLink>
          <NuxtLink to="#roadmap" class="hover:text-cyan-300">Roadmap</NuxtLink>
          <NuxtLink to="#learn" class="hover:text-cyan-300">Lernpfad</NuxtLink>
          <NuxtLink to="#pricing" class="hover:text-cyan-300">Preise</NuxtLink>
          <NuxtLink to="#opensource" class="hover:text-cyan-300">Open‑Source</NuxtLink>
          <NuxtLink to="#faq" class="hover:text-cyan-300">FAQ</NuxtLink>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink to="#demo" class="btn btn-ghost text-sm">Live‑Demo</NuxtLink>
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
          <span class="chip mb-4">Open‑Source · AI‑ATC · Simulator</span>
          <h1 class="text-4xl md:text-6xl font-semibold leading-tight">OpenSquawk<br/><span class="text-cyan-400">AI‑ATC, offen & bezahlbar</span></h1>
          <p class="mt-4 md:mt-6 text-white/80 text-base md:text-lg">Offene Alternative für AI‑ATC im Flugsimulator. Lerne echte Phraseologie, übe sichere Abläufe und steige Schritt für Schritt Richtung VATSIM ein. Optional als gehosteter Plan – so günstig wie möglich.</p>
          <div class="flex flex-col sm:flex-row gap-3 mt-6">
            <NuxtLink to="#cta" class="btn btn-primary text-base">Frühzugang sichern</NuxtLink>
            <NuxtLink to="#video" class="btn btn-ghost text-base">1‑Min‑Überblick ansehen</NuxtLink>
          </div>
          <div class="mt-6 flex items-center gap-4 text-white/70 text-sm">
            <div class="flex -space-x-3">
              <img alt="avatar" src="https://i.pravatar.cc/40?img=1" class="w-8 h-8 rounded-full border border-white/10"/>
              <img alt="avatar" src="https://i.pravatar.cc/40?img=2" class="w-8 h-8 rounded-full border border-white/10"/>
              <img alt="avatar" src="https://i.pravatar.cc/40?img=3" class="w-8 h-8 rounded-full border border-white/10"/>
            </div>
            <p><b>1500+</b> Pilot:innen im Early‑Access</p>
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
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 items-center opacity-80">
          <div class="flex items-center justify-center gap-2 text-white/60"><v-icon icon="mdi-microsoft-xbox" class="opacity-70"/>MSFS</div>
          <div class="flex items-center justify-center gap-2 text-white/60"><v-icon icon="mdi-airplane" class="opacity-70"/>X‑Plane</div>
          <div class="flex items-center justify-center gap-2 text-white/60"><v-icon icon="mdi-headset" class="opacity-70"/>VATSIM* (Lernpfad)</div>
          <div class="flex items-center justify-center gap-2 text-white/60"><v-icon icon="mdi-radar" class="opacity-70"/>IVAO* (Lernpfad)</div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section id="features" class="py-16 md:py-24 bg-gradient-to-b from-[#0a0f1c] to-[#0b1020]">
      <div class="container-outer">
        <div class="max-w-2xl mb-10" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-semibold">Warum OpenSquawk?</h2>
          <p class="mt-3 text-white/80">Echtzeit‑Funk mit KI, lernfreundliche Erklärungen und offene Architektur – damit du souverän taxi, departure, approach & landing beherrschst.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20"><v-icon icon="mdi-tower-fire" class="text-cyan-300"/></div>
              <h3 class="font-semibold text-lg">AI‑ATC in Echtzeit</h3>
            </div>
            <p class="mt-3 text-white/80">Streaming‑ASR, LLM‑Verständnis & TTS Stimmen. Klar, schnell, latenzarm – optimiert für Phraseologie.</p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20"><v-icon icon="mdi-school" class="text-cyan-300"/></div>
              <h3 class="font-semibold text-lg">Lernpfad → VATSIM</h3>
            </div>
            <p class="mt-3 text-white/80">Geführte Übungen, Checks & Erklärungen – vom Readback bis zu komplexen Clearances. Schrittweise Richtung Online‑Netzwerke.</p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="200">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/20"><v-icon icon="mdi-source-repository" class="text-cyan-300"/></div>
              <h3 class="font-semibold text-lg">Open‑Source + Hosted</h3>
            </div>
            <p class="mt-3 text-white/80">Selbst hosten oder unseren günstigen Plan nutzen. Transparente Architektur, Community‑Plugins & APIs.</p>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mt-6">
          <div class="card" data-aos="fade-up" data-aos-delay="0">
            <h3 class="font-semibold text-lg">Taxi‑Routen & Ground Awareness</h3>
            <p class="mt-3 text-white/80">OSM/apt.dat‑basierte Taxiway‑Graphen, A*‑Routing zu Holding Points, progressive Anweisungen mit Visual‑Overlay.</p>
            <ul class="mt-3 space-y-2 text-white/70 text-sm list-disc list-inside">
              <li>„Taxi to RWY 25C via A, A5, B2…“</li>
              <li>Hotspot‑Vermeidung & progressive Readbacks</li>
              <li>Optional: NOTAM/ATIS Einbindung</li>
            </ul>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="100">
            <h3 class="font-semibold text-lg">Tech‑Stack</h3>
            <p class="mt-3 text-white/80">Streaming‑ASR, LLM‑Dialog, TTS – orchestriert mit WebRTC/WS. Offline‑Fallbacks möglich.</p>
            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-waveform"/>ASR: Whisper/Alternativen</div>
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-robot"/>LLM: GPT‑5‑Nano/4o‑Mini</div>
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-microphone"/>TTS: neural voices</div>
              <div class="glass rounded-xl p-3 flex items-center gap-2"><v-icon icon="mdi-routes"/>Routing: A* / Dijkstra</div>
            </div>
          </div>
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
                    <span>Weniger</span>
                    <span>Priorität</span>
                  </div>
                  <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      v-model.number="roadmapSelections[item.key]"
                      @change="markRoadmapTouched(item.key)"
                      class="roadmap-range"
                      :aria-label="`Priorität für ${item.title}`"
                  />
                  <div class="text-sm text-white/80">
                    {{ roadmapImportanceLabel(roadmapSelections[item.key]) }}
                    <span v-if="roadmapTouched[item.key]" class="text-cyan-300">• markiert</span>
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
                  Tipp: Slider nur verändern, wenn du zu dem Punkt Feedback hast.
                </p>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- LEARN PATH -->
    <section id="learn" class="py-16 md:py-24 bg-[#0b1020]">
      <div class="container-outer">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div data-aos="fade-right">
            <h2 class="text-3xl md:text-4xl font-semibold">ATC verstehen – Schritt für Schritt</h2>
            <p class="mt-3 text-white/80">Geführter Lernmodus: Hören, Nachsprechen, Feedback. Vom ersten „Ready to taxi“ bis zur komplexen STAR/Approach‑Freigabe.</p>
            <ol class="mt-5 space-y-3 text-white/80">
              <li class="flex gap-3"><span class="chip">1</span><span><b>Basics</b>: Alphabet, Zahlen, Standard‑Phrasen, Readback.</span></li>
              <li class="flex gap-3"><span class="chip">2</span><span><b>Ground</b>: Taxi‑Flows, Hotspots, Holding‑short.</span></li>
              <li class="flex gap-3"><span class="chip">3</span><span><b>Departure</b>: SID, Altitudes, Heading/Speed.</span></li>
              <li class="flex gap-3"><span class="chip">4</span><span><b>Arrival</b>: STAR, Vectors, Approach Briefing.</span></li>
              <li class="flex gap-3"><span class="chip">5</span><span><b>VATSIM</b>: Checklisten, Etiquette, Live‑Übungen.</span></li>
            </ol>
            <div class="mt-6 flex gap-3">
              <NuxtLink to="/learn" class="btn btn-primary">Jetzt loslegen</NuxtLink>
              <NuxtLink to="#faq" class="btn btn-ghost">FAQ</NuxtLink>
            </div>
          </div>
          <div class="card" data-aos="fade-left">
            <ClientOnly>
              <video id="video" class="w-full rounded-xl" autoplay muted loop playsinline poster="https://images.unsplash.com/photo-1518306724291-1f5c9b4d2452?q=80&w=1600&auto=format&fit=crop">
                <source src="https://cdn.coverr.co/videos/coverr-airplane-taking-off-8255/1080p.mp4" type="video/mp4" />
              </video>
            </ClientOnly>
            <p class="mt-3 text-xs text-white/60">Kurzclip: Symbolisch für den Lernpfad</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING -->
    <section id="pricing" class="py-16 md:py-24 bg-gradient-to-b from-[#0b1020] to-[#0a0f1c]">
      <div class="container-outer">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4" data-aos="fade-up">
          <div class="max-w-2xl">
            <h2 class="text-3xl md:text-4xl font-semibold">Preise</h2>
            <p class="mt-3 text-white/80">Open‑Source bleibt frei. Der gehostete Plan ist so günstig wie möglich kalkuliert. Umschalten:
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
            <NuxtLink to="#opensource" class="btn btn-ghost w-full mt-6">Repository ansehen</NuxtLink>
          </div>
          <!-- Hosted Basic -->
          <div class="card border-2 border-cyan-400/40 relative shadow-[0_0_40px_rgba(34,211,238,.25)]" data-aos="fade-up" data-aos-delay="100">
            <div class="absolute -top-3 right-4 chip bg-cyan-500/30 border-cyan-400/50">Empfohlen</div>
            <h3 class="text-xl font-semibold">Hosted – Basic</h3>
            <p class="mt-2 text-white/80">Alles fertig eingerichtet. Ideal zum Lernen & Üben.</p>
            <div class="mt-5 text-3xl font-semibold"><span>{{ yearly ? '4,00€' : '4,50€' }}</span><span class="text-white/60 text-sm font-normal"> / Monat</span></div>
            <ul class="mt-5 space-y-2 text-white/80 text-sm">
              <li>✔ Fair‑Use Audio‑Minuten</li>
              <li>✔ Lernpfad & Fortschritt</li>
              <li>✔ Updates & Cloud‑Scaling</li>
            </ul>
            <NuxtLink to="#cta" class="btn btn-primary w-full mt-6">Kostenlos testen</NuxtLink>
            <p class="mt-3 text-xs text-white/60">Preisziel: minimal + Betriebskosten. Änderungen möglich.</p>
          </div>
          <!-- Hosted Pro -->
          <div class="card relative" data-aos="fade-up" data-aos-delay="200">
            <div class="absolute -top-3 right-4 chip">Power‑User</div>
            <h3 class="text-xl font-semibold">Hosted – Pro</h3>
            <p class="mt-2 text-white/80">Mehr Kontingente, eigene Stimmen, API‑Zugriff.</p>
            <div class="mt-5 text-3xl font-semibold"><span>{{ yearly ? '12€' : '14€' }}</span><span class="text-white/60 text-sm font-normal"> / Monat</span></div>
            <ul class="mt-5 space-y-2 text-white/80 text-sm">
              <li>✔ Höhere Limits</li>
              <li>✔ Team‑Seats</li>
              <li>✔ Priorisierter Support</li>
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
            <div class="mt-6 flex gap-3">
              <NuxtLink to="#cta" class="btn btn-primary">Mitmachen</NuxtLink>
              <NuxtLink to="#demo" class="btn btn-ghost">Demo</NuxtLink>
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

    <!-- CTA -->
    <section id="cta" class="py-16 md:py-24 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent border-y border-white/10">
      <div class="container-outer">
        <div class="card grid gap-8 md:grid-cols-2" data-aos="zoom-in">
          <div class="space-y-4">
            <div>
              <h3 class="text-2xl md:text-3xl font-semibold">Frühzugang & Warteliste</h3>
              <p class="mt-2 text-white/80">
                Trag dich ein und sichere dir deinen Platz. Aktuell warten
                <span class="font-semibold text-cyan-300">{{ waitlistCountDisplay }}</span>
                Pilot:innen auf den nächsten Invite-Drop.
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
            <p class="mt-2 text-white/80">MSFS, X‑Plane (weitere geplant). Integrationen per Plugin‑SDK.</p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="200">
            <h3 class="font-semibold">Kann ich selbst hosten?</h3>
            <p class="mt-2 text-white/80">Ja. Docker‑Compose/Helm bereitgestellt. Hosted‑Plan als bequeme Alternative.</p>
          </div>
          <div class="card" data-aos="fade-up" data-aos-delay="300">
            <h3 class="font-semibold">Wie günstig ist „Hosted – Basic“?</h3>
            <p class="mt-2 text-white/80">Ziel: knapp über Betriebskosten. Pilotphase mit 4–5€ mtl. (vorläufig).</p>
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
            <p class="mt-3 text-white/70 text-sm">Open‑Source AI‑ATC für Simulatorpiloten. Lernpfad & günstiger Hosted‑Plan.</p>
          </div>
          <div>
            <h4 class="font-semibold mb-3">Produkt</h4>
            <ul class="space-y-2 text-white/70 text-sm">
              <li><NuxtLink to="#features" class="hover:text-cyan-300">Features</NuxtLink></li>
              <li><NuxtLink to="#learn" class="hover:text-cyan-300">Lernpfad</NuxtLink></li>
              <li><NuxtLink to="#pricing" class="hover:text-cyan-300">Preise</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-3">Ressourcen</h4>
            <ul class="space-y-2 text-white/70 text-sm">
              <li><NuxtLink to="#opensource" class="hover:text-cyan-300">Open‑Source</NuxtLink></li>
              <li><NuxtLink to="#demo" class="hover:text-cyan-300">Demo</NuxtLink></li>
              <li><NuxtLink to="#faq" class="hover:text-cyan-300">FAQ</NuxtLink></li>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useHead } from '#imports'
import { useApi } from '~/composables/useApi'

const api = useApi()

const numberFormatter = new Intl.NumberFormat('de-DE')
const formatNumber = (value: number | null | undefined) => numberFormatter.format(Math.max(0, Math.round(value ?? 0)))

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
})

const waitlistSubmitting = ref(false)
const waitlistSuccess = ref(false)
const waitlistError = ref('')
const waitlistStats = ref<WaitlistStats | null>(null)
const waitlistLoading = ref(false)

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

  try {
    await api.post('/api/service/waitlist', { ...waitlistForm }, { auth: false })
    waitlistSuccess.value = true
    await loadWaitlistStats()
    waitlistForm.name = ''
    waitlistForm.email = ''
    waitlistForm.notes = ''
    waitlistForm.consentPrivacy = false
    waitlistForm.consentTerms = false
  } catch (err: any) {
    const message = err?.data?.statusMessage || err?.message || 'Anmeldung fehlgeschlagen'
    waitlistError.value = message
  } finally {
    waitlistSubmitting.value = false
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

const markRoadmapTouched = (key: string) => {
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

useHead({
  title: 'OpenSquawk – Open‑Source AI‑ATC für Simulatorpiloten',
  meta: [
    { name: 'description', content: 'OpenSquawk ist die offene, günstige Alternative für AI‑ATC im Flugsimulator – mit Lernpfad zu echter Funkphraseologie und sanftem Einstieg Richtung VATSIM.' },
    { name: 'theme-color', content: '#0ea5e9' },
    { property: 'og:title', content: 'OpenSquawk – Open‑Source AI‑ATC' },
    { property: 'og:description', content: 'Open, günstig, lernfreundlich. AI‑ATC mit Lernpfad & gehostetem Plan.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://opensquawk.example.com/cover.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'OpenSquawk – Open‑Source AI‑ATC' },
    { name: 'twitter:description', content: 'Open, günstig, lernfreundlich. AI‑ATC mit Lernpfad & gehostetem Plan.' },
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
.roadmap-range {
  width: 100%;
  accent-color: #22d3ee;
  cursor: pointer;
}
.roadmap-range:focus {
  outline: none;
}
.roadmap-range::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  background: #22d3ee;
  border-radius: 9999px;
  border: none;
  box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.25);
}
.roadmap-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #22d3ee;
  border-radius: 9999px;
  border: none;
  box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.25);
}
</style>
