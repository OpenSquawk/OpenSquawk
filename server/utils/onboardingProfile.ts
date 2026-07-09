import {
  SIMULATOR_OPTIONS, OS_OPTIONS, HARDWARE_OPTIONS, RADIO_PAIN_POINT_OPTIONS,
  NETWORK_OPTIONS, TOOLKIT_OPTIONS, PAID_TOOLKIT_VALUES, TOOLKIT_DURATION_OPTIONS,
  FEATURE_WISH_OPTIONS, PRICING_PREFERENCE_OPTIONS, MAX_FEATURE_WISHES,
} from '~~/shared/onboarding/config'
import type {
  FeatureWish, HardwareItem, NetworkExperience, OperatingSystem, PricingPreference,
  RadioPainPoint, Simulator, ToolkitDuration, ToolkitItem,
} from '~~/shared/onboarding/config'

const SIMULATOR_VALUES = new Set(SIMULATOR_OPTIONS.map(o => o.value))
const OS_VALUES = new Set(OS_OPTIONS.map(o => o.value))
const HARDWARE_VALUES = new Set(HARDWARE_OPTIONS.map(o => o.value))
const RADIO_PAIN_POINT_VALUES = new Set(RADIO_PAIN_POINT_OPTIONS.map(o => o.value))
const NETWORK_VALUES = new Set(NETWORK_OPTIONS.map(o => o.value))
const TOOLKIT_VALUES = new Set(TOOLKIT_OPTIONS.map(o => o.value))
const TOOLKIT_DURATION_VALUES = new Set(TOOLKIT_DURATION_OPTIONS.map(o => o.value))
const FEATURE_WISH_VALUES = new Set(FEATURE_WISH_OPTIONS.map(o => o.value))
const PRICING_PREFERENCE_VALUES = new Set(PRICING_PREFERENCE_OPTIONS.map(o => o.value))
const PAID_TOOLKIT_SET = new Set(PAID_TOOLKIT_VALUES)

function dedupeFiltered<T extends string>(input: unknown, allowed: Set<T>): T[] {
  if (!Array.isArray(input)) return []
  return Array.from(new Set(input.filter((v): v is T => typeof v === 'string' && allowed.has(v as T))))
}

export interface OnboardingUpdateInput {
  simulator?: unknown
  os?: unknown
  hardware?: unknown
  radioConfidence?: unknown
  radioPainPoint?: unknown
  networkExperience?: unknown
  toolkit?: unknown
  toolkitDuration?: unknown
  topFeatures?: unknown
  pricingPreference?: unknown
  completed?: unknown
  skipped?: unknown
}

export interface SanitizedOnboardingUpdate {
  simulator?: Simulator
  os?: OperatingSystem
  hardware?: HardwareItem[]
  radioConfidence?: number
  radioPainPoint?: RadioPainPoint
  networkExperience?: NetworkExperience[]
  toolkit?: ToolkitItem[]
  toolkitDuration?: Partial<Record<ToolkitItem, ToolkitDuration>>
  topFeatures?: FeatureWish[]
  pricingPreference?: PricingPreference
  completed?: boolean
  skipped?: boolean
}

/** WHY: os is only meaningful when simulator === 'other' — MSFS/X-Plane imply Windows/cross-platform already. */
export function sanitizeOnboardingUpdate(body: OnboardingUpdateInput): SanitizedOnboardingUpdate {
  const result: SanitizedOnboardingUpdate = {}

  if (typeof body.simulator === 'string' && SIMULATOR_VALUES.has(body.simulator as Simulator)) {
    result.simulator = body.simulator as Simulator
  }

  if (result.simulator === 'other' && typeof body.os === 'string' && OS_VALUES.has(body.os as OperatingSystem)) {
    result.os = body.os as OperatingSystem
  }

  if (body.hardware !== undefined) {
    result.hardware = dedupeFiltered(body.hardware, HARDWARE_VALUES)
  }

  if (typeof body.radioConfidence === 'number' && Number.isFinite(body.radioConfidence)) {
    result.radioConfidence = Math.min(5, Math.max(1, Math.round(body.radioConfidence)))
  }

  if (typeof body.radioPainPoint === 'string' && RADIO_PAIN_POINT_VALUES.has(body.radioPainPoint as RadioPainPoint)) {
    result.radioPainPoint = body.radioPainPoint as RadioPainPoint
  }

  if (body.networkExperience !== undefined) {
    result.networkExperience = dedupeFiltered(body.networkExperience, NETWORK_VALUES)
  }

  let toolkit: ToolkitItem[] | undefined
  if (body.toolkit !== undefined) {
    toolkit = dedupeFiltered(body.toolkit, TOOLKIT_VALUES)
    result.toolkit = toolkit
  }

  if (body.toolkitDuration !== undefined && body.toolkitDuration && typeof body.toolkitDuration === 'object') {
    const allowedTools = toolkit ?? []
    const duration: Partial<Record<ToolkitItem, ToolkitDuration>> = {}
    for (const [tool, value] of Object.entries(body.toolkitDuration as Record<string, unknown>)) {
      if (
        PAID_TOOLKIT_SET.has(tool as ToolkitItem) &&
        allowedTools.includes(tool as ToolkitItem) &&
        typeof value === 'string' &&
        TOOLKIT_DURATION_VALUES.has(value as ToolkitDuration)
      ) {
        duration[tool as ToolkitItem] = value as ToolkitDuration
      }
    }
    result.toolkitDuration = duration
  }

  if (body.topFeatures !== undefined) {
    result.topFeatures = dedupeFiltered(body.topFeatures, FEATURE_WISH_VALUES).slice(0, MAX_FEATURE_WISHES)
  }

  if (typeof body.pricingPreference === 'string' && PRICING_PREFERENCE_VALUES.has(body.pricingPreference as PricingPreference)) {
    result.pricingPreference = body.pricingPreference as PricingPreference
  }

  if (body.completed === true) result.completed = true
  if (body.skipped === true) result.skipped = true

  return result
}

interface CallsignInput {
  networkExperience?: NetworkExperience[]
  radioConfidence?: number
  toolkit?: ToolkitItem[]
  toolkitDuration?: Partial<Record<ToolkitItem, ToolkitDuration>>
  hardware?: HardwareItem[]
  pricingPreference?: PricingPreference
}

const LONG_TERM_DURATIONS = new Set<ToolkitDuration>(['six_plus_months', 'cant_fly_without'])

/**
 * Ordered rule list — first match wins. WHY ordered: a user can match multiple
 * archetypes (e.g. long-term Navigraph subscriber who also flies VATSIM); the
 * order reflects which signal is the strongest predictor for pricing conversations.
 */
export function computeResultCallsign(profile: CallsignInput): string {
  const hasLongTermPaidTool = (profile.toolkit ?? []).some(
    tool => LONG_TERM_DURATIONS.has(profile.toolkitDuration?.[tool] as ToolkitDuration),
  )

  if (hasLongTermPaidTool && profile.pricingPreference === 'monthly') {
    return 'Subscription-Ready Power User'
  }

  if (profile.pricingPreference === 'free_self_host') {
    return 'Freeware Purist'
  }

  if ((profile.hardware ?? []).some(h => h === 'yoke_pedals' || h === 'multi_monitor')) {
    return 'Cockpit Builder'
  }

  if ((profile.networkExperience ?? []).length > 0 && (profile.radioConfidence ?? 5) <= 3) {
    return 'Weekend VATSIM Learner'
  }

  if ((profile.networkExperience ?? []).length > 0) {
    return 'Network-Ready Radio Pro'
  }

  return 'Cleared for Takeoff'
}
