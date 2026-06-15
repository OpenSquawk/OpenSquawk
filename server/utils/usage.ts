import mongoose from 'mongoose'
import { UsageEvent, type UsageKind, type UsageProvider } from '../models/UsageEvent'

// OpenAI list prices (USD). Self-hosted providers (speaches/piper) cost 0.
// Update here when models or prices change.
const LLM_PRICES_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-5-mini': { input: 0.25, output: 2.0 },
  'gpt-5': { input: 1.25, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10.0 },
}

const STT_PRICES_PER_MINUTE: Record<string, number> = {
  'whisper-1': 0.006,
  'gpt-4o-transcribe': 0.006,
  'gpt-4o-mini-transcribe': 0.003,
}

const TTS_PRICES_PER_1M_CHARS: Record<string, number> = {
  'tts-1': 15,
  'tts-1-hd': 30,
  'gpt-4o-mini-tts': 12,
}

export interface UsageInput {
  user?: mongoose.Types.ObjectId | string | null
  sessionId?: string
  kind: UsageKind
  provider: UsageProvider
  model: string
  endpoint: string
  audioSeconds?: number
  characters?: number
  inputTokens?: number
  outputTokens?: number
}

export function estimateCostUsd(input: UsageInput): number {
  if (input.provider !== 'openai') {
    return 0
  }

  if (input.kind === 'llm') {
    const price = LLM_PRICES_PER_1M_TOKENS[input.model]
    if (!price) return 0
    const inputCost = ((input.inputTokens || 0) / 1_000_000) * price.input
    const outputCost = ((input.outputTokens || 0) / 1_000_000) * price.output
    return inputCost + outputCost
  }

  if (input.kind === 'stt') {
    const perMinute = STT_PRICES_PER_MINUTE[input.model]
    if (!perMinute) return 0
    return ((input.audioSeconds || 0) / 60) * perMinute
  }

  if (input.kind === 'tts') {
    const per1M = TTS_PRICES_PER_1M_CHARS[input.model]
    if (!per1M) return 0
    return ((input.characters || 0) / 1_000_000) * per1M
  }

  return 0
}

/** Fire-and-forget usage recording — must never break the calling endpoint. */
export async function recordUsage(input: UsageInput): Promise<void> {
  try {
    await UsageEvent.create({
      user: input.user || undefined,
      sessionId: input.sessionId,
      kind: input.kind,
      provider: input.provider,
      model: input.model,
      endpoint: input.endpoint,
      audioSeconds: input.audioSeconds,
      characters: input.characters,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      costUsd: estimateCostUsd(input),
    })
  } catch (error) {
    console.warn('[usage] Recording usage event failed', error)
  }
}

export interface UsageSummary {
  events: number
  costUsd: number
  sttSeconds: number
  ttsCharacters: number
  llmInputTokens: number
  llmOutputTokens: number
  byKind: Record<UsageKind, { events: number; costUsd: number }>
  topUsers: Array<{ email: string; events: number; costUsd: number }>
}

export async function summarizeUsage(periodStart: Date, periodEnd: Date): Promise<UsageSummary> {
  const match = { createdAt: { $gte: periodStart, $lt: periodEnd } }

  const [totals, kinds, topUsers] = await Promise.all([
    UsageEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          events: { $sum: 1 },
          costUsd: { $sum: '$costUsd' },
          sttSeconds: { $sum: { $ifNull: ['$audioSeconds', 0] } },
          ttsCharacters: { $sum: { $ifNull: ['$characters', 0] } },
          llmInputTokens: { $sum: { $ifNull: ['$inputTokens', 0] } },
          llmOutputTokens: { $sum: { $ifNull: ['$outputTokens', 0] } },
        },
      },
    ]),
    UsageEvent.aggregate([
      { $match: match },
      { $group: { _id: '$kind', events: { $sum: 1 }, costUsd: { $sum: '$costUsd' } } },
    ]),
    UsageEvent.aggregate([
      { $match: { ...match, user: { $ne: null } } },
      { $group: { _id: '$user', events: { $sum: 1 }, costUsd: { $sum: '$costUsd' } } },
      { $sort: { costUsd: -1, events: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDoc' } },
    ]),
  ])

  const t = totals[0] || {}
  const byKind: UsageSummary['byKind'] = {
    stt: { events: 0, costUsd: 0 },
    tts: { events: 0, costUsd: 0 },
    llm: { events: 0, costUsd: 0 },
  }
  for (const row of kinds) {
    if (row._id === 'stt' || row._id === 'tts' || row._id === 'llm') {
      byKind[row._id as UsageKind] = { events: row.events || 0, costUsd: row.costUsd || 0 }
    }
  }

  return {
    events: t.events || 0,
    costUsd: t.costUsd || 0,
    sttSeconds: t.sttSeconds || 0,
    ttsCharacters: t.ttsCharacters || 0,
    llmInputTokens: t.llmInputTokens || 0,
    llmOutputTokens: t.llmOutputTokens || 0,
    byKind,
    topUsers: topUsers.map((row: any) => ({
      email: row.userDoc?.[0]?.email || String(row._id),
      events: row.events || 0,
      costUsd: row.costUsd || 0,
    })),
  }
}

export async function getRollingCostUsd(days: number, now = new Date()): Promise<number> {
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const rows = await UsageEvent.aggregate([
    { $match: { createdAt: { $gte: start, $lt: now } } },
    { $group: { _id: null, costUsd: { $sum: '$costUsd' } } },
  ])
  return rows[0]?.costUsd || 0
}
