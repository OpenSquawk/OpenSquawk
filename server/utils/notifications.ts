const ADMIN_EMAIL_FALLBACK = 'info@opensquawk.de'

interface MailOptions {
  to: string
  subject: string
  text: string
  from?: string
}

interface MailPayload extends MailOptions {
  from: string
}

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

function resolveFrom(from?: string) {
  return from || process.env.NOTIFY_EMAIL_FROM || 'OpenSquawk <no-reply@opensquawk.dev>'
}

function resolveSmtpConfig(): SmtpConfig | null {
  const host = process.env.NOTIFY_SMTP_HOST?.trim()
  const user = process.env.NOTIFY_SMTP_USER?.trim()
  const pass = process.env.NOTIFY_SMTP_PASS?.trim()

  if (!host || !user || !pass) {
    console.warn('SMTP notification is not fully configured. Please set NOTIFY_SMTP_HOST, NOTIFY_SMTP_USER and NOTIFY_SMTP_PASS.')
    return null
  }

  const secure = (process.env.NOTIFY_SMTP_SECURE || '').toLowerCase() === 'true'
  const parsedPort = Number.parseInt(process.env.NOTIFY_SMTP_PORT || '', 10)
  const port = Number.isNaN(parsedPort) ? (secure ? 465 : 587) : parsedPort

  return { host, user, pass, secure, port }
}

async function sendViaSmtp(payload: MailPayload) {
  const config = resolveSmtpConfig()
  if (!config) {
    return false
  }

  let nodemailer: any = null
  try {
    const module = await import('nodemailer')
    nodemailer = module.default ?? module
  } catch (error) {
    console.error('nodemailer is not available. Install the dependency to send SMTP emails.', error)
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })

    await transporter.sendMail({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    })
    return true
  } catch (error) {
    console.error('Failed to send email via SMTP', error)
    return false
  }
}

export async function sendMail(options: MailOptions) {
  const payload: MailPayload = {
    ...options,
    from: resolveFrom(options.from),
  }

  const success = await sendViaSmtp(payload)
  if (!success) {
    console.info(`[mail:fallback] ${options.subject}\nEmpfänger: ${options.to}\n${options.text}`)
  }
  return success
}

export async function sendAdminNotification(subject: string, text: string) {
  const to = process.env.NOTIFY_EMAIL_TO || ADMIN_EMAIL_FALLBACK
  const success = await sendMail({ to, subject, text })
  if (!success) {
    console.info(`[notify:fallback] ${subject}\nEmpfänger: ${to}\n${text}`)
  }
  return success
}
