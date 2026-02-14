export interface LessonProgress {
  best: number
  done: boolean
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
  xp: number
  progress: LearnProgress
  config: LearnConfig
  unlockedModules: string[]
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
