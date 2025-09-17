const ADMIN_EMAIL_FALLBACK = 'info@opensquawk.de'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

interface MailOptions {
  to: string
  subject: string
  text: string
  from?: string
}

interface MailPayload extends MailOptions {
  from: string
}

function resolveFrom(from?: string) {
  return from || process.env.NOTIFY_EMAIL_FROM || 'OpenSquawk <no-reply@opensquawk.dev>'
}

async function sendViaResend(payload: MailPayload) {
  const apiKey = process.env.NOTIFY_RESEND_API_KEY
  if (!apiKey) {
    return false
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Failed to send email via Resend API', response.status, errorText)
      return false
    }

    return true
  } catch (error) {
    console.error('Error while sending email via Resend API', error)
    return false
  }
}

async function sendViaSmtp(payload: MailPayload) {
  const host = process.env.NOTIFY_SMTP_HOST
  if (!host) {
    return false
  }

  const user = process.env.NOTIFY_SMTP_USER
  const pass = process.env.NOTIFY_SMTP_PASS
  if (!user || !pass) {
    console.warn('SMTP notification is configured without credentials – skipping send.')
    return false
  }

  const port = Number.parseInt(process.env.NOTIFY_SMTP_PORT || '', 10)
  const secure = process.env.NOTIFY_SMTP_SECURE === 'true'

  let nodemailer: any = null
  try {
    const module = await import('nodemailer')
    nodemailer = module.default ?? module
  } catch (error) {
    console.warn('nodemailer is not available. Skipping SMTP notification.', error)
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number.isNaN(port) ? (secure ? 465 : 587) : port,
      secure,
      auth: {
        user,
        pass,
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

async function sendMailInternal(options: MailOptions) {
  const payload: MailPayload = {
    ...options,
    from: resolveFrom(options.from),
  }

  const sentViaResend = await sendViaResend(payload)
  if (sentViaResend) {
    return true
  }

  const sentViaSmtp = await sendViaSmtp(payload)
  if (sentViaSmtp) {
    return true
  }

  return false
}

export async function sendMail(options: MailOptions) {
  const success = await sendMailInternal(options)
  if (!success) {
    console.info(`[mail:fallback] ${options.subject}\nEmpfänger: ${options.to}\n${options.text}`)
  }
  return success
}

export async function sendAdminNotification(subject: string, text: string) {
  const to = process.env.NOTIFY_EMAIL_TO || ADMIN_EMAIL_FALLBACK
  const success = await sendMailInternal({ to, subject, text })
  if (!success) {
    console.info(`[notify:fallback] ${subject}\nEmpfänger: ${to}\n${text}`)
  }
  return success
}
