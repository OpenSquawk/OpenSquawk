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
        candidates: Array<{ id: string; state: any; flow?: string }>;
        variables: Record<string, any>;
        flags: Record<string, any>;
        flow_slug?: string;
    };
    moduleId: string;
    lessonId: string;
    format?: AudioFormat;
    autoDecide?: boolean;
}

interface PTTResponse {
    success: boolean;
    transcription: string;
    decision?: LLMDecisionResult['decision'];
    trace?: LLMDecisionResult['trace'];
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

// Convert audio to WAV for better Whisper compatibility
async function convertToWav(inputPath: string, outputPath: string) {
    await sh("ffmpeg", [
        "-y", "-i", inputPath,
        "-ar", "16000",  // 16 kHz for Whisper
        "-ac", "1",      // Mono
        "-f", "wav",
        outputPath
    ]);
}

function safeClone<T>(value: T): T | undefined {
    if (value === undefined) {
        return undefined;
    }

    try {
        return JSON.parse(JSON.stringify(value));
    } catch (err) {
        console.warn("Failed to clone value for transmission metadata", err);
        return undefined;
    }
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
        // 1. Decode audio from base64 and save
        const audioBuffer = decodeAudioPayload(body.audio);
        await writeFile(tmpAudioInput, audioBuffer);

        // 2. Convert to WAV if needed (only when FFmpeg is available)
        let audioFileForWhisper = tmpAudioInput;
        if (format !== 'wav') {
            try {
                await convertToWav(tmpAudioInput, tmpAudioWav);
                audioFileForWhisper = tmpAudioWav;
            } catch (err) {
                console.warn('FFmpeg conversion failed, using original audio:', err);
            }
        }

        // 3. OpenAI Whisper for transcription
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
            // 4. Call the LLM decision directly with the transcribed text
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

            const llmCallCount = decisionResult?.trace?.calls?.length || 0;
            const fallbackUsed = Boolean(decisionResult?.trace?.fallback?.used);

            let llmStrategy: 'manual' | 'openai' | 'heuristic' | 'fallback' = 'manual';
            if (shouldAutoDecide) {
                if (llmCallCount > 0) {
                    llmStrategy = 'openai';
                } else if (fallbackUsed) {
                    llmStrategy = 'fallback';
                } else {
                    llmStrategy = 'heuristic';
                }
            }

            const llmUsage = {
                autoDecide: shouldAutoDecide,
                openaiUsed: llmStrategy === 'openai',
                callCount: llmCallCount,
                fallbackUsed,
                strategy: llmStrategy,
                reason:
                    llmStrategy === 'manual'
                        ? 'Automatic decision disabled in request.'
                        : llmStrategy === 'openai'
                            ? `Decision derived from OpenAI with ${llmCallCount} call(s).`
                            : llmStrategy === 'fallback'
                                ? (decisionResult?.trace?.fallback?.reason || 'Fallback triggered after OpenAI failure.')
                                : 'Decision resolved locally without calling OpenAI.'
            };

            const contextState = safeClone(body.context.state);
            if (contextState && typeof contextState === 'object' && contextState !== null) {
                const stateRecord = contextState as Record<string, any>;
                if (!('id' in stateRecord)) {
                    stateRecord.id = body.context.state_id;
                }
            }

            const contextCandidates = Array.isArray(body.context.candidates)
                ? body.context.candidates.map(candidate => {
                      const candidateState = safeClone(candidate.state);
                      if (candidateState && typeof candidateState === 'object' && candidateState !== null) {
                          const candidateRecord = candidateState as Record<string, any>;
                          if (!('id' in candidateRecord)) {
                              candidateRecord.id = candidate.id;
                          }
                      }

                      return {
                          id: candidate.id,
                          flow: candidate.flow || undefined,
                          state: candidateState
                      };
                  })
                : undefined;

            const selectedCandidate = contextCandidates?.find(c => c.id === decision?.next_state);

            const sessionId = typeof body.context?.flags?.session_id === 'string'
                ? body.context.flags.session_id
                : undefined;

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
                    decision,
                    decisionTrace: decisionResult?.trace,
                    autoDecide: shouldAutoDecide,
                    llm: llmUsage,
                    context: {
                        stateId: body.context.state_id,
                        state: contextState,
                        candidates: contextCandidates,
                        selectedCandidate,
                        variables: safeClone(body.context.variables),
                        flags: safeClone(body.context.flags)
                    }
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
        if (decisionResult?.trace) {
            result.trace = decisionResult.trace;
        }

        return result;

    } catch (error: any) {
        // Cleanup on error
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
