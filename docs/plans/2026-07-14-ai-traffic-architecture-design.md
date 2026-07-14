# AI-generierter Funkverkehr (`ai-traffic`) — Architektur-Entwurf

Antwort auf den Prompt in `docs/plans/fable/3-ai-traffic-architecture.md`.
Randbedingung durchgängig eingehalten: **regelbasiert ist der Standard, LLM nur
wo zwingend nötig** (Ergebnis vorweg: für v1 ist *nichts* zwingend LLM-gestützt,
siehe Frage 5). Kein Implementierungscode — nur Architektur, Datenmodelle,
Regeltabellen und Integrationspunkte.

---

## 0. Kernentscheidung: Der Traffic lebt vollständig im Client

Der simulierte Fremdverkehr ist **Kulisse, nicht Trainingsinhalt**. Er
beeinflusst nie die Bewertung des Nutzer-Funkverkehrs, er braucht keine
Persistenz über Reloads, und alle vier harten Gating-Signale (`isRecording`,
`backendExpectedPhrase`, laufende Backend-Transmission, Sprech-Queue) existieren
nur im Browser. Daraus folgt:

- **Neues Client-Composable `useAiTraffic`** (unter `app/composables/`), das als
  reiner *Beobachter* neben `communicationsEngine` und `useLiveAtcSession` läuft.
- **Null Änderungen am Python-Backend-Vertrag.** `useRadioBackend` wird nicht
  angefasst, keine neue Route, kein Traffic-Feld in `RadioTransmitResponse`.
  Damit ist das "kein LLM-Routing hier"-Prinzip trivially erfüllt — der Traffic
  routet gar nichts, er hat mit dem Decision-Backend keinerlei Berührung.
- **Null Änderungen an TTS-Routen.** `POST /api/atc/say` akzeptiert bereits
  `voice` pro Request (`server/api/atc/say.post.ts:197`), der Client reicht
  `SpeechOptions.voice` bereits durch (`useRadioSpeech.ts:22`).
- Der Traffic ist **deterministisch pro Session** (seeded RNG aus
  Session-ID + Datum), damit Bug-Reports reproduzierbar bleiben und Tests
  (`tsx --test`) ohne Mocking-Akrobatik laufen.

Verworfene Alternative — Traffic im Python-Backend: hätte den Vorteil einer
"autoritativen" Separation gegenüber dem Nutzerflugzeug, kostet aber einen
neuen API-Vertrag, Polling oder Push für Traffic-Events, und die Gating-Signale
müssten trotzdem clientseitig geprüft werden (PTT/Queue sind Browser-Zustand).
Das Nutzerflugzeug ist dem Client über `bridgePosition`/Telemetrie ohnehin
mindestens so gut bekannt wie dem Backend.

---

## 1. Architekturskizze: Komponenten + Datenfluss

```
app/composables/useAiTraffic.ts          (ein Composable, intern 4 Module)
│
├── CallsignFactory      erzeugt kollisionsfreie Callsign+Typ-Paare      (Frage 1)
├── TrafficSim           1-Hz-Tick: Phasen, Grobposition, Separation     (Frage 2, 4)
├── InstructionPlanner   Regeltabelle → geplante Funk-Events             (Frage 2, 4)
└── RadioScheduler       Gating-Kette → enqueueSpeech(ATC-Call+Readback) (Frage 3, 10)

shared/utils/voicePool.ts (NEU, geteilt mit Roadmap-Item multi-voice)    (Frage 7)
shared/data/trafficTiers.ts (NEU: Tier-Map + Heuristik + Tageszeitband)  (Frage 8)

Liest (read-only):
  engine.currentState (Rolle des aktuellen States), engine.variables (callsign)
  state.backendExpectedPhrase, state.backendSessionId       (useSessionState)
  isRecording                                               (usePttRecording)
  freq.frequencies.active, freq.airportFrequencies          (useFrequencyPresets)
  bridgePosition / NormalizedTelemetry                      (useSimBridgeSync, optional)
  ein neues Ref `transmitInFlight` (s. Frage 10)            (useLiveAtcSession)

Schreibt:
  speech.speakWithRadioEffects(text, { voice, tag: 'ai-traffic' })
  engine.appendLogEntry('atc' | 'pilot', …, { frequency })   — Log-Kulisse
  NIE: radioBackend.*  (kein transmit, keine Session, kein Timeout)
```

