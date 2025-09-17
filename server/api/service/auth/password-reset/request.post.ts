import { createError, readBody } from 'h3'
import { randomBytes, createHash } from 'node:crypto'
import { User } from '../../../../models/User'
import { sendMail } from '../../../../utils/email'
import { useRuntimeConfig } from '#imports'

interface RequestBody {
  email?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RequestBody>(event)
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Bitte gib deine E-Mail-Adresse an.' })
  }

  const user = await User.findOne({ email })
  if (!user) {
    return { success: true }
  }

  const token = randomBytes(32).toString('hex')
  const hashed = createHash('sha256').update(token).digest('hex')
  user.passwordResetToken = hashed
  user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 60)
  await user.save()

  const config = useRuntimeConfig()
  const baseUrl = (config.public.appBaseUrl as string) || 'http://localhost:3000'
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`

  const subject = 'OpenSquawk Passwort zurücksetzen'
  const text = [
    `Hallo${user.name ? ' ' + user.name : ''},`,
    '',
    'du hast eine Zurücksetzung deines Passworts angefordert.',
    'Nutze den folgenden Link, um ein neues Passwort zu vergeben (gültig für 60 Minuten):',
    resetUrl,
    '',
    'Wenn du das nicht warst, kannst du diese Nachricht ignorieren.',
    '',
    'Blue skies,',
    'dein OpenSquawk Team',
  ].join('\n')

  try {
    await sendMail({
      to: user.email,
      subject,
      text,
    })
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'E-Mail-Versand fehlgeschlagen. Bitte später erneut versuchen.' })
  }

  return { success: true }
})
