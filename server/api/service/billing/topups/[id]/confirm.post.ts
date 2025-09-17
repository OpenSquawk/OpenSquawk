import { createError, readBody } from 'h3'
import { requireUserSession } from '../../../../../utils/auth'
import { PaymentTransaction } from '../../../../../models/PaymentTransaction'
import { User } from '../../../../../models/User'

interface ConfirmBody {
  receivedAmountCents?: number
}

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Nur Admins können Aufladungen bestätigen.' })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Transaktions-ID fehlt.' })
  }

  const body = await readBody<ConfirmBody>(event)
  const transaction = await PaymentTransaction.findById(id)
  if (!transaction) {
    throw createError({ statusCode: 404, statusMessage: 'Transaktion nicht gefunden.' })
  }

  if (transaction.method !== 'sepa_transfer') {
    throw createError({ statusCode: 400, statusMessage: 'Nur SEPA-Überweisungen können bestätigt werden.' })
  }

  if (transaction.status === 'completed') {
    return { success: true }
  }

  const creditCents = body.receivedAmountCents ?? transaction.amountCents
  const userAccount = await User.findById(transaction.user)
  if (!userAccount) {
    throw createError({ statusCode: 404, statusMessage: 'Nutzer nicht gefunden.' })
  }

  userAccount.balanceCents += creditCents + (transaction.bonusCents || 0)
  await userAccount.save()

  transaction.status = 'completed'
  transaction.completedAt = new Date()
  transaction.metadata = {
    ...(transaction.metadata || {}),
    receivedAmountCents: creditCents,
    confirmedBy: String(user._id),
    confirmedAt: transaction.completedAt,
  }
  await transaction.save()

  return { success: true, balanceCents: userAccount.balanceCents }
})
