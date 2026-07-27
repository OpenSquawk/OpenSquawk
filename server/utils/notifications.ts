interface MailOptions {
  to: string
  subject: string
  text?: string
  html?: string
  from?: string
  replyTo?: string
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
  return from || process.env.NOTIFY_EMAIL_FROM || 'OpenSquawk <no-reply@localhost>'
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
      html: payload.html,
      replyTo: payload.replyTo,
    })
    return true
  } catch (error) {
    console.error('Failed to send email via SMTP', error)
    return false
  }
}

export async function sendMail(options: MailOptions) {
  if (!options.text && !options.html) {
    throw new Error('Email payload requires text or html content')
  }

  const payload: MailPayload = {
    ...options,
    from: resolveFrom(options.from),
  }

  const success = await sendViaSmtp(payload)
  if (!success) {
    const preview = options.text || options.html || ''
    console.info(`[mail:fallback] ${options.subject}\nRecipient: ${options.to}\n${preview}`)
  }
  return success
}
