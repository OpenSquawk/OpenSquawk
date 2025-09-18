---
title: "Runtime hardening & safer inputs"
date: "2025-09-18"
summary: "A new configuration hub, secure audio uploads and stronger passwords make OpenSquawk more robust."
readingTime: "3 min read"
---

We worked across the backend, runtime config and onboarding today to make OpenSquawk more resilient. Three workstreams were in focus: reproducible configuration, clean audio inputs for the radio workflow and tighter protection for user accounts.

## Highlights

- **Central runtime configuration:** All sensitive keys (OpenAI, TTS, Piper & Speaches) now flow through a shared helper. Misconfigurations show up instantly with clear error messages.
- **Safer radio inputs:** The PTT API now accepts validated base64 audio up to 2 MB and standardises unknown formats to WAV before Whisper takes over.
- **Stronger passwords:** Registration checks email format and password quality (length, letters/numbers, special characters) so alpha access is not created with trivial credentials.

## Details

### Runtime configuration tidied up

A new utility (`server/utils/runtimeConfig.ts`) encapsulates every runtime variable. The `OpenAI` and TTS clients consistently pull keys, models, voice defaults as well as Piper/Speaches switches from there. The server now stops with an explanatory error if `OPENAI_API_KEY` is missing – better to fail early than silently throw 500s.

### Audio endpoints hardened

The push-to-talk route validates base64 input, caps file size at a practical 2 MB (~60 seconds of radio) and enforces known audio formats. That reduces the risk of memory spikes and ensures FFmpeg only kicks in for real conversions. At the same time, TTS endpoints now read their settings from the runtime config and respect local Piper ports and Speaches base URLs.

### Onboarding secured

Registration immediately rejects invalid input: wrong emails, short passwords or missing special characters now return clear error messages. Test accounts stay manageable and security standards rise without slowing the flow.

## Outlook

- Connect the Hotjar/analytics opt-in to the new config logic.
- Mirror the same password guidelines for login (including feedback UI).
- Consider processing larger audio files asynchronously if long-form transcripts become interesting.

If you have more hardening ideas, feel free to open issues or send PRs directly!
