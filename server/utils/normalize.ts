// yarn add openai
import OpenAI from "openai";
import fs from "node:fs";
import { DEFAULT_AIRLINE_TELEPHONY, normalizeRadioPhrase } from "../../shared/utils/radioSpeech";
import { getServerRuntimeConfig } from "./runtimeConfig";

const { openaiKey, openaiProject, openaiBaseUrl, llmModel, ttsModel } = getServerRuntimeConfig();
const normalizeClientOptions: ConstructorParameters<typeof OpenAI>[0] = { apiKey: openaiKey };
if (openaiProject) {
    normalizeClientOptions.project = openaiProject;
}
if (openaiBaseUrl) {
    normalizeClientOptions.baseURL = openaiBaseUrl;
}

export const normalize = new OpenAI(normalizeClientOptions);

export function getOpenAIClient(): OpenAI {
  return normalize;
}

export const LLM_MODEL = llmModel;
export const TTS_MODEL = ttsModel;

/* =========================
   LLM PROMPTS (refined)
   =========================
   Goal: the LLM returns a compact, machine-friendly ICAO line that our normalizer → TTS can expand perfectly.
   IMPORTANT: Use the exact output format defined below; do not spell out numbers.
*/

export const ATC_OUTPUT_SPEC = `
OUTPUT RULES (STRICT):
- ONE instruction only. No chit-chat. No readback. No explanations.
- English ICAO phraseology; keep it concise.
- Use the following tokens exactly; numbers as digits:
  * Callsign: AAA123[Letter] (e.g., DLH359, BAW12A).
  * Runway: "RWY" + two digits + optional L/C/R (e.g., RWY 25R, RWY 08L).
  * Heading: "HDG" + 3 digits (e.g., HDG 270).
  * Flight level: "FL" + 2–3 digits (e.g., FL120, FL90).
  * Altitude (feet): "<number> ft" (e.g., 2000 ft, 5000 ft).
  * Squawk: "squawk" + 4 digits (e.g., squawk 4723).
  * QNH: "QNH" + 3–4 digits (e.g., QNH 1013).
  * Frequency: 3 digits "." 3 digits (e.g., 112.955, 121.800). Use 3+3 format.
  * ICAO airport: 4 capital letters (e.g., EDDF, EHAM).
  * Taxi: "via" + space-separated TWY designators (e.g., via A3 A N2).
- Separate segments by ". " (period + space). Keep line to <= 220 chars.
- Only include items relevant to current phase (clearance/taxi/line-up/dep/approach/landing).
- If you must give a contact instruction: "Contact <frequency>."
- Use standard order for the phase (e.g., taxi: destination RWY first, then route, then hold short).
`.trim();

/** System prompt: defines the role and rules */
export function atcSystemPrompt(opts?: {
    regionHint?: "EUR" | "US" | "INTL"; // soft hint only, defaults to INTL
}) {
    const region = opts?.regionHint ?? "INTL";
    return [
        `You are an ICAO-compliant ATC controller for ${region}.`,
        `Adhere to standard phraseology, brevity, and safety-critical ordering.`,
        `Assume you have access to current airport config (active runway, SIDs), unless contradicted by user context.`,
        ATC_OUTPUT_SPEC,
    ].join("\n\n");
}

/** Seed ATC without pilot input (backward-compatible signature, but richer prompt) */
export function atcSeedPrompt(s: {
    airport: string;           // e.g., "EDDF"
    aircraft: string;          // e.g., "A320"
    type: string;              // e.g., "IFR"
    stand: string;             // e.g., "V155"
    dep: string;               // destination ICAO, e.g., "EHAM"
    sid?: string;              // e.g., "MARUN 7F"
    squawk?: string;           // "4723"
    freq?: string;             // "121.800"
    runway?: string;           // "25R" (optional if known)
    phase?: "clearance" | "taxi" | "lineup" | "departure" | "handoff" | "approach" | "landing";
    notes?: string;            // e.g. "TWY N closed between N2–N4"
}) {
    // Default phase: clearance
    const phase = s.phase || "clearance";
    const ctx = [
        `Airport ${s.airport}`,
        `${s.aircraft} ${s.type} at stand ${s.stand}`,
        `IFR departure ${s.dep}`,
        s.runway ? `planned RWY ${s.runway}` : null,
        s.sid ? `planned SID ${s.sid}` : null,
        s.squawk ? `preassigned squawk ${s.squawk}` : null,
        s.freq ? `next frequency ${s.freq}` : null,
        s.notes ? `NOTAM/ATC notes: ${s.notes}` : null,
    ].filter(Boolean).join(", ");

    const need = phase === "clearance"
        ? "Issue an IFR clearance (route/SID if given, initial altitude, squawk, and current QNH if applicable)."
        : phase === "taxi"
            ? "Issue a taxi instruction to the departure RWY with a realistic taxi route and 'hold short'."
            : phase === "lineup"
                ? "Issue line-up and wait (or immediate takeoff if appropriate)."
                : phase === "departure"
                    ? "Issue initial heading/speed/altitude or 'climb via SID' as appropriate."
                    : phase === "handoff"
                        ? "Issue handoff to next frequency."
                        : phase === "approach"
                            ? "Issue approach clearance with runway, altitude/FL, QNH if appropriate."
                            : "Issue landing clearance with runway and any exit/roll-out instructions.";

    return [
        `Generate ONE realistic ICAO ATC instruction in English. No extra commentary.`,
        `Context: ${ctx}`,
        `Phase: ${phase}`,
        `Task: ${need}`,
        ATC_OUTPUT_SPEC,
    ].join("\n");
}

