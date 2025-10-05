import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { getClassroomIntroStatus } from '~/utils/classroomIntro'

export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return

  const status = getClassroomIntroStatus()
  if (status === 'pending' && to.path !== '/classroom-introduction') {
    return navigateTo('/classroom-introduction')
  }
})
