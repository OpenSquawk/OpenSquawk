export interface NewsPost {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  body: string
  html: string
  readingTime: string
}

interface FrontMatter {
  title?: string
  date?: string
  summary?: string
  excerpt?: string
  description?: string
  readingTime?: string
}

const rawNewsModules = import.meta.glob('~~/content/news/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const parsedNews: NewsPost[] = Object.entries(rawNewsModules)
  .map(([path, raw]) => parseNewsFile(path, raw))
  .filter((entry): entry is NewsPost => Boolean(entry))
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

export function getAllNews(): NewsPost[] {
  return parsedNews.map((post) => ({ ...post }))
}

export function getNewsBySlug(slug: string): NewsPost | null {
  const found = parsedNews.find((post) => post.slug === slug)
  return found ? { ...found } : null
}

function parseNewsFile(path: string, raw: string): NewsPost | null {
  if (!raw) {
    return null
  }

  const { body, attributes } = extractFrontMatter(raw)
  const slug = extractSlug(path)
  const title = attributes.title?.trim() || toTitleFromSlug(slug)
  const publishedAt = parseDate(attributes.date) || new Date().toISOString()
  const cleanBody = body.trim()
  const excerptSource = attributes.summary || attributes.excerpt || attributes.description || ''
  const excerpt = truncateText(excerptSource || firstParagraph(cleanBody), 220)
  const html = markdownToHtml(cleanBody)
  const readingTime = attributes.readingTime || formatReadingTime(cleanBody)

  return {
    slug,
    title,
    excerpt,
    publishedAt,
    body: cleanBody,
    html,
    readingTime,
  }
}

function extractFrontMatter(raw: string): { body: string; attributes: FrontMatter } {
  const FRONT_MATTER_REGEX = /^---\n([\s\S]*?)\n---\n?/
  const match = raw.match(FRONT_MATTER_REGEX)
  if (!match) {
    return { body: raw, attributes: {} }
  }
  const [, frontMatter] = match
  const rest = raw.slice(match[0].length)
  return { body: rest, attributes: parseFrontMatter(frontMatter) }
}

function parseFrontMatter(source: string): FrontMatter {
  const attributes: Record<string, string> = {}
  const lines = source.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue
    const key = trimmed.slice(0, colonIndex).trim()
    const rawValue = trimmed.slice(colonIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '').trim()
    if (key) {
      attributes[key] = value
    }
  }
  return attributes
}

function extractSlug(path: string): string {
  const normalized = path.replace(/\\/g, '/').split('/')
  const file = normalized[normalized.length - 1] || ''
  return file.replace(/\.md$/i, '')
}

function toTitleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function parseDate(value?: string): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.toISOString()
}

function firstParagraph(body: string): string {
  const lines = body.split(/\r?\n/)
  const collected: string[] = []
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      if (collected.length) break
      continue
    }
    if (line.startsWith('#') || line.startsWith('- ')) {
      if (collected.length) break
      continue
    }
    collected.push(line)
    if (line.endsWith('.')) break
  }
  return collected.join(' ')
}

function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`
}

function formatReadingTime(content: string): string {
  const words = content.split(/\s+/).filter(Boolean)
  const minutes = Math.max(1, Math.round(words.length / 180))
  return `${minutes} min read`
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/)
  let html = ''
  let inList = false

  const closeList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      closeList()
      continue
    }
    if (line.startsWith('#')) {
      closeList()
      const level = Math.min(line.match(/^#+/)?.[0].length ?? 1, 6)
      const content = line.replace(/^#+/, '').trim()
      html += `<h${level}>${formatInline(content)}</h${level}>`
      continue
    }
    if (line.startsWith('- ')) {
      if (!inList) {
        html += '<ul>'
        inList = true
      }
      html += `<li>${formatInline(line.slice(2).trim())}</li>`
      continue
    }
    closeList()
    html += `<p>${formatInline(line)}</p>`
  }

  closeList()
  return html
}

function formatInline(value: string): string {
  let text = escapeHtml(value)
  text = text.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_match, label, href) => {
    const url = escapeAttribute(String(href))
    return `<a href="${url}" class="text-cyan-300 underline">${String(label)}</a>`
  })
  text = text.replace(/`([^`]+)`/g, (_match, code) => `<code>${String(code)}</code>`)
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return text
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case '\'':
        return '&#39;'
      default:
        return char
    }
  })
}

function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case '\'':
        return '&#39;'
      default:
        return char
    }
  })
}
