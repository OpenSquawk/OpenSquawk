import {
  absoluteSiteUrl,
  DE_FAQ_SCHEMA,
  DEFAULT_OG_IMAGE,
  FAQ_SCHEMA,
  getLanguageAlternates,
  getPublicSeoRoute,
  isNewsArticlePath,
  jsonLd,
  normalizeSeoPath,
  SITE_NAME,
  SOFTWARE_APPLICATION_SCHEMA,
} from '~~/shared/utils/seo'

interface ArticleSeo {
  slug: string
  title: string
  description: string
  publishedAt?: string
}

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const attr = (value: string) => escapeHtml(value)

const frontMatterValue = (content: string, key: string) => {
  const frontMatter = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/)?.[1]
  if (!frontMatter) return undefined

  const line = frontMatter
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}:`))

  return line
    ?.slice(line.indexOf(':') + 1)
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim()
}

const getArticleSeo = async (path: string): Promise<ArticleSeo | null> => {
  const slug = path.split('/').filter(Boolean).at(-1)
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) return null

  const content = await useStorage('assets:news').getItem<string>(`${slug}.md`)
  if (!content) return null

  return {
    slug,
    title: frontMatterValue(content, 'title') || slug,
    description: frontMatterValue(content, 'summary')
      || frontMatterValue(content, 'description')
      || `Product news and updates from ${SITE_NAME}.`,
    publishedAt: frontMatterValue(content, 'date'),
  }
}

const metaName = (name: string, content: string) => `<meta name="${attr(name)}" content="${attr(content)}">`
const metaProperty = (property: string, content: string) => `<meta property="${attr(property)}" content="${attr(content)}">`
const link = (rel: string, href: string, hreflang?: string) => `<link rel="${attr(rel)}" href="${attr(href)}"${hreflang ? ` hreflang="${attr(hreflang)}"` : ''}>`

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', async (html, { event }) => {
    const path = normalizeSeoPath(getRequestURL(event).pathname)
    const seo = getPublicSeoRoute(path)
    const article = isNewsArticlePath(path) ? await getArticleSeo(path) : null
    const indexable = Boolean(seo || article)

    if (!indexable) {
      html.head.push(
        metaName('robots', 'noindex, nofollow'),
        metaName('googlebot', 'noindex, nofollow'),
      )
      return
    }

    const canonical = absoluteSiteUrl(path)
    const title = article ? `${article.title} – OpenSquawk News` : seo!.title
    const description = article?.description || seo!.description
    const image = absoluteSiteUrl(seo?.image || DEFAULT_OG_IMAGE)
    const type = article ? 'article' : 'website'
    const language = seo?.language || 'en'
    const alternates = getLanguageAlternates(path)

    html.htmlAttrs.push(`lang="${language}"`)

    html.head.push(
      `<title>${escapeHtml(title)}</title>`,
      metaName('description', description),
      metaName('robots', 'index, follow, max-image-preview:large'),
      metaName('googlebot', 'index, follow, max-image-preview:large'),
      link('canonical', canonical),
      ...alternates.map(({ hreflang, href }) => link('alternate', href, hreflang)),
      metaProperty('og:site_name', SITE_NAME),
      metaProperty('og:type', type),
      metaProperty('og:title', title),
      metaProperty('og:description', description),
      metaProperty('og:url', canonical),
      metaProperty('og:image', image),
      metaProperty('og:image:width', '1536'),
      metaProperty('og:image:height', '1024'),
      metaProperty('og:image:alt', `${SITE_NAME} flight simulator training`),
      metaProperty('og:locale', language === 'de' ? 'de_DE' : 'en_US'),
      metaName('twitter:card', 'summary_large_image'),
      metaName('twitter:title', title),
      metaName('twitter:description', description),
      metaName('twitter:image', image),
    )

    if (path === '/' || path === '/de') {
      html.head.push(
        `<script type="application/ld+json">${jsonLd(SOFTWARE_APPLICATION_SCHEMA)}</script>`,
        `<script type="application/ld+json">${jsonLd(path === '/de' ? DE_FAQ_SCHEMA : FAQ_SCHEMA)}</script>`,
      )
    }

    if (article) {
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        inLanguage: 'en',
        mainEntityOfPage: canonical,
        image: [image],
        author: { '@type': 'Organization', name: SITE_NAME, url: absoluteSiteUrl('/') },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: absoluteSiteUrl('/'),
          logo: { '@type': 'ImageObject', url: absoluteSiteUrl('/img/icon-lg.jpeg') },
        },
      }

      html.head.push(
        metaProperty('article:published_time', article.publishedAt || ''),
        metaProperty('article:modified_time', article.publishedAt || ''),
        `<script type="application/ld+json">${jsonLd(articleSchema)}</script>`,
      )
    }
  })
})
