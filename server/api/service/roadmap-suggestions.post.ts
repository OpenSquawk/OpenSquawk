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
    throw createError({ statusCode: 400, statusMessage: 'Bitte gib einen kurzen Titel (mindestens 4 Zeichen) an.' })
  }

  if (!details || details.length < MIN_DETAILS_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: 'Beschreibe deinen Vorschlag mit mindestens 20 Zeichen.' })
  }

  if (!body.consentPrivacy) {
    throw createError({ statusCode: 400, statusMessage: 'Wir benötigen deine Einwilligung zur Datenschutzerklärung.' })
  }

  if (body.allowContact && !email) {
    throw createError({ statusCode: 400, statusMessage: 'Bitte gib eine E-Mail an, damit wir dich kontaktieren können.' })
  }

  const suggestion = await RoadmapSuggestion.create({
    title,
    details,
    email,
    allowContact,
    consentPrivacy: true,
  })

  const dataEntries = [
    { label: 'Titel', value: title },
    { label: 'Beschreibung', value: details },
    { label: 'E-Mail', value: email || null },
    { label: 'Kontaktaufnahme erlaubt', value: allowContact },
  ]

  await sendAdminNotification({
    event: 'Neuer Roadmap-Vorschlag',
    summary: `Neuer Roadmap-Vorschlag: ${title}`,
    data: dataEntries,
  })

  return {
    success: true,
    suggestionId: suggestion._id.toString(),
  }
})
