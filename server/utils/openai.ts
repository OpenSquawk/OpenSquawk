// yarn add openai dotenv
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config();

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY_PROD!,
    project: process.env.OPENAI_PROJECT, // optional
});

export const LLM_MODEL = process.env.LLM_MODEL || "gpt-5-nano";
export const TTS_MODEL = process.env.TTS_MODEL || "tts-1";

/* =========================
   LLM PROMPTS (überarbeitet)
   =========================
   Ziel: LLM liefert kompakte, maschinenfreundliche ICAO-Zeile, die unser Normalizer→TTS perfekt erweitert.
   WICHTIG: Zahlen/Marker exakt im unten definierten Output-Format, keine ausgeschriebenen Wörter.
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

/** System-Prompt: legt Rolle/Regeln fest */
export function atcSystemPrompt(opts?: {
    regionHint?: "EUR" | "US" | "INTL"; // nur als Soft-Hinweis, default INTL
}) {
    const region = opts?.regionHint ?? "INTL";
    return [
        `You are an ICAO-compliant ATC controller for ${region}.`,
        `Adhere to standard phraseology, brevity, and safety-critical ordering.`,
        `Assume you have access to current airport config (active runway, SIDs), unless contradicted by user context.`,
        ATC_OUTPUT_SPEC,
    ].join("\n\n");
}

