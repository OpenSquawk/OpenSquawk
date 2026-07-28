import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { buildIssuerLoginUrl, stripSsoCode } from '~~/shared/utils/ssoHandoff'

const ISSUER = 'https://opensquawk.de'
const ORIGIN = 'https://app.opensquawk.de'

function redirectParam(url: string): string {
  return new URL(url).searchParams.get('redirect') || ''
}

describe('SSO handoff URL', () => {
  it('sends the issuer to /auth/callback, not to the page the user wanted', () => {
    // The redirect loop: the issuer appends ?code= to whatever it is handed,
    // and only /auth/callback redeems it. Handing it '/' left the code unread
    // and the guard bounced straight back for another one.
    const url = buildIssuerLoginUrl(ISSUER, ORIGIN, '/')
    const target = new URL(redirectParam(url))

    assert.equal(target.origin, ORIGIN)
    assert.equal(target.pathname, '/auth/callback')
  })

  it('carries the wanted page along so the callback can finish the trip', () => {
    const url = buildIssuerLoginUrl(ISSUER, ORIGIN, '/classroom?lesson=3')
    const target = new URL(redirectParam(url))

    assert.equal(target.searchParams.get('redirect'), '/classroom?lesson=3')
  })

  it('points at the issuer login page and encodes the target as one parameter', () => {
    const url = buildIssuerLoginUrl(ISSUER, ORIGIN, '/live-atc')

    assert.ok(url.startsWith('https://opensquawk.de/login?redirect='))
    // Exactly one query parameter — an unencoded '?' in the value would split
    // the target into a second parameter and lose it.
    assert.deepEqual([...new URL(url).searchParams.keys()], ['redirect'])
  })

  it('tolerates a trailing slash on the issuer', () => {
    const url = buildIssuerLoginUrl('https://opensquawk.de/', ORIGIN, '/')
    assert.ok(url.startsWith('https://opensquawk.de/login?'))
  })

  it('does not carry a spent code back to the issuer', () => {
    const url = buildIssuerLoginUrl(ISSUER, ORIGIN, '/?code=already-used')
    const target = new URL(redirectParam(url))

    assert.equal(target.searchParams.get('redirect'), '/')
  })

  it('treats an empty target as the front page', () => {
    const target = new URL(redirectParam(buildIssuerLoginUrl(ISSUER, ORIGIN, '')))
    assert.equal(target.searchParams.get('redirect'), '/')
  })

  it('leaves other query parameters alone when stripping the code', () => {
    assert.equal(stripSsoCode('/classroom?lesson=3&code=x', ORIGIN), '/classroom?lesson=3')
    assert.equal(stripSsoCode('/classroom?lesson=3', ORIGIN), '/classroom?lesson=3')
  })
})
