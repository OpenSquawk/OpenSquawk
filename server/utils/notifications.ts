const ADMIN_EMAIL_FALLBACK = 'info@opensquawk.de'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const ADMIN_NOTIFICATION_SUBJECT_PREFIX = process.env.NOTIFY_SUBJECT_PREFIX || '[OpenSquawk Web]'

type NotificationPrimitive = string | number | boolean | Date | null | undefined
type NotificationValue =
  | NotificationPrimitive
  | NotificationPrimitive[]
  | Record<string, NotificationPrimitive>

type NotificationData = Record<string, NotificationValue> | Array<[string, NotificationValue]>

export interface AdminNotificationOptions {
  event: string
  summary?: string
  data?: NotificationData
  to?: string
  from?: string
}

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

function resolveNotificationSubject(event: string) {
  const trimmedEvent = event.trim()
  if (!trimmedEvent) {
    return ADMIN_NOTIFICATION_SUBJECT_PREFIX
  }

  if (trimmedEvent.toLowerCase().startsWith(ADMIN_NOTIFICATION_SUBJECT_PREFIX.toLowerCase())) {
    return trimmedEvent
  }

  return `${ADMIN_NOTIFICATION_SUBJECT_PREFIX} ${trimmedEvent}`
}

function toNotificationEntries(data?: NotificationData): Array<[string, NotificationValue]> {
  if (!data) {
    return []
  }

  if (Array.isArray(data)) {
    return data
  }

  return Object.entries(data)
}

function formatNotificationValue(value: NotificationValue): string {
  if (value === null || value === undefined) {
    return '—'
  }

  if (Array.isArray(value)) {
    const formatted = value
      .map((entry) => formatNotificationValue(entry))
      .filter((entry) => entry && entry !== '—')
    return formatted.length ? formatted.join(', ') : '—'
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  if (typeof value === 'boolean') {
    return value ? 'Ja' : 'Nein'
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : '—'
  }

  return String(value)
}

function formatDataEntries(entries: Array<[string, NotificationValue]>) {
  return entries.map(([label, rawValue]) => {
    const formattedValue = formatNotificationValue(rawValue)
    if (formattedValue.includes('\n')) {
      const indented = formattedValue
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')
      return `• ${label}:\n${indented}`
    }

    return `• ${label}: ${formattedValue}`
  })
}

function buildAdminNotificationText(options: AdminNotificationOptions) {
  const lines: string[] = []
  const summary = options.summary?.trim()
  if (summary) {
    lines.push(summary)
  } else {
    lines.push(`Neue Aktivität auf der Website: ${options.event}`)
  }

  const dataEntries = formatDataEntries([
    ['Ereignis', options.event],
    ...toNotificationEntries(options.data),
  ])

  if (dataEntries.length) {
    lines.push('')
    lines.push('Details:')
    lines.push(...dataEntries)
  }

  return lines.join('\n')
}

export async function sendAdminNotification(options: AdminNotificationOptions) {
  const to = options.to || process.env.NOTIFY_EMAIL_TO || ADMIN_EMAIL_FALLBACK
  const subject = resolveNotificationSubject(options.event)
  const text = buildAdminNotificationText(options)

  const success = await sendMailInternal({
    to,
    subject,
    text,
    from: options.from,
  })

  if (!success) {
    console.info(`[notify:fallback] ${subject}\nEmpfänger: ${to}\n${text}`)
  }

  return success
}
