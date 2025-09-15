// server/api/atc/generate.post.ts
import { createError, readBody } from "h3";
import { generateATCPhrase, getRandomPhraseForLesson, getPhrasesForLesson } from "../../utils/atcPhrases";
import { normalizeATC } from "../../utils/openai";

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        moduleId: string;
        lessonId: string;
        phraseId?: string;
        customVariables?: Record<string, string>;
        type?: 'instruction' | 'clearance' | 'information' | 'request';
        count?: number;
    }>(event);

    const { moduleId, lessonId, phraseId, customVariables, type, count = 1 } = body;

    if (!moduleId || !lessonId) {
        throw createError({
            statusCode: 400,
            statusMessage: "moduleId and lessonId are required"
        });
    }

    try {
        let phrases: string[] = [];

        if (phraseId) {
            // Spezifische Phrase generieren
            const phrase = generateATCPhrase(phraseId, customVariables);
            phrases.push(phrase);
        } else {
            // Zufällige Phrasen für das Modul/Lektion generieren
            const availablePhrases = getPhrasesForLesson(moduleId, lessonId);

            if (availablePhrases.length === 0) {
                throw createError({
                    statusCode: 404,
                    statusMessage: `No phrases found for module "${moduleId}", lesson "${lessonId}"`
                });
            }

            // Filter nach Typ wenn angegeben
            const filteredPhrases = type
                ? availablePhrases.filter(p => p.type === type)
                : availablePhrases;

            if (filteredPhrases.length === 0) {
                throw createError({
                    statusCode: 404,
                    statusMessage: `No phrases of type "${type}" found for module "${moduleId}", lesson "${lessonId}"`
                });
            }

            // Generiere die gewünschte Anzahl von Phrasen
            for (let i = 0; i < Math.min(count, 10); i++) { // Max 10 Phrasen pro Request
                const randomPhrase = filteredPhrases[Math.floor(Math.random() * filteredPhrases.length)];
                const generated = generateATCPhrase(randomPhrase.id, customVariables);
                phrases.push(generated);
            }
        }

        // Normalisiere alle Phrasen für TTS
        const normalizedPhrases = phrases.map(phrase => ({
            original: phrase,
            normalized: normalizeATC(phrase),
            length: phrase.length
        }));

        return {
            success: true,
            moduleId,
            lessonId,
            type: type || 'any',
            count: phrases.length,
            phrases: normalizedPhrases,
            availableTypes: getPhrasesForLesson(moduleId, lessonId)
                .map(p => p.type)
                .filter((type, index, arr) => arr.indexOf(type) === index), // Unique types
            meta: {
                totalAvailablePhrases: getPhrasesForLesson(moduleId, lessonId).length,
                generatedAt: new Date().toISOString()
            }
        };

    } catch (error) {
        if (error.statusCode) {
            throw error; // Re-throw HTTP errors
        }

        throw createError({
            statusCode: 500,
            statusMessage: `Phrase generation failed: ${error}`
        });
    }
});
