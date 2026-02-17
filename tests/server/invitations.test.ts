import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  generateInvitationCode,
  renderFeedbackEmail,
  renderFeedbackText,
  renderInvitationEmail,
  renderInvitationText,
} from '~~/server/utils/invitations'

describe('invitation utilities', () => {
  it('generates uppercase 8-char hex invitation codes', () => {
    const code = generateInvitationCode()
    assert.match(code, /^[A-F0-9]{8}$/)
  })

  it('renders invitation plain text with code and unsubscribe link', () => {
    const text = renderInvitationText('AB12CD34', 'pilot+test@example.com')

    assert.match(text, /AB12CD34/)
    assert.match(text, /https:\/\/opensquawk\.de\/login\?mode=register/)
    assert.match(text, /unsubscribe\?email=pilot%2Btest%40example\.com/)
  })

  it('renders invitation html and replaces placeholders', async () => {
    const html = await renderInvitationEmail('ZX90PQ12', 'pilot@example.com')

    assert.match(html, /ZX90PQ12/)
    assert.doesNotMatch(html, /{{INVITE_CODE}}/)
    assert.doesNotMatch(html, /{{UNSUBSCRIBE_URL}}/)
    assert.match(html, /unsubscribe\?email=pilot%40example\.com/)
  })

  it('renders feedback variants with unsubscribe link', async () => {
    const html = await renderFeedbackEmail('ops@example.com')
    const text = renderFeedbackText('ops@example.com')

    assert.doesNotMatch(html, /{{UNSUBSCRIBE_URL}}/)
    assert.match(html, /unsubscribe\?email=ops%40example\.com/)
    assert.match(text, /https:\/\/opensquawk\.de\/feedback/)
    assert.match(text, /unsubscribe\?email=ops%40example\.com/)
  })
})
