// server/api/atc/say.post.ts
import {createError, readBody} from "h3";
import {writeFile, mkdir, readFile} from "node:fs/promises";
import {join} from "node:path";
import {createHash, randomUUID} from "node:crypto";
import {normalize, TTS_MODEL, normalizeATC} from "../../utils/normalize";
import { getServerRuntimeConfig } from "../../utils/runtimeConfig";
import {request} from "node:http";
import { TransmissionLog } from "../../models/TransmissionLog";


function outDir() {
    return process.env.ATC_OUT_DIR?.trim() || join(process.cwd(), "storage", "atc");
}

async function ensureDir(p: string) {
    await mkdir(p, { recursive: true });
}

function flightLabCacheDir() {
    return process.env.FLIGHTLAB_TTS_CACHE_DIR?.trim() || join(process.cwd(), ".cache", "flightlab-tts");
}

function isFlightLabTag(tag?: string) {
    return (tag || "").trim().toLowerCase() === "flightlab";
}

type TTSProvider = "openai" | "speaches" | "piper";

function resolveTtsProvider(useSpeaches: boolean, usePiper: boolean): TTSProvider {
    if (useSpeaches) return "speaches";
    if (usePiper) return "piper";
    return "openai";
}

function buildFlightLabCacheKey(input: {
    normalized: string;
    level: number;
    voice: string;
    speed: number;
    format: AudioFmt;
    provider: TTSProvider;
    model: string;
}) {
    return createHash("sha256")
        .update(JSON.stringify(input))
        .digest("hex");
}

function defaultMimeForProvider(provider: TTSProvider, format: AudioFmt) {
    if (provider === "openai" || provider === "piper") {
        return "audio/wav";
    }
    return fmtToMime(format);
}

function simulateRadioQuality(level: number) {
    switch (level) {
        case 5: return { gain: 1.0, description: "crystal clear" };
        case 4: return { gain: 0.9, description: "very good" };
        case 3: return { gain: 0.8, description: "good" };
        case 2: return { gain: 0.7, description: "poor" };
        case 1: return { gain: 0.6, description: "very poor" };
        default: return { gain: 0.8, description: "standard" };
    }
}

// ---- Format Helpers ----
type AudioFmt = "mp3" | "flac" | "wav" | "pcm";
function pickDefaultFormat(useSpeaches: boolean): AudioFmt {
    // kleinste Bitrate bevorzugen, wenn Speaches genutzt wird
    return useSpeaches ? "mp3" : "wav";
}
function fmtToMime(fmt: AudioFmt): string {
    switch (fmt) {
        case "mp3": return "audio/mpeg";
        case "flac": return "audio/flac";
        case "wav": return "audio/wav";
        case "pcm": return "audio/L16"; // raw PCM (fallback)
        default: return "application/octet-stream";
    }
}
function fmtToExt(fmt: AudioFmt): string {
    switch (fmt) {
        case "mp3": return "mp3";
        case "flac": return "flac";
        case "wav": return "wav";
        case "pcm": return "pcm";
        default: return "bin";
    }
}

// ---- Piper HTTP helper ----
async function piperTTS(text: string, voice: string, port: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const req = request(
            {
                hostname: "localhost",
                port,
                path: "/",
                method: "POST",
                headers: { "Content-Type": "application/json" }
            },
            (res) => {
                const data: Buffer[] = [];
                res.on("data", (chunk) => data.push(chunk));
                res.on("end", () => resolve(Buffer.concat(data)));
            }
        );
        req.on("error", reject);
        req.write(JSON.stringify({ text, voice }));
        req.end();
    });
}

