# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.


## Local speech services (Docker)

For offline-friendly development you can run [Speaches](https://speaches.ai) locally. A ready-to-use compose setup lives under
`docker/local-ai` and builds a single container that serves both speech-to-text (Whisper tiny) and text-to-speech (multiple Piper
voices).

```bash
cd docker/local-ai
docker compose up --build
```

The compose stack starts **opensquawk-speaches** exposing:

- `POST http://localhost:5005/v1/audio/transcriptions` – faster-whisper tiny.en (STT)
- `POST http://localhost:5005/v1/audio/speech` – Piper voices preloaded from Speaches (TTS)

On each start the container runs a download check to ensure all required models are present. By default the following voices are
prepared:

- `speaches-ai/piper-en_US-ryan-low`
- `speaches-ai/piper-de_DE-thorsten-low`
- `speaches-ai/piper-en_GB-alba-low`

The fastest Whisper model (`tiny.en`) is used for transcription.

You can adjust the models via environment variables in `docker-compose.yml` or override them when running compose. Model files are
stored in the `speaches-cache` volume so they persist between restarts.

To make the Nuxt server use the local service, add the following to your `.env`:

```bash
USE_SPEACHES=true
SPEACHES_BASE_URL=http://localhost:5005
SPEACHES_TTS_MODEL_ID=speaches-ai/piper-en_US-ryan-low
SPEACHES_TTS_VOICE_ID=en_US-ryan-low
SPEACHES_STT_MODEL_ID=tiny.en
```

Restart the Nuxt backend after updating the environment.
