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

---

## Prompt (copy-paste)

Kontext: OpenSquawk (`roadmapItems.ts` Key "ai-traffic"): simulierte Mitpiloten
auf derselben Frequenz mit korrekten Callsigns, Handovers, Konfliktvermeidung, um
die Frequenz realistisch belebt wirken zu lassen, ohne dass der Trainierende
dadurch verwirrt oder von seinem eigenen Funkverkehr abgelenkt wird. Das gesamte
für dieses Feature nötige Domänenwissen (Staffelungsminima, Wirbelschleppen-
Kategorien, Referenz-Flugzeugtypen mit Performance-Daten, Speed-Control-Regeln,
Direct-to-Validität) steht bereits oben in dieser Datei — nutze es direkt, ohne
es neu herzuleiten oder anzunehmen.

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

Liefere: Architekturskizze (Komponenten + Datenfluss), Datenmodell für
simulierten Verkehr (Zustand pro Flugzeug: Position, Route/nächster Wegpunkt,
aktuelle Speed, Wake-Kategorie, Callsign, Frequenz/Sektor), und eine
Entscheidungsregel-Tabelle für "wann bekommt simulierter Verkehr welche Art von
Anweisung" (Speed/Vector/Direct/Handover). Kein vollständiger Implementierungscode.

## Referenzdateien

`server/data/roadmapItems.ts`, `shared/utils/communicationsEngine.ts`,
CLAUDE.md (Abschnitt zur entfernten LLM-Decision-Routing — nicht wieder
einführen, nur als Randbedingung verstehen).