// ---- Speaches HTTP helper ----
// Env:
// USE_SPEACHES=true
// SPEACHES_BASE_URL="https://..."
// SPEECH_MODEL_ID="speaches-ai/piper-en_US-ryan-low"
// VOICE_ID="en_US-ryan-low"
async function speachesTTS(
    input: string,
    voice: string,
    model: string,
    response_format: AudioFmt,
    baseUrl: string,
    speed: number = 1.0
): Promise<Buffer> {
    const url = `${baseUrl.replace(/\/+$/, "")}/v1/audio/speech`;
    const body = {
        input,
        model,
        voice,
        // API erwartet "response_format": "mp3" | "flac" | "wav" | "pcm"
        response_format,
        speed
    };
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Speaches API ${res.status}: ${text || res.statusText}`);
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
}

export default defineEventHandler(async (event) => {
    const runtimeConfig = getServerRuntimeConfig();
    const body = await readBody<{
        text?: string;
        level?: number;
        voice?: string;
        speed?: number;
        moduleId?: string;
        lessonId?: string;
        tag?: string;
        format?: AudioFmt | "smallest";
        sessionId?: string;
    }>(event);

    // const user = await requireUserSession(event);

    const rawSessionId = typeof body?.sessionId === "string"
        ? body.sessionId.trim()
        : "";
    const sessionId = rawSessionId.length ? rawSessionId : undefined;

    const raw = (body?.text || "").trim();
    if (!raw) throw createError({ statusCode: 400, statusMessage: "text required" });

    const level = Math.max(1, Math.min(5, Math.floor(body?.level ?? 4)));
    const voice = (body?.voice || runtimeConfig.voiceId).trim();
    const speed = Math.max(0.5, Math.min(2.0, body?.speed || 1.0));

    const normalized = normalizeATC(raw);
    if (!normalized) throw createError({ statusCode: 400, statusMessage: "normalized text empty" });

    // Routing
    const useSpeaches = runtimeConfig.useSpeaches;
    const usePiper = !useSpeaches && runtimeConfig.usePiper;
    const provider = resolveTtsProvider(useSpeaches, usePiper);
    const providerModel = provider === "speaches"
        ? (runtimeConfig.speechModelId || "speaches-ai/piper-en_US-ryan-low")
        : provider === "piper"
            ? "piper-local"
            : TTS_MODEL;

    // Format
    const requestedFmt = (body?.format === "smallest" ? "mp3" : body?.format) as AudioFmt | undefined;
    const fmt: AudioFmt = requestedFmt || pickDefaultFormat(useSpeaches);
    const ext = fmtToExt(fmt);
    const outputExt = (provider === "openai" || provider === "piper") ? "wav" : ext;
    const flightlabRequest = isFlightLabTag(body?.tag);
    const flightlabCacheKey = flightlabRequest
        ? buildFlightLabCacheKey({
            normalized,
            level,
            voice,
            speed,
            format: fmt,
            provider,
            model: providerModel
        })
        : null;
    const flightlabCacheBaseDir = flightlabRequest ? flightLabCacheDir() : null;
    const flightlabCachedAudioPath = (flightlabCacheBaseDir && flightlabCacheKey)
        ? join(flightlabCacheBaseDir, `${flightlabCacheKey}.${outputExt}`)
        : null;
    const flightlabCachedMetaPath = (flightlabCacheBaseDir && flightlabCacheKey)
        ? join(flightlabCacheBaseDir, `${flightlabCacheKey}.json`)
        : null;

    const radioQuality = simulateRadioQuality(level);
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const dateFolder = timestamp.slice(0, 10);
    const baseDir = join(outDir(), dateFolder);
    const fileOut = join(baseDir, `${id}.${outputExt}`);
    const fileJson = join(baseDir, `${id}.json`);

    try {
        let audioBuffer: Buffer | null = null;
        let modelUsed = providerModel;
        let actualMime = defaultMimeForProvider(provider, fmt);
        let ttsProvider: TTSProvider = provider;
        let cacheHit = false;

        if (flightlabCachedAudioPath) {
            try {
                audioBuffer = await readFile(flightlabCachedAudioPath);
                cacheHit = true;
            } catch {
                // Cache miss: generate TTS below.
            }
        }

        if (!audioBuffer && useSpeaches) {
            // Speaches (prefer compact: MP3, otherwise FLAC/WAV/PCM)
            const baseUrl = runtimeConfig.speachesBaseUrl || "";
            const model = runtimeConfig.speechModelId || "speaches-ai/piper-en_US-ryan-low";
            if (!baseUrl) {
                throw new Error("SPEACHES_BASE_URL not set");
            }
            audioBuffer = await speachesTTS(normalized, voice, model, fmt, baseUrl, speed);
            modelUsed = model;
            // Server returns the correct format according to response_format
            actualMime = fmtToMime(fmt);
            ttsProvider = 'speaches';
        } else if (!audioBuffer && usePiper) {
            // Local Piper
            audioBuffer = await piperTTS(normalized, voice, runtimeConfig.piperPort);
            modelUsed = "piper-local";
            // Piper returns WAV
            actualMime = "audio/wav";
            ttsProvider = 'piper';
        } else if (!audioBuffer) {
            // OpenAI (fallback)
            const tts = await normalize.audio.speech.create({
                model: TTS_MODEL,
                voice,
                input: normalized,
                speed
            });
            audioBuffer = Buffer.from(await tts.arrayBuffer());
            modelUsed = TTS_MODEL;
            actualMime = "audio/wav";
            ttsProvider = 'openai';
        }

        if (!audioBuffer) {
            throw new Error("TTS generation returned empty audio");
        }

        if (!cacheHit && flightlabCacheBaseDir && flightlabCachedAudioPath && flightlabCachedMetaPath) {
            try {
                await ensureDir(flightlabCacheBaseDir);
                await writeFile(flightlabCachedAudioPath, audioBuffer);
                await writeFile(
                    flightlabCachedMetaPath,
                    JSON.stringify(
                        {
                            key: flightlabCacheKey,
                            createdAt: timestamp,
                            tag: "flightlab",
                            voice,
                            speed,
                            level,
                            format: outputExt,
                            mime: actualMime,
                            provider: ttsProvider,
                            model: modelUsed,
                            normalized,
                            text: raw
                        },
                        null,
                        2
                    )
                );
            } catch (cacheWriteError) {
                console.warn("FlightLab TTS cache write failed", cacheWriteError);
            }
        }

        const storedAudioPath = flightlabCachedAudioPath || fileOut;
        const storedJsonPath = flightlabCachedMetaPath || fileJson;
        const storedUrl = flightlabCachedAudioPath ? null : `/api/atc/audio/${dateFolder}/${id}.${outputExt}`;

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
            files: { audio: storedAudioPath },
            model: modelUsed,
            format: actualMime,
            ttsProvider,
            cache: {
                flightlab: flightlabRequest,
                hit: cacheHit,
                key: flightlabCacheKey
            }
        };

        try {
            await TransmissionLog.create({
                // user: user._id,
                role: "atc",
                channel: "say",
                direction: "outgoing",
                text: raw,
                normalized,
                sessionId,
                metadata: {
                    level,
                    voice,
                    speed,
                    moduleId: body?.moduleId || null,
                    lessonId: body?.lessonId || null,
                    tag: body?.tag || null,
                    radioQuality: radioQuality.description,
                    tts: {
                        provider: ttsProvider,
                        model: modelUsed,
                        format: actualMime,
                        extension: outputExt
                    }
                }
            })
        } catch (logError) {
            console.warn("Transmission logging failed", logError)
        }

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
                mime: actualMime,
                base64: audioBuffer.toString("base64"),
                size: audioBuffer.length,
                ext: outputExt
            },
            stored: {
                audioPath: storedAudioPath,
                jsonPath: storedJsonPath,
                url: storedUrl
            },
            meta,
            cache: {
                flightlab: flightlabRequest,
                hit: cacheHit,
                key: flightlabCacheKey
            }
        };
    } catch (err: any) {
        throw createError({
            statusCode: 500,
            statusMessage: `TTS generation failed: ${err?.message || err}`
        });
    }
});
