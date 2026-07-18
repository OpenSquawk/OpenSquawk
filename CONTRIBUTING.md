# Contributing to OpenSquawk Core

Thanks for your interest in improving OpenSquawk! This repository is the **open-source core**
(AGPLv3). Contributions to the core engine, SDK, connectors and open scenarios are very welcome.

> Note: the hosted cloud, AI feedback/scoring, billing and premium content are developed in private
> repositories and are **not** part of this repo. See [`COMMERCIAL.md`](COMMERCIAL.md).

## Good places to start

Look for issues labelled:

- `good first issue` — small, well-scoped tasks
- `help wanted` — we would love a hand here
- `scenario` — new training scenarios
- `connector` — simulator integrations (MSFS, X-Plane, FSUIPC, SimBrief, VATSIM data)
- `docs` — documentation and guides
- `phraseology` — R/T phraseology notes and corrections

## Workflow

1. Fork the repo and create a branch from `main`.
2. Make your change. Match the surrounding code style (Nuxt 4 / Vue 3 SFC, H3 server handlers).
3. Run the test suite: `yarn test`.
4. Open a pull request describing what and why.

## Development setup

See the [README](README.md) for full setup. In short:

```bash
corepack enable
yarn install
cp .env.example .env
yarn dev
```

## Ground rules

- Keep contributions relevant to the open core. Cloud/AI/billing changes belong in the private repos.
- Be respectful — see [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
- By contributing, you agree your contributions are licensed under the repository's AGPLv3 license.

Questions? **info@opensquawk.de**
