const ADMIN_EMAIL_FALLBACK = 'opensquawk@faktorxmensch.com'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

async function sendViaResend(subject: string, text: string) {
  const apiKey = process.env.NOTIFY_RESEND_API_KEY
  if (!apiKey) {
    return false
  }

  const to = process.env.NOTIFY_EMAIL_TO || ADMIN_EMAIL_FALLBACK
  const from = process.env.NOTIFY_EMAIL_FROM || 'OpenSquawk <no-reply@opensquawk.dev>'

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Failed to send notification via Resend API', response.status, errorText)
      return false
    }

    return true
  } catch (error) {
    console.error('Error while sending notification via Resend API', error)
    return false
  }
}

async function sendViaSmtp(subject: string, text: string) {
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

  const to = process.env.NOTIFY_EMAIL_TO || ADMIN_EMAIL_FALLBACK
  const from = process.env.NOTIFY_EMAIL_FROM || 'OpenSquawk <no-reply@opensquawk.dev>'

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number.isNaN(port) ? secure ? 465 : 587 : port,
      secure,
      auth: {
        user,
        pass,
      },
    })

    await transporter.sendMail({ from, to, subject, text })
    return true
  } catch (error) {
    console.error('Failed to send notification via SMTP', error)
    return false
  }
}

export async function sendAdminNotification(subject: string, text: string) {
  const sentViaResend = await sendViaResend(subject, text)
  if (sentViaResend) {
    return true
  }

  const sentViaSmtp = await sendViaSmtp(subject, text)
  if (sentViaSmtp) {
    return true
  }

  const to = process.env.NOTIFY_EMAIL_TO || ADMIN_EMAIL_FALLBACK
  console.info(`[notify:fallback] ${subject}\nEmpfänger: ${to}\n${text}`)
  return false
}
