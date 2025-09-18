import { readBody } from 'h3'
import { requireUserSession } from '../../utils/auth'
import { LearnProfile } from '../../models/LearnProfile'
import type { LearnConfig, LearnProgress, LessonProgress } from '~~/shared/learn/config'
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

  if (typeof input.voice === 'string') {
    config.voice = input.voice.slice(0, 120)
  }

  return config
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
