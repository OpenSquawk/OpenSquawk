---
title: "The State of Open-Source AI-ATC and Why We’re Building OpenSquawk"
date: "2025-06-20"
summary: "We analyzed the current market, research, and existing AI ATC systems to define how realistic, affordable, and open AI air traffic control can actually work — and where current solutions fall short."
readingTime: "14 min read"
---

While commercial AI-ATC tools have rapidly gained popularity, the open-source landscape is still almost empty. That’s exactly where **OpenSquawk** comes in.  
Over the past few months, we’ve studied how systems like *SayIntentions.AI*, *BeyondATC*, and *FSHud* operate, which simulators dominate the market, and what current research says about AI in air traffic communication.  
Our goal: to understand **what a realistic, open, and cost-efficient AI ATC should look like** — and how to actually make it viable.

---

## Why We Started This

The built-in ATC in most simulators — especially Microsoft Flight Simulator — is far from realistic radio comms.  
Anyone who’s flown on VATSIM or PilotEdge knows how much richer and more dynamic real-human ATC can be.  
But not everyone wants (or can) go online all the time. A smart offline ATC that actually talks like a controller would be a game changer — if it could sound natural, handle real procedures, and adapt flexibly to pilots’ speech.

The current generation of AI systems gets close — but each hits its own ceiling.

---

## What Others Are Doing (and Where They Fall Short)

**SayIntentions.AI** proved that *unscripted ATC* can work: free-form voice input, dynamic replies, global coverage  
(<a href="https://www.sayintentions.ai/pricing" target="_blank">SayIntentions AI, 2025</a>).  
Technically brilliant — but expensive. Their subscription model (~€30/month) collapsed under cloud costs for STT, LLM, and TTS inference  
(<a href="https://www.sayintentions.ai/opensky" target="_blank">OpenSky Closure Statement, 2025</a>).  
Even the free *OpenSky* beta was shut down because it simply wasn’t financially sustainable.  
That taught us an important lesson: **pure cloud AI doesn’t scale**.

**BeyondATC** chose a smarter path. Their AI runs **locally**, not in the cloud. The conversational layer is powered by a compact offline LLM, while the actual ATC logic (clearances, sequencing, vectoring) stays rule-based  
(<a href="https://www.beyondatc.net/" target="_blank">BeyondATC.net</a>).  
That hybrid approach convinced us: **LLM for language, rules for logic**. It keeps realism and reliability while avoiding the “hallucination” problem of free-running AI.

**FSHud** shows the opposite: stable AI traffic control and structured IFR flow matter even more than fancy dialogue.  
It manages AI aircraft, avoids conflicts, and feels professional — but speech is rigid, tied to scripted phrases  
(<a href="https://www.fshud.com/" target="_blank">FSHud.com</a>,  
<a href="https://www.avsim.com/forums/topic/655442-fshud-atc-now-compatible-with-msfs2024/" target="_blank">AVSIM, 2024</a>).  
It’s realistic but sterile. Without semantic understanding (LLM), ATC stays mechanical.

And in the **open-source world?** Almost nothing. Apart from *Red Griffin ATC* for FlightGear (GPL, 2020) and a few legacy scripts, there is **no active project** that implements a true STT → LLM → TTS pipeline for flight simulators.  
That gap is exactly what we’re addressing with **OpenSquawk**.

---

## Which Simulators Matter Most

Our market research shows:
- **MSFS 2020/2024** dominates, with **15+ million players**  
  (<a href="https://news.xbox.com/en-us/2024/03/05/microsoft-flight-simulator-15-million-players/" target="_blank">Microsoft Flight Simulator Blog, 2024</a>).
- **X-Plane 12** is smaller but technically strong, favored among serious hobbyists and training users.
- **Prepar3D** and **FlightGear** are now niche in the leisure sector.

So our roadmap is clear: **MSFS first, X-Plane second.**  
Both provide APIs (SimConnect and DataRefs) that make integration of flight plans, frequencies, and AI traffic feasible.

---

## What the Research Says

We reviewed current papers and industry reports on AI in ATC:  
<a href="https://arxiv.org/abs/2304.07842" target="_blank">Zuluaga-Gomez et al., 2023</a>;  
<a href="https://arxiv.org/abs/2212.07164" target="_blank">Prasad et al., 2022</a>;  
<a href="https://arxiv.org/abs/2508.02269" target="_blank">Gould et al., 2025</a>.

The consensus: **hybrid systems win.**  
Pure LLMs hallucinate; pure rule engines are too rigid.  
The best results come from combining speech transcription, LLM interpretation, and deterministic ATC logic.

Fine-tuning open models like **Llama 2** or **Mistral 7B** on real ATC dialogues is feasible — especially using open audio data (e.g., LiveATC).  
Several studies also warn against letting AI make operational decisions autonomously, confirming our design direction: **the LLM speaks, but doesn’t decide.**

---

## Our Technical Approach

Our architecture follows one simple principle:

**Speech-to-Text → LLM → Text-to-Speech — all local.**

- **STT:** Whisper (Tiny or Small models for real-time)  
- **LLM:** locally run, ATC-tuned model (e.g., Mistral 7B, fine-tuned)
- **TTS:** Speaches (using Piper)

Everything is containerized and runs on **Windows, macOS, or Linux via Docker** — no dependency hell, no login, no cloud bill.  
That’s how we keep it open, private, and sustainable.

---

## Funding and Sustainability

OpenSquawk will remain **free to use**, but we plan optional paid services for those who want more:
- local mode: 100 % free and offline,
- optional cloud add-ons: high-quality voices or hosted inference,
- community donations or institutional sponsorships for development and data hosting.

This mirrors what the most successful AI-ATC products have proven viable: **an offline core, optional cloud extras.**

---

## Takeaways

Our research made a few things clear:
- AI-ATC is not futuristic — it’s here.
- Open-source solutions are still missing.
- The pain points of current tools — cost, hallucination, speech tolerance — can be solved with a local hybrid design.

So that’s what we’re building.

**OpenSquawk** aims to become a free, intelligent, locally running virtual controller that brings believable, dynamic ATC to flight simulators — not to replace real humans, but to make every offline flight feel alive again.

---

### Sources

- <a href="https://www.sayintentions.ai/" target="_blank">SayIntentions.AI (2025) — Official site and pricing</a>
- <a href="https://www.beyondatc.net/" target="_blank">BeyondATC (2025) — Official product page</a>
- <a href="https://www.fshud.com/" target="_blank">FSHud (2025) — Official site and features</a>
- <a href="https://www.avsim.com/forums/topic/655442-fshud-atc-now-compatible-with-msfs2024/" target="_blank">AVSIM (2024) — FSHud now compatible with MSFS 2024</a>
- <a href="https://news.xbox.com/en-us/2024/03/05/microsoft-flight-simulator-15-million-players/" target="_blank">Microsoft (2024) — Flight Simulator reaches 15 M players</a>
- <a href="https://arxiv.org/abs/2304.07842" target="_blank">Zuluaga-Gomez J. et al. (2023) — A Virtual Simulation-Pilot Agent for ATC Training</a>
- <a href="https://arxiv.org/abs/2212.07164" target="_blank">Prasad R., Zuluaga-Gomez J., Motlicek P. (2022) — Speech & NLP for Pseudo-Pilot Simulator</a>
- <a href="https://arxiv.org/abs/2508.02269" target="_blank">Gould S., De Ath G., Carvell R., Pepper A. (2025) — AirTrafficGen: ATC Scenario Generation with LLMs</a>
