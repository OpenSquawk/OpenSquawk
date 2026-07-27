export interface LessonProgress {
  best: number
  done: boolean
  assessmentVersion?: number
  successfulVariants?: number
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
export const CLASSROOM_VARIANTS_FOR_MASTERY = 2

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
