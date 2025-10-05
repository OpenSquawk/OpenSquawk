import { readBody, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import { sendAdminNotification } from '../../utils/notifications'

const ISSUE_CATEGORIES = ['bug', 'improvement', 'idea', 'question', 'praise', 'other'] as const

type IssueCategory = (typeof ISSUE_CATEGORIES)[number]

interface IssuePayload {
  category?: string
  title?: string
  description?: string
  email?: string
  allowContact?: boolean
  consentPrivacy?: boolean
}

function normalizeCategory(value?: string): IssueCategory | null {
  if (!value) {
    return null
  }

  const lowered = value.trim().toLowerCase()
  return (ISSUE_CATEGORIES.find((category) => category === lowered) as IssueCategory | undefined) ?? null
}

function trimOrNull(value?: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : null
}

export default defineEventHandler(async (event) => {
  const body = await readBody<IssuePayload>(event)

  const category = normalizeCategory(body.category) ?? 'other'
  const title = trimOrNull(body.title)
  const description = trimOrNull(body.description)
  const email = trimOrNull(body.email)?.toLowerCase()
  const allowContact = Boolean(body.allowContact && email)
  const consentPrivacy = Boolean(body.consentPrivacy)

  if (!consentPrivacy) {
    throw createError({ statusCode: 400, statusMessage: 'Please confirm the privacy policy before submitting an issue.' })
  }

  if (!title || title.length < 4) {
    throw createError({ statusCode: 400, statusMessage: 'Issue titles should be at least 4 characters long.' })
  }

  if (!description || description.length < 20) {
    throw createError({ statusCode: 400, statusMessage: 'Please describe the issue with at least 20 characters.' })
  }

  if (body.allowContact && !email) {
    throw createError({ statusCode: 400, statusMessage: 'Add an email address so we can reach you back.' })
  }

  const ticketId = randomUUID()

  await sendAdminNotification({
    event: 'Public feedback issue',
    summary: `Issue ${category} • ${title}`,
    data: [
      ['Ticket ID', ticketId],
      ['Category', category],
      ['Title', title],
      ['Email', email || '—'],
      ['Contact allowed', allowContact],
    ],
    message: description,
    from: email || undefined,
  })

  return {
    success: true,
    ticketId,
  }
})

