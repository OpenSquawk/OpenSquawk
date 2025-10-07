import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const REGISTER_URL = 'https://opensquawk.de/login'

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
    const fallback =
      '<!DOCTYPE html><html><body>' +
      '<p>Your OpenSquawk invite code: <strong>{{INVITE_CODE}}</strong></p>' +
      '<p>Register here: <a href="{{INVITE_LINK}}">{{INVITE_LINK}}</a></p>' +
      '</body></html>'
    cachedHtmlTemplate = fallback
    return fallback
  }
}

export function createInvitationLink(code: string, email: string) {
  const params = new URLSearchParams()
  params.set('mode', 'register')
  params.set('invite', code)
  params.set('invitationCode', code)
  params.set('code', code)
  params.set('email', email)

  return `${REGISTER_URL}?${params.toString()}`
}

export async function renderInvitationEmail(code: string, email: string) {
  const template = await loadInvitationTemplate()
  const inviteLink = createInvitationLink(code, email)

  return template
    .replace(/{{INVITE_CODE}}/g, code)
    .replace(/{{INVITE_LINK}}/g, inviteLink)
}

export function renderInvitationText(code: string, email: string) {
  const inviteLink = createInvitationLink(code, email)
  const lines = [
    'Welcome to OpenSquawk!',
    '',
    'Thanks for joining the waitlist — here is your personal invite code:',
    code,
    '',
    'Use it to register your account:',
    inviteLink,
    '',
    'Blue skies,',
    'Your OpenSquawk crew',
  ]

  return lines.join('\n')
}
