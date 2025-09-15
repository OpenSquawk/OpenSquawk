// server/api/atc/say.post.ts
import {createError, readBody} from "h3";
import {writeFile, mkdir} from "node:fs/promises";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {randomUUID} from "node:crypto";
import {openai, TTS_MODEL, normalizeATC} from "../../utils/openai";
import {request} from "node:http";

// dotenv config
import {config} from "dotenv";

config();


function outDir() {
    return process.env.ATC_OUT_DIR?.trim() || join(process.cwd(), "storage", "atc");
}

async function ensureDir(p: string) {
    if (!existsSync(p)) await mkdir(p, {recursive: true});
}

function simulateRadioQuality(level: number) {
    switch (level) {
        case 5:
            return {gain: 1.0, description: "crystal clear"};
        case 4:
            return {gain: 0.9, description: "very good"};
        case 3:
            return {gain: 0.8, description: "good"};
        case 2:
            return {gain: 0.7, description: "poor"};
        case 1:
            return {gain: 0.6, description: "very poor"};
        default:
            return {gain: 0.8, description: "standard"};
    }
}

// ---- Piper HTTP helper ----
async function piperTTS(text: string, voice: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const req = request(
            {
                hostname: "localhost",
                port: 5001,
                path: "/",
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            },
            (res) => {
                const data: Buffer[] = [];
                res.on("data", (chunk) => data.push(chunk));
                res.on("end", () => resolve(Buffer.concat(data)));
            }
        );
        req.on("error", reject);
        req.write(JSON.stringify({text, voice}));
        req.end();
    });
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
    if (!raw) throw createError({statusCode: 400, statusMessage: "text required"});

    const level = Math.max(1, Math.min(5, Math.floor(body?.level ?? 4)));
    const voice = (body?.voice || "alloy").trim();
    const speed = Math.max(0.5, Math.min(2.0, body?.speed || 1.0));

    const normalized = normalizeATC(raw);
    if (!normalized) throw createError({statusCode: 400, statusMessage: "normalized text empty"});

    const radioQuality = simulateRadioQuality(level);
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const dateFolder = timestamp.slice(0, 10);
    const baseDir = join(outDir(), dateFolder);
    const fileWav = join(baseDir, `${id}.wav`);
    const fileJson = join(baseDir, `${id}.json`);

    try {
        let audioBuffer: Buffer;

        if (process.env.USE_PIPER?.toLowerCase() === "true") {
            // --- Lokaler Piper-Server ---
            audioBuffer = await piperTTS(normalized, voice);
        } else {
            // --- OpenAI Fallback ---
            const tts = await openai.audio.speech.create({
                model: TTS_MODEL,
                voice,
                format: "wav",
                input: normalized,
                speed
            });
            audioBuffer = Buffer.from(await tts.arrayBuffer());
        }

        await ensureDir(baseDir);
        await writeFile(fileWav, audioBuffer);

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
            files: {wav: fileWav},
            model: process.env.USE_PIPER?.toLowerCase() === "true" ? "piper-local" : TTS_MODEL,
            format: "audio/wav"
        };

        await writeFile(fileJson, JSON.stringify(meta, null, 2), "utf-8");

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
                base64: audioBuffer.toString("base64"),
                size: audioBuffer.length
            },
            stored: {
                audioPath: fileWav,
                jsonPath: fileJson,
                url: `/api/atc/audio/${dateFolder}/${id}.wav`
            },
            meta
        };
    } catch (err) {
        throw createError({
            statusCode: 500,
            statusMessage: `TTS generation failed: ${err}`
        });
    }
});
