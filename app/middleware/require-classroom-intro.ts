import {CLASSROOM_INTRO_STORAGE_KEY} from '~~/shared/constants/storage'

export default defineNuxtRouteMiddleware(() => {
  if (process.server) return

  const introComplete = localStorage.getItem(CLASSROOM_INTRO_STORAGE_KEY) === 'true'
  if (!introComplete) {
    return navigateTo('/classroom-introduction')
  }
})
