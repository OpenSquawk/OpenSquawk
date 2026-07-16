# Frequency-driven Simulator Control (`frequency-sim-control`) — Design + Kernparser

Antwort auf den Prompt in `docs/plans/fable/2-frequency-sim-control-parser.md`.
Der Kernparser ist **implementiert und getestet**: `shared/utils/simControl.ts`
mit Suite `tests/shared/simControl.test.ts` (22 Tests, alle grün; die im Prompt
geforderten 15+ Beispiel-Sprüche sind die Testsuite selbst, Tabelle unten).

> **Status (2026-07-16): vollständig implementiert.** Der End-to-End-Command-Channel
> aus §4/"Offen für die Implementierungsphase" ist umgesetzt (Commit `be4beb5`):
> `server/utils/simControlQueue.ts` (TTL-Queue je Bridge-Token), neue Endpoints
> `server/api/bridge/command.post.ts` und `server/api/bridge/command-result.post.ts`,
> `server/api/bridge/data.post.ts`/`live.get.ts` erweitert um `commands` /
> `commandResults`, plus Client-Gate und TTS-Bestätigung.

---

## 1. Kommando-Schema

Implementiert in `shared/utils/simControl.ts`:

```ts
type SimControlCommand =
  | { type: 'set_altitude'; altitude_ft: number }          // 0–45000
  | { type: 'set_heading'; heading_deg: number }           // 1–360
  | { type: 'set_speed';   ias_kts: number }               // 60–400
  | { type: 'setup_approach'
      airport_icao: string                                 // ^[A-Z]{4}$
      runway: string                                       // 01–36 + optional L/R/C
      altitude_ft?: number                                 // 0–45000
      final_distance_nm?: number }                         // 1–30
```

Grenzen zentral als `SIM_CONTROL_LIMITS` exportiert; Verletzung ist immer eine
**Ablehnung, nie ein Clamp** (fail-closed).

