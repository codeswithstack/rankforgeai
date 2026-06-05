import { describe, it, expect } from 'vitest'
import {
  Core,
  Meta,
  Schema,
  Sitemap,
  I18n,
  Performance,
  Hydration,
  Audit,
  Images,
  Monitor,
  Security,
  AI,
  Analytics,
  Edge,
  CLI,
} from '../index'

describe('rankforge (combined package)', () => {
  it('Core — parses HTML and extracts meta', () => {
    const doc = Core.parseHTML('<html><head><title>Test</title></head><body><h1>Hi</h1></body></html>')
    const meta = Core.extractMeta(doc)
    expect(meta.title).toBe('Test')
    const headings = Core.extractHeadings(doc)
    expect(headings[0]?.text).toBe('Hi')
  })

  it('Meta — generates and validates meta tags', () => {
    const meta = Meta.generateMeta({ title: 'RankForge', url: 'https://example.com' })
    expect(meta.canonical).toBe('https://example.com')
    const issues = Meta.validateMeta({ title: 'Hi' })
    expect(issues.some((i: { type: string }) => i.type === 'too-short')).toBe(true)
  })

  it('Schema — generates article schema', () => {
    const schema = Schema.generateArticleSchema({
      headline: 'SEO Tips',
      author: { name: 'Jane' },
      datePublished: '2024-01-01',
    })
    expect(schema['@type']).toBe('Article')
    const tag = Schema.renderSchemaTag(schema)
    expect(tag).toContain('<script type="application/ld+json">')
  })

  it('Sitemap — generates valid XML', () => {
    const xml = Sitemap.generateSitemap([
      { url: 'https://example.com/', changefreq: 'daily', priority: 1.0 },
    ])
    expect(xml).toContain('<urlset')
    expect(xml).toContain('https://example.com/')
    const result = Sitemap.validateSitemap(xml)
    expect(result.isValid).toBe(true)
  })

  it('I18n — generates hreflang tags with x-default', () => {
    const tags = I18n.generateHreflang([
      { locale: 'en', url: 'https://example.com/en', isDefault: true },
      { locale: 'ta', url: 'https://example.com/ta' },
    ])
    const hreflangs = (tags as Array<{ hreflang: string }>).map(t => t.hreflang)
    expect(hreflangs).toContain('x-default')
    expect(hreflangs).toContain('en')
    expect(hreflangs).toContain('ta')
  })

  it('Performance — scores LCP, CLS, INP, TTFB', () => {
    expect(Performance.calculateLCPScore(1000)).toBe(100)
    expect(Performance.calculateCLSScore(0)).toBe(100)
    expect(Performance.calculateINPScore(150)).toBe(100)
    expect(Performance.calculateTTFBScore(80)).toBe(100)
    expect(Performance.calculateLCPScore(7000)).toBe(0)
  })

  it('Hydration — detects mismatches', () => {
    const result = Hydration.detectHydrationMismatches(
      '<div class="server">Hello</div>',
      '<div class="client">Hello</div>',
    )
    expect(result.hasMismatches).toBe(true)
    expect(result.mismatches[0]?.type).toBe('attribute')
  })

  it('Audit — runs single page audit', async () => {
    const report = await Audit.runAudit({
      url: 'https://example.com',
      html: '<html><head><title>Test Page Title Here</title><meta name="description" content="A good description for this test page that is long enough." /></head><body><h1>Hello</h1></body></html>',
    })
    expect(report.seo).toBeDefined()
    expect(report.performance).toBeDefined()
  })

  it('Images — detects missing alt', () => {
    const issues = Images.detectImageIssues([
      { src: '/hero.jpg', alt: undefined },
    ])
    expect(issues[0]?.type).toBe('missing-alt')
    const sizes = Images.generateResponsiveSizes(1920)
    expect(sizes).toContain(320)
    expect(sizes).toContain(1920)
  })

  it('Monitor — records RUM and evaluates alerts', () => {
    const rum = new Monitor.RUMCollector()
    rum.record({ type: 'LCP', value: 2000, url: 'https://example.com' })
    const metrics = rum.getMetrics('https://example.com')
    expect(metrics.LCP?.count).toBe(1)

    const alerts = new Monitor.AlertEngine({
      thresholds: { LCP: { warning: 2500, critical: 4000 } },
    })
    const alert = alerts.evaluate({ metric: 'LCP', value: 5000 })
    expect(alert?.severity).toBe('critical')
  })

  it('Security — detects cloaking and filters bots', () => {
    const result = Security.detectCloaking(
      '<html><body>casino pills viagra</body></html>',
      '<html><body>welcome to our health blog</body></html>',
    )
    expect(result.isCloaking).toBe(true)

    const bot = Security.filterBots('Googlebot/2.1')
    expect(bot.isBot).toBe(true)
    expect(bot.botType).toBe('googlebot')
  })

  it('AI — exports all classes', () => {
    expect(AI.AIMetaGenerator).toBeDefined()
    expect(AI.AILinkSuggester).toBeDefined()
    expect(AI.AIContentAnalyzer).toBeDefined()
    expect(AI.AIFixGenerator).toBeDefined()
    expect(AI.AICopilot).toBeDefined()
  })

  it('Analytics — tracks keywords and trends', () => {
    const tracker = new Analytics.KeywordTracker()
    tracker.record({ keyword: 'seo tool', rank: 5, date: '2024-01-01' })
    tracker.record({ keyword: 'seo tool', rank: 3, date: '2024-02-01' })
    const trend = tracker.getTrend('seo tool')
    expect(trend.direction).toBe('up')

    const trends = new Analytics.RankingTrends([
      { keyword: 'seo tool', rank: 3 },
      { keyword: 'web vitals', rank: 1 },
    ])
    expect(trends.percentageInTop10()).toBe(100)
  })

  it('Edge — generates CDN cache headers', () => {
    const headers = Edge.generateCDNCacheHeaders({ pageType: 'static', ttl: 86400 })
    expect(headers['Cache-Control']).toContain('max-age=86400')

    const geoResult = Edge.detectGeoSEO({ targetRegions: ['US', 'IN'], hasHreflang: false })
    expect(geoResult.issues.length).toBeGreaterThan(0)
  })

  it('CLI — exports RankForgeCLI class', async () => {
    const fs = new CLI.MockFileSystem()
    const output: string[] = []
    const cli = new CLI.RankForgeCLI({
      fs,
      stdout: (msg: string) => output.push(msg),
      stderr: () => {},
    })
    await cli.run(['--version'])
    expect(output[0]).toMatch(/\d+\.\d+\.\d+/)
  })
})
