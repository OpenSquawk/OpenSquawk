# 3 — AI-generierter Funkverkehr (ai-traffic): Architekturentscheidung

Warum Priorität 3: größtes und spekulativstes Roadmap-Feature (Roadmap-Key
`ai-traffic`) — mehrere offene Designfragen gleichzeitig (Kollisionsfreiheit,
Timing-Arbitrierung, Grad der Generativität), noch kein bestehender Code als
Anker. Höchster potenzieller Produktwert, aber auch höchste Unschärfe — bewusst
zuletzt, bis 1 und 2 den Rahmen (Kostenmodell, Backend-Vertrag) geklärt haben.

Diese Datei enthält bewusst schon das gesamte Domänenwissen (Separation,
Flugzeugtypen, Speeds, Directs), das für plausiblen Fremdverkehr nötig ist —
Fable soll das nicht erst recherchieren/annehmen müssen, sondern direkt darauf
aufbauen. Die Werte unten sind gängige, in ATC-Trainingsmaterial übliche
Näherungswerte (kein zertifiziertes ICAO-Doc-4444-Zitat) — für Trainingsrealismus
ausreichend genau, aber kein Ersatz für echte Luftfahrtregulatorik.

---

## Domänenwissen: Separation / Spacing

**Standard-Radarstaffelung (ohne Wirbelschleppen-Zuschlag):**
- Terminal-/Anflugbereich: 3 NM horizontal
- Streckenflug (ohne reduzierte Staffelung): 5 NM horizontal
- Vertikal: 1000 ft bis FL410 (RVSM-Bereich), 2000 ft oberhalb FL410

**Wirbelschleppen-Kategorien (Wake Turbulence Categories):**
| Kategorie | Kürzel | Beispiel MTOW | Callsign-Zusatz "Heavy" |
|---|---|---|---|
| Super | J | A380 | ja (zusätzlich "Super" statt "Heavy") |
| Heavy | H | > 136.000 kg (z. B. B777, A330, B747) | ja, Callsign + "Heavy" |
| Medium | M | 7.000–136.000 kg (die meisten Narrowbody-Jets) | nein |
| Light | L | ≤ 7.000 kg (GA, kleine Turboprops) | nein |

**Staffelungsmatrix (Leader → Follower, radar-basiert, gleicher Track/Anflug),
in NM zusätzlich zur Standard-Staffelung:**
| Leader \ Follower | Heavy | Medium | Light |
|---|---|---|---|
| Super (J) | 6 | 7 | 8 |
| Heavy (H) | 4 | 5 | 6 |
| Medium (M) | – (Standard reicht) | – | 5 |
| Light (L) | – | – | – |

Lesart: Fliegt ein Medium-Follower hinter einem Heavy-Leader auf demselben
Anflug, braucht er mind. 5 NM statt der Standard-3-NM. Light hinter Light/Medium
braucht keinen Zusatz, nur die normale Radarstaffelung.

**Abflugstaffelung (zeitbasiert, vereinfachend):**
- Heavy/Super hinter Heavy/Super, gleiche Startbahn, divergierende Kurse: ≥ 2 Min.
- Light/Medium hinter Heavy/Super: ≥ 2–3 Min. (oder radaräquivalente Distanz,
  sobald Radarerfassung vorliegt)
- Gleiche Kategorie, keine Wirbelschleppen-Sonderregel: Trennung primär durch
  Bahnfreigabe (Runway Occupancy), nicht durch Zeit.

**Runway Occupancy:** zwei Luftfahrzeuge dürfen nicht gleichzeitig für dieselbe
Bahn freigegeben sein (Start/Landung) — die Bahn muss vom vorherigen Verkehr
"clear" sein (Startlauf beendet bzw. Bahn verlassen), bevor der nächste
Take-off-/Landefreigabe bekommt.

## Domänenwissen: Referenz-Flugzeugtypen (für spätere Injection)

Startdatenbank realer Typen mit den Feldern, die der Traffic-Generator braucht,
um plausible Anweisungen zu geben (kein Jet-Speed-Callout an eine Cessna, kein
160-kt-Approach an einen A380 zu früh etc.):

