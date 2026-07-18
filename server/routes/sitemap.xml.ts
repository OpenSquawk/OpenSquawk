import { PUBLIC_SEO_ROUTES, SITE_URL } from '~~/shared/utils/seo'
import { getLanguageAlternates } from '~~/shared/utils/seo'

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const urlEntry = (options: {
  path: string
  lastmod?: string
  changefreq: string
  priority: number
}) => {
  const lines = [
    '  <url>',
    `    <loc>${escapeXml(new URL(options.path, `${SITE_URL}/`).toString())}</loc>`,
  ]

  if (options.path === '/' || options.path === '/de') {
    for (const alternate of getLanguageAlternates(options.path)) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeXml(alternate.href)}" />`)
    }
  }

  if (options.lastmod) {
    lines.push(`    <lastmod>${escapeXml(options.lastmod)}</lastmod>`)
  }

  lines.push(
    `    <changefreq>${options.changefreq}</changefreq>`,
    `    <priority>${options.priority.toFixed(1)}</priority>`,
    '  </url>',
  )

  return lines.join('\n')
}

const frontMatterDate = (content: string) => {
  const match = content.match(/^---\s*[\r\n]+[\s\S]*?^date:\s*["']?([^"'\r\n]+)["']?\s*$[\s\S]*?^---\s*$/m)
  if (!match?.[1]) return undefined

  const date = new Date(match[1].trim())
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10)
}

export default defineEventHandler(async (event) => {
  const staticEntries = PUBLIC_SEO_ROUTES.map((route) => urlEntry(route))
  const newsStorage = useStorage('assets:news')
  const articleEntries = await Promise.all(
    (await newsStorage.getKeys())
      .filter((key) => key.endsWith('.md'))
      .sort()
      .map(async (key) => {
        const content = await newsStorage.getItem<string>(key) || ''
        const slug = key.split('/').at(-1)?.replace(/\.md$/i, '') || ''
        return urlEntry({
          path: `/news/${slug}`,
          lastmod: frontMatterDate(content),
          changefreq: 'monthly',
          priority: 0.7,
        })
      }),
  )

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...staticEntries,
    ...articleEntries,
    '</urlset>',
    '',
  ].join('\n')
})
