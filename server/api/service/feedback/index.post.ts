import { createError, readBody } from 'h3'
import { sendAdminNotification } from '../../../utils/notifications'

interface FeedbackRequestBody {
  name?: string
  email?: string
  discordHandle?: string
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

function ensureRating(value: unknown) {
  if (typeof value !== 'number') {
    return null
  }
  if (!Number.isFinite(value)) {
    return null
  }
  const rounded = Math.round(value)
  if (rounded < 1 || rounded > 5) {
    return null
  }
  return rounded
}

function normaliseText(value?: string | null) {
  return value?.trim() || ''
}

function normaliseArray(value?: string[] | null) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<FeedbackRequestBody>(event)

  const excitement = ensureRating(body.excitement)
  if (!excitement) {
    throw createError({ statusCode: 400, statusMessage: 'Please rate your excitement from 1 to 5.' })
  }

  const name = normaliseText(body.name)
  const email = normaliseText(body.email)
  const discordHandle = normaliseText(body.discordHandle)
  const highlightNotes = normaliseText(body.highlightNotes)
  const frictionNotes = normaliseText(body.frictionNotes)
  const classroomNotes = normaliseText(body.classroomNotes)
  const hostingInterest = normaliseText(body.hostingInterest)
  const otherIdeas = normaliseText(body.otherIdeas)
  const highlightSelections = normaliseArray(body.highlightSelections)
  const frictionSelections = normaliseArray(body.frictionSelections)
  const allowContact = Boolean(body.contactConsent)

  const details: string[] = []
  details.push(`Overall excitement: ${excitement}/5`)
  details.push(`Highlights: ${highlightSelections.length ? highlightSelections.join(', ') : '—'}`)
  if (discordHandle) {
    details.push('')
    details.push(`Discord: ${discordHandle}`)
  }
  if (highlightNotes) {
    details.push('')
    details.push('Highlight notes:')
    details.push(highlightNotes)
  }
  details.push('')
  details.push(`Friction: ${frictionSelections.length ? frictionSelections.join(', ') : '—'}`)
  if (frictionNotes) {
    details.push('')
    details.push('Friction notes:')
    details.push(frictionNotes)
  }
  details.push('')
  details.push('Classroom stories:')
  details.push(classroomNotes || '—')
  details.push('')
  details.push('Hosting & deployment:')
  details.push(hostingInterest || '—')
  details.push('')
  details.push('Big ideas & requests:')
  details.push(otherIdeas || '—')

  const summaryParts = [`Excitement ${excitement}/5`]
  if (name) {
    summaryParts.push(`from ${name}`)
  }

  await sendAdminNotification({
    event: 'Feedback submission',
    summary: `New feedback ${summaryParts.join(' ')}`,
    message: details.join('\n'),
    data: [
      ['Name', name || '—'],
      ['Email', email || '—'],
      ['Discord', discordHandle || '—'],
      ['Okay to contact', allowContact ? 'Yes' : 'No'],
    ],
    from: email || undefined,
  })

  return { success: true }
})
