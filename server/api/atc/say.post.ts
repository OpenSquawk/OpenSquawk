// server/api/atc/say.post.ts
import { createError, readBody } from "h3";
import { writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { openai, TTS_MODEL, normalizeATC } from "../../utils/openai";

// Enhanced Radio Filter für besseren ATC-Sound
function buildEnhancedRadioFilter(level: number) {
    const L = Math.max(1, Math.min(5, Math.floor(level || 4)));

    // Basis Audio-Charakteristika für ATC Radio
    const baseProcessor = (hp: number, lp: number, gain = 8) => [
        `highpass=f=${hp}`,
        `lowpass=f=${lp}`,
        `compand=attacks=0.01:decays=0.15:points=-80/-900|-60/-25|-40/-15|-20/-10|0/-5:gain=${gain}`,
        `acompressor=threshold=0.4:ratio=8:attack=5:release=100`,
        `volume=1.1`
    ].join(',');

    // Authentische Radio-Artefakte
    const radioArtefacts = (crushLevel: number, noiseLevel: number, staticLevel: number) => [
        // Bit crushing für digitale Artefakte
        `acrusher=bits=${crushLevel}:mix=0.3`,
        // Bandpass + Resonanz für Funkcharakter
        `bandpass=frequency=1850:width_type=h:width=1200`,
        `equalizer=frequency=2300:width_type=h:width=800:gain=3`,
        // Leichtes Saturation für Röhren-Sound
        `asoftclip=param=2`,
        // Radio-typisches Rauschen
        `anoisesrc=color=brown:amplitude=${noiseLevel}:duration=10[noise]`,
        `[0][noise]amix=inputs=2:weights=1 ${staticLevel}:duration=shortest`
    ];

    // Dropout-Simulation (Funkaussetzer)
    const dropout = (frequency: number, duration: number) =>
        `volume=enable='lt(mod(t\\,${frequency})\\,${duration})':volume=0.1`;

    // Delay/Echo für Raumklang
    const spatialEffect = `aecho=0.4:0.5:15:0.3,reverb=roomsize=0.3:damping=0.4`;

    // PTT Click Simulation (leider schwer ohne Audio-Sample)
    const pttSimulation = `afade=t=in:d=0.05,afade=t=out:d=0.08`;

    if (L === 5) {
        // Kristallklar, moderne digitale Funkanlage
        return [
            `[0:a]${baseProcessor(280, 3500, 7)}[clean]`,
            `anoisesrc=color=white:amplitude=0.01[ns]`,
            `[clean][ns]amix=inputs=2:weights=1 0.15:duration=shortest[mixed]`,
            `[mixed]${spatialEffect},${pttSimulation}[out]`
        ].join(';');
    }

    if (L === 4) {
        // Gute Qualität, leichte Kompression
        return [
            `[0:a]${baseProcessor(300, 3300, 7)}[clean]`,
            ...radioArtefacts(14, 0.02, 0.2),
            `${spatialEffect},${pttSimulation}[out]`
        ].join(';');
    }

    if (L === 3) {
        // Standard ATC Qualität mit typischen Artefakten
        return [
            `[0:a]${baseProcessor(320, 3100, 6)}[clean]`,
            ...radioArtefacts(12, 0.04, 0.35),
            `${dropout(8, 0.08)}`,
            `${spatialEffect},${pttSimulation}[out]`
        ].join(';');
    }

    if (L === 2) {
        // Schlechtere Verbindung, mehr Störungen
        return [
            `[0:a]${baseProcessor(350, 2900, 6)}[clean]`,
            ...radioArtefacts(10, 0.07, 0.5),
            `${dropout(5, 0.15)}`,
            `${spatialEffect},${pttSimulation}[out]`
        ].join(';');
    }

    // L === 1: Sehr schlechte Verbindung, starke Störungen
    return [
        `[0:a]${baseProcessor(400, 2600, 5)}[clean]`,
        ...radioArtefacts(8, 0.12, 0.7),
        `${dropout(3, 0.25)}`,
        `tremolo=f=0.1:d=0.3`,  // Schwankungen
        `${spatialEffect},${pttSimulation}[out]`
    ].join(';');
}

async function sh(cmd: string, args: string[]) {
    return new Promise<void>((res, rej) =>
        execFile(cmd, args, (err, _o, stderr) => (err ? rej(new Error(stderr || String(err))) : res()))
    );
}

async function applyEnhancedRadioEffect(input: string, outputWav: string, level = 4) {
    const filter = buildEnhancedRadioFilter(level);
    await sh("ffmpeg", [
        "-y", "-i", input,
        "-filter_complex", filter,
        "-map", "[out]",
        "-ar", "22050",  // Höhere Sample Rate für bessere Qualität
        "-ac", "1",      // Mono
        "-q:a", "3",     // Hohe Qualität
        outputWav
    ]);
}

function outDir() {
    const base = process.env.ATC_OUT_DIR?.trim() || join(process.cwd(), "storage", "atc");
    return base;
}

async function ensureDir(p: string) {
    if (!existsSync(p)) await mkdir(p, { recursive: true });
}

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        text?: string;
        level?: number;
        voice?: string;
        tag?: string;
        speed?: number;
        moduleId?: string;
        lessonId?: string;
    }>(event);

    const raw = (body?.text || "").trim();
    if (!raw) throw createError({ statusCode: 400, statusMessage: "text required" });

    const level = Math.max(1, Math.min(5, Math.floor(body?.level ?? 4)));
    const voice = (body?.voice || "alloy") as string;
    const speed = Math.max(0.5, Math.min(2.0, body?.speed || 1.0));

    // ATC-Normalisierung für realistischen Funkspruch
    const normalized = normalizeATC(raw);
    if (!normalized) throw createError({ statusCode: 400, statusMessage: "normalized text empty" });

    // Eindeutige ID und Pfade
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const dateFolder = timestamp.slice(0, 10); // YYYY-MM-DD

    const baseDir = join(outDir(), dateFolder);
    const fileOgg = join(baseDir, `${id}.ogg`);
    const fileJson = join(baseDir, `${id}.json`);

    // Temp-Dateien
    const tmpClean = join(tmpdir(), `tts-${id}.wav`);
    const tmpRadio = join(tmpdir(), `radio-${id}.wav`);

    try {
        // 1) OpenAI TTS - Clean Audio
        const tts = await openai.audio.speech.create({
            model: TTS_MODEL,
            voice,
            format: "wav",
            input: normalized,
            speed
        });

        await writeFile(tmpClean, Buffer.from(await tts.arrayBuffer()));

        // 2) Enhanced Radio-Effekt anwenden
        await applyEnhancedRadioEffect(tmpClean, tmpRadio, level);

        // 3) Zu hochwertigem OGG/Opus komprimieren
        await ensureDir(baseDir);
        await sh("ffmpeg", [
            "-y",
            "-i", tmpRadio,
            "-ac", "1",
            "-ar", "22050",
            "-c:a", "libopus",
            "-b:a", "24k",          // Höhere Bitrate für bessere Qualität
            "-application", "voip",
            "-frame_duration", "20",
            fileOgg,
        ]);

        // 4) Metadaten speichern
        const meta = {
            id,
            createdAt: timestamp,
            level,
            voice,
            speed,
            text: raw,
            normalized,
            tag: body?.tag || null,
            moduleId: body?.moduleId || null,
            lessonId: body?.lessonId || null,
            files: {
                ogg: fileOgg,
            },
            model: TTS_MODEL,
            format: "audio/ogg; codecs=opus",
            sampleRate: 22050,
            channels: 1,
        };

        await writeFile(fileJson, JSON.stringify(meta, null, 2), "utf-8");

        // 5) Audio als Base64 für sofortige Wiedergabe
        const oggBuffer = await readFile(fileOgg);
        const audioBase64 = oggBuffer.toString("base64");

        // 6) Cleanup
        await rm(tmpClean).catch(() => {});
        await rm(tmpRadio).catch(() => {});

        return {
            success: true,
            id,
            level,
            voice,
            speed,
            text: raw,
            normalized,
            audio: {
                mime: "audio/ogg; codecs=opus",
                base64: audioBase64,
                size: oggBuffer.length
            },
            stored: {
                audioPath: fileOgg,
                jsonPath: fileJson,
                url: `/api/atc/audio/${dateFolder}/${id}.ogg`  // Zum späteren Abrufen
            },
            meta
        };

    } catch (error) {
        // Cleanup bei Fehler
        await rm(tmpClean).catch(() => {});
        await rm(tmpRadio).catch(() => {});

        throw createError({
            statusCode: 500,
            statusMessage: `TTS generation failed: ${error}`
        });
    }
});
