export type Simulator = 'msfs2024' | 'msfs2020' | 'xplane12' | 'other'
export type OperatingSystem = 'windows' | 'mac' | 'linux'
export type HardwareItem = 'keyboard_mouse' | 'hotas' | 'yoke_pedals' | 'multi_monitor'
export type NetworkExperience = 'vatsim' | 'ivao'
export type RadioPainPoint = 'readbacks' | 'fast_controllers' | 'phraseology' | 'accents' | 'none'
export type ToolkitItem = 'navigraph' | 'simbrief' | 'sayintentions' | 'beyondatc' | 'pilotedge'
export type ToolkitDuration = 'trying' | 'few_months' | 'six_plus_months' | 'cant_fly_without'
export type FeatureWish =
  | 'live_ai_atc'
  | 'more_airports'
  | 'network_integration'
  | 'structured_lessons'
  | 'voice_packs'
  | 'faster_stt'
  | 'progress_badges'
export type PricingPreference = 'one_time' | 'monthly' | 'season_pass' | 'free_self_host'

export interface OnboardingOption<T extends string> {
  value: T
  label: string
  icon: string
}

export const SIMULATOR_OPTIONS: OnboardingOption<Simulator>[] = [
  { value: 'msfs2024', label: 'MSFS 2024', icon: 'mdi-microsoft' },
  { value: 'msfs2020', label: 'MSFS 2020', icon: 'mdi-microsoft' },
  { value: 'xplane12', label: 'X-Plane 12', icon: 'mdi-airplane' },
  { value: 'other', label: 'Something else', icon: 'mdi-help-circle-outline' },
]

export const OS_OPTIONS: OnboardingOption<OperatingSystem>[] = [
  { value: 'windows', label: 'Windows', icon: 'mdi-microsoft-windows' },
  { value: 'mac', label: 'macOS', icon: 'mdi-apple' },
  { value: 'linux', label: 'Linux', icon: 'mdi-linux' },
]

export const HARDWARE_OPTIONS: OnboardingOption<HardwareItem>[] = [
  { value: 'keyboard_mouse', label: 'Keyboard & mouse', icon: 'mdi-keyboard-outline' },
  { value: 'hotas', label: 'HOTAS / joystick', icon: 'mdi-controller-classic-outline' },
  { value: 'yoke_pedals', label: 'Yoke & pedals', icon: 'mdi-steering' },
  { value: 'multi_monitor', label: 'Multi-monitor / cockpit build', icon: 'mdi-monitor-multiple' },
]

export const RADIO_CONFIDENCE_LABELS: Record<number, string> = {
  1: 'First solo jitters',
  2: 'Getting the hang of it',
  3: 'Comfortable most days',
  4: 'Rarely rattled',
  5: 'Sounds like a real dispatcher',
}

export const RADIO_PAIN_POINT_OPTIONS: OnboardingOption<RadioPainPoint>[] = [
  { value: 'readbacks', label: 'Getting readbacks right', icon: 'mdi-repeat' },
  { value: 'fast_controllers', label: 'Fast-talking controllers', icon: 'mdi-speedometer' },
  { value: 'phraseology', label: 'Remembering phraseology', icon: 'mdi-book-alphabet' },
  { value: 'accents', label: 'Understanding accents', icon: 'mdi-ear-hearing' },
  { value: 'none', label: "Honestly, I'm solid", icon: 'mdi-check-decagram' },
]

export const NETWORK_OPTIONS: OnboardingOption<NetworkExperience>[] = [
  { value: 'vatsim', label: 'VATSIM', icon: 'mdi-account-group' },
  { value: 'ivao', label: 'IVAO', icon: 'mdi-account-group-outline' },
]

export const TOOLKIT_OPTIONS: OnboardingOption<ToolkitItem>[] = [
  { value: 'navigraph', label: 'Navigraph', icon: 'mdi-map-marker-path' },
  { value: 'simbrief', label: 'SimBrief', icon: 'mdi-clipboard-flow-outline' },
  { value: 'sayintentions', label: 'SayIntentions', icon: 'mdi-chat-processing-outline' },
  { value: 'beyondatc', label: 'BeyondATC', icon: 'mdi-radio-tower' },
  { value: 'pilotedge', label: 'PilotEdge', icon: 'mdi-account-voice' },
]

/** Subscription/paid tools — selecting one of these reveals the "how long?" follow-up. */
export const PAID_TOOLKIT_VALUES: ToolkitItem[] = ['navigraph', 'sayintentions', 'beyondatc', 'pilotedge']

export const TOOLKIT_DURATION_OPTIONS: OnboardingOption<ToolkitDuration>[] = [
  { value: 'trying', label: 'Just trying it', icon: 'mdi-flask-outline' },
  { value: 'few_months', label: 'A few months', icon: 'mdi-calendar-month-outline' },
  { value: 'six_plus_months', label: '6+ months', icon: 'mdi-calendar-check-outline' },
  { value: 'cant_fly_without', label: "Can't fly without it", icon: 'mdi-heart' },
]

export const FEATURE_WISH_OPTIONS: OnboardingOption<FeatureWish>[] = [
  { value: 'live_ai_atc', label: 'More realistic live AI ATC', icon: 'mdi-robot-outline' },
  { value: 'more_airports', label: 'More airports & scenarios', icon: 'mdi-airport' },
  { value: 'network_integration', label: 'VATSIM/IVAO-style network integration', icon: 'mdi-lan-connect' },
  { value: 'structured_lessons', label: 'Structured Classroom lessons', icon: 'mdi-school-outline' },
  { value: 'voice_packs', label: 'Custom controller voice packs', icon: 'mdi-account-voice' },
  { value: 'faster_stt', label: 'Faster, offline-capable speech recognition', icon: 'mdi-lightning-bolt-outline' },
  { value: 'progress_badges', label: 'Progress tracking & badges', icon: 'mdi-medal-outline' },
]

export const MAX_FEATURE_WISHES = 2

export const PRICING_PREFERENCE_OPTIONS: OnboardingOption<PricingPreference>[] = [
  { value: 'one_time', label: 'One-time unlock — I own it', icon: 'mdi-lock-open-variant-outline' },
  { value: 'monthly', label: 'Small monthly add-on, always latest', icon: 'mdi-calendar-sync-outline' },
  { value: 'season_pass', label: 'Bundle / season pass', icon: 'mdi-ticket-confirmation-outline' },
  { value: 'free_self_host', label: "I'd rather stay free-tier / self-host", icon: 'mdi-server-network-outline' },
]

export const ONBOARDING_TOTAL_STEPS = 7

export interface OnboardingProfileFields {
  simulator: Simulator | null
  os: OperatingSystem | null
  hardware: HardwareItem[]
  radioConfidence: number | null
  radioPainPoint: RadioPainPoint | null
  networkExperience: NetworkExperience[]
  toolkit: ToolkitItem[]
  toolkitDuration: Partial<Record<ToolkitItem, ToolkitDuration>>
  topFeatures: FeatureWish[]
  pricingPreference: PricingPreference | null
  resultCallsign: string | null
  completedAt: string | null
  skippedAt: string | null
}

export function createDefaultOnboardingProfile(): OnboardingProfileFields {
  return {
    simulator: null,
    os: null,
    hardware: [],
    radioConfidence: null,
    radioPainPoint: null,
    networkExperience: [],
    toolkit: [],
    toolkitDuration: {},
    topFeatures: [],
    pricingPreference: null,
    resultCallsign: null,
    completedAt: null,
    skippedAt: null,
  }
}
