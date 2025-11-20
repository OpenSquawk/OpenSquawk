import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

type CachedTemplates = {
  invitations: string | null
  feedback: string | null
}

const cachedTemplates: CachedTemplates = {
  invitations: null,
  feedback: null,
}

export function generateInvitationCode() {
  return randomBytes(4).toString('hex').toUpperCase()
}

function buildUnsubscribeUrl(email?: string) {
  const baseUrl = 'https://opensquawk.de/unsubscribe'
  if (!email) {
    return baseUrl
  }

  const params = new URLSearchParams({ email })
  return `${baseUrl}?${params.toString()}`
}

async function loadTemplate(kind: keyof CachedTemplates, filename: string, fallback: string) {
  if (cachedTemplates[kind]) {
    return cachedTemplates[kind] as string
  }

  const templatePath = join(process.cwd(), 'public', 'docs', filename)

  try {
    const file = await readFile(templatePath, 'utf8')
    cachedTemplates[kind] = file
    return file
  } catch (error) {
    console.warn(`Could not load ${kind} email template, falling back to plain HTML.`, error)
    cachedTemplates[kind] = fallback
    return fallback
  }
}

export async function renderInvitationEmail(code: string, email?: string) {
  const template = await loadTemplate(
    'invitations',
    'invites.html',
    `<!DOCTYPE html><html><body><p>Your OpenSquawk invite code: <strong>{{INVITE_CODE}}</strong></p><p><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> from updates</p></body></html>`
  )

  return template
    .replace(/{{INVITE_CODE}}/g, code)
    .replace(/{{UNSUBSCRIBE_URL}}/g, buildUnsubscribeUrl(email))
}

export function renderInvitationText(code: string, email?: string) {
  const lines = [
    'Welcome to OpenSquawk!',
    '',
    'Thanks for joining the waitlist — here is your personal invite code:',
    code,
    '',
    'Use it to register your account:',
    'https://opensquawk.de/login?mode=register',
    '',
    'Blue skies,',
    'Your OpenSquawk crew',
    '',
    'If you would rather not receive emails from us, you can opt out here:',
    buildUnsubscribeUrl(email),
  ]

  return lines.join('\n')
}

export async function renderFeedbackEmail(email?: string) {
  const template = await loadTemplate(
    'feedback',
    'feedback-request.html',
    `<!DOCTYPE html><html><body><p>We'd love your feedback: <a href="https://opensquawk.de/feedback">opensquawk.de/feedback</a></p><p><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> from future emails</p></body></html>`
  )

  return template.replace(/{{UNSUBSCRIBE_URL}}/g, buildUnsubscribeUrl(email))
}

export function renderFeedbackText(email?: string) {
  const lines = [
    'Hi there,',
    '',
    "It's been a little while since we sent your invite, and we would love to hear your thoughts.",
    '',
    'Share your feedback here:',
    'https://opensquawk.de/feedback',
    '',
    'Thank you for helping us improve OpenSquawk!',
    '',
    'If you do not want any more emails, you can unsubscribe here:',
    buildUnsubscribeUrl(email),
  ]

  return lines.join('\n')
}
