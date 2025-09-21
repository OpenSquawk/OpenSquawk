export interface LessonProgress {
  best: number
  done: boolean
}

export type LearnProgress = Record<string, Record<string, LessonProgress>>

import type { MissionContext } from '~~/shared/learn/types'

export interface LearnConfig {
  tts: boolean
  radioLevel: number
  voice: string
  audioChallenge: boolean
  audioSpeed: number
  missionContexts: Record<string, MissionContext>
}

export interface LearnState {
  xp: number
  progress: LearnProgress
  config: LearnConfig
}

export const LEARN_CONFIG_DEFAULTS: LearnConfig = {
  tts: false,
  radioLevel: 4,
  voice: '',
  audioChallenge: true,
  audioSpeed: 1,
  missionContexts: {},
}

export function createDefaultLearnConfig(): LearnConfig {
  return { ...LEARN_CONFIG_DEFAULTS, missionContexts: {} }
}

export function createDefaultLearnState(): LearnState {
  return {
    xp: 0,
    progress: {} as LearnProgress,
    config: createDefaultLearnConfig(),
  }
}
