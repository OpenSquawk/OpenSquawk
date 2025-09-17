import { createError, getQuery } from 'h3'
import { createHash } from 'node:crypto'
import { User } from '../../../../models/User'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = typeof query.token === 'string' ? query.token.trim() : null

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token fehlt.' })
  }

  const hashed = createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpiresAt: { $gt: new Date() },
  })

  return { valid: Boolean(user) }
})