Datenfluss eines Traffic-Funkspruchs:

```
TrafficSim-Tick (1 Hz)
  → InstructionPlanner: Regel feuert (z. B. Wake-Gap zu klein)
  → RadioEvent { atcText, pilotReadbackText, aircraft } in PendingQueue
  → RadioScheduler: Gating-Kette (Frage 10) — offen?
      nein → Event bleibt liegen (Re-Check beim nächsten Tick)
      ja   → enqueueSpeech(ATC-Call, voice=Controller-Stimme)
             enqueueSpeech(Readback, voice=voicePool(callsign)) als EIN Paar
  → bei Ausführung in der Queue: Gate NOCHMAL prüfen (Enqueue-Zeit ≠ Abspiel-Zeit)
      geschlossen → Task returned früh, Event zurück in PendingQueue
```

Lebenszyklus: `startMonitoring()` erfolgreich → `useAiTraffic.start(seed, icao)`;
`session_complete` / `backToSetup` / Unmount → `stop()` (Spawner aus, Pool leer,
Pending-Events verworfen).

Wichtig für die Kulissen-Wirkung: Traffic sendet nur auf der **aktuell
getunten Frequenz** (`frequencies.value.active`). Simulierte Flieger auf anderen
Frequenzen existieren im Pool weiter, sind aber stumm — beim Umtunen "hört" man
die dortige Population. Das nutzt die vorhandene Frequenz-Logik als natürlichen
Lautstärkeregler und verhindert, dass Delivery-Chatter in den Endanflug quatscht.

---

## 2. Datenmodell für simulierten Verkehr

```ts
// Referenztypen-Tabelle aus dem Prompt wird 1:1 als Startdatenbank übernommen:
// shared/data/simAircraftTypes.ts
interface SimAircraftType {
  icao: string                    // 'A320', 'C172', …
  wake: 'L' | 'M' | 'H' | 'J'
  cruiseKts: number
  climbFpm: number
  descentFpm: number
  approachKts: number             // harte Untergrenze für Speed-Anweisungen
  heavyCallsign: false | 'heavy' | 'super'
}

// Zustand pro simuliertem Flugzeug (im Pool von useAiTraffic):
interface SimAircraft {
  callsign: string                // 'DLH472'
  callsignSpoken: string          // 'Lufthansa four seven two heavy'
  type: SimAircraftType
  voiceId: string                 // stabil: hash(callsign) → voicePool (Frage 7)

  phase: 'inbound' | 'approach' | 'final' | 'rollout'
       | 'taxi_out' | 'lineup' | 'takeoff' | 'climbout' | 'handed_off'
  frequency: string               // auf welcher Frequenz dieser Flieger gerade ist
  routeFixes: string[]            // verbleibende Route, [0] = nächster Wegpunkt
                                  // (aus einem kleinen Fix-Pool pro Airport generiert)
  distanceToFieldNm: number       // Grobposition entlang der Route (1D!)
  altitudeFt: number
  iasKts: number                  // aktuelle Geschwindigkeit
  assignedSpeedKts: number | null // letzte Speed-Anweisung (Stufen, Frage 4)
  vectorDelaySec: number          // kumulierte Vectoring-Verzögerung (Frage 2)
  runwaySlot: { fromSec: number; toSec: number } | null  // Belegung Timeline
  nextEventAtSec: number          // Sim-Zeit des nächsten geplanten Funk-Events
}
```

