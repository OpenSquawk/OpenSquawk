// server/api/atc/ptt.post.ts
import { createError, readBody } from "h3";
import { writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { openai, LLM_MODEL, normalizeATC } from "../../utils/openai";
import { createReadStream } from "node:fs"; // ← Diesen Import hinzufügen!

interface PTTRequest {
    audio: string; // Base64 encoded audio
    expectedText: string; // Was der Nutzer wiederholen sollte
    moduleId: string;
    lessonId: string;
    format?: 'wav' | 'mp3' | 'ogg' | 'webm'; // Audio format
}

interface PTTResponse {
    success: boolean;
    transcription: string;
    normalized: string;
    expectedNormalized: string;
    evaluation: {
        score: number; // 0-100
        accuracy: number; // Text similarity
        keywordMatch: number; // Keyword matching
        recommendation: 'excellent' | 'good' | 'retry' | 'listen_again';
        feedback: string;
        mistakes?: string[];
    };
    playAgain: boolean; // Ob der ursprüngliche Funkspruch nochmal abgespielt werden soll
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

// Levenshtein Distance für Text-Ähnlichkeit
function levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,     // deletion
                matrix[j - 1][i] + 1,     // insertion
                matrix[j - 1][i - 1] + indicator // substitution
            );
        }
    }

    return matrix[str2.length][str1.length];
}

