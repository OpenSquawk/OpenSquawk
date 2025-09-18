---
title: "Alpha prototype ready for early testing"
date: "2025-09-15"
summary: "Our first OpenSquawk alpha build runs locally for MSFS and shows where community-driven AI ATC is heading."
---

We have stabilised the OpenSquawk alpha prototype internally and are now handing it to curious co-developers. The build combines a Nuxt interface with Node services for speech-to-text, decision logic and TTS. Everything runs locally as long as you bring a bit of terminal experience.

## What to expect

- Self-host setup: `yarn install`, fill your `.env`, then `yarn dev` or `docker compose up` for the full stack.
- Simulator focus: Microsoft Flight Simulator (MSFS) first; X-Plane is already in the concept phase.
- Target image: community-driven features so VATSIM training stays realistic and hosting remains affordable.

## Prerequisites

- Basic knowledge of Node/Nuxt (reading logs, updating packages, configuring `.env`).
- Access to MSFS (PC) for the first radio experiments.
- Willingness to document issues and ship small tweaks via pull request.

## How you can help

- Test the alpha build and report findings as issues – ideally with logs or quick screenshots.
- Check the `help-wanted` issues for concrete tasks aimed at Node/Nuxt devs, ATC SMEs, testers and infra/cost benchmarking.
- Share feature ideas directly in the roadmap or email us at [info@opensquawk.de](mailto:info@opensquawk.de).

## Next steps

- X-Plane plug-in as the next milestone.
- Iterate learning modules (Ground → Departure → Arrival → VATSIM).
- Benchmark hosting costs transparently and share them on the blog.

Thanks for every piece of feedback – together we can turn OpenSquawk into open-source, low-cost AI ATC for flight simulators.
