import { defineEventHandler } from 'h3'
import { clearAppSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  clearAppSession(event)
  return { success: true }
})
