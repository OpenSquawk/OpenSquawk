import { requireUserSession } from '../../utils/auth'
import { PilotProfile } from '../../models/PilotProfile'
import { createDefaultOnboardingProfile } from '~~/shared/onboarding/config'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const profile = await PilotProfile.findOne({ user: user._id })

  if (!profile) {
    return createDefaultOnboardingProfile()
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
