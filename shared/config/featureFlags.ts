/**
 * OpenSquawk capability tiers.
 *
 * The open-source core is self-hostable and covers basic radio training.
 * Cloud, AI feedback, premium voices/scenarios and team features are the
 * commercial layer that funds ongoing development. These flags mark which
 * capability belongs to which tier so the boundary stays explicit in code
 * rather than being an implicit business decision.
 *
 * See /open-source and /self-host-vs-cloud for the user-facing version of
 * this table, and COMMERCIAL.md / TRADEMARK.md for the licensing terms.
 */

export const FEATURE_FLAGS = [
  'FREE_CORE',          // basic radio training, local scenarios, plugin API — self-hostable
  'CLOUD_HOSTED',       // official hosted setup, managed sessions
  'PRO_AI_DEBRIEF',     // AI debriefing / VATSIM-ready score
  'PRO_VOICE',          // premium voice models
  'PRO_SCENARIOS',      // premium scenario packs
  'CLUB_TEAMS',         // group / club team features
  'COMMERCIAL_LICENSE', // instructor / commercial usage
] as const

export type FeatureFlag = (typeof FEATURE_FLAGS)[number]

export type FeatureTier = 'core' | 'cloud' | 'pro' | 'club' | 'commercial'

/** Maps each capability flag to the tier it belongs to. */
export const FEATURE_TIER: Record<FeatureFlag, FeatureTier> = {
  FREE_CORE: 'core',
  CLOUD_HOSTED: 'cloud',
  PRO_AI_DEBRIEF: 'pro',
  PRO_VOICE: 'pro',
  PRO_SCENARIOS: 'pro',
  CLUB_TEAMS: 'club',
  COMMERCIAL_LICENSE: 'commercial',
}

/** Capabilities available in a plain self-hosted (open-source core) deployment. */
export const SELF_HOST_FLAGS: readonly FeatureFlag[] = ['FREE_CORE']

export function isSelfHostable(flag: FeatureFlag): boolean {
  return SELF_HOST_FLAGS.includes(flag)
}
