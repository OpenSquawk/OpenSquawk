// server/api/atc/ptt.post.ts
import { createError, readBody } from "h3";
import { writeFile, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { getOpenAIClient } from "../../utils/openai";
import { createReadStream } from "node:fs";
import { TransmissionLog } from "../../models/TransmissionLog";
import { getUserFromEvent } from "../../utils/auth";
import { enforceRateLimit, getClientIp } from "../../utils/rateLimit";
import { recordUsage } from "../../utils/usage";

type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'webm'

interface PTTRequest {
    audio: string; // Base64 encoded audio
    moduleId: string;
    lessonId: string;
    format?: AudioFormat;
    sessionId?: string;       // Python backend session ID — used for TransmissionLog correlation
    context?: {               // Legacy field; kept for backwards compat but not used for routing
        state_id?: string;
        flags?: Record<string, any>;
        [key: string]: any;
    };
}

interface PTTResponse {
    success: boolean;
    transcription: string;
}

async function sh(cmd: string, args: string[]) {
    return new Promise<{ stdout: string; stderr: string }>((res, rej) =>
        execFile(cmd, args, { encoding: 'utf8' }, (err, stdout, stderr) =>
            err ? rej(new Error(stderr || String(err))) : res({ stdout, stderr })
        )
    );
}

const BASE64_AUDIO_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_AUDIO_BYTES = 2 * 1024 * 1024; // ~60 seconds 16kHz mono
const AUDIO_FORMAT_SET = new Set<AudioFormat>(['wav', 'mp3', 'ogg', 'webm']);

function resolveAudioFormat(format?: string | null): AudioFormat {
    if (!format) return 'wav';
    const normalized = format.trim().toLowerCase() as AudioFormat;
    return AUDIO_FORMAT_SET.has(normalized) ? normalized : 'wav';
}

function decodeAudioPayload(encoded: string): Buffer {
    const sanitized = encoded.replace(/\s+/g, '');
    if (!sanitized) {
        throw createError({ statusCode: 400, statusMessage: 'Audio payload is empty' });
    }
    if (!BASE64_AUDIO_REGEX.test(sanitized)) {
        throw createError({ statusCode: 400, statusMessage: 'Audio payload is not valid base64' });
    }
    const buffer = Buffer.from(sanitized, 'base64');
    if (!buffer.length) {
        throw createError({ statusCode: 400, statusMessage: 'Decoded audio payload is empty' });
    }
    if (buffer.length > MAX_AUDIO_BYTES) {
        throw createError({ statusCode: 413, statusMessage: 'Audio payload exceeds the 2 MB limit' });
    }
    return buffer;
}

function wavDurationSeconds(buffer: Buffer): number | undefined {
    if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF') return undefined;
    const byteRate = buffer.readUInt32LE(28);
    if (!byteRate) return undefined;
    return Math.round(((buffer.length - 44) / byteRate) * 100) / 100;
}

async function convertToWav(inputPath: string, outputPath: string) {
    await sh("ffmpeg", [
        "-y", "-i", inputPath,
        "-ar", "16000",
        "-ac", "1",
        "-f", "wav",
        outputPath
    ]);
}

const PTT_RATE_LIMIT_PER_MINUTE = 20;

export default defineEventHandler(async (event) => {
    const user = await getUserFromEvent(event);
    enforceRateLimit(event, 'atc-ptt', user ? String(user._id) : getClientIp(event), PTT_RATE_LIMIT_PER_MINUTE);

    const body = await readBody<PTTRequest>(event);

    if (!body.audio || !body.moduleId || !body.lessonId) {
        throw createError({
            statusCode: 400,
            statusMessage: "audio, moduleId, and lessonId are required"
        });
    }

    const id = randomUUID();
    const format = resolveAudioFormat(body.format);
    const tmpAudioInput = join(tmpdir(), `ptt-input-${id}.${format}`);
    const tmpAudioWav = join(tmpdir(), `ptt-wav-${id}.wav`);

    try {
        const audioBuffer = decodeAudioPayload(body.audio);
        await writeFile(tmpAudioInput, audioBuffer);

        let audioFileForWhisper = tmpAudioInput;
        if (format !== 'wav') {
            try {
                await convertToWav(tmpAudioInput, tmpAudioWav);
                audioFileForWhisper = tmpAudioWav;
            } catch (err) {
                console.warn('FFmpeg conversion failed, using original audio:', err);
            }
        }

        const openai = getOpenAIClient();
        const transcription = await openai.audio.transcriptions.create({
            file: createReadStream(audioFileForWhisper),
            model: "whisper-1",
            language: "en",
            prompt: "This is ATC radio communication with aviation phraseology including callsigns, runway numbers, and standard procedures."
        });

        const transcribedText = transcription.text.trim();

        // Audio length for usage accounting. The Whisper input is 16kHz mono WAV
        // in the normal path; fall back to a byte-rate estimate if header parsing fails.
        let audioSeconds: number | undefined;
        try {
            const wavBuffer = audioFileForWhisper === tmpAudioInput && format === 'wav'
                ? audioBuffer
                : await readFile(audioFileForWhisper);
            audioSeconds = wavDurationSeconds(wavBuffer) ?? Math.round((wavBuffer.length / 32000) * 100) / 100;
        } catch {
            audioSeconds = Math.round((audioBuffer.length / 32000) * 100) / 100;
        }

        // Prefer the explicit top-level sessionId (Python backend session).
        // Fall back to the legacy context.flags.session_id for older clients.
        const sessionId = body.sessionId
            ?? (typeof body.context?.flags?.session_id === 'string' ? body.context.flags.session_id : undefined);

        // Whisper bills the audio even when nothing was recognized.
        await recordUsage({
            user: user?._id ? String(user._id) : undefined,
            sessionId,
            kind: 'stt',
            provider: 'openai',
            model: 'whisper-1',
            endpoint: '/api/atc/ptt',
            audioSeconds,
        });

        if (!transcribedText) {
            throw createError({ statusCode: 400, statusMessage: "No speech detected in audio" });
        }

        await rm(tmpAudioInput).catch(() => {});
        if (audioFileForWhisper !== tmpAudioInput) {
            await rm(tmpAudioWav).catch(() => {});
        }

        try {
            await TransmissionLog.create({
                user: user?._id,
                role: "pilot",
                channel: "ptt",
                direction: "incoming",
                text: transcribedText,
                sessionId,
                metadata: {
                    moduleId: body.moduleId,
                    lessonId: body.lessonId,
                },
            });
        } catch (logError) {
            console.warn("Transmission logging failed", logError);
        }

        return { success: true, transcription: transcribedText } satisfies PTTResponse;

    } catch (error: any) {
        await rm(tmpAudioInput).catch(() => {});
        await rm(tmpAudioWav).catch(() => {});

        if (error.statusCode) throw error;

        throw createError({
            statusCode: 500,
            statusMessage: `PTT processing failed: ${error.message || error}`
        });
    }
});
