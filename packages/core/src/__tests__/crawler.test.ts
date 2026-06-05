import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CrawlEngine, CrawlOptions } from '../crawler'

describe('CrawlEngine', () => {
  let crawler: CrawlEngine

  beforeEach(() => {
    crawler = new CrawlEngine({ baseUrl: 'https://example.com', maxDepth: 3 })
  })

  describe('initialization', () => {
    it('initializes with default options', () => {
      const c = new CrawlEngine({ baseUrl: 'https://example.com' })
      expect(c.options.maxDepth).toBe(5)
      expect(c.options.concurrency).toBe(3)
      expect(c.options.respectRobots).toBe(true)
    })

    it('accepts custom options', () => {
      const c = new CrawlEngine({ baseUrl: 'https://example.com', maxDepth: 2, concurrency: 5 })
      expect(c.options.maxDepth).toBe(2)
      expect(c.options.concurrency).toBe(5)
    })

    it('throws on invalid base URL', () => {
      expect(() => new CrawlEngine({ baseUrl: 'not-a-url' })).toThrow()
    })
  })

  describe('URL normalization', () => {
    it('normalizes trailing slash URLs', () => {
      expect(crawler.normalizeUrl('https://example.com/page/')).toBe('https://example.com/page')
    })

    it('removes hash fragments', () => {
      expect(crawler.normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page')
    })

    it('resolves relative URLs against base', () => {
      expect(crawler.resolveUrl('/about')).toBe('https://example.com/about')
    })

    it('ignores external URLs for crawling', () => {
      expect(crawler.isInScope('https://other.com/page')).toBe(false)
      expect(crawler.isInScope('https://example.com/page')).toBe(true)
    })

    it('ignores non-HTML resources', () => {
      expect(crawler.shouldCrawl('https://example.com/file.pdf')).toBe(false)
      expect(crawler.shouldCrawl('https://example.com/image.png')).toBe(false)
      expect(crawler.shouldCrawl('https://example.com/page')).toBe(true)
    })
  })

  describe('duplicate detection', () => {
    it('does not crawl same URL twice', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ html: '<html></html>', status: 200 })
      crawler.setFetcher(fetchMock)
      await crawler.crawlUrl('https://example.com/page')
      await crawler.crawlUrl('https://example.com/page')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('depth control', () => {
    it('stops crawling beyond maxDepth', async () => {
      const c = new CrawlEngine({ baseUrl: 'https://example.com', maxDepth: 1 })
      const visited: string[] = []
      // depth 0 = root, depth 1 = one level down, should not go deeper
      await c.crawl({ onPage: (url) => visited.push(url) })
      const maxDepthExceeded = visited.some(url => url.split('/').length > 4)
      expect(maxDepthExceeded).toBe(false)
    })
  })

  describe('orphan page detection', () => {
    it('detects pages not linked from anywhere', () => {
      const pages = new Map([
        ['https://example.com/', ['https://example.com/about']],
        ['https://example.com/about', []],
        ['https://example.com/orphan', []],
      ])
      const orphans = crawler.detectOrphanPages(pages)
      expect(orphans).toContain('https://example.com/orphan')
      expect(orphans).not.toContain('https://example.com/about')
    })
  })

  describe('duplicate content detection', () => {
    it('flags pages with identical content', () => {
      const pages = [
        { url: 'https://example.com/page1', contentHash: 'abc123' },
        { url: 'https://example.com/page2', contentHash: 'abc123' },
        { url: 'https://example.com/page3', contentHash: 'xyz789' },
      ]
      const duplicates = crawler.detectDuplicateContent(pages)
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].urls).toContain('https://example.com/page1')
      expect(duplicates[0].urls).toContain('https://example.com/page2')
    })
  })

  describe('robots.txt', () => {
    it('respects disallow rules', async () => {
      crawler.setRobotsTxt(`
        User-agent: *
        Disallow: /private/
      `)
      expect(crawler.isAllowedByRobots('https://example.com/private/page')).toBe(false)
      expect(crawler.isAllowedByRobots('https://example.com/public/page')).toBe(true)
    })

    it('respects crawl-delay directive', () => {
      crawler.setRobotsTxt(`
        User-agent: *
        Crawl-delay: 2
      `)
      expect(crawler.getCrawlDelay()).toBe(2000)
    })
  })
})
