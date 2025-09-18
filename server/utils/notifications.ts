const ADMIN_EMAIL_FALLBACK = 'info@opensquawk.de'

type NotificationDataValue = string | number | boolean | null | undefined

interface NotificationDataEntry {
  label: string
  value: NotificationDataValue
}

export interface AdminNotificationPayload {
  event: string
  summary: string
  /**
   * Optional free form message that should be used as the email body.
   * When omitted a message is generated from {@link event} and {@link data}.
   */
  message?: string
  data?: ReadonlyArray<NotificationDataEntry>
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

function formatNotificationValue(value: NotificationDataValue): string {
  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'Ja' : 'Nein'
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\r\n/g, '\n')
    const trimmed = normalized.trim()
    return trimmed.length > 0 ? trimmed : '—'
  }

  return String(value)
}

function formatNotificationData(entries?: ReadonlyArray<NotificationDataEntry>): string[] {
  if (!entries?.length) {
    return []
  }

  const lines: string[] = ['Details:']

  for (const { label, value } of entries) {
    const formatted = formatNotificationValue(value)
    const valueLines = formatted.split('\n')

    if (valueLines.length === 1) {
      lines.push(`- ${label}: ${valueLines[0]}`)
    } else {
      lines.push(`- ${label}:`)
      for (const line of valueLines) {
        lines.push(`    ${line}`)
      }
    }
  }

  return lines
}

function buildNotificationMessage(payload: AdminNotificationPayload): string {
  const sections: string[] = []

  const message = payload.message?.trim()
  if (message) {
    sections.push(message)
  } else {
    const event = payload.event.trim()
    if (event) {
      sections.push(event)
    }

    const dataLines = formatNotificationData(payload.data)
    if (dataLines.length) {
      if (sections.length) {
        sections.push('')
      }
      sections.push(...dataLines)
    }
  }

  if (!sections.length) {
    sections.push(payload.summary)
  }

  return sections.join('\n')
}

function isAdminNotificationPayload(
  value: string | AdminNotificationPayload,
): value is AdminNotificationPayload {
  return typeof value === 'object' && value !== null && 'event' in value && 'summary' in value
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
    text: options.text ?? '',
    from: resolveFrom(options.from),
  }

  const success = await sendViaSmtp(payload)
  if (!success) {
    console.info(`[mail:fallback] ${payload.subject}\nEmpfänger: ${payload.to}\n${payload.text}`)
  }
  return success
}

export async function sendAdminNotification(payload: AdminNotificationPayload): Promise<boolean>
export async function sendAdminNotification(subject: string, text: string): Promise<boolean>
export async function sendAdminNotification(
  subjectOrPayload: string | AdminNotificationPayload,
  maybeText?: string,
) {
  const defaultRecipient = process.env.NOTIFY_EMAIL_TO || ADMIN_EMAIL_FALLBACK

  if (!isAdminNotificationPayload(subjectOrPayload)) {
    const text = maybeText ?? ''
    const success = await sendMail({ to: defaultRecipient, subject: subjectOrPayload, text })
    if (!success) {
      console.info(`[notify:fallback] ${subjectOrPayload}\nEmpfänger: ${defaultRecipient}\n${text}`)
    }
    return success
  }

  const payload = subjectOrPayload
  const to = payload.to || defaultRecipient
  const text = buildNotificationMessage(payload)
  const success = await sendMail({ to, from: payload.from, subject: payload.summary, text })
  if (!success) {
    console.info(`[notify:fallback] ${payload.summary}\nEmpfänger: ${to}\n${text}`)
  }
  return success
}