/** Seed-ATC ohne Pilot-Input (rückwärtskompatible Signatur, aber reicherer Prompt) */
export function atcSeedPrompt(s: {
    airport: string;           // e.g., "EDDF"
    aircraft: string;          // e.g., "A320"
    type: string;              // e.g., "IFR"
    stand: string;             // e.g., "V155"
    dep: string;               // destination ICAO, e.g., "EHAM"
    sid?: string;              // e.g., "MARUN 7F"
    squawk?: string;           // "4723"
    freq?: string;             // "121.800"
    runway?: string;           // "25R" (optional: falls bekannt)
    phase?: "clearance" | "taxi" | "lineup" | "departure" | "handoff" | "approach" | "landing";
    notes?: string;            // z.B. "TWY N closed between N2–N4"
}) {
    // Default-Phase: clearance
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

/** Pilot→ATC (rückwärtskompatibler Name, aber mit robustem Rahmen) */
export function atcReplyPrompt(userText: string, state?: {
    airport?: string; runway?: string; sid?: string; dep?: string;
    lastSquawk?: string; lastFreq?: string; lastQNH?: string;
    phase?: "clearance" | "taxi" | "lineup" | "departure" | "handoff" | "approach" | "landing";
    constraints?: string; // z.B. "TWY N closed", "no intersection deps on 25C"
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
   Normalizer → TTS (wie zuvor)
   ========================= */

const DIGIT: Record<string, string> = {
    "0": "zero", "1": "wun", "2": "too", "3": "tree", "4": "fower",
    "5": "fife", "6": "six", "7": "seven", "8": "eight", "9": "niner",
};

const NATO: Record<string, string> = {
    A:"Alfa",B:"Bravo",C:"Charlie",D:"Delta",E:"Echo",F:"Foxtrot",G:"Golf",H:"Hotel",
    I:"India",J:"Juliett",K:"Kilo",L:"Lima",M:"Mike",N:"November",O:"Oscar",P:"Papa",
    Q:"Quebec",R:"Romeo",S:"Sierra",T:"Tango",U:"Uniform",V:"Victor",W:"Whiskey",
    X:"X-ray",Y:"Yankee",Z:"Zulu"
};

// Airline-Telephony (erweiterbar)
export const CALLSIGN_MAP: Record<string,string> = {
    DLH: "Lufthansa",
    BAW: "Speedbird",
    AFR: "Air France",
    KLM: "KLM",
    AAL: "American",
    UAL: "United",
    DAL: "Delta",
    RYR: "Ryanair",
    EZY: "Easy",
};

const spellDigits = (s: string) =>
    s.split("").map(ch => DIGIT[ch] ?? ch).join(" ");

const toNato = (s: string) =>
    s.toUpperCase().split("").map(ch => NATO[ch] ?? ch).join("-");

const runwaySpeak = (rw: string) => {
    const m = rw.match(/^(\d{2})([LCR])?$/i);
    if (!m) return rw;
    const num = spellDigits(m[1]);
    const side = m[2]?.toUpperCase() === "L" ? "left"
        : m[2]?.toUpperCase() === "C" ? "center"
            : m[2]?.toUpperCase() === "R" ? "right" : "";
    return `runway ${num}${side ? " " + side : ""}`;
};

const headingSpeak = (hdg: string) => `heading ${spellDigits(hdg.padStart(3, "0"))}`;
const squawkSpeak = (code: string) => `squawk ${spellDigits(code)}`;

const freqSpeak = (f: string) => {
    const [a,b] = f.split(".");
    const left = spellDigits(a);
    const right = b ? spellDigits(b) : "";
    return `${left}${b ? " decimal " + right : ""}`;
};

const altitudeSpeak = (ft: number) => {
    if (!Number.isFinite(ft)) return `${ft} feet`;
    const thousands = Math.floor(ft/1000);
    const hundreds = Math.round((ft % 1000)/100)*100;
    const parts: string[] = [];
    if (thousands) parts.push(`${spellDigits(String(thousands))} thousand`);
    if (hundreds) {
        const h = hundreds === 900 ? "nine hundred"
            : hundreds === 800 ? "eight hundred"
                : hundreds === 700 ? "seven hundred"
                    : hundreds === 600 ? "six hundred"
                        : hundreds === 500 ? "five hundred"
                            : hundreds === 400 ? "fower hundred"
                                : hundreds === 300 ? "tree hundred"
                                    : hundreds === 200 ? "too hundred"
                                        : hundreds === 100 ? "wun hundred"
                                            : spellDigits(String(hundreds));
        parts.push(h);
    }
    return `${parts.join(" ")} feet`.trim();
};

const flightLevelSpeak = (fl: string) =>
    `flight level ${spellDigits(fl.replace(/^0+/, ""))}`;

const qnhSpeak = (q: string) => `QNH ${spellDigits(q)}`;

const callsignSpeak = (raw: string, map: Record<string,string>) => {
    const up = raw.toUpperCase();
    const m = up.match(/^([A-Z]{2,3})(\d{1,4}[A-Z]?)$/);
    if (!m) return raw;
    const telephony = map[m[1]] ?? toNato(m[1]).replace(/-/g," ");
    const suffix = spellDigits(m[2].replace(/[A-Z]$/, (l) => " " + (NATO[l] ?? l)));
    return `${telephony} ${suffix}`;
};

const icaoAirportSpeak = (code: string) =>
    /^[A-Z]{4}$/.test(code) ? toNato(code) : code;

// Public Normalizer
export function normalizeATC(
    text: string,
    opts?: { airlineMap?: Record<string,string>; }
) {
    let out = text;

    out = out.replace(/\b(\d{3})\.(\d{3})\b/g, (_,a,b)=> `${freqSpeak(`${a}.${b}`)}`);
    out = out.replace(/\b(?:HDG|heading)\s*(\d{2,3})\b/gi, (_,h)=> headingSpeak(h));
    out = out.replace(/\b(?:RWY|runway)\s*(\d{2}[LCR]?)\b/gi, (_,rw)=> runwaySpeak(rw));
    out = out.replace(/\b(?:squawk|code)\s*(\d{4})\b/gi, (_,c)=> squawkSpeak(c));
    out = out.replace(/\bFL\s*(\d{2,3})\b/gi, (_,fl)=> flightLevelSpeak(fl));
    out = out.replace(/\b(\d{3,5})\s*(?:ft|feet)\b/gi, (_,ft)=> altitudeSpeak(Number(ft)));
    out = out.replace(/\bQNH\s*(\d{3,4})\b/gi, (_,q)=> qnhSpeak(q));
    out = out.replace(/\b([A-Z]{4})\b/g, (_,code)=> icaoAirportSpeak(code));
    out = out.replace(/\b([A-Z]{2,3}\d{1,4}[A-Z]?)\b/g, (m)=> callsignSpeak(m, opts?.airlineMap ?? CALLSIGN_MAP));

    return out.replace(/\s+/g," ").trim();
}

// TTS Wrapper (mp3)
export async function speakATC(text: string, filePath = "atc.mp3") {
    const input = normalizeATC(text);
    const resp = await (openai as any).audio.speech.create({
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
   Beispiele
   =========================

— Seed (Clearance):
const sys = atcSystemPrompt();
const usr = atcSeedPrompt({
  airport: "EDDF", aircraft: "A320", type: "IFR", stand: "V155",
  dep: "EHAM", sid: "MARUN 7F", runway: "25R", freq: "121.800"
});
// → LLM antwortet z.B.:
// "DLH359, cleared to EHAM via MARUN 7F, initial 5000 ft, squawk 4723. QNH 1013."

— Taxi:
const usrTaxi = atcSeedPrompt({
  airport: "EDDF", aircraft: "A320", type: "IFR", stand: "V155",
  dep: "EHAM", runway: "25R", phase: "taxi",
  notes: "TWY N closed between N2–N4"
});
// → "DLH359, taxi to RWY 25R via A3 A N2, hold short."

— Pilot→ATC:
const usrReply = atcReplyPrompt(
  "DLH359 ready for departure RWY 25R",
  { airport: "EDDF", runway: "25R", phase: "lineup", lastFreq: "121.800" }
);
// → "DLH359, line up and wait RWY 25R."

Nach dem LLM-Output: `speakATC(llmText)` ruft Normalizer→TTS.
*/
