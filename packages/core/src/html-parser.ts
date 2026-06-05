export interface ParsedDoc {
  title: string | undefined
  rawHTML: string
  querySelector: (selector: string) => Element | null
  querySelectorAll: (selector: string) => Element[]
}

export interface MetaData {
  title?: string
  description?: string
  canonical?: string
  robots?: string
  keywords?: string
  author?: string
  og: {
    title?: string
    description?: string
    image?: string
    url?: string
    type?: string
  }
  twitter: {
    card?: string
    title?: string
    description?: string
    image?: string
  }
}

export interface Heading {
  level: number
  text: string
}

export interface Link {
  href?: string
  text: string
  nofollow: boolean
  type?: 'internal' | 'external'
  rel?: string
}

interface Element {
  tagName: string
  textContent: string
  getAttribute(name: string): string | null
  querySelectorAll(selector: string): Element[]
}

// Lightweight HTML parser using regex-based extraction (no DOM dependency needed)
class SimpleDoc {
  readonly rawHTML: string

  constructor(html: string) {
    this.rawHTML = html
  }

  get title(): string | undefined {
    const match = this.rawHTML.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    return match ? this.decodeEntities(match[1]!.trim()) : undefined
  }

  getAttribute(tag: string, attr: string): string | undefined {
    const re = new RegExp(`<${tag}[^>]+${attr}\\s*=\\s*["']([^"']*?)["']`, 'i')
    const m = this.rawHTML.match(re)
    return m ? m[1] : undefined
  }

  getMeta(name: string): string | undefined {
    const patterns = [
      new RegExp(`<meta[^>]+name\\s*=\\s*["']${name}["'][^>]+content\\s*=\\s*["']([^"']*?)["']`, 'i'),
      new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*?)["'][^>]+name\\s*=\\s*["']${name}["']`, 'i'),
    ]
    for (const re of patterns) {
      const m = this.rawHTML.match(re)
      if (m) return m[1]
    }
    return undefined
  }

  getProperty(property: string): string | undefined {
    const patterns = [
      new RegExp(`<meta[^>]+property\\s*=\\s*["']${property}["'][^>]+content\\s*=\\s*["']([^"']*?)["']`, 'i'),
      new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*?)["'][^>]+property\\s*=\\s*["']${property}["']`, 'i'),
    ]
    for (const re of patterns) {
      const m = this.rawHTML.match(re)
      if (m) return m[1]
    }
    return undefined
  }

  getAll(tagPattern: RegExp): RegExpMatchArray[] {
    const results: RegExpMatchArray[] = []
    let m: RegExpExecArray | null
    const re = new RegExp(tagPattern.source, tagPattern.flags.includes('g') ? tagPattern.flags : tagPattern.flags + 'g')
    while ((m = re.exec(this.rawHTML)) !== null) {
      results.push(m)
    }
    return results
  }

  private decodeEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }
}

export function parseHTML(html: string): SimpleDoc {
  return new SimpleDoc(html)
}

export function extractMeta(doc: SimpleDoc): MetaData {
  return {
    title: doc.title,
    description: doc.getMeta('description'),
    canonical: (() => {
      const m = doc.rawHTML.match(/<link[^>]+rel\s*=\s*["']canonical["'][^>]+href\s*=\s*["']([^"']+)["']/i)
        || doc.rawHTML.match(/<link[^>]+href\s*=\s*["']([^"']+)["'][^>]+rel\s*=\s*["']canonical["']/i)
      return m ? m[1] : undefined
    })(),
    robots: doc.getMeta('robots'),
    keywords: doc.getMeta('keywords'),
    author: doc.getMeta('author'),
    og: {
      title: doc.getProperty('og:title'),
      description: doc.getProperty('og:description'),
      image: doc.getProperty('og:image'),
      url: doc.getProperty('og:url'),
      type: doc.getProperty('og:type'),
    },
    twitter: {
      card: doc.getMeta('twitter:card'),
      title: doc.getMeta('twitter:title'),
      description: doc.getMeta('twitter:description'),
      image: doc.getMeta('twitter:image'),
    },
  }
}

export function extractHeadings(doc: SimpleDoc): Heading[] {
  const headings: Heading[] = []
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi
  let m: RegExpExecArray | null
  const html = doc.rawHTML
  const regex = new RegExp(re.source, 'gi')
  while ((m = regex.exec(html)) !== null) {
    const level = parseInt(m[1]!, 10)
    const text = m[2]!.replace(/<[^>]+>/g, '').trim()
    headings.push({ level, text })
  }
  return headings
}

export function extractLinks(doc: SimpleDoc, baseUrl?: string): Link[] {
  const links: Link[] = []
  const re = /<a([^>]*)>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  const regex = new RegExp(re.source, 'gi')
  while ((m = regex.exec(doc.rawHTML)) !== null) {
    const attrs = m[1]!
    const text = m[2]!.replace(/<[^>]+>/g, '').trim()
    const hrefMatch = attrs.match(/href\s*=\s*["']([^"']*)["']/)
    const relMatch = attrs.match(/rel\s*=\s*["']([^"']*)["']/)
    const href = hrefMatch ? hrefMatch[1] : undefined
    const rel = relMatch ? relMatch[1] : undefined
    const nofollow = rel ? rel.includes('nofollow') : false

    let type: 'internal' | 'external' | undefined
    if (href && baseUrl) {
      try {
        const base = new URL(baseUrl)
        if (href.startsWith('/') || href.startsWith(base.origin)) {
          type = 'internal'
        } else if (href.startsWith('http')) {
          const linkUrl = new URL(href)
          type = linkUrl.hostname === base.hostname ? 'internal' : 'external'
        }
      } catch {}
    }

    links.push({ href, text, nofollow, type, rel })
  }
  return links
}