| ICAO-Typ | Kategorie | Wake | Cruise (kt) | Climb (fpm) | Descent (fpm) | Approach/Vref (kt) | "Heavy"-Callsign |
|---|---|---|---|---|---|---|---|
| C172 | GA | L | 110 | 700 | 500 | 60 | nein |
| PA28 | GA | L | 120 | 750 | 500 | 65 | nein |
| DA40 | GA | L | 135 | 800 | 600 | 70 | nein |
| E190 | Regional Jet | M | 450 | 2200 | 1800 | 135 | nein |
| CRJ9 | Regional Jet | M | 450 | 2000 | 1800 | 130 | nein |
| A319 | Narrowbody | M | 450 | 2000 | 1500 | 125 | nein |
| A320 | Narrowbody | M | 450 | 2000 | 1500 | 130 | nein |
| A321 | Narrowbody | M | 450 | 1800 | 1500 | 135 | nein |
| B738 | Narrowbody | M | 455 | 2000 | 1500 | 135 | nein |
| B39M | Narrowbody | M | 455 | 2000 | 1500 | 135 | nein |
| A333 | Widebody | H | 480 | 1800 | 1200 | 140 | ja |
| A359 | Widebody | H | 490 | 1800 | 1200 | 140 | ja |
| B77W | Widebody | H | 490 | 1500 | 1200 | 145 | ja |
| B788 | Widebody | H | 485 | 1800 | 1200 | 140 | ja |
| B744 | Widebody | H | 490 | 1200 | 1200 | 150 | ja |
| A388 | Widebody | J (Super) | 490 | 1200 | 1000 | 145 | ja ("Super") |

Diese Tabelle ist absichtlich klein und erweiterbar gehalten — reicht als
Startset für Injection, kein Anspruch auf Vollständigkeit. Callsign-Präfixe
(reale ICAO-Airline-Designatoren wie DLH/BAW/EZY/RYR/UAE) plus plausible
Flugnummern kommen dazu, wenn Fable das Schema entwirft — sollen aber
kollisionsfrei zum echten Flugplan/Callsign des Nutzers generiert werden.

## Domänenwissen: Speed Control

- Unterhalb FL100 (bzw. 10.000 ft je nach Luftraum): übliche Begrenzung 250 kt
  IAS für die meisten Jets/Turboprops — gilt für GA praktisch nie (die sind
  ohnehin langsamer unterwegs).
- Anflugstaffelung durch Speed-Instruktionen erfolgt stufenweise, typischerweise
  in 10–20-kt-Schritten (z. B. "reduce speed to 210 knots" → "…to 180 knots" →
  "…to minimum clean speed/final approach speed"), niemals unterhalb des
  typspezifischen Approach/Vref-Werts aus der Tabelle oben.
- Speed-Anweisungen müssen zur Flugphase passen: keine Anflug-Speed-Reduktion
  im Steigflug, keine Streckenflug-Geschwindigkeit im Endanflug.

## Domänenwissen: Direct-to / Shortcuts ("Directs")

Ein "Direct to WAYPOINT" ist nur gültig, wenn:
- der Wegpunkt tatsächlich noch **vor** dem Flugzeug auf der aktuell
  freigegebenen Route liegt (kein Direct zu einem bereits passierten Fix),
- kein Konflikt mit anderem (simuliertem oder echtem) Verkehr auf der
  direkteren Linie entsteht,
- der Wegpunkt entweder im Flugplan des Flugzeugs enthalten ist oder ein
  plausibler Off-Route-Fix innerhalb der Radarabdeckung ist.

Nach Annahme eines Directs muss der interne Zustand des simulierten Flugzeugs
(aktive Route / nächster Wegpunkt) aktualisiert werden — sonst driftet die
spätere generierte Position/Phraseologie auseinander.

## Domänenwissen: Mehrstimmigkeit für Readbacks — Plumbing existiert schon

