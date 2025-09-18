---
title: "Alpha-Prototyp bereit für frühe Tests"
date: "2025-09-15"
summary: "Unser erster OpenSquawk Alpha-Build läuft lokal für MSFS und zeigt, wohin die Reise Richtung community-getriebener AI-ATC geht."
bannerFile: "alpha-prototype.svg"
---

Wir haben den Alpha-Prototyp von OpenSquawk intern stabilisiert und geben ihn jetzt an neugierige Mitentwickler:innen raus. Der Build kombiniert eine Nuxt-Oberfläche mit Node-Services für Speech-to-Text, Entscheidungslogik und TTS. Alles lässt sich lokal betreiben, solange du ein wenig Terminal-Erfahrung mitbringst.

## Was dich erwartet

- Self-host Setup: `yarn install`, `.env` befüllen, danach `yarn dev` oder `docker compose up` für das volle Paket.
- Simulator-Fokus: Microsoft Flight Simulator (MSFS) zuerst, X-Plane steht bereits in der Konzeptphase.
- Zielbild: Community-driven Features, damit Trainingsrichtung VATSIM realitätsnah bleibt und Hosting langfristig bezahlbar wird.

## Startvoraussetzungen

- Grundkenntnisse in Node/Nuxt (Logs lesen, Pakete aktualisieren, `.env` konfigurieren).
- Zugriff auf MSFS (PC) für die ersten Funkexperimente.
- Bereitschaft, Issues zu dokumentieren und kleine Tweaks per Pull Request zu liefern.

## Wie du helfen kannst

- Teste den Alpha-Build und melde Findings als Issues – am besten mit Logs oder kurzen Screenshots.
- Schau in die Issues labeled `help-wanted`, dort liegen konkrete Aufgaben für Node/Nuxt Devs, ATC SMEs, Tester:innen und Infra-/Kosten-Benchmarking.
- Teile eigene Feature-Ideen direkt in der Roadmap oder schreib uns via [info@opensquawk.de](mailto:info@opensquawk.de).

## Nächste Schritte

- X-Plane Plugin als nächstes Milestone.
- Lernpfad-Module iterieren (Ground → Departure → Arrival → VATSIM).
- Hosting-Kosten transparent benchmarken und im Blog teilen.

Danke für jedes Feedback – gemeinsam bringen wir OpenSquawk Richtung „Open-source, low-cost AI ATC für Flugsimulatoren".
