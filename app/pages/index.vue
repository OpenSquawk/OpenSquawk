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
        <div class="mt-10 md:mt-16" data-aos="zoom-in" data-aos-delay="100">
          <div class="card relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent"></div>
            <img src="https://images.unsplash.com/photo-1509749837427-392dfae2dbd1?q=80&w=1600&auto=format&fit=crop" alt="Cockpit" class="rounded-xl w-full object-cover" />
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
              <NuxtLink to="#cta" class="btn btn-primary">Jetzt loslegen</NuxtLink>
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
        <div class="card md:flex md:items-center md:justify-between" data-aos="zoom-in">
          <div>
            <h3 class="text-2xl md:text-3xl font-semibold">Jetzt OpenSquawk ausprobieren</h3>
            <p class="mt-2 text-white/80">Starte kostenlos. Upgrade jederzeit. Keine Bindung.</p>
          </div>
          <form class="mt-4 md:mt-0 flex w-full md:w-auto gap-2" @submit.prevent="submitEmail">
            <input v-model="email" aria-label="E‑Mail" type="email" required placeholder="dein@email" class="w-full md:w-72 px-4 py-3 rounded-xl bg-white/5 border border-white/10 placeholder-white/40 outline-none focus:border-cyan-400" />
            <button class="btn btn-primary">Einladung anfordern</button>
          </form>
        </div>
        <p v-if="thanks" class="mt-3 text-sm text-green-300" data-aos="fade-in">Danke! Wir melden uns in Kürze mit deinem Zugang.</p>
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
              <li><NuxtLink to="#" class="hover:text-cyan-300">Impressum</NuxtLink></li>
              <li><NuxtLink to="#" class="hover:text-cyan-300">Datenschutz</NuxtLink></li>
              <li><NuxtLink to="#" class="hover:text-cyan-300">Nutzungshinweise</NuxtLink></li>
            </ul>
          </div>
        </div>
        <div class="mt-8 pt-6 border-t border-white/10 text-xs text-white/60">© {{ year }} OpenSquawk. Nicht für reale Luftfahrt. *VATSIM/IVAO: Marken der jeweiligen Eigentümer.</div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHead } from '#imports'

const yearly = ref(true)
const email = ref('')
const thanks = ref(false)
const year = new Date().getFullYear()

function submitEmail(){
  // TODO: replace with real endpoint
  console.log('request access:', email.value)
  thanks.value = true
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

// AOS: falls du kein Nuxt‑AOS Modul nutzt, hier Fallback
onMounted(async () => {
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
</style>
