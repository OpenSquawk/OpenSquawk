import {
  CLASSROOM_ASSESSMENT_VERSION,
  CLASSROOM_VARIANTS_FOR_MASTERY,
  type LessonProgress,
} from './config'

export type AssessableField = {
  key: string
  required: boolean
  pass: boolean
  similarity: number
}

export type AssessmentSummary = {
  score: number
  hits: number
  required: number
  similarity: number
  passed: boolean
}

export function assessRequiredFields(fields: AssessableField[]): AssessmentSummary | null {
  const requiredFields = fields.filter(field => field.required)
  if (!requiredFields.length) return null

  const hits = requiredFields.filter(field => field.pass).length
  const similarity = requiredFields.reduce((sum, field) => sum + field.similarity, 0) / requiredFields.length

  return {
    score: Math.round(similarity * 100),
    hits,
    required: requiredFields.length,
    similarity,
    passed: hits === requiredFields.length,
  }
}

export type ProgressUpdate = {
  progress: LessonProgress
  counted: boolean
}

export function updateMasteryProgress(
  previous: LessonProgress | undefined,
  assessment: AssessmentSummary,
  options: { modelAnswerRevealed: boolean; variantAlreadyCounted: boolean },
): ProgressUpdate {
  const currentVersion = previous?.assessmentVersion === CLASSROOM_ASSESSMENT_VERSION
  const previousVariants = currentVersion ? (previous?.successfulVariants || 0) : 0
  const counted = assessment.passed && !options.modelAnswerRevealed && !options.variantAlreadyCounted
  const successfulVariants = Math.min(
    CLASSROOM_VARIANTS_FOR_MASTERY,
    previousVariants + (counted ? 1 : 0),
  )

  return {
    counted,
    progress: {
      best: Math.max(previous?.best || 0, assessment.score),
      done: successfulVariants >= CLASSROOM_VARIANTS_FOR_MASTERY,
      assessmentVersion: CLASSROOM_ASSESSMENT_VERSION,
      successfulVariants,
    },
  }
}

export function isCurrentMastery(progress: LessonProgress | undefined): boolean {
  return Boolean(
    progress?.assessmentVersion === CLASSROOM_ASSESSMENT_VERSION
    && progress.done
    && (progress.successfulVariants || 0) >= CLASSROOM_VARIANTS_FOR_MASTERY,
  )
}
