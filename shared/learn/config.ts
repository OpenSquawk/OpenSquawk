export interface LessonProgress {
  best: number
  done: boolean
}

export type LearnProgress = Record<string, Record<string, LessonProgress>>

export interface LearnConfig {
  tts: boolean
  radioLevel: number
  audioSpeed: number
  voice: string
  audioChallenge: boolean
}

export interface LearnState {
  xp: number
  progress: LearnProgress
  config: LearnConfig
}

export const LEARN_CONFIG_DEFAULTS: LearnConfig = {
  tts: false,
  radioLevel: 4,
  audioSpeed: 1,
  voice: '',
  audioChallenge: false,
}

export function createDefaultLearnConfig(): LearnConfig {
  return { ...LEARN_CONFIG_DEFAULTS }
}

export function createDefaultLearnState(): LearnState {
  return {
    xp: 0,
    progress: {} as LearnProgress,
    config: createDefaultLearnConfig(),
  }
}
