import { readMultipartFormData, createError } from "h3";
import { openai } from "../../utils/openai";
export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  const audio = parts?.find(p=>p.type && p.data);
  if (!audio) throw createError({ statusCode:400, statusMessage:"No audio" });
  const file = new File([audio.data], audio.filename || "audio.webm", { type: audio.type || "audio/webm" });
  const tr = await openai.audio.transcriptions.create({ model: "whisper-1", file });
  return { text: tr.text };
});
