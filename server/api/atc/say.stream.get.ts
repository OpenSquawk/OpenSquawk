import { getQuery, createError } from "h3";
import { spawn } from "node:child_process";
import { openai, TTS_MODEL, normalizeATC } from "../../utils/openai";

function buildRadioFilter(level: number) {
    const L = Math.max(1, Math.min(5, Math.floor(level || 4)));
    const band = (hp: number, lp: number, gain = 6) =>
        `highpass=f=${hp},lowpass=f=${lp},compand=attacks=0.02:decays=0.25:points=-80/-900|-70/-20|0/-10|20/-8:gain=${gain}`;
    const dropout = (period: number, dur: number) =>
        `volume=enable='lt(mod(t\\,${period})\\,${dur})':volume=0`;
    const tail = `aecho=0.6:0.7:8:0.08,acompressor=threshold=0.6:ratio=6:attack=20:release=200`;

    // helpers (ACHTUNG: weights **gequotet** oder mit | getrennt)
    const mixCrush = (bits: number, mix = 0.25, inLabel = "pre", outLabel = "mix1") => [
        `[${inLabel}]asplit=2[clean][toCrush]`,
        `[toCrush]acrusher=bits=${bits}:mix=1[crushed]`,
        `[clean][crushed]amix=inputs=2:weights='1 ${mix}':duration=shortest[${outLabel}]`,
    ];

    const mixNoise = (amp: number, inLabel = "mix1", outLabel = "mix2") => [
        `anoisesrc=color=white:amplitude=${amp}[ns]`,
        `[${inLabel}][ns]amix=inputs=2:weights='1 0.25':duration=shortest[${outLabel}]`,
    ];

    const dropAndTail = (inLabel: string, period?: number, dur?: number) => {
        const chain: string[] = [];
        if (period && dur) chain.push(`[${inLabel}]${dropout(period, dur)}[drop]`);
        const src = period && dur ? "drop" : inLabel;
        chain.push(`[${src}]${tail}[out]`);
        return chain;
    };

    if (L === 5)
        return [
            `[0:a]${band(300,3400)},volume=1.2[a]`,
            `anoisesrc=color=white:amplitude=0.02[ns]`,
            `[a][ns]amix=inputs=2:weights='1 0.25':duration=shortest[mix]`,
            `[mix]${tail}[out]`,
        ].join(";");

    if (L === 4)
        return [
            `[0:a]${band(320,3300)},volume=1.15[pre]`,
            ...mixNoise(0.03, "pre", "mix"),
            `[mix]${tail}[out]`,
        ].join(";");

    if (L === 3)
        return [
            `[0:a]${band(350,3200)},volume=1.1[pre]`,
            ...mixCrush(12, 0.22, "pre", "mix1"),
            ...mixNoise(0.05, "mix1", "mix2"),
            ...dropAndTail("mix2", 6, 0.06),
        ].join(";");

    if (L === 2)
        return [
            `[0:a]${band(400,3000)},volume=1.05[pre]`,
            ...mixCrush(10, 0.32, "pre", "mix1"),
            `anoisesrc=color=white:amplitude=0.08[ns]`,
            `[mix1][ns]amix=inputs=2:weights='1 0.6':duration=shortest[mix2]`,
            ...dropAndTail("mix2", 4.5, 0.12),
        ].join(";");

    // L === 1
    return [
        `[0:a]${band(500,2600,5)},volume=1.0[pre]`,
        ...mixCrush(8, 0.45, "pre", "mix1"),
        `anoisesrc=color=white:amplitude=0.12[ns]`,
        `[mix1][ns]amix=inputs=2:weights='1 0.8':duration=shortest[mix2]`,
        ...dropAndTail("mix2", 3.5, 0.2),
    ].join(";");
}

// super-simpler Fallback ohne Mix/Noise (falls Filter scheitert)
const SIMPLE_FILTER = `[0:a]highpass=f=350,lowpass=f=3000,acompressor=threshold=0.6:ratio=6:attack=20:release=200[out]`;

export default defineEventHandler(async (event) => {
    const q = getQuery(event);
    const raw = String(q.text || "").trim();
    if (!raw) throw createError({ statusCode: 400, statusMessage: "text required" });

    const level = Math.max(1, Math.min(5, parseInt(String(q.level ?? "4"), 10) || 4));
    const voice = String(q.voice || "alloy");
    const normalized = normalizeATC(raw) || raw;

    // 1) TTS → WAV
    const tts = await openai.audio.speech.create({
        model: TTS_MODEL,
        voice,
        format: "wav",
        input: normalized,
    });
    const wav = Buffer.from(await tts.arrayBuffer());
    if (wav.byteLength < 100) throw createError({ statusCode: 500, statusMessage: "TTS empty" });

    async function runFfmpeg(filter: string) {
        return new Promise<void>((resolve) => {
            const ff = spawn("ffmpeg", [
                "-hide_banner", "-loglevel", "error",
                "-f", "wav", "-i", "pipe:0",
                "-filter_complex", filter,
                "-map", "[out]",
                "-ac", "1", "-ar", "16000",
                "-c:a", "libopus", "-b:a", "12k", "-application", "voip",
                "-f", "ogg", "pipe:1",
            ], { stdio: ["pipe", "pipe", "pipe"] });

            const res = event.node.res;
            let started = false;
            let ffErr = "";

            ff.stderr.on("data", d => { ffErr += d.toString(); });

            ff.stdout.once("data", (chunk: Buffer) => {
                if (!started) {
                    started = true;
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "audio/ogg");
                    res.setHeader("Cache-Control", "no-store");
                    res.setHeader("Accept-Ranges", "none");
                    (res as any).flushHeaders?.();
                }
                res.write(chunk);
                ff.stdout.pipe(res);
            });

            ff.stdin.on("error", () => {});
            ff.stdin.write(wav);
            ff.stdin.end();

            ff.on("close", (code) => {
                if (!started) {
                    // Fehlerpfad → JSON-Fehler zurück
                    if (!res.headersSent) {
                        res.statusCode = 500;
                        res.setHeader("Content-Type", "application/json");
                    }
                    res.end(JSON.stringify({ error: true, message: ffErr || `ffmpeg exit ${code}` }));
                } else {
                    if (!res.writableEnded) res.end();
                }
                resolve();
            });
        });
    }

    // erst komplexer Filter; wenn der fehlschlägt → SIMPLE_FILTER
    await runFfmpeg(buildRadioFilter(level));
    if (!event.node.res.headersSent) {
        // zweiter Versuch
        await runFfmpeg(SIMPLE_FILTER);
    }
});
