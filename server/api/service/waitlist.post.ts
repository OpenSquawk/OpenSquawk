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
  const fromAddress = email ? (name ? `${name} <${email}>` : email) : undefined

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required' })
  }

  if (!body.consentPrivacy || !body.consentTerms) {
    throw createError({ statusCode: 400, statusMessage: 'Accepting the terms and privacy policy is required' })
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
          ['Email', email],
        ]
        if (name) {
          dataEntries.push(['Name', name])
        }
        if (notes) {
          dataEntries.push(['Notes', notes])
        }
        dataEntries.push(['Source', source])
        dataEntries.push(['Opt-in', 'Product updates'])

        await sendAdminNotification({
          event: 'New updates signup (waitlist)',
          summary: `Product updates opt-in (waitlist): ${email}`,
          data: dataEntries,
          replyTo: fromAddress,
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
    ['Email', email],
  ]
  if (name) {
    dataEntries.push(['Name', name])
  }
  if (notes) {
    dataEntries.push(['Notes', notes])
  }
  dataEntries.push(['Source', source])
  dataEntries.push(['Opt-in', wantsProductUpdates ? 'Product updates' : 'Waitlist only'])

  await sendAdminNotification({
    event: 'New waitlist signup',
    summary: `New waitlist signup: ${email}`,
    data: dataEntries,
    replyTo: fromAddress,
  })

  return {
    success: true,
    alreadyJoined: false,
    joinedAt: entry.joinedAt,
  }
})