**Konventionsentscheidung: `NormalizedTelemetry`, nicht
`DecisionNodeAutoTrigger`.** Begründung: Das Kommando fließt Richtung
Bridge/Sim — dieselbe Richtung, deren Gegenstück (Telemetrie sim→server) schon
`altitude_ft`/`ias_kts`/`heading_deg` spricht (`useRadioBackend.ts:37-46`, und
`data.post.ts` mappt Bridge-Rohfelder ebenfalls auf `ias_kt`/`heading_deg`-
artige Namen). Die Bridge-Anwendung muss dann genau **ein** Vokabular in beide
Richtungen kennen. Das `DecisionNodeAutoTrigger`-Vokabular (`speed_kts`,
`vertical_speed_fpm`, generisches `distance_nm`) bleibt Editor-/Engine-intern;
es wird hier bewusst **nicht** abgebildet, um keine dritte Mischkonvention zu
erzeugen. (Das generische `distance_nm` wäre für `final_distance_nm` sogar
falsch — das Kommando meint spezifisch die Final-Distanz, nicht "Distanz zu
irgendwas".)

Bewusst NICHT im v1-Schema: Reposition auf Koordinaten/Gate (braucht
Positionsdatenbank), Wetter/Zeit, Fuel — erst wenn der Kanal (unten) steht und
die vier Basistypen sich bewährt haben. Frequenz-Kommandos ("tune me to …")
sind ebenfalls draußen: COM-Tuning ist im Produkt eine bewusste Nutzeraufgabe
(Teil des Trainings, siehe Wrong-Frequency-Gate in `useLiveAtcSession.ts`).
Falls später doch: Validierung ausschließlich über das bestehende
`normalizeManualFreq()` (118.000–136.975, `shared/utils/frequency.ts`), keine
neue Grenzdefinition.

## 2. Parsing-Ansatz: anker-gegateter Grammatik-Parser, fail-closed

Pipeline (implementiert):

```
Transkript
  → denormalizeSpokenAtc()   (Wiederverwendung aus sttMatch.ts: "five thousand"
  → normalizeForMatch()       → "5000", "echo delta delta foxtrot" → "eddf",
                                "zero seven right" → "07r")
  → Intent-Gate (harte Anker, sonst no_intent):
      Approach-Setup:  /\b(set me up|put me|reposition( me)?)\b.*\b(approach|final)\b/
      Parameter-Set:   /\b(change|set) my (altitude|heading|speed)\b/
  → Slot-Extraktion + Validierung pro Intent
  → { matched: true, command } ODER { matched: false, reason }
```

Die Sicherheitseigenschaften, jeweils testgedeckt:

- **Anker-Gate zuerst.** Reguläre ICAO-Phraseologie ("descend to 5000 feet",
  "request descent …", "cleared to land runway 25R …") enthält keinen der
  Selbstbedienungs-Anker und erreicht die Slot-Extraktion nie → `no_intent`.
  Das trennt die Grammatik strukturell von den Readbacks (`sttMatch.ts`) —
  eine ATC-Freigabe kann nicht versehentlich den Sim umstellen.
- **Kein Best-Effort.** Jeder fehlende/mehrdeutige Slot ist ein typisierter
  Ablehnungsgrund: `missing_value`, `missing_unit`, `out_of_range`,
  `invalid_runway`, `missing_runway`, `missing_airport`. Der Grund kann dem
  Nutzer vorgesprochen werden ("say again with altitude in feet") — die
  Ablehnung ist Teil der UX, nicht nur ein Fehlercode.
- **Einheitenregel:** Eine Zahl wird nur akzeptiert, wenn ihre Einheit
  entweder explizit ist ("5000 feet", "flight level 100") **oder** das
  Parameterwort sie eindeutig macht ("change my **altitude** to 8000" — das
  wörtliche Roadmap-Beispiel). Ein nacktes "from 5000" im Approach-Satz wird
  abgelehnt (`missing_unit`), ein nacktes "set me up at 8000" fällt schon am
  Gate (`no_intent`).
- **Runway nur verankert:** Bahnnummer entweder hinter dem Keyword "runway"
  oder als suffigiertes Token ("25r"); eine freistehende "25" im Satz zählt
  nicht. 01–36, sonst `invalid_runway`.
- **ICAO nur positionell:** 4-Letter-Token direkt hinter to/at/for/into, mit
  Stopword-Liste gegen englische 4-Letter-Wörter ("left", "feet", "final" …).
  Existenzprüfung des Airports ist bewusst Aufgabe des Aufrufers (der ohnehin
  `fetchAirportFrequencies` hat) — der Parser bleibt offline/pur.

Grenze des Ansatzes (bewusst): Der Parser versteht nur die dokumentierte
Grammatik. Ein exotisch formulierter Wunsch ("would you mind teleporting me
onto the ILS?") ergibt `no_intent` — akzeptierter Trade-off: lieber "say
again" als ein falsch geratenes Kommando im Sim.

## 3. Regelbasiert vs. LLM-Call pro Transmission

Regelbasiert ist hier klar richtig, dreifach begründet:

1. **Kosten:** Der Parser läuft als Vorfilter über *jede* Transmission auf der
   Frequenz (er muss ja entscheiden, ob es ein Sim-Kommando ist). Ein LLM-Call
   pro Turn würde den zentralen Kostenvorteil des Produkts (regelbasiertes
   Routing im Python-Backend, LLM nur punktuell) genau an der heißesten Stelle
   aufgeben. Der Grammatik-Parser kostet Mikrosekunden, offline, client-fähig.
2. **Fehlermodus:** Ein LLM rät bei Unsicherheit plausibel — genau das
   verbotene Verhalten, wenn das Ergebnis den realen Sim-Zustand setzt. Eine
   Grammatik kann strukturell nicht halluzinieren; ihr schlechtester Fall ist
   `no_intent`, und der ist harmlos (Spruch geht normal an die Decision-Engine).
3. **Testbarkeit:** Die Sicherheitseigenschaft "Readbacks matchen nie" ist als
   deterministische Testsuite beweisbar (`tests/shared/simControl.test.ts`,
   Block "must NEVER match ATC dialogue"). Mit einem LLM wäre sie nur
   stichprobenhaft prüfbar und bei jedem Modellwechsel neu offen.

Legitimer späterer LLM-Einsatz, klar abgegrenzt: ein **Fallback hinter dem
Gate mit Nutzer-Bestätigung** — wenn das Anker-Gate anschlägt, aber die
Slot-Extraktion scheitert, könnte ein LLM eine Strukturhypothese liefern, die
dem Nutzer **vorgesprochen und bestätigt** werden muss, bevor irgendetwas zur
Bridge geht ("confirm: approach EDDF runway 07R from 5000 feet?"). Opt-in,
selten (nur bei Gate-Treffer + Parse-Fehlschlag), nie stiller Vollzug. Für v1
nicht nötig.

## 4. Fehlender Schreibkanal Server→Bridge

Heutiger Stand (verbindlich aus dem Prompt): `ws.ts` relayt nur PTT-Edges
Bridge→Client, `data.post.ts` nimmt nur Telemetrie Bridge→Server an. Es gibt
keinen Rückkanal.

**Empfehlung: Piggyback auf dem bestehenden Telemetrie-POST** (statt eines
zweiten, bridge-seitigen WebSockets):

```
Bridge                          Nuxt-Server                      /live-atc-Client
  │  POST /api/bridge/data        │                                  │
  │  (Telemetrie, wie heute) ───▶ │  Response-Body NEU:              │
  │                               │  { ok: true,                     │
  │ ◀──────────────────────────── │    commands: [PendingCommand] }  │
  │  führt Kommandos aus          │                                  │
  │  POST /api/bridge/command-result (NEU)                           │
  │  { id, status: 'ok'|'failed', reason? } ───▶ per-Token-Queue     │
  │                               │  Ergebnis ───▶ Client (TTS-Bestätigung
  │                               │                bzw. Fehleransage)│
```

- **Transport:** Die Bridge pollt de facto schon — sie POSTet Telemetrie im
  Sekundentakt. Die Response dieses POSTs bekommt ein `commands`-Array
  (serverseitige, per Bridge-Token adressierte In-Memory-Queue mit TTL).
  Vorteile: null neue Verbindungen, funktioniert durch jede Firewall, Latenz =
  Telemetrie-Intervall (~1 s — für ein Setup-Kommando völlig ausreichend),
  Auth identisch (`x-bridge-token`). Ein Bridge-WebSocket wäre nur nötig,
  wenn Sub-Sekunden-Latenz gefordert wäre — ist sie nicht.
- **Kommandoformat** (Draht-Vertrag, Vokabular = Schema oben):

  ```ts
  interface PendingCommand {
    id: string                    // UUID, für Ack/Result-Korrelation
    issued_at: string             // ISO; Bridge verwirft älter als TTL (~30 s)
    command: SimControlCommand    // exakt der Parser-Output
  }
  ```
- **Bestätigungs-/Fehlerfluss:** Die Bridge antwortet asynchron per
  `POST /api/bridge/command-result` mit `{ id, status: 'ok' | 'failed',
  reason?: string }` (z. B. `failed`/"aircraft on ground, airborne reposition
  refused" — die Plausibilitätsprüfung Boden vs. Luft gehört in die Bridge,
  die den echten Sim-Zustand kennt; der Parser prüft nur Wertebereiche).
  Der Server hält den Kommandostatus (`pending → delivered → ok|failed|expired`)
  und der Client sagt das Ergebnis an: Erfolg als kurze TTS-Bestätigung
  ("repositioned, 5 mile final runway 07R"), Fehler als Ansage mit Grund.
  Kein Result innerhalb der TTL → `expired`, Ansage "bridge did not respond".
- **Idempotenz/Sicherheit:** Ein Kommando pro `id` genau einmal ausliefern
  (beim Abholen aus der Queue entfernen); die Bridge dedupliziert zusätzlich
  per `id`. Kommandos werden nur eingereiht, wenn die Bridge des Nutzers
  verbunden ist (`bridgeConnected`), sonst sofortige Ansage "no bridge
  connected" statt stiller Queue.

**Einbindung in den Transmission-Fluss:** `handlePilotTransmission()` prüft —
nach den bestehenden lokalen Sonderfällen (Radio-Check, Say-again, Farewell)
und nur bei `bridgeConnected` — `parseSimControl(transcript)`. Bei
`matched: true` geht die Transmission **nicht** an `radioBackend.transmit()`
(der Decision-Flow bleibt unberührt, das Python-Backend sieht das Kommando
nie), sondern an den neuen Nuxt-Endpoint, der es in die Bridge-Queue legt.
Bei `matched: false` mit Gate-Treffer aber Parse-Fehler kann die typisierte
`reason` als kurze ATC-Ansage zurückgesprochen werden; bei `no_intent` läuft
alles unverändert weiter wie heute.

## 5. Beispiel-Sprüche (= Testsuite, alle 22 grün)

| # | Spruch | Ergebnis |
|---|---|---|
| 1 | "set me up for an approach from 5000 ft to EDDF 07R" | `setup_approach` EDDF 07R, 5000 ft |
| 2 | "set me up for an approach from five thousand feet to echo delta delta foxtrot zero seven right" | identisch zu #1 (gesprochene Form) |
| 3 | "set me up for an approach to EDDM runway 26 left" | `setup_approach` EDDM 26L (ohne Höhe) |
| 4 | "put me on a 5 mile final for EDDF 25R" | `setup_approach` EDDF 25R, 5 NM Final |
| 5 | "set me up for an approach from flight level 100 to EDDL runway 23" | `setup_approach` EDDL 23, 10000 ft |
| 6 | "change my altitude to 8000" | `set_altitude` 8000 (Roadmap-Wortlaut) |
| 7 | "set my altitude to flight level 100" | `set_altitude` 10000 |
| 8 | "change my heading to 270" | `set_heading` 270 |
| 9 | "change my heading to two seven zero" | `set_heading` 270 (gesprochen) |
| 10 | "set my speed to 210 knots" | `set_speed` 210 |
| 11 | "set me up for an approach from 5000 to EDDF 07R" | ✗ `missing_unit` (Höhe ohne Einheit) |
| 12 | "set me up for an approach to EDDF runway 40" | ✗ `invalid_runway` |
| 13 | "set me up for an approach to EDDF" | ✗ `missing_runway` |
| 14 | "set me up for an approach runway 25" | ✗ `missing_airport` |
| 15 | "change my altitude" | ✗ `missing_value` |
| 16 | "change my altitude to 80000 feet" | ✗ `out_of_range` |
| 17 | "change my heading to 370" | ✗ `out_of_range` |
| 18 | "descend to 5000 feet" | ✗ `no_intent` (ATC-Readback!) |
| 19 | "request descent to flight level 100" | ✗ `no_intent` (Pilot-Request) |
| 20 | "cleared to land runway 25R Lufthansa 359" | ✗ `no_intent` (Freigabe-Readback) |
| 21 | "set squawk 7000" | ✗ `no_intent` ("set" allein ist kein Anker) |
| 22 | "set me up at 8000" | ✗ (Anker unvollständig, Zahl ohne Kontext) |

## Offen für die Implementierungsphase (nicht Teil des Kernparsers)

- Nuxt-Endpoint + In-Memory-Kommando-Queue pro Bridge-Token, `commands`-Feld
  in der `data.post.ts`-Response, `command-result`-Route (Skizze in §4).
- Bridge-Client (separates Repo): Kommandos aus der POST-Response ausführen,
  Boden/Luft-Plausibilität, Result-POST.
- TTS-Bestätigungs-/Fehleransagen im Client, Verdrahtung in
  `handlePilotTransmission()`.
- Airport-Existenzprüfung (gegen die ohnehin geladenen Frequenzdaten) vor dem
  Einreihen.
