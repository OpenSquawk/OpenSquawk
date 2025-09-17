import { createError, readBody } from 'h3'
import { requireUserSession } from '../../../utils/auth'
import { PaymentTransaction } from '../../../models/PaymentTransaction'
import { RecurringTopup } from '../../../models/RecurringTopup'
import { ensureMollieCustomer, createMolliePayment, getMollieWebhookUrl } from '../../../utils/mollie'
import { centsToEuroString, getSepaBonusCents } from '../../../utils/billing'
import { useRuntimeConfig } from '#imports'

interface TopupBody {
  amountCents?: number
  method?: 'mollie' | 'sepa_transfer'
  recurring?: boolean
}

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  const body = await readBody<TopupBody>(event)

  const amountCents = Math.round(body.amountCents || 0)
  if (!amountCents || amountCents < 100) {
    throw createError({ statusCode: 400, statusMessage: 'Der Mindestbetrag für Aufladungen liegt bei 1,00 €.' })
  }

  const method = body.method || 'mollie'
  if (!['mollie', 'sepa_transfer'].includes(method)) {
    throw createError({ statusCode: 400, statusMessage: 'Unbekannte Zahlungsmethode.' })
  }

  if (method === 'mollie') {
    const config = useRuntimeConfig()
    if (!config.mollie?.apiKey) {
      throw createError({ statusCode: 503, statusMessage: 'Mollie ist nicht konfiguriert.' })
    }

    if (body.recurring) {
      const existing = await RecurringTopup.findOne({
        user: user._id,
        status: { $in: ['active', 'paused'] },
      })
      if (existing) {
        throw createError({ statusCode: 400, statusMessage: 'Es existiert bereits eine aktive automatische Aufladung.' })
      }
    }

    const customerId = await ensureMollieCustomer({ email: user.email, name: user.name }, user.mollieCustomerId)
    if (!user.mollieCustomerId || user.mollieCustomerId !== customerId) {
      user.mollieCustomerId = customerId
      await user.save()
    }

    const transaction = await PaymentTransaction.create({
      user: user._id,
      type: 'topup',
      method: 'mollie',
      status: 'pending',
      amountCents,
      bonusCents: 0,
      description: body.recurring ? 'Automatische Guthaben-Aufladung einrichten' : 'Guthaben-Aufladung',
      metadata: {
        recurring: body.recurring ? '1' : '0',
        interval: '1 months',
      },
    })

    const baseUrl = ((config.public.appBaseUrl as string) || 'http://localhost:3000').replace(/\/$/, '')
    const redirectUrl = `${baseUrl}/account?payment=success`
    const webhookUrl = getMollieWebhookUrl() || `${baseUrl}/api/service/billing/mollie-webhook`

    const sequenceType = body.recurring ? (user.mollieMandateId ? 'recurring' : 'first') : 'oneoff'

    const payment = await createMolliePayment({
      amount: { currency: 'EUR', value: centsToEuroString(amountCents) },
      description: body.recurring ? 'OpenSquawk automatische Aufladung' : 'OpenSquawk Guthaben-Aufladung',
      redirectUrl,
      webhookUrl,
      customerId,
      sequenceType,
      metadata: {
        transactionId: String(transaction._id),
        userId: String(user._id),
        recurring: body.recurring ? '1' : '0',
        interval: '1 months',
      },
    })

    if (!payment._links?.checkout?.href) {
      throw createError({ statusCode: 500, statusMessage: 'Mollie-Zahlung konnte nicht erstellt werden.' })
    }

    transaction.molliePaymentId = payment.id
    await transaction.save()

    return {
      transactionId: String(transaction._id),
      checkoutUrl: payment._links.checkout.href,
    }
  }

  // SEPA Überweisung
  const config = useRuntimeConfig()
  const sepaConfig = config.sepa as any
  if (!sepaConfig?.iban || !sepaConfig?.holder) {
    throw createError({ statusCode: 503, statusMessage: 'SEPA-Daten sind nicht vollständig konfiguriert.' })
  }

  const bonusCents = getSepaBonusCents()
  const reference = `${(sepaConfig.referencePrefix || 'OSQ').toString().toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`

  const transaction = await PaymentTransaction.create({
    user: user._id,
    type: 'topup',
    method: 'sepa_transfer',
    status: 'pending',
    amountCents,
    bonusCents,
    description: 'SEPA-Guthaben-Aufladung',
    metadata: {
      reference,
      expectedAmountCents: amountCents,
    },
  })

  return {
    transactionId: String(transaction._id),
    amountCents,
    bonusCents,
    reference,
    instructions: {
      iban: sepaConfig.iban,
      bic: sepaConfig.bic || null,
      holder: sepaConfig.holder,
      amountEuros: centsToEuroString(amountCents),
    },
  }
})