Jeder simulierte Flieger, den ATC anspricht, muss mit einer eigenen, über die
Session stabilen Stimme antworten (sonst klingt jeder Fremdverkehr wie der
Nutzer/ATC selbst). Das ist **kein neues TTS-Feature** — der Voice-Parameter
existiert bereits Ende-zu-Ende:

- Client: `SpeechOptions.voice?: string` in `app/composables/useRadioSpeech.ts:23`
  wird bereits pro Aufruf durchgereicht.
- Server: `server/api/atc/say.post.ts:197` liest `body?.voice || runtimeConfig.voiceId`
  — akzeptiert also schon eine abweichende Stimme pro Request, mit Fallback auf
  die konfigurierte Standardstimme.

Es muss also **keine TTS-Route geändert werden** — nur: (a) eine stabile
Voice-ID pro simuliertem Flugzeug zuweisen (z. B. deterministisch aus Callsign
gehasht, damit dieselbe "DLH359" über die ganze Session gleich klingt), (b) eine
Voice-Pool-Größe festlegen (reicht ein kleines Set von 4-6 Stimmen, die rotieren,
oder braucht es mehr Varianz?), (c) sicherstellen, dass die zugewiesene Stimme
sich hörbar von der Stimme unterscheidet, die für den echten ATC-Controller
verwendet wird. Überschneidung mit dem separaten Roadmap-Item `multi-voice`
("Rotating voices per position, including regional accents") — beide Features
sollten sich denselben Stimmen-Pool/dieselbe Zuweisungslogik teilen, statt zwei
getrennte Systeme zu bauen. Das im Architektur-Entwurf explizit als offene
Abhängigkeit benennen, nicht stillschweigend duplizieren.

## Domänenwissen: Verkehrsdichte nach Zeit/Airport — noch keine Datenquelle

Geprüft: es gibt **aktuell keine** Airport-Größen-/Kategorie- oder
Tageszeit-Verkehrsdaten im Repo (`server/api/airports/` liefert nur Frequenzen,
kein "busy-ness"-Attribut). Das muss neu entworfen werden, nicht nur verdrahtet.
Erwartete Eckpunkte für den Entwurf:

- Ein einfaches, pflegbares Modell statt eines echten Verkehrsdatensatzes reicht
  für Trainingsrealismus — z. B. ein `trafficTier`-Feld pro Flughafen
  (`major` / `regional` / `ga`) mit sinnvollem Default, falls für einen
  Flughafen keine Angabe existiert (nicht alle Flughäfen in der Anwendung haben
  Zusatzdaten, das Feature darf nicht auf unbekannten Flughäfen komplett
  ausfallen).
- Tageszeit-Faktor: grobe Bänder reichen (z. B. Nacht = deutlich reduzierte
  Rate, Haupt-Bankzeiten morgens/abends = erhöhte Rate) — keine minutengenaue
  Simulation nötig.
- Die Spawn-Rate für simulierten Verkehr sollte aus `trafficTier × Tageszeit-
  Faktor` eine einfache Ziel-Anzahl "gleichzeitig aktiver Fremdverkehr auf
  dieser Frequenz" ableiten, die dann die Staffelungs-/Timing-Logik oben befüllt.

## Domänenwissen: Settings-Toggle in /live-atc — bestehendes Muster nutzen

`app/components/live-atc/cockpit/SettingsSheet.vue` hat bereits exakt das
Pattern, dem ein neuer `aiTrafficEnabled`-Schalter folgen soll — `v-switch` +
`v-model`, analog zu den bestehenden Zeilen 87-127 (`radioEffectsEnabled`,
`readbackEnabled`, `learningMode`, `debugMode`, `prerecEnabled`). Kein neues
UI-Konzept nötig, nur ein weiterer Switch nach demselben Muster, verdrahtet wie
die anderen über `live-atc.vue`/`useSessionState`.

## Domänenwissen: Gating gegen Interferenz mit dem Nutzer-Funkspruch

