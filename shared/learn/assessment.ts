import {
  CLASSROOM_ASSESSMENT_VERSION,
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
  options: { modelAnswerRevealed: boolean; signature: string; threshold: number },
): ProgressUpdate {
  const currentVersion = previous?.assessmentVersion === CLASSROOM_ASSESSMENT_VERSION
  const previousVariants = currentVersion ? (previous?.successfulVariants || 0) : 0
  const previousSignatures = currentVersion ? (previous?.variantSignatures || []) : []

  const counted = assessment.passed
    && !options.modelAnswerRevealed
    && !previousSignatures.includes(options.signature)

  const variantSignatures = counted
    ? [...previousSignatures, options.signature]
    : previousSignatures
  const successfulVariants = Math.min(
    options.threshold,
    previousVariants + (counted ? 1 : 0),
  )

  return {
    counted,
    progress: {
      best: Math.max(previous?.best || 0, assessment.score),
      // Sticky: raising the threshold must never revoke a check mark someone
      // already earned under the old bar.
      done: (currentVersion && previous?.done === true) || successfulVariants >= options.threshold,
      assessmentVersion: CLASSROOM_ASSESSMENT_VERSION,
      successfulVariants,
      variantSignatures,
    },
  }
}

/**
 * `done` already encodes the module threshold that applied when it was set, so
 * it is the single source of truth. Entries from before the versioned
 * assessment still need a review pass.
 */
export function isCurrentMastery(progress: LessonProgress | undefined): boolean {
  return Boolean(
    progress?.assessmentVersion === CLASSROOM_ASSESSMENT_VERSION
    && progress.done,
  )
}
