# Fable-Prompts

Selbstständige, direkt einsetzbare Prompts für Claude Fable (teures, limitiertes
Kontingent). Jede Datei ist vollständig — Kontext, Aufgabe, Abgrenzung, erwartetes
Ergebnis — damit Fable ohne Rückfragen in einem Durchgang liefert. Alles, was
Sonnet/Explore günstiger erledigen kann (Exploration, Boilerplate, Refactoring,
Regressionschecks), gehört NICHT hierher.

Reihenfolge: 1 = höchster Yield (kleiner Aufwand, unmittelbarer Produktnutzen,
korrektheitskritisch im bestehenden Code) → absteigend zu größeren, spekulativeren
Roadmap-Architekturfragen.

1. [1-stt-fuzzy-matching-hardening.md](1-stt-fuzzy-matching-hardening.md) — Bugfix/Test-Härtung an bestehendem, produktivem Code (`sttMatch.ts`).
   ✅ Erledigt 2026-07-14: Fix in `shared/utils/sttMatch.ts` (Ziffern verbatim verankert,
   Fuzzy nur noch auf dem Airline-Namen), +5 Tests in `tests/shared/sttMatch.test.ts`.
2. [2-frequency-sim-control-parser.md](2-frequency-sim-control-parser.md) — Design + Kernparser für Roadmap-Feature "frequency-sim-control".
   ✅ Erledigt 2026-07-14: Design in
   [../2026-07-14-frequency-sim-control-design.md](../2026-07-14-frequency-sim-control-design.md),
   Parser in `shared/utils/simControl.ts` + `tests/shared/simControl.test.ts`.
3. [3-ai-traffic-architecture.md](3-ai-traffic-architecture.md) — Architekturskizze für Roadmap-Feature "ai-traffic".
   ✅ Erledigt 2026-07-14: Architektur-Entwurf in
   [../2026-07-14-ai-traffic-architecture-design.md](../2026-07-14-ai-traffic-architecture-design.md).