/** Pilot → ATC (same legacy name, but with a sturdier framework) */
export function atcReplyPrompt(userText: string, state?: {
    airport?: string; runway?: string; sid?: string; dep?: string;
    lastSquawk?: string; lastFreq?: string; lastQNH?: string;
    phase?: "clearance" | "taxi" | "lineup" | "departure" | "handoff" | "approach" | "landing";
    constraints?: string; // e.g. "TWY N closed", "no intersection deps on 25C"
}) {
    const ctx = [
        state?.airport ? `Airport ${state.airport}` : null,
        state?.runway ? `Active RWY ${state.runway}` : null,
        state?.dep ? `Destination ${state.dep}` : null,
        state?.sid ? `SID ${state.sid}` : null,
        state?.lastSquawk ? `Last squawk ${state.lastSquawk}` : null,
        state?.lastFreq ? `Next/last freq ${state.lastFreq}` : null,
        state?.lastQNH ? `QNH ${state.lastQNH}` : null,
        state?.constraints ? `Constraints: ${state.constraints}` : null,
    ].filter(Boolean).join(", ");

    const phase = state?.phase ?? "clearance";

    return [
        `You are an ICAO-compliant ATC controller. Reply concisely in standard phraseology.`,
        ctx ? `Context: ${ctx}` : null,
        `Pilot said: "${userText}"`,
        `Phase: ${phase}`,
        `Respond with ONE instruction following the rules.`,
        ATC_OUTPUT_SPEC,
    ].filter(Boolean).join("\n");
}

/* =========================
   Normalizer → TTS (unchanged)
   ========================= */

// Airline telephony (extensible)
export const CALLSIGN_MAP: Record<string,string> = { ...DEFAULT_AIRLINE_TELEPHONY };

// Public Normalizer
export function normalizeATC(
    text: string,
    opts?: { airlineMap?: Record<string,string>; }
) {
    return normalizeRadioPhrase(text, {
        airlineMap: opts?.airlineMap ?? CALLSIGN_MAP,
        expandAirports: true,
        expandCallsigns: true,
    });
}

// TTS Wrapper (mp3)
export async function speakATC(text: string, filePath = "atc.mp3") {
    const input = normalizeATC(text);
    const resp = await (normalize as any).audio.speech.create({
        model: TTS_MODEL,
        voice: "alloy",
        input,
        format: "mp3",
    });
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(filePath, buf);
    return { filePath, spoken: input };
}

/* =========================
   Examples
   =========================

— Seed (clearance):
const sys = atcSystemPrompt();
const usr = atcSeedPrompt({
  airport: "EDDF", aircraft: "A320", type: "IFR", stand: "V155",
  dep: "EHAM", sid: "MARUN 7F", runway: "25R", freq: "121.800"
});
// → The LLM might respond:
// "DLH359, cleared to EHAM via MARUN 7F, initial 5000 ft, squawk 4723. QNH 1013."

— Taxi:
const usrTaxi = atcSeedPrompt({
  airport: "EDDF", aircraft: "A320", type: "IFR", stand: "V155",
  dep: "EHAM", runway: "25R", phase: "taxi",
  notes: "TWY N closed between N2–N4"
});
// → "DLH359, taxi to RWY 25R via A3 A N2, hold short."

— Pilot → ATC:
const usrReply = atcReplyPrompt(
  "DLH359 ready for departure RWY 25R",
  { airport: "EDDF", runway: "25R", phase: "lineup", lastFreq: "121.800" }
);
// → "DLH359, line up and wait RWY 25R."

After receiving the LLM output, call `speakATC(llmText)` to trigger normalizer → TTS.
*/
