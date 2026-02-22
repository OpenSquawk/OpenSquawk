# OpenSquawk

OpenSquawk is an open, cost-efficient AI-ATC platform for flight simulators.
Built with Nuxt 4, it provides a web interface that combines training, radio communication, and classroom content for simulator pilots.
On the server side, via Node.js Open AI deliver speech synthesis, decision trees, and account management.
Goal: a community-driven alternative to other costly AI-ATC solutions while being open and extensible.

## Current Features

* Modern web UI (Nuxt 4, Tailwind, Vuetify) with landing and classroom pages
* Server APIs for ATC logic, decision trees, classroom content, and authentication
* MongoDB storage
* OpenAI integration for speech and text models with configurable voices
* Optional local Speaches server for self-hosted speech in/output

## Roadmap & Integrations

* **Simulator Bridges:** Planned connection to Microsoft Flight Simulator and X-Plane to receive live flight data. Implementation is scheduled but will take a few more months.
* **SimBrief:** Upcoming direct integration of SimBrief data (flight plans, briefings) for seamless cockpit dispatch info.
* **VATSIM:** No integration for now due to unclear licensing. We are monitoring the situation but will avoid coupling until approval is granted.

## Requirements

| Component           | Note                                                                       |
|---------------------|----------------------------------------------------------------------------|
| Node.js 22          | Specified in `package.json`.                                               |
| Yarn                |                                                                            |
| MongoDB 7+          | Local instance or hosted database. Configure via `MONGODB_URI`.            |
| ffmpeg              | Needed for audio processing (`fluent-ffmpeg`), must be on the system PATH. |
| OpenAI API Key      | For TTS and LLM calls (`OPENAI_API_KEY`).                                  |
| Optional: Piper TTS | For local speech (`pip install "piper-tts[http]"`).                        |

You can connect to any OpenAI-compatible (self-hosted or third-party) API by setting `OPENAI_BASE_URL` to the service's base URL.

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/OpenSquawk/OpenSquawk.git
   cd OpenSquawk
   ```
2. Enable corepack and install dependencies:

   ```bash
   corepack enable
   yarn install
   ```
3. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Key variables:

   * `MONGODB_URI`: MongoDB connection string (default `mongodb://127.0.0.1:27017/opensquawk`).
   * `JWT_SECRET` & `JWT_REFRESH_SECRET`: Random strings for tokens.
   * `OPENAI_BASE_URL`: Optional override for any OpenAI API–compatible service; defaults to the OpenAI platform when unset.
   * `OPENAI_API_KEY`, optional `OPENAI_PROJECT`, `LLM_MODEL`, `TTS_MODEL`, `VOICE_ID`.
   * `ATC_OUT_DIR`: Directory for generated audio files.
   * `USE_PIPER`, `PIPER_PORT`: Enable local Piper TTS instance.
   * SMTP settings (`NOTIFY_*`) if emails should be sent.
4. Start MongoDB and ensure `ffmpeg` is on the PATH.
5. Launch the dev server:

   ```bash
   yarn dev
   ```

   Interface runs at [http://localhost:3000](http://localhost:3000) with hot-reload.

## Production & Preview

* Build:

  ```bash
  yarn build
  ```
* Local preview:

  ```bash
  yarn preview
  ```
* For custom hosting, serve the Nuxt directory (`yarn start`).

## Optional Local Speech Services

### Piper TTS

For speech output without OpenAI:

```bash
pip install "piper-tts[http]"
piper-http-server --port 5001
```

Set `USE_PIPER=true` and adjust `PIPER_PORT`.
Model ID (`SPEECH_MODEL_ID`) can also be set in `.env`.

### Local STT/TTS

Local models via WSL+Docker is planned but not yet implemented. Placeholders and TODOs exist in the code.

## Project Structure

```
app/          # Nuxt frontend (pages, components, stores)
server/       # API routes, services, utilities (ATC, Auth, LLM)
shared/       # Shared types and helpers
content/      # Markdown news & CMS content
```

## Contributing & Community

We welcome issues, pull requests, and ideas—especially Nuxt/Node expertise, ATC knowledge, MSFS/X-Plane test flights, and infrastructure/cost optimization.
Contact: [info@opensquawk.de](mailto:info@opensquawk.de).

OpenSquawk thrives on community collaboration—priorities are set together. Join in!



