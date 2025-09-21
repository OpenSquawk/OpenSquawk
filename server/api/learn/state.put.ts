import { readBody } from 'h3'
import { requireUserSession } from '../../utils/auth'
import { LearnProfile } from '../../models/LearnProfile'
import type { LearnConfig, LearnProgress, LessonProgress } from '~~/shared/learn/config'
import type { MissionContext, MissionContextSummary, MissionSource } from '~~/shared/learn/types'
import { createDefaultLearnConfig } from '~~/shared/learn/config'

interface LearnStateUpdateBody {
  xp?: number
  progress?: LearnProgress
  config?: Partial<LearnConfig>
}

function sanitizeProgress(input: LearnProgress | undefined): LearnProgress | undefined {
  if (!input || typeof input !== 'object') {
    return undefined
  }

  const sanitized: LearnProgress = {}

  for (const [moduleId, lessons] of Object.entries(input)) {
    if (!lessons || typeof lessons !== 'object') {
      continue
    }

    const lessonProgress: Record<string, LessonProgress> = {}

    for (const [lessonId, value] of Object.entries(lessons as Record<string, any>)) {
      if (!value || typeof value !== 'object') {
        continue
      }

      const bestRaw = (value as any).best
      const doneRaw = (value as any).done

      const best = typeof bestRaw === 'number' && Number.isFinite(bestRaw) ? Math.max(0, Math.min(100, Math.round(bestRaw))) : 0
      const done = Boolean(doneRaw)

      lessonProgress[lessonId] = { best, done }
    }

    sanitized[moduleId] = lessonProgress
  }

  return sanitized
}

function sanitizeConfig(input: Partial<LearnConfig> | undefined): LearnConfig | undefined {
  if (!input || typeof input !== 'object') {
    return undefined
  }

  const config = createDefaultLearnConfig()

  if (typeof input.tts === 'boolean') {
    config.tts = input.tts
  }

  if (typeof input.audioChallenge === 'boolean') {
    config.audioChallenge = input.audioChallenge
  }

  if (typeof input.radioLevel === 'number' && Number.isFinite(input.radioLevel)) {
    const level = Math.round(input.radioLevel)
    config.radioLevel = Math.min(5, Math.max(1, level))
  }

  if (typeof input.audioSpeed === 'number' && Number.isFinite(input.audioSpeed)) {
    const rounded = Math.round(input.audioSpeed * 20) / 20
    config.audioSpeed = Math.min(1.3, Math.max(0.7, rounded))
  }

  if (typeof input.voice === 'string') {
    config.voice = input.voice.slice(0, 120)
  }

  const contexts = sanitizeMissionContexts((input as any).missionContexts)
  if (contexts) {
    config.missionContexts = contexts
  }

  return config
}

function sanitizeMissionContexts(input: unknown): Record<string, MissionContext> | undefined {
  if (!input || typeof input !== 'object') {
    return undefined
  }

  const result: Record<string, MissionContext> = {}
  const now = new Date().toISOString()
  const entries = Object.entries(input as Record<string, any>).slice(0, 12)

  for (const [moduleId, raw] of entries) {
    if (!raw || typeof raw !== 'object') {
      continue
    }

    const sourceRaw = (raw as any).source
    const source: MissionSource = sourceRaw === 'manual' || sourceRaw === 'simbrief' ? sourceRaw : 'random'

    const scenarioRaw = (raw as any).scenario
    const summaryRaw = (raw as any).summary
    if (!scenarioRaw || typeof scenarioRaw !== 'object' || !summaryRaw || typeof summaryRaw !== 'object') {
      continue
    }

    const summary = sanitizeMissionSummary(summaryRaw)
    if (!summary) {
      continue
    }

    const scenario = JSON.parse(JSON.stringify(scenarioRaw))
    const updatedAt = typeof (raw as any).updatedAt === 'string' ? (raw as any).updatedAt : now
    const metadata = (raw as any).metadata && typeof (raw as any).metadata === 'object'
      ? JSON.parse(JSON.stringify((raw as any).metadata))
      : undefined

    result[moduleId] = {
      source,
      scenario,
      summary,
      updatedAt,
      ...(metadata ? { metadata } : {}),
    }
  }

  return result
}

function sanitizeMissionSummary(input: any): MissionContextSummary | undefined {
  if (!input || typeof input !== 'object') {
    return undefined
  }

  const callsign = sanitizeText(input.callsign, 32)
  const radioCall = sanitizeText(input.radioCall, 64)
  const route = sanitizeText(input.route, 240)

  const departure = sanitizeMissionPoint(input.departure)
  const arrival = sanitizeMissionPoint(input.arrival)

  if (!callsign || !radioCall || !route || !departure || !arrival) {
    return undefined
  }

  return {
    callsign,
    radioCall,
    route,
    departure,
    arrival,
    sid: sanitizeOptional(input.sid, 40),
    transition: sanitizeOptional(input.transition, 40),
    star: sanitizeOptional(input.star, 40),
    arrivalTransition: sanitizeOptional(input.arrivalTransition, 40),
    approach: sanitizeOptional(input.approach, 60),
    remarks: sanitizeOptional(input.remarks, 160),
  }
}

function sanitizeMissionPoint(input: any): MissionContextSummary['departure'] | undefined {
  if (!input || typeof input !== 'object') {
    return undefined
  }

  const icao = sanitizeText(input.icao, 8)?.toUpperCase()
  const name = sanitizeText(input.name, 80)
  const city = sanitizeText(input.city, 80)
  const runway = sanitizeText(input.runway, 24)
  const stand = sanitizeText(input.stand, 24)
  const taxi = sanitizeText(input.taxi, 120)

  if (!icao || !name || !city || !runway || !stand) {
    return undefined
  }

  return { icao, name, city, runway, stand, taxi: taxi ?? '' }
}

function sanitizeText(value: unknown, max = 120): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  return trimmed.slice(0, max)
}

function sanitizeOptional(value: unknown, max = 80): string | undefined {
  const sanitized = sanitizeText(value, max)
  return sanitized ?? undefined
}

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const body = await readBody<LearnStateUpdateBody>(event)

  let profile = await LearnProfile.findOne({ user: user._id })
  if (!profile) {
    profile = new LearnProfile({ user: user._id })
  }

  if (typeof body.xp === 'number' && Number.isFinite(body.xp)) {
    profile.xp = Math.max(0, Math.round(body.xp))
  }

  const progress = sanitizeProgress(body.progress)
  if (progress !== undefined) {
    profile.progress = progress
  }

  const config = sanitizeConfig(body.config)
  if (config !== undefined) {
    profile.config = config
  }

  await profile.save()

  const responseConfig = { ...createDefaultLearnConfig(), ...(profile.config || {}) }
  const responseProgress =
    profile.progress && typeof profile.progress === 'object'
      ? JSON.parse(JSON.stringify(profile.progress))
      : {}

  return {
    xp: typeof profile.xp === 'number' ? profile.xp : 0,
    progress: responseProgress,
    config: responseConfig,
  }
})
