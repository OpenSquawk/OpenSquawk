import { createError, readBody } from 'h3'
import { randomUUID } from 'node:crypto'
import { sendAdminNotification } from '../../../utils/notifications'

interface FeedbackIssueRequest {
  title?: string
  description?: string
  categories?: string[]
  contactEmail?: string
}

function sanitize(value?: string | null) {
  return value?.trim() || ''
}

function sanitizeCategories(value?: string[]) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
    .slice(0, 10)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<FeedbackIssueRequest>(event)

  const title = sanitize(body.title)
  const description = sanitize(body.description)
  const categories = sanitizeCategories(body.categories)
  const contactEmail = sanitize(body.contactEmail)
  const fromAddress = contactEmail || undefined

  if (title.length < 4) {
    throw createError({ statusCode: 400, statusMessage: 'Title must be at least 4 characters long.' })
  }

  if (description.length < 20) {
    throw createError({ statusCode: 400, statusMessage: 'Description must be at least 20 characters long.' })
  }

  if (categories.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Please select at least one category.' })
  }

  const reportId = randomUUID()

  const lines: string[] = []
  lines.push(`Title: ${title}`)
  lines.push(`Categories: ${categories.join(', ')}`)
  lines.push('')
  lines.push(description)

  await sendAdminNotification({
    event: 'Public feedback report',
    summary: `Feedback report: ${title}`,
    message: lines.join('\n'),
    data: [
      ['Report ID', reportId],
      ['Categories', categories.join(', ')],
      ['Contact email', contactEmail || '—'],
    ],
    replyTo: fromAddress,
  })

  return {
    success: true,
    reportId,
  }
})
