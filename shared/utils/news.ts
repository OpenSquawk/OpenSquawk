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

type ImportMetaWithGlob = ImportMeta & {
  glob: (
    pattern: string,
    options?: {
      query?: string
      import?: string
      eager?: boolean
    }
  ) => Record<string, unknown>
}

const rawNewsModules = (import.meta as ImportMetaWithGlob).glob('~~/content/news/*.md', {
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
  let paraParts: string[] = [] // <-- sammelt Zeilen eines Absatzes

  const closeList = () => { if (inList) { html += '</ul>'; inList = false } }
  const flushPara = () => {
    if (paraParts.length) {
      // Soft line breaks: Zeilen mit zwei Leerzeichen am Ende -> <br>
      const joined = paraParts
          .map(s => s.replace(/ {2}$/, '<br>'))
          .join(' ')
      html += `<p>${formatInline(joined)}</p>`
      paraParts = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/,'') // trailing spaces relevant (2 = <br>), rest säubern
    const trimmed = line.trim()

    // Leere Zeile: Absatz beenden
    if (!trimmed) { flushPara(); closeList(); continue }

    // Horizontal rule
    if (/^ {0,3}(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushPara(); closeList()
      html += '<hr>'
      continue
    }

    // Überschriften
    if (trimmed.startsWith('#')) {
      flushPara(); closeList()
      const level = Math.min(trimmed.match(/^#+/)?.[0].length ?? 1, 6)
      const content = trimmed.replace(/^#+/, '').trim()
      html += `<h${level}>${formatInline(content)}</h${level}>`
      continue
    }

    // Listen
    if (trimmed.startsWith('- ')) {
      flushPara()
      if (!inList) { html += '<ul>'; inList = true }
      html += `<li>${formatInline(trimmed.slice(2).trim())}</li>`
      continue
    }

    // Standard-Text: NICHT sofort <p> erzeugen, sondern sammeln
    paraParts.push(trimmed)
  }

  flushPara()
  closeList()
  return html
}



function formatInline(value: string): string {
  let text = value

  // 2.1 Markdown-Links [label](url) zuerst in echte <a> umwandeln
  text = text.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_m, label, href) => {
    const url = sanitizeUrl(String(href))
    const inner = escapeHtml(String(label))
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${inner}</a>`
  })

  // 2.2 Bereits im Markdown vorhandene <a ...>...</a> erlauben (whitelist & sanitize)
  const placeholders: string[] = []
  text = text.replace(/<a\b[^>]*>.*?<\/a>/gis, (raw) => {
    const safe = sanitizeAnchor(raw)
    placeholders.push(safe)
    return `@@A${placeholders.length - 1}@@`
  })

  // 2.3 Rest escapen
  text = escapeHtml(text)

  // 2.4 Platzhalter zurücksetzen (echte erlaubte <a> bleiben unescaped)
  text = text.replace(/@@A(\d+)@@/g, (_m, i) => placeholders[Number(i)])

  // 2.5 Inline-Code/Bold/Italic nach dem Escaping anwenden
  text = text.replace(/`([^`]+)`/g, (_m, code) => `<code>${String(code)}</code>`)
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  return text
}

// ---- Helpers ----
function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url, 'https://dummy.local') // Basis nötig für relative
    const proto = u.protocol.toLowerCase()
    if (proto === 'http:' || proto === 'https:' || proto === 'mailto:' || proto === 'tel:') {
      return escapeAttribute(url)
    }
  } catch {}
  return '#'
}

function sanitizeAnchor(raw: string): string {
  // href extrahieren
  const hrefMatch = raw.match(/href\s*=\s*"(.*?)"/i) || raw.match(/href\s*=\s*'(.*?)'/i)
  const innerMatch = raw.match(/>([\s\S]*?)<\/a>/i)
  const href = hrefMatch ? sanitizeUrl(hrefMatch[1]) : '#'
  const inner = innerMatch ? escapeHtml(innerMatch[1]) : ''
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-cyan-300 underline">${inner}</a>`
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