Bewusste Vereinfachung: **1D-Kinematik entlang der Route** (Distanz zum Platz +
Höhe + Speed), keine 2D-Radarsimulation. Für hörbaren, plausiblen Funk reicht
das vollständig — Positionen tauchen nur in Phraseologie auf ("six miles
final", "descend three thousand feet") und in der Separationsrechnung
(In-Trail-Gap in NM auf derselben Anfluglinie). Ein Vector wird nicht
geometrisch geflogen, sondern als `vectorDelaySec` auf die Timeline gebucht —
akustisch identisch, eine Größenordnung weniger Code.

---

## 3. Antworten auf die zehn Fragen

### Frage 1 — Callsign-/Typ-Generierung, kollisionsfrei

`CallsignFactory` zieht aus einem kuratierten Pool realer ICAO-Designatoren
(DLH, BAW, EZY, RYR, UAE, AFR, KLM, SWR, AUA, WZZ …, plus GA-Kennungen
`D-Exxx`/`N…` für Tier `ga`) und würfelt Flugnummern (1–4 Ziffern, optional
Buchstabensuffix). Kollisionsfreiheit gegen den Nutzer in drei Stufen:

1. **Exakt**: nie identisch mit `variables.callsign` / `callsign_short`.
2. **Präfix**: nie derselbe Airline-Designator wie der Nutzer (DLH39A am Platz
   → gar keine anderen DLH-Flieger in v1 — radikal, aber die billigste Regel,
   die Verwechslung sicher ausschließt; lockerbar auf "nicht dieselbe führende
   Ziffer" wenn es zu monoton wirkt).
3. **Phonetisch**: die *gesprochene* Ziffernfolge darf sich vom Nutzer-Callsign
   um höchstens eine gemeinsame Position ähneln (Levenshtein ≥ 2 auf der
   Ziffern-/Suffixfolge) — verhindert DLH39A vs. BAW39A-Verwechslung beim Hören.
   Auch VFR-Registrierungen aus dem bestehenden Pool in `useLiveAtcSession.ts`
   (`D-EMIL` etc.) stehen auf der Sperrliste.

Typ-Auswahl gewichtet nach `trafficTier` (Frage 8): `major` ≈ 70 % Narrowbody /
20 % Widebody / 10 % Regional, `regional` ≈ 60 % Narrowbody / 30 % Regional /
10 % GA, `ga` ≈ 80 % GA / 20 % Regional. Wake-Kategorie und Performance kommen
aus `SimAircraftType`; `heavyCallsign` steuert den "heavy"/"super"-Zusatz in
`callsignSpoken`.

### Frage 2 — Separation laufend prüfen und durchsetzen

Das gemeinsam genutzte Betriebsmittel ist eine **Runway-/Anflug-Timeline** pro
aktiver Bahn (aus `variables.runway`). Jeder Flieger (und der Nutzer, s. u.)
belegt Slots; der 1-Hz-Tick prüft zwei Invarianten:

- **In-Trail-Gap** auf gemeinsamer Anfluglinie: erforderliche Distanz =
  max(3 NM Terminal-Standard, Wake-Matrix Leader→Follower aus dem Prompt).
  Umgerechnet in Zeit über die Groundspeed des Followers
  (`gapNm / iasKts × 3600`). Unterschreitet die projizierte Gap den Wert + 20 %
  Puffer → `InstructionPlanner` erzeugt zuerst Speed-Stufen (Frage 4), reicht
  das rechnerisch nicht (Follower schon bei `approachKts`) → Vector
  ("turn left/right heading …, vectors for spacing" + späteres "resume own
  navigation"), gebucht als `vectorDelaySec` von 60–120 s.
- **Runway Occupancy**: nie zwei Freigaben (Start oder Landung) für dieselbe
  Bahn mit überlappenden Slots. Abflug-Wake-Regel zeitbasiert: Slot-Beginn
  eines Light/Medium ≥ 120–180 s nach Start eines Heavy/Super (Phraseologie:
  "hold position, wake turbulence delay").

**Das Nutzerflugzeug ist ein Slot-Reservat, keine simulierte Position.** Seine
Belegung wird aus dem Decision-Flow-Zustand abgeleitet (Flow/State-Präfix, z. B.
tower-v1 ab Lineup-/Takeoff-States → Bahn geblockt, bis der Flow den
Airborne-/Handoff-State erreicht; Arrival-Flows ab Landefreigabe → geblockt bis
"runway vacated") und, wenn die Bridge verbunden ist, durch Telemetrie
verfeinert (`on_ground`, `distance_to_dep_nm`). Simulierter Verkehr weicht
**immer** dem Nutzer-Slot aus — der Nutzer bekommt durch Fremdverkehr niemals
eine zusätzliche Anweisung oder Verzögerung in seinem Trainings-Flow (der
gehört exklusiv dem Python-Backend). Konflikt heißt also stets: der
*simulierte* Flieger wird verlangsamt, gevectort oder gehalten.

### Frage 3 — Timing/Arbitrierung der Funksprüche

Ein Sender gleichzeitig ist bereits strukturell garantiert, wenn alles durch
**dieselbe serielle Sprech-Queue** läuft: `enqueueSpeech` in
`useSpeechInterrupt.ts` ist eine Promise-Kette — es spielt physisch nie mehr
als ein Audio. Traffic nutzt exakt diese Queue (via
`speakWithRadioEffects(…, { tag: 'ai-traffic', voice })`), nie einen zweiten
Audiokanal. Zusätzliche Arbitrierungsregeln:

- **Paar-Atomarität**: ATC-Call an Fremdverkehr + dessen Readback werden als
  ein zusammenhängendes Paar direkt hintereinander enqueued (mit kurzem
  `delayMs` fürs Readback), damit sich nie eine Nutzer-ATC-Antwort zwischen
  Call und Readback schiebt.
- **Kein Vorgriff auf den Nutzer**: die Gating-Kette (Frage 10) läuft *vor*
  jedem Enqueue **und nochmals bei Ausführung** in der Queue (Enqueue-Zeit ≠
  Abspiel-Zeit; das Muster mit `getSpeechGeneration()` in
  `speakWithRadioEffects` zeigt schon, wie ein Task sich selbst entwertet).
  Ist das Gate bei Ausführung zu, returned der Task früh und das Event wandert
  zurück in die Pending-Queue.
- **Kurz halten**: Traffic-Paare sind ≤ ~8 s Audio. Da die Queue FIFO ohne
  Prioritäten ist, ist die maximale Zusatzlatenz für eine echte ATC-Antwort ein
  einzelnes kurzes Paar — akzeptabel und sogar realistisch (Frequenz belegt).
- **Nutzer keyt während Traffic spielt**: laufendes Audio wird *nicht*
  abgebrochen (auf einer echten Frequenz redet der andere auch weiter). PTT
  blockiert nur *neue* Traffic-Starts. `stopCurrentSpeech()` bleibt dem
  bestehenden Zweck (Frequenzwechsel) vorbehalten.

### Frage 4 — Speed-Anweisungen und Direct-to, regelbasiert

**Speed**: diskrete Stufenleiter 250 → 220 → 210 → 190 → 180 → 170 → 160 →
`approachKts` des Typs. Regeln direkt aus dem Prompt: unter FL100/10.000 ft nie
über 250 kt anweisen; pro Anweisung genau eine Stufe (10–20 kt); harte
Untergrenze `type.approachKts`; Phasen-Plausibilität (`climbout` bekommt keine
Approach-Reduktion, `final` keine Beschleunigung); GA-Typen (Wake L) bekommen
gar keine Jet-Speed-Callouts, sondern höchstens "reduce to slowest practical
speed". Jede Anweisung setzt `assignedSpeedKts`; die Kinematik zieht `iasKts`
mit ~1 kt/s nach, damit spätere Phraseologie ("… 12 miles, speed 180") konsistent
bleibt.

**Direct-to**: Gültigkeitsprüfung exakt nach Prompt — Ziel-Fix muss in
`routeFixes` *vor* dem Flieger liegen (Index > 0 in der verbleibenden Liste),
und die verkürzte Timeline darf keine Gap-Invariante (Frage 2) verletzen —
sonst wird der Direct gar nicht erst generiert (Directs sind hier ja ein
*Belohnungs*-Event bei viel Luft, kein Konfliktlöser). Zustandsupdate beim
Readback: `routeFixes.splice(0, index)` und `distanceToFieldNm` um die
Abkürzung reduziert — damit driftet spätere Positions-Phraseologie nicht
auseinander (der im Prompt genannte Fehlerfall).

**Entscheidungsregel-Tabelle** (geprüft pro Tick, erste zutreffende Zeile gewinnt;
`req` = erforderliche Gap aus Standard+Wake-Matrix):

| # | Bedingung (pro simuliertem Flieger) | Anweisung | Wirkung im Modell |
|---|---|---|---|
| 1 | Phasenwechsel erreicht (`nextEventAtSec`) | Phasen-Call (Descend/Approach-Clearance/Landefreigabe/Takeoff-Clearance) | Phase ++, neuer Slot |
| 2 | Runway-Slot kollidiert mit Nutzer-Reservat oder anderem Slot | Arrival: "continue approach, expect late landing clearance" · Departure: "hold position" / kein "line up" | Slot verschoben |
| 3 | Departure hinter Heavy/Super, Δt < 120–180 s | "hold position, wake turbulence delay" | Slot + Resthaltezeit |
| 4 | In-Trail-Gap < req × 1.2 **und** `iasKts` > `approachKts` | Speed eine Stufe runter | `assignedSpeedKts` ↓ |
| 5 | In-Trail-Gap < req **und** Speed schon minimal | Vector for spacing (+ später "resume own navigation") | `vectorDelaySec` += 60–120 |
| 6 | Gap > req × 2 **und** gültiger Fix voraus **und** Zufall (selten) | "proceed direct {fix}" | `routeFixes` gekürzt |
| 7 | Sektorgrenze erreicht (Phase `climbout` Ende / `approach` Beginn / `rollout` Ende) | Handover "contact {station} {freq}, good day" + Readback | `frequency` wechselt → Flieger wird stumm/hörbar; nach letztem Handover despawn |
| 8 | Nichts davon, Frequenz lange still (> ~45–90 s, seeded random) | Ambient-Call (Check-in eines Neuen, Positionsreport) | nur Audio/Log |

### Frage 5 — Was MUSS generativ sein? (Antwort: nichts)

Alle Anweisungstypen oben sind endliche, parametrisierte Templates — exakt
dieselbe Klasse Phraseologie, die der echte Piloten-Flow schon
template-basiert abdeckt. Varianz kommt aus seeded RNG über: Template-Varianten
pro Anweisungstyp (2–4 Formulierungen), Callsign-/Typ-Mix, Timing-Jitter und
den Voice-Pool. **Empfehlung v1: null LLM-Calls.** Das ist die einzige mit dem
Kostenmodell verträgliche Antwort — Traffic erzeugt sonst laufende Kosten
*pro belebter Minute*, nicht pro Nutzeraktion.

Einziger legitimer LLM-Einsatz, klar abgegrenzt und optional (v2): **einmalig
pro Session** (nicht pro Funkspruch) einen Batch von ~20 "Colour"-Zeilen
generieren (Ride-Reports, kleine Requests anderer Piloten), die der Scheduler
dann als Regel-8-Ambient-Events abspielt. Ein Call pro Session, cachebar pro
Airport/Wetterlage, niemals Routing, niemals Antwort auf den Nutzer. Wenn das
Budget auch das nicht hergibt: statische Ambient-Bibliothek pro Tier — der
Realismusverlust ist gering.

### Frage 6 — Anbindung an `communicationsEngine` / Backend-Vertrag

Anbindung = **bewusste Nicht-Anbindung**:

- `useAiTraffic` ruft **nie** `radioBackend.transmit/createSession/timeout` —
  der Python-Vertrag bleibt byte-identisch, das "kein LLM-Routing im
  Nuxt-Repo"-Prinzip ist unberührt (Traffic routet nichts, er *rendert* nur).
- Von der `communicationsEngine` wird nichts verändert: kein neuer State-Typ,
  kein Flow, kein Cursor-Eingriff. Genutzt wird sie nur lesend
  (`currentState.role` fürs Gating, `variables.callsign/runway` für
  Kollisionsfreiheit und Bahn) und schreibend einzig über das bestehende
  `appendLogEntry(speaker: 'atc' | 'pilot', …)` — Traffic-Einträge landen mit
  dem echten Frequenz-Kontext im Kommunikationslog (optional ein
  `offSchema`-artiges Meta-Flag `traffic: true` für dezentes UI-Styling; das
  ist die einzige minimal-invasive Engine-Erweiterung, und sie ist optional).
- Die Grenze in einem Satz: **das Backend besitzt den Dialog *mit* dem Nutzer,
  `useAiTraffic` besitzt den Funk *um den Nutzer herum*.** Die beiden teilen
  sich genau zwei Dinge: die Sprech-Queue (Arbitrierung) und das Log (Anzeige).

### Frage 7 — Stimmen: ein gemeinsamer Pool mit `multi-voice`

Neues Modul `shared/utils/voicePool.ts`, von Anfang an als die gemeinsame
Infrastruktur für **beide** Roadmap-Items gebaut (die im Prompt geforderte
explizite Abhängigkeit — nicht zwei Systeme):

- Pool von 6–8 Voice-IDs des TTS-Providers, partitioniert in
  `controllerVoices` (für `multi-voice`: rotierende Stimme pro ATC-Position)
  und `pilotVoices` (für Traffic-Readbacks). Disjunkte Partitionen garantieren:
  kein simulierter Pilot klingt wie der aktuelle Controller.
- Zuweisung deterministisch: `voiceFor(callsign) = pilotVoices[fnv1a(callsign) % n]`
  — dieselbe "DLH472" klingt die ganze Session (und über Sessions hinweg)
  gleich, ohne dass irgendwo Zuweisungszustand persistiert werden muss.
- Reservierte Stimmen werden aus dem Pilot-Pool ausgeschlossen: die aktuelle
  Controller-Stimme (heute hart `'alloy'` in `useRadioSpeech.ts`, künftig die
  multi-voice-Positionsstimme) und `'verse'` (bereits vergeben an das
  Nutzer-Readback in `speakPilotReadback`). Kollisionsfall (Hash trifft
  Reserviertes) → nächster Pool-Index.
- 4–6 aktive Pilotstimmen reichen: es sind selten mehr als 3–5 Flieger
  gleichzeitig hörbar, und Callsign + Inhalt disambiguieren zusätzlich.
  Akzente/Gender-Varianz ist dann ein reines Pool-Erweiterungsthema von
  `multi-voice`, ohne dass Traffic-Code sich ändert.

`multi-voice` selbst ist damit später nur noch: `scheduleControllerSpeech`
bekommt statt implizit `'alloy'` die Positionsstimme aus demselben Modul.

### Frage 8 — Verkehrsdichte: `trafficTier` × Tageszeit

Neu `shared/data/trafficTiers.ts` (bewusst im Nuxt-Repo, kein Backend-Feld —
es gibt heute keine Datenquelle, bestätigt):

```
type TrafficTier = 'major' | 'regional' | 'ga'

1. Kuratierte Map  { EDDF: 'major', EDDM: 'major', EDDH: 'regional', … }
   — klein anfangen (~30 Einträge), trivial pflegbar.
2. Heuristik-Fallback aus bereits geladenen Frequenzen (airportFrequencies
   liegt beim Sessionstart ohnehin vor): ≥ 4 Controller-Typen (DEL+GND+TWR+APP/DEP)
   → 'major' · TWR vorhanden → 'regional' · sonst → 'ga'.
3. Harter Default 'regional', wenn gar nichts bekannt ist — das Feature fällt
   auf unbekannten Flughäfen nie aus, es ist dort nur mittel-belebt.
```

Tageszeit-Faktor in groben Bändern (lokale Uhrzeit des Nutzers als Proxy für
Platz-Lokalzeit — Trainings finden praktisch immer "vor Ort" statt; präziser
via Längengrad wäre möglich, lohnt v1 nicht):

| Band (lokal) | Faktor |
|---|---|
| 22–05 Uhr (Nacht) | 0.2 |
| 06–09 Uhr (Morgen-Bank) | 1.3 |
| 10–15 Uhr (Tag) | 1.0 |
| 16–20 Uhr (Abend-Bank) | 1.3 |
| 21 Uhr (Ausklang) | 0.6 |

Zielgröße: `target = clamp(round(base[tier] × faktor), 0, 5)` mit
`base = { major: 4, regional: 2, ga: 1 }`. Der Spawner hält die Population auf
`target` (Despawn durch Handover/Landung, Nachschub mit randomisiertem
Intervall 30–120 s), Cap 5 schützt Sprech-Queue und TTS-Budget. `ga` nachts
ergibt Ziel 0 — eine tote GA-Frequenz um 3 Uhr ist korrekt.

### Frage 9 — Settings-Toggle `aiTrafficEnabled`

Exakt das bestehende Muster, keine neue UI-Sprache:

- `SettingsSheet.vue`: ein weiteres `defineModel<boolean>('aiTrafficEnabled', { required: true })`
  + `v-switch` (cyan, inset, `label="AI traffic (background chatter)"`) im
  bestehenden Grid neben `radioEffectsEnabled` & Co. (Zeilen 87–117).
- `live-atc.vue`: `const aiTrafficEnabled = ref(true|false)` neben den anderen
  Refs, `v-model:ai-traffic-enabled` an `SettingsSheet`, Persistenz per
  `localStorage`-Key `pm_ai_traffic_enabled` nach dem vorhandenen
  `prerecEnabled`-Muster (STORAGE_KEYS + watch + onMounted-Restore). Das Ref
  wird `useAiTraffic` als Dependency hereingereicht — derselbe Verdrahtungsstil
  wie `radioEffectsEnabled` → `useRadioSpeech`.

**Ausschalten mid-session** (empfohlene Semantik: "laufende Durchsage zu Ende,
nichts Neues"):

1. Spawner stoppt, Pool wird geleert, Pending-Events verworfen.
2. Bereits *enqueued*, aber noch nicht spielende Traffic-Tasks entwerten sich
   selbst: `aiTrafficEnabled` ist Teil des Ausführungszeit-Re-Checks (Frage 10)
   — der Task returned früh. Kein Eingriff in die Queue-Mechanik nötig.
3. Die gerade *spielende* Durchsage läuft aus (≤ ~8 s). Begründung statt
   Hard-Cut: `stopCurrentSpeech()` ist global und würde auch eine gequeueste
   echte ATC-Antwort mitreißen — ein selektiver Abbruch nur des
   Traffic-Audios wäre neue Mechanik in `useSpeechInterrupt` für einen Fall,
   den ein 8-Sekunden-Ausklang genauso löst.
4. Wieder einschalten → frischer `start()` mit neuem Spawn-Aufbau.

### Frage 10 — Gating-Prüfkette (die harte "niemals"-Garantie)

Traffic läuft durch **dieselbe** Sprech-Queue (`enqueueSpeech` aus
`useSpeechInterrupt`, siehe Frage 3) — das erledigt "nie zwei Audios
gleichzeitig" strukturell. Davor die Prüfkette, ausgewertet an **zwei**
Punkten: vor dem Enqueue *und* nochmals im Task bei Abspielbeginn (zwischen
beiden können Sekunden liegen; das bestehende Generation-Muster in
`speakWithRadioEffects` ist die Vorlage für Selbstentwertung):

```
gateOpen() =
     aiTrafficEnabled.value                       // Settings-Toggle (Frage 9)
  && !isRecording.value                           // usePttRecording — PTT gedrückt
  && !transmitInFlight.value                      // NEU: Nutzer-Transmission wartet
                                                  //   auf Backend-Antwort
  && !readbackPending()                           // ATC erwartet Readback (s. u.)
  && sessionActive (backendSessionId gesetzt, screen === 'monitor')
```

- **`transmitInFlight`** existiert noch nicht als Ref — `handlePilotTransmission`
  in `useLiveAtcSession.ts` hat mit `transmitGeneration` bereits die richtige
  Stelle; ein boolesches Ref um den `await radioBackend.transmit(…)` herum
  (setzen vor dem Call, löschen in `finally`) macht den Zustand für den
  Scheduler lesbar. Einzige neue Zeile Zustand im bestehenden Code.
- **`readbackPending()`**: Basis-Signale sind `currentState.role === 'pilot'`
  und `backendExpectedPhrase != null` (beides vorhanden in Engine/
  `useSessionState`). Wichtige Design-Feststellung: im Flow wechseln sich
  ATC- und Pilot-States ab, `backendExpectedPhrase` ist also fast permanent
  gesetzt — *wörtlich streng* interpretiert wäre die Frequenz nahezu dauerhaft
  gesperrt und das Feature witzlos. Empfohlene Semantik: die Sperre schützt das
  **frische** Readback-Fenster — von dem Moment, in dem die ATC-Anweisung
  gesprochen wird (Timestamp beim `scheduleControllerSpeech` der Antwort),
  bis der Nutzer antwortet, **mindestens aber `readbackProtectionMs`**
  (Default ~12 s, an der Größenordnung des Silence-Timers orientiert).
  Innerhalb des Fensters: absolute Stille vom Traffic. Danach darf Regel-8-
  Ambient wieder einsetzen — auch real funkt die Frequenz weiter, wenn ein
  Pilot trödelt, und der Silence-Timer des Flows läuft unabhängig weiter.
  Wer die wörtliche Strenge will, setzt `readbackProtectionMs = ∞` — dieselbe
  Kette, ein Parameter, keine zweite Logik.
- PTT/`transmitInFlight` gelten dagegen **immer absolut** — während der Nutzer
  spricht oder auf die Backend-Antwort wartet, startet nie ein Traffic-Audio;
  die unmittelbar folgende ATC-Antwort landet durch die FIFO-Queue vor jedem
  später enqueueten Traffic-Paar.

Ergebnis der Kette: Traffic sendet in den natürlichen Lücken — nach
abgeschlossenen Readbacks, in ATC-/System-Phasen (Taxi-Rollen, Steigflug,
Warten auf Telemetrie-Trigger) und in Nutzer-Denkpausen jenseits des
Schutzfensters. Genau dort gehört Kulissen-Funk hin.

---

## 4. Offene Punkte / bewusste Abgrenzungen

- **Fix-Namen für Directs**: v1 generiert pro Airport einen kleinen fiktiven,
  aber plausibel klingenden Fix-Pool (5-Letter-Namen), statt echte
  Procedure-Daten zu laden — Directs sind Ohren-Realismus, keine Navigation.
  Echte SID/STAR-Fixe wären ein späteres Datenprojekt (apt.dat/OSM gibt es im
  Roadmap-Umfeld `taxi-routing` schon, Wegpunkte nicht).
- **`multi-voice`-Abhängigkeit** (aus dem Prompt gefordert, hier explizit):
  `voicePool.ts` ist die gemeinsame Grundlage; wenn `multi-voice` zuerst
  gebaut wird, gehört die Partition Controller/Pilot von Anfang an hinein.
  Keine zweite Zuweisungslogik bauen.
- **Tests**: Sim-Kern (`CallsignFactory`, Gap-Rechnung, Stufenleiter,
  Direct-Validierung, Tier/Tageszeit-Ableitung, Gating-Kette als reine
  Funktion) als seeded, framework-freie Module unter `shared/`/`tests/` —
  läuft im bestehenden `tsx --test`-Setup ohne Browser.
- **Nicht-Ziele v1**: kein Traffic auf UNICOM/ATIS, keine Konflikte *zwischen*
  zwei simulierten Fliegern, die der Nutzer auflösen müsste (reines Zuhören),
  keine Persistenz des Traffic-Zustands über Reload.
