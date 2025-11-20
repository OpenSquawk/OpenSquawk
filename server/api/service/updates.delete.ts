import { createError, readBody } from 'h3'
import { UpdateSubscriber } from '../../models/UpdateSubscriber'
import { WaitlistEntry } from '../../models/WaitlistEntry'

interface UnsubscribeRequestBody {
  email?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<UnsubscribeRequestBody>(event)
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required' })
  }

  const [updateResult, waitlistResult] = await Promise.all([
    UpdateSubscriber.deleteOne({ email }),
    WaitlistEntry.deleteOne({ email }),
  ])

  const removed = Boolean(updateResult.deletedCount || waitlistResult.deletedCount)

  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: 'No matching email found' })
  }

  return {
    success: true,
    removedFromUpdates: updateResult.deletedCount > 0,
    removedFromWaitlist: waitlistResult.deletedCount > 0,
  }
})
