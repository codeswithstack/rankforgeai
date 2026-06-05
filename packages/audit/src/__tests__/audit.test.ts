import { describe, it, expect, vi } from 'vitest'
import { AuditEngine, runAudit, AuditReport } from '../audit'

describe('Audit Engine', () => {
  describe('SEO Audits', () => {
    it('flags missing title tag', async () => {
      const html = `<html><head></head><body><h1>Page</h1></body></html>`
      const report = await runAudit({ html, url: 'https://example.com' })
      expect(report.seo).toContainEqual(expect.objectContaining({ rule: 'missing-title', severity: 'error' }))
    })

    it('flags duplicate titles across pages', async () => {
      const pages = [
        { url: 'https://example.com/', html: '<title>Same Title</title>' },
        { url: 'https://example.com/page', html: '<title>Same Title</title>' },
      ]
      const engine = new AuditEngine()
      const report = await engine.auditMultiplePages(pages)
      expect(report.seo).toContainEqual(expect.objectContaining({ rule: 'duplicate-title' }))
    })

    it('flags missing H1', async () => {
      const html = `<html><head><title>Page</title></head><body><h2>Subheading</h2></body></html>`
      const report = await runAudit({ html, url: 'https://example.com' })
      expect(report.seo).toContainEqual(expect.objectContaining({ rule: 'missing-h1' }))
    })

    it('flags multiple H1 tags', async () => {
      const html = `<html><body><h1>First</h1><h1>Second</h1></body></html>`
      const report = await runAudit({ html, url: 'https://example.com' })
      expect(report.seo).toContainEqual(expect.objectContaining({ rule: 'multiple-h1' }))
    })

    it('flags missing meta description', async () => {
      const html = `<html><head><title>Page</title></head><body><h1>H1</h1></body></html>`
      const report = await runAudit({ html, url: 'https://example.com' })
      expect(report.seo).toContainEqual(expect.objectContaining({ rule: 'missing-description' }))
    })

    it('flags canonical pointing to different domain', async () => {
      const html = `<html><head><link rel="canonical" href="https://other.com/page"/></head></html>`
      const report = await runAudit({ html, url: 'https://example.com/page' })
      expect(report.seo).toContainEqual(expect.objectContaining({ rule: 'canonical-cross-domain' }))
    })

    it('passes when all SEO requirements are met', async () => {
      const html = `<html>
        <head>
          <title>Valid Page Title</title>
          <meta name="description" content="A valid description that is long enough."/>
          <link rel="canonical" href="https://example.com/page"/>
        </head>
        <body><h1>Main Heading</h1></body>
      </html>`
      const report = await runAudit({ html, url: 'https://example.com/page' })
      const errors = report.seo.filter(i => i.severity === 'error')
      expect(errors).toHaveLength(0)
    })
  })

  describe('Technical Audits', () => {
    it('validates robots.txt is accessible', async () => {
      const engine = new AuditEngine()
      engine.setFetcher(vi.fn().mockResolvedValue({ status: 404 }))
      const result = await engine.auditRobotsTxt('https://example.com')
      expect(result).toContainEqual(expect.objectContaining({ rule: 'robots-not-found', severity: 'error' }))
    })

    it('validates sitemap.xml is accessible', async () => {
      const engine = new AuditEngine()
      engine.setFetcher(vi.fn().mockResolvedValue({ status: 200, body: '<?xml' }))
      const result = await engine.auditSitemap('https://example.com')
      expect(result).toContainEqual(expect.objectContaining({ rule: 'sitemap-found', severity: 'pass' }))
    })

    it('detects broken internal links', async () => {
      const engine = new AuditEngine()
      const fetcher = vi.fn()
        .mockResolvedValueOnce({ status: 200 })
        .mockResolvedValueOnce({ status: 404 })
      engine.setFetcher(fetcher)
      const result = await engine.auditLinks([
        'https://example.com/working',
        'https://example.com/broken',
      ])
      expect(result).toContainEqual(expect.objectContaining({ rule: 'broken-link', url: 'https://example.com/broken' }))
    })

    it('detects redirect chains', async () => {
      const engine = new AuditEngine()
      const result = await engine.auditRedirectChain([
        { from: 'https://example.com/a', to: 'https://example.com/b', status: 301 },
        { from: 'https://example.com/b', to: 'https://example.com/c', status: 301 },
        { from: 'https://example.com/c', to: 'https://example.com/d', status: 301 },
      ])
      expect(result).toContainEqual(expect.objectContaining({ rule: 'redirect-chain' }))
    })
  })

  describe('Performance Audits', () => {
    it('flags LCP > 2.5s', async () => {
      const report = await runAudit({
        html: '<html><body></body></html>',
        url: 'https://example.com',
        metrics: { lcp: 3000, cls: 0.05, inp: 200, ttfb: 200 },
      })
      expect(report.performance).toContainEqual(expect.objectContaining({ metric: 'LCP', status: 'needs-improvement' }))
    })

    it('flags CLS > 0.1', async () => {
      const report = await runAudit({
        html: '',
        url: 'https://example.com',
        metrics: { lcp: 1000, cls: 0.15, inp: 200, ttfb: 200 },
      })
      expect(report.performance).toContainEqual(expect.objectContaining({ metric: 'CLS', status: 'needs-improvement' }))
    })

    it('passes when all metrics are good', async () => {
      const report = await runAudit({
        html: '',
        url: 'https://example.com',
        metrics: { lcp: 1500, cls: 0.05, inp: 150, ttfb: 150 },
      })
      const failed = report.performance.filter(m => m.status === 'poor')
      expect(failed).toHaveLength(0)
    })
  })

  describe('Security Audits', () => {
    it('detects mixed content (HTTP resources on HTTPS page)', async () => {
      const html = `<html><body><img src="http://example.com/img.jpg"/></body></html>`
      const report = await runAudit({ html, url: 'https://example.com' })
      expect(report.security).toContainEqual(expect.objectContaining({ rule: 'mixed-content' }))
    })

    it('detects missing HTTPS', async () => {
      const report = await runAudit({ html: '<html></html>', url: 'http://example.com' })
      expect(report.security).toContainEqual(expect.objectContaining({ rule: 'not-https' }))
    })
  })

  describe('AuditReport', () => {
    it('calculates overall score', () => {
      const report: AuditReport = {
        seo: [
          { rule: 'missing-title', severity: 'error', score: 0 },
          { rule: 'has-h1', severity: 'pass', score: 10 },
        ],
        performance: [
          { metric: 'LCP', status: 'good', score: 25 },
        ],
        security: [],
        technical: [],
      }
      const engine = new AuditEngine()
      const score = engine.calculateOverallScore(report)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('exports report as JSON', () => {
      const engine = new AuditEngine()
      const report = engine.exportReport({ format: 'json' })
      expect(() => JSON.parse(report)).not.toThrow()
    })
  })
})
