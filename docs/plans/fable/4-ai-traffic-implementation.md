# 4 — AI-Traffic: Implementierung nach dem Architektur-Entwurf

Warum Priorität 4: der Architektur-Entwurf (Punkt 3 dieses Ordners) ist fertig
und wurde bereits einmal gegen den bestehenden Code geprüft. Diese Datei ist
der Folge-Prompt, der aus dem Entwurf echten, getesteten Code macht — kein
neues Design, reine Umsetzung nach bereits getroffenen Entscheidungen.

---

## Bereits entschiedene Fakten (nicht neu diskutieren)

**Quelle der Wahrheit:**
[`docs/plans/2026-07-14-ai-traffic-architecture-design.md`](../2026-07-14-ai-traffic-architecture-design.md)
— vollständig lesen, jede der zehn beantworteten Fragen dort ist bindend.
Wenn beim Implementieren ein Widerspruch zwischen Entwurf und tatsächlichem
Code auffällt (Code kann sich seit 2026-07-14 weiterentwickelt haben), gilt:
Code-Realität hat Vorrang, Abweichung explizit im PR/Commit-Text dokumentieren
— nicht stillschweigend improvisieren.

**1. Der Traffic lebt vollständig im Client. Das Python-Backend
(`OpenSquawk-LiveATC-api`, `~/html/OpenSquawk-LiveATC-api`, separates Repo)
wird laut Entwurf § 0 und § 6 NICHT verändert** — kein neuer Endpoint, kein
neues Feld in `RadioTransmitResponse`, keine neue Route. Das ist eine bewusste
Architekturentscheidung (Begründung: alle Gating-Signale sind Browser-Zustand,
der Traffic routet nichts). **Bevor du eine einzige Zeile im Python-Repo
anfässt: prüfe, ob das wirklich nötig ist.** Falls die Implementierung im
Verlauf einen echten Bedarf am Backend aufdeckt (z. B. weil sich seit dem
Entwurf am Bridge-/Telemetrie-Vertrag etwas geändert hat), dokumentiere das
als eigenen Abschnitt im Ergebnis ("Abweichung vom Entwurf: …") statt es
kommentarlos zu implementieren — das ist eine Architekturentscheidung, keine
Implementierungsdetail-Entscheidung, und braucht Review, bevor Code im
zweiten Repo landet.

**2. Beide Repos arbeiten direkt auf `main`.** Kein Feature-Branch-Workflow in
diesem Projekt — Commits gehen direkt auf `main` in `OpenSquawk` und (falls
laut Punkt 1 tatsächlich nötig) in `OpenSquawk-LiveATC-api`. `git status` vor
dem ersten Commit in beiden Repos prüfen (sollte clean sein).

**3. Neue Module wie im Entwurf spezifiziert:**
- `app/composables/useAiTraffic.ts` (intern: `CallsignFactory`, `TrafficSim`,
  `InstructionPlanner`, `RadioScheduler` — als interne Funktionen/Module, nicht
  zwingend als separate Dateien, aber testbar isoliert)
- `shared/utils/voicePool.ts` (geteilt mit dem noch ungebauten Roadmap-Item
  `multi-voice` — Controller-/Pilot-Partition von Anfang an, siehe Entwurf § 7)
- `shared/data/trafficTiers.ts`
- `shared/data/simAircraftTypes.ts`

**4. Settings-Toggle exakt nach bestehendem Muster** (Entwurf § 9):
`SettingsSheet.vue` bekommt `aiTrafficEnabled` als weiteres `defineModel`,
`live-atc.vue` verdrahtet es nach dem `radioEffectsEnabled`/`prerecEnabled`-
Vorbild inkl. `localStorage`-Persistenz.

**5. Sim-Kernlogik ist reiner, framework-freier TypeScript-Code** (Entwurf,
Abschnitt "Offene Punkte"): `CallsignFactory`, Gap-Berechnung, Speed-Stufenleiter,
Direct-Validierung, Tier-/Tageszeit-Ableitung, Gating-Kette als reine
Funktionen unter `shared/` — müssen im bestehenden `tsx --test`-Setup
(`yarn test`) ohne Mocking/Browser laufen, seeded RNG für Determinismus.

## Prompt (copy-paste)

Kontext: OpenSquawk (Nuxt 4 / Vue 3, siehe `CLAUDE.md`). Ziel-Feature:
simulierter Fremdverkehr auf der Frequenz (`ai-traffic`,
`server/data/roadmapItems.ts`), reine akustische Kulisse, beeinflusst nie die
Bewertung des Nutzer-Funkverkehrs. Der vollständige Architektur-Entwurf liegt
bereits fertig in
`docs/plans/2026-07-14-ai-traffic-architecture-design.md` — lies ihn
komplett, er beantwortet bereits alle Design-Fragen (Callsign-Kollisionsfreiheit,
Separationslogik, Timing/Arbitrierung über die bestehende Sprech-Queue,
Speed-/Direct-Regeln, bewusst null LLM-Calls in v1, Nicht-Anbindung ans
Python-Backend, Stimmenpool-Teilung mit `multi-voice`, Verkehrsdichte-Tiers,
Settings-Toggle-Semantik, die zweistufige Gating-Kette). Diese Aufgabe ist
**Umsetzung, kein neues Design** — bei Unklarheiten im Entwurf nachschlagen,
nicht neu erfinden.

