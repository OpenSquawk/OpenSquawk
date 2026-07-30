export interface LessonProgress {
  best: number
  done: boolean
  assessmentVersion?: number
  successfulVariants?: number
  /**
   * Signatures of the rolled scenarios already passed for this lesson, so the
   * same variation cannot be counted twice — not even across page reloads.
   */
  variantSignatures?: string[]
}

export type LearnProgress = Record<string, Record<string, LessonProgress>>

export interface LearnConfig {
  tts: boolean
  radioLevel: number
  voice: string
  audioChallenge: boolean
  audioSpeed: number
}

export interface LearnState {
  /** Legacy compatibility only. Classroom no longer awards or displays XP. */
  xp: number
  progress: LearnProgress
  config: LearnConfig
  /** Legacy compatibility only. All Classroom modules are now available. */
  unlockedModules: string[]
}

export const CLASSROOM_ASSESSMENT_VERSION = 2

/**
 * Clean variations required before a lesson counts as mastered. Short drills
 * need less repetition than a full scenario, so the bar rises with module
 * complexity. Every lesson rolls a fresh scenario, so the material is there.
 */
export const CLASSROOM_VARIANTS_BY_MODULE: Record<string, number> = {
  'normalize': 3,
  'arc': 4,
  'decision-tree': 4,
  'full-flight': 5,
}

export const CLASSROOM_VARIANTS_DEFAULT = 3

export function variantsForModule(moduleId: string): number {
  return CLASSROOM_VARIANTS_BY_MODULE[moduleId] ?? CLASSROOM_VARIANTS_DEFAULT
}

export const LEARN_CONFIG_DEFAULTS: LearnConfig = {
  tts: false,
  radioLevel: 5,
  voice: '',
  audioChallenge: true,
  audioSpeed: 0.85,
}

export function createDefaultLearnConfig(): LearnConfig {
  return { ...LEARN_CONFIG_DEFAULTS }
}

export function createDefaultLearnState(): LearnState {
  return {
    xp: 0,
    progress: {} as LearnProgress,
    config: createDefaultLearnConfig(),
    unlockedModules: [],
  }
}
