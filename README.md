# OpenSquawk

OpenSquawk ist eine offene, kostengünstige AI-ATC-Plattform für Flugsimulatoren. Die Anwendung wird mit Nuxt 4 gebaut und
liefert eine Weboberfläche, die Trainings, Funkverkehr und Lerninhalte für Simulator-Pilot:innen bündelt. Serverseitig
stellen Node.js-APIs unter anderem Sprachsynthese, Entscheidungsbäume und Accounts bereit. Das Ziel: eine Community-
getriebene Alternative zu klassischen Online-Netzwerken zu schaffen, die sich sowohl selbst hosten als auch künftig als
Managed Service betreiben lässt.

## Aktueller Funktionsumfang

- Moderne Weboberfläche (Nuxt 4, Tailwind, Vuetify) inklusive Landing- und Lernseiten
- Server-APIs für ATC-Logik, Entscheidungsbäume, Lerninhalte und Authentifizierung
- Speicherung in MongoDB und Audioverarbeitung über `ffmpeg`
- OpenAI-Anbindung für Sprach- und Textmodelle inklusive konfigurierbarer Stimmen
- Optionaler lokaler Piper-TTS-Server für selbst gehostete Sprachausgabe

## Roadmap & Integrationen

- **Simulator-Bridges:** Wir arbeiten an einer Bridge zu Microsoft Flight Simulator und X-Plane, um Flugdaten direkt aus
den Simulatoren zu empfangen. Die Implementierung braucht noch einige Monate, ist aber bereits geplant.
- **SimBrief:** Die Planung läuft, SimBrief-Daten (Flugpläne, Briefings) direkt zu integrieren, sodass Dispatch-Infos ohne
Umwege im Cockpit ankommen.
- **VATSIM:** Eine Integration ist vorerst nicht vorgesehen, weil die Lizenzlage ungeklärt ist. Wir beobachten das Thema,
solange jedoch keine Freigabe besteht, verzichten wir bewusst auf eine Kopplung.

## Voraussetzungen

| Komponente | Hinweis |
| --- | --- |
| Node.js 22 | In `package.json` festgelegt. Empfohlen wird `corepack` zum Verwalten von Yarn. |
| Yarn 4.9 | Wird automatisch durch `corepack enable` bereitgestellt. |
| MongoDB 7+ | Lokale Instanz oder gehostete Datenbank. Die Verbindung wird über `MONGODB_URI` konfiguriert. |
| ffmpeg | Für Audio-Processing (`fluent-ffmpeg`). Muss als CLI-Tool verfügbar sein. |
| OpenAI API Key | Für TTS- und LLM-Aufrufe (`OPENAI_API_KEY`). |
| Optional: Piper-TTS | Für lokale Sprachausgabe (`pip install "piper-tts[http]"`). |

## Projekt aufsetzen

1. Repository klonen:
   ```bash
   git clone https://github.com/OpenSquawk/OpenSquawk.git
   cd OpenSquawk
   ```
2. Yarn aktivieren und Abhängigkeiten installieren:
   ```bash
   corepack enable
   yarn install
   ```
3. Umgebungsvariablen konfigurieren:
   ```bash
   cp .env.example .env
   ```
   Wichtige Variablen:
   - `MONGODB_URI`: Connection-String zur MongoDB (Standard: `mongodb://127.0.0.1:27017/opensquawk`).
   - `JWT_SECRET` & `JWT_REFRESH_SECRET`: Zufällige Strings für Tokens.
   - `OPENAI_API_KEY`, optional `OPENAI_PROJECT`, `LLM_MODEL`, `TTS_MODEL`, `VOICE_ID`.
   - `ATC_OUT_DIR`: Pfad, in dem generierte Audios abgelegt werden.
   - `USE_PIPER`, `PIPER_PORT`: Aktivieren einer lokalen Piper-TTS-Instanz.
   - SMTP-Konfiguration (`NOTIFY_*`), falls E-Mails verschickt werden sollen.
4. MongoDB starten und sicherstellen, dass `ffmpeg` im PATH verfügbar ist.
5. Entwicklungsserver starten:
   ```bash
   yarn dev
   ```
   Die Oberfläche läuft standardmäßig auf [http://localhost:3000](http://localhost:3000). Hot Module Reloading ist aktiv.

## Produktion & Preview

- Build erzeugen:
  ```bash
  yarn build
  ```
- Produktionsbuild lokal prüfen:
  ```bash
  yarn preview
  ```
- Eigenes Hosting nutzt das aus Nuxt bekannte `.output/`-Verzeichnis (`yarn start`).

## Optionale lokale Sprachdienste

### Piper TTS

Wer Sprachausgabe ohne OpenAI realisieren möchte, kann Piper lokal betreiben:

```bash
pip install "piper-tts[http]"
piper-http-server --port 5001
```

Aktiviere anschließend `USE_PIPER=true` und passe `PIPER_PORT` an. Das Modell (`SPEECH_MODEL_ID`) lässt sich ebenfalls in
der `.env` setzen.

### Whisper Tiny (Ausblick)

Lokales Speech-to-Text ist vorgesehen, aber noch nicht implementiert. Platzhalter und TODOs sind im Code bereits
markiert.

## Strukturüberblick

```
app/          # Nuxt-Frontend (Pages, Komponenten, Stores)
server/       # API-Routen, Services und Utilities (z. B. ATC, Auth, LLM)
shared/       # Gemeinsam genutzte Typen und Hilfsfunktionen
content/      # Markdown-News & CMS-Inhalte
scripts/      # Wartungs- und Importskripte (z. B. Entscheidungsbäume)
```

## Beiträge & Community

Wir freuen uns über Issues, Pull Requests und Ideen. Besonders gefragt sind Kenntnisse in Nuxt/Node, ATC-Fachwissen,
Testflüge in MSFS/X-Plane sowie Infrastruktur- und Kostenoptimierung. Kontakt: [info@opensquawk.de](mailto:info@opensquawk.de).

OpenSquawk steht für gemeinschaftliche Entwicklung – Prioritäten setzen wir mit der Community. Mach mit!
