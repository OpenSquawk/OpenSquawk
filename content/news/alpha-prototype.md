---
title: "Alpha prototype ready for early testing"
date: "2025-09-15"
summary: "Our first Live ATC loop now runs end-to-end: push-to-talk audio, state machine decisions and natural voice replies."
---

The first OpenSquawk alpha is finally in the wild for contributors. It wires the entire Live ATC loop together:
press your simulator push-to-talk key, we capture the audio, run Whisper-class speech-to-text, let the LLM pick a
legal response from our state machine and answer through Coqui/Piper voices. Everything runs locally so you can study
and tweak every step.

## What ships in the alpha

- **Live ATC core:** Streaming PTT audio into the controller, including intent understanding and rule-checked replies.
- **Telemetry bridge:** The MSFS 2020 plug-in mirrors heading, altitude, flight plan legs and radio stack into the
  decision engine so the controller can vector or warn even without pilot input.
- **Classroom carry-over:** The existing listening drills stay available for invitees – Ground and Departure packs help
  you test comprehension before flying with Live ATC.

## Prerequisites

- A Windows MSFS 2020 install and a microphone/PTT setup in your sim.
- Comfort with Node/Nuxt tooling (`yarn install`, `.env` wiring, `yarn dev` or `docker compose up`).
- Willingness to log findings, share radio snippets and propose rule updates.

## How to help

- Fly short circuits with the alpha controller, then file issues with timestamps, transcripts or audio.
- Extend the decision tree with regional phraseology or additional branches (missed approach, pattern work, VFR).
- Record Classroom feedback so we can refine the answer keys and scoring UX.

## Next milestones

- Polish the telemetry plug-in for MSFS 2024 and begin the X-Plane bridge prototype.
- Add proactive ATC calls (spacing alerts, runway occupancy checks) triggered purely from flight-state changes.
- Expand Classroom with Arrival scenarios and a lightweight dashboard for instructors.

Thank you for pushing the very first iteration of Live ATC forward – every log and suggestion keeps the project honest
and grounded in real-world procedures.
