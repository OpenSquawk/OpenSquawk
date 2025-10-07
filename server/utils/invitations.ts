import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

let cachedHtmlTemplate: string | null = null

export function generateInvitationCode() {
  return randomBytes(4).toString('hex').toUpperCase()
}

async function loadInvitationTemplate() {
  if (cachedHtmlTemplate) {
    return cachedHtmlTemplate
  }

  const templatePath = join(process.cwd(), 'public', 'docs', 'invites.html')

  try {
    const file = await readFile(templatePath, 'utf8')
    cachedHtmlTemplate = file
    return file
  } catch (error) {
    console.warn('Could not load invitation email template, falling back to plain HTML.', error)
    const fallback = `<!DOCTYPE html><html><body><p>Your OpenSquawk invite code: <strong>{{INVITE_CODE}}</strong></p></body></html>`
    cachedHtmlTemplate = fallback
    return fallback
  }
}

export async function renderInvitationEmail(code: string) {
  const template = await loadInvitationTemplate()
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
