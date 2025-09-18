// server/api/atc/ptt.post.ts
import { createError, readBody } from "h3";
import { writeFile, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { openai, routeDecision } from "../../utils/openai";
import { createReadStream } from "node:fs";
import { TransmissionLog } from "../../models/TransmissionLog";
import { getUserFromEvent } from "../../utils/auth";

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
    format?: 'wav' | 'mp3' | 'ogg' | 'webm';
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

async function transcribeWithLocalWhisper(filePath: string, format: string): Promise<string> {
    const endpoint = (process.env.LOCAL_WHISPER_URL || "http://localhost:9000/v1/audio/transcriptions").trim();
    const language = (process.env.LOCAL_WHISPER_LANGUAGE || "en").trim();

    const audioBuffer = await readFile(filePath);
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            audio: audioBuffer.toString("base64"),
            format,
            language
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Local Whisper request failed (${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json() as { text?: string };
    const text = (data?.text || "").trim();
    if (!text) {
        throw new Error("Local Whisper returned an empty transcription");
    }
    return text;
}

async function transcribeWithSpeaches(filePath: string, format: string): Promise<string> {
    const baseUrl = (process.env.SPEACHES_BASE_URL || "http://localhost:5005").trim();
    const model = (process.env.SPEACHES_STT_MODEL_ID || "tiny.en").trim();
    const language = (process.env.SPEACHES_WHISPER_LANGUAGE || "").trim();

    if (!baseUrl) {
        throw new Error("SPEACHES_BASE_URL not set");
    }

    const audioBuffer = await readFile(filePath);
    const endpoint = `${baseUrl.replace(/\/+$/, "")}/v1/audio/transcriptions`;
    const payload: Record<string, any> = {
        audio: audioBuffer.toString("base64"),
        format,
        model
    };
    if (language) {
        payload.language = language;
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Speaches transcription failed (${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json() as { text?: string };
    const text = (data?.text || "").trim();
    if (!text) {
        throw new Error("Speaches transcription returned an empty result");
    }
    return text;
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
    const tmpAudioInput = join(tmpdir(), `ptt-input-${id}.${body.format || 'wav'}`);
    const tmpAudioWav = join(tmpdir(), `ptt-wav-${id}.wav`);

    try {
        // 1. Audio aus Base64 dekodieren und speichern
        const audioBuffer = Buffer.from(body.audio, 'base64');
        await writeFile(tmpAudioInput, audioBuffer);

        // 2. Zu WAV konvertieren falls nötig (nur wenn FFmpeg verfügbar)
        let audioFileForWhisper = tmpAudioInput;
        if (body.format !== 'wav') {
            try {
                await convertToWav(tmpAudioInput, tmpAudioWav);
                audioFileForWhisper = tmpAudioWav;
            } catch (err) {
                console.warn('FFmpeg conversion failed, using original audio:', err);
            }
        }

        const useSpeaches = (process.env.USE_SPEACHES || "").toLowerCase() === "true";
        const useLocalWhisper = !useSpeaches && (process.env.USE_LOCAL_WHISPER || "").toLowerCase() === "true";

        let transcribedText: string;

        if (useSpeaches) {
            transcribedText = await transcribeWithSpeaches(audioFileForWhisper, "wav");
        } else if (useLocalWhisper) {
            transcribedText = await transcribeWithLocalWhisper(audioFileForWhisper, "wav");
        } else {
            // 3. OpenAI Whisper für Transkription
            const transcription = await openai.audio.transcriptions.create({
                file: createReadStream(audioFileForWhisper),
                model: "whisper-1",
                language: "en",
                prompt: "This is ATC radio communication with aviation phraseology including callsigns, runway numbers, and standard procedures."
            });

            transcribedText = transcription.text.trim();
        }

        if (!transcribedText) {
            throw createError({
                statusCode: 400,
                statusMessage: "No speech detected in audio"
            });
        }

        const shouldAutoDecide = body.autoDecide !== false;

        let decision: PTTResponse['decision'];

        if (shouldAutoDecide) {
            // 4. Direkt LLM Decision aufrufen mit transkribiertem Text
            const decisionInput = {
                ...body.context,
                pilot_utterance: transcribedText
            };

            decision = await routeDecision(decisionInput);
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
