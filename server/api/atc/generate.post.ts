import { createError, getQuery } from "h3";
import {openai, LLM_MODEL, TTS_MODEL, atcSeedPrompt, normalizeATC} from "../../utils/openai";
import { writeFile, readFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";

// ffmpeg-Filter je Qualitätsstufe (1..5) -> final label [out]
function buildRadioFilter(level: number) {
    const L = Math.max(1, Math.min(5, Math.floor(level || 4)));
    const dropout = (period: number, dur: number) =>
        `volume=enable='lt(mod(t\\,${period})\\,${dur})':volume=0`;
    const band = (hp: number, lp: number, gain = 6) =>
        `highpass=f=${hp},lowpass=f=${lp},compand=attacks=0.02:decays=0.25:points=-80/-900|-70/-20|0/-10|20/-8:gain=${gain}`;
    const tail = `aecho=0.6:0.7:8:0.08,acompressor=threshold=0.6:ratio=6:attack=20:release=200`;

    // Hilfsbausteine als vollständige Kettenglieder mit Semikolons/Labels
    const mkCrushMix = (bits: number, mix = 0.25, inLabel = "pre", outLabel = "mix1") => [
        `[${inLabel}]asplit=2[clean][toCrush]`,
        `[toCrush]acrusher=bits=${bits}:mix=1[crushed]`,
        `[clean][crushed]amix=inputs=2:weights=1 ${mix}:duration=shortest[${outLabel}]`,
    ];

    const mkNoiseMix = (amp: number, inLabel = "mix1", outLabel = "mix2") => [
        `anoisesrc=color=white:amplitude=${amp}[ns]`,
        `[${inLabel}][ns]amix=inputs=2:weights=1 0.25:duration=shortest[${outLabel}]`,
    ];

    const mkDropTail = (inLabel: string, period: number | null, dur: number | null) => {
        const chain = [];
        if (period && dur) chain.push(`[${inLabel}]${dropout(period, dur)}[drop]`);
        const src = period && dur ? "drop" : inLabel;
        chain.push(`[${src}]${tail}[out]`);
        return chain;
    };

    if (L === 5) {
        // Dein Original, nur gelabelt bis [out]
        return [
            `[0:a]${band(300,3400)},volume=1.2[a]`,
            `anoisesrc=color=white:amplitude=0.02[ns]`,
            `[a][ns]amix=inputs=2:weights=1 0.25:duration=shortest[mix]`,
            `[mix]${tail}[out]`,
        ].join(";");
    }

    if (L === 4) {
        return [
            `[0:a]${band(320,3300)},volume=1.15[pre]`,
            ...mkNoiseMix(0.03, "pre", "mix"),
            `[mix]${tail}[out]`,
        ].join(";");
    }

    if (L === 3) {
        return [
            `[0:a]${band(350,3200)},volume=1.1[pre]`,
            ...mkCrushMix(12, 0.22, "pre", "mix1"),
            ...mkNoiseMix(0.05, "mix1", "mix2"),
            ...mkDropTail("mix2", 6, 0.06),
        ].join(";");
    }

    if (L === 2) {
        return [
            `[0:a]${band(400,3000)},volume=1.05[pre]`,
            ...mkCrushMix(10, 0.32, "pre", "mix1"),
            // mehr Noise-Gewichtung beim zweiten Mix
            `anoisesrc=color=white:amplitude=0.08[ns]`,
            `[mix1][ns]amix=inputs=2:weights=1 0.6:duration=shortest[mix2]`,
            ...mkDropTail("mix2", 4.5, 0.12),
        ].join(";");
    }

    // L === 1
    return [
        `[0:a]${band(500,2600,5)},volume=1.0[pre]`,
        ...mkCrushMix(8, 0.45, "pre", "mix1"),
        `anoisesrc=color=white:amplitude=0.12[ns]`,
        `[mix1][ns]amix=inputs=2:weights=1 0.8:duration=shortest[mix2]`,
        ...mkDropTail("mix2", 3.5, 0.2),
    ].join(";");
}

// Funk-Effekt mit ffmpeg (fix: -map [out], kein "[post]?0:a")
async function applyRadioEffect(input: string, output: string, level = 4) {
    const filter = buildRadioFilter(level);
    await new Promise<void>((res, rej) =>
        execFile(
            "ffmpeg",
            ["-y", "-i", input, "-filter_complex", filter, "-map", "[out]", "-ar", "16000", output],
            (err, _o, stderr) => (err ? rej(new Error(stderr || String(err))) : res())
        )
    );
}

export default defineEventHandler(async (event) => {
    // level aus query (?level=1..5), default 4
    const { level } = getQuery(event);
    const lvl = Math.max(1, Math.min(5, parseInt(String(level ?? "4"), 10) || 4));

    // 1) ATC-Text erzeugen (ohne Pilot-Input)
    const scenario = {
        airport: "EDDF",
        aircraft: "A320",
        type: "IFR",
        stand: "V155",
        dep: "EHAM",
        sid: "MARUN 7F",
        squawk: "4723",
        freq: "121.800",
        runway: "25R",
        phase: "taxi",
        notes: "Taxiway N closed between N2–N4",
    };

    // const resp = await openai.responses.create({
    //     model: LLM_MODEL,
    //     input: atcSeedPrompt(scenario),
    // });
    // const atcText = (resp.output_text || "").trim();
    const atcText = "DLH39A taxi to RWY 25R via V A, hold short of RWY 25R.";
    if (!atcText) throw createError({ statusCode: 500, statusMessage: "LLM empty" });

    const normalized = normalizeATC(atcText);
    if (!normalized) throw createError({ statusCode: 500, statusMessage: "ATC text empty" });
    console.log("ATC Text (normalized):", normalized);

    // return { atcText: normalized, level: lvl };

    // 2) TTS (clean)
    const cleanPath = join(tmpdir(), `tts-${randomUUID()}.wav`);
    const radioPath = join(tmpdir(), `radio-${randomUUID()}.wav`);

    const tts = await openai.audio.speech.create({
        model: TTS_MODEL,
        voice: "alloy",
        format: "wav",
        input: normalized,
    });
    await writeFile(cleanPath, Buffer.from(await tts.arrayBuffer()));

    // 3) Funk-Effekt (mit stufe)
    await applyRadioEffect(cleanPath, radioPath, lvl);

    // 4) Payload zurück (Debug: Text + beide Audios)
    const cleanB64 = (await readFile(cleanPath)).toString("base64");
    const radioB64 = (await readFile(radioPath)).toString("base64");
    rm(cleanPath).catch(() => {});
    rm(radioPath).catch(() => {});

    return {
        atcText,
        level: lvl,
        audio: {
            clean: { mime: "audio/wav", base64: cleanB64 },
            radio: { mime: "audio/wav", base64: radioB64 },
        },
    };
});
