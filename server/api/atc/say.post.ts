// server/api/atc/say.post.ts - Simplified Version ohne FFmpeg
import { createError, readBody } from "h3";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { openai, TTS_MODEL, normalizeATC } from "../../utils/openai";

function outDir() {
    const base = process.env.ATC_OUT_DIR?.trim() || join(process.cwd(), "storage", "atc");
    return base;
}

async function ensureDir(p: string) {
    if (!existsSync(p)) await mkdir(p, { recursive: true });
}

// Einfache Radio-Effekt-Simulation über Gain-Reduktion
function simulateRadioQuality(level: number): { gain: number; description: string } {
    switch(level) {
        case 5: return { gain: 1.0, description: "crystal clear" };
        case 4: return { gain: 0.9, description: "very good" };
        case 3: return { gain: 0.8, description: "good" };
        case 2: return { gain: 0.7, description: "poor" };
        case 1: return { gain: 0.6, description: "very poor" };
        default: return { gain: 0.8, description: "standard" };
    }
}

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        text?: string;
        level?: number;
        voice?: string;
        speed?: number;
        moduleId?: string;
        lessonId?: string;
        tag?: string;
    }>(event);

    const raw = (body?.text || "").trim();
    if (!raw) throw createError({ statusCode: 400, statusMessage: "text required" });

    const level = Math.max(1, Math.min(5, Math.floor(body?.level ?? 4)));
    const voice = (body?.voice || "alloy") as string;
    const speed = Math.max(0.5, Math.min(2.0, body?.speed || 1.0));

    // ATC-Normalisierung für realistischen Funkspruch
    const normalized = normalizeATC(raw);
    if (!normalized) throw createError({ statusCode: 400, statusMessage: "normalized text empty" });

    // Radio-Qualität simulieren
    const radioQuality = simulateRadioQuality(level);

    // Eindeutige ID und Pfade
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const dateFolder = timestamp.slice(0, 10);

    const baseDir = join(outDir(), dateFolder);
    const fileWav = join(baseDir, `${id}.wav`);
    const fileJson = join(baseDir, `${id}.json`);

    try {
        // OpenAI TTS direkt als WAV (keine weitere Verarbeitung)
        const tts = await openai.audio.speech.create({
            model: TTS_MODEL,
            voice,
            format: "wav",
            input: normalized,
            speed
        });

        const audioBuffer = Buffer.from(await tts.arrayBuffer());

        // Speichern
        await ensureDir(baseDir);
        await writeFile(fileWav, audioBuffer);

        // Metadaten speichern
        const meta = {
            id,
            createdAt: timestamp,
            level,
            voice,
            speed,
            text: raw,
            normalized,
            radioQuality: radioQuality.description,
            tag: body?.tag || null,
            moduleId: body?.moduleId || null,
            lessonId: body?.lessonId || null,
            files: {
                wav: fileWav,
            },
            model: TTS_MODEL,
            format: "audio/wav",
            note: "Direct OpenAI TTS without post-processing"
        };

        await writeFile(fileJson, JSON.stringify(meta, null, 2), "utf-8");

        // Audio als Base64 für sofortige Wiedergabe
        const audioBase64 = audioBuffer.toString("base64");

        return {
            success: true,
            id,
            level,
            voice,
            speed,
            text: raw,
            normalized,
            radioQuality: radioQuality.description,
            audio: {
                mime: "audio/wav",
                base64: audioBase64,
                size: audioBuffer.length
            },
            stored: {
                audioPath: fileWav,
                jsonPath: fileJson,
                url: `/api/atc/audio/${dateFolder}/${id}.wav`
            },
            meta
        };

    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: `TTS generation failed: ${error}`
        });
    }
});
