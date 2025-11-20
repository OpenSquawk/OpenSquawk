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

export async function renderInvitationEmail(code: string) {
  const template = await loadTemplate(
    'invitations',
    'invites.html',
    `<!DOCTYPE html><html><body><p>Your OpenSquawk invite code: <strong>{{INVITE_CODE}}</strong></p></body></html>`
  )

  return template.replace(/{{INVITE_CODE}}/g, code)
}

export function renderInvitationText(code: string) {
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
  ]

  return lines.join('\n')
}

export async function renderFeedbackEmail() {
  const template = await loadTemplate(
    'feedback',
    'feedback-request.html',
    `<!DOCTYPE html><html><body><p>We'd love your feedback: <a href="https://opensquawk.de/feedback">opensquawk.de/feedback</a></p></body></html>`
  )

  return template
}

export function renderFeedbackText() {
  const lines = [
    'Hi there,',
    '',
    "It's been a little while since we sent your invite, and we would love to hear your thoughts.",
    '',
    'Share your feedback here:',
    'https://opensquawk.de/feedback',
    '',
    'Thank you for helping us improve OpenSquawk!',
  ]

  return lines.join('\n')
}
