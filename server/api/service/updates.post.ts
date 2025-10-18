import { readBody, createError } from 'h3'
import { registerUpdateSubscriber } from '../../utils/subscribers'
import { sendAdminNotification } from '../../utils/notifications'

interface UpdatesRequestBody {
  email?: string
  name?: string
  consentPrivacy?: boolean
  consentMarketing?: boolean
  source?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<UpdatesRequestBody>(event)
  const email = body.email?.trim().toLowerCase()
  const name = body.name?.trim()
  const source = body.source?.trim() || 'landing-updates'
  const fromAddress = email ? (name ? `${name} <${email}>` : email) : undefined

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required' })
  }

  if (!body.consentPrivacy) {
    throw createError({ statusCode: 400, statusMessage: 'Please confirm the privacy policy' })
  }

  if (!body.consentMarketing) {
    throw createError({ statusCode: 400, statusMessage: 'We need your consent to email you product updates' })
  }

  const result = await registerUpdateSubscriber({
    email,
    name,
    source,
    consentPrivacy: true,
    consentMarketing: true,
  })

  if (result.created) {
    const dataEntries = [
      ['Email', email],
      ['Name', name || null],
      ['Source', source],
    ]
    await sendAdminNotification({
      event: 'New updates signup',
      summary: `New updates signup: ${email}`,
      data: dataEntries,
      replyTo: fromAddress,
    })
  }

  return {
    success: true,
    alreadySubscribed: !result.created,
  }
})
