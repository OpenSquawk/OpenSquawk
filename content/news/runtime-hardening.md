---
title: "Runtime-Härtung & sichere Eingaben"
date: "2025-09-18"
summary: "Neue Konfigurationszentrale, sichere Audio-Uploads und strengere Passwörter machen OpenSquawk robuster."
readingTime: "3 Min Lesezeit"
---

Wir haben uns heute quer durch Backend, Runtime-Config und Onboarding gearbeitet, um OpenSquawk widerstandsfähiger zu machen. Drei Baustellen standen im Fokus: reproduzierbare Konfiguration, saubere Audio-Eingaben für den Funk-Workflow und ein härterer Schutz der Benutzerkonten.

## Highlights

- **Zentrale Runtime-Konfiguration:** Alle sensiblen Schlüssel (OpenAI, TTS, Piper & Speaches) laufen jetzt über eine gemeinsame Helper-Funktion. Fehlkonfigurationen fliegen sofort auf, inklusive klarer Fehlermeldung.
- **Sicherere Funk-Eingaben:** Die PTT-API akzeptiert nur noch validiertes Base64-Audio bis 2 MB und standardisiert unbekannte Formate auf WAV, bevor Whisper loslegt.
- **Stärkere Passwörter:** Registrierung prüft E-Mail-Format und Passwort-Qualität (Länge, Buchstaben/Zahlen, Sonderzeichen), damit Alpha-Zugänge nicht mit Trivialpasswörtern angelegt werden.

## Details

### Runtime-Konfiguration aufgeräumt

Ein neues Utility (`server/utils/runtimeConfig.ts`) kapselt sämtliche Laufzeit-Variablen. `OpenAI`- und TTS-Clients ziehen daraus konsistent Schlüssel, Modelle, Voice-Defaults sowie Piper/Speaches-Schalter. Der Server stoppt mit einem erklärenden Fehler, falls `OPENAI_API_KEY` fehlt – besser früh scheitern als stumm 500er produzieren.

### Audio-Endpunkte härter gemacht

Die Push-to-Talk-Route prüft Base64-Eingaben, begrenzt Dateigrößen auf praxisnahe 2 MB (~60 s Funk) und erzwingt bekannte Audioformate. Das reduziert Risiko von Speicherausreißern und sorgt dafür, dass FFmpeg nur bei echten Konvertierungen anspringt. Gleichzeitig lesen TTS-Endpunkte ihre Einstellungen jetzt aus der Runtime-Config und respektieren lokale Piper-Ports sowie Speaches-Basis-URLs.

### Onboarding abgesichert

Die Registrierung verweigert invaliden Input ab sofort sofort: ungültige E-Mails, kurze Passwörter oder fehlende Sonderzeichen liefern verständliche Fehlermeldungen. So bleiben Test-Accounts verwaltbar und Sicherheitsstandards steigen, ohne den Flow zu bremsen.

## Ausblick

- Hotjar/Analytics-Opt-in an die neue Config-Logik anbinden.
- Für den Login dieselben Passwort-Guidelines rückspiegeln (Feedback-UI).
- Größere Audiodateien optional asynchron verarbeiten, falls Langform-Transkripte spannend werden.

Wenn euch weitere Hardenings einfallen: gerne Issues aufmachen oder direkt PRs schicken!
