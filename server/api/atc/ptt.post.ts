// server/api/atc/ptt.post.ts
import { createError, readBody } from "h3";
import { writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { getOpenAIClient, routeDecision, type LLMDecisionResult } from "../../utils/openai";
import { createReadStream } from "node:fs";
import { TransmissionLog } from "../../models/TransmissionLog";
import { getUserFromEvent } from "../../utils/auth";

type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'webm'

interface PTTRequest {
    audio: string; // Base64 encoded audio
    context: {
        state_id: string;
        state: any;
        candidates: Array<{ id: string; state: any }>;
        variables: Record<string, any>;
        flags: Record<string, any>;
    };
    moduleId: string;
    lessonId: string;
    format?: AudioFormat;
    autoDecide?: boolean;
}

interface PTTResponse {
    success: boolean;
    transcription: string;
    decision?: {
        next_state: string;
        controller_say_tpl?: string;
        off_schema?: boolean;
        radio_check?: boolean;
    };
}

async function sh(cmd: string, args: string[]) {
    return new Promise<{ stdout: string; stderr: string }>((res, rej) =>
        execFile(cmd, args, { encoding: 'utf8' }, (err, stdout, stderr) =>
            err ? rej(new Error(stderr || String(err))) : res({ stdout, stderr })
        )
    );
}

const BASE64_AUDIO_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_AUDIO_BYTES = 2 * 1024 * 1024; // ~60 Sekunden 16kHz Mono
const ALLOWED_AUDIO_FORMATS: AudioFormat[] = ['wav', 'mp3', 'ogg', 'webm'];
const AUDIO_FORMAT_SET = new Set<AudioFormat>(ALLOWED_AUDIO_FORMATS);

function resolveAudioFormat(format?: string | null): AudioFormat {
    if (!format) {
        return 'wav';
    }
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

// Audio zu WAV konvertieren für bessere Whisper-Kompatibilität
async function convertToWav(inputPath: string, outputPath: string) {
    await sh("ffmpeg", [
        "-y", "-i", inputPath,
        "-ar", "16000",  // 16kHz für Whisper
        "-ac", "1",      // Mono
        "-f", "wav",
        outputPath
    ]);
}

export default defineEventHandler(async (event) => {
    const body = await readBody<PTTRequest>(event);

    if (!body.audio || !body.context || !body.moduleId || !body.lessonId) {
        throw createError({
            statusCode: 400,
            statusMessage: "audio, context, moduleId, and lessonId are required"
        });
    }

    const id = randomUUID();
    const format = resolveAudioFormat(body.format);
    const tmpAudioInput = join(tmpdir(), `ptt-input-${id}.${format}`);
    const tmpAudioWav = join(tmpdir(), `ptt-wav-${id}.wav`);

    try {
        // 1. Audio aus Base64 dekodieren und speichern
        const audioBuffer = decodeAudioPayload(body.audio);
        await writeFile(tmpAudioInput, audioBuffer);

        // 2. Zu WAV konvertieren falls nötig (nur wenn FFmpeg verfügbar)
        let audioFileForWhisper = tmpAudioInput;
        if (format !== 'wav') {
            try {
                await convertToWav(tmpAudioInput, tmpAudioWav);
                audioFileForWhisper = tmpAudioWav;
            } catch (err) {
                console.warn('FFmpeg conversion failed, using original audio:', err);
            }
        }

        // 3. OpenAI Whisper für Transkription
        const openai = getOpenAIClient();
        const transcription = await openai.audio.transcriptions.create({
            file: createReadStream(audioFileForWhisper),
            model: "whisper-1",
            language: "en",
            prompt: "This is ATC radio communication with aviation phraseology including callsigns, runway numbers, and standard procedures."
        });

        const transcribedText = transcription.text.trim();

        if (!transcribedText) {
            throw createError({
                statusCode: 400,
                statusMessage: "No speech detected in audio"
            });
        }

        const shouldAutoDecide = body.autoDecide !== false;

        let decisionResult: LLMDecisionResult | null = null;
        let decision: PTTResponse['decision'];

        if (shouldAutoDecide) {
            // 4. Direkt LLM Decision aufrufen mit transkribiertem Text
            const decisionInput = {
                ...body.context,
                pilot_utterance: transcribedText
            };

            decisionResult = await routeDecision(decisionInput);
            decision = decisionResult.decision;
        }

        // 5. Cleanup
        await rm(tmpAudioInput).catch(() => {});
        if (audioFileForWhisper !== tmpAudioInput) {
            await rm(tmpAudioWav).catch(() => {});
        }

        try {
            const user = await getUserFromEvent(event)
            await TransmissionLog.create({
                user: user?._id,
                role: "pilot",
                channel: "ptt",
                direction: "incoming",
                text: transcribedText,
                metadata: {
                    moduleId: body.moduleId,
                    lessonId: body.lessonId,
                    decision,
                    decisionTrace: decisionResult?.trace,
                    autoDecide: shouldAutoDecide,
                },
            })
        } catch (logError) {
            console.warn("Transmission logging failed", logError)
        }

        const result: PTTResponse = {
            success: true,
            transcription: transcribedText
        };

        if (decision) {
            result.decision = decision;
        }

        return result;

    } catch (error: any) {
        // Cleanup bei Fehler
        await rm(tmpAudioInput).catch(() => {});
        await rm(tmpAudioWav).catch(() => {});

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: `PTT processing failed: ${error.message || error}`
        });
    }
});
