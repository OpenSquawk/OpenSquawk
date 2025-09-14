import { readMultipartFormData, createError } from "h3";
import { openai, LLM_MODEL, TTS_MODEL, atcReplyPrompt } from "../../utils/openai";
import { applyRadioEffect } from "../../utils/radio";
import { writeFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  const mode = parts?.find(p=>p.name==="mode")?.data?.toString("utf8") || "text";
  const audio = parts?.find(p=>p.type && p.data);
  if (!audio) throw createError({ statusCode:400, statusMessage:"No audio" });

  const file = new File([audio.data], audio.filename || "audio.webm", { type: audio.type || "audio/webm" });
  const tr = await openai.audio.transcriptions.create({ model: "whisper-1", file });
  const pilotText = tr.text.trim();

  const resp = await openai.responses.create({ model: LLM_MODEL, input: atcReplyPrompt(pilotText) });
  const replyText = resp.output_text?.trim() || "";

  if (mode === "tts") {
    const clean = join(tmpdir(), `tts-${randomUUID()}.wav`);
    const radio = join(tmpdir(), `radio-${randomUUID()}.wav`);
    const tts = await openai.audio.speech.create({ model: TTS_MODEL, voice: "alloy", format: "wav", input: replyText });
    await writeFile(clean, Buffer.from(await tts.arrayBuffer()));
    await applyRadioEffect(clean, radio);
    const data = await import("node:fs/promises").then(fs => fs.readFile(radio));
    await rm(clean).catch(()=>{});
    const b64 = Buffer.from(data).toString("base64");
    await rm(radio).catch(()=>{});
    return { pilotText, replyText, audio:{ mime:"audio/wav", base64:b64 } };
  }
  return { pilotText, replyText };
});
