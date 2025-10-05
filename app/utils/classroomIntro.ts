export const CLASSROOM_INTRO_STATUS_KEY = 'os_classroom_intro_status'

export type ClassroomIntroStatus = 'pending' | 'completed'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getClassroomIntroStatus(): ClassroomIntroStatus | null {
  if (!isBrowser()) return null
  const value = window.localStorage.getItem(CLASSROOM_INTRO_STATUS_KEY)
  return value === 'pending' || value === 'completed' ? value : null
}

export function setClassroomIntroStatus(status: ClassroomIntroStatus) {
  if (!isBrowser()) return
  window.localStorage.setItem(CLASSROOM_INTRO_STATUS_KEY, status)
}

export function markClassroomIntroPending() {
  setClassroomIntroStatus('pending')
}

export function markClassroomIntroCompleted() {
  setClassroomIntroStatus('completed')
}

export function isClassroomIntroPending() {
  return getClassroomIntroStatus() === 'pending'
}
