# OpenSquawk – CI-Guidelines & Produkt-Spezifikation

## 1) Brand Basics

* **Name:** OpenSquawk
* **Claim:** Open-Source AI-ATC für Simulatorpiloten
* **Ton:** technisch, knapp, vertrauenswürdig. Keine Superlative, kein Marketing-Overkill.

### Farbpalette (Brand + UI Tokens)

Primär basiert auf dunklem Navy mit Cyan-Akzenten.

```txt
--brand.bg        = #0b1020      // Grundfläche (Hero/Body)
--brand.bg-2      = #0a0f1c      // Sektionen/Alternation
--brand.accent    = #22d3ee      // Cyan 400 (Tailwind) – Highlights
--brand.accent-2  = #0ea5e9      // Sky 500 – Buttons/Links
--brand.text      = #ffffff
--brand.text-2    = rgba(255,255,255,.80)
--brand.text-3    = rgba(255,255,255,.60)
--brand.border    = rgba(255,255,255,.10)
--brand.glow      = rgba(34,211,238,.25)

Neutral & Status:
--neutral-100 = #111317
--neutral-200 = #1f2430
--success     = #4caf50
--info        = #2196f3
--warning     = #fb8c00
--error       = #b00020
```

### Typografie

* **Font:** System-UI oder Inter (Fallback: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif`)
* **Größen:**

    * H1: 36–60px (Hero 48–60)
    * H2: 28–36px
    * H3: 18–20px
    * Body: 16–18px
    * Caption/Meta: 12–14px
* **Gewichte:** 600 für Headlines, 400–500 für Fließtext.
* **Zeilenhöhe:** 1.2 Headlines, 1.6 Body.
* **Zahlen:** Tabular Lining (wenn verfügbar).

### Spacing & Layout

* **Container:** `.container-outer` max-width 1200px, Padding X 16–24px.
* **Grid:** 12-Spalten responsiv; Gap 16–24px.
* **Spacing-Scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px.

### Ecken, Border, Schatten

* **Radius:** Karten/Inputs/Buttons `12–16px` (Tailwind `rounded-xl`).
* **Border:** 1px `--brand.border`.
* **Shadow (Akzent):** weiches Cyan-Glow für Callouts/Primary Cards.

### Motion

* **AOS:** `once: true; duration: 600; easing: ease-out`.
  Verwenden für „in view“ (fade, zoom, slide). Keine übertriebenen Parallax-Effekte.
* **Transitions:** 150–250ms für Hover/Focus/Expand.

### Bildsprache

* Dunkle Cockpit-/Radar-Anmutung. Unsplash-Platzhalter ok, Kennzeichnung „Symbolbild“.
* **Overlays:** dezente Gradients in Cyan/Blue mit geringer Opazität.

---

## 2) Design-Bausteine (Tailwind + Hilfsklassen)

### Utilities / Helper

* `.gradient-hero`: radial/linear Mix mit Cyan/Blue weichen Flecken (Blur 2–3xl).
* `.card`: `rounded-xl bg-white/5 border border-white/10 p-5 md:p-6 backdrop-blur-sm`.
* `.glass`: `rounded-xl border border-white/10 bg-white/5 backdrop-blur`.
* `.chip`: `inline-flex items-center h-7 px-3 rounded-full border border-white/10 bg-white/5 text-sm`.

### Buttons

* **Primary:** Cyan/Sky, solider Hintergrund.
* **Ghost:** Transparenter Hintergrund, Border sichtbar, Text in `--brand.text`.
* **Disabled:** 50% Opazität, Cursor not-allowed.

**Tailwind-Snippets:**

```html
<a class="btn btn-primary">...</a>
<!-- Mapping -->
.btn{ @apply inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium transition; }
.btn-primary{ @apply bg-sky-500 hover:bg-sky-400 text-white shadow; }
.btn-ghost{ @apply bg-white/5 hover:bg-white/10 border border-white/10 text-white; }
```

### Links

* Farbe Sky/Cyan, `hover:opacity-80` oder leichte Unterstreichung.

### Chips/Badges

* Klein, abgerundet, niedrige Sättigung (bg-white/5), für Status/Filter.

### Cards

* Inhaltliche Blöcke, Header (Icon + H3), Body (Text/Listen), optionale Footer-Actions.

### Listen

* Bullets: `list-disc list-inside`, Farbe `text-white/70`.

### Tabellen

* Sehr sparsam; sonst Cards + Definition Lists bevorzugen.

---

## 3) Barrierefreiheit

* **Kontrast:** Buttons/Links ≥ WCAG AA.
* **Focus States:** gut sichtbar (Outline/Shadow in Cyan).
* **ARIA:** semantische Landmarken (`header/nav/main/section/footer`), `aria-label` bei Icons.
* **Motion-Respect:** `prefers-reduced-motion` → AOS deaktivieren/verkürzen.
* **Alt-Texte:** Beschreibend, keine redundanten Wörter.

---

## 4) SEO/Meta

* **Title:** `OpenSquawk – Open-Source AI-ATC`
* **Description:** aus Landing übernommen (\~155 Zeichen).
* **OpenGraph/Twitter:** Cover 1200×630, konsistent.
* **robots.txt:** indexierbar; Disallow ausschließlich Dev-/Internes.
* **Sitemap:** `/sitemap.xml`.

---

## 5) Nuxt / Tailwind / AOS / Vuetify – Setup

### Nuxt-Module

* `@nuxtjs/tailwindcss`, `@nuxt/image`, AOS-Plugin, Vuetify (SSR-ready), Iconfont MDI.

### Tailwind Basiskonfig (Auszug)

```js
// tailwind.config.cjs
module.exports = {
  content: ['app.vue','components/**/*.{vue,js}','pages/**/*.vue'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0b1020',
          bg2: '#0a0f1c',
          accent: '#22d3ee',
          accent2: '#0ea5e9',
          border: 'rgba(255,255,255,.10)'
        }
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
      boxShadow: { glow: '0 0 40px rgba(34,211,238,.25)' }
    }
  }
}
```

### AOS (client-only)

```ts
// plugins/aos.client.ts
import AOS from 'aos'
import 'aos/dist/aos.css'
export default defineNuxtPlugin(() => {
  AOS.init({ once: true, duration: 600, easing: 'ease-out' })
})
```

### Vuetify – Konfiguration & Defaults

Ziel: Vuetify nur für komplexe Controls (Dialogs, Menüs, Loaders, Grid wenn nötig). Stil an Tailwind anpassen.

```ts
// plugins/vuetify.ts
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'dark',
      themes: {
        dark: {
          colors: {
            background: '#121212',
            surface: '#212121',
            primary: '#2196f3',      // Info/Sky
            secondary: '#54b6b2',    // Akzent weich
            error: '#b00020',
            warning: '#fb8c00',
            success: '#4caf50',
            info: '#2196f3',
            onBackground: '#ffffff',
            onSurface: '#ffffff'
          }
        }
      }
    },
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
    defaults: {
      VBtn: {
        rounded: 'xl',
        height: 44,
        class: 'font-medium',
        color: 'primary',
        variant: 'flat'
      },
      VCard: {
        rounded: 'xl',
        elevation: 0,
        class: 'border border-white/10 bg-white/5 backdrop-blur'
      },
      VTextField: {
        rounded: 'xl',
        variant: 'outlined',
        color: 'primary',
        class: 'bg-white/5'
      },
      VProgressCircular: { color: 'primary' }
    }
  })
  nuxtApp.vueApp.use(vuetify)
})
```

**Empfehlung:** Tailwind für Layout/Look, Vuetify gezielt für komplexe Interaktionen. Keine gemischten Button-Varianten im selben Screen.

---

## 6) Komponenten-Inventar (Landing & App)

### Global

* **AppNav** (Logo, Sektionen, CTA)
* **AppFooter** (Produkt/Links/Recht)
* **Section** Wrapper (Hintergründe: bg, gradient)
* **Card**, **Chip**, **CTAForm** (E-Mail Invite)

### Landing-Spezifisch

* **Hero** (Headline, Unterzeile, CTAs, Social Proof Avatare)
* **LogoBar** (MSFS/X-Plane/VATSIM/IVAO Hinweise)
* **FeaturesGrid** (Icon + H3 + Body)
* **LearnPath** (Schritte 1–5 mit Chips)
* **Pricing** (3 Pläne, Toggle jährlich/monatlich, „Empfohlen“)
* **OpenSource** (Bullets + Code-Block)
* **HowItWorks** (4-Schritte)
* **FAQ** (Cards)

### Web-App/Software (Core)

* **PTTButton** (Push-to-Talk, Zustand: idle/listening/processing)
* **TranscriptPane** (ASR-Streams, Zeitstempel, Confidence)
* **ATCPanel** (aktuelle Clearance, Readback-Hints)
* **TaxiMap** (Ground-Overlay, A\* Route, Hotspots)
* **FlightStrip** (Callsign, Type, DEP/ARR, SSR)
* **ATISWidget** (Frequenz/Info/Runways)
* **LearningCoach** (Step-Prompts, Feedback, Score)
* **Settings** (Audio I/O, TTS-Voice, Sensitivität, Netzwerke)
* **SessionLog** (JSON-Export, Replays)
* **StatusBar** (Conn, Latency, CPU/GPU, Model)

---

## 7) Produkt-Spezifikation (High Level)

### Ziele

* Latenzarmes AI-ATC für MSFS/X-Plane, Lernmodus mit progressivem Schwierigkeitsgrad, sanfte Brücke Richtung VATSIM/IVAO.

### Architektur (vereinfacht)

* **Client (Nuxt 4, WebRTC/WS):** Audio-Capture (Opus/PCM), UI, Map Overlay, Local Cache.
* **Edge/API (Node 20/22):**

    * **ASR Service:** Whisper (lokal/hosted) + Alternativen; Streaming; VAD.
    * **NLU/LLM Orchestrator:** Prompt-Builder (ATC-State, Airfield DB, ATIS/NOTAM optional), Tool-Use (Routing).
    * **Logic Engine:** State Machine (GROUND/DEP/ENR/ARR), Validierung (Charts/Constraints), Readback-Checker.
    * **TTS:** Neural Voices (multi-voice, rate/pitch).
    * **Routing Service:** apt.dat/OSM Parser → Taxiway-Graph → A\*/Dijkstra → Segmente/Anweisungen.
    * **Simulator Bridges:** MSFS SimConnect / X-Plane UDP/SDK Plugins.
    * **Persistence:** MongoDB/Postgres (Sessions, User, Progress).
    * **Telemetry:** Prometheus + Loki/Grafana.

### Datenmodelle (Kurz)

* **User** { email, plan, settings, progress }
* **Session** { id, callsign, icao, phase, events\[] }
* **Transcript** { sessionId, role: pilot/atc, text, ts, conf }
* **TaxiGraph** { icao, nodes\[], edges\[], hotspots\[] }
* **Clearance** { type, constraints, validity }
* **ATIS** { icao, info, rwys, wind, qnh, ts }

### State Machine (Ausschnitt)

* `GROUND_IDLE → REQUEST_TAXI → TAXI_ASSIGNED → TAXI_PROGRESS → HOLD_SHORT → LINE_UP → DEPARTURE_HANDOFF`
* Ereignisse: `PTT_START`, `ASR_PARTIAL`, `ASR_FINAL`, `NLU_INTENT`, `ROUTE_OK`, `VIOLATION`, `HANDOFF`.

### Lernpfad

* **Module:** Basics, Ground, Departure, Arrival, VATSIM.
* **Mechanik:** Prompt → Nachsprechen → Auto-Bewertung (Keywords + Fuzzy + Prosodie) → Feedback → Score/Badges.
* **Progress-Save:** pro Modul/Skill.

### Limits / Pläne

* **Self-host:** alles frei, eigene Keys.
* **Hosted Basic:** Fair-Use Audio-Minuten, Standard-Voices, Lernpfad.
* **Hosted Pro:** höhere Limits, Custom Voices, API, Team-Seats.

---

## 8) Interaktions-Spezifikation (UI/UX Kern)

### PTT-Flow

1. Idle → User hält Taste/Btn.
2. `listening`: ASR Partial im TranscriptPane (grau), Levelmeter sichtbar.
3. `processing`: Spinner (VProgressCircular), „Verstehe…“.
4. `reply`: TTS spielt, Transcript ATC (blau) + Readback-Vorschlag.

### Taxi-Overlay

* Route in Cyan, Knoten/Gates beschriftet, Hotspots rot.
* Schrittweise Anweisungen („via A, A5, B2…“), „Next turn“ Callouts.
* Zoom-Preset: Ground 17–18, Smooth Pan.

### Fehler/Violations

* Soft-Warn (gelb) mit kurzer Guidance, bei Hard-Violations klare Stop-Anweisung.

---

## 9) Vuetify-Komponenten – Einsatzrichtlinien

* **VBtn:** Primary Aktionen. Größe konsistent (`height:44`, `rounded:'xl'`). Nur `color='primary'` oder `variant='outlined'` für sekundäre.
* **VCard:** Container für Inhalte/Lists/Forms. Keine erhöhte Elevation; stattdessen Border+Glass.
* **VIcon:** MDI einheitlich. Größe 20–28px je nach Kontext.
* **VTextField / VSelect:** abgerundet, `variant="outlined"`, dezente Hintergründe (`bg-white/5`).
* **VDialog / VMenu / VSheet:** sparsam, fokussiert.
* **VProgressCircular / VProgressLinear:** Status/Ladeanzeige, Primary-Farbe.
* **VGrid:** nur wenn komplexere Layouts nötig sind; sonst Tailwind Grid/Flex.

**Wichtig:** Tailwind verantwortet Layout und visuelle Tokens; Vuetify liefert Verhalten/Accessibility der komplexen Controls. Keine konkurrierenden Styles (entweder über Defaults oder Utility-Klassen, nicht beides pro Eigenschaft).

---

## 10) Karten & Icons

* **Icon-Set:** Material Design Icons (mdi) – konsistente Semantik:

    * ATC/Funk: `mdi-radar`, `mdi-microphone`, `mdi-headset`
    * Routing: `mdi-routes`, `mdi-map-marker-path`
    * Lernen: `mdi-school`, `mdi-clipboard-check`
    * System: `mdi-cog`, `mdi-console`, `mdi-docker`

---

## 11) Textbausteine (Deutsch, kurz)

* Disclaimer: „Nicht für reale Luftfahrt. Nur Flugsimulator/Training.“
* VATSIM/IVAO: „Marken der jeweiligen Eigentümer.“
* CTA: „Jetzt ausprobieren“, „Einladung anfordern“, „Repository ansehen“.

---

## 12) Qualität & Testing

* **Visual Regression:** Playwright + Screenshot-Baselines (Dark Mode).
* **A11y:** axe-checks in CI.
* **Perf:** Lighthouse ≥ 90, Bilder `nuxt/image` mit `format=webp,avif`, `loading=lazy`.
* **i18n:** En/De Keys, kein Hardcode in Komponenten.

---

## 13) Beispiel: Section-Pattern (Vue)

```vue
<section class="py-16 md:py-24 bg-[var(--brand-bg2)] border-t border-white/10" data-aos="fade-up">
  <div class="container-outer">
    <div class="max-w-2xl mb-10">
      <h2 class="text-3xl md:text-4xl font-semibold">Titel</h2>
      <p class="mt-3 text-white/80">Unterzeile…</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="card">…</div>
      <div class="card">…</div>
      <div class="card">…</div>
    </div>
  </div>
