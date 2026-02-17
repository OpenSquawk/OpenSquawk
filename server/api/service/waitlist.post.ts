import { readBody, createError, getRequestURL, type H3Event } from 'h3'
import { WaitlistEntry, type WaitlistEntryDocument } from '../../models/WaitlistEntry'
import { sendAdminNotification } from '../../utils/notifications'
import { registerUpdateSubscriber } from '../../utils/subscribers'
import {
  generateWaitlistReferralToken,
  normalizeWaitlistReferralToken,
} from '../../utils/waitlistReferrals'

interface WaitlistRequestBody {
  email?: string
  name?: string
  notes?: string
  consentPrivacy?: boolean
  consentTerms?: boolean
  source?: string
  wantsProductUpdates?: boolean
  referralToken?: string
}

type NotificationDataEntry = [string, ...unknown[]]
const MAX_REFERRAL_TOKEN_ATTEMPTS = 8

function isSameWaitlistEntry(a?: WaitlistEntryDocument | null, b?: WaitlistEntryDocument | null) {
  if (!a || !b) return false
  return String((a as any)._id) === String((b as any)._id)
}

async function createUniqueReferralToken() {
  for (let attempt = 0; attempt < MAX_REFERRAL_TOKEN_ATTEMPTS; attempt += 1) {
    const token = generateWaitlistReferralToken()
    const exists = await WaitlistEntry.exists({ referralToken: token })
    if (!exists) {
      return token
    }
  }

  throw createError({
    statusCode: 503,
    statusMessage: 'Could not issue referral token. Please try again.',
  })
}

function buildReferralUrl(event: H3Event, token: string) {
  const requestUrl = getRequestURL(event)
  const params = new URLSearchParams({ ref: token })
  return `${requestUrl.origin}/?${params.toString()}#cta`
}

async function applyReferralAttribution(referrer?: WaitlistEntryDocument | null) {
  if (!referrer) {
    return
  }

  referrer.referralJoins = Math.max(0, Number(referrer.referralJoins || 0)) + 1
  await referrer.save()
}

export default defineEventHandler(async (event) => {
  const body = await readBody<WaitlistRequestBody>(event)
  const email = body.email?.trim().toLowerCase()
  const name = body.name?.trim()
  const notes = body.notes?.trim()
  const source = body.source?.trim() || 'landing'
  const wantsProductUpdates = Boolean(body.wantsProductUpdates)
  const normalizedReferralToken = normalizeWaitlistReferralToken(body.referralToken)
  const fromAddress = email ? (name ? `${name} <${email}>` : email) : undefined

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required' })
  }

  if (!body.consentPrivacy || !body.consentTerms) {
    throw createError({ statusCode: 400, statusMessage: 'Accepting the terms and privacy policy is required' })
  }

  const now = new Date()
  const referrer = normalizedReferralToken
    ? await WaitlistEntry.findOne({ referralToken: normalizedReferralToken })
    : null
  const referralSource = referrer ? `${source}-referral` : source

  const existing = await WaitlistEntry.findOne({ email })

  if (existing) {
    const previouslyWantedUpdates = Boolean(existing.wantsProductUpdates)
    const canAttributeReferral =
      !existing.referredBy &&
      Boolean(referrer) &&
      !isSameWaitlistEntry(existing, referrer) &&
      referrer?.email !== email

    if (!existing.referralToken) {
      existing.referralToken = await createUniqueReferralToken()
    }
    const existingReferralToken = existing.referralToken as string

    if (canAttributeReferral && referrer) {
      existing.referredBy = referrer._id as any
    }

    existing.name = name || existing.name
    existing.notes = notes || existing.notes
    existing.source = referralSource
    existing.consentPrivacy = true
    existing.consentTerms = true
    if (wantsProductUpdates && !previouslyWantedUpdates) {
      existing.wantsProductUpdates = true
      existing.updatesOptedInAt = now
    }
    await existing.save()

    if (canAttributeReferral) {
      await applyReferralAttribution(referrer)
    }

    if (wantsProductUpdates) {
      const updateResult = await registerUpdateSubscriber({
        email,
        name,
        source: `${referralSource}-waitlist`,
        consentPrivacy: true,
        consentMarketing: true,
      })

      if (!previouslyWantedUpdates && updateResult.created) {
        const dataEntries: NotificationDataEntry[] = [
          ['Email', email],
        ]
        if (name) {
          dataEntries.push(['Name', name])
        }
        if (notes) {
          dataEntries.push(['Notes', notes])
        }
        dataEntries.push(['Source', referralSource])
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
      referralToken: existingReferralToken,
      referralUrl: buildReferralUrl(event, existingReferralToken),
      referralAttributed: canAttributeReferral,
      referralJoins: Number(existing.referralJoins || 0),
    }
  }

  const referralToken = await createUniqueReferralToken()
  const canAttributeReferral = Boolean(referrer) && referrer?.email !== email

  const entry = await WaitlistEntry.create({
    email,
    name,
    notes,
    source: referralSource,
    consentPrivacy: true,
    consentTerms: true,
    joinedAt: now,
    wantsProductUpdates,
    updatesOptedInAt: wantsProductUpdates ? now : undefined,
    referralToken,
    referredBy: canAttributeReferral && referrer ? (referrer._id as any) : undefined,
  })

  if (canAttributeReferral) {
    await applyReferralAttribution(referrer)
  }

  if (wantsProductUpdates) {
    await registerUpdateSubscriber({
      email,
      name,
      source: `${referralSource}-waitlist`,
      consentPrivacy: true,
      consentMarketing: true,
    })
  }

  const dataEntries: NotificationDataEntry[] = [
    ['Email', email],
  ]
  if (name) {
    dataEntries.push(['Name', name])
  }
  if (notes) {
    dataEntries.push(['Notes', notes])
  }
  dataEntries.push(['Source', referralSource])
  dataEntries.push(['Opt-in', wantsProductUpdates ? 'Product updates' : 'Waitlist only'])
  if (canAttributeReferral && referrer) {
    dataEntries.push(['Referral', normalizedReferralToken as string])
  }

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
    referralToken,
    referralUrl: buildReferralUrl(event, referralToken),
    referralAttributed: canAttributeReferral,
    referralJoins: Number(entry.referralJoins || 0),
  }
})
