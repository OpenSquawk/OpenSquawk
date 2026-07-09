import { readBody } from 'h3'
import { requireUserSession } from '../../utils/auth'
import { PilotProfile } from '../../models/PilotProfile'
import { LearnProfile } from '../../models/LearnProfile'
import { createDefaultLearnConfig } from '~~/shared/learn/config'
import { sanitizeOnboardingUpdate, computeResultCallsign, type OnboardingUpdateInput } from '../../utils/onboardingProfile'

/** WHY inverted: a low self-rated confidence should start the learner on the clearest,
 * least-static audio (radioLevel 5); a confident pilot gets more static (radioLevel 1). */
function radioConfidenceToLearnLevel(radioConfidence: number): number {
  return Math.min(5, Math.max(1, 6 - radioConfidence))
}

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const body = await readBody<OnboardingUpdateInput>(event)
  const update = sanitizeOnboardingUpdate(body)

  let profile = await PilotProfile.findOne({ user: user._id })
  if (!profile) {
    profile = new PilotProfile({ user: user._id })
  }

  if (update.simulator !== undefined) profile.simulator = update.simulator
  if (update.os !== undefined) profile.os = update.os
  if (update.hardware !== undefined) profile.hardware = update.hardware
  if (update.radioConfidence !== undefined) profile.radioConfidence = update.radioConfidence
  if (update.radioPainPoint !== undefined) profile.radioPainPoint = update.radioPainPoint
  if (update.networkExperience !== undefined) profile.networkExperience = update.networkExperience
  if (update.toolkit !== undefined) profile.toolkit = update.toolkit
  if (update.toolkitDuration !== undefined) profile.toolkitDuration = update.toolkitDuration
  if (update.topFeatures !== undefined) profile.topFeatures = update.topFeatures
  if (update.pricingPreference !== undefined) profile.pricingPreference = update.pricingPreference

  if (update.skipped) {
    profile.skippedAt = new Date()
  }

  if (update.completed) {
    profile.resultCallsign = computeResultCallsign(profile.toObject())
    profile.completedAt = new Date()
  }

  await profile.save()

  if (update.radioConfidence !== undefined) {
    const learnLevel = radioConfidenceToLearnLevel(update.radioConfidence)
    let learnProfile = await LearnProfile.findOne({ user: user._id })
    if (!learnProfile) {
      learnProfile = new LearnProfile({ user: user._id })
    }
    learnProfile.config = { ...createDefaultLearnConfig(), ...(learnProfile.config || {}), radioLevel: learnLevel }
    await learnProfile.save()
  }

  return {
    simulator: profile.simulator ?? null,
    os: profile.os ?? null,
    hardware: profile.hardware ?? [],
    radioConfidence: profile.radioConfidence ?? null,
    radioPainPoint: profile.radioPainPoint ?? null,
    networkExperience: profile.networkExperience ?? [],
    toolkit: profile.toolkit ?? [],
    toolkitDuration: profile.toolkitDuration ?? {},
    topFeatures: profile.topFeatures ?? [],
    pricingPreference: profile.pricingPreference ?? null,
    resultCallsign: profile.resultCallsign ?? null,
    completedAt: profile.completedAt ? profile.completedAt.toISOString() : null,
    skippedAt: profile.skippedAt ? profile.skippedAt.toISOString() : null,
  }
})