</section>
```

---

## 14) Tech-Stack & Envs

* **Node:** 20/22, **Nuxt 4**, **Tailwind**, **Vuetify**, **AOS**.
* **Build:** Nitro SSR, Edge-friendly.
* **ENV:** `ASR_PROVIDER`, `LLM_PROVIDER`, `TTS_PROVIDER`, `MAPBOX_TOKEN` (optional), `DB_URI`, `SIM_BRIDGE_PORT`.
* **Self-host:** Docker Compose (api, router, asr, tts, db, web).

---

## 15) API-Skizzen

```http
POST /api/ptt/start        // Session + Audio stream init (WebRTC/WS)
POST /api/route/taxi       // { icao, from:{type,ref}, to:{type,ref} } → Segmente + Readback
GET  /api/atis/:icao
GET  /api/sessions/:id/transcripts
POST /api/learn/evaluate   // { text, target } → score, hints
```

---

## 16) Lizenz & Recht

* OSS: MIT oder Apache-2.0 (tbd).
* Marken/Disclaimer sichtbar im Footer.
* Datenschutz: keine persönlichen Sprachaufnahmen speichern ohne Opt-In; falls nötig → Pseudonymisierung.

---

## 17) Roadmap (Kurz)

1. **MVP:** PTT → ASR → NLU → TTS (Ground only) + Taxi-Routing EDDF/EGLL Demo.
2. Lernpfad **Basics/Ground**, Progress Save.
3. **Bridges** (MSFS/X-Plane), ATIS-Integration.
4. **Hosted Plan** mit Fair-Use, Billing.
5. **Pro**: Custom Voices, Team, API Tokens.

---

## 18) Copy-Standards

* Zahlen im Funk: „Tree“, „Fife“, „Niner“ optional als Lernmodus-Übersetzung.
* Numerik im UI normal (123), im TTS/Transcript ATC-konform.

---

## 19) Beispiel: Pricing Card (Tailwind + Vuetify Defaults kompatibel)

```html
<div class="card border-2 border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,.25)]">
  <div class="chip bg-cyan-500/30 border-cyan-400/50 -mt-5 float-right">Empfohlen</div>
  <h3 class="text-xl font-semibold">Hosted – Basic</h3>
  <p class="mt-2 text-white/80">Alles fertig eingerichtet. Ideal zum Lernen & Üben.</p>
  <div class="mt-5 text-3xl font-semibold">4,00€ <span class="text-white/60 text-sm font-normal">/ Monat</span></div>
  <ul class="mt-5 space-y-2 text-white/80 text-sm">
    <li>✔ Fair-Use Audio-Minuten</li>
    <li>✔ Lernpfad & Fortschritt</li>
    <li>✔ Updates & Cloud-Scaling</li>
  </ul>
  <a class="btn btn-primary w-full mt-6">Kostenlos testen</a>
</div>
```

---

## 20) Do’s & Don’ts

* **Do:** wenige, klare Akzentfarben; konsistente Abstände; AOS sparsam.
* **Don’t:** Misch-Buttons (Vuetify & Tailwind Styles gleichzeitig überschreiben), harte Drop-Shadows, knallige Gradients ohne Blur.

