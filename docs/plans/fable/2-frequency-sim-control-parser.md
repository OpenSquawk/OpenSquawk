# 2 — Frequency-driven Simulator Control: Design + Kernparser

Warum Priorität 2: großes zukünftiges USP-Feature (Roadmap-Key
`frequency-sim-control`), aber noch ungebaut — reines Architektur-/Designproblem
mit hoher Fehlerkosten (Fehlklassifikation = falsches Kommando im Sim). Braucht
echtes Reasoning über Sicherheits-/Kostenkompromisse, kein mechanisches Wiring.

Diese Datei enthält bereits die relevanten Fakten aus dem bestehenden Code, die
für ein realistisches Design nötig sind — insbesondere: **die Bridge ist heute
nur eine Leserichtung**, und es gibt bereits zwei leicht inkonsistente
Parameter-Vokabulare im Code, die das neue Schema aufgreifen oder bewusst
vereinheitlichen muss.

---

## Bereits im Code vorhandene Fakten (nicht neu recherchieren)

**1. Die Bridge ist heute reine Telemetrie-Leserichtung, kein Schreibkanal.**

- `server/api/bridge/ws.ts` relayt ausschließlich PTT-Edges (Bridge → Client).
- `server/api/bridge/data.post.ts` nimmt Telemetrie vom Bridge-Client entgegen
  (Bridge → Server → Client), sendet aber nichts zurück an die Bridge.
- Es existiert **keine** bestehende Route/Kanal, über den der Server der Bridge
  einen Befehl schicken könnte ("setze Höhe auf X", "platziere Flugzeug bei Y").
  Das Feature "let the bridge apply those changes directly in the sim" (Wortlaut
  aus `roadmapItems.ts`) braucht also **einen neuen Schreibkanal
  Server→Bridge**, nicht nur einen Parser. Das gehört explizit ins Architektur-
  Ergebnis, nicht nur "Parser extrahiert Kommando, Rest ist trivial".
- Die eigentliche SimConnect/X-Plane-Schreiblogik liegt vermutlich in der
  separaten Bridge-Client-Anwendung (nicht Teil dieses Repos) — das Ergebnis
  sollte den Schnittstellen-Vertrag (welches JSON geht raus) definieren, nicht
  den Bridge-Client selbst implementieren.

**2. Zwei bestehende, leicht inkonsistente Parameter-Vokabulare — Schema muss
sich für eines entscheiden oder beide abbilden:**

`NormalizedTelemetry` (`app/composables/useRadioBackend.ts:37-46`, das ist die
sim-seitige, bereits normalisierte Sicht):
```ts
altitude_ft, ias_kts, gs_kts, vs_fpm, heading_deg, on_ground,
distance_to_dest_nm, distance_to_dep_nm
```

`DecisionNodeAutoTrigger.parameter` (`shared/types/decision.ts:19-25`, das ist
die decision-engine-seitige Sicht für Auto-Trigger-Bedingungen):
```ts
altitude_ft, speed_kts, groundspeed_kts, vertical_speed_fpm, heading_deg, distance_nm
```

Unterschiede: `ias_kts` vs. `speed_kts`, `gs_kts` vs. `groundspeed_kts`,
`vs_fpm` vs. `vertical_speed_fpm`, `distance_to_dest_nm`/`distance_to_dep_nm`
vs. generisches `distance_nm`. Das neue Sim-Control-Kommandoschema sollte sich
explizit für eine Konvention entscheiden (Empfehlung: an `NormalizedTelemetry`
anlehnen, da das Kommando am Ende Richtung Bridge/Sim geht, nicht Richtung
Decision-Engine) — Fable soll diese Entscheidung bewusst treffen und begründen,
nicht eine dritte, neue Namenskonvention erfinden.

**3. Frequenzformat/-grenzen sind bereits definiert:**
`shared/utils/frequency.ts` — gültiger VHF-Comm-Bereich ist **118.000–136.975
MHz** (nicht 108–137, das wäre inkl. Navaid-Band). Jedes Kommando mit
Frequenzbezug muss dieselbe Grenze verwenden, nicht neu erfinden.