Fremdverkehr darf **nie** senden, während:
- der Nutzer selbst gerade PTT hält (`isRecording`, aus `usePttRecording.ts`),
- ATC noch auf ein Readback des Nutzers wartet (State-Rolle `pilot` im
  aktuellen Decision-Engine-Zustand bzw. `backendExpectedPhrase` ist gesetzt
  und noch nicht erfüllt — siehe `useLiveAtcSession.ts`),
- eine Nutzer-Transmission gerade zum Backend unterwegs ist / auf Antwort
  wartet (sonst wirkt die Fremdverkehr-Durchsage wie eine ATC-Antwort auf den
  Nutzer und verwirrt).

Technisch: Fremdverkehr-Durchsagen sollten durch **dieselbe** Sprech-Queue
laufen wie die echte ATC-Sprachausgabe (`enqueueSpeech`/`stopCurrentSpeech` aus
`useSpeechInterrupt`, verwendet in `useRadioSpeech.ts`), nicht über einen
zweiten, unabhängigen Audiokanal — sonst können beide gleichzeitig abspielen
und akustisch kollidieren. Der Trigger für eine neue Fremdverkehr-Durchsage
sollte also zusätzlich zur Staffelungs-/Timing-Logik (Punkt 3 im Prompt unten)
diese drei Gating-Bedingungen prüfen, bevor er überhaupt einreiht.

---

## Prompt (copy-paste)

Kontext: OpenSquawk (`roadmapItems.ts` Key "ai-traffic"): simulierte Mitpiloten
auf derselben Frequenz mit korrekten Callsigns, Handovers, Konfliktvermeidung, um
die Frequenz realistisch belebt wirken zu lassen, ohne dass der Trainierende
dadurch verwirrt oder von seinem eigenen Funkverkehr abgelenkt wird. Zusätzliche,
vom Nutzer explizit gewünschte Anforderungen: (a) jeder angesprochene
Fremdverkehr readbackt mit einer eigenen, über die Session stabilen Stimme,
(b) Verkehrsdichte variiert plausibel nach Tageszeit und Flughafen, (c) das
Feature ist unter `/live-atc` in den Einstellungen togglebar, (d) Fremdverkehr
darf niemals senden, während der Nutzer selbst spricht oder ATC noch ein
Readback vom Nutzer erwartet. Das gesamte für dieses Feature nötige
Domänenwissen (Staffelungsminima, Wirbelschleppen-Kategorien, Referenz-
Flugzeugtypen mit Performance-Daten, Speed-Control-Regeln, Direct-to-Validität,
bestehendes Multi-Voice-Plumbing, fehlende Verkehrsdichte-Datenquelle,
bestehendes Settings-Toggle-Muster, bestehende Gating-Signale) steht bereits
oben in dieser Datei — nutze es direkt, ohne es neu herzuleiten oder anzunehmen.

Aufgabe: Entwirf die Architektur für simulierten Fremdverkehr, unter der
Randbedingung "regelbasiert bleibt der Standard, LLM nur wo zwingend nötig"
(Kostenmodell des Produkts). Beantworte konkret:

1. Wie werden Callsigns/Flugzeugtypen für Fremdverkehr generiert (kollisionsfrei
   zum echten Flugplan/Callsign des Nutzers), unter Nutzung der oben
   angegebenen Referenz-Flugzeugtypen-Tabelle als Startdatenbank für Injection?
2. Wie wird die Staffelung (horizontal/vertikal + Wirbelschleppen-Zuschlag laut
   Matrix oben) zwischen simuliertem Verkehr, echtem Nutzerflugzeug und
   ggf. weiterem simulierten Verkehr laufend geprüft und durchgesetzt (z. B.
   wann bekommt simulierter Verkehr eine Speed- oder Vectoring-Anweisung, um
   die Minima einzuhalten)?
3. Wie wird Timing/Reihenfolge der Funksprüche gegen den echten
   Nutzer-Funkspruch arbitriert (Sendekollisionen auf derselben Frequenz sind
   ein reales Problem — nur ein Sender gleichzeitig)?
4. Wie werden Speed-Anweisungen (Stufen, Untergrenze pro Typ) und Direct-to-
   Freigaben (Gültigkeitsprüfung, Zustandsupdate der Route) für simulierten
   Verkehr regelbasiert erzeugt, gemäß den Regeln oben?
