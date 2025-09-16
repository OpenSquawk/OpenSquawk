import { readBody, createError } from 'h3'
import { WaitlistEntry } from '../../models/WaitlistEntry'

interface WaitlistRequestBody {
  email?: string
  name?: string
  notes?: string
  consentPrivacy?: boolean
  consentTerms?: boolean
  source?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<WaitlistRequestBody>(event)
  const email = body.email?.trim().toLowerCase()
  const name = body.name?.trim()
  const notes = body.notes?.trim()
  const source = body.source?.trim() || 'landing'

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'E-Mail wird benötigt' })
  }

  if (!body.consentPrivacy || !body.consentTerms) {
    throw createError({ statusCode: 400, statusMessage: 'Zustimmung zu AGB und Datenschutz ist erforderlich' })
  }

  const now = new Date()

  const existing = await WaitlistEntry.findOne({ email })

  if (existing) {
    existing.name = name || existing.name
    existing.notes = notes || existing.notes
    existing.source = source
    existing.consentPrivacy = true
    existing.consentTerms = true
    await existing.save()
    return {
      success: true,
      alreadyJoined: true,
      joinedAt: existing.joinedAt,
    }
  }

  const entry = await WaitlistEntry.create({
    email,
    name,
    notes,
    source,
    consentPrivacy: true,
    consentTerms: true,
    joinedAt: now,
  })

  return {
    success: true,
    alreadyJoined: false,
    joinedAt: entry.joinedAt,
  }
})

