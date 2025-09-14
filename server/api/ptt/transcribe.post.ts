import { readMultipartFormData, createError } from "h3";
import { openai } from "../../utils/openai";
import { toFile } from "openai/uploads"; // ⟵ NEU

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  if (!parts) throw createError({ statusCode: 400, statusMessage: "No form-data" });

  const audio = parts.find(p => p.type && p.data);
  if (!audio) throw createError({ statusCode: 400, statusMessage: "No audio file" });

  const file = await toFile(
      audio.data,                                  // Buffer
      audio.filename || "ptt.webm",                // ⟵ mit Endung
      { type: audio.type || "audio/webm" }         // ⟵ korrekter MIME
  );

  const tr = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file
  });

  return { text: tr.text };
});