Randbedingung: Das Python-Backend-Repo (`OpenSquawk-LiveATC-api`, separates
Repo unter `~/html/OpenSquawk-LiveATC-api`) wird laut Entwurf § 0/§ 6 NICHT
angefasst — der Traffic hat keine Berührung mit `radioBackend.transmit/
createSession`. Nur falls du beim Implementieren einen echten, im Entwurf
nicht vorgesehenen Bedarf am Backend entdeckst: nicht einfach umsetzen,
sondern als separaten Abschnitt "Abweichung vom Entwurf" im Ergebnis
dokumentieren und offenlassen. Beide Repos arbeiten direkt auf `main`, kein
Branch-Workflow.

Aufgabe:
1. Implementiere die Datenmodelle aus Entwurf § 2
   (`shared/data/simAircraftTypes.ts`, `SimAircraft`-State) und die vier
   Kernmodule aus Entwurf § 1 innerhalb von `app/composables/useAiTraffic.ts`.
2. Implementiere `shared/utils/voicePool.ts` und `shared/data/trafficTiers.ts`
   exakt nach Entwurf § 7/§ 8 (deterministisches Hashing für Stimmzuweisung,
   Tier-Map + Heuristik-Fallback + Tageszeitfaktor).
3. Implementiere die Gating-Kette aus Entwurf § 10 als reine, testbare
   Funktion — inklusive der neuen `transmitInFlight`-Ref in
   `useLiveAtcSession.ts` (dort wo `transmitGeneration` bereits sitzt) und der
   `readbackPending()`-Logik mit `readbackProtectionMs`-Fenster.
4. Verdrahte `useAiTraffic` als reinen Beobachter in `live-atc.vue`
   (Lifecycle: `start()` nach erfolgreichem `startMonitoring()`, `stop()` bei
   `session_complete`/`backToSetup`/Unmount) — ohne bestehende Engine-/
   Session-Logik zu verändern, außer dem optionalen `traffic: true`-Meta-Flag
   in `appendLogEntry` (Entwurf § 6, optional).
5. Implementiere den Settings-Toggle nach Entwurf § 9 (`SettingsSheet.vue`,
   `live-atc.vue`, `localStorage`-Key nach `prerecEnabled`-Muster).
6. Schreibe seeded, framework-freie Unit-Tests für die reine Sim-Logik
   (`CallsignFactory`-Kollisionsfreiheit inkl. Phonetik-Regel, Gap-/Separations-
   Berechnung, Speed-Stufenleiter-Grenzen, Direct-to-Validierung,
   Tier-/Tageszeit-Ableitung, Gating-Kette in beiden Prüfzeitpunkten) unter
   `tests/shared/` bzw. `shared/`, lauffähig über `yarn test`
   (`tsx --tsconfig tsconfig.tests.json --test …`).
7. Verifiziere: `yarn test` grün, `yarn nuxt typecheck` fehlerfrei, sowie ein
   manueller Browser-Durchlauf (Toggle an/aus, hörbarer Fremdverkehr auf der
   aktiven Frequenz, keine Kollision mit echten ATC-/Pilot-Durchsagen während
   PTT oder Readback-Fenster).

Liefere: den vollständigen, produktionsreifen Code für alle oben genannten
Module und Integrationsstellen, die Unit-Tests, sowie eine kurze
Zusammenfassung (max. 15 Zeilen) etwaiger bewusster Abweichungen vom Entwurf
inkl. Begründung.

## Referenzdateien

`docs/plans/2026-07-14-ai-traffic-architecture-design.md` (verbindliche
Spezifikation), `server/data/roadmapItems.ts` (Roadmap-Eintrag `ai-traffic`),
`app/pages/live-atc.vue`, `app/composables/useLiveAtcSession.ts`
(`transmitGeneration`-Muster für `transmitInFlight`),
`app/composables/useSessionState.ts` (`backendExpectedPhrase`),
`app/composables/usePttRecording.ts` (`isRecording`),
`shared/utils/communicationsEngine.ts` (`currentState.role`, `variables`,
`appendLogEntry`), `app/composables/useSpeechInterrupt.ts` (`enqueueSpeech`,
Generation-Muster für Selbstentwertung), `app/composables/useRadioSpeech.ts`
(`speakWithRadioEffects`, aktuell hart `'alloy'`), `app/components/live-atc/
SettingsSheet.vue` (Zeilen 87–117, bestehendes Toggle-Muster),
`shared/types/decision.ts`, `README.md` / `CLAUDE.md` (Produkt-/Architekturkontext).
