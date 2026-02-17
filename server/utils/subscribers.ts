import { UpdateSubscriber } from '../models/UpdateSubscriber'
import type { UpdateSubscriberDocument } from '../models/UpdateSubscriber'

interface RegisterSubscriberOptions {
  email: string
  name?: string
  source?: string
  consentPrivacy: boolean
  consentMarketing: boolean
}

export async function registerUpdateSubscriber(options: RegisterSubscriberOptions) {
  const { email, name, source = 'landing-updates', consentPrivacy, consentMarketing } = options
  const now = new Date()

  const existing = await UpdateSubscriber.findOne({ email })

  if (existing) {
    existing.name = name || existing.name
    existing.source = source || existing.source
    existing.consentPrivacy = existing.consentPrivacy || consentPrivacy
    existing.consentMarketing = existing.consentMarketing || consentMarketing
    existing.lastUpdatedAt = now
    await existing.save()
    return { created: false, document: existing as UpdateSubscriberDocument }
  }

  const document = await UpdateSubscriber.create({
    email,
    name,
    source,
    consentPrivacy,
    consentMarketing,
    subscribedAt: now,
    lastUpdatedAt: now,
  })

  return { created: true, document }
}
