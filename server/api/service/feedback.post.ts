import { readBody, createError } from 'h3'
import { sendAdminNotification } from '../../utils/notifications'

interface FeedbackPayload {
  name?: string
  email?: string
  excitement?: number
  highlightSelections?: string[]
  highlightNotes?: string
  frictionSelections?: string[]
  frictionNotes?: string
  classroomNotes?: string
  hostingInterest?: string
  otherIdeas?: string
  contactConsent?: boolean
}

const MINIMUM_DETAIL_LENGTH = 12

function sanitizeArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
}

function trimOrNull(value?: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : null
}

export default defineEventHandler(async (event) => {
  const body = await readBody<FeedbackPayload>(event)

  const name = trimOrNull(body.name)
  const email = trimOrNull(body.email)?.toLowerCase()
  const excitement = Number.isFinite(body.excitement) ? Number(body.excitement) : null
  const highlightSelections = sanitizeArray(body.highlightSelections)
  const frictionSelections = sanitizeArray(body.frictionSelections)
  const highlightNotes = trimOrNull(body.highlightNotes)
  const frictionNotes = trimOrNull(body.frictionNotes)
  const classroomNotes = trimOrNull(body.classroomNotes)
  const hostingInterest = trimOrNull(body.hostingInterest)
  const otherIdeas = trimOrNull(body.otherIdeas)
  const contactConsent = Boolean(body.contactConsent && email)

  if (!excitement || excitement < 1 || excitement > 5) {
    throw createError({ statusCode: 400, statusMessage: 'Please share how excited you feel on a 1–5 scale.' })
  }

  const hasDetails = Boolean(
    (highlightNotes && highlightNotes.length >= MINIMUM_DETAIL_LENGTH) ||
      (frictionNotes && frictionNotes.length >= MINIMUM_DETAIL_LENGTH) ||
      (classroomNotes && classroomNotes.length >= MINIMUM_DETAIL_LENGTH) ||
      (hostingInterest && hostingInterest.length >= MINIMUM_DETAIL_LENGTH) ||
      (otherIdeas && otherIdeas.length >= MINIMUM_DETAIL_LENGTH),
  )

  if (!hasDetails) {
    throw createError({ statusCode: 400, statusMessage: 'Please tell us a little more about your experience (at least 12 characters).' })
  }

  await sendAdminNotification({
    event: 'New classroom feedback',
    summary: `Feedback • excitement ${excitement}`,
    data: [
      ['Name', name || '—'],
      ['Email', email || '—'],
      ['Okay to follow up', contactConsent],
      ['Overall excitement', excitement],
      ['Highlights picked', highlightSelections.length ? highlightSelections : ['—']],
      ['Pain points picked', frictionSelections.length ? frictionSelections : ['—']],
    ],
    message: [
      highlightNotes ? `Highlights notes: ${highlightNotes}` : null,
      frictionNotes ? `Friction notes: ${frictionNotes}` : null,
      classroomNotes ? `Classroom stories: ${classroomNotes}` : null,
      hostingInterest ? `Hosting & deployment: ${hostingInterest}` : null,
      otherIdeas ? `Big ideas: ${otherIdeas}` : null,
    ]
      .filter((line): line is string => Boolean(line))
      .join('\n\n'),
    from: name && email ? `${name} <${email}>` : email || undefined,
  })

  return {
    success: true,
  }
})

