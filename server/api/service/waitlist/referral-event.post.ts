import { createError, readBody } from 'h3'
import { WaitlistEntry } from '../../../models/WaitlistEntry'
import { normalizeWaitlistReferralToken } from '../../../utils/waitlistReferrals'

interface ReferralEventRequestBody {
  event?: string
  referralToken?: string
  method?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ReferralEventRequestBody>(event)
  const eventName = body.event?.trim()

  if (eventName !== 'share_clicked') {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported referral event' })
  }

  const referralToken = normalizeWaitlistReferralToken(body.referralToken)
  if (!referralToken) {
    throw createError({ statusCode: 400, statusMessage: 'Valid referral token is required' })
  }

  const entry = await WaitlistEntry.findOne({ referralToken })
  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Referral owner not found' })
  }

  entry.referralShareClicks = Math.max(0, Number(entry.referralShareClicks || 0)) + 1
  entry.lastReferralShareAt = new Date()
  entry.markModified('referralShareClicks')

  await entry.save()

  return {
    success: true,
    event: eventName,
    method: body.method?.trim() || 'unknown',
  }
})
