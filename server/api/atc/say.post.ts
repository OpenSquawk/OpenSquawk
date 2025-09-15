import { createError, readBody } from "h3";
import { writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { openai, TTS_MODEL, normalizeATC } from "../../utils/openai";

// --- Radio-Filter aus deinem bestehenden Endpoint wiederverwenden ---
function buildRadioFilter(level: number) {
    const L = Math.max(1, Math.min(5, Math.floor(level || 4)));
    const dropout = (period: number, dur: number) =>
        `volume=enable='lt(mod(t\\,${period})\\,${dur})':volume=0`;
    const band = (hp: number, lp: number, gain = 6) =>
        `highpass=f=${hp},lowpass=f=${lp},compand=attacks=0.02:decays=0.25:points=-80/-900|-70/-20|0/-10|20/-8:gain=${gain}`;
    const tail = `aecho=0.6:0.7:8:0.08,acompressor=threshold=0.6:ratio=6:attack=20:release=200`;

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
        const chain: string[] = [];
        if (period && dur) chain.push(`[${inLabel}]${dropout(period, dur)}[drop]`);
        const src = period && dur ? "drop" : inLabel;
        chain.push(`[${src}]${tail}[out]`);
        return chain;
    };

    if (L === 5) {
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

async function sh(cmd: string, args: string[]) {
    return new Promise<void>((res, rej) =>
        execFile(cmd, args, (err, _o, stderr) => (err ? rej(new Error(stderr || String(err))) : res()))
    );
}

async function applyRadioEffect(input: string, outputWav: string, level = 4) {
    const filter = buildRadioFilter(level);
    await sh("ffmpeg", ["-y", "-i", input, "-filter_complex", filter, "-map", "[out]", "-ar", "16000", "-ac", "1", outputWav]);
}

function outDir() {
    // Persistenz: env > ./storage/atc > tmp
    const base =
        process.env.ATC_OUT_DIR?.trim() ||
        join(process.cwd(), "storage", "atc");
    return base;
}

async function ensureDir(p: string) {
    if (!existsSync(p)) await mkdir(p, { recursive: true });
}

export default defineEventHandler(async (event) => {
    // POST { text: string; level?: 1..5; voice?: string; tag?: string }
    const body = await readBody<{
        text?: string;
        level?: number;
        voice?: string;
        tag?: string;
    }>(event);

    const raw = (body?.text || "").trim();
    if (!raw) throw createError({ statusCode: 400, statusMessage: "text required" });

    const level = Math.max(1, Math.min(5, Math.floor(body?.level ?? 4)));
    const voice = (body?.voice || "alloy") as string;

    // Wortstamm/Normalisierung: ICAO-Formatierung, Zahl-/Buchstabierlogik etc.
    const normalized = normalizeATC(raw);
    if (!normalized) throw createError({ statusCode: 400, statusMessage: "normalized text empty" });

    // 1) TTS (clean) -> tmp WAV
    const tmpClean = join(tmpdir(), `tts-${randomUUID()}.wav`);
    const tmpRadio = join(tmpdir(), `radio-${randomUUID()}.wav`);

    const tts = await openai.audio.speech.create({
        model: TTS_MODEL,
        voice,
        format: "wav",
        input: normalized,
    });
    await writeFile(tmpClean, Buffer.from(await tts.arrayBuffer()));

    // 2) Radio-Effekt (WAV, 16 kHz mono)
    await applyRadioEffect(tmpClean, tmpRadio, level);

    // 3) Platzsparend transkodieren: OGG/Opus (VoIP-Profil), ~12 kbps @16 kHz mono
    const id = randomUUID();
    const baseDir = join(outDir(), new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const fileOgg = join(baseDir, `${id}.ogg`);
    const fileJson = join(baseDir, `${id}.json`);

    await ensureDir(baseDir);
    await sh("ffmpeg", [
        "-y",
        "-i", tmpRadio,
        "-ac", "1",
        "-ar", "16000",
        "-c:a", "libopus",
        "-b:a", "12k",
        "-application", "voip",
        fileOgg,
    ]);

    // 4) JSON-Metadaten neben die Audiodatei schreiben
    const meta = {
        id,
        createdAt: new Date().toISOString(),
        level,
        voice,
        text: raw,
        normalized,
        tag: body?.tag || null,
        files: {
            ogg: fileOgg,
        },
        model: TTS_MODEL,
        format: "audio/ogg; codecs=opus",
    };
    await writeFile(fileJson, JSON.stringify(meta, null, 2), "utf-8");

    // 5) Response (Audio als Base64 + Meta). Optional: nur Pfad zurückgeben, wenn du sparen willst.
    const oggB64 = (await readFile(fileOgg)).toString("base64");

    // Cleanup tmp
    rm(tmpClean).catch(() => {});
    rm(tmpRadio).catch(() => {});

    return {
        ok: true,
        id,
        level,
        voice,
        text: raw,
        normalized,
        audio: {
            mime: "audio/ogg",
            base64: oggB64,
        },
        stored: {
            audioPath: fileOgg,
            jsonPath: fileJson,
        },
    };
});
