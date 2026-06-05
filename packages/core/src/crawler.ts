export interface CrawlOptions {
  baseUrl: string
  maxDepth?: number
  concurrency?: number
  respectRobots?: boolean
  userAgent?: string
}

export interface CrawledPage {
  url: string
  status: number
  html?: string
  depth?: number
}

export interface OrphanResult {
  urls: string[]
}

export interface DuplicateContentResult {
  urls: string[]
  contentHash: string
}

export interface CrawlCallbacks {
  onPage?: (url: string, page?: CrawledPage) => void
  onError?: (url: string, error: Error) => void
}

type Fetcher = (url: string) => Promise<{ html: string; status: number }>

export class CrawlEngine {
  readonly options: Required<CrawlOptions>
  private visited = new Set<string>()
  private fetcher: Fetcher
  private robotsRules: Array<{ pattern: RegExp; allow: boolean }> = []
  private crawlDelay = 0

  constructor(options: CrawlOptions) {
    if (!this.isValidUrl(options.baseUrl)) {
      throw new Error(`Invalid base URL: ${options.baseUrl}`)
    }
    this.options = {
      maxDepth: 5,
      concurrency: 3,
      respectRobots: true,
      userAgent: 'RankForgeBot/1.0',
      ...options,
    }
    const ua = this.options.userAgent
    this.fetcher = async (url: string) => {
      const res = await fetch(url, { headers: { 'User-Agent': ua } })
      return { html: await res.text(), status: res.status }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  setFetcher(fn: Fetcher): void {
    this.fetcher = fn
  }

  normalizeUrl(url: string): string {
    try {
      const u = new URL(url)
      u.hash = ''
      let path = u.pathname
      if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1)
      u.pathname = path
      return u.toString()
    } catch {
      return url
    }
  }

  resolveUrl(path: string): string {
    const base = new URL(this.options.baseUrl)
    return new URL(path, base).toString()
  }

  isInScope(url: string): boolean {
    try {
      const u = new URL(url)
      const base = new URL(this.options.baseUrl)
      return u.hostname === base.hostname
    } catch {
      return false
    }
  }

  shouldCrawl(url: string): boolean {
    const nonHTML = /\.(pdf|png|jpg|jpeg|gif|svg|webp|avif|ico|css|js|json|xml|zip|mp4|mp3|woff|woff2|ttf|eot)(\?.*)?$/i
    try {
      const u = new URL(url)
      return !nonHTML.test(u.pathname)
    } catch {
      return false
    }
  }

  async crawlUrl(url: string): Promise<CrawledPage | null> {
    const normalized = this.normalizeUrl(url)
    if (this.visited.has(normalized)) return null
    this.visited.add(normalized)
    const result = await this.fetcher(normalized)
    return { url: normalized, ...result }
  }

  async crawl(callbacks: CrawlCallbacks = {}): Promise<void> {
    const queue: Array<{ url: string; depth: number }> = [
      { url: this.normalizeUrl(this.options.baseUrl), depth: 0 },
    ]
    while (queue.length > 0) {
      const item = queue.shift()!
      if (item.depth > this.options.maxDepth) continue
      const page = await this.crawlUrl(item.url)
      if (page && callbacks.onPage) {
        callbacks.onPage(page.url, page)
      }
    }
  }

  detectOrphanPages(linkMap: Map<string, string[]>): string[] {
    const allPages = Array.from(linkMap.keys())
    const linkedPages = new Set<string>()

    for (const [from, links] of linkMap) {
      for (const link of links) {
        if (link !== from) linkedPages.add(link)
      }
    }

    return allPages.filter(page => {
      const isRoot = page === this.normalizeUrl(this.options.baseUrl)
      return !isRoot && !linkedPages.has(page)
    })
  }

  detectDuplicateContent(pages: Array<{ url: string; contentHash: string }>): DuplicateContentResult[] {
    const hashMap = new Map<string, string[]>()
    for (const page of pages) {
      const existing = hashMap.get(page.contentHash) || []
      existing.push(page.url)
      hashMap.set(page.contentHash, existing)
    }
    const results: DuplicateContentResult[] = []
    for (const [hash, urls] of hashMap) {
      if (urls.length > 1) {
        results.push({ urls, contentHash: hash })
      }
    }
    return results
  }

  setRobotsTxt(content: string): void {
    this.robotsRules = []
    this.crawlDelay = 0
    const lines = content.split('\n').map(l => l.trim())
    let inRelevantBlock = false

    for (const line of lines) {
      if (line.toLowerCase().startsWith('user-agent:')) {
        const agent = line.slice(11).trim()
        inRelevantBlock = agent === '*' || agent.toLowerCase() === 'rankforgebot'
      } else if (inRelevantBlock) {
        if (line.toLowerCase().startsWith('disallow:')) {
          const path = line.slice(9).trim()
          if (path) {
            const escaped = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
            this.robotsRules.push({ pattern: new RegExp(`^${escaped}`), allow: false })
          }
        } else if (line.toLowerCase().startsWith('allow:')) {
          const path = line.slice(6).trim()
          if (path) {
            const escaped = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
            this.robotsRules.push({ pattern: new RegExp(`^${escaped}`), allow: true })
          }
        } else if (line.toLowerCase().startsWith('crawl-delay:')) {
          this.crawlDelay = parseFloat(line.slice(12).trim()) * 1000
        }
      }
    }
  }

  isAllowedByRobots(url: string): boolean {
    try {
      const path = new URL(url).pathname
      for (const rule of [...this.robotsRules].reverse()) {
        if (rule.pattern.test(path)) return rule.allow
      }
      return true
    } catch {
      return true
    }
  }

  getCrawlDelay(): number {
    return this.crawlDelay
  }
}
