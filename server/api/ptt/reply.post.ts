import { readMultipartFormData, createError } from "h3";
import { openai, LLM_MODEL, TTS_MODEL, atcReplyPrompt } from "../../utils/openai";
import { applyRadioEffect } from "../../utils/radio";
import { writeFile, rm, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { toFile } from "openai/uploads";

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  if (!parts) throw createError({ statusCode: 400, statusMessage: "No form-data" });

  // Default ohne Text-Input: immer TTS
  const audio = parts.find(p => p.type && p.data);
  if (!audio) throw createError({ statusCode: 400, statusMessage: "No audio file" });

  const file = await toFile(
      audio.data,
      audio.filename || "ptt.webm",
      { type: audio.type || "audio/webm" }
  );

  // 1) Transkription (Whisper)
  const tr = await openai.audio.transcriptions.create({ model: "whisper-1", file });
  const pilotText = (tr.text || "").trim();
  if (!pilotText) throw createError({ statusCode: 400, statusMessage: "Empty transcription" });

  // 2) ATC-Antwort (LLM)
  const resp = await openai.responses.create({
    model: LLM_MODEL,
    input: atcReplyPrompt(pilotText),
  });
  const replyText = (resp.output_text || "").trim();
  if (!replyText) throw createError({ statusCode: 500, statusMessage: "LLM empty" });

  // 3) TTS + Funk-Effekt
  const clean = join(tmpdir(), `tts-${randomUUID()}.wav`);
  const radio = join(tmpdir(), `radio-${randomUUID()}.wav`);

  const tts = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice: "alloy",
    format: "wav",
    input: replyText,
  });
  await writeFile(clean, Buffer.from(await tts.arrayBuffer()));
  await applyRadioEffect(clean, radio);

  const data = await readFile(radio);
  const b64 = Buffer.from(data).toString("base64");
  rm(clean).catch(() => {});
  rm(radio).catch(() => {});

  return { pilotText, replyText, audio: { mime: "audio/wav", base64: b64 } };
});