**4. Das eigentliche Feature ist ein Sim-Setup-Kommando, keine echte
ATC-Freigabe-Interpretation.** Laut Roadmap-Wortlaut geht es um Sätze wie
*"set me up for an approach from 5,000 ft to EDDF 07R"* oder *"change my
altitude to X"* — das sind **Meta-/Setup-Kommandos des Nutzers an die eigene
Simulator-Instanz** (vergleichbar einem Teleport/Reposition-Cheat, nur als
Sprachbefehl verpackt), **nicht** die Interpretation einer echten
ATC-Controller-Freigabe. Das ist eine bewusst andere Grammatik als reguläre
ICAO-Phraseologie-Readbacks (die laufen über `sttMatch.ts`, Punkt 1 dieses
Ordners) — hier geht es um Nutzer-Selbstbedienung auf der Frequenz, nicht um
Pilot-Controller-Dialog.

## Prompt (copy-paste)

Kontext: OpenSquawk (siehe README, `server/data/roadmapItems.ts` Key
"frequency-sim-control"). Ziel-Feature: Pilot spricht auf Frequenz einen freien
Sim-Setup-Befehl wie "set me up for an approach from 5000 ft to EDDF 07R" oder
"change my altitude to 8000" — das ist ein Meta-Kommando an die eigene
Sim-Instanz (Reposition/State-Change), keine Interpretation einer echten
ATC-Freigabe. Das Python-Backend (OpenSquawk-LiveATC-api, separates Repo,
regelbasiertes Routing) soll das NICHT per Freitext-LLM-Call pro Turn lösen
(Kostenvorteil des Produkts), sondern über einen begrenzten, sicheren
Intent-Parser. Die oben in dieser Datei dokumentierten Fakten (Bridge ist heute
nur Leserichtung, zwei bestehende Parameter-Vokabulare, Frequenzgrenzen) sind
verbindliche Rahmenbedingungen — nicht neu recherchieren, direkt darauf aufbauen.

Aufgabe:
1. Entwirf ein Schema für erlaubte Sim-Kommandos (Typ, Parameter,
   Wertebereiche — z. B. `altitude_ft: 0-45000`, `runway: ICAO-Pattern`,
   `heading_deg: 0-360`), das sich an einer der beiden bestehenden
   Parameter-Konventionen orientiert (triff und begründe die Entscheidung,
   siehe Punkt 2 oben).
2. Entwirf einen Parsing-Ansatz, der aus freiem Sim-Setup-Funkspruch-Text ein
   strukturiertes Kommando extrahiert ODER explizit "kein Match" zurückgibt
   (kein Best-Effort-Raten bei Unsicherheit — Sicherheit vor Vollständigkeit;
   ein falsch interpretiertes Kommando setzt den Sim-Zustand des Nutzers
   real falsch).
3. Begründe, warum ein regelbasierter/Grammatik-Ansatz vs. ein LLM-Call pro
   Transmission hier die richtige Wahl ist oder nicht, unter der Prämisse, dass
   das Produkt kosteneffizient bleiben muss.
4. Skizziere den fehlenden Schreibkanal Server→Bridge (Transportformat,
   Bestätigungs-/Fehlerfluss — was passiert, wenn die Bridge das Kommando nicht
   ausführen kann, z. B. Flugzeug am Boden vs. Reposition in der Luft
   angefordert), ohne die eigentliche SimConnect-Implementierung zu bauen.

Liefere: TypeScript-Typen für das Kommando-Schema, Beispiel-Parsing-Logik
(Pseudocode oder echter Code je nach Ansatz), eine Liste von 15 realistischen
Sim-Setup-Sprüchen mit erwartetem Ergebnis (inkl. Grenzfällen, die absichtlich
"kein Match" liefern müssen, z. B. mehrdeutige Höhenangaben ohne Einheit), und
eine Skizze des Server→Bridge-Kommandokanals.

## Referenzdateien

`server/data/roadmapItems.ts`, `app/composables/useRadioBackend.ts` (Zeilen
37-46 für `NormalizedTelemetry`), `shared/types/decision.ts` (Zeilen 16-34 für
`DecisionNodeAutoTrigger`), `shared/utils/frequency.ts`,
`server/api/bridge/ws.ts`, `server/api/bridge/data.post.ts` (heutiger,
einseitiger Bridge-Kanal — nicht ändern, nur als Ausgangspunkt verstehen),
`README.md` (Produktkontext).
