import { readBody, createError } from 'h3'
import { RoadmapSuggestion } from '../../models/RoadmapSuggestion'
import { sendAdminNotification } from '../../utils/notifications'

interface RoadmapSuggestionBody {
  title?: string
  details?: string
  email?: string
  allowContact?: boolean
  consentPrivacy?: boolean
}

const MIN_TITLE_LENGTH = 4
const MIN_DETAILS_LENGTH = 20

export default defineEventHandler(async (event) => {
  const body = await readBody<RoadmapSuggestionBody>(event)
  const title = body.title?.trim()
  const details = body.details?.trim()
  const email = body.email?.trim().toLowerCase()
  const allowContact = Boolean(body.allowContact && email)

  if (!title || title.length < MIN_TITLE_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: 'Please provide a short title (at least 4 characters).' })
  }

  if (!details || details.length < MIN_DETAILS_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: 'Please describe your suggestion in at least 20 characters.' })
  }

  if (!body.consentPrivacy) {
    throw createError({ statusCode: 400, statusMessage: 'We need your consent to the privacy policy.' })
  }

  if (body.allowContact && !email) {
    throw createError({ statusCode: 400, statusMessage: 'Please provide an email address so we can contact you.' })
  }

  const suggestion = await RoadmapSuggestion.create({
    title,
    details,
    email,
    allowContact,
    consentPrivacy: true,
  })

  const dataEntries = [
    ['Title', title] as const,
    ['Description', details] as const,
    ['Email', email || null] as const,
    ['Contact allowed', allowContact] as const,
  ]

  await sendAdminNotification({
    event: 'New roadmap suggestion',
    summary: `New roadmap suggestion: ${title}`,
    data: dataEntries,
  })

  return {
    success: true,
    suggestionId: String(suggestion._id),
  }
})
