import { SITE_URL } from '~~/shared/utils/seo'

const DISALLOWED_PATHS = [
  '/app',
  '/admin',
  '/bridge/connect',
  '/classroom',
  '/classroom-introduction',
  '/copilot',
  '/dev-login',
  '/editor',
  '/flightlab',
  '/forgot-password',
  '/invite',
  '/live-atc',
  '/login',
  '/logout',
  '/pilot-profile-setup',
  '/pm',
  '/present',
  '/start',
  '/unsubscribe',
]

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  return [
    'User-agent: *',
    'Allow: /',
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n')
})
