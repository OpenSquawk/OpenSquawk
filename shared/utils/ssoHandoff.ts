/**
 * Builds the URL that sends an unauthenticated visitor to the SSO issuer.
 *
 * The one rule that matters: the issuer appends `?code=` to whatever URL it is
 * handed, and only `/auth/callback` redeems that code. Handing it the page the
 * user actually wanted leaves the code unread in the address bar — the auth
 * guard then bounces back to the issuer for a fresh one, and the browser ping
 * pongs between the two hosts forever.
 */

/**
 * Drops a `code` already present in a path. Codes are single-use, so carrying
 * a spent one through the round trip can only produce a redemption error on
 * the far side.
 */
export function stripSsoCode(path: string, origin: string): string {
  if (!path.includes('code=')) return path
  const url = new URL(path, origin)
  url.searchParams.delete('code')
  return `${url.pathname}${url.search}${url.hash}`
}

/**
 * @param issuer the website origin, without a trailing slash
 * @param origin this app's own origin
 * @param target the in-app path the visitor was trying to reach
 */
export function buildIssuerLoginUrl(issuer: string, origin: string, target: string): string {
  const callback = new URL('/auth/callback', origin)
  callback.searchParams.set('redirect', stripSsoCode(target || '/', origin))
  return `${issuer.replace(/\/+$/, '')}/login?redirect=${encodeURIComponent(callback.toString())}`
}
