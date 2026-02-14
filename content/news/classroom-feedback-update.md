---
title: "Classroom Update: Slower Audio, Smarter Phonetics, and METAR That Actually Makes Sense"
date: "2025-02-14"
summary: "We listened to your feedback and improved audio clarity, fixed phonetic edge cases, and made METAR lessons actually understandable."
readingTime: "2 min read"
---

Thank you to everyone who took the time to share feedback on the Classroom. Your reports were specific, honest, and incredibly useful. Here's what changed based on what you told us.

---

## Audio Speed: Slower by Default

The most common theme was clear: **ATC audio is too fast**, especially for new users and when dealing with complex phrases like SID/STAR names or weather reports.

- The **default speaking speed is now 0.85x** instead of 1.0x, so new users start at a more comfortable pace.
- The **speed slider now goes down to 0.5x** (previously 0.7x), giving you more room to slow things down while you're learning.

You can still crank it up to 1.3x once you're ready for realistic traffic speed.

---

## METAR Lessons: No More Robot Gibberish

Several of you pointed out that METAR content was spoken literally -- raw codes like "BKN025" or "28015KT" made no sense when read aloud by the TTS engine.

The Classroom now **normalizes METAR phrases into proper spoken aviation English** before sending them to TTS:

- `28015KT` becomes *"wind two eight zero degrees, one five knots"*
- `BKN025` becomes *"broken, two thousand five hundred feet"*
- `15/08` becomes *"temperature one five, dew point zero eight"*
- Natural pauses between each weather element

This applies to both the METAR decode and ATIS lessons.

---

## Phonetics: SID, STAR, and Approach Suffixes

Some of you noticed that procedure names like **SUGOL 2S** or approach types like **ILS 08R Y** weren't being phonetized correctly. The suffix letters (S, Y, Z) were spoken as regular letters instead of their ICAO equivalents.

Now:

- **SID/STAR suffixes** are correctly expanded: SUGOL 2S becomes *"SUGOL two Sierra"*
- **Approach suffixes** are handled too: ILS 08R Y becomes *"ILS runway zero eight right Yankee"*
- The system now handles spaces in SID/STAR names (e.g., `SUGOL 2S` vs `SUGOL2S`)

---

## Small Fixes

- The readback feedback label now says **"Expected:"** instead of the German "Soll:" -- sorry about that.
- The **Pushback Delay** lesson now accepts both the word form ("five") and the numeral ("5") for the delay field.

---

## What's Next

We're continuing to improve the Classroom based on your input. If you run into anything else that feels off, let us know -- your feedback directly shapes what we build.
