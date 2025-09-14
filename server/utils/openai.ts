import OpenAI from "openai";
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
export const LLM_MODEL = process.env.LLM_MODEL || "gpt-5-nano";
export const TTS_MODEL = process.env.TTS_MODEL || "tts-1";
export function atcReplyPrompt(userText: string) {
  return `You are an ICAO-compliant ATC controller. Reply concisely.
Pilot said: "${userText}"`;
}
