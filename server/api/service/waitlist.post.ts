import { readBody, createError } from 'h3'
import { WaitlistEntry } from '../../models/WaitlistEntry'
import { sendAdminNotification } from '../../utils/notifications'
import { registerUpdateSubscriber } from '../../utils/subscribers'

interface WaitlistRequestBody {
  email?: string
  name?: string
  notes?: string
  consentPrivacy?: boolean
  consentTerms?: boolean
  source?: string
  wantsProductUpdates?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<WaitlistRequestBody>(event)
  const email = body.email?.trim().toLowerCase()
  const name = body.name?.trim()
  const notes = body.notes?.trim()
  const source = body.source?.trim() || 'landing'
  const wantsProductUpdates = Boolean(body.wantsProductUpdates)

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'E-Mail wird benötigt' })
  }

  if (!body.consentPrivacy || !body.consentTerms) {
    throw createError({ statusCode: 400, statusMessage: 'Zustimmung zu AGB und Datenschutz ist erforderlich' })
  }

  const now = new Date()

  const existing = await WaitlistEntry.findOne({ email })

  if (existing) {
    const previouslyWantedUpdates = Boolean(existing.wantsProductUpdates)
    existing.name = name || existing.name
    existing.notes = notes || existing.notes
    existing.source = source
    existing.consentPrivacy = true
    existing.consentTerms = true
    if (wantsProductUpdates && !previouslyWantedUpdates) {
      existing.wantsProductUpdates = true
      existing.updatesOptedInAt = now
    }
    await existing.save()

    if (wantsProductUpdates) {
      const updateResult = await registerUpdateSubscriber({
        email,
        name,
        source: `${source}-waitlist`,
        consentPrivacy: true,
        consentMarketing: true,
      })

      if (!previouslyWantedUpdates && updateResult.created) {
        const dataEntries = [
          { label: 'E-Mail', value: email },
        ]
        if (name) {
          dataEntries.push({ label: 'Name', value: name })
        }
        if (notes) {
          dataEntries.push({ label: 'Notizen', value: notes })
        }
        dataEntries.push({ label: 'Quelle', value: source })
        dataEntries.push({ label: 'Opt-In', value: 'Produkt-Updates' })

        await sendAdminNotification({
          event: 'Neue Updates-Liste (via Warteliste)',
          summary: `Produkt-Updates Opt-in (Warteliste): ${email}`,
          data: dataEntries,
        })
      }
    }

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
    wantsProductUpdates,
    updatesOptedInAt: wantsProductUpdates ? now : undefined,
  })

  if (wantsProductUpdates) {
    await registerUpdateSubscriber({
      email,
      name,
      source: `${source}-waitlist`,
      consentPrivacy: true,
      consentMarketing: true,
    })
  }

  const dataEntries = [
    { label: 'E-Mail', value: email },
  ]
  if (name) {
    dataEntries.push({ label: 'Name', value: name })
  }
  if (notes) {
    dataEntries.push({ label: 'Notizen', value: notes })
  }
  dataEntries.push({ label: 'Quelle', value: source })
  dataEntries.push({ label: 'Opt-In', value: wantsProductUpdates ? 'Produkt-Updates' : 'Nur Warteliste' })

  await sendAdminNotification({
    event: 'Neue Wartelisten-Anmeldung',
    summary: `Neue Wartelisten-Anmeldung: ${email}`,
    data: dataEntries,
  })

  return {
    success: true,
    alreadyJoined: false,
    joinedAt: entry.joinedAt,
  }
})

