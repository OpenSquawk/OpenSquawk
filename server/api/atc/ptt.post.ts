// server/api/atc/ptt.post.ts
import { createError, readBody } from "h3";
import { writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { openai, routeDecision } from "../../utils/openai";
import { createReadStream } from "node:fs";

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
    skipDecision?: boolean;
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

        // 3. OpenAI Whisper für Transkription
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

        let decision;
        if (!body.skipDecision) {
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
