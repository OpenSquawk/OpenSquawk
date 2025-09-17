import { useRuntimeConfig } from '#imports'

interface SendMailPayload {
  to: string
  subject: string
  text: string
  html?: string
}

async function sendViaResend(payload: SendMailPayload, apiKey: string, from: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html || `<pre>${payload.text}</pre>`,
    }),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText)
    throw new Error(`Resend API error: ${response.status} ${details}`)
  }
}

async function sendViaWebhook(payload: SendMailPayload, url: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText)
    throw new Error(`Webhook mail provider error: ${response.status} ${details}`)
  }
}

export async function sendMail(payload: SendMailPayload) {
  const config = useRuntimeConfig()
  const mailConfig = (config.mail as any) || {}
  const provider = String(mailConfig.provider || 'console').toLowerCase()
  const from = (mailConfig.from as string) || 'OpenSquawk <no-reply@opensquawk.local>'

  if (!payload.html) {
    payload.html = `<p>${payload.text.replace(/\n/g, '<br/>')}</p>`
  }

  try {
    if (provider === 'resend' && mailConfig.resendApiKey) {
      await sendViaResend(payload, mailConfig.resendApiKey as string, from)
      return
    }

    if (mailConfig.webhookUrl) {
      await sendViaWebhook(payload, mailConfig.webhookUrl as string)
      return
    }

    console.info('[mail:console]', { ...payload, from })
  } catch (err) {
    console.error('Mail delivery failed', err)
    throw err
  }
}
