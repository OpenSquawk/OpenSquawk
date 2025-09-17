import { createError } from 'h3'
import { requireUserSession } from '../../../../utils/auth'
import { RecurringTopup } from '../../../../models/RecurringTopup'
import { cancelMollieSubscription } from '../../../../utils/mollie'

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID fehlt.' })
  }

  const recurring = await RecurringTopup.findOne({ _id: id, user: user._id })
  if (!recurring) {
    throw createError({ statusCode: 404, statusMessage: 'Automatische Aufladung wurde nicht gefunden.' })
  }

  if (recurring.status === 'canceled') {
    return { success: true }
  }

  await cancelMollieSubscription(recurring.mollieCustomerId, recurring.mollieSubscriptionId).catch((err) => {
    console.error('Mollie subscription cancel failed', err)
  })

  recurring.status = 'canceled'
  recurring.canceledAt = new Date()
  await recurring.save()

  return { success: true }
})