function calculateSimilarity(str1: string, str2: string): number {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

// Extrahiere Keywords für ATC-spezifische Bewertung
function extractATCKeywords(text: string): string[] {
    const atcKeywords = [
        // Callsigns
        'lufthansa', 'speedbird', 'air france', 'klm', 'american', 'united', 'delta', 'ryanair', 'easy',
        // Numbers/Letters
        'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliett',
        'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango',
        'uniform', 'victor', 'whiskey', 'x-ray', 'yankee', 'zulu',
        'zero', 'wun', 'too', 'tree', 'fower', 'fife', 'six', 'seven', 'eight', 'niner',
        // ATC Phraseology
        'runway', 'taxi', 'contact', 'ground', 'tower', 'approach', 'departure',
        'cleared', 'hold short', 'line up', 'wait', 'takeoff', 'landing', 'vacate',
        'via', 'squawk', 'heading', 'altitude', 'flight level', 'decimal',
        'roger', 'affirm', 'negative', 'unable', 'standby', 'say again'
    ];

    const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    return atcKeywords.filter(keyword => normalized.includes(keyword));
}

async function evaluateReadback(transcription: string, expected: string, moduleId: string, lessonId: string) {
    const normalizedTranscription = normalizeATC(transcription);
    const normalizedExpected = normalizeATC(expected);

    // Text-Ähnlichkeit
    const accuracy = calculateSimilarity(normalizedTranscription, normalizedExpected);

    // Keyword-Matching für ATC-spezifische Begriffe
    const expectedKeywords = extractATCKeywords(normalizedExpected);
    const transcribedKeywords = extractATCKeywords(normalizedTranscription);
    const keywordMatch = expectedKeywords.length > 0
        ? transcribedKeywords.filter(k => expectedKeywords.includes(k)).length / expectedKeywords.length
        : 1;

    // Gewichtete Gesamtbewertung
    const score = Math.round((accuracy * 0.6 + keywordMatch * 0.4) * 100);

    // LLM für detailliertes Feedback
    const prompt = `You are an ATC instructor evaluating a pilot's readback.

Expected: "${expected}"
Pilot said: "${transcription}"

Module: ${moduleId}, Lesson: ${lessonId}

Evaluate the readback and provide:
1. Brief feedback (max 2 sentences)
2. Specific mistakes if any
3. Overall assessment

Be constructive and educational. Focus on aviation safety and standard phraseology.

Response format:
FEEDBACK: [your feedback]
MISTAKES: [list mistakes or "None"]
ASSESSMENT: [excellent/good/needs_improvement/unacceptable]`;

    try {
        const completion = await openai.chat.completions.create({
            model: LLM_MODEL,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.3
        });

        const response = completion.choices[0]?.message?.content || "";
        const feedback = response.match(/FEEDBACK: (.+?)(?=MISTAKES:|$)/)?.[1]?.trim() || "Good attempt.";
        const mistakes = response.match(/MISTAKES: (.+?)(?=ASSESSMENT:|$)/)?.[1]?.trim();
        const assessment = response.match(/ASSESSMENT: (.+)/)?.[1]?.trim() || "good";

        let recommendation: PTTResponse['evaluation']['recommendation'] = 'good';
        let playAgain = false;

        if (score >= 90) {
            recommendation = 'excellent';
        } else if (score >= 75) {
            recommendation = 'good';
        } else if (score >= 50) {
            recommendation = 'retry';
            playAgain = true;
        } else {
            recommendation = 'listen_again';
            playAgain = true;
        }

        return {
            score,
            accuracy,
            keywordMatch,
            recommendation,
            feedback,
            mistakes: mistakes && mistakes !== "None" ? [mistakes] : undefined,
            playAgain
        };

    } catch (error) {
        console.error("LLM evaluation failed:", error);

        // Fallback ohne LLM
        let recommendation: PTTResponse['evaluation']['recommendation'] = 'good';
        let playAgain = false;

        if (score >= 90) {
            recommendation = 'excellent';
        } else if (score >= 75) {
            recommendation = 'good';
        } else if (score >= 50) {
            recommendation = 'retry';
            playAgain = true;
        } else {
            recommendation = 'listen_again';
            playAgain = true;
        }

        return {
            score,
            accuracy,
            keywordMatch,
            recommendation,
            feedback: score >= 75 ? "Good readback!" : "Try to match the phraseology more closely.",
            playAgain
        };
    }
}

export default defineEventHandler(async (event) => {
    const body = await readBody<PTTRequest>(event);

    if (!body.audio || !body.expectedText || !body.moduleId || !body.lessonId) {
        throw createError({
            statusCode: 400,
            statusMessage: "audio, expectedText, moduleId, and lessonId are required"
        });
    }

    const id = randomUUID();
    const tmpAudioInput = join(tmpdir(), `ptt-input-${id}.${body.format || 'wav'}`);
    const tmpAudioWav = join(tmpdir(), `ptt-wav-${id}.wav`);

    try {
        // 1. Audio aus Base64 dekodieren und speichern
        const audioBuffer = Buffer.from(body.audio, 'base64');
        await writeFile(tmpAudioInput, audioBuffer);

        // 2. Zu WAV konvertieren falls nötig
        if (body.format !== 'wav') {
            await convertToWav(tmpAudioInput, tmpAudioWav);
        }

        const audioFileForWhisper = body.format === 'wav' ? tmpAudioInput : tmpAudioWav;

        // 3. OpenAI Whisper für Transkription
        const transcription = await openai.audio.transcriptions.create({
            file: createReadStream(audioFileForWhisper), // ReadStream
            model: "whisper-1",
            language: "en", // ATC ist standardmäßig auf Englisch
            prompt: "This is ATC radio communication with aviation phraseology including callsigns, runway numbers, and standard procedures.",
        });

        const transcribedText = transcription.text.trim();

        if (!transcribedText) {
            throw createError({
                statusCode: 400,
                statusMessage: "No speech detected in audio"
            });
        }

        // 4. Evaluation der Readback
        const evaluation = await evaluateReadback(
            transcribedText,
            body.expectedText,
            body.moduleId,
            body.lessonId
        );

        // 5. Cleanup
        await rm(tmpAudioInput).catch(() => {});
        if (body.format !== 'wav') {
            await rm(tmpAudioWav).catch(() => {});
        }

        return {
            success: true,
            transcription: transcribedText,
            normalized: normalizeATC(transcribedText),
            expectedNormalized: normalizeATC(body.expectedText),
            evaluation,
            playAgain: evaluation.playAgain
        } as PTTResponse;

    } catch (error) {
        // Cleanup bei Fehler
        await rm(tmpAudioInput).catch(() => {});

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: `PTT processing failed: ${error}`
        });
    }
});
