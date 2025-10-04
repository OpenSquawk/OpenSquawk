---
title: "Runtime hardening for Live ATC"
date: "2025-09-18"
summary: "The Live ATC alpha now validates PTT audio, centralises config and guards Classroom accounts with stronger inputs."
readingTime: "3 min read"
---

Today’s update is all about resilience for the Live ATC pipeline and the Classroom invite system. We tightened how
runtime values are loaded, cleaned the push-to-talk ingestion path and refreshed onboarding checks so alpha access
stays tidy.

## Highlights

- **Unified runtime config:** Every key (Whisper, local LLM, Coqui/Piper, simulator bridge) now flows through
  `server/utils/runtimeConfig.ts`. Missing values surface with precise error messages before the stack boots.
- **Safer push-to-talk uploads:** The radio endpoint accepts only validated base64 audio up to 2 MB, normalises
  everything to WAV/mono and rejects suspicious payloads before they reach Whisper.
- **Stronger accounts:** Waitlist and Classroom invites now require solid passwords and validated emails, keeping the
  closed alpha manageable.

## Details

### Runtime configuration tightened

The new helper checks every secret up front and exposes defaults for local development. Live ATC services now share the
same source of truth for model names, TTS voice selections and plug-in ports, which means fewer mismatches when swapping
between Docker and bare-metal setups.

### Push-to-talk ingress hardened

The `/api/radio/ptt` route sanitises payloads: it verifies base64 structure, caps file size to a realistic
push-to-talk clip and converts formats through FFmpeg only when needed. If the payload fails validation we respond with
clear 400 errors so testers can retry quickly.

### Classroom onboarding tightened

Invite-only accounts now go through the same validation logic as the waitlist: incorrect emails, weak passwords or
missing consent checkboxes stop the flow immediately. That keeps the Classroom cohorts small enough for meaningful
feedback.

## What’s next

- Expose telemetry bridge status in the UI so testers can confirm MSFS data is streaming.
- Mirror the new validation for future X-Plane and FlightGear plug-ins.
- Add long-form transcription support for Classroom scenario creation (async processing).

Hardening isn’t glamorous, but it makes every Live ATC exchange more reliable. Thanks for testing and filing detailed
bug reports!
