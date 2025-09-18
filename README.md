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

For offline-friendly development you can run Whisper tiny and Piper locally via Docker. A ready-to-use setup lives under `docker/local-ai`.

```bash
cd docker/local-ai
docker compose up --build
```

The compose stack starts two containers:

- **opensquawk-whisper** – `faster-whisper` tiny.en model exposed on `http://localhost:9000/v1/audio/transcriptions`
- **opensquawk-piper** – Piper TTS (default `en_US-ryan-low`) exposed on `http://localhost:5001/v1/audio/speech`

On the first run the containers will download the required models into Docker volumes (`whisper-cache`, `piper-voices`). You can change the default voice/model via environment variables in `docker-compose.yml`.

To make the Nuxt server use the local services, add the following to your `.env`:

```bash
USE_PIPER=true
PIPER_BASE_URL=http://localhost:5001

USE_LOCAL_WHISPER=true
LOCAL_WHISPER_URL=http://localhost:9000/v1/audio/transcriptions
LOCAL_WHISPER_LANGUAGE=en
```

Restart the Nuxt backend after updating the environment.
