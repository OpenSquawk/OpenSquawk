// server/api/atc/audio/[...path].get.ts
import { createError } from "h3";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

function outDir() {
    const base = process.env.ATC_OUT_DIR?.trim() || join(process.cwd(), "storage", "atc");
    return base;
}

export default defineEventHandler(async (event) => {
    const path = getRouterParam(event, 'path');

    if (!path || typeof path !== 'string') {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid path"
        });
    }

    // Sicherheitscheck: verhindere Directory Traversal
    if (path.includes('..') || path.includes('/./') || path.startsWith('/')) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid path"
        });
    }

    const filePath = join(outDir(), path);

    if (!existsSync(filePath)) {
        throw createError({
            statusCode: 404,
            statusMessage: "Audio file not found"
        });
    }

    try {
        const stats = await stat(filePath);

        if (!stats.isFile()) {
            throw createError({
                statusCode: 400,
                statusMessage: "Path is not a file"
            });
        }

        // Nur Audio-Dateien servieren
        const allowedExtensions = ['.ogg', '.wav', '.mp3'];
        const hasValidExtension = allowedExtensions.some(ext => filePath.toLowerCase().endsWith(ext));

        if (!hasValidExtension) {
            throw createError({
                statusCode: 400,
                statusMessage: "Not an audio file"
            });
        }

        const fileBuffer = await readFile(filePath);

        // MIME Type basierend auf Dateiendung
        let mimeType = 'audio/ogg';
        if (filePath.endsWith('.wav')) {
            mimeType = 'audio/wav';
        } else if (filePath.endsWith('.mp3')) {
            mimeType = 'audio/mpeg';
        } else if (filePath.endsWith('.ogg')) {
            mimeType = 'audio/ogg; codecs=opus';
        }

        // HTTP Headers für Audio-Streaming
        setHeader(event, 'Content-Type', mimeType);
        setHeader(event, 'Content-Length', stats.size.toString());
        setHeader(event, 'Accept-Ranges', 'bytes');
        setHeader(event, 'Cache-Control', 'public, max-age=3600'); // 1 Stunde Cache
        setHeader(event, 'Access-Control-Allow-Origin', '*');

        // Range-Request Support für Audio-Seeking
        const range = getHeader(event, 'range');
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

            if (start >= stats.size || end >= stats.size) {
                setResponseStatus(event, 416); // Range Not Satisfiable
                setHeader(event, 'Content-Range', `bytes */${stats.size}`);
                return '';
            }

            const chunkSize = (end - start) + 1;
            const chunk = fileBuffer.slice(start, end + 1);

            setResponseStatus(event, 206); // Partial Content
            setHeader(event, 'Content-Range', `bytes ${start}-${end}/${stats.size}`);
            setHeader(event, 'Content-Length', chunkSize.toString());

            return chunk;
        }

        return fileBuffer;

    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to serve audio file: ${error}`
        });
    }
});
