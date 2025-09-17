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

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'E-Mail wird benötigt' })
  }

  if (!body.consentPrivacy) {
    throw createError({ statusCode: 400, statusMessage: 'Bitte bestätige die Datenschutzerklärung' })
  }

  if (!body.consentMarketing) {
    throw createError({ statusCode: 400, statusMessage: 'Wir benötigen deine Einwilligung für Produkt-Updates per E-Mail' })
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
      ['E-Mail', email],
      ['Name', name || null],
      ['Quelle', source],
    ]
    await sendAdminNotification({
      event: 'Neue Updates-Liste',
      summary: `Neue Updates-Anmeldung: ${email}`,
      data: dataEntries,
    })
  }

  return {
    success: true,
    alreadySubscribed: !result.created,
  }
})