5. Welcher Teil MUSS generativ/LLM-gestützt sein (z. B. situative
   Phraseologie-Variation) vs. welcher Teil bleibt Template-/Regel-basiert wie
   beim echten Piloten-Flow?
6. Wie wird das an die bestehende `communicationsEngine.ts` / den
   Python-Decision-Backend-Vertrag angebunden, ohne dessen
   "kein LLM-Routing hier" Prinzip zu verletzen?
7. Wie wird jedem simulierten Flugzeug eine stabile, unterscheidbare Stimme
   zugewiesen (unter Wiederverwendung des bereits vorhandenen `voice`-Parameters
   in `useRadioSpeech.ts`/`atc/say.post.ts`, siehe Domänenwissen oben), und wie
   verhält sich das zum separaten Roadmap-Item `multi-voice` — ein gemeinsamer
   Stimmen-Pool oder zwei unabhängige Zuweisungen?
8. Wie wird die Ziel-Anzahl gleichzeitig aktiven Fremdverkehrs aus Flughafen-Tier
   und Tageszeit abgeleitet (siehe vorgeschlagenes `trafficTier`-Modell oben),
   inklusive sinnvollem Default für Flughäfen ohne Zusatzdaten?
9. Wie wird der neue `aiTrafficEnabled`-Settings-Toggle strukturell eingebunden
   (analog zu den bestehenden Switches in `SettingsSheet.vue`), und was passiert
   mit bereits aktivem simuliertem Verkehr, wenn der Toggle während einer
   laufenden Session ausgeschaltet wird (sofort stumm vs. laufende Durchsage zu
   Ende sprechen lassen)?
10. Wie wird technisch sichergestellt, dass Fremdverkehr niemals sendet, während
    der Nutzer PTT hält oder ATC noch ein Readback erwartet — konkret: läuft
    Fremdverkehr durch dieselbe Sprech-Queue (`enqueueSpeech`/
    `stopCurrentSpeech` aus `useSpeechInterrupt`) wie die echte ATC-Ausgabe,
    und welche der bestehenden Zustände (`isRecording`, `backendExpectedPhrase`,
    laufende Backend-Transmission) müssen vor jedem Spawn-Versuch geprüft werden?

Liefere: Architekturskizze (Komponenten + Datenfluss), Datenmodell für
simulierten Verkehr (Zustand pro Flugzeug: Position, Route/nächster Wegpunkt,
aktuelle Speed, Wake-Kategorie, Callsign, zugewiesene Voice-ID, Frequenz/Sektor),
eine Entscheidungsregel-Tabelle für "wann bekommt simulierter Verkehr welche Art
von Anweisung" (Speed/Vector/Direct/Handover), das `trafficTier`-Datenmodell für
Flughäfen samt Tageszeit-Faktor, die Gating-Prüfkette vor jedem Sende-Versuch,
und die Settings-Toggle-Integration (Prop-/State-Fluss, keine neue UI-Sprache).
Kein vollständiger Implementierungscode.

## Referenzdateien

`server/data/roadmapItems.ts`, `shared/utils/communicationsEngine.ts`,
`app/composables/useRadioSpeech.ts` (Zeile 23, `SpeechOptions.voice`),
`server/api/atc/say.post.ts` (Zeile 197, `body?.voice`),
`app/composables/usePttRecording.ts` (`isRecording`),
`app/composables/useLiveAtcSession.ts` (`backendExpectedPhrase`),
`app/composables/useSpeechInterrupt.ts` (`enqueueSpeech`/`stopCurrentSpeech`),
`app/components/live-atc/cockpit/SettingsSheet.vue` (Zeilen 87-127, bestehendes
Switch-Muster), `server/api/airports/` (heutiger Umfang: nur Frequenzen, kein
Traffic-Tier — bestätigt fehlend, nicht erneut prüfen),
CLAUDE.md (Abschnitt zur entfernten LLM-Decision-Routing — nicht wieder
einführen, nur als Randbedingung verstehen).
