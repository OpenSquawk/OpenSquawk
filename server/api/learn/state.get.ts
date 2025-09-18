import { requireUserSession } from '../../utils/auth'
import { LearnProfile } from '../../models/LearnProfile'
import { createDefaultLearnConfig, createDefaultLearnState } from '~~/shared/learn/config'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const profile = await LearnProfile.findOne({ user: user._id })

  if (!profile) {
    return createDefaultLearnState()
  }

  const config = { ...createDefaultLearnConfig(), ...(profile.config || {}) }
  const progress =
    profile.progress && typeof profile.progress === 'object'
      ? JSON.parse(JSON.stringify(profile.progress))
      : {}

  return {
    xp: typeof profile.xp === 'number' ? profile.xp : 0,
    progress,
    config,
  }
})
